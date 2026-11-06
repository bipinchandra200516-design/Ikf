import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import xlsx from 'xlsx';
import AdmZip from 'adm-zip';
import { parseVehicleDescription } from './excel_importer.js';
import { CATEGORY_FALLBACK_IMAGES } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'autohub_db.json');
const EXCEL_PATH = path.join(__dirname, 'Slae Data Oct 24th.xlsx');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const VEHICLES_UPLOADS_DIR = path.join(UPLOADS_DIR, 'vehicles');

if (!fs.existsSync(VEHICLES_UPLOADS_DIR)) {
  fs.mkdirSync(VEHICLES_UPLOADS_DIR, { recursive: true });
}

function downloadZipBuffer(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (!url || !url.startsWith('http')) {
      return reject(new Error('Invalid URL'));
    }
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: timeoutMs, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        return downloadZipBuffer(res.headers.location, timeoutMs).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

async function runImport() {
  console.log('=== Starting IKF Vehicle Data & Images Import ===');
  console.log('Reading Excel from:', EXCEL_PATH);

  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`Excel file not found at ${EXCEL_PATH}`);
  }

  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rawRows.length < 2) {
    throw new Error('Spreadsheet has no data rows');
  }

  const headers = rawRows[0];
  console.log('Detected headers:', headers);

  const dataRows = rawRows.slice(1).filter(r => r[0] || r[1] || r[7]);
  console.log(`Found ${dataRows.length} data rows`);

  // Load existing DB
  let dbData = { settings: {}, status_mappings: [], admin_users: [], vehicles: [], vehicle_images: [], import_history: [], enquiries: [] };
  if (fs.existsSync(DB_FILE)) {
    try {
      dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
      console.warn('Failed to parse existing DB, using clean structure');
    }
  }

  // Update IKF branding settings
  dbData.settings = {
    ...dbData.settings,
    brand_name: 'IKF',
    tagline: 'IKF Vehicle Finance — Multi-Category Vehicle Marketplace',
    phone: '1800-309-3090',
    whatsapp_number: '919705305477',
    email: 'contact@ikffinance.com',
    address: 'IKF Finance Ltd, Pan-India Yard & Branch Network',
    default_price_label: 'Base Asking Price',
    public_show_registration: true,
    public_show_yard_name: true,
    hero_headline: 'Certified Pre-Owned & Commercial Vehicle Inventory',
    hero_subtext: 'Direct yard purchases and transparent bidding powered by IKF Vehicle Finance.'
  };

  const newVehicles = [];
  const newVehicleImages = [];
  let downloadedCount = 0;
  let fallbackCount = 0;

  for (let idx = 0; idx < dataRows.length; idx++) {
    const row = dataRows[idx];
    const loanBranch = String(row[0] || '').trim();
    const loanId = String(row[1] || '').trim();
    const customerName = String(row[2] || '').trim();
    const agingDays = parseInt(row[3], 10) || 0;
    const soldData = String(row[4] || '').trim();
    const rawPrice = row[5];
    const category = String(row[6] || 'Own Car').trim();
    const vehicleNo = String(row[7] || '').trim();
    const yom = parseInt(row[8], 10) || new Date().getFullYear();
    const makeDesc = String(row[9] || '').trim();
    const chasisNumber = String(row[10] || '').trim();
    const engineNumber = String(row[11] || '').trim();
    const picUrl = String(row[12] || '').trim();
    const seizedOn = row[13];
    const yardContactNo = String(row[14] || '').trim();
    const yardName = String(row[15] || '').trim();

    // Check sold data: Only show if "sale" is mentioned
    const isSale = soldData.toLowerCase().includes('sale');
    const pubStatus = isSale ? 'published' : 'unpublished';
    const availStatus = isSale ? 'available' : 'sold';

    const parsedPrice = parseFloat(String(rawPrice).replace(/[^\d.]/g, '')) || 0;
    const basePrice = Math.round(parsedPrice);

    const parsedDesc = parseVehicleDescription(makeDesc);
    const vehicleId = `ikf-veh-${loanId || (idx + 1).toString().padStart(3, '0')}`;

    console.log(`\n[${idx + 1}/${dataRows.length}] Processing ${vehicleId}: ${vehicleNo} (${makeDesc}) | Sold: "${soldData}" -> ${pubStatus}`);

    // Create vehicle entry
    const vehicleObj = {
      id: vehicleId,
      source_system: 'EXCEL_IMPORT',
      source_record_id: `ROW-${idx + 2}`,
      source_loan_id: loanId,
      vehicle_category: category,
      registration_number: vehicleNo,
      manufacturing_year: yom,
      original_vehicle_description: makeDesc,
      make: parsedDesc.make || category,
      model: parsedDesc.model || makeDesc,
      variant: parsedDesc.variant || '',
      source_price: basePrice,
      public_listing_price: basePrice,
      public_price_label: 'Base Asking Price',
      branch_location: loanBranch || 'Head Office',
      yard_name: yardName || `${loanBranch} Designated Yard`,
      internal_yard_contact: yardContactNo || '1800-309-3090',
      internal_customer_name: customerName,
      internal_aging_days: agingDays,
      internal_chassis_number: chasisNumber,
      internal_engine_number: engineNumber,
      source_sale_status: soldData,
      source_image_url: picUrl,
      internal_seized_on: seizedOn ? String(seizedOn) : null,
      publication_status: pubStatus,
      availability_status: availStatus,
      public_description: `Certified ${yom} ${parsedDesc.make || ''} ${parsedDesc.model || makeDesc} available for bidding and purchase at IKF ${loanBranch} branch / ${yardName || 'designated yard'}. Verified chassis: ${chasisNumber || 'Available upon inspection'}.`,
      created_at: new Date(Date.now() - (dataRows.length - idx) * 3600000).toISOString(),
      updated_at: new Date().toISOString()
    };

    newVehicles.push(vehicleObj);

    // Download & unpack images if PIC URL is present
    let imagesAdded = 0;
    if (picUrl && picUrl.startsWith('http')) {
      const vehDir = path.join(VEHICLES_UPLOADS_DIR, vehicleId);
      if (!fs.existsSync(vehDir)) {
        fs.mkdirSync(vehDir, { recursive: true });
      }

      try {
        console.log(`  Downloading images zip from: ${picUrl.substring(0, 60)}...`);
        const zipBuf = await downloadZipBuffer(picUrl, 12000);
        const zip = new AdmZip(zipBuf);
        const entries = zip.getEntries().filter(e => !e.isDirectory && /\.(jpe?g|png|webp)$/i.test(e.entryName));

        if (entries.length > 0) {
          console.log(`  Extracted ${entries.length} images from zip!`);

          // Sort entries to put hero angles first: cover, right_side, left_side, rear
          const priorityScore = (name) => {
            const n = name.toLowerCase();
            if (n.includes('cover') || n.includes('front')) return 100;
            if (n.includes('right_side') || n.includes('rightside')) return 90;
            if (n.includes('left_side') || n.includes('leftside')) return 80;
            if (n.includes('rear') || n.includes('back')) return 70;
            if (n.includes('interior1') || n.includes('dashboard')) return 60;
            if (n.includes('interior')) return 50;
            if (n.includes('engine')) return 40;
            if (n.includes('chassis')) return 30;
            return 10;
          };

          entries.sort((a, b) => priorityScore(b.entryName) - priorityScore(a.entryName));

          // Save up to 12 best photos
          const selected = entries.slice(0, 12);
          selected.forEach((entry, imgIdx) => {
            const ext = path.extname(entry.entryName).toLowerCase() || '.jpg';
            const safeName = `photo-${imgIdx + 1}${ext}`;
            const targetPath = path.join(vehDir, safeName);
            fs.writeFileSync(targetPath, entry.getData());

            const publicUrl = `/uploads/vehicles/${vehicleId}/${safeName}`;
            newVehicleImages.push({
              id: `img-${vehicleId}-${imgIdx + 1}`,
              vehicle_id: vehicleId,
              image_url: publicUrl,
              is_primary: imgIdx === 0 ? 1 : 0,
              display_order: imgIdx + 1,
              source_url: picUrl,
              created_at: new Date().toISOString()
            });
            imagesAdded++;
          });

          downloadedCount++;
        }
      } catch (err) {
        console.warn(`  Warning: Could not download zip for ${vehicleId}: ${err.message}`);
      }
    }

    // Fallback if no images downloaded
    if (imagesAdded === 0) {
      console.log(`  Using high-res category fallback images for ${category}`);
      const fallbacks = CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES['Own Car'] || [];
      fallbacks.forEach((url, fIdx) => {
        newVehicleImages.push({
          id: `img-${vehicleId}-fb-${fIdx + 1}`,
          vehicle_id: vehicleId,
          image_url: url,
          is_primary: fIdx === 0 ? 1 : 0,
          display_order: fIdx + 1,
          source_url: 'fallback',
          created_at: new Date().toISOString()
        });
      });
      fallbackCount++;
    }
  }

  // Save to database
  dbData.vehicles = newVehicles;
  dbData.vehicle_images = newVehicleImages;

  // Add import history
  dbData.import_history.unshift({
    id: `imp-${Date.now()}`,
    filename: 'Slae Data Oct 24th.xlsx',
    upload_date: new Date().toISOString(),
    admin_user: 'admin@ikffinance.com',
    total_rows: dataRows.length,
    added_records: newVehicles.length,
    updated_records: 0,
    skipped_records: 0,
    failed_records: 0,
    status: 'success',
    details: {
      published_for_sale: newVehicles.filter(v => v.publication_status === 'published').length,
      unpublished_non_sale: newVehicles.filter(v => v.publication_status === 'unpublished').length,
      downloaded_image_sets: downloadedCount,
      fallback_image_sets: fallbackCount
    }
  });

  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(dbData, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);

  console.log('\n=== Import Complete Successfully ===');
  console.log(`Total vehicles imported: ${newVehicles.length}`);
  console.log(`Vehicles published (Sale status): ${newVehicles.filter(v => v.publication_status === 'published').length}`);
  console.log(`Vehicles unpublished (Non-sale): ${newVehicles.filter(v => v.publication_status === 'unpublished').length}`);
  console.log(`Downloaded real photo inspection sets: ${downloadedCount}`);
  console.log(`Fallback photo sets: ${fallbackCount}`);
  console.log(`Total images saved: ${newVehicleImages.length}`);
}

runImport().catch(err => {
  console.error('Import failed with error:', err);
  process.exit(1);
});
