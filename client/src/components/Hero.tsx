import React, { useState, useEffect } from 'react';
import {
  Search, ArrowRight, Car, Truck, Tractor, HardHat, Layers,
  CheckCircle2, Sparkles, TrendingUp, MapPin, ShieldCheck, Building2, ChevronDown
} from 'lucide-react';
import { DealershipSettings, VehicleCategory } from '../types';

interface HeroProps {
  settings: DealershipSettings;
  onSearch: (query: string, category?: string) => void;
  onBrowse: () => void;
}

const CATEGORIES: { label: string; short: string; value: VehicleCategory | 'all'; icon: any }[] = [
  { label: 'All Categories', short: 'All',     value: 'all',      icon: Layers },
  { label: 'Own Cars',      short: 'Own Car', value: 'Own Car',  icon: Car },
  { label: 'Taxi Fleet',    short: 'Taxi',    value: 'Taxi Car', icon: Car },
  { label: 'SCV Commercial',short: 'SCV',     value: 'SCV',      icon: Truck },
  { label: 'LCV Trucks',    short: 'LCV',     value: 'LCV',      icon: Truck },
  { label: 'HCV Haulers',   short: 'HCV',     value: 'HCV',      icon: Truck },
  { label: 'Tractors',      short: 'Tractor', value: 'Tractor',  icon: Tractor },
  { label: 'Commercial Equip.', short: 'CE',  value: 'CE',       icon: HardHat },
];

const ANIMATED_WORDS = ['Passenger Cars', 'Commercial Cabs', 'SCV Pickups', 'LCV Trucks', 'Heavy Haulers', 'Farm Tractors', 'JCB & Equipment'];

const TRUST_STATS = [
  { label: 'Vehicle Categories', value: '7 Sectors',   icon: Layers },
  { label: 'Designated Yards',   value: 'Telangana',   icon: Building2 },
  { label: 'Inspected Stock',    value: '75+ Units',   icon: ShieldCheck },
  { label: 'Bidding Status',     value: 'Open & Live', icon: TrendingUp },
];

const TICKER_ITEMS = [
  '7 Vehicle Categories', 'Telangana Yards', 'Physical Inspection', 'Online Bidding',
  '75+ Units Available', 'Transparent Pricing', 'Zero Middlemen', 'Verified Chassis',
];

export const Hero: React.FC<HeroProps> = ({ settings, onSearch, onBrowse }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [wordPhase, setWordPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const interval = setInterval(() => {
      setWordPhase('out');
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % ANIMATED_WORDS.length);
        setWordPhase('in');
      }, 350);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery, selectedCategory === 'all' ? undefined : selectedCategory);
  };

  const handleQuickCategory = (catVal: string) => {
    setSelectedCategory(catVal);
    onSearch(searchQuery, catVal === 'all' ? undefined : catVal);
  };

  return (
    <section className="hero-gradient-bg relative text-white overflow-hidden pt-8 pb-14 sm:py-20 lg:py-24">

      {/* Animated ambient orbs */}
      <div
        className="orb animate-orb-1 w-[400px] sm:w-[700px] lg:w-[950px] h-[280px] sm:h-[450px] pointer-events-none"
        style={{ top: '-80px', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(ellipse, rgba(59,130,246,0.22) 0%, rgba(30,64,175,0.10) 60%, transparent 100%)' }}
      />
      <div
        className="orb animate-orb-2 w-72 sm:w-[420px] h-72 sm:h-[420px] pointer-events-none"
        style={{ bottom: '-60px', right: '-60px', background: 'radial-gradient(ellipse, rgba(6,182,212,0.18) 0%, rgba(16,185,129,0.08) 60%, transparent 100%)' }}
      />
      <div
        className="orb animate-orb-1 w-52 sm:w-80 h-52 sm:h-80 pointer-events-none"
        style={{ top: '30%', left: '-40px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.14) 0%, transparent 70%)', animationDelay: '5s' }}
      />

      {/* Dot mesh */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      {/* Floating particles */}
      {[
        { top: '15%', left: '8%', size: 5, delay: '0s' },
        { top: '70%', left: '5%', size: 4, delay: '1.5s' },
        { top: '30%', right: '10%', size: 6, delay: '0.8s' },
        { top: '80%', right: '8%',  size: 4, delay: '2.2s' },
        { top: '50%', left: '50%',  size: 3, delay: '3s' },
      ].map((p, i) => (
        <div
          key={i}
          className="animate-particle particle"
          style={{
            top: p.top, left: (p as any).left, right: (p as any).right,
            width: p.size, height: p.size,
            animationDelay: p.delay,
            background: i % 2 === 0 ? 'rgba(147,197,253,0.6)' : 'rgba(52,211,153,0.5)',
          }}
        />
      ))}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Live badge */}
        <div className="flex justify-center mb-5 sm:mb-7 animate-fade-in-up">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white/[0.08] border border-white/[0.14] backdrop-blur-md text-[11px] sm:text-xs font-semibold text-slate-200 shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span>Verified Dealership & Yard Stock</span>
            <span className="w-px h-3 bg-white/20 mx-0.5 sm:mx-1" />
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300 font-bold">Direct Yard Bidding</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto animate-fade-in-up delay-100">
          <h1 className="font-heading font-black text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight text-white leading-[1.2] sm:leading-[1.15]">
            Find &amp; Bid on Certified{' '}
            <br className="hidden sm:inline" />
            <span className="hero-word-container inline-block">
              <span
                className={`hero-word ${wordPhase === 'in' ? 'entering' : 'exiting'} text-gradient-cyan`}
                style={{ minWidth: '240px', display: 'inline-block', textAlign: 'center' }}
              >
                {ANIMATED_WORDS[wordIndex]}
              </span>
            </span>
          </h1>

          <p className="mt-3 sm:mt-5 text-slate-300 text-xs sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed font-normal px-2 sm:px-0">
            Direct access to verified dealership inventory across Telangana yards. Inspect vehicles
            in person at regional depots, verify chassis numbers, and bid transparently online.
          </p>
        </div>

        {/* Ticker bar */}
        <div className="mt-5 sm:mt-7 max-w-3xl mx-auto animate-fade-in-up delay-200">
          <div className="ticker-wrap py-2 rounded-full bg-white/[0.06] border border-white/[0.10] overflow-hidden">
            <div className="ticker-content animate-ticker gap-0">
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-5 text-[11px] sm:text-xs font-semibold text-slate-300 whitespace-nowrap">
                  <span className="w-1 h-1 rounded-full bg-cyan-400 inline-block" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Search Card */}
        <div className="mt-5 sm:mt-8 max-w-3xl mx-auto animate-fade-in-up delay-300">
          <div className="bg-white/95 backdrop-blur-xl p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/40 ring-1 ring-black/5">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              {/* Category Dropdown */}
              <div className="relative sm:w-48 lg:w-52 shrink-0">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-11 sm:h-12 pl-3.5 pr-8 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer appearance-none transition"
                >
                  <option value="all">All 7 Categories</option>
                  <option value="Own Car">Own Cars (Private)</option>
                  <option value="Taxi Car">Taxi Fleet</option>
                  <option value="SCV">SCV Commercial</option>
                  <option value="LCV">LCV Trucks</option>
                  <option value="HCV">HCV Haulers</option>
                  <option value="Tractor">Agricultural Tractors</option>
                  <option value="CE">Commercial Equipment (CE)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search make, model, city, yard, plate..."
                  className="w-full h-11 sm:h-12 pl-10 sm:pl-11 pr-4 rounded-xl sm:rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="h-11 sm:h-12 px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-blue-500/40 transition active:scale-95 shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>
          </div>

          {/* Quick Category Chips */}
          <div className="mt-3 sm:mt-4 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center px-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleQuickCategory(cat.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/30 font-extrabold'
                      : 'bg-white/[0.10] hover:bg-white/[0.20] text-slate-200 border border-white/[0.14]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.short}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trust Stats */}
        <div className="mt-8 sm:mt-12 lg:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 max-w-4xl mx-auto animate-fade-in-up delay-500">
          {TRUST_STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white/[0.08] backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/[0.12] hover:border-cyan-400/30 hover:bg-white/[0.12] transition-all duration-300 hover:scale-[1.03] flex items-center gap-2.5 sm:gap-3.5 shadow-sm"
                style={{ animationDelay: `${0.5 + i * 0.1}s` }}
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.12] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <div className="font-heading font-black text-sm sm:text-base lg:text-lg text-white leading-tight truncate">
                    {stat.value}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 truncate mt-0.5">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
