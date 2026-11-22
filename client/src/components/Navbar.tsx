import React, { useState, useEffect, useRef } from 'react';
import {
  Truck, Car, Tractor, HardHat, Menu, X, Phone, Lock,
  Search, ChevronDown, ChevronRight, Layers, Sparkles, ArrowRight, ShieldCheck
} from 'lucide-react';
import { DealershipSettings } from '../types';

interface NavbarProps {
  settings: DealershipSettings;
  currentView: string;
  onNavigate: (view: string, categoryFilter?: string) => void;
}

const CATEGORIES = [
  { label: 'Own Cars', value: 'Own Car',  icon: Car,     color: 'text-blue-600',   bg: 'bg-blue-50',   desc: 'Private passenger sedans & SUVs' },
  { label: 'Taxi Cars', value: 'Taxi Car', icon: Car,     color: 'text-amber-600',  bg: 'bg-amber-50',  desc: 'Commercial fleet & cabs' },
  { label: 'SCV',        value: 'SCV',     icon: Truck,   color: 'text-emerald-600',bg: 'bg-emerald-50',desc: 'Pickups & sub-1.5T last-mile' },
  { label: 'LCV',        value: 'LCV',     icon: Truck,   color: 'text-teal-600',   bg: 'bg-teal-50',   desc: 'Intermediate freight trucks' },
  { label: 'HCV',        value: 'HCV',     icon: Truck,   color: 'text-violet-600', bg: 'bg-violet-50', desc: 'Heavy multi-axle haulers' },
  { label: 'Tractors',   value: 'Tractor', icon: Tractor, color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Agricultural power tractors' },
  { label: 'Commercial Equip. (CE)', value: 'CE', icon: HardHat, color: 'text-amber-700', bg: 'bg-amber-50', desc: 'JCBs, tippers & earthmovers' },
];

export const Navbar: React.FC<NavbarProps> = ({ settings, currentView, onNavigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catalogDropOpen, setCatalogDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setCatalogDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNav = (view: string, cat?: string) => {
    onNavigate(view, cat);
    setMobileOpen(false);
    setCatalogDropOpen(false);
  };

  return (
    <>
      {/* Top Utility Strip */}
      <div className="bg-[#0B192C] text-slate-300 text-[11px] font-medium border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-9">
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-white font-semibold tracking-wide">Live Multi-Category Inventory</span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              Verified Chassis & RC Documents • Telangana Yards • 7 Categories
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href={`tel:${settings.phone}`}
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors font-mono font-semibold"
            >
              <Phone className="w-3 h-3 text-sky-400" />
              <span>{settings.phone}</span>
            </a>
            <button
              onClick={() => handleNav('admin')}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] font-bold tracking-wide transition"
            >
              <Lock className="w-2.5 h-2.5 text-amber-400" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Sticky Navbar */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-md'
            : 'bg-white border-b border-slate-200/80 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[72px]">

            {/* Brand Logo & Name */}
            <button
              onClick={() => handleNav('home')}
              className="flex items-center gap-3 text-left focus:outline-none group"
            >
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-400 p-0.5 shadow-md flex items-center justify-center transition-transform group-hover:scale-105">
                <div className="w-full h-full bg-[#0B192C] rounded-[14px] flex items-center justify-center">
                  <Truck className="w-5 h-5 text-sky-400" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-xl sm:text-2xl tracking-tight text-[#0B192C] leading-none group-hover:text-blue-700 transition-colors">
                    AutoHub <span className="font-extrabold text-blue-700">Vehicles</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 text-[9px] font-black uppercase tracking-wider border border-amber-500/20">
                    Direct Yard Purchases
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mt-0.5">
                  Multi-Category Vehicle Marketplace
                </p>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1.5">
              <button
                onClick={() => handleNav('home')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  currentView === 'home'
                    ? 'bg-blue-50 text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Home
              </button>

              <button
                onClick={() => handleNav('inventory')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  currentView === 'inventory' && !catalogDropOpen
                    ? 'bg-blue-50 text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                All Inventory
              </button>

              {/* Categories Mega Dropdown */}
              <div ref={dropRef} className="relative">
                <button
                  onClick={() => setCatalogDropOpen(!catalogDropOpen)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    catalogDropOpen
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Explore Categories</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${catalogDropOpen ? 'rotate-180 text-blue-600' : ''}`} />
                </button>

                {catalogDropOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[520px] bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        7 Vehicle Categories
                      </span>
                      <span className="text-[11px] font-bold text-blue-700">
                        Live Database Units
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.value}
                            onClick={() => handleNav('inventory', cat.value)}
                            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-left group transition-all border border-transparent hover:border-slate-200/80"
                          >
                            <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                              <Icon className={`w-5 h-5 ${cat.color}`} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                                {cat.label}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                {cat.desc}
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleNav('inventory')}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                      >
                        <span>Browse Complete Inventory</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Right Action Buttons */}
            <div className="hidden sm:flex items-center gap-3">
              <a
                href={`tel:${settings.phone}`}
                className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs transition"
                title="Direct Yard Helpline"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-mono">{settings.phone}</span>
              </a>

              <button
                onClick={() => handleNav('inventory')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B192C] hover:bg-blue-900 text-white font-bold text-xs shadow-sm transition active:scale-95"
              >
                <Search className="w-3.5 h-3.5 text-sky-400" />
                <span>Search Vehicles</span>
              </button>
            </div>

            {/* Mobile / Tablet Menu Button */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => handleNav('inventory')}
                className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2.5 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition active:scale-95"
                aria-label="Toggle Navigation Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile & Tablet Drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-xl shadow-2xl overflow-y-auto max-h-[calc(100vh-110px)] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-5 py-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNav('home')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition ${
                    currentView === 'home' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => handleNav('inventory')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition ${
                    currentView === 'inventory' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  All Vehicles
                </button>
              </div>

              {/* Categories Grid on Mobile */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2 px-1">
                  Browse by Category (7 Sectors)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.value}
                        onClick={() => handleNav('inventory', cat.value)}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-left transition"
                      >
                        <div className={`w-8 h-8 rounded-xl ${cat.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-4 h-4 ${cat.color}`} />
                        </div>
                        <span className="font-bold text-xs flex-1 truncate">{cat.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Actions on Mobile */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <a
                  href={`tel:${settings.phone}`}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-sm"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Yard Hotline: {settings.phone}</span>
                </a>
                <button
                  onClick={() => handleNav('admin')}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#0B192C] text-white font-bold text-xs"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Dealership Portal</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
