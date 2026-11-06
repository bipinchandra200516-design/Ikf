export type VehicleCategory = 
  | 'Own Car'
  | 'Taxi Car'
  | 'SCV'
  | 'LCV'
  | 'HCV'
  | 'Tractor'
  | 'CE';

export type AvailabilityStatus = 'available' | 'reserved' | 'sold' | 'unavailable';
export type PublicationStatus = 'draft' | 'pending_review' | 'published' | 'unpublished';

export interface VehicleImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface PublicVehicle {
  id: string;
  vehicle_category: VehicleCategory;
  make: string;
  model: string;
  variant: string;
  original_vehicle_description: string;
  manufacturing_year: number;
  price: number;
  base_price?: number;
  price_label: string;
  branch_location: string;
  yard_name: string | null;
  yard_contact_number: string;
  chassis_number?: string;
  engine_number?: string;
  registration_number: string | null;
  source_sale_status?: string;
  public_description: string;
  availability_status: AvailabilityStatus;
  publication_status: PublicationStatus;
  primary_image_url: string;
  images: VehicleImage[];
  created_at: string;
}

export interface AdminVehicle extends PublicVehicle {
  source_system: string;
  source_record_id: string;
  source_loan_id: string;
  source_price: number;
  public_listing_price: number;
  public_price_label?: string;
  internal_customer_name: string;
  internal_aging_days: number;
  internal_chassis_number: string;
  internal_engine_number: string;
  internal_yard_contact: string;
  source_sale_status: string;
  internal_seized_on: string;
  updated_at: string;
}

export interface PaginatedVehicles {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  vehicles: PublicVehicle[];
}

export interface CategoryCounts {
  'Own Car': number;
  'Taxi Car': number;
  'SCV': number;
  'LCV': number;
  'HCV': number;
  'Tractor': number;
  'CE': number;
  [key: string]: number;
}

export interface DealershipSettings {
  brand_name: string;
  tagline: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  address: string;
  default_price_label: string;
  public_show_registration: boolean;
  public_show_yard_name: boolean;
  hero_headline: string;
  hero_subtext: string;
}

export interface StatusMapping {
  source_value: string;
  target_status: AvailabilityStatus;
  auto_publish: boolean;
}

export interface ValidationRecordItem {
  rowIndex: number;
  record: {
    source_loan_id: string;
    branch_location: string;
    internal_customer_name: string;
    internal_aging_days: number;
    source_sale_status: string;
    source_price: number;
    vehicle_category: VehicleCategory;
    registration_number: string;
    manufacturing_year: number;
    original_vehicle_description: string;
    make: string;
    model: string;
    variant: string;
    internal_chassis_number: string;
    internal_engine_number: string;
    source_image_url: string;
    photo_status: string;
    internal_seized_on: string;
    internal_yard_contact: string;
    yard_name: string;
    target_availability_status: AvailabilityStatus;
    auto_publish: boolean;
    is_existing_in_db: boolean;
    is_duplicate_in_file: boolean;
  };
  errors?: string[];
  warnings?: string[];
}

export interface ValidationReport {
  filename: string;
  fileSize: number;
  totalRows: number;
  recognizedColumnsCount: number;
  recognizedColumns: string[];
  missingColumns: string[];
  categoriesDetected: string[];
  recordsWithPhotos: number;
  recordsWithoutPhotos: number;
  potentialDuplicatesCount: number;
  validRecordsCount: number;
  invalidRecordsCount: number;
  validRecords: ValidationRecordItem[];
  invalidRecords: ValidationRecordItem[];
  summary: {
    newRecordsCount: number;
    existingRecordsCount: number;
  };
}

export interface ImportRecord {
  id: string;
  filename: string;
  upload_date: string;
  admin_user: string;
  total_rows: number;
  added_records: number;
  updated_records: number;
  skipped_records: number;
  failed_records: number;
  status: 'success' | 'partial' | 'failed';
  details: {
    mode?: string;
    autoPublishApproved?: boolean;
    categoriesDetected?: string[];
    invalidErrorsCount?: number;
    note?: string;
  };
}

export interface Enquiry {
  id: string;
  vehicle_id: string | null;
  vehicle_ref: string;
  customer_name: string;
  phone_number: string;
  email: string;
  bid_price?: number | null;
  base_price?: number | null;
  message: string;
  status: 'new' | 'in_progress' | 'contacted' | 'closed';
  admin_notes: string;
  created_at: string;
}

export interface DashboardStats {
  total: number;
  published: number;
  available: number;
  pending_review: number;
  reserved: number;
  sold: number;
  missing_photos: number;
  category_breakdown: Record<string, number>;
  recent_imports: ImportRecord[];
  recent_enquiries: Enquiry[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface ArchiveRecord {
  id: string;
  vehicle_id: string;
  source_loan_id: string;
  registration_number: string;
  make: string;
  model: string;
  variant?: string;
  manufacturing_year: number;
  vehicle_category: VehicleCategory;
  branch_location: string;
  yard_name?: string;
  yard_contact_number?: string;
  internal_customer_name?: string;
  chassis_number?: string;
  engine_number?: string;
  source_price: number;
  public_listing_price: number;
  sold_price?: number;
  action_type: 'sold' | 'deleted';
  action_date: string;
  action_year: number;
  action_month: number;
  action_month_name: string;
  remarks?: string;
  admin_user?: string;
}

export interface ArchiveResponse {
  records: ArchiveRecord[];
  available_years: number[];
  available_months: { month_num: number; month_name: string }[];
  stats: {
    total: number;
    total_sold: number;
    total_deleted: number;
    total_value: number;
  };
}
