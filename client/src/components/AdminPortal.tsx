import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Lock, LayoutDashboard, Database, UploadCloud, MessageSquare, 
  Settings, LogOut, CheckCircle2, AlertCircle, Eye, EyeOff, 
  Trash2, Edit3, ImagePlus, FileSpreadsheet, Download, RefreshCw, 
  Search, X, ShieldAlert, ArrowRight, Star,
  AlertTriangle, ExternalLink, Check,
  Copy, Sparkles, Activity, Menu, Images, ChevronDown, ZoomIn, PlusCircle,
  Grid, List, Link as LinkIcon, Car, Plus, Archive, Calendar, Filter, Phone, Mail
} from 'lucide-react';
import { 
  AdminVehicle, DashboardStats, ValidationReport, ImportRecord, 
  Enquiry, DealershipSettings, StatusMapping, VehicleCategory, AvailabilityStatus, PublicationStatus,
  ArchiveRecord, ArchiveResponse
} from '../types';
import { 
  adminLogin, adminVerifyMe, removeToken, getToken, 
  fetchDashboardStats, fetchAdminVehicles, fetchAdminVehicleById, updateAdminVehicle, 
  createAdminVehicle, deleteAdminVehicle, uploadVehiclePhoto, deleteVehiclePhoto, setPrimaryVehiclePhoto, previewSpreadsheet, 
  executeSpreadsheetImport, fetchImportHistory, fetchAdminEnquiries, 
  updateAdminEnquiry, fetchAdminSettings, updateAdminSettings, 
  fetchStatusMappings, updateStatusMappings,
  fetchArchiveRecords, downloadArchiveExcel, downloadLeadsExcel
} from '../services/api';
import { formatPrice } from './VehicleCard';

interface AdminPortalProps {
  onBackToSite: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToSite }) => {
  // Auth state
  const [token, setAdminToken] = useState<string | null>(getToken());
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'archive' | 'import' | 'enquiries' | 'settings'>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Sold & Deleted Archive State
  const [archiveRecords, setArchiveRecords] = useState<ArchiveRecord[]>([]);
  const [archiveStats, setArchiveStats] = useState<{ total: number; total_sold: number; total_deleted: number; total_value: number }>({
    total: 0, total_sold: 0, total_deleted: 0, total_value: 0
  });
  const [archiveAvailableYears, setArchiveAvailableYears] = useState<number[]>([new Date().getFullYear()]);
  const [archiveYear, setArchiveYear] = useState<string>('all');
  const [archiveMonth, setArchiveMonth] = useState<string>('all');
  const [archiveAction, setArchiveAction] = useState<'all' | 'sold' | 'deleted'>('all');
  const [archiveSearch, setArchiveSearch] = useState<string>('');
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [downloadingArchiveExcel, setDownloadingArchiveExcel] = useState(false);
  const [downloadingLeadsExcel, setDownloadingLeadsExcel] = useState(false);

  // Inventory Table State
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [publicationFilter, setPublicationFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inventoryViewMode, setInventoryViewMode] = useState<'table' | 'cards'>('cards');
  const [archiveViewMode, setArchiveViewMode] = useState<'table' | 'cards'>('cards');
  const [enquiriesViewMode, setEnquiriesViewMode] = useState<'table' | 'cards'>('cards');

  // Manual Vehicle Creation Modal State
  const initialNewVehicle = {
    vehicle_category: 'Own Car' as VehicleCategory,
    make: '',
    model: '',
    variant: '',
    manufacturing_year: new Date().getFullYear(),
    registration_number: '',
    source_price: '',
    public_listing_price: '',
    public_price_label: 'Guide Price',
    branch_location: '',
    yard_name: '',
    internal_yard_contact: '',
    source_loan_id: '',
    internal_customer_name: '',
    internal_chassis_number: '',
    internal_engine_number: '',
    public_description: '',
    publication_status: 'published' as PublicationStatus,
    availability_status: 'available' as AvailabilityStatus,
  };
  const [createVehicleModalOpen, setCreateVehicleModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState(initialNewVehicle);
  const [createPhotoFile, setCreatePhotoFile] = useState<File | null>(null);
  const [createPhotoUrl, setCreatePhotoUrl] = useState('');
  const [createPhotoMode, setCreatePhotoMode] = useState<'file' | 'url'>('file');
  const [createVehicleLoading, setCreateVehicleLoading] = useState(false);
  const [createVehicleError, setCreateVehicleError] = useState<string | null>(null);
  const createPhotoInputRef = useRef<HTMLInputElement>(null);

  // Vehicle Management Drawer (replaces separate edit/photo/internal modals)
  const [drawerVehicle, setDrawerVehicle] = useState<AdminVehicle | null>(null);
  const [drawerTab, setDrawerTab] = useState<'details' | 'photos' | 'internal'>('details');
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [drawerSaved, setDrawerSaved] = useState(false);

  // Photo upload in drawer
  const [drawerUploadMode, setDrawerUploadMode] = useState<'file' | 'url'>('file');
  const [drawerUploadFile, setDrawerUploadFile] = useState<File | null>(null);
  const [drawerUploadUrl, setDrawerUploadUrl] = useState('');
  const [drawerUploadPrimary, setDrawerUploadPrimary] = useState(false);
  const [drawerUploading, setDrawerUploading] = useState(false);
  const [drawerDragOver, setDrawerDragOver] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [settingPrimaryPhotoId, setSettingPrimaryPhotoId] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const drawerPhotoInputRef = useRef<HTMLInputElement>(null);

  // Quick manual photo upload modal
  const [quickUploadVehicleId, setQuickUploadVehicleId] = useState<string>('');
  const [quickUploadModalOpen, setQuickUploadModalOpen] = useState(false);
  const [quickUploadFile, setQuickUploadFile] = useState<File | null>(null);
  const [quickUploadUrl, setQuickUploadUrl] = useState('');
  const [quickUploadMode, setQuickUploadMode] = useState<'file' | 'url'>('file');
  const [quickUploadPrimary, setQuickUploadPrimary] = useState(true);
  const [quickUploading, setQuickUploading] = useState(false);

  // Import Studio State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStep, setImportStep] = useState<number>(1);
  const [previewReport, setPreviewReport] = useState<ValidationReport | null>(null);
  const [importMode, setImportMode] = useState<'update_and_add' | 'add_only' | 'preview_only'>('update_and_add');
  const [autoPublishApproved, setAutoPublishApproved] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importHistory, setImportHistory] = useState<ImportRecord[]>([]);

  // Enquiries State
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);

  // Settings State
  const [settings, setSettings] = useState<DealershipSettings | null>(null);
  const [statusMappings, setStatusMappings] = useState<StatusMapping[]>([]);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Verify session on mount
  useEffect(() => {
    if (token) {
      adminVerifyMe()
        .then((res) => {
          setAdminUser(res.user);
          loadAllData();
        })
        .catch(() => {
          handleLogout();
        });
    }
  }, [token]);

  const loadAllData = () => {
    loadStats();
    loadVehicles();
    loadImports();
    loadEnquiries();
    loadSettings();
    loadArchive();
  };

  const loadArchive = () => {
    setArchiveLoading(true);
    fetchArchiveRecords({
      year: archiveYear,
      month: archiveMonth,
      action_type: archiveAction,
      search: archiveSearch
    })
      .then((res) => {
        setArchiveRecords(res.records);
        setArchiveStats(res.stats);
        if (res.available_years && res.available_years.length > 0) {
          setArchiveAvailableYears(res.available_years);
        }
        setArchiveLoading(false);
      })
      .catch((err) => {
        console.error('Archive error:', err);
        setArchiveLoading(false);
      });
  };

  const handleDownloadArchiveExcel = async () => {
    try {
      setDownloadingArchiveExcel(true);
      await downloadArchiveExcel({
        year: archiveYear,
        month: archiveMonth,
        action_type: archiveAction,
        search: archiveSearch
      });
    } catch (err: any) {
      alert(err.message || 'Failed to download archive spreadsheet');
    } finally {
      setDownloadingArchiveExcel(false);
    }
  };

  const handleDownloadLeadsExcel = async () => {
    try {
      setDownloadingLeadsExcel(true);
      await downloadLeadsExcel();
    } catch (err: any) {
      alert(err.message || 'Failed to download leads spreadsheet');
    } finally {
      setDownloadingLeadsExcel(false);
    }
  };

  const loadStats = () => {
    setStatsLoading(true);
    fetchDashboardStats()
      .then((s) => {
        setStats(s);
        setStatsLoading(false);
      })
      .catch((err) => {
        console.error('Stats error:', err);
        setStatsLoading(false);
      });
  };

  const loadVehicles = () => {
    fetchAdminVehicles({
      search: vehicleSearch,
      category: categoryFilter,
      publication_status: publicationFilter,
      availability_status: availabilityFilter
    })
      .then((res) => setVehicles(res.vehicles))
      .catch((err) => console.error('Vehicles error:', err));
  };

  const loadImports = () => {
    fetchImportHistory()
      .then((h) => setImportHistory(h))
      .catch((err) => console.error('Imports error:', err));
  };

  const loadEnquiries = () => {
    fetchAdminEnquiries()
      .then((e) => setEnquiries(e))
      .catch((err) => console.error('Enquiries error:', err));
  };

  const loadSettings = () => {
    fetchAdminSettings()
      .then((s) => setSettings(s))
      .catch((err) => console.error('Settings error:', err));

    fetchStatusMappings()
      .then((m) => setStatusMappings(m))
      .catch((err) => console.error('Mappings error:', err));
  };

  useEffect(() => {
    if (token) {
      loadVehicles();
    }
  }, [vehicleSearch, categoryFilter, publicationFilter, availabilityFilter]);

  useEffect(() => {
    if (token && (activeTab === 'archive' || activeTab === 'overview')) {
      loadArchive();
    }
  }, [token, activeTab, archiveYear, archiveMonth, archiveAction, archiveSearch]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await adminLogin(loginEmail, loginPassword);
      setAdminToken(res.token);
      setAdminUser(res.user);
      loadAllData();
    } catch (err: any) {
      setLoginError(err.message || 'Invalid administrator credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    setAdminToken(null);
    setAdminUser(null);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick toggle publication status in table row
  const handleQuickTogglePublish = async (vehicle: AdminVehicle) => {
    const nextStatus = vehicle.publication_status === 'published' ? 'unpublished' : 'published';
    try {
      await updateAdminVehicle(vehicle.id, { publication_status: nextStatus });
      loadVehicles();
      loadStats();
    } catch (err: any) {
      alert('Failed to update publication: ' + err.message);
    }
  };

  // Quick toggle sold status in table row
  const handleQuickToggleSold = async (vehicle: AdminVehicle) => {
    const nextStatus = vehicle.availability_status === 'sold' ? 'available' : 'sold';
    try {
      await updateAdminVehicle(vehicle.id, { availability_status: nextStatus });
      loadVehicles();
      loadStats();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // ---- Vehicle Drawer Handlers ----
  const openDrawer = (v: AdminVehicle, tab: 'details' | 'photos' | 'internal' = 'details') => {
    setDrawerVehicle({ ...v });
    setDrawerTab(tab);
    setDrawerSaved(false);
    setDrawerUploadFile(null);
    setDrawerUploadUrl('');

    // Fetch full vehicle with complete images list
    fetchAdminVehicleById(v.id)
      .then((full) => {
        setDrawerVehicle(full);
      })
      .catch((err) => console.error('Fetch vehicle details failed:', err));
  };

  const closeDrawer = () => {
    setDrawerVehicle(null);
    setDrawerUploadFile(null);
    setDrawerUploadUrl('');
    setLightboxImg(null);
  };

  const handleDrawerSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawerVehicle) return;
    setDrawerSaving(true);
    try {
      await updateAdminVehicle(drawerVehicle.id, {
        source_loan_id: drawerVehicle.source_loan_id,
        public_listing_price: Number(drawerVehicle.public_listing_price),
        public_price_label: drawerVehicle.public_price_label,
        public_description: drawerVehicle.public_description,
        publication_status: drawerVehicle.publication_status,
        availability_status: drawerVehicle.availability_status,
        make: drawerVehicle.make,
        model: drawerVehicle.model,
        variant: drawerVehicle.variant || '',
        manufacturing_year: Number(drawerVehicle.manufacturing_year),
        branch_location: drawerVehicle.branch_location,
        yard_name: drawerVehicle.yard_name,
        registration_number: drawerVehicle.registration_number,
        vehicle_category: drawerVehicle.vehicle_category,
      });
      setDrawerSaved(true);
      loadVehicles();
      loadStats();
      setTimeout(() => setDrawerSaved(false), 2500);
    } catch (err: any) {
      alert('Error saving vehicle: ' + err.message);
    } finally {
      setDrawerSaving(false);
    }
  };

  const handleDrawerDelete = async () => {
    if (!drawerVehicle) return;
    const label = `${drawerVehicle.make} ${drawerVehicle.model} (${drawerVehicle.registration_number || drawerVehicle.source_loan_id})`;
    if (!window.confirm(`Permanently delete "${label}"?\n\nThis will remove the vehicle and all attached photos. This cannot be undone.`)) return;
    try {
      await deleteAdminVehicle(drawerVehicle.id);
      closeDrawer();
      loadVehicles();
      loadStats();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleDrawerUploadPhoto = async () => {
    if (!drawerVehicle) return;
    const payload = drawerUploadMode === 'file' ? drawerUploadFile : drawerUploadUrl.trim();
    if (!payload) {
      alert(drawerUploadMode === 'file' ? 'Please choose an image file to upload' : 'Please enter an image URL');
      return;
    }
    setDrawerUploading(true);
    try {
      await uploadVehiclePhoto(drawerVehicle.id, payload, drawerUploadPrimary);
      // Refresh vehicle
      const refreshed = await fetchAdminVehicleById(drawerVehicle.id);
      setDrawerVehicle(refreshed);
      setDrawerUploadFile(null);
      setDrawerUploadUrl('');
      setDrawerUploadPrimary(false);
      loadVehicles();
      loadStats();
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setDrawerUploading(false);
    }
  };

  const handleDrawerSetPrimaryPhoto = async (imageId: string) => {
    if (!drawerVehicle) return;
    setSettingPrimaryPhotoId(imageId);
    try {
      await setPrimaryVehiclePhoto(drawerVehicle.id, imageId);
      const refreshed = await fetchAdminVehicleById(drawerVehicle.id);
      setDrawerVehicle(refreshed);
      loadVehicles();
    } catch (err: any) {
      alert('Set primary photo failed: ' + err.message);
    } finally {
      setSettingPrimaryPhotoId(null);
    }
  };

  const handleDrawerDeletePhoto = async (imageId: string) => {
    if (!drawerVehicle) return;
    if (!window.confirm('Permanently delete this photo?')) return;
    setDeletingPhotoId(imageId);
    try {
      await deleteVehiclePhoto(imageId);
      const refreshed = await fetchAdminVehicleById(drawerVehicle.id);
      setDrawerVehicle(refreshed);
      loadVehicles();
      loadStats();
    } catch (err: any) {
      alert('Delete photo failed: ' + err.message);
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrawerDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && /image\/(jpeg|jpg|png|webp)/.test(file.type)) {
      setDrawerUploadFile(file);
      setDrawerUploadMode('file');
    }
  }, []);

  const handleDeleteVehicle = async (id: string, ref: string) => {
    if (!window.confirm(`Permanently delete "${ref}"?\n\nThis will remove the vehicle and its photos.`)) return;
    try {
      await deleteAdminVehicle(id);
      loadVehicles();
      loadStats();
    } catch (err: any) {
      alert('Failed to delete vehicle: ' + err.message);
    }
  };

  // Quick photo upload modal handler
  const handleQuickUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUploadVehicleId) {
      alert('Please select a vehicle');
      return;
    }
    const payload = quickUploadMode === 'file' ? quickUploadFile : quickUploadUrl.trim();
    if (!payload) {
      alert(quickUploadMode === 'file' ? 'Please choose an image file' : 'Please enter an image URL');
      return;
    }
    setQuickUploading(true);
    try {
      await uploadVehiclePhoto(quickUploadVehicleId, payload, quickUploadPrimary);
      alert('Photo uploaded and attached successfully!');
      setQuickUploadModalOpen(false);
      setQuickUploadFile(null);
      setQuickUploadUrl('');
      loadVehicles();
      loadStats();
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setQuickUploading(false);
    }
  };

  // Manual Vehicle Creation Handler
  const handleCreateVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.make.trim() || !newVehicle.model.trim()) {
      alert('Please enter at least the vehicle Make and Model.');
      return;
    }
    setCreateVehicleLoading(true);
    setCreateVehicleError(null);

    try {
      const payload: any = {
        ...newVehicle,
        make: newVehicle.make.trim(),
        model: newVehicle.model.trim(),
        variant: newVehicle.variant.trim(),
        registration_number: newVehicle.registration_number.trim().toUpperCase(),
        branch_location: newVehicle.branch_location.trim() || 'Central Hub',
        yard_name: newVehicle.yard_name.trim(),
        internal_yard_contact: newVehicle.internal_yard_contact.trim(),
        source_loan_id: newVehicle.source_loan_id.trim() || `MAN-${Date.now().toString().slice(-6)}`,
        internal_customer_name: newVehicle.internal_customer_name.trim() || 'Manual Direct Entry',
        internal_chassis_number: newVehicle.internal_chassis_number.trim(),
        internal_engine_number: newVehicle.internal_engine_number.trim(),
        manufacturing_year: Number(newVehicle.manufacturing_year) || new Date().getFullYear(),
        source_price: Number(newVehicle.source_price) || Number(newVehicle.public_listing_price) || 0,
        public_listing_price: Number(newVehicle.public_listing_price) || Number(newVehicle.source_price) || 0,
        public_description: newVehicle.public_description.trim(),
      };

      if (createPhotoMode === 'url' && createPhotoUrl.trim()) {
        payload.primary_image_url = createPhotoUrl.trim();
      }

      const created = await createAdminVehicle(payload);

      // If a local image file was selected, upload it immediately
      if (createPhotoMode === 'file' && createPhotoFile) {
        try {
          await uploadVehiclePhoto(created.id, createPhotoFile, true);
        } catch (photoErr: any) {
          console.error('Photo upload error after vehicle creation:', photoErr);
        }
      }

      // Reset form
      setNewVehicle(initialNewVehicle);
      setCreatePhotoFile(null);
      setCreatePhotoUrl('');
      setCreateVehicleModalOpen(false);

      // Refresh data
      loadVehicles();
      loadStats();

      // Open drawer on newly created vehicle to allow further photo additions or edits
      openDrawer(created, 'details');
    } catch (err: any) {
      setCreateVehicleError(err.message || 'Failed to create vehicle');
    } finally {
      setCreateVehicleLoading(false);
    }
  };

  // Excel Importer
  const handleFileSelect = (file: File) => {
    setImportFile(file);
    setImportLoading(true);
    setPreviewReport(null);
    setImportResult(null);

    previewSpreadsheet(file)
      .then((report) => {
        setPreviewReport(report);
        setImportStep(2);
        setImportLoading(false);
      })
      .catch((err) => {
        alert('Validation error reading spreadsheet: ' + err.message);
        setImportLoading(false);
      });
  };

  const handleExecuteImport = async () => {
    if (!importFile) return;
    setImportLoading(true);

    try {
      const res = await executeSpreadsheetImport(importFile, importMode, autoPublishApproved);
      setImportResult(res);
      setImportStep(6);
      loadStats();
      loadVehicles();
      loadImports();
    } catch (err: any) {
      alert('Import failed: ' + err.message);
    } finally {
      setImportLoading(false);
    }
  };

  const handleUpdateEnquiry = async (enq: Enquiry, status: string, notes: string) => {
    try {
      await updateAdminEnquiry(enq.id, { status, admin_notes: notes });
      setEditingEnquiry(null);
      loadEnquiries();
      loadStats();
    } catch (err: any) {
      alert('Failed to update enquiry: ' + err.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await updateAdminSettings(settings);
      await updateStatusMappings(statusMappings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    }
  };

  // ==========================================
  // UN-AUTHENTICATED: LOGIN SCREEN
  // ==========================================
  if (!token || !adminUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#06101E] via-[#0B1E36] to-[#040C18] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white mb-5 shadow-xl shadow-blue-500/25">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-white font-heading tracking-tight">
            Admin Suite
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 font-medium">
            Vehicle Fleet Management & Exact 16-Column Excel Engine
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
          <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-700/80">
            <form onSubmit={handleLogin} className="space-y-5">
              {loginError && (
                <div className="p-3 bg-red-950/80 border border-red-700/80 rounded-xl flex items-center space-x-2 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter username"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="btn-shine w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm rounded-xl shadow-lg transition disabled:opacity-50"
              >
                {loginLoading ? 'Verifying Secure Token...' : 'Sign In to Command Center'}
              </button>

              <button
                type="button"
                onClick={onBackToSite}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition pt-2 flex items-center justify-center space-x-1"
              >
                <span>← Return to Public Customer Portal</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // AUTHENTICATED COMMAND CENTER
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans">
      {/* Sleek Command Header */}
      <header className="bg-[#071324] text-white border-b border-slate-800/80 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center space-x-3 sm:space-x-8">
            {/* Logo */}
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-400 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md shrink-0">
                AH
              </div>
              <div>
                <span className="font-heading font-black text-sm sm:text-base text-white tracking-tight leading-none block">
                  Command Center
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold text-sky-400 flex items-center mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                  <span className="hidden xs:inline">Persistent </span>DB Live
                </span>
              </div>
            </div>

            {/* Navigation Tabs (Desktop) */}
            <nav className="hidden md:flex space-x-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                  activeTab === 'overview' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                  activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Inventory ({stats ? stats.total : '...'})</span>
              </button>
              <button
                onClick={() => setActiveTab('archive')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                  activeTab === 'archive' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Archive className="w-3.5 h-3.5 text-amber-300" />
                <span>Sold Out ({archiveStats.total})</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('import');
                  setImportStep(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                  activeTab === 'import' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Excel Studio</span>
              </button>
              <button
                onClick={() => setActiveTab('enquiries')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                  activeTab === 'enquiries' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Leads ({enquiries.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                  activeTab === 'settings' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* User & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onBackToSite}
              className="hidden sm:inline-flex items-center text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3.5 py-1.5 rounded-xl border border-slate-700 transition"
              title="Go to Public Customer Website"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
              <span>Public Website</span>
            </button>

            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/80 px-3 py-1.5 rounded-xl border border-red-900/60 transition"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              <span>Sign Out</span>
            </button>

            {/* Single, Clean Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2.5 rounded-xl bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700/80 transition active:scale-95"
              title={mobileNavOpen ? "Close Menu" : "Open Navigation Menu"}
              aria-label="Toggle Navigation Menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5 text-sky-300" /> : <Menu className="w-5 h-5 text-sky-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* Clean Mobile Dropdown Menu (Styled like Public Portal) */}
      {mobileNavOpen && (
        <div 
          className="md:hidden fixed inset-0 top-14 z-50 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            className="bg-[#071324] border-b border-slate-800 p-4 shadow-2xl max-h-[calc(100vh-3.5rem)] overflow-y-auto space-y-3.5 animate-in slide-in-from-top-2 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Admin Header Info */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white">Admin Command</span>
                <span className="text-slate-400 text-[10px]">({adminUser?.email || 'admin@ikf.com'})</span>
              </div>
            </div>

            {/* 6 Tabs in 2-Column Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setActiveTab('overview'); setMobileNavOpen(false); }}
                className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold transition text-left ${
                  activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0 text-sky-400" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => { setActiveTab('inventory'); setMobileNavOpen(false); }}
                className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition text-left ${
                  activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 shrink-0 text-sky-400" />
                  <span>Stock</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">
                  {stats ? stats.total : '...'}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('archive'); setMobileNavOpen(false); }}
                className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition text-left ${
                  activeTab === 'archive' ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Sold Out</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">
                  {archiveStats.total}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('import'); setImportStep(1); setMobileNavOpen(false); }}
                className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold transition text-left ${
                  activeTab === 'import' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <UploadCloud className="w-4 h-4 shrink-0 text-sky-400" />
                <span>Excel Studio</span>
              </button>

              <button
                onClick={() => { setActiveTab('enquiries'); setMobileNavOpen(false); }}
                className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition text-left ${
                  activeTab === 'enquiries' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 shrink-0 text-sky-400" />
                  <span>Leads</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">
                  {enquiries.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('settings'); setMobileNavOpen(false); }}
                className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold transition text-left ${
                  activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Settings className="w-4 h-4 shrink-0 text-sky-400" />
                <span>Settings</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => { setCreateVehicleModalOpen(true); setMobileNavOpen(false); }}
                className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Car className="w-4 h-4" />
                <span>+ Add Car</span>
              </button>
              <button
                onClick={() => { setQuickUploadModalOpen(true); setMobileNavOpen(false); }}
                className="py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Images className="w-4 h-4" />
                <span>+ Upload Photo</span>
              </button>
            </div>

            {/* Bottom Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => { onBackToSite(); setMobileNavOpen(false); }}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-sky-300 flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Public Site</span>
              </button>
              <button
                onClick={() => { handleLogout(); setMobileNavOpen(false); }}
                className="py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-950/80 border border-red-900/50 text-xs font-bold text-red-400 flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 flex-1 w-full">
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & DASHBOARD METRICS */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Header banner */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                  <Activity className="w-3.5 h-3.5 mr-1.5" />
                  Live Fleet Operations Status
                </div>
                <h2 className="text-xl sm:text-3xl font-extrabold text-[#0B192C] font-heading">
                  Automotive Dealership Control Hub
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Persistent local database active • Logged in as: <strong className="text-slate-800 break-all">{adminUser.email}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                <button
                  onClick={() => setCreateVehicleModalOpen(true)}
                  className="btn-shine px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md flex items-center justify-center space-x-1.5 transition col-span-2 sm:col-span-1"
                  title="Add an individual vehicle record directly with full details"
                >
                  <Car className="w-4 h-4 shrink-0" />
                  <span>+ Add Car Manually</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('import');
                    setImportStep(1);
                  }}
                  className="btn-shine px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold shadow-md flex items-center justify-center space-x-1.5 transition"
                >
                  <UploadCloud className="w-4 h-4 shrink-0" />
                  <span>Import Excel</span>
                </button>
                <button
                  onClick={loadAllData}
                  className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition shadow-xs flex items-center justify-center"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 8 Stats Metrics Grid */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Total Vehicles
                    </span>
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  </div>
                  <div className="text-2xl sm:text-4xl font-black text-[#0B192C] font-heading mt-1 sm:mt-2">
                    {stats.total}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-0.5 sm:mt-1 block truncate">Full database records</span>
                </div>

                <div className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Published Live
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="text-2xl sm:text-4xl font-black text-emerald-600 font-heading mt-1 sm:mt-2">
                    {stats.published}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 mt-0.5 sm:mt-1 block truncate">Live on website</span>
                </div>

                <div className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Available Stock
                    </span>
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  </div>
                  <div className="text-2xl sm:text-4xl font-black text-sky-600 font-heading mt-1 sm:mt-2">
                    {stats.available}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-sky-700 mt-0.5 sm:mt-1 block truncate">Ready for inspection</span>
                </div>

                <div className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Pending Review
                    </span>
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  </div>
                  <div className="text-2xl sm:text-4xl font-black text-amber-500 font-heading mt-1 sm:mt-2">
                    {stats.pending_review}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-amber-600 mt-0.5 sm:mt-1 block truncate">Drafts awaiting approval</span>
                </div>

                <div className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Reserved Units
                    </span>
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  </div>
                  <div className="text-2xl sm:text-4xl font-black text-purple-600 font-heading mt-1 sm:mt-2">
                    {stats.reserved}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-0.5 sm:mt-1 block truncate">Under booking deposit</span>
                </div>

                <div className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Sold Vehicles
                    </span>
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  </div>
                  <div className="text-2xl sm:text-4xl font-black text-slate-700 font-heading mt-1 sm:mt-2">
                    {stats.sold}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-0.5 sm:mt-1 block truncate">Archived sales</span>
                </div>

                <div className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Needs Photos
                    </span>
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  </div>
                  <div className="text-2xl sm:text-4xl font-black text-rose-500 font-heading mt-1 sm:mt-2">
                    {stats.missing_photos}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-rose-600 mt-0.5 sm:mt-1 block truncate">Flagged for photography</span>
                </div>

                <div className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Customer Leads
                    </span>
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  </div>
                  <div className="text-2xl sm:text-4xl font-black text-blue-700 font-heading mt-1 sm:mt-2">
                    {enquiries.length}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-blue-800 mt-0.5 sm:mt-1 block truncate">Inquiries captured</span>
                </div>
              </div>
            )}

            {/* Category Breakdown Bar with Percentage distribution */}
            {stats && stats.category_breakdown && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-extrabold text-[#0B192C] font-heading">
                    Multi-Category Fleet Distribution
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">6 Supported Sectors</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.entries(stats.category_breakdown).map(([cat, count]) => {
                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={cat} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
                        <span className="text-xs font-bold text-slate-600 block truncate">{cat}</span>
                        <strong className="text-2xl font-black text-slate-900 block mt-1">{count}</strong>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold mt-1 block">{pct}% of fleet</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Enquiries & Recent Imports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Enquiries */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    Recent Customer Inquiries
                  </h3>
                  <button
                    onClick={() => setActiveTab('enquiries')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                  >
                    View All Leads →
                  </button>
                </div>
                {enquiries.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">No inquiries received yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {enquiries.slice(0, 4).map((e) => (
                      <div key={e.id} className="py-3.5 flex justify-between items-start text-xs">
                        <div>
                          <strong className="text-slate-900 block text-sm">{e.customer_name}</strong>
                          <span className="text-slate-500 font-mono text-[11px]">{e.phone_number}</span>
                          <p className="text-slate-600 text-xs mt-1">{e.vehicle_ref}</p>
                          {e.bid_price && (
                            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              🏷 Bid: {formatPrice(e.bid_price)}
                            </span>
                          )}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          e.status === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {e.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Imports */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    Spreadsheet Upload History
                  </h3>
                  <button
                    onClick={() => {
                      setActiveTab('import');
                      setImportStep(1);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                  >
                    Open Importer →
                  </button>
                </div>
                {importHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">No spreadsheet history logged yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {importHistory.slice(0, 4).map((h) => (
                      <div key={h.id} className="py-3.5 flex justify-between items-start text-xs">
                        <div>
                          <strong className="text-slate-900 block truncate max-w-xs">{h.filename}</strong>
                          <span className="text-slate-500 text-[11px]">
                            {new Date(h.upload_date).toLocaleDateString()} • by {h.admin_user}
                          </span>
                          <div className="text-[11px] text-slate-600 font-medium mt-1">
                            Added: <strong className="text-emerald-700">{h.added_records}</strong> • 
                            Updated: <strong className="text-blue-700">{h.updated_records}</strong> • 
                            Failed: <strong className="text-rose-700">{h.failed_records}</strong>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          h.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {h.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: INVENTORY MANAGEMENT TABLE */}
        {/* ========================================================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Filter & Action Toolbar */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-between items-stretch sm:items-center">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                    placeholder="Search Loan No (LOAN_ID), reg, make, model, chassis..."
                    className="w-full pl-10 pr-8 py-2.5 text-xs rounded-xl sm:rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/60"
                  />
                  {vehicleSearch && (
                    <button
                      onClick={() => setVehicleSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick Actions: Manual Car Add & Photo Upload & Mode Switcher */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCreateVehicleModalOpen(true)}
                    className="btn-shine flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow flex items-center justify-center space-x-1.5 transition"
                    title="Add a car or vehicle record manually"
                  >
                    <Car className="w-4 h-4 shrink-0" />
                    <span>+ Add Car</span>
                  </button>

                  <button
                    onClick={() => setQuickUploadModalOpen(true)}
                    className="btn-shine px-3 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow flex items-center justify-center space-x-1.5 transition"
                    title="Upload photos for any vehicle manually"
                  >
                    <Images className="w-4 h-4 shrink-0" />
                    <span className="hidden xs:inline">+ Photo</span>
                  </button>

                  {/* View Switcher: Cards vs Table */}
                  <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-100 shrink-0">
                    <button
                      onClick={() => setInventoryViewMode('cards')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        inventoryViewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Cards View"
                    >
                      <Grid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Cards</span>
                    </button>
                    <button
                      onClick={() => setInventoryViewMode('table')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        inventoryViewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Table View"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Table</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters row in responsive grid on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-100">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="p-2.5 border rounded-xl bg-slate-50 font-semibold text-slate-700 text-xs w-full"
                >
                  <option value="all">All 7 Categories</option>
                  <option value="Own Car">Own Car</option>
                  <option value="Taxi Car">Taxi Car</option>
                  <option value="SCV">SCV</option>
                  <option value="LCV">LCV</option>
                  <option value="HCV">HCV</option>
                  <option value="Tractor">Tractor</option>
                  <option value="CE">Commercial Equipment (CE)</option>
                </select>

                <select
                  value={publicationFilter}
                  onChange={(e) => setPublicationFilter(e.target.value)}
                  className="p-2.5 border rounded-xl bg-slate-50 font-semibold text-slate-700 text-xs w-full"
                >
                  <option value="all">All Publications</option>
                  <option value="published">Published</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="draft">Draft</option>
                  <option value="unpublished">Unpublished</option>
                </select>

                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="p-2.5 border rounded-xl bg-slate-50 font-semibold text-slate-700 text-xs w-full"
                >
                  <option value="all">All Availabilities</option>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium pt-1">
                <span>Showing <strong>{vehicles.length}</strong> vehicle records</span>
                <span className="text-[11px] text-slate-400">
                  {inventoryViewMode === 'cards' ? 'Tap card to edit or manage photos' : 'Click row to edit details'}
                </span>
              </div>
            </div>

            {inventoryViewMode === 'table' ? (
              /* Inventory Table */
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="sm:hidden px-3.5 py-2 bg-blue-50 border-b border-blue-100 text-[11px] text-blue-800 flex items-center justify-between">
                  <span>👉 Scroll table horizontally to view all fields</span>
                  <button onClick={() => setInventoryViewMode('cards')} className="font-bold underline text-blue-700">
                    Switch to Cards
                  </button>
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-black text-[10px] tracking-wider">
                      <th className="py-3.5 px-4">
                        <div className="flex items-center space-x-1">
                          <span>Loan No</span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-extrabold text-[9px] uppercase">Excel Key</span>
                        </div>
                      </th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Registration</th>
                      <th className="py-3.5 px-4">Make & Model</th>
                      <th className="py-3.5 px-4">Year</th>
                      <th className="py-3.5 px-4">Source Price (B&gt;Prices)</th>
                      <th className="py-3.5 px-4">Public Price</th>
                      <th className="py-3.5 px-4">Location</th>
                      <th className="py-3.5 px-4">Publication</th>
                      <th className="py-3.5 px-4">Availability</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vehicles.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400">
                          No vehicle records match query.
                        </td>
                      </tr>
                    ) : (
                      vehicles.map((v) => (
                        <tr 
                          key={v.id} 
                          onClick={() => openDrawer(v, 'details')}
                          className="hover:bg-blue-50/40 transition group cursor-pointer"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(v.source_loan_id, v.id);
                                }}
                                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/80 transition text-xs font-mono font-bold"
                                title="Click to copy Loan No (Matches LOAN_ID in Excel data)"
                              >
                                <span>{v.source_loan_id || 'N/A'}</span>
                                {copiedId === v.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3 text-blue-500 opacity-60 hover:opacity-100" />
                                )}
                              </button>
                            </div>
                            <span className="text-[9px] text-slate-400 font-sans block mt-0.5">Maps to Excel data</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900">{v.vehicle_category}</span>
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                            {v.registration_number || <span className="text-slate-400">Unregistered</span>}
                          </td>

                          <td className="py-3 px-4">
                            <strong className="text-slate-900 block text-xs">{v.make} {v.model}</strong>
                            <span className="text-slate-400 text-[10px] truncate max-w-[140px] block">{v.original_vehicle_description}</span>
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {v.manufacturing_year}
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-500">
                            {formatPrice(v.source_price)}
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-blue-700 text-sm">
                            {formatPrice(v.public_listing_price)}
                          </td>

                          <td className="py-3 px-4 text-slate-600 text-[11px]">
                            <div className="font-semibold text-slate-800">{v.branch_location}</div>
                            {v.yard_name && <div className="text-slate-400 text-[10px]">{v.yard_name}</div>}
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickTogglePublish(v);
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition ${
                                v.publication_status === 'published'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : v.publication_status === 'pending_review'
                                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                              title="Click to toggle publish status"
                            >
                              {v.publication_status === 'published' ? '● Published' : v.publication_status}
                            </button>
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickToggleSold(v);
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition ${
                                v.availability_status === 'available'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : v.availability_status === 'reserved'
                                  ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                              title="Click to toggle sold status"
                            >
                              {v.availability_status}
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {/* Manage Photos button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDrawer(v, 'photos');
                                }}
                                className="relative p-2 rounded-xl text-sky-600 hover:text-sky-700 hover:bg-sky-50 transition"
                                title="Manage Photos & Upload"
                              >
                                <Images className="w-4 h-4" />
                                {v.images && v.images.length > 0 && (
                                  <span className="absolute -top-1 -right-1 bg-sky-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                    {v.images.length}
                                  </span>
                                )}
                              </button>

                              {/* Edit Full Listing */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDrawer(v, 'details');
                                }}
                                className="p-2 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition"
                                title="Edit Vehicle Details"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Internal details inspection */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDrawer(v, 'internal');
                                }}
                                className="p-2 rounded-xl text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 transition"
                                title="View Private Internal Confidential Data"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Delete Vehicle */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVehicle(v.id, `${v.make} ${v.model}`);
                                }}
                                className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                                title="Delete Vehicle Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* RESPONSIVE CARDS VIEW (Optimized for Mobile/Tablet) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {vehicles.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                    No vehicle records match query.
                  </div>
                ) : (
                  vehicles.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => openDrawer(v, 'details')}
                      className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer flex flex-col group"
                    >
                      {/* Image header with badges */}
                      <div className="relative h-44 bg-slate-900 overflow-hidden">
                        <img
                          src={v.primary_image_url}
                          alt={v.make}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            v.publication_status === 'published' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {v.publication_status}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            v.availability_status === 'available' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'
                          }`}>
                            {v.availability_status}
                          </span>
                        </div>
                        <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-sm text-white px-2 py-1 rounded-xl text-[10px] font-bold flex items-center space-x-1">
                          <Images className="w-3 h-3 text-sky-400" />
                          <span>{v.images?.length || 1} Photos</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">
                                {v.vehicle_category} • {v.manufacturing_year}
                              </span>
                              <h3 className="font-heading font-black text-slate-900 text-base leading-tight">
                                {v.make} {v.model}
                              </h3>
                            </div>
                            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                              {v.registration_number || 'No Reg'}
                            </span>
                          </div>

                          <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                            <div>Loan No (Excel): <strong className="text-blue-700 font-mono font-bold">{v.source_loan_id || 'N/A'}</strong></div>
                            <div>Branch: <strong className="text-slate-700">{v.branch_location}</strong></div>
                            {v.yard_name && <div>Yard: <span className="text-slate-600">{v.yard_name}</span></div>}
                          </div>
                        </div>

                        {/* Price & Actions */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Public Price</span>
                            <span className="font-mono font-black text-base text-blue-700">
                              {formatPrice(v.public_listing_price)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openDrawer(v, 'photos')}
                              className="p-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 transition"
                              title="Manage Photos"
                            >
                              <Images className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDrawer(v, 'details')}
                              className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                              title="Edit Vehicle"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteVehicle(v.id, `${v.make} ${v.model}`)}
                              className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: SOLD & DELETED ARCHIVE (FILTERABLE BY MONTH & YEAR)  */}
        {/* ========================================================= */}
        {activeTab === 'archive' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header with Stats & Export Button */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
                    <Archive className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#0B192C] font-heading">
                    Sold Out & Removed Vehicles History
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Historical repository of vehicles marked sold or removed from active inventory • Filterable by month & year
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadArchiveExcel}
                  disabled={downloadingArchiveExcel || archiveRecords.length === 0}
                  className="px-4 py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition active:scale-98 disabled:opacity-50"
                  title="Download current filtered sold out records as Excel spreadsheet"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                  <span>
                    {downloadingArchiveExcel
                      ? 'Generating...'
                      : `Export Sold Out Excel (${archiveRecords.length})`}
                  </span>
                </button>

                {/* View Switcher: Cards vs Table */}
                <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-100 shrink-0">
                  <button
                    onClick={() => setArchiveViewMode('cards')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      archiveViewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Cards View"
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cards</span>
                  </button>
                  <button
                    onClick={() => setArchiveViewMode('table')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      archiveViewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Table</span>
                  </button>
                </div>

                <button
                  onClick={loadArchive}
                  className="p-2.5 rounded-xl sm:rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                  title="Refresh archive data"
                >
                  <RefreshCw className={`w-4 h-4 ${archiveLoading ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Quick KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Archived</span>
                <strong className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">{archiveStats.total}</strong>
                <span className="text-[10px] text-slate-500">Historical records</span>
              </div>

              <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-emerald-100 bg-emerald-50/20 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">Sold Out Units</span>
                <strong className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 block">{archiveStats.total_sold}</strong>
                <span className="text-[10px] text-emerald-700/80">Completed auctions</span>
              </div>

              <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-rose-100 bg-rose-50/20 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-rose-700 block tracking-wider">Deleted Records</span>
                <strong className="text-xl sm:text-2xl font-black text-rose-600 mt-1 block">{archiveStats.total_deleted}</strong>
                <span className="text-[10px] text-rose-700/80">Removed by admin</span>
              </div>

              <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-blue-100 bg-blue-50/20 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-blue-700 block tracking-wider">Total Realized Value</span>
                <strong className="text-xl sm:text-2xl font-black text-blue-700 mt-1 block">{formatPrice(archiveStats.total_value)}</strong>
                <span className="text-[10px] text-blue-600/80">Cumulative value</span>
              </div>
            </div>

            {/* Filters Row: Month, Year, Action, Search */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={archiveSearch}
                    onChange={(e) => setArchiveSearch(e.target.value)}
                    placeholder="Search by Loan No, Registration, Make, Model, Customer, Location..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl sm:rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/60"
                  />
                  {archiveSearch && (
                    <button
                      onClick={() => setArchiveSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Controls: Year & Month & Action */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Year Filter */}
                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-500 shrink-0">Year:</span>
                    <select
                      value={archiveYear}
                      onChange={(e) => setArchiveYear(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-full"
                    >
                      <option value="all">All Years</option>
                      {archiveAvailableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Month Filter */}
                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-500 shrink-0">Month:</span>
                    <select
                      value={archiveMonth}
                      onChange={(e) => setArchiveMonth(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-full"
                    >
                      <option value="all">All 12 Months</option>
                      <option value="1">January (01)</option>
                      <option value="2">February (02)</option>
                      <option value="3">March (03)</option>
                      <option value="4">April (04)</option>
                      <option value="5">May (05)</option>
                      <option value="6">June (06)</option>
                      <option value="7">July (07)</option>
                      <option value="8">August (08)</option>
                      <option value="9">September (09)</option>
                      <option value="10">October (10)</option>
                      <option value="11">November (11)</option>
                      <option value="12">December (12)</option>
                    </select>
                  </div>

                  {/* Action Type Filter */}
                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-500 shrink-0">Type:</span>
                    <select
                      value={archiveAction}
                      onChange={(e) => setArchiveAction(e.target.value as any)}
                      className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-full"
                    >
                      <option value="all">All Actions</option>
                      <option value="sold">Sold Out Only</option>
                      <option value="deleted">Deleted Only</option>
                    </select>
                  </div>
                </div>

                {(archiveYear !== 'all' || archiveMonth !== 'all' || archiveAction !== 'all' || archiveSearch !== '') && (
                  <button
                    onClick={() => {
                      setArchiveYear('all');
                      setArchiveMonth('all');
                      setArchiveAction('all');
                      setArchiveSearch('');
                    }}
                    className="text-xs text-amber-700 hover:text-amber-900 font-bold px-2 py-1 underline self-center"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {archiveViewMode === 'table' ? (
              /* Archive Table */
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="sm:hidden px-3.5 py-2 bg-amber-50 border-b border-amber-100 text-[11px] text-amber-800 flex items-center justify-between">
                  <span>👉 Scroll table horizontally to view all fields</span>
                  <button onClick={() => setArchiveViewMode('cards')} className="font-bold underline text-amber-700">
                    Switch to Cards
                  </button>
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-black text-[10px] tracking-wider">
                      <th className="py-3.5 px-4">Action</th>
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4">Month / Year</th>
                      <th className="py-3.5 px-4">
                        <div className="flex items-center space-x-1">
                          <span>Loan No</span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-extrabold text-[9px] uppercase">Excel Key</span>
                        </div>
                      </th>
                      <th className="py-3.5 px-4">Registration</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Make & Model</th>
                      <th className="py-3.5 px-4">Location & Yard</th>
                      <th className="py-3.5 px-4">Customer Name</th>
                      <th className="py-3.5 px-4">Final / Sold Price</th>
                      <th className="py-3.5 px-4">Remarks / Notes</th>
                      <th className="py-3.5 px-4">Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {archiveRecords.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-14 text-center text-slate-400">
                          <Archive className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <strong className="block text-slate-700 text-sm">No archive records match this filter</strong>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Try selecting "All Months" or "All Years" to view historical sold and deleted vehicles.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      archiveRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-amber-50/30 transition">
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              r.action_type === 'sold'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/80'
                                : 'bg-rose-100 text-rose-800 border border-rose-300/80'
                            }`}>
                              {r.action_type === 'sold' ? '● SOLD OUT' : '✕ DELETED'}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                            {r.action_date ? new Date(r.action_date).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            }) : '—'}
                          </td>

                          <td className="py-3 px-4 text-slate-700 font-semibold whitespace-nowrap">
                            {r.action_month_name} {r.action_year}
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleCopy(r.source_loan_id, r.id)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-mono text-xs font-bold"
                              title="Click to copy Loan No"
                            >
                              <span>{r.source_loan_id || 'N/A'}</span>
                              {copiedId === r.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-blue-400 opacity-60 hover:opacity-100" />
                              )}
                            </button>
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-slate-800 text-[11px]">
                            {r.registration_number || <span className="text-slate-400">Unregistered</span>}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800">{r.vehicle_category}</span>
                          </td>

                          <td className="py-3 px-4">
                            <strong className="text-slate-900 block">{r.make} {r.model}</strong>
                            <span className="text-slate-400 text-[10px]">{r.manufacturing_year} • {r.variant || 'Standard'}</span>
                          </td>

                          <td className="py-3 px-4 text-slate-600 text-[11px]">
                            <div className="font-semibold text-slate-800">{r.branch_location || 'Branch'}</div>
                            {r.yard_name && <div className="text-slate-400 text-[10px]">{r.yard_name}</div>}
                          </td>

                          <td className="py-3 px-4 text-slate-700 text-xs font-medium">
                            {r.internal_customer_name || '—'}
                          </td>

                          <td className="py-3 px-4 font-mono font-black text-emerald-700 text-sm whitespace-nowrap">
                            {formatPrice(r.sold_price || r.public_listing_price)}
                          </td>

                          <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate" title={r.remarks}>
                            {r.remarks || '—'}
                          </td>

                          <td className="py-3 px-4 text-[10px] text-slate-400 font-mono">
                            {r.admin_user || 'admin'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Archive Cards View (Mobile/Touch-friendly) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {archiveRecords.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl sm:rounded-3xl border border-slate-200">
                  <Archive className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <strong className="block text-slate-700 text-sm">No archive records match this filter</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Try resetting filters to view all historical records.</p>
                </div>
              ) : (
                archiveRecords.map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition space-y-3">
                    <div className="flex justify-between items-start">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        r.action_type === 'sold'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/80'
                          : 'bg-rose-100 text-rose-800 border border-rose-300/80'
                      }`}>
                        {r.action_type === 'sold' ? '● SOLD OUT' : '✕ DELETED'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 font-semibold">
                        {r.action_month_name} {r.action_year}
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        {r.vehicle_category} • {r.manufacturing_year}
                      </div>
                      <h4 className="font-heading font-black text-slate-900 text-base leading-tight mt-0.5">
                        {r.make} {r.model} {r.variant ? `• ${r.variant}` : ''}
                      </h4>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Loan No (Excel):</span>
                        <button
                          onClick={() => handleCopy(r.source_loan_id, r.id)}
                          className="inline-flex items-center space-x-1 font-mono font-bold text-blue-700 hover:text-blue-900 text-xs"
                          title="Click to copy Loan No"
                        >
                          <span>{r.source_loan_id || 'N/A'}</span>
                          {copiedId === r.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 opacity-60" />}
                        </button>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Registration:</span>
                        <span className="font-mono font-bold text-slate-800 text-[11px]">{r.registration_number || 'Unregistered'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Yard / Location:</span>
                        <span className="font-semibold text-slate-700 text-right truncate max-w-[150px]">{r.branch_location || r.yard_name || 'Yard'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Final Price</span>
                        <span className="font-mono font-black text-base text-emerald-700">
                          {formatPrice(r.sold_price || r.public_listing_price)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Logged by</span>
                        <span className="font-mono text-xs font-semibold text-slate-600">{r.admin_user || 'admin'}</span>
                      </div>
                    </div>

                    {r.remarks && (
                      <p className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100/60">
                        "{r.remarks}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: EXCEL IMPORT STUDIO */}
        {/* ========================================================= */}
        {activeTab === 'import' && (
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200 shadow-sm space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#0B192C] font-heading">
                    Exact 16-Column Excel Import Studio
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload your vehicle spreadsheet without renaming column headers.
                  </p>
                </div>
                <a
                  href="/api/admin/import/sample-template"
                  download="AutoHub_Inventory_Template.xlsx"
                  className="btn-shine px-4 py-2.5 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center space-x-2 transition shrink-0"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Download Sample Template</span>
                </a>
              </div>

              {/* Visual 16-Column Verification Matrix */}
              <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  16 Recognized Excel Headers:
                </span>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                  {[
                    'LOAN_BRANCH', 'LOAN_ID', 'CUSTOMER_NAME', 'Aging_Days', 'Sold Data', 
                    'B>Prices', 'LOAN_PRODUCT', 'VehicleNo', 'YOM', 'MAKE&VEHICLE_DESC', 
                    'CHASIS NUMBER', 'ENGINE_NUMBER', 'PIC', 'Seized On', 'YardContactNo', 'Yard Name'
                  ].map((col) => (
                    <span key={col} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 flex items-center space-x-1">
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>{col}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
                <div className={`p-2 sm:p-2.5 rounded-xl border ${importStep === 1 ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-slate-50 text-slate-600'}`}>
                  1. Upload
                </div>
                <div className={`p-2 sm:p-2.5 rounded-xl border ${importStep === 2 ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-slate-50 text-slate-600'}`}>
                  2. Preview & Validation
                </div>
                <div className={`p-2 sm:p-2.5 rounded-xl border ${importStep === 3 || importStep === 4 ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-slate-50 text-slate-600'}`}>
                  3. Duplicates
                </div>
                <div className={`p-2 sm:p-2.5 rounded-xl border ${importStep === 6 ? 'bg-emerald-600 text-white border-emerald-600 shadow' : 'bg-slate-50 text-slate-600'}`}>
                  4. Results
                </div>
              </div>
            </div>

            {/* Manual Entry Direct Options */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Want to add vehicles without an Excel spreadsheet?</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Add individual cars manually with full specifications, yard location, pricing, and pictures directly.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => setCreateVehicleModalOpen(true)}
                  className="btn-shine flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow flex items-center justify-center space-x-1.5 transition"
                >
                  <Car className="w-4 h-4" />
                  <span>+ Add Car Manually</span>
                </button>
                <button
                  onClick={() => setQuickUploadModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 transition"
                >
                  <Images className="w-4 h-4 text-blue-600" />
                  <span>Upload Photos</span>
                </button>
              </div>
            </div>

            {/* STEP 1: UPLOAD ZONE */}
            {importStep === 1 && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 border-2 border-dashed border-slate-300 text-center shadow-sm space-y-4 hover:border-blue-400 transition">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-heading">
                    Drop your spreadsheet here
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Supports Microsoft Excel (.XLSX, .XLS) and CSV up to 25MB. High-performance transaction processing for 1,000+ rows.
                  </p>
                </div>

                <div className="pt-3">
                  <label className="btn-shine inline-flex items-center px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-md transition">
                    <UploadCloud className="w-4 h-4 mr-2" />
                    <span>Browse Spreadsheet File</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>

                {importLoading && (
                  <p className="text-xs text-blue-600 font-bold animate-pulse pt-2">
                    Parsing Excel structure and checking 16 header columns...
                  </p>
                )}
              </div>
            )}

            {/* STEP 2: PREVIEW & VALIDATION REPORT */}
            {previewReport && (importStep === 2 || importStep === 3) && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-bold text-slate-900 font-heading">
                      File Validation & Column Verification
                    </h3>
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                      {previewReport.filename}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-4 bg-slate-50 rounded-2xl border">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Total Rows</span>
                      <strong className="text-2xl font-black text-slate-900 block mt-1">{previewReport.totalRows}</strong>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-800 uppercase font-bold">Valid Records</span>
                      <strong className="text-2xl font-black text-emerald-700 block mt-1">{previewReport.validRecordsCount}</strong>
                    </div>

                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                      <span className="text-[10px] text-rose-800 uppercase font-bold">Invalid Rows</span>
                      <strong className="text-2xl font-black text-rose-700 block mt-1">{previewReport.invalidRecordsCount}</strong>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <span className="text-[10px] text-blue-800 uppercase font-bold">Duplicates Identified</span>
                      <strong className="text-2xl font-black text-blue-700 block mt-1">{previewReport.potentialDuplicatesCount}</strong>
                    </div>
                  </div>

                  {/* Detected Categories */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-600">Categories Detected: </span>
                      <span className="text-blue-700 font-bold">{previewReport.categoriesDetected.join(', ') || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Valid Photos: </span>
                      <strong className="text-slate-900">{previewReport.recordsWithPhotos}</strong> / {previewReport.totalRows}
                    </div>
                  </div>

                  {/* Invalid Rows Review */}
                  {previewReport.invalidRecords.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs space-y-2">
                      <div className="flex items-center text-red-800 font-bold">
                        <AlertTriangle className="w-4 h-4 mr-1.5 text-red-600" />
                        <span>{previewReport.invalidRecords.length} records have validation errors and will be rejected:</span>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1 text-red-700">
                        {previewReport.invalidRecords.map((inv, idx) => (
                          <div key={idx} className="bg-white p-2 rounded-lg border border-red-200">
                            <strong>Row {inv.rowIndex}:</strong> {inv.errors?.join('; ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Duplicate Strategy & Confirmation */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Select Duplicate Handling Mode
                    </h4>

                    <div className="space-y-2.5">
                      <label className="flex items-start space-x-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                        <input
                          type="radio"
                          name="importMode"
                          value="update_and_add"
                          checked={importMode === 'update_and_add'}
                          onChange={() => setImportMode('update_and_add')}
                          className="mt-1"
                        />
                        <div className="text-xs">
                          <strong className="text-slate-900 block font-bold">
                            Update existing vehicles and add new vehicles (Recommended)
                          </strong>
                          <span className="text-slate-500">
                            Matches records by LOAN_ID or Registration Number. Updates changed fields without creating duplicates.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                        <input
                          type="radio"
                          name="importMode"
                          value="add_only"
                          checked={importMode === 'add_only'}
                          onChange={() => setImportMode('add_only')}
                          className="mt-1"
                        />
                        <div className="text-xs">
                          <strong className="text-slate-900 block font-bold">
                            Add new vehicles only
                          </strong>
                          <span className="text-slate-500">
                            Skips any record whose LOAN_ID already exists in the database.
                          </span>
                        </div>
                      </label>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          checked={autoPublishApproved}
                          onChange={(e) => setAutoPublishApproved(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>Auto-publish records mapped to "Available" immediately</span>
                      </label>
                    </div>

                    <div className="pt-4 flex justify-between items-center">
                      <button
                        onClick={() => setImportStep(1)}
                        className="px-4 py-2.5 border rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        ← Back to Upload
                      </button>

                      <button
                        onClick={handleExecuteImport}
                        disabled={importLoading || previewReport.validRecordsCount === 0}
                        className="btn-shine px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        <span>{importLoading ? 'Writing to Persistent Database...' : `Execute Import (${previewReport.validRecordsCount} Records)`}</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: IMPORT RESULTS */}
            {importResult && importStep === 6 && (
              <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center shadow-sm space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 font-heading">
                  Spreadsheet Successfully Imported!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  The database transaction completed and an audit record was permanently logged.
                </p>

                <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto py-4 text-center">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Processed</span>
                    <strong className="text-xl font-bold text-slate-900 block">{importResult.summary.totalRows}</strong>
                  </div>
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-800 uppercase font-bold">Added</span>
                    <strong className="text-xl font-bold text-emerald-700 block">{importResult.summary.added}</strong>
                  </div>
                  <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100">
                    <span className="text-[10px] text-blue-800 uppercase font-bold">Updated</span>
                    <strong className="text-xl font-bold text-blue-700 block">{importResult.summary.updated}</strong>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Skipped</span>
                    <strong className="text-xl font-bold text-slate-700 block">{importResult.summary.skipped}</strong>
                  </div>
                </div>

                <div className="flex justify-center space-x-3 pt-4">
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="px-6 py-3 bg-[#0B192C] text-white text-xs font-bold rounded-2xl hover:bg-[#1E3E62] transition shadow-md"
                  >
                    View in Inventory Catalog →
                  </button>
                  <button
                    onClick={() => {
                      setImportFile(null);
                      setPreviewReport(null);
                      setImportStep(1);
                    }}
                    className="px-5 py-3 bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl hover:bg-slate-200 transition"
                  >
                    Upload Another Spreadsheet
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ENQUIRIES / LEADS */}
        {/* ========================================================= */}
        {activeTab === 'enquiries' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#0B192C] font-heading">
                  Customer Enquiries & Direct Leads
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Private operational data • Real-time customer bids & yard visit requests
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadLeadsExcel}
                  disabled={downloadingLeadsExcel}
                  className="px-3.5 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-98 disabled:opacity-50"
                  title="Download all leads into Excel spreadsheet with LOAN_ID mapping"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                  <span>{downloadingLeadsExcel ? 'Generating...' : 'Export Excel (.xlsx)'}</span>
                </button>

                {/* View Switcher: Cards vs Table */}
                <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-100 shrink-0">
                  <button
                    onClick={() => setEnquiriesViewMode('cards')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      enquiriesViewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Cards View"
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cards</span>
                  </button>
                  <button
                    onClick={() => setEnquiriesViewMode('table')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      enquiriesViewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Table</span>
                  </button>
                </div>

                <span className="px-3 py-2 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-700 font-extrabold text-xs">
                  {enquiries.length} Leads
                </span>
              </div>
            </div>

            {enquiriesViewMode === 'table' ? (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="sm:hidden px-3.5 py-2 bg-blue-50 border-b border-blue-100 text-[11px] text-blue-800 flex items-center justify-between">
                  <span>👉 Scroll table horizontally to view all fields</span>
                  <button onClick={() => setEnquiriesViewMode('cards')} className="font-bold underline text-blue-700">
                    Switch to Cards
                  </button>
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left text-xs border-collapse min-w-[750px] sm:min-w-full">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-black text-[10px]">
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Customer Name</th>
                        <th className="py-3.5 px-4">Phone Number</th>
                        <th className="py-3.5 px-4">Email</th>
                        <th className="py-3.5 px-4">Vehicle Inquired</th>
                        <th className="py-3.5 px-4">Bid / Base Price</th>
                        <th className="py-3.5 px-4">Customer Message</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Staff Notes</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {enquiries.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-slate-400">
                            No customer enquiries recorded.
                          </td>
                        </tr>
                      ) : (
                        enquiries.map((enq) => (
                          <tr key={enq.id} className={`hover:bg-slate-50 transition ${enq.bid_price ? 'bg-emerald-50/40' : ''}`}>
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {new Date(enq.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {enq.bid_price && (
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5 mb-0.5" title="Has Bid" />
                              )}
                              {enq.customer_name}
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                              <a href={`tel:${enq.phone_number}`} className="hover:text-blue-600 underline">
                                {enq.phone_number}
                              </a>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {enq.email || '—'}
                            </td>
                            <td className="py-3 px-4 font-bold text-blue-700">
                              {enq.vehicle_ref}
                            </td>
                            {/* BID / BASE PRICE COLUMN */}
                            <td className="py-3 px-4">
                              {enq.bid_price ? (
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black tracking-wide">BID</span>
                                    <span className="font-black text-emerald-700 text-sm">{formatPrice(enq.bid_price)}</span>
                                  </div>
                                  {enq.base_price && (
                                    <div className="text-[10px] text-slate-500">
                                      Base: <span className="font-semibold text-slate-700">{formatPrice(enq.base_price)}</span>
                                      {enq.bid_price > enq.base_price && (
                                        <span className="ml-1 text-emerald-600 font-bold">
                                          (+{formatPrice(enq.bid_price - enq.base_price)})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">Enquiry only</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={enq.message}>
                              {enq.message || '—'}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={enq.status}
                                onChange={(e) => handleUpdateEnquiry(enq, e.target.value, enq.admin_notes)}
                                className="px-2.5 py-1 rounded-xl text-[11px] font-bold border bg-white focus:outline-none"
                              >
                                <option value="new">New</option>
                                <option value="in_progress">In Progress</option>
                                <option value="contacted">Contacted</option>
                                <option value="closed">Closed</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-[11px]">
                              {enq.admin_notes || <span className="text-slate-400 italic">No notes</span>}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setEditingEnquiry({ ...enq })}
                                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition"
                              >
                                View / Notes
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Responsive Leads Cards View (Mobile/Touch-Friendly) */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {enquiries.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl sm:rounded-3xl border border-slate-200">
                    No customer enquiries recorded.
                  </div>
                ) : (
                  enquiries.map((enq) => (
                    <div
                      key={enq.id}
                      className={`bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition space-y-3 ${
                        enq.bid_price ? 'ring-1 ring-emerald-500/25 bg-gradient-to-b from-emerald-50/20 to-white' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-heading font-black text-slate-900 text-base leading-tight flex items-center gap-1.5">
                            {enq.bid_price && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Has Bid" />
                            )}
                            {enq.customer_name}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                            {new Date(enq.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </span>
                        </div>

                        <select
                          value={enq.status}
                          onChange={(e) => handleUpdateEnquiry(enq, e.target.value, enq.admin_notes)}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold border bg-white focus:outline-none"
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="contacted">Contacted</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      {/* Direct Click-to-Call and Email on Mobile */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <a
                          href={`tel:${enq.phone_number}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold font-mono transition"
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                          <span>{enq.phone_number}</span>
                        </a>
                        {enq.email && (
                          <a
                            href={`mailto:${enq.email}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition truncate max-w-[200px]"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span className="truncate">{enq.email}</span>
                          </a>
                        )}
                      </div>

                      {/* Vehicle Reference & Bid Info */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                        <div className="text-[11px] text-slate-500 font-medium">Vehicle Inquired:</div>
                        <div className="font-bold text-blue-900">{enq.vehicle_ref}</div>

                        {enq.bid_price ? (
                          <div className="pt-2 mt-1 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black uppercase">
                              BID OFFER
                            </span>
                            <span className="font-mono font-black text-emerald-700 text-sm">
                              {formatPrice(enq.bid_price)}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {/* Customer Message */}
                      {enq.message && (
                        <p className="text-[11px] text-slate-600 italic bg-slate-50/60 p-2 rounded-lg border border-slate-100 line-clamp-2">
                          "{enq.message}"
                        </p>
                      )}

                      {/* Staff notes & View button */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 truncate flex-1">
                          {enq.admin_notes ? `Notes: ${enq.admin_notes}` : <span className="italic text-slate-400">No staff notes</span>}
                        </span>
                        <button
                          onClick={() => setEditingEnquiry({ ...enq })}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition shrink-0"
                        >
                          View / Notes
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: SETTINGS */}
        {/* ========================================================= */}
        {activeTab === 'settings' && settings && (
          <form onSubmit={handleSaveSettings} className="max-w-3xl mx-auto space-y-6">
            {settingsSaved && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dealership configuration and status mappings saved to database!</span>
              </div>
            )}

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Dealership Brand & Public Contact Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={settings.brand_name}
                    onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })}
                    className="w-full p-3 border rounded-2xl focus:ring-2 focus:ring-blue-600 bg-slate-50/60"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Public Contact Phone</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full p-3 border rounded-2xl focus:ring-2 focus:ring-blue-600 bg-slate-50/60"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    value={settings.whatsapp_number}
                    onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                    className="w-full p-3 border rounded-2xl focus:ring-2 focus:ring-blue-600 bg-slate-50/60"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Public Enquiries Email</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full p-3 border rounded-2xl focus:ring-2 focus:ring-blue-600 bg-slate-50/60"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Central Logistics Yard Address</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full p-3 border rounded-2xl focus:ring-2 focus:ring-blue-600 bg-slate-50/60"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Privacy Controls & Price Label
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Default Public Price Label</label>
                  <input
                    type="text"
                    value={settings.default_price_label}
                    onChange={(e) => setSettings({ ...settings, default_price_label: e.target.value })}
                    placeholder="Guide Price"
                    className="w-full p-3 border rounded-2xl max-w-sm bg-slate-50/60"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.public_show_registration}
                      onChange={(e) => setSettings({ ...settings, public_show_registration: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-800 font-semibold">
                      Display vehicle registration number publicly on cards and detail page (uncheck to mask)
                    </span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.public_show_yard_name}
                      onChange={(e) => setSettings({ ...settings, public_show_yard_name: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-800 font-semibold">
                      Display specific yard name publicly (e.g. "GT Road Logistics Yard")
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-shine w-full py-3.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white font-bold text-xs rounded-2xl shadow-md transition"
            >
              Save Dealership Settings
            </button>
          </form>
        )}
      </main>

      {/* ========================================================= */}
      {/* UNIFIED VEHICLE MANAGEMENT DRAWER (SLIDE-IN PANEL)        */}
      {/* ========================================================= */}
      {drawerVehicle && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={closeDrawer}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" />

          {/* Drawer Container */}
          <div 
            className="relative w-full sm:max-w-xl md:max-w-2xl bg-white h-full flex flex-col shadow-2xl overflow-hidden z-10 animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="bg-[#071324] text-white p-5 flex items-start justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center space-x-3.5">
                <div 
                  className="w-16 h-14 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 relative cursor-pointer group"
                  onClick={() => drawerVehicle.primary_image_url && setLightboxImg(drawerVehicle.primary_image_url)}
                  title="Click to view full photo"
                >
                  <img 
                    src={drawerVehicle.primary_image_url} 
                    alt={drawerVehicle.make} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                      {drawerVehicle.vehicle_category}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-[10px] font-bold text-slate-300">
                      Year {drawerVehicle.manufacturing_year}
                    </span>
                  </div>
                  <h2 className="font-heading font-black text-lg text-white leading-tight mt-0.5">
                    {drawerVehicle.make} {drawerVehicle.model} {drawerVehicle.variant ? `• ${drawerVehicle.variant}` : ''}
                  </h2>
                  <div className="flex items-center space-x-2 mt-1.5">
                    <span className="font-mono text-[11px] font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                      {drawerVehicle.registration_number || drawerVehicle.source_loan_id || 'No Reg'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      drawerVehicle.publication_status === 'published' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {drawerVehicle.publication_status}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      drawerVehicle.availability_status === 'available' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'
                    }`}>
                      {drawerVehicle.availability_status}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={closeDrawer} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Close Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 shrink-0 bg-slate-50">
              <button
                onClick={() => setDrawerTab('details')}
                className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center space-x-1.5 border-b-2 ${
                  drawerTab === 'details'
                    ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Vehicle Details</span>
              </button>

              <button
                onClick={() => setDrawerTab('photos')}
                className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center space-x-1.5 border-b-2 ${
                  drawerTab === 'photos'
                    ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Images className="w-3.5 h-3.5" />
                <span>Photos ({drawerVehicle.images?.length || 0})</span>
              </button>

              <button
                onClick={() => setDrawerTab('internal')}
                className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center space-x-1.5 border-b-2 ${
                  drawerTab === 'internal'
                    ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Restricted Data</span>
              </button>
            </div>

            {/* Drawer Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* ==================================================== */}
              {/* TAB 1: EDIT ALL DETAILS                              */}
              {/* ==================================================== */}
              {drawerTab === 'details' && (
                <form onSubmit={handleDrawerSave} className="space-y-4 text-xs">
                  {drawerSaved && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-800 font-bold animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Changes saved successfully to database!</span>
                    </div>
                  )}

                  {/* Pricing row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Public Display Price (₹)</label>
                      <input
                        type="number"
                        value={drawerVehicle.public_listing_price || ''}
                        onChange={(e) => setDrawerVehicle({ ...drawerVehicle, public_listing_price: Number(e.target.value) })}
                        className="w-full p-2.5 border rounded-2xl font-mono text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Public Price Label</label>
                      <input
                        type="text"
                        value={drawerVehicle.public_price_label || ''}
                        onChange={(e) => setDrawerVehicle({ ...drawerVehicle, public_price_label: e.target.value })}
                        placeholder="Guide Price"
                        className="w-full p-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  {/* Status row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Publication Status</label>
                      <select
                        value={drawerVehicle.publication_status}
                        onChange={(e) => setDrawerVehicle({ ...drawerVehicle, publication_status: e.target.value as PublicationStatus })}
                        className="w-full p-2.5 border rounded-2xl bg-white font-bold text-slate-800"
                      >
                        <option value="published">Published (Visible Publicly)</option>
                        <option value="pending_review">Pending Review (Draft)</option>
                        <option value="draft">Draft</option>
                        <option value="unpublished">Unpublished (Hidden)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Availability Status</label>
                      <select
                        value={drawerVehicle.availability_status}
                        onChange={(e) => setDrawerVehicle({ ...drawerVehicle, availability_status: e.target.value as AvailabilityStatus })}
                        className="w-full p-2.5 border rounded-2xl bg-white font-bold text-slate-800"
                      >
                        <option value="available">Available (Open for Bids/Enquiry)</option>
                        <option value="reserved">Reserved (Under Discussion)</option>
                        <option value="sold">Sold (Marked Inactive)</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>
                  </div>

                  {/* Category, Registration & Loan No */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Vehicle Category</label>
                      <select
                        value={drawerVehicle.vehicle_category}
                        onChange={(e) => setDrawerVehicle({ ...drawerVehicle, vehicle_category: e.target.value as VehicleCategory })}
                        className="w-full p-2.5 border rounded-2xl bg-white font-bold text-slate-800"
                      >
                        <option value="Own Car">Own Car</option>
                        <option value="Taxi Car">Taxi Car</option>
                        <option value="SCV">SCV</option>
                        <option value="LCV">LCV</option>
                        <option value="HCV">HCV</option>
                        <option value="Tractor">Tractor</option>
                        <option value="CE">CE (Commercial Equipment)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Registration Number</label>
                      <input
                        type="text"
                        value={drawerVehicle.registration_number || ''}
                        onChange={(e) => setDrawerVehicle({ ...drawerVehicle, registration_number: e.target.value })}
                        placeholder="e.g. MH-02-AB-1234"
                        className="w-full p-2.5 border rounded-2xl font-mono uppercase focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 flex items-center justify-between mb-1">
                        <span>Loan No (LOAN_ID)</span>
                        <span className="text-[9px] text-blue-600 font-extrabold uppercase">Excel</span>
                      </label>
                      <input
                        type="text"
                        value={drawerVehicle.source_loan_id || ''}
                        onChange={(e) => setDrawerVehicle({ ...drawerVehicle, source_loan_id: e.target.value })}
                        placeholder="e.g. LN-2024-001"
                        className="w-full p-2.5 border rounded-2xl font-mono font-bold text-blue-800 bg-blue-50/40 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  {/* Make, Model, Variant, Year */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="col-span-1">
                      <label className="font-bold text-slate-700 block mb-1">Make</label>
                      <input
                        type="text"
                        value={drawerVehicle.make || ''}
                        onChange={(e) => setDrawerVehicle({ ...drawerVehicle, make: e.target.value })}
                        className="w-full p-2.5 border rounded-2xl"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="font-bold text-slate-700 block mb-1">Model</label>
                      <input
                        type="text"
                        value={drawerVehicle.model || ''}
                        onChange={(e) => setDrawerVehicle({ ...drawerVehicle, model: e.target.value })}
                        className="w-full p-2.5 border rounded-2xl"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="font-bold text-slate-700 block mb-1">Variant</label>
                      <input
                        type="text"
                        value={drawerVehicle.variant || ''}
                        onChange={(e) => setDrawerVehicle({ ...drawerVehicle, variant: e.target.value })}
                        placeholder="e.g. VXI / 4x4"
                        className="w-full p-2.5 border rounded-2xl"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="font-bold text-slate-700 block mb-1">Mfg Year</label>
                      <input
                        type="number"
                        value={drawerVehicle.manufacturing_year || ''}
                        onChange={(e) => setDrawerVehicle({ ...drawerVehicle, manufacturing_year: Number(e.target.value) })}
                        className="w-full p-2.5 border rounded-2xl font-mono"
                      />
                    </div>
                  </div>

                  {/* Branch & Yard */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Loan Branch / Hub Location</label>
                      <input
                        type="text"
                        value={drawerVehicle.branch_location || ''}
                        onChange={(e) => setDrawerVehicle({ ...drawerVehicle, branch_location: e.target.value })}
                        placeholder="e.g. Jaipur Central"
                        className="w-full p-2.5 border rounded-2xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Logistics Yard Name</label>
                      <input
                        type="text"
                        value={drawerVehicle.yard_name || ''}
                        onChange={(e) => setDrawerVehicle({ ...drawerVehicle, yard_name: e.target.value })}
                        placeholder="e.g. Transport Nagar Yard"
                        className="w-full p-2.5 border rounded-2xl"
                      />
                    </div>
                  </div>

                  {/* Public Description */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Public Marketplace Description</label>
                    <textarea
                      rows={3}
                      value={drawerVehicle.public_description || ''}
                      onChange={(e) => setDrawerVehicle({ ...drawerVehicle, public_description: e.target.value })}
                      placeholder="Highlights, vehicle condition, documentation available..."
                      className="w-full p-2.5 border rounded-2xl"
                    />
                  </div>

                  {/* Action Buttons: Delete + Save */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleDrawerDelete}
                      className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Vehicle</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={closeDrawer}
                        className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={drawerSaving}
                        className="btn-shine flex items-center space-x-1.5 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                      >
                        {drawerSaving ? (
                          <span>Saving...</span>
                        ) : drawerSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Saved!</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ==================================================== */}
              {/* TAB 2: PHOTOS GALLERY & MANUAL UPLOAD                */}
              {/* ==================================================== */}
              {drawerTab === 'photos' && (
                <div className="space-y-6 text-xs">
                  {/* Photo Gallery Grid */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-heading font-black text-slate-900 text-sm">
                        Attached Photographs ({drawerVehicle.images?.length || 0})
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        ⭐ Gold badge indicates primary cover photo
                      </span>
                    </div>

                    {!drawerVehicle.images || drawerVehicle.images.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-2">
                        <Images className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-700">No photos attached yet</p>
                        <p className="text-slate-400 text-[11px]">Use the upload form below to add images manually.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {drawerVehicle.images.map((img) => (
                          <div 
                            key={img.id} 
                            className={`group relative rounded-2xl overflow-hidden border-2 bg-slate-900 transition flex flex-col ${
                              img.is_primary ? 'border-amber-400 shadow-md ring-2 ring-amber-400/20' : 'border-slate-200'
                            }`}
                          >
                            <div className="h-32 w-full relative overflow-hidden">
                              <img 
                                src={img.image_url} 
                                alt="Vehicle photo" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                                onClick={() => setLightboxImg(img.image_url)}
                              />
                              {img.is_primary && (
                                <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center space-x-1 shadow">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  <span>Cover Photo</span>
                                </div>
                              )}
                              <button
                                onClick={() => setLightboxImg(img.image_url)}
                                className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
                                title="Zoom Image"
                              >
                                <ZoomIn className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Card Footer actions */}
                            <div className="p-2 bg-white flex items-center justify-between border-t border-slate-100">
                              {!img.is_primary ? (
                                <button
                                  type="button"
                                  disabled={settingPrimaryPhotoId === img.id}
                                  onClick={() => handleDrawerSetPrimaryPhoto(img.id)}
                                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                >
                                  <Star className="w-3 h-3" />
                                  <span>{settingPrimaryPhotoId === img.id ? 'Setting...' : 'Set Cover'}</span>
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-600 flex items-center space-x-1">
                                  <Check className="w-3 h-3" />
                                  <span>Active Cover</span>
                                </span>
                              )}

                              <button
                                type="button"
                                disabled={deletingPhotoId === img.id}
                                onClick={() => handleDrawerDeletePhoto(img.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Manual Upload Section */}
                  <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/80 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-heading font-black text-slate-900 text-sm flex items-center space-x-2">
                        <PlusCircle className="w-4 h-4 text-blue-600" />
                        <span>Upload Additional Photo</span>
                      </h4>
                      {/* Mode toggle */}
                      <div className="flex border rounded-xl overflow-hidden bg-white text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setDrawerUploadMode('file')}
                          className={`px-3 py-1 transition ${drawerUploadMode === 'file' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          From Computer
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrawerUploadMode('url')}
                          className={`px-3 py-1 transition ${drawerUploadMode === 'url' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          Image URL
                        </button>
                      </div>
                    </div>

                    {/* Mode 1: File Upload (Drag & Drop + Input) */}
                    {drawerUploadMode === 'file' ? (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDrawerDragOver(true); }}
                        onDragLeave={() => setDrawerDragOver(false)}
                        onDrop={handleDrop}
                        className={`p-6 border-2 border-dashed rounded-2xl text-center transition cursor-pointer ${
                          drawerDragOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 bg-white hover:border-slate-400'
                        }`}
                        onClick={() => drawerPhotoInputRef.current?.click()}
                      >
                        <input
                          ref={drawerPhotoInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setDrawerUploadFile(e.target.files[0]);
                            }
                          }}
                        />
                        <ImagePlus className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        {drawerUploadFile ? (
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{drawerUploadFile.name}</p>
                            <p className="text-[11px] text-slate-500">{(drawerUploadFile.size / 1024).toFixed(0)} KB • Ready to upload</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-bold text-slate-800 text-xs">Drag and drop photo here or browse</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Supports JPEG, PNG, WebP up to 10MB</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Mode 2: Direct Image URL */
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 block">External Image URL</label>
                        <div className="relative">
                          <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="url"
                            value={drawerUploadUrl}
                            onChange={(e) => setDrawerUploadUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="w-full pl-9 pr-4 py-2.5 border rounded-2xl bg-white focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400">Direct links from Unsplash, Google Drive CDN, or cloud storage.</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={drawerUploadPrimary}
                          onChange={(e) => setDrawerUploadPrimary(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span className="font-bold text-slate-700 text-xs">Set as primary cover photo immediately</span>
                      </label>

                      <button
                        type="button"
                        disabled={drawerUploading || (drawerUploadMode === 'file' ? !drawerUploadFile : !drawerUploadUrl.trim())}
                        onClick={handleDrawerUploadPhoto}
                        className="btn-shine px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow flex items-center justify-center space-x-2 transition disabled:opacity-50"
                      >
                        {drawerUploading ? (
                          <span>Uploading Photo...</span>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" />
                            <span>Upload & Attach Photo</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB 3: RESTRICTED INTERNAL CONFIDENTIAL DATA         */}
              {/* ==================================================== */}
              {drawerTab === 'internal' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-2xl text-xs space-y-1">
                    <strong className="flex items-center font-bold text-rose-300">
                      <ShieldAlert className="w-4 h-4 mr-1.5 text-rose-400" />
                      Confidential Banking & Logistics Record
                    </strong>
                    <p className="text-[11px] text-rose-200/90">
                      These fields are strictly private to internal personnel. They are NEVER sent over customer-facing endpoints.
                    </p>
                  </div>

                  <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 space-y-4 font-mono text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-sans uppercase block">LOAN_ID</span>
                        <div className="text-white font-bold mt-0.5">{drawerVehicle.source_loan_id || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-sans uppercase block">INTERNAL CUSTOMER NAME</span>
                        <div className="text-white font-bold mt-0.5">{drawerVehicle.internal_customer_name || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 font-sans uppercase block">AGING DAYS</span>
                        <div className="text-white font-bold mt-0.5">{drawerVehicle.internal_aging_days ?? 'N/A'} Days</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-sans uppercase block">SEIZED ON DATE</span>
                        <div className="text-white font-bold mt-0.5">{drawerVehicle.internal_seized_on || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-400 font-sans uppercase block">CHASSIS NUMBER</span>
                      <div className="text-white font-bold mt-0.5 text-sm">{drawerVehicle.internal_chassis_number || 'N/A'}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-400 font-sans uppercase block">ENGINE NUMBER</span>
                      <div className="text-white font-bold mt-0.5 text-sm">{drawerVehicle.internal_engine_number || 'N/A'}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-400 font-sans uppercase block">YARD CONTACT PHONE</span>
                      <div className="text-white font-bold mt-0.5 text-sm text-sky-400">{drawerVehicle.internal_yard_contact || 'N/A'}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <div>Source System: <span className="text-slate-200">{drawerVehicle.source_system}</span></div>
                      <div>Record ID: <span className="text-slate-200">{drawerVehicle.source_record_id}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MANUAL CAR / VEHICLE CREATION (NO EXCEL NEEDED)     */}
      {/* ========================================================= */}
      {createVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full my-2 sm:my-6 p-4 sm:p-8 shadow-2xl border border-slate-200 space-y-4 sm:space-y-6 max-h-[94vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black text-slate-900 font-heading">
                      Add Vehicle Details Manually
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 tracking-wide">
                      Direct Entry
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload car details directly without an Excel file. Instantly indexed into inventory and marketplace.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCreateVehicleModalOpen(false)} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message if any */}
            {createVehicleError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createVehicleError}</span>
              </div>
            )}

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateVehicleSubmit} className="space-y-6 overflow-y-auto pr-1">
              {/* SECTION 1: Vehicle Identity */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">1</span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Vehicle Classification & Specifications
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Vehicle Category *
                    </label>
                    <select
                      value={newVehicle.vehicle_category}
                      onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_category: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Own Car">Own Car (Sedan / Hatchback / SUV)</option>
                      <option value="Taxi Car">Taxi / Commercial Cab</option>
                      <option value="SCV">SCV (Small Commercial - Ace, Bolero Maxi)</option>
                      <option value="LCV">LCV (Light Commercial Vehicle)</option>
                      <option value="HCV">HCV (Heavy Commercial / Trucks)</option>
                      <option value="Tractor">Tractor / Farm Equipment</option>
                      <option value="CE">CE (Commercial Equipment - JCB, Tippers)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Make / Brand *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maruti Suzuki, Mahindra, Tata"
                      value={newVehicle.make}
                      onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Model *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Brezza, Bolero, Swift, Intra"
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Variant / Trim
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ZXI+, VXI, Power+, STD"
                      value={newVehicle.variant}
                      onChange={(e) => setNewVehicle({ ...newVehicle, variant: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Manufacturing Year
                    </label>
                    <input
                      type="number"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      value={newVehicle.manufacturing_year}
                      onChange={(e) => setNewVehicle({ ...newVehicle, manufacturing_year: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Registration Number / Number Plate
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. RJ14 CB 4821"
                      value={newVehicle.registration_number}
                      onChange={(e) => setNewVehicle({ ...newVehicle, registration_number: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold uppercase focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Pricing & Public Listing */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center">2</span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Pricing & Bidding Settings
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Base / Asking Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      placeholder="e.g. 450000"
                      value={newVehicle.public_listing_price}
                      onChange={(e) => setNewVehicle({ ...newVehicle, public_listing_price: e.target.value, source_price: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {newVehicle.public_listing_price ? formatPrice(Number(newVehicle.public_listing_price)) : 'Customers bid above this'}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Price Tag Label
                    </label>
                    <select
                      value={newVehicle.public_price_label}
                      onChange={(e) => setNewVehicle({ ...newVehicle, public_price_label: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Guide Price">Guide Price</option>
                      <option value="Base Asking Price">Base Asking Price</option>
                      <option value="Fixed Price">Fixed Price</option>
                      <option value="Starting Bid">Starting Bid</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Publication Status
                    </label>
                    <select
                      value={newVehicle.publication_status}
                      onChange={(e) => setNewVehicle({ ...newVehicle, publication_status: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="published">Published (Visible on Website)</option>
                      <option value="draft">Draft (Admin Only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Availability
                    </label>
                    <select
                      value={newVehicle.availability_status}
                      onChange={(e) => setNewVehicle({ ...newVehicle, availability_status: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="available">Available for Sale</option>
                      <option value="reserved">Reserved</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Branch & Yard Location */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center">3</span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Branch & Yard Inspection Location
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Loan Branch Location *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jaipur Central, Delhi West, Lucknow"
                      value={newVehicle.branch_location}
                      onChange={(e) => setNewVehicle({ ...newVehicle, branch_location: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Where customer visits to purchase</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Yard Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Central Yard, Shree Yard"
                      value={newVehicle.yard_name}
                      onChange={(e) => setNewVehicle({ ...newVehicle, yard_name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Physical parking depot</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Yard Contact Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={newVehicle.internal_yard_contact}
                      onChange={(e) => setNewVehicle({ ...newVehicle, internal_yard_contact: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Visible to customer on car page</span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Cover Photo Upload */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 font-bold text-xs flex items-center justify-center">4</span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Vehicle Cover Photo
                  </h4>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex border rounded-xl overflow-hidden bg-white p-0.5 text-xs font-bold max-w-sm">
                    <button
                      type="button"
                      onClick={() => setCreatePhotoMode('file')}
                      className={`flex-1 py-1.5 rounded-lg transition ${createPhotoMode === 'file' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Upload Image File
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreatePhotoMode('url')}
                      className={`flex-1 py-1.5 rounded-lg transition ${createPhotoMode === 'url' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Web Image URL
                    </button>
                  </div>

                  {createPhotoMode === 'file' ? (
                    <div>
                      <input
                        ref={createPhotoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setCreatePhotoFile(e.target.files[0]);
                          }
                        }}
                        className="w-full p-2.5 border rounded-xl text-xs bg-white"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Supports JPEG, PNG, or WebP up to 10MB. (Additional photos can be added anytime in inventory).
                      </span>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/... or Google Drive public link"
                        value={createPhotoUrl}
                        onChange={(e) => setCreatePhotoUrl(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                    </div>
                  )}

                  {/* Photo Preview if selected */}
                  {createPhotoMode === 'file' && createPhotoFile && (
                    <div className="flex items-center space-x-3 p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div className="text-xs truncate">
                        <strong className="text-emerald-900 block truncate">{createPhotoFile.name}</strong>
                        <span className="text-[10px] text-emerald-700">{(createPhotoFile.size / 1024).toFixed(0)} KB ready for upload</span>
                      </div>
                    </div>
                  )}

                  {createPhotoMode === 'url' && createPhotoUrl && (
                    <div className="flex items-center space-x-3 p-2 bg-slate-100 rounded-xl border border-slate-200">
                      <img 
                        src={createPhotoUrl} 
                        alt="Preview" 
                        className="w-16 h-12 rounded-lg object-cover bg-slate-200"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                      <div className="text-xs truncate">
                        <strong className="text-slate-800 block">Cover Photo URL set</strong>
                        <span className="text-[10px] text-slate-500 truncate block">{createPhotoUrl}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 5: Confidential Banking / Internal Loan Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 font-bold text-xs flex items-center justify-center">5</span>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Confidential Internal / Loan Data
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[9px] font-bold">
                      INTERNAL ONLY • MASKED ON PUBLIC SITE
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Loan No / LOAN_ID <span className="text-blue-600 font-extrabold">(Excel Key)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LN-29402"
                      value={newVehicle.source_loan_id}
                      onChange={(e) => setNewVehicle({ ...newVehicle, source_loan_id: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Customer / Borrower Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={newVehicle.internal_customer_name}
                      onChange={(e) => setNewVehicle({ ...newVehicle, internal_customer_name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Chassis Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MA3ERB00000..."
                      value={newVehicle.internal_chassis_number}
                      onChange={(e) => setNewVehicle({ ...newVehicle, internal_chassis_number: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold uppercase focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Engine Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. K15BN8940..."
                      value={newVehicle.internal_engine_number}
                      onChange={(e) => setNewVehicle({ ...newVehicle, internal_engine_number: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold uppercase focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: Description & Highlights */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 font-bold text-xs flex items-center justify-center">6</span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Public Description & Highlights
                  </h4>
                </div>

                <div>
                  <textarea
                    rows={3}
                    placeholder="Enter highlights such as single owner, insurance valid, engine condition, tyre condition, yard inspection remarks..."
                    value={newVehicle.public_description}
                    onChange={(e) => setNewVehicle({ ...newVehicle, public_description: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setCreateVehicleModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createVehicleLoading}
                  className="btn-shine px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center space-x-2"
                >
                  {createVehicleLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Vehicle...</span>
                    </>
                  ) : (
                    <>
                      <Car className="w-4 h-4" />
                      <span>Save & Add to Inventory</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: QUICK MANUAL PHOTO UPLOAD (ANY VEHICLE)             */}
      {/* ========================================================= */}
      {quickUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-7 shadow-2xl border border-slate-200 space-y-4 my-2 max-h-[94vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Images className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900 font-heading">
                  Manual Photo Uploader
                </h3>
              </div>
              <button onClick={() => setQuickUploadModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickUploadSubmit} className="space-y-4 text-xs">
              {/* Select vehicle */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Vehicle *</label>
                <select
                  required
                  value={quickUploadVehicleId}
                  onChange={(e) => setQuickUploadVehicleId(e.target.value)}
                  className="w-full p-3 border rounded-2xl bg-white font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">-- Choose vehicle to attach photo to --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.registration_number || v.source_loan_id}) • {v.vehicle_category} • {formatPrice(v.public_listing_price)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload mode toggle */}
              <div className="flex border rounded-xl overflow-hidden bg-slate-100 p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setQuickUploadMode('file')}
                  className={`flex-1 py-1.5 rounded-lg transition ${quickUploadMode === 'file' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
                >
                  Upload File from Computer
                </button>
                <button
                  type="button"
                  onClick={() => setQuickUploadMode('url')}
                  className={`flex-1 py-1.5 rounded-lg transition ${quickUploadMode === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
                >
                  Enter Image URL
                </button>
              </div>

              {/* Mode 1: File */}
              {quickUploadMode === 'file' ? (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Image File</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required={quickUploadMode === 'file'}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setQuickUploadFile(e.target.files[0]);
                      }
                    }}
                    className="w-full p-2.5 border rounded-2xl text-xs bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Supports JPEG, PNG, or WebP up to 10MB.</span>
                </div>
              ) : (
                /* Mode 2: URL */
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Web Image URL</label>
                  <input
                    type="url"
                    value={quickUploadUrl}
                    onChange={(e) => setQuickUploadUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    required={quickUploadMode === 'url'}
                    className="w-full p-3 border rounded-2xl text-xs bg-slate-50"
                  />
                </div>
              )}

              <label className="flex items-center space-x-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={quickUploadPrimary}
                  onChange={(e) => setQuickUploadPrimary(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-slate-800 font-bold">Set as primary cover photo for this vehicle</span>
              </label>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setQuickUploadModalOpen(false)}
                  className="px-4 py-2 border rounded-2xl text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickUploading}
                  className="btn-shine px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow transition disabled:opacity-50"
                >
                  {quickUploading ? 'Uploading...' : 'Upload & Attach'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: FULL-SIZE PHOTO LIGHTBOX                            */}
      {/* ========================================================= */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setLightboxImg(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 rounded-full transition"
              title="Close Preview"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={lightboxImg} 
              alt="Full preview" 
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT ENQUIRY NOTES */}
      {/* ========================================================= */}
      {editingEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-7 shadow-2xl border border-slate-200 space-y-4 my-2 max-h-[94vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Staff Notes: {editingEnquiry.customer_name}
              </h3>
              <button onClick={() => setEditingEnquiry(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Bid Summary Banner */}
              {editingEnquiry.bid_price ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Customer Bid Submitted</span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black">BID</span>
                  </div>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-2xl font-black text-emerald-700">{formatPrice(editingEnquiry.bid_price)}</span>
                    {editingEnquiry.base_price && (
                      <div className="text-[11px] text-slate-600">
                        Base price: <strong className="text-slate-800">{formatPrice(editingEnquiry.base_price)}</strong>
                        {editingEnquiry.bid_price > editingEnquiry.base_price && (
                          <span className="ml-1 text-emerald-600 font-bold">
                            (+{formatPrice(editingEnquiry.bid_price - editingEnquiry.base_price)} above asking)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">
                    Vehicle: {editingEnquiry.vehicle_ref}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                  <strong className="text-slate-700">General Enquiry</strong> — no bid placed for {editingEnquiry.vehicle_ref}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Status</label>
                <select
                  value={editingEnquiry.status}
                  onChange={(e) => setEditingEnquiry({ ...editingEnquiry, status: e.target.value as any })}
                  className="w-full p-2.5 border rounded-2xl font-bold"
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Staff Internal Notes</label>
                <textarea
                  rows={4}
                  value={editingEnquiry.admin_notes || ''}
                  onChange={(e) => setEditingEnquiry({ ...editingEnquiry, admin_notes: e.target.value })}
                  placeholder="Record customer communication, yard visit scheduled, price discussion..."
                  className="w-full p-3 border rounded-2xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingEnquiry(null)}
                  className="px-4 py-2 border rounded-2xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateEnquiry(editingEnquiry, editingEnquiry.status, editingEnquiry.admin_notes)}
                  className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-2xl shadow"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
