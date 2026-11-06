import {
  PublicVehicle,
  PaginatedVehicles,
  CategoryCounts,
  DealershipSettings,
  DashboardStats,
  AdminVehicle,
  ValidationReport,
  ImportRecord,
  Enquiry,
  StatusMapping,
  ArchiveResponse
} from '../types';

const API_BASE = '/api';

// Token helper
export const getToken = (): string | null => localStorage.getItem('autohub_admin_token');
export const setToken = (token: string): void => localStorage.setItem('autohub_admin_token', token);
export const removeToken = (): void => localStorage.removeItem('autohub_admin_token');

const authHeaders = (): HeadersInit => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ================= PUBLIC API =================
export const fetchPublicVehicles = async (params: Record<string, string | number> = {}): Promise<PaginatedVehicles> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      query.append(k, String(v));
    }
  });
  const res = await fetch(`${API_BASE}/public/vehicles?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch vehicles');
  return res.json();
};

export const fetchPublicVehicleById = async (id: string): Promise<PublicVehicle> => {
  const res = await fetch(`${API_BASE}/public/vehicles/${id}`);
  if (!res.ok) throw new Error('Vehicle not found');
  return res.json();
};

export const fetchSimilarVehicles = async (id: string): Promise<PublicVehicle[]> => {
  const res = await fetch(`${API_BASE}/public/vehicles/${id}/similar`);
  if (!res.ok) return [];
  return res.json();
};

export const fetchCategoryCounts = async (): Promise<CategoryCounts> => {
  const res = await fetch(`${API_BASE}/public/categories`);
  if (!res.ok) throw new Error('Failed to fetch category counts');
  return res.json();
};

export const fetchPublicSettings = async (): Promise<DealershipSettings> => {
  const res = await fetch(`${API_BASE}/public/settings`);
  if (!res.ok) throw new Error('Failed to fetch dealership settings');
  return res.json();
};

export const submitCustomerEnquiry = async (data: {
  vehicle_id?: string;
  customer_name: string;
  phone_number: string;
  email?: string;
  message?: string;
  bid_price?: number;
}): Promise<{ success: boolean; message: string; enquiry_id: string; bid_price?: number }> => {
  const res = await fetch(`${API_BASE}/public/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Failed to submit enquiry');
  return result;
};

// ================= ADMIN API =================
export const adminLogin = async (email: string, password: string): Promise<{ token: string; user: any }> => {
  const res = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  setToken(data.token);
  return data;
};

export const adminVerifyMe = async (): Promise<any> => {
  const res = await fetch(`${API_BASE}/admin/auth/me`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
};

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const res = await fetch(`${API_BASE}/admin/dashboard/stats`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error('Failed to load stats');
  return res.json();
};

export const fetchAdminVehicles = async (params: Record<string, string> = {}): Promise<{ total: number; vehicles: AdminVehicle[] }> => {
  const query = new URLSearchParams(params);
  const res = await fetch(`${API_BASE}/admin/vehicles?${query.toString()}`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error('Failed to load vehicles');
  return res.json();
};

export const fetchAdminVehicleById = async (id: string): Promise<AdminVehicle> => {
  const res = await fetch(`${API_BASE}/admin/vehicles/${id}`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error('Vehicle not found');
  return res.json();
};

export const updateAdminVehicle = async (id: string, updates: Partial<AdminVehicle>): Promise<AdminVehicle> => {
  const res = await fetch(`${API_BASE}/admin/vehicles/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update vehicle');
  return res.json();
};

export const createAdminVehicle = async (vehicleData: any): Promise<AdminVehicle> => {
  const res = await fetch(`${API_BASE}/admin/vehicles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify(vehicleData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create vehicle');
  }
  return res.json();
};

export const deleteAdminVehicle = async (id: string): Promise<boolean> => {
  const res = await fetch(`${API_BASE}/admin/vehicles/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error('Failed to delete vehicle');
  return true;
};

export const uploadVehiclePhoto = async (vehicleId: string, fileOrUrl: File | string, isPrimary: boolean = false): Promise<any> => {
  const formData = new FormData();
  if (typeof fileOrUrl === 'string') {
    formData.append('imageUrl', fileOrUrl);
  } else {
    formData.append('photo', fileOrUrl);
  }
  formData.append('isPrimary', String(isPrimary));

  const res = await fetch(`${API_BASE}/admin/vehicles/${vehicleId}/images`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload photo');
  return res.json();
};

export const setPrimaryVehiclePhoto = async (vehicleId: string, imageId: string): Promise<boolean> => {
  const res = await fetch(`${API_BASE}/admin/vehicles/${vehicleId}/images/${imageId}/primary`, {
    method: 'PUT',
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error('Failed to set primary photo');
  return true;
};

export const deleteVehiclePhoto = async (imageId: string): Promise<boolean> => {
  const res = await fetch(`${API_BASE}/admin/vehicles/images/${imageId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error('Failed to delete photo');
  return true;
};

// Excel Upload & Validation
export const previewSpreadsheet = async (file: File): Promise<ValidationReport> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/admin/import/preview`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to preview spreadsheet');
  return data;
};

export const executeSpreadsheetImport = async (
  file: File,
  mode: 'add_only' | 'update_and_add' | 'preview_only',
  autoPublish: boolean
): Promise<{ success: boolean; summary: any }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', mode);
  formData.append('autoPublish', String(autoPublish));

  const res = await fetch(`${API_BASE}/admin/import/execute`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to execute import');
  return data;
};

export const fetchImportHistory = async (): Promise<ImportRecord[]> => {
  const res = await fetch(`${API_BASE}/admin/import/history`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error('Failed to fetch import history');
  return res.json();
};

export const fetchAdminEnquiries = async (): Promise<Enquiry[]> => {
  const res = await fetch(`${API_BASE}/admin/enquiries`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error('Failed to load enquiries');
  return res.json();
};

export const updateAdminEnquiry = async (
  id: string,
  updates: { status?: string; admin_notes?: string }
): Promise<Enquiry> => {
  const res = await fetch(`${API_BASE}/admin/enquiries/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update enquiry');
  return res.json();
};

export const fetchAdminSettings = async (): Promise<DealershipSettings> => {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
};

export const updateAdminSettings = async (settings: Partial<DealershipSettings>): Promise<DealershipSettings> => {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
};

export const fetchStatusMappings = async (): Promise<StatusMapping[]> => {
  const res = await fetch(`${API_BASE}/admin/status-mappings`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error('Failed to fetch status mappings');
  return res.json();
};

export const updateStatusMappings = async (mappings: StatusMapping[]): Promise<StatusMapping[]> => {
  const res = await fetch(`${API_BASE}/admin/status-mappings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify({ mappings })
  });
  if (!res.ok) throw new Error('Failed to update mappings');
  return res.json();
};

// ================= ARCHIVE & EXCEL EXPORTS =================
export const fetchArchiveRecords = async (params: Record<string, string | number> = {}): Promise<ArchiveResponse> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      query.append(k, String(v));
    }
  });
  const res = await fetch(`${API_BASE}/admin/archive?${query.toString()}`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error('Failed to fetch archive records');
  return res.json();
};

export const downloadArchiveExcel = async (params: Record<string, string | number> = {}): Promise<void> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      query.append(k, String(v));
    }
  });
  const res = await fetch(`${API_BASE}/admin/archive/export-excel?${query.toString()}`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error('Failed to download archive Excel file');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const monthStr = params.month && params.month !== 'all' ? `_Month_${params.month}` : '';
  const yearStr = params.year && params.year !== 'all' ? `_Year_${params.year}` : '';
  a.download = `IKF_Sold_and_Deleted_Archive${yearStr}${monthStr}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const downloadLeadsExcel = async (): Promise<void> => {
  const res = await fetch(`${API_BASE}/admin/enquiries/export-excel`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error('Failed to download leads Excel file');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'IKF_Customer_Leads_Report.xlsx';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
