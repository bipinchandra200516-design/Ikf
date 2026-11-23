import React, { useState, useEffect } from 'react';
import { 
  Filter, Search, X, RotateCcw, SlidersHorizontal, 
  ChevronLeft, ChevronRight, Inbox, Sparkles, Check, Layers
} from 'lucide-react';
import { PublicVehicle, DealershipSettings, VehicleCategory } from '../types';
import { fetchPublicVehicles } from '../services/api';
import { VehicleCard } from './VehicleCard';

interface InventoryPageProps {
  initialCategory?: string;
  initialSearch?: string;
  settings: DealershipSettings;
  onViewDetails: (vehicle: PublicVehicle) => void;
  onEnquire: (vehicle: PublicVehicle) => void;
}

const CATEGORIES: { label: string; value: string; short: string }[] = [
  { label: 'All Categories', value: 'all', short: 'All' },
  { label: 'Own Cars', value: 'Own Car', short: 'Own Cars' },
  { label: 'Taxi Fleet', value: 'Taxi Car', short: 'Taxi' },
  { label: 'SCV Commercial', value: 'SCV', short: 'SCV' },
  { label: 'LCV Trucks', value: 'LCV', short: 'LCV' },
  { label: 'HCV Haulers', value: 'HCV', short: 'HCV' },
  { label: 'Tractors', value: 'Tractor', short: 'Tractors' },
  { label: 'Commercial Equip. (CE)', value: 'CE', short: 'Equipment' },
];

const SORT_OPTIONS = [
  { label: 'Recently Added', value: 'recent' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Year: Newest First', value: 'year_desc' },
  { label: 'Year: Oldest First', value: 'year_asc' },
];

export const InventoryPage: React.FC<InventoryPageProps> = ({
  initialCategory,
  initialSearch,
  settings,
  onViewDetails,
  onEnquire
}) => {
  const [vehicles, setVehicles] = useState<PublicVehicle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters State
  const [category, setCategory] = useState<string>(initialCategory || 'all');
  const [search, setSearch] = useState<string>(initialSearch || '');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [branch, setBranch] = useState<string>('');
  const [sort, setSort] = useState<string>('recent');

  useEffect(() => {
    if (initialCategory !== undefined) {
      setCategory(initialCategory || 'all');
      setCurrentPage(1);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch || '');
      setCurrentPage(1);
    }
  }, [initialSearch]);

  // Mobile Filter Drawer Toggle
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const loadData = () => {
    setLoading(true);
    setFetchError(null);
    fetchPublicVehicles({
      category: category === 'all' ? '' : category,
      search,
      min_price: minPrice,
      max_price: maxPrice,
      year,
      branch,
      sort,
      page: currentPage,
      limit: 12
    })
      .then((res) => {
        setVehicles(res.vehicles || []);
        setTotalCount(res.total || 0);
        setTotalPages(res.total_pages || 1);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch filtered vehicles:', err);
        setFetchError('Unable to load vehicle listings. Server may be connecting.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [category, minPrice, maxPrice, year, branch, sort, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
  };

  const handleClearFilters = () => {
    setCategory('all');
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setYear('');
    setBranch('');
    setSort('recent');
    setCurrentPage(1);
  };

  const hasActiveFilters = category !== 'all' || search !== '' || minPrice !== '' || maxPrice !== '' || year !== '' || branch !== '';

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-12 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-6 border-b border-slate-200/80">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 block mb-1">
              Live Dealership Inventory
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 font-heading tracking-tight">
              Vehicle Inventory Catalog
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
              Showing <strong>{totalCount}</strong> verified vehicle{totalCount === 1 ? '' : 's'} available across Telangana yards.
            </p>
          </div>

          {/* Controls: Filter Button on Mobile + Sort Select */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-sm"
            >
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Filters {hasActiveFilters && '• Active'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold hidden sm:inline">Sort:</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Horizontal Category Filter Pills: Works on Mobile, Tablet & Laptop */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  setCategory(cat.value);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Master Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-28 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  Filter Catalog
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              {/* Keyword Search */}
              <form onSubmit={handleSearchSubmit} className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Keyword Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Make, model, branch..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </form>

              {/* Price Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Price Range (₹)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Branch Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Branch / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Uppal, Nalgonda..."
                  value={branch}
                  onChange={(e) => {
                    setBranch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Manufacturing Year */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Mfg Year</label>
                <input
                  type="number"
                  placeholder="e.g. 2021"
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </aside>

          {/* Vehicle Grid (3 cols on laptop, 2 cols on tablet/iPad, 1 col on mobile) */}
          <main className="lg:col-span-3">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">Querying verified listings...</p>
              </div>
            ) : fetchError ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-rose-200 shadow-sm max-w-md mx-auto">
                <Inbox className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                <h3 className="font-heading font-black text-lg text-slate-900">Connection Error</h3>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                  {fetchError}
                </p>
                <button
                  onClick={loadData}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  Retry Connection
                </button>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
                <Inbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="font-heading font-black text-lg text-slate-900">No Vehicles Match Criteria</h3>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                  Try clearing some filters or searching for a different make/model.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {vehicles.map((v) => (
                    <VehicleCard
                      key={v.id}
                      vehicle={v}
                      onViewDetails={onViewDetails}
                      onEnquire={onEnquire}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold disabled:opacity-40 hover:bg-slate-100 transition shadow-xs"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setCurrentPage(pg)}
                        className={`w-10 h-10 rounded-xl font-bold text-xs transition shadow-xs ${
                          currentPage === pg
                            ? 'bg-blue-600 text-white font-extrabold'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {pg}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold disabled:opacity-40 hover:bg-slate-100 transition shadow-xs"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile & iPad Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-black text-lg text-slate-900">Filter Vehicles</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Keyword Search */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Keyword Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search make or model..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            {/* Category Select */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Inputs */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Price Range (₹)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min Price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  handleClearFilters();
                  setMobileFilterOpen(false);
                }}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  setCurrentPage(1);
                  loadData();
                  setMobileFilterOpen(false);
                }}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
