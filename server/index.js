import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import xlsx from 'xlsx';

import { db, CATEGORY_FALLBACK_IMAGES } from './db.js';
import {
  parseExcelBuffer,
  validateAndPreview,
  generateSampleTemplate,
  isSafeImageUrl,
  REQUIRED_COLUMNS
} from './excel_importer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'autohub_super_secret_jwt_key_2026_secured!';
const PORT = process.env.PORT || 5000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads directory
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Multer for memory upload of Excel spreadsheets and disk storage for photos
const memoryStorage = multer.memoryStorage();
const uploadExcel = multer({
  storage: memoryStorage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

const diskPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `veh-photo-${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`);
  }
});
const uploadPhoto = multer({
  storage: diskPhotoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext) || allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, or WebP images are allowed'));
    }
  }
});

// Admin Authentication Middleware
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session token' });
  }
}

// ==========================================
// PUBLIC API ENDPOINTS (STRICT PRIVACY)
// ==========================================

// 1. Get public vehicles with filtering, search, pagination, and sorting
app.get('/api/public/vehicles', (req, res) => {
  try {
    const result = db.getPublicVehicles(req.query);
    res.json(result);
  } catch (err) {
    console.error('Error fetching public vehicles:', err);
    res.status(500).json({ error: 'Failed to retrieve vehicle listings' });
  }
});

// 2. Get single public vehicle details
app.get('/api/public/vehicles/:id', (req, res) => {
  try {
    const vehicle = db.getPublicVehicleById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found or not currently available' });
    }
    res.json(vehicle);
  } catch (err) {
    console.error('Error fetching public vehicle:', err);
    res.status(500).json({ error: 'Failed to retrieve vehicle details' });
  }
});

// 3. Get similar public vehicles
app.get('/api/public/vehicles/:id/similar', (req, res) => {
  try {
    const similar = db.getSimilarPublicVehicles(req.params.id, 3);
    res.json(similar);
  } catch (err) {
    console.error('Error fetching similar vehicles:', err);
    res.status(500).json({ error: 'Failed to retrieve similar vehicles' });
  }
});

// 4. Get category vehicle counts directly from DB
app.get('/api/public/categories', (req, res) => {
  try {
    const counts = db.getPublicCategoryCounts();
    res.json(counts);
  } catch (err) {
    console.error('Error fetching category counts:', err);
    res.status(500).json({ error: 'Failed to retrieve category counts' });
  }
});

// 5. Get public dealership settings
app.get('/api/public/settings', (req, res) => {
  try {
    const settings = db.getSettings();
    res.json({
      brand_name: settings.brand_name,
      tagline: settings.tagline,
      phone: settings.phone,
      whatsapp_number: settings.whatsapp_number,
      email: settings.email,
      address: settings.address,
      default_price_label: settings.default_price_label,
      public_show_registration: settings.public_show_registration,
      public_show_yard_name: settings.public_show_yard_name,
      hero_headline: settings.hero_headline,
      hero_subtext: settings.hero_subtext
    });
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to retrieve public settings' });
  }
});

// 6. Customer Enquiry & Bid Submission
app.post('/api/public/enquiries', (req, res) => {
  try {
    const { vehicle_id, customer_name, phone_number, email, message, bid_price } = req.body;

    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ error: 'Your name is required' });
    }
    if (!phone_number || !phone_number.trim()) {
      return res.status(400).json({ error: 'A valid contact phone number is required' });
    }

    let bidPriceNum = null;
    let vehicle = null;
    if (vehicle_id) {
      vehicle = db.data.vehicles.find(v => v.id === vehicle_id);
    }

    if (bid_price !== undefined && bid_price !== null && bid_price !== '') {
      bidPriceNum = Number(bid_price);
      if (isNaN(bidPriceNum) || bidPriceNum <= 0) {
        return res.status(400).json({ error: 'Please enter a valid numeric bid amount' });
      }
      if (vehicle) {
        const basePrice = vehicle.public_listing_price || vehicle.source_price || 0;
        if (bidPriceNum < basePrice) {
          return res.status(400).json({
            error: `Your bid of ₹${bidPriceNum.toLocaleString('en-IN')} cannot be less than the base asking price of ₹${basePrice.toLocaleString('en-IN')}`
          });
        }
      }
    }

    const enquiry = db.createEnquiry({
      vehicle_id,
      customer_name,
      phone_number,
      email,
      message,
      bid_price: bidPriceNum
    });

    const successMsg = bidPriceNum
      ? `Bid of ₹${bidPriceNum.toLocaleString('en-IN')} placed successfully! Ref: ${enquiry.id}. The IKF branch / yard team will contact you to proceed.`
      : 'Thank you! Your enquiry has been received. Our sales specialist will contact you shortly.';

    res.status(201).json({
      success: true,
      message: successMsg,
      enquiry_id: enquiry.id,
      bid_price: bidPriceNum
    });
  } catch (err) {
    console.error('Error submitting enquiry or bid:', err);
    res.status(500).json({ error: 'Unable to submit enquiry at this time' });
  }
});

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

app.post('/api/admin/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = db.findAdminByEmail(email);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const matches = bcrypt.compareSync(password, admin.password_hash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Authentication service error' });
  }
});

app.get('/api/admin/auth/me', authenticateAdmin, (req, res) => {
  res.json({ user: req.admin });
});

// ==========================================
// ADMIN DASHBOARD & INVENTORY MANAGEMENT
// ==========================================

// Dashboard stats
app.get('/api/admin/dashboard/stats', authenticateAdmin, (req, res) => {
  try {
    const stats = db.getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// Get all inventory (with full internal fields)
app.get('/api/admin/vehicles', authenticateAdmin, (req, res) => {
  try {
    const vehicles = db.getAllVehiclesAdmin(req.query);
    res.json({ total: vehicles.length, vehicles });
  } catch (err) {
    console.error('Admin vehicles error:', err);
    res.status(500).json({ error: 'Failed to load vehicles' });
  }
});

// Get single vehicle admin
app.get('/api/admin/vehicles/:id', authenticateAdmin, (req, res) => {
  try {
    const vehicle = db.getVehicleByIdAdmin(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (err) {
    console.error('Admin vehicle by id error:', err);
    res.status(500).json({ error: 'Failed to load vehicle' });
  }
});

// Create vehicle manually (not from Excel)
app.post('/api/admin/vehicles', authenticateAdmin, (req, res) => {
  try {
    const created = db.createVehicle(req.body);
    res.status(201).json(created);
  } catch (err) {
    console.error('Admin create vehicle error:', err);
    res.status(500).json({ error: 'Failed to create vehicle: ' + err.message });
  }
});

// Update vehicle
app.put('/api/admin/vehicles/:id', authenticateAdmin, (req, res) => {
  try {
    const updated = db.updateVehicle(req.params.id, req.body, req.admin?.email);
    if (!updated) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Admin vehicle update error:', err);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// Delete vehicle
app.delete('/api/admin/vehicles/:id', authenticateAdmin, (req, res) => {
  try {
    const success = db.deleteVehicle(req.params.id, req.admin?.email, req.body?.reason || 'Deleted from inventory by admin');
    if (!success) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json({ success: true, message: 'Vehicle deleted and moved to archive successfully' });
  } catch (err) {
    console.error('Admin vehicle delete error:', err);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// Upload manual photo for a vehicle
app.post('/api/admin/vehicles/:id/images', authenticateAdmin, uploadPhoto.single('photo'), (req, res) => {
  try {
    const vehicleId = req.params.id;
    const v = db.getVehicleByIdAdmin(vehicleId);
    if (!v) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    let imageUrl = '';
    if (req.file) {
      // Local uploaded file
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl.trim();
    } else {
      return res.status(400).json({ error: 'No image file or URL provided' });
    }

    const isPrimary = req.body.isPrimary === 'true' || req.body.isPrimary === true;
    const created = db.addVehicleImage(vehicleId, imageUrl, isPrimary);
    res.status(201).json(created);
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ error: 'Failed to attach image' });
  }
});

// Set vehicle primary image
app.put('/api/admin/vehicles/:id/images/:imageId/primary', authenticateAdmin, (req, res) => {
  try {
    const success = db.setImagePrimary(req.params.id, req.params.imageId);
    if (!success) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.json({ success: true, message: 'Primary image updated' });
  } catch (err) {
    console.error('Set primary image error:', err);
    res.status(500).json({ error: 'Failed to set primary image' });
  }
});

// Delete vehicle image
app.delete('/api/admin/vehicles/images/:imageId', authenticateAdmin, (req, res) => {
  try {
    const success = db.deleteVehicleImage(req.params.imageId);
    if (!success) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    console.error('Image delete error:', err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// ==========================================
// EXCEL IMPORT WORKFLOW API
// ==========================================

// Step 1 & 2 & 3: Upload and Preview spreadsheet with exact 16-column mapping & validation
app.post('/api/admin/import/preview', authenticateAdmin, uploadExcel.single('file'), (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No spreadsheet file uploaded' });
    }

    const filename = req.file.originalname;
    const parsed = parseExcelBuffer(req.file.buffer);

    if (parsed.missingColumns.length > 0 && parsed.rows.length > 0) {
      // Check if critical columns are present
      const criticalRequired = ['LOAN_PRODUCT', 'MAKE&VEHICLE_DESC', 'B>Prices', 'YOM'];
      const missingCritical = criticalRequired.filter(c => parsed.missingColumns.includes(c));
      if (missingCritical.length > 0) {
        return res.status(400).json({
          error: `Spreadsheet is missing required columns: ${missingCritical.join(', ')}`,
          recognizedColumns: parsed.recognizedColumns,
          missingColumns: parsed.missingColumns,
          requiredColumns: REQUIRED_COLUMNS
        });
      }
    }

    const existingVehicles = db.data.vehicles;
    const statusMappings = db.getStatusMappings();

    const validationReport = validateAndPreview(parsed, existingVehicles, statusMappings);

    res.json({
      filename,
      fileSize: req.file.size,
      ...validationReport
    });
  } catch (err) {
    console.error('Excel preview error:', err);
    res.status(400).json({ error: err.message || 'Failed to parse Excel spreadsheet' });
  }
});

// Step 4, 5, 6: Execute Import
app.post('/api/admin/import/execute', authenticateAdmin, uploadExcel.single('file'), (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'Spreadsheet file missing for import execution' });
    }

    const mode = req.body.mode || 'update_and_add'; // 'add_only', 'update_and_add', 'preview_only'
    const autoPublishApproved = req.body.autoPublish === 'true' || req.body.autoPublish === true;
    const filename = req.file.originalname;

    const parsed = parseExcelBuffer(req.file.buffer);
    const existingVehicles = db.data.vehicles;
    const statusMappings = db.getStatusMappings();
    const validation = validateAndPreview(parsed, existingVehicles, statusMappings);

    if (mode === 'preview_only') {
      return res.json({
        success: true,
        dryRun: true,
        ...validation
      });
    }

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = validation.invalidRecords.length;

    const defaultPriceLabel = db.getSettings().default_price_label || 'Guide Price';

    validation.validRecords.forEach(({ record }) => {
      // Match by source_loan_id or registration_number
      let existingIndex = -1;
      if (record.source_loan_id) {
        existingIndex = db.data.vehicles.findIndex(v => v.source_loan_id === record.source_loan_id);
      }
      if (existingIndex === -1 && record.registration_number) {
        existingIndex = db.data.vehicles.findIndex(v => v.registration_number === record.registration_number);
      }

      const publicationStatus = autoPublishApproved && record.auto_publish ? 'published' : 'pending_review';

      if (existingIndex !== -1) {
        // Existing vehicle found
        if (mode === 'add_only') {
          skippedCount++;
        } else {
          // Update existing vehicle
          const target = db.data.vehicles[existingIndex];
          target.branch_location = record.branch_location || target.branch_location;
          target.internal_customer_name = record.internal_customer_name || target.internal_customer_name;
          target.internal_aging_days = record.internal_aging_days !== undefined ? record.internal_aging_days : target.internal_aging_days;
          target.source_sale_status = record.source_sale_status || target.source_sale_status;
          target.source_price = record.source_price || target.source_price;
          target.vehicle_category = record.vehicle_category || target.vehicle_category;
          target.manufacturing_year = record.manufacturing_year || target.manufacturing_year;
          target.original_vehicle_description = record.original_vehicle_description || target.original_vehicle_description;
          target.make = record.make || target.make;
          target.model = record.model || target.model;
          target.variant = record.variant || target.variant;
          target.internal_chassis_number = record.internal_chassis_number || target.internal_chassis_number;
          target.internal_engine_number = record.internal_engine_number || target.internal_engine_number;
          target.internal_seized_on = record.internal_seized_on || target.internal_seized_on;
          target.internal_yard_contact = record.internal_yard_contact || target.internal_yard_contact;
          target.yard_name = record.yard_name || target.yard_name;
          target.updated_at = new Date().toISOString();

          // If photo URL provided and not yet attached
          if (record.source_image_url && isSafeImageUrl(record.source_image_url)) {
            const hasExistingImg = db.data.vehicle_images.some(img => img.vehicle_id === target.id);
            if (!hasExistingImg) {
              db.addVehicleImage(target.id, record.source_image_url, true);
            }
          }

          updatedCount++;
        }
      } else {
        // New vehicle record
        const vehicleId = `veh-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const newVehicle = {
          id: vehicleId,
          source_system: 'EXCEL_IMPORT',
          source_record_id: `REC-${Date.now()}`,
          source_loan_id: record.source_loan_id,
          vehicle_category: record.vehicle_category,
          registration_number: record.registration_number,
          manufacturing_year: record.manufacturing_year,
          original_vehicle_description: record.original_vehicle_description,
          make: record.make,
          model: record.model,
          variant: record.variant,
          source_price: record.source_price,
          public_listing_price: record.source_price, // Initially mapped from B>Prices
          public_price_label: defaultPriceLabel,
          branch_location: record.branch_location,
          yard_name: record.yard_name,
          internal_customer_name: record.internal_customer_name,
          internal_aging_days: record.internal_aging_days,
          internal_chassis_number: record.internal_chassis_number,
          internal_engine_number: record.internal_engine_number,
          internal_yard_contact: record.internal_yard_contact,
          source_sale_status: record.source_sale_status,
          internal_seized_on: record.internal_seized_on,
          publication_status: publicationStatus,
          availability_status: record.target_availability_status,
          public_description: `${record.vehicle_category} - ${record.original_vehicle_description} located at ${record.branch_location}.`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        db.data.vehicles.push(newVehicle);

        // Attach primary photo if valid URL provided
        if (record.source_image_url && isSafeImageUrl(record.source_image_url)) {
          db.addVehicleImage(vehicleId, record.source_image_url, true);
        }

        addedCount++;
      }
    });

    db.save();

    // Record import history
    const importAudit = {
      id: `imp-${Date.now()}`,
      filename,
      upload_date: new Date().toISOString(),
      admin_user: req.admin.email,
      total_rows: parsed.rows.length,
      added_records: addedCount,
      updated_records: updatedCount,
      skipped_records: skippedCount,
      failed_records: failedCount,
      status: failedCount === 0 ? 'success' : (addedCount > 0 || updatedCount > 0 ? 'partial' : 'failed'),
      details: {
        mode,
        autoPublishApproved,
        categoriesDetected: validation.categoriesDetected,
        invalidErrorsCount: validation.invalidRecords.length
      }
    };

    db.addImportRecord(importAudit);

    res.json({
      success: true,
      importId: importAudit.id,
      summary: {
        totalRows: parsed.rows.length,
        added: addedCount,
        updated: updatedCount,
        skipped: skippedCount,
        failed: failedCount
      }
    });
  } catch (err) {
    console.error('Import execution error:', err);
    res.status(500).json({ error: 'Failed to process import transaction: ' + err.message });
  }
});

// Import history
app.get('/api/admin/import/history', authenticateAdmin, (req, res) => {
  try {
    const history = db.getImportHistory();
    res.json(history);
  } catch (err) {
    console.error('Import history error:', err);
    res.status(500).json({ error: 'Failed to fetch import history' });
  }
});

// Downloadable Sample Excel Template with exact 16 columns
app.get('/api/admin/import/sample-template', (req, res) => {
  try {
    const buffer = generateSampleTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="AutoHub_Inventory_Template.xlsx"');
    res.send(buffer);
  } catch (err) {
    console.error('Sample template error:', err);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// ==========================================
// ADMIN ENQUIRIES & SETTINGS
// ==========================================

// Enquiries list
app.get('/api/admin/enquiries', authenticateAdmin, (req, res) => {
  try {
    const enquiries = db.getAllEnquiries();
    res.json(enquiries);
  } catch (err) {
    console.error('Admin enquiries error:', err);
    res.status(500).json({ error: 'Failed to load enquiries' });
  }
});

// Update enquiry status / admin notes
app.put('/api/admin/enquiries/:id', authenticateAdmin, (req, res) => {
  try {
    const updated = db.updateEnquiry(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Admin enquiry update error:', err);
    res.status(500).json({ error: 'Failed to update enquiry' });
  }
});

// Export enquiries / leads to Excel
app.get('/api/admin/enquiries/export-excel', authenticateAdmin, (req, res) => {
  try {
    const enquiries = db.getAllEnquiries();
    const allVehicles = db.getAllVehiclesAdmin();
    const vehicleMap = new Map(allVehicles.map(v => [v.id, v]));

    const rows = enquiries.map((enq, i) => {
      const v = vehicleMap.get(enq.vehicle_id) || {};
      const basePrice = enq.base_price || v.source_price || v.public_listing_price || 0;
      const bidPrice = enq.bid_price || 0;
      const variance = (bidPrice && basePrice) ? bidPrice - basePrice : 0;

      return {
        'Lead ID': enq.id,
        'Date & Time': enq.created_at ? new Date(enq.created_at).toLocaleString('en-IN') : '',
        'Customer Name': enq.customer_name || 'Anonymous',
        'Phone Number': enq.phone_number || '',
        'Email Address': enq.email || '',
        'LOAN_ID (Excel Mapping)': v.source_loan_id || 'N/A',
        'Vehicle Registration': v.registration_number || 'N/A',
        'Vehicle Description': enq.vehicle_ref || `${v.make || ''} ${v.model || ''}`,
        'Category': v.vehicle_category || '',
        'Branch / Yard': `${v.branch_location || ''} ${v.yard_name ? '• ' + v.yard_name : ''}`.trim(),
        'Base Asking Price (₹)': Number(basePrice) || 0,
        'Customer Bid (₹)': Number(bidPrice) || 0,
        'Variance (₹)': variance,
        'Lead Status': (enq.status || 'new').toUpperCase(),
        'Customer Message': enq.message || '',
        'Staff Notes': enq.admin_notes || ''
      };
    });

    const worksheet = xlsx.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Status': 'No leads recorded yet' }]);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'IKF_Customer_Leads');
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="IKF_Customer_Leads_Report.xlsx"');
    res.send(buffer);
  } catch (err) {
    console.error('Enquiries Excel export error:', err);
    res.status(500).json({ error: 'Failed to generate leads Excel' });
  }
});

// ==========================================
// SOLD & DELETED ARCHIVE
// ==========================================

// Query sold & deleted vehicles archive with month/year filtering
app.get('/api/admin/archive', authenticateAdmin, (req, res) => {
  try {
    const { year, month, action_type, search } = req.query;
    const data = db.getArchiveRecords({ year, month, action_type, search });
    res.json(data);
  } catch (err) {
    console.error('Archive query error:', err);
    res.status(500).json({ error: 'Failed to query archive records' });
  }
});

// Export sold & deleted archive to Excel spreadsheet
app.get('/api/admin/archive/export-excel', authenticateAdmin, (req, res) => {
  try {
    const { year, month, action_type, search } = req.query;
    const { records } = db.getArchiveRecords({ year, month, action_type, search });

    const rows = records.map((r, i) => ({
      'S.No': i + 1,
      'Action': (r.action_type || '').toUpperCase(),
      'Action Date': r.action_date ? new Date(r.action_date).toLocaleDateString('en-IN') : '',
      'Month': r.action_month_name || '',
      'Year': r.action_year || '',
      'LOAN_ID (Excel Mapping)': r.source_loan_id || 'N/A',
      'Vehicle Registration': r.registration_number || 'N/A',
      'Category': r.vehicle_category || '',
      'Make': r.make || '',
      'Model': r.model || '',
      'Variant': r.variant || '',
      'Manufacturing Year': r.manufacturing_year || '',
      'Branch Location': r.branch_location || '',
      'Yard Name': r.yard_name || '',
      'Customer Name (Internal)': r.internal_customer_name || '',
      'Chassis Number': r.chassis_number || '',
      'Engine Number': r.engine_number || '',
      'Source Price (₹)': Number(r.source_price) || 0,
      'Final / Listed Price (₹)': Number(r.sold_price || r.public_listing_price) || 0,
      'Remarks': r.remarks || '',
      'Processed By': r.admin_user || ''
    }));

    const worksheet = xlsx.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Status': 'No archived vehicles match query' }]);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sold_and_Deleted_Archive');
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const monthStr = month && month !== 'all' ? `_Month_${month}` : '';
    const yearStr = year && year !== 'all' ? `_Year_${year}` : '';
    const filename = `IKF_Sold_and_Deleted_Vehicles${yearStr}${monthStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Archive Excel export error:', err);
    res.status(500).json({ error: 'Failed to generate archive Excel' });
  }
});
app.get('/api/admin/settings', authenticateAdmin, (req, res) => {
  try {
    res.json(db.getSettings());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/admin/settings', authenticateAdmin, (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Status mappings
app.get('/api/admin/status-mappings', authenticateAdmin, (req, res) => {
  try {
    res.json(db.getStatusMappings());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status mappings' });
  }
});

app.put('/api/admin/status-mappings', authenticateAdmin, (req, res) => {
  try {
    if (!Array.isArray(req.body.mappings)) {
      return res.status(400).json({ error: 'Mappings array is required' });
    }
    const updated = db.updateStatusMappings(req.body.mappings);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status mappings' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    brand: 'AutoHub',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend client build in production
const CLIENT_DIST = path.join(__dirname, '../client/dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`AutoHub Server running on http://localhost:${PORT}`);
});
