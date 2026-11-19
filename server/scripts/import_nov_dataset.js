import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import xlsx from 'xlsx';
import AdmZip from 'adm-zip';
import { parseVehicleDescription } from '../excel_importer.js';
import { CATEGORY_FALLBACK_IMAGES } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'autohub_db.json');
const EXCEL_PATH = 'C:/Users/Bipin Chandra/.gemini/antigravity/brain/32b61dca-e883-44f1-bddf-f801ecf36164/.user_uploaded/media_1795094028650_a92c9658.xlsx';
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const VEHICLES_UPLOADS_DIR = path.join(UPLOADS_DIR, 'vehicles');

if (!fs.existsSync(VEHICLES_UPLOADS_DIR)) {
  fs.mkdirSync(VEHICLES_UPLOADS_DIR, { recursive: true });
}

function downloadZipBuffer(url, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    if (!url || !url.startsWith('http')) {
      return reject(new Error('Invalid URL'));
    }
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: timeoutMs, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
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

async function run() {
  console.log('=== IKF November Data Migration & Photo Sync ===');

  const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const wbExcel = xlsx.readFile(EXCEL_PATH);
  const rows = xlsx.utils.sheet_to_json(wbExcel.Sheets[wbExcel.SheetNames[0]]);

  console.log(`Loaded ${dbData.vehicles.length} current vehicles in DB`);
  console.log(`Loaded ${rows.length} rows from Chinnu_Data.xlsx`);

  // 1. Remove fake test vehicle
  const fakeVehId = 'ikf-veh-ce-jcb3dx';
  dbData.vehicles = dbData.vehicles.filter(v => v.id !== fakeVehId);
  dbData.vehicle_images = dbData.vehicle_images.filter(img => img.vehicle_id !== fakeVehId);
  console.log(`Removed fake test car ${fakeVehId}`);

  // 2. Identify Released Loan IDs
  // Loan IDs with Release status
  const releasedLoanIds = new Set();
  rows.forEach(r => {
    const st = String(r['Status'] || '');
    const tab = String(r['TAB STATUS'] || r['TAB Approved Status'] || '');
    if (st.includes('Release') || tab.includes('Release')) {
      releasedLoanIds.add(String(r['LOAN_ID']).trim());
    }
  });
  console.log(`Found ${releasedLoanIds.size} released vehicles:`, Array.from(releasedLoanIds));

  // 3. Map Excel rows by Loan ID
  const excelLoanMap = new Map();
  rows.forEach(r => {
    const loanId = String(r['LOAN_ID'] || '').trim();
    if (loanId) excelLoanMap.set(loanId, r);
  });

  // 4. Update existing vehicles in DB
  const updatedLoanIds = new Set();
  dbData.vehicles.forEach(v => {
    const loanId = String(v.source_loan_id || '').trim();
    const excelRow = excelLoanMap.get(loanId);

    // All prices must be NA (0 in numeric DB fields)
    v.source_price = 0;
    v.public_listing_price = 0;
    v.public_price_label = 'NA';

    if (excelRow) {
      updatedLoanIds.add(loanId);
      const isReleased = releasedLoanIds.has(loanId);

      v.publication_status = isReleased ? 'unpublished' : 'published';
      v.availability_status = isReleased ? 'unavailable' : 'available';

      v.branch_location = String(excelRow['LOAN_BRANCH'] || v.branch_location || '').trim();
      v.yard_name = String(excelRow['Yard Name'] || v.yard_name || '').trim();
      v.internal_yard_contact = String(excelRow['YardContactNo'] || v.internal_yard_contact || '').trim();
      v.registration_number = String(excelRow['VehicleNo'] || v.registration_number || '').trim();
      v.vehicle_category = String(excelRow['LOAN_PRODUCT'] || v.vehicle_category || '').trim();
      v.source_sale_status = String(excelRow['Status'] || v.source_sale_status || '').trim();
      v.updated_at = new Date().toISOString();
    } else {
      // Vehicle in DB was from older cycle, not in current November sheet
      // Remove from active grid by archiving / unpublishing
      v.publication_status = 'unpublished';
      v.availability_status = 'sold';
      v.updated_at = new Date().toISOString();
      console.log(`Archived older vehicle no longer in current stock: ${v.id} (${v.registration_number})`);
    }
  });

  // 5. Add new vehicles from Excel that aren't yet in DB
  const missingPicVehicles = [];
  let newAddedCount = 0;
  let newPhotosDownloaded = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const loanId = String(row['LOAN_ID'] || '').trim();
    if (!loanId) continue;

    const picUrl = String(row['pic'] || '').trim();
    const isPicMissing = !picUrl || picUrl === 'NaN' || !picUrl.startsWith('http');
    const isReleased = releasedLoanIds.has(loanId);

    if (isPicMissing) {
      missingPicVehicles.push({
        loanId,
        regNo: String(row['VehicleNo'] || '').trim(),
        model: String(row['VEHICLE_DESC'] || '').trim(),
        category: String(row['LOAN_PRODUCT'] || '').trim(),
        yard: String(row['Yard Name'] || '').trim(),
        branch: String(row['LOAN_BRANCH'] || '').trim()
      });
    }

    if (updatedLoanIds.has(loanId)) {
      continue; // Already updated in DB
    }

    const vehicleId = `ikf-veh-${loanId}`;
    const desc = String(row['VEHICLE_DESC'] || '').trim();
    const parsedDesc = parseVehicleDescription(desc);
    const category = String(row['LOAN_PRODUCT'] || 'Own Car').trim();
    const yom = parseInt(row['YOM'], 10) || new Date().getFullYear();
    const vehicleNo = String(row['VehicleNo'] || '').trim();
    const branch = String(row['LOAN_BRANCH'] || 'Telangana Branch').trim();
    const yard = String(row['Yard Name'] || 'Designated Yard').trim();
    const yardContact = String(row['YardContactNo'] || '1800-309-3090').trim();

    const newVeh = {
      id: vehicleId,
      source_system: 'EXCEL_IMPORT',
      source_record_id: `NOV-ROW-${i + 2}`,
      source_loan_id: loanId,
      vehicle_category: category,
      registration_number: vehicleNo,
      manufacturing_year: yom,
      original_vehicle_description: desc,
      make: parsedDesc.make || category,
      model: parsedDesc.model || desc,
      variant: parsedDesc.variant || '',
      source_price: 0,
      public_listing_price: 0,
      public_price_label: 'NA',
      branch_location: branch,
      yard_name: yard,
      internal_yard_contact: yardContact,
      internal_customer_name: String(row['CUSTOMER_NAME'] || '').trim(),
      internal_aging_days: Math.round(parseFloat(row['Aging_Days'])) || 0,
      internal_chassis_number: String(row['CHASIS NUMBER'] || '').trim(),
      internal_engine_number: '',
      source_sale_status: String(row['Status'] || 'Parked').trim(),
      source_image_url: isPicMissing ? '' : picUrl,
      internal_seized_on: row['Seized On'] ? String(row['Seized On']) : null,
      publication_status: isReleased ? 'unpublished' : 'published',
      availability_status: isReleased ? 'unavailable' : 'available',
      public_description: `Certified ${yom} ${parsedDesc.make || ''} ${parsedDesc.model || desc} located at IKF ${branch} branch / ${yard}. Verified chassis: ${String(row['CHASIS NUMBER'] || '').trim() || 'Available on yard inspection'}.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    dbData.vehicles.push(newVeh);
    newAddedCount++;

    // Process images
    let imagesAdded = 0;
    if (!isPicMissing) {
      const vehDir = path.join(VEHICLES_UPLOADS_DIR, vehicleId);
      if (!fs.existsSync(vehDir)) {
        fs.mkdirSync(vehDir, { recursive: true });
      }

      try {
        console.log(`Downloading zip for ${vehicleId} (${vehicleNo}): ${picUrl.substring(0, 50)}...`);
        const zipBuf = await downloadZipBuffer(picUrl, 20000);
        const zip = new AdmZip(zipBuf);
        const entries = zip.getEntries().filter(e => !e.isDirectory && /\.(jpe?g|png|webp)$/i.test(e.entryName));

        if (entries.length > 0) {
          entries.sort((a, b) => priorityScore(b.entryName) - priorityScore(a.entryName));
          const selected = entries.slice(0, 12);
          selected.forEach((entry, imgIdx) => {
            const ext = path.extname(entry.entryName).toLowerCase() || '.jpg';
            const safeName = `photo-${imgIdx + 1}${ext}`;
            const targetPath = path.join(vehDir, safeName);
            fs.writeFileSync(targetPath, entry.getData());

            const publicUrl = `/uploads/vehicles/${vehicleId}/${safeName}`;
            dbData.vehicle_images.push({
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
          newPhotosDownloaded++;
          console.log(`  -> Successfully extracted ${imagesAdded} photos for ${vehicleId}`);
        }
      } catch (err) {
        console.warn(`  -> Could not download zip for ${vehicleId}: ${err.message}`);
      }
    }

    if (imagesAdded === 0) {
      console.log(`  -> Assigning fallback image for ${vehicleId} (${category})`);
      const fallbacks = CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES['Own Car'] || [];
      fallbacks.forEach((url, fIdx) => {
        dbData.vehicle_images.push({
          id: `img-${vehicleId}-fb-${fIdx + 1}`,
          vehicle_id: vehicleId,
          image_url: url,
          is_primary: fIdx === 0 ? 1 : 0,
          display_order: fIdx + 1,
          source_url: 'fallback',
          created_at: new Date().toISOString()
        });
      });
    }
  }

  // Save updated DB
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(dbData, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);

  console.log('\n=== Migration Completed Successfully ===');
  console.log(`Total DB vehicles now: ${dbData.vehicles.length}`);
  const activePublished = dbData.vehicles.filter(v => v.publication_status === 'published');
  console.log(`Published active vehicles on grid: ${activePublished.length}`);
  console.log(`New vehicles added from November data: ${newAddedCount}`);
  console.log(`New photo sets downloaded: ${newPhotosDownloaded}`);
  console.log(`Total missing picture vehicles in November dataset: ${missingPicVehicles.length}`);
}

run().catch(err => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});
