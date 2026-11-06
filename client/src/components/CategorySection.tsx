import React from 'react';
import { Car, Truck, Tractor, HardHat, ArrowUpRight, Tag } from 'lucide-react';
import { CategoryCounts, VehicleCategory } from '../types';

interface CategorySectionProps {
  counts: CategoryCounts;
  onSelectCategory: (category: VehicleCategory) => void;
}

interface CategoryMeta {
  key: VehicleCategory;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  pillBg: string;
  pillText: string;
  borderTop: string;
  sampleModels: string[];
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: 'Own Car',
    title: 'Own Cars',
    subtitle: 'Private Passenger',
    description: 'Hatchbacks, sedans, and SUVs for personal and family mobility.',
    icon: Car,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    accentColor: '#2563EB',
    pillBg: 'bg-blue-50',
    pillText: 'text-blue-700',
    borderTop: '#3B82F6',
    sampleModels: ['Baleno', 'Swift', 'Celerio', 'Scorpio'],
  },
  {
    key: 'Taxi Car',
    title: 'Taxi Fleet',
    subtitle: 'Commercial Cabs',
    description: 'Commercial permitted fleet taxis with verified fitness certificates.',
    icon: Car,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    accentColor: '#EA580C',
    pillBg: 'bg-orange-50',
    pillText: 'text-orange-700',
    borderTop: '#F97316',
    sampleModels: ['Dzire Tour', 'Celerio CNG', 'WagonR'],
  },
  {
    key: 'SCV',
    title: 'Small Commercial (SCV)',
    subtitle: 'Sub-1.5T Last-Mile',
    description: 'Mini-trucks and intra-city pickup loaders for daily logistics.',
    icon: Truck,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    accentColor: '#059669',
    pillBg: 'bg-emerald-50',
    pillText: 'text-emerald-700',
    borderTop: '#10B981',
    sampleModels: ['Tata Ace', 'Bolero Pickup', 'Dost'],
  },
  {
    key: 'LCV',
    title: 'Light Commercial (LCV)',
    subtitle: 'Intermediate Freight',
    description: 'Medium freight transport trucks bridging urban yards and highways.',
    icon: Truck,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    accentColor: '#0D9488',
    pillBg: 'bg-teal-50',
    pillText: 'text-teal-700',
    borderTop: '#14B8A6',
    sampleModels: ['Eicher Pro', 'Tata 407', 'Furio 7'],
  },
  {
    key: 'HCV',
    title: 'Heavy Commercial (HCV)',
    subtitle: 'Multi-Axle Haulers',
    description: 'Heavy prime movers, multi-axle freight haulers, and bulk cargo units.',
    icon: Truck,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    accentColor: '#7C3AED',
    pillBg: 'bg-violet-50',
    pillText: 'text-violet-700',
    borderTop: '#8B5CF6',
    sampleModels: ['Tata Signa', 'Eicher 6000', 'AL 4220'],
  },
  {
    key: 'Tractor',
    title: 'Agricultural Tractors',
    subtitle: 'Farm Power Equipment',
    description: 'Multi-speed PTO tractors for farming, agriculture, and land use.',
    icon: Tractor,
    iconBg: 'bg-lime-50',
    iconColor: 'text-lime-700',
    accentColor: '#65A30D',
    pillBg: 'bg-lime-50',
    pillText: 'text-lime-700',
    borderTop: '#84CC16',
    sampleModels: ['Swaraj 744', 'Mahindra 575', 'Sonalika'],
  },
  {
    key: 'CE',
    title: 'Commercial Equip. (CE)',
    subtitle: 'Earthmoving & Machinery',
    description: 'JCB backhoe loaders, tippers, excavators, and site machinery.',
    icon: HardHat,
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-700',
    accentColor: '#B45309',
    pillBg: 'bg-yellow-50',
    pillText: 'text-yellow-800',
    borderTop: '#EAB308',
    sampleModels: ['JCB 3DX', 'Tata 2825 Tipper', 'Excavators'],
  },
];

export const CategorySection: React.FC<CategorySectionProps> = ({ counts, onSelectCategory }) => {
  return (
    <section className="py-16 sm:py-24 bg-white relative overflow-hidden border-b border-slate-100">
      {/* Subtle background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59,130,246,0.04) 0%, transparent 60%)',
        }}
      />
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{ backgroundImage: 'radial-gradient(rgba(148,163,184,0.25) 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-14 animate-fade-in-up">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/70 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3 shadow-sm">
              <Tag className="w-3.5 h-3.5 text-blue-500" />
              <span>7 Vehicle Sectors</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-black text-[#0A1628] tracking-tight">
              Explore Inventory by Category
            </h2>
            <p className="mt-2 text-slate-500 text-xs sm:text-sm max-w-xl leading-relaxed">
              Every unit is verified against central yard databases with confirmed chassis numbers, base prices, and Telangana inspection yards.
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-500 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm shrink-0 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Click any category to filter
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            const count = counts[cat.key] || 0;

            return (
              <button
                key={cat.key}
                onClick={() => onSelectCategory(cat.key)}
                className="group relative bg-white rounded-3xl border border-slate-200/80 shadow-sm text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer flex flex-col justify-between category-card-glow overflow-hidden animate-card-appear"
                style={{ animationDelay: `${idx * 0.07}s`, borderTop: `3px solid ${cat.borderTop}` }}
              >
                {/* Inner content wrapper */}
                <div className="p-5 sm:p-6 flex flex-col h-full">
                  {/* Top Row: Icon + Count Pill */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl ${cat.iconBg} flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
                      <Icon className={`w-6 h-6 ${cat.iconColor}`} />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${cat.pillBg} ${cat.pillText} border border-current/10`}>
                      {count} {count === 1 ? 'Unit' : 'Units'}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h3 className="font-heading font-black text-base sm:text-lg text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">
                      {cat.title}
                    </h3>
                    <ArrowUpRight
                      className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5"
                    />
                  </div>

                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {cat.subtitle}
                  </p>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">
                    {cat.description}
                  </p>

                  {/* Popular Models Chips */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {cat.sampleModels.map((m) => (
                      <span
                        key={m}
                        className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[10px] font-semibold border border-slate-200/60 group-hover:border-slate-300 transition-colors"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hover shimmer overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500 rounded-3xl"
                  style={{ background: `linear-gradient(135deg, ${cat.accentColor}08 0%, transparent 60%)` }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
