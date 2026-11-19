import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'autohub_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_SETTINGS = {
  brand_name: 'AutoHub',
  tagline: 'AutoHub — Multi-Category Vehicle Marketplace',
  phone: '1800-309-3090',
  whatsapp_number: '919705305477',
  email: 'contact@autohub.com',
  address: 'AutoHub Pan-India Yard & Branch Network',
  default_price_label: 'Price',
  public_show_registration: true,
  public_show_yard_name: true,
  hero_headline: 'Certified Pre-Owned & Commercial Vehicle Inventory',
  hero_subtext: 'Direct yard purchases and transparent bidding powered by AutoHub Marketplace.'
};

const DEFAULT_STATUS_MAPPINGS = [
  { source_value: 'to be sale', target_status: 'available', auto_publish: true },
  { source_value: 'available', target_status: 'available', auto_publish: true },
  { source_value: 'for sale', target_status: 'available', auto_publish: true },
  { source_value: 'sold', target_status: 'sold', auto_publish: false },
  { source_value: 'booked', target_status: 'reserved', auto_publish: false },
  { source_value: 'reserved', target_status: 'reserved', auto_publish: false },
  { source_value: 'yard stock', target_status: 'pending_review', auto_publish: false },
  { source_value: 'seized', target_status: 'pending_review', auto_publish: false },
  { source_value: 'under process', target_status: 'pending_review', auto_publish: false }
];

// High quality, category-tailored royalty-free automotive photography
export const CATEGORY_FALLBACK_IMAGES = {
  'Own Car': [
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=80'
  ],
  'Taxi Car': [
    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1000&q=80'
  ],
  'SCV': [
    'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1000&q=80'
  ],
  'LCV': [
    'https://images.unsplash.com/photo-1586191582056-a6519184518d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1000&q=80'
  ],
  'HCV': [
    'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1586191582056-a6519184518d?auto=format&fit=crop&w=1000&q=80'
  ],
  'Tractor': [
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1594771804886-a933bb2d609b?auto=format&fit=crop&w=1000&q=80'
  ],
  'CE': [
    'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=1000&q=80'
  ]
};

// Seed database with realistic initial inventory representing all 6 categories
function getInitialSeedData() {
  const adminPasswordHash = bcrypt.hashSync('Admin@AutoHub2026!', 10);

  const initialVehicles = [
    {
      id: 'veh-001',
      source_system: 'EXCEL_IMPORT',
      source_record_id: 'REC-101',
      source_loan_id: 'LN-2023-8841',
      vehicle_category: 'Own Car',
      registration_number: 'DL-09-CA-4491',
      manufacturing_year: 2021,
      original_vehicle_description: 'BALENO DELTA PETROL',
      make: 'Maruti Suzuki',
      model: 'Baleno',
      variant: 'Delta Petrol 1.2L',
      source_price: 540000,
      public_listing_price: 540000,
      public_price_label: 'Guide Price',
      branch_location: 'Delhi North',
      yard_name: 'GT Road Logistics Yard',
      internal_customer_name: 'Rajesh Sharma',
      internal_aging_days: 42,
      internal_chassis_number: 'MBHBA43SML401928',
      internal_engine_number: 'K12MN882104',
      internal_yard_contact: '+91 98112 00412',
      source_sale_status: 'to be sale',
      internal_seized_on: '2023-11-14',
      publication_status: 'published',
      availability_status: 'available',
      public_description: 'Well-maintained Maruti Suzuki Baleno Delta Petrol. Smooth engine, factory fitted features, clean bodywork.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'veh-002',
      source_system: 'EXCEL_IMPORT',
      source_record_id: 'REC-102',
      source_loan_id: 'LN-2023-9014',
      vehicle_category: 'Taxi Car',
      registration_number: 'MH-01-TA-7721',
      manufacturing_year: 2020,
      original_vehicle_description: 'CELERIO ZXI+ CNG',
      make: 'Maruti Suzuki',
      model: 'Celerio',
      variant: 'ZXi+ CNG Green',
      source_price: 385000,
      public_listing_price: 385000,
      public_price_label: 'Guide Price',
      branch_location: 'Mumbai Central',
      yard_name: 'Bhiwandi Auto Terminal',
      internal_customer_name: 'Mahesh Patil',
      internal_aging_days: 28,
      internal_chassis_number: 'MA3FNEB1S0091823',
      internal_engine_number: 'K10B993182',
      internal_yard_contact: '+91 98200 44321',
      source_sale_status: 'to be sale',
      internal_seized_on: '2023-12-01',
      publication_status: 'published',
      availability_status: 'available',
      public_description: 'Commercial tourist permit eligible Celerio with dual fuel petrol and CNG capability. High fuel economy.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'veh-003',
      source_system: 'EXCEL_IMPORT',
      source_record_id: 'REC-103',
      source_loan_id: 'LN-2023-5512',
      vehicle_category: 'SCV',
      registration_number: 'UP-16-BT-9023',
      manufacturing_year: 2022,
      original_vehicle_description: 'AL_DOST LS DIESEL',
      make: 'Ashok Leyland',
      model: 'Dost',
      variant: 'LS Diesel 1.5L',
      source_price: 495000,
      public_listing_price: 495000,
      public_price_label: 'Guide Price',
      branch_location: 'Noida Hub',
      yard_name: 'Greater Noida Transport Nagar',
      internal_customer_name: 'Sunil Kumar Yadav',
      internal_aging_days: 15,
      internal_chassis_number: 'MB1A2C3D4E5F6G7H8',
      internal_engine_number: 'TDCR15X9023',
      internal_yard_contact: '+91 99100 88231',
      source_sale_status: 'to be sale',
      internal_seized_on: '2024-01-10',
      publication_status: 'published',
      availability_status: 'available',
      public_description: 'Small Commercial Vehicle (SCV) with reinforced cargo deck. Great for intra-city logistics and distribution.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'veh-004',
      source_system: 'EXCEL_IMPORT',
      source_record_id: 'REC-104',
      source_loan_id: 'LN-2022-7719',
      vehicle_category: 'LCV',
      registration_number: 'HR-55-AC-3108',
      manufacturing_year: 2019,
      original_vehicle_description: 'EICHER PRO 21.14',
      make: 'Eicher',
      model: 'Pro 21.14',
      variant: 'Cabin & Chassis 14T',
      source_price: 890000,
      public_listing_price: 890000,
      public_price_label: 'Guide Price',
      branch_location: 'Gurgaon Yard',
      yard_name: 'Manesar Logistics Center',
      internal_customer_name: 'Vikram Singh Gill',
      internal_aging_days: 65,
      internal_chassis_number: 'MC2B17CK0KC19028',
      internal_engine_number: 'E483TCI4501',
      internal_yard_contact: '+91 98120 55190',
      source_sale_status: 'to be sale',
      internal_seized_on: '2023-09-20',
      publication_status: 'published',
      availability_status: 'available',
      public_description: 'Light Commercial Vehicle (LCV) medium rigid truck. Excellent for regional freight, e-commerce haulage.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'veh-005',
      source_system: 'EXCEL_IMPORT',
      source_record_id: 'REC-105',
      source_loan_id: 'LN-2022-1109',
      vehicle_category: 'HCV',
      registration_number: 'RJ-14-GH-8802',
      manufacturing_year: 2020,
      original_vehicle_description: 'TATA_3718 COWL',
      make: 'Tata Motors',
      model: 'Signa 3718',
      variant: '10-Wheel Heavy Hauler',
      source_price: 1650000,
      public_listing_price: 1650000,
      public_price_label: 'Guide Price',
      branch_location: 'Jaipur North',
      yard_name: 'Transport Nagar Depot',
      internal_customer_name: 'Rameshwar Lal & Sons',
      internal_aging_days: 35,
      internal_chassis_number: 'MAT443012L0C99182',
      internal_engine_number: 'ISBE5.9180',
      internal_yard_contact: '+91 94140 11928',
      source_sale_status: 'to be sale',
      internal_seized_on: '2023-10-18',
      publication_status: 'published',
      availability_status: 'available',
      public_description: 'Heavy Commercial Vehicle (HCV) multi-axle freight carrier. Heavy duty suspension and robust chassis.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'veh-006',
      source_system: 'EXCEL_IMPORT',
      source_record_id: 'REC-106',
      source_loan_id: 'LN-2023-3390',
      vehicle_category: 'Tractor',
      registration_number: 'PB-10-TR-4512',
      manufacturing_year: 2021,
      original_vehicle_description: 'SW_744 FE 48HP',
      make: 'Swaraj',
      model: '744 FE',
      variant: '48 HP Heavy Duty Agricultural',
      source_price: 460000,
      public_listing_price: 460000,
      public_price_label: 'Guide Price',
      branch_location: 'Ludhiana Central',
      yard_name: 'Agri Yard Samrala Road',
      internal_customer_name: 'Harpreet Singh Sandhu',
      internal_aging_days: 20,
      internal_chassis_number: 'SW744T091823B',
      internal_engine_number: 'RB33.0192',
      internal_yard_contact: '+91 98720 33412',
      source_sale_status: 'to be sale',
      internal_seized_on: '2024-01-05',
      publication_status: 'published',
      availability_status: 'available',
      public_description: 'Popular 48 HP agricultural tractor with robust multi-speed PTO, power steering, and reliable fuel efficiency.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const initialImages = [
    {
      id: 'img-001-1',
      vehicle_id: 'veh-001',
      image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
      is_primary: 1,
      display_order: 1,
      source_url: '',
      created_at: new Date().toISOString()
    },
    {
      id: 'img-001-2',
      vehicle_id: 'veh-001',
      image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
      is_primary: 0,
      display_order: 2,
      source_url: '',
      created_at: new Date().toISOString()
    },
    {
      id: 'img-002-1',
      vehicle_id: 'veh-002',
      image_url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80',
      is_primary: 1,
      display_order: 1,
      source_url: '',
      created_at: new Date().toISOString()
    },
    {
      id: 'img-003-1',
      vehicle_id: 'veh-003',
      image_url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
      is_primary: 1,
      display_order: 1,
      source_url: '',
      created_at: new Date().toISOString()
    },
    {
      id: 'img-004-1',
      vehicle_id: 'veh-004',
      image_url: 'https://images.unsplash.com/photo-1586191582056-a6519184518d?auto=format&fit=crop&w=1200&q=80',
      is_primary: 1,
      display_order: 1,
      source_url: '',
      created_at: new Date().toISOString()
    },
    {
      id: 'img-005-1',
      vehicle_id: 'veh-005',
      image_url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
      is_primary: 1,
      display_order: 1,
      source_url: '',
      created_at: new Date().toISOString()
    },
    {
      id: 'img-006-1',
      vehicle_id: 'veh-006',
      image_url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80',
      is_primary: 1,
      display_order: 1,
      source_url: '',
      created_at: new Date().toISOString()
    }
  ];

  return {
    settings: DEFAULT_SETTINGS,
    status_mappings: DEFAULT_STATUS_MAPPINGS,
    admin_users: [
      {
        id: 'admin-01',
        email: 'admin@autohub.com',
        name: 'AutoHub Master Admin',
        password_hash: adminPasswordHash,
        role: 'superadmin',
        created_at: new Date().toISOString()
      }
    ],
    vehicles: initialVehicles,
    vehicle_images: initialImages,
    import_history: [
      {
        id: 'imp-seed-01',
        filename: 'AutoHub_Master_Inventory_Batch_1.xlsx',
        upload_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        admin_user: 'admin@autohub.com',
        total_rows: 6,
        added_records: 6,
        updated_records: 0,
        skipped_records: 0,
        failed_records: 0,
        status: 'success',
        details: { mode: 'update_and_add', note: 'Initial system seeding' }
      }
    ],
    enquiries: [
      {
        id: 'enq-001',
        vehicle_id: 'veh-003',
        vehicle_ref: 'SCV - Ashok Leyland Dost (UP-16-BT-9023)',
        customer_name: 'Anil Verma',
        phone_number: '+91 98101 23456',
        email: 'anil.verma@delhicargologistics.com',
        message: 'Interested in purchasing the Dost for my fleet in Noida. Please share yard inspection timing.',
        status: 'new',
        admin_notes: 'Customer called, scheduled yard visit for tomorrow 2 PM.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
      }
    ]
  };
}

class AutoHubDatabase {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.archive_records) {
          this.data.archive_records = [];
        }
      } else {
        this.data = getInitialSeedData();
        this.save();
      }
    } catch (err) {
      console.error('Failed to load DB file, initializing fresh seed:', err);
      this.data = getInitialSeedData();
      this.save();
    }
  }

  save() {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Error saving database file:', err);
    }
  }

  // --- SETTINGS ---
  getSettings() {
    return { ...this.data.settings };
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
    return this.getSettings();
  }

  // --- STATUS MAPPINGS ---
  getStatusMappings() {
    return [...this.data.status_mappings];
  }

  updateStatusMappings(mappings) {
    this.data.status_mappings = mappings;
    this.save();
    return this.getStatusMappings();
  }

  // --- AUTH ---
  findAdminByEmail(identifier) {
    if (!identifier) return null;
    const q = String(identifier).toLowerCase().trim();
    return this.data.admin_users.find(u => 
      (u.email && u.email.toLowerCase() === q) ||
      (u.username && u.username.toLowerCase() === q) ||
      (u.name && u.name.toLowerCase() === q)
    );
  }

  // --- VEHICLES ---
  getAllVehiclesAdmin(filters = {}) {
    let list = [...this.data.vehicles];

    if (filters.category && filters.category !== 'all') {
      list = list.filter(v => v.vehicle_category === filters.category);
    }
    if (filters.publication_status && filters.publication_status !== 'all') {
      list = list.filter(v => v.publication_status === filters.publication_status);
    }
    if (filters.availability_status && filters.availability_status !== 'all') {
      list = list.filter(v => v.availability_status === filters.availability_status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(v => 
        (v.make && v.make.toLowerCase().includes(q)) ||
        (v.model && v.model.toLowerCase().includes(q)) ||
        (v.registration_number && v.registration_number.toLowerCase().includes(q)) ||
        (v.source_loan_id && v.source_loan_id.toLowerCase().includes(q)) ||
        (v.original_vehicle_description && v.original_vehicle_description.toLowerCase().includes(q)) ||
        (v.branch_location && v.branch_location.toLowerCase().includes(q)) ||
        (v.yard_name && v.yard_name.toLowerCase().includes(q))
      );
    }

    // Attach images
    return list.map(v => {
      const images = this.data.vehicle_images.filter(img => img.vehicle_id === v.id);
      return {
        ...v,
        images: images.sort((a, b) => (b.is_primary - a.is_primary) || (a.display_order - b.display_order))
      };
    });
  }

  getVehicleByIdAdmin(id) {
    const v = this.data.vehicles.find(item => item.id === id);
    if (!v) return null;
    const images = this.data.vehicle_images
      .filter(img => img.vehicle_id === v.id)
      .sort((a, b) => (b.is_primary - a.is_primary) || (a.display_order - b.display_order));
    return { ...v, images };
  }

  // PUBLIC VEHICLES: STRICT PRIVACY FILTERING!
  // Never expose: CUSTOMER_NAME, LOAN_ID, Aging_Days, CHASIS NUMBER, ENGINE_NUMBER, Seized On, YardContactNo
  getPublicVehicles(params = {}) {
    const settings = this.getSettings();

    let list = this.data.vehicles.filter(v => 
      v.publication_status === 'published' &&
      (v.availability_status === 'available' || v.availability_status === 'reserved')
    );

    // Filter by category
    if (params.category && params.category !== 'all') {
      list = list.filter(v => v.vehicle_category.toLowerCase() === params.category.toLowerCase());
    }

    // Filter by make
    if (params.make) {
      list = list.filter(v => v.make && v.make.toLowerCase().includes(params.make.toLowerCase()));
    }

    // Filter by branch
    if (params.branch) {
      list = list.filter(v => v.branch_location && v.branch_location.toLowerCase().includes(params.branch.toLowerCase()));
    }

    // Filter by min price
    if (params.min_price) {
      const min = Number(params.min_price);
      if (!isNaN(min)) {
        list = list.filter(v => (v.public_listing_price || v.source_price || 0) >= min);
      }
    }

    // Filter by max price
    if (params.max_price) {
      const max = Number(params.max_price);
      if (!isNaN(max)) {
        list = list.filter(v => (v.public_listing_price || v.source_price || 0) <= max);
      }
    }

    // Filter by manufacturing year
    if (params.year) {
      const yr = Number(params.year);
      if (!isNaN(yr)) {
        list = list.filter(v => v.manufacturing_year === yr);
      }
    }

    // Filter by search query (make, model, description, or registration if allowed)
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(v => {
        const makeMatch = v.make && v.make.toLowerCase().includes(q);
        const modelMatch = v.model && v.model.toLowerCase().includes(q);
        const descMatch = v.original_vehicle_description && v.original_vehicle_description.toLowerCase().includes(q);
        const publicDescMatch = v.public_description && v.public_description.toLowerCase().includes(q);
        const branchMatch = v.branch_location && v.branch_location.toLowerCase().includes(q);
        const regMatch = settings.public_show_registration && v.registration_number && v.registration_number.toLowerCase().includes(q);
        const idMatch = v.id && v.id.toLowerCase().includes(q);
        return makeMatch || modelMatch || descMatch || publicDescMatch || branchMatch || regMatch || idMatch;
      });
    }

    // Sorting
    const sort = params.sort || 'recent';
    if (sort === 'price_asc') {
      list.sort((a, b) => (a.public_listing_price || a.source_price || 0) - (b.public_listing_price || b.source_price || 0));
    } else if (sort === 'price_desc') {
      list.sort((a, b) => (b.public_listing_price || b.source_price || 0) - (a.public_listing_price || a.source_price || 0));
    } else if (sort === 'year_desc') {
      list.sort((a, b) => (b.manufacturing_year || 0) - (a.manufacturing_year || 0));
    } else if (sort === 'year_asc') {
      list.sort((a, b) => (a.manufacturing_year || 0) - (b.manufacturing_year || 0));
    } else {
      // Default: recently added
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const total = list.length;
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 12);
    const startIndex = (page - 1) * limit;
    const paged = list.slice(startIndex, startIndex + limit);

    // Sanitize every record: ABSOLUTELY NO INTERNAL LOAN OR SENSITIVE DATA IN PUBLIC JSON
    const sanitizedVehicles = paged.map(v => this.sanitizePublicVehicle(v, settings));

    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      vehicles: sanitizedVehicles
    };
  }

  getPublicVehicleById(id) {
    const settings = this.getSettings();
    const v = this.data.vehicles.find(item => 
      item.id === id && 
      item.publication_status === 'published' &&
      (item.availability_status === 'available' || item.availability_status === 'reserved')
    );
    if (!v) return null;
    return this.sanitizePublicVehicle(v, settings);
  }

  getSimilarPublicVehicles(vehicleId, limit = 3) {
    const target = this.data.vehicles.find(v => v.id === vehicleId);
    if (!target) return [];
    const settings = this.getSettings();

    const others = this.data.vehicles.filter(v => 
      v.id !== vehicleId && 
      v.publication_status === 'published' &&
      (v.availability_status === 'available' || v.availability_status === 'reserved')
    );

    // Score similarity by category match, then make match
    const scored = others.map(v => {
      let score = 0;
      if (v.vehicle_category === target.vehicle_category) score += 10;
      if (v.make && target.make && v.make.toLowerCase() === target.make.toLowerCase()) score += 5;
      const targetPrice = target.public_listing_price || target.source_price || 0;
      const vPrice = v.public_listing_price || v.source_price || 0;
      if (targetPrice > 0 && vPrice > 0) {
        const diffRatio = Math.abs(targetPrice - vPrice) / targetPrice;
        if (diffRatio < 0.25) score += 3;
      }
      return { vehicle: v, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(item => this.sanitizePublicVehicle(item.vehicle, settings));
  }

  getPublicCategoryCounts() {
    // Only published and available vehicles
    const publishedVehicles = this.data.vehicles.filter(v => 
      v.publication_status === 'published' && 
      (v.availability_status === 'available' || v.availability_status === 'reserved')
    );

    const categories = ['Own Car', 'Taxi Car', 'SCV', 'LCV', 'HCV', 'Tractor', 'CE'];
    const counts = {};

    categories.forEach(cat => {
      counts[cat] = publishedVehicles.filter(v => v.vehicle_category === cat).length;
    });

    return counts;
  }

  // Pure sanitization function for public consumption
  sanitizePublicVehicle(v, settings) {
    const images = this.data.vehicle_images
      .filter(img => img.vehicle_id === v.id)
      .sort((a, b) => (b.is_primary - a.is_primary) || (a.display_order - b.display_order));

    let primaryImageUrl = '';
    if (images.length > 0) {
      primaryImageUrl = images[0].image_url;
    } else {
      // Pick category fallback
      const fallbacks = CATEGORY_FALLBACK_IMAGES[v.vehicle_category] || CATEGORY_FALLBACK_IMAGES['Own Car'];
      primaryImageUrl = fallbacks[0];
    }

    return {
      id: v.id,
      vehicle_category: v.vehicle_category,
      make: v.make || '',
      model: v.model || '',
      variant: v.variant || '',
      original_vehicle_description: v.original_vehicle_description,
      manufacturing_year: v.manufacturing_year,
      price: v.public_listing_price || v.source_price,
      base_price: v.source_price || v.public_listing_price || 0,
      price_label: v.public_price_label || settings.default_price_label || 'Base Asking Price',
      branch_location: v.branch_location || 'Branch Office',
      yard_name: v.yard_name || 'Designated Yard',
      yard_contact_number: v.internal_yard_contact || v.yard_contact_number || '1800-309-3090',
      chassis_number: v.internal_chassis_number || v.chasis_number || '',
      engine_number: v.internal_engine_number || v.engine_number || '',
      registration_number: v.registration_number || '',
      source_sale_status: v.source_sale_status || '',
      public_description: v.public_description,
      availability_status: v.availability_status,
      publication_status: v.publication_status,
      primary_image_url: primaryImageUrl,
      images: images.map(img => ({
        id: img.id,
        image_url: img.image_url,
        is_primary: !!img.is_primary,
        display_order: img.display_order
      })),
      created_at: v.created_at
    };
  }

  // --- ADMIN VEHICLE MUTATIONS ---
  createVehicle(vehicleData) {
    const id = `veh-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const loanId = vehicleData.source_loan_id?.trim() || `MAN-${Date.now().toString().slice(-6)}`;
    
    const newVehicle = {
      id,
      source_system: 'MANUAL_ENTRY',
      source_record_id: `REC-M-${Date.now().toString().slice(-4)}`,
      source_loan_id: loanId,
      vehicle_category: vehicleData.vehicle_category || 'Own Car',
      registration_number: (vehicleData.registration_number || '').trim().toUpperCase(),
      manufacturing_year: Number(vehicleData.manufacturing_year) || new Date().getFullYear(),
      original_vehicle_description: vehicleData.original_vehicle_description || `${vehicleData.make || ''} ${vehicleData.model || ''}`,
      make: (vehicleData.make || 'Other').trim(),
      model: (vehicleData.model || 'Standard').trim(),
      variant: (vehicleData.variant || '').trim(),
      source_price: Number(vehicleData.source_price) || Number(vehicleData.public_listing_price) || 0,
      public_listing_price: Number(vehicleData.public_listing_price) || Number(vehicleData.source_price) || 0,
      public_price_label: vehicleData.public_price_label || 'Guide Price',
      branch_location: (vehicleData.branch_location || 'Central Hub').trim(),
      yard_name: (vehicleData.yard_name || '').trim(),
      internal_customer_name: (vehicleData.internal_customer_name || 'Manual Listing').trim(),
      internal_aging_days: Number(vehicleData.internal_aging_days) || 0,
      internal_chassis_number: (vehicleData.internal_chassis_number || '').trim(),
      internal_engine_number: (vehicleData.internal_engine_number || '').trim(),
      internal_yard_contact: (vehicleData.internal_yard_contact || '').trim(),
      source_sale_status: 'to be sale',
      internal_seized_on: vehicleData.internal_seized_on || new Date().toISOString().split('T')[0],
      publication_status: vehicleData.publication_status || 'published',
      availability_status: vehicleData.availability_status || 'available',
      public_description: vehicleData.public_description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.data.vehicles.unshift(newVehicle);

    if (vehicleData.primary_image_url) {
      this.addVehicleImage(id, vehicleData.primary_image_url.trim(), true);
    }

    this.save();
    return this.getVehicleByIdAdmin(id);
  }

  createArchiveRecord(vehicle, action_type, remarks = '', adminUser = 'admin@autohub.com', soldPrice = null) {
    if (!this.data.archive_records) {
      this.data.archive_records = [];
    }
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const finalSoldPrice = soldPrice !== null && soldPrice !== undefined
      ? Number(soldPrice)
      : Number(vehicle.public_listing_price || vehicle.price || vehicle.source_price || 0);

    const record = {
      id: `arch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      vehicle_id: vehicle.id,
      source_loan_id: vehicle.source_loan_id || 'N/A',
      registration_number: vehicle.registration_number || 'N/A',
      make: vehicle.make || '',
      model: vehicle.model || '',
      variant: vehicle.variant || '',
      manufacturing_year: vehicle.manufacturing_year || now.getFullYear(),
      vehicle_category: vehicle.vehicle_category || 'Own Car',
      branch_location: vehicle.branch_location || '',
      yard_name: vehicle.yard_name || '',
      yard_contact_number: vehicle.internal_yard_contact || vehicle.yard_contact_number || '',
      internal_customer_name: vehicle.internal_customer_name || '',
      chassis_number: vehicle.internal_chassis_number || vehicle.chassis_number || '',
      engine_number: vehicle.internal_engine_number || vehicle.engine_number || '',
      source_price: Number(vehicle.source_price) || 0,
      public_listing_price: Number(vehicle.public_listing_price || vehicle.price) || 0,
      sold_price: finalSoldPrice,
      action_type, // 'sold' | 'deleted'
      action_date: now.toISOString(),
      action_year: now.getFullYear(),
      action_month: now.getMonth() + 1,
      action_month_name: monthNames[now.getMonth()],
      remarks: remarks || (action_type === 'sold' ? 'Vehicle Marked as Sold Out' : 'Vehicle Deleted from Inventory'),
      admin_user: adminUser || 'admin@autohub.com'
    };
    this.data.archive_records.unshift(record);
    return record;
  }

  getArchiveRecords(filters = {}) {
    if (!this.data.archive_records) {
      this.data.archive_records = [];
    }

    let list = [...this.data.archive_records];

    if (filters.year && filters.year !== 'all') {
      const yr = Number(filters.year);
      list = list.filter(r => r.action_year === yr);
    }

    if (filters.month && filters.month !== 'all') {
      const mo = Number(filters.month);
      list = list.filter(r => r.action_month === mo);
    }

    if (filters.action_type && filters.action_type !== 'all') {
      list = list.filter(r => r.action_type === filters.action_type);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(r => 
        (r.source_loan_id && r.source_loan_id.toLowerCase().includes(q)) ||
        (r.registration_number && r.registration_number.toLowerCase().includes(q)) ||
        (r.make && r.make.toLowerCase().includes(q)) ||
        (r.model && r.model.toLowerCase().includes(q)) ||
        (r.internal_customer_name && r.internal_customer_name.toLowerCase().includes(q)) ||
        (r.branch_location && r.branch_location.toLowerCase().includes(q))
      );
    }

    const allYears = Array.from(new Set(this.data.archive_records.map(r => r.action_year).filter(Boolean))).sort((a, b) => b - a);
    const currentYear = new Date().getFullYear();
    if (!allYears.includes(currentYear)) {
      allYears.unshift(currentYear);
    }

    const monthNames = [
      { month_num: 1, month_name: 'January' },
      { month_num: 2, month_name: 'February' },
      { month_num: 3, month_name: 'March' },
      { month_num: 4, month_name: 'April' },
      { month_num: 5, month_name: 'May' },
      { month_num: 6, month_name: 'June' },
      { month_num: 7, month_name: 'July' },
      { month_num: 8, month_name: 'August' },
      { month_num: 9, month_name: 'September' },
      { month_num: 10, month_name: 'October' },
      { month_num: 11, month_name: 'November' },
      { month_num: 12, month_name: 'December' },
    ];

    const stats = {
      total: list.length,
      total_sold: list.filter(r => r.action_type === 'sold').length,
      total_deleted: list.filter(r => r.action_type === 'deleted').length,
      total_value: list.reduce((sum, r) => sum + (Number(r.sold_price) || Number(r.public_listing_price) || 0), 0)
    };

    return {
      records: list,
      available_years: allYears,
      available_months: monthNames,
      stats
    };
  }

  updateVehicle(id, updates, adminUser = 'admin@autohub.com') {
    const idx = this.data.vehicles.findIndex(v => v.id === id);
    if (idx === -1) return null;

    const existing = this.data.vehicles[idx];
    const oldStatus = existing.availability_status;
    const oldSaleStatus = existing.source_sale_status;

    // Check if being marked as sold
    const isNowSold = (updates.availability_status === 'sold' && oldStatus !== 'sold') ||
                      (updates.source_sale_status && updates.source_sale_status.toLowerCase() === 'sold' && oldSaleStatus?.toLowerCase() !== 'sold');

    if (isNowSold) {
      this.createArchiveRecord(
        existing,
        'sold',
        updates.sold_remarks || 'Marked as Sold Out',
        adminUser,
        updates.sold_price || updates.public_listing_price || existing.public_listing_price
      );
    }

    const allowedUpdates = [
      'source_loan_id', 'make', 'model', 'variant', 'public_listing_price', 'public_price_label',
      'public_description', 'publication_status', 'availability_status',
      'branch_location', 'yard_name', 'registration_number', 'manufacturing_year',
      'vehicle_category', 'source_sale_status'
    ];

    allowedUpdates.forEach(key => {
      if (updates[key] !== undefined) {
        existing[key] = updates[key];
      }
    });

    existing.updated_at = new Date().toISOString();
    this.save();
    return this.getVehicleByIdAdmin(id);
  }

  deleteVehicle(id, adminUser = 'admin@autohub.com', reason = 'Deleted from inventory by administrator') {
    const idx = this.data.vehicles.findIndex(v => v.id === id);
    if (idx === -1) return false;
    const vehicle = this.data.vehicles[idx];
    
    // Auto archive before deletion
    this.createArchiveRecord(vehicle, 'deleted', reason, adminUser);

    this.data.vehicles.splice(idx, 1);
    this.data.vehicle_images = this.data.vehicle_images.filter(img => img.vehicle_id !== id);
    this.save();
    return true;
  }

  addVehicleImage(vehicleId, imageUrl, isPrimary = false) {
    const imgId = `img-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newImage = {
      id: imgId,
      vehicle_id: vehicleId,
      image_url: imageUrl,
      is_primary: isPrimary ? 1 : 0,
      display_order: this.data.vehicle_images.filter(i => i.vehicle_id === vehicleId).length + 1,
      source_url: '',
      created_at: new Date().toISOString()
    };

    if (isPrimary) {
      this.data.vehicle_images.forEach(img => {
        if (img.vehicle_id === vehicleId) img.is_primary = 0;
      });
    }

    this.data.vehicle_images.push(newImage);
    this.save();
    return newImage;
  }

  setImagePrimary(vehicleId, imageId) {
    let found = false;
    this.data.vehicle_images.forEach(img => {
      if (img.vehicle_id === vehicleId) {
        if (img.id === imageId) {
          img.is_primary = 1;
          found = true;
        } else {
          img.is_primary = 0;
        }
      }
    });
    if (found) this.save();
    return found;
  }

  deleteVehicleImage(imageId) {
    const idx = this.data.vehicle_images.findIndex(img => img.id === imageId);
    if (idx === -1) return false;
    this.data.vehicle_images.splice(idx, 1);
    this.save();
    return true;
  }

  // --- STATS ---
  getDashboardStats() {
    const total = this.data.vehicles.length;
    const published = this.data.vehicles.filter(v => v.publication_status === 'published').length;
    const available = this.data.vehicles.filter(v => v.availability_status === 'available').length;
    const pending_review = this.data.vehicles.filter(v => v.publication_status === 'pending_review' || v.publication_status === 'draft').length;
    const reserved = this.data.vehicles.filter(v => v.availability_status === 'reserved').length;
    const sold = this.data.vehicles.filter(v => v.availability_status === 'sold').length;

    // Vehicles with no uploaded images
    const vehiclesWithImages = new Set(this.data.vehicle_images.map(img => img.vehicle_id));
    const missing_photos = this.data.vehicles.filter(v => !vehiclesWithImages.has(v.id)).length;

    const recent_imports = [...this.data.import_history]
      .sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime())
      .slice(0, 5);

    const recent_enquiries = [...this.data.enquiries]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // Category breakdown
    const category_breakdown = {};
    ['Own Car', 'Taxi Car', 'SCV', 'LCV', 'HCV', 'Tractor', 'CE'].forEach(cat => {
      category_breakdown[cat] = this.data.vehicles.filter(v => v.vehicle_category === cat).length;
    });

    return {
      total,
      published,
      available,
      pending_review,
      reserved,
      sold,
      missing_photos,
      category_breakdown,
      recent_imports,
      recent_enquiries
    };
  }

  // --- ENQUIRIES & BIDS ---
  createEnquiry({ vehicle_id, customer_name, phone_number, email, message, bid_price }) {
    let vehicle_ref = 'General Vehicle Enquiry';
    let base_price = 0;
    if (vehicle_id) {
      const v = this.data.vehicles.find(item => item.id === vehicle_id);
      if (v) {
        vehicle_ref = `${v.vehicle_category} - ${v.make || ''} ${v.model || ''} (${v.registration_number || v.id})`;
        base_price = v.public_listing_price || v.source_price || 0;
      }
    }

    const numericBid = bid_price !== undefined && bid_price !== null && bid_price !== '' ? Number(bid_price) : null;

    const enquiry = {
      id: numericBid ? `bid-${Date.now()}-${Math.floor(Math.random() * 1000)}` : `enq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      vehicle_id: vehicle_id || null,
      vehicle_ref,
      customer_name: customer_name.trim(),
      phone_number: phone_number.trim(),
      email: (email || '').trim(),
      bid_price: numericBid,
      base_price: base_price,
      message: (message || '').trim(),
      status: 'new',
      admin_notes: '',
      created_at: new Date().toISOString()
    };

    this.data.enquiries.unshift(enquiry);
    this.save();
    return enquiry;
  }

  getAllEnquiries() {
    return [...this.data.enquiries].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  updateEnquiry(id, { status, admin_notes }) {
    const enq = this.data.enquiries.find(e => e.id === id);
    if (!enq) return null;
    if (status) enq.status = status;
    if (admin_notes !== undefined) enq.admin_notes = admin_notes;
    this.save();
    return enq;
  }

  // --- IMPORT HISTORY ---
  addImportRecord(record) {
    this.data.import_history.unshift(record);
    this.save();
  }

  getImportHistory() {
    return [...this.data.import_history].sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime());
  }
}

export const db = new AutoHubDatabase();
