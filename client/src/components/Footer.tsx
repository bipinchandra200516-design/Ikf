import React from 'react';
import {
  Truck, Phone, Mail, MapPin, MessageSquare, ArrowRight,
  CheckCircle2, Database, Shield, Search, ClipboardCheck, Handshake,
  Star, Zap, Lock, Users
} from 'lucide-react';
import { DealershipSettings } from '../types';

interface FooterProps {
  settings: DealershipSettings;
  onNavigate: (view: string, category?: string) => void;
  onOpenEnquiry: () => void;
}

// ─── WHY CHOOSE ───────────────────────────────────────────────────────────────
const WHY_ITEMS = [
  {
    icon: Database,
    title: 'Live Database Sync',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'hover:border-blue-200',
    description: 'All listings are imported directly from verified administrator spreadsheets — zero phantom listings or fabricated specs.',
  },
  {
    icon: Shield,
    title: 'Multi-Sector Coverage',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'hover:border-emerald-200',
    description: 'From daily commuter hatchbacks to 37-ton multi-axle HCVs and farm tractors — one platform for every vehicle type.',
  },
  {
    icon: CheckCircle2,
    title: 'Physical Inspection',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    border: 'hover:border-violet-200',
    description: 'Every listed vehicle can be physically inspected at the regional yard. Bring your mechanic, verify chassis and docs.',
  },
  {
    icon: Zap,
    title: 'Direct Yard Access',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    border: 'hover:border-orange-200',
    description: 'Contact details for each vehicle\'s specific yard are provided. No middlemen — enquire and negotiate directly.',
  },
  {
    icon: Users,
    title: 'Direct Yard Purchase',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50',
    border: 'hover:border-cyan-200',
    description: 'Inspect vehicles in person at regional yards and complete direct purchases with transparent documentation and yard staff.',
  },
  {
    icon: Lock,
    title: 'Secure Admin Portal',
    color: 'text-slate-500',
    bg: 'bg-slate-100',
    border: 'hover:border-slate-300',
    description: 'A protected dealership backend handles inventory imports, enquiry management, and operational settings.',
  },
];

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    icon: Search,
    title: 'Browse & Filter',
    desc: 'Search by make, model, category, or branch. Use filters to narrow down units matching your exact need.',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    accent: '#3B82F6',
  },
  {
    num: '02',
    icon: MapPin,
    title: 'Yard Visit',
    desc: 'Visit the designated yard to physically inspect the vehicle, verify chassis numbers, and assess condition.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    accent: '#7C3AED',
  },
  {
    num: '03',
    icon: ClipboardCheck,
    title: 'Submit an online enquiry',
    desc: 'Submit an online enquiry or contact the yard directly with the vehicle stock ID.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    accent: '#059669',
  },
  {
    num: '04',
    icon: Handshake,
    title: 'Inspect & Purchase',
    desc: 'Inspect the vehicle in person, verify all documents with yard staff, and complete your purchase directly.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    accent: '#EA580C',
  },
];

export const WhyChooseAndHowItWorks: React.FC<{
  settings: DealershipSettings;
  onBrowse: () => void;
  onOpenEnquiry: () => void;
}> = ({ settings, onBrowse, onOpenEnquiry }) => {
  return (
    <>
      {/* ── WHY CHOOSE ── */}
      <section className="py-20 sm:py-28 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #F8FAFF 0%, #EFF6FF 30%, #F0FDF4 70%, #F8FAFF 100%)' }}>
        {/* Background dot grid */}
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(rgba(148,163,184,0.2) 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }}
        />
        {/* Top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-32 pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
              <Star className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
              Platform Advantages
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A1628] tracking-tight">
              Why Use {settings.brand_name}?
            </h2>
            <p className="mt-4 text-slate-500 text-sm sm:text-base leading-relaxed">
              A specialized marketplace linking physical yards, repossession stock, and commercial fleet inventory in one transparent portal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className={`card-premium rounded-2xl p-6 animate-card-appear border ${item.border} transition-all duration-300`}
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <h3 className="font-heading text-base font-black text-[#0A1628] mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 sm:py-28 bg-white relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />
        <div className="absolute left-0 bottom-0 w-80 h-80 pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.05) 0%, transparent 70%)' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Simple Process
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A1628] tracking-tight">
              How Buying Works
            </h2>
            <p className="mt-4 text-slate-500 text-sm sm:text-base">
              Four steps from browsing the database to taking delivery of your vehicle.
            </p>
          </div>

          {/* Steps grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative animate-card-appear" style={{ animationDelay: `${i * 0.1}s` }}>
                  {/* Connector line on desktop */}
                  {i < STEPS.length - 1 && (
                    <div
                      className="hidden lg:block absolute top-8 left-full w-full h-px z-0 -translate-x-1/2"
                      style={{ background: `linear-gradient(90deg, ${step.accent}60, transparent)` }}
                    />
                  )}

                  <div className="relative z-10 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 hover:border-blue-200 hover:bg-white hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 group">
                    {/* Step number (outline style) */}
                    <div className="text-5xl font-black leading-none mb-3" style={{ color: step.accent, opacity: 0.15, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.05em' }}>
                      {step.num}
                    </div>
                    <div className="flex items-center gap-3 mb-4 -mt-2">
                      <div className={`w-10 h-10 rounded-xl ${step.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-5 h-5 ${step.color}`} />
                      </div>
                    </div>
                    <h4 className="font-heading font-black text-base text-[#0A1628] mb-2">{step.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>

                    {/* Bottom accent line */}
                    <div
                      className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `linear-gradient(90deg, ${step.accent}, transparent)` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="relative py-20 overflow-hidden" style={{ background: 'linear-gradient(135deg, #060E1A 0%, #0A1628 50%, #0F2040 100%)' }}>
        {/* Animated orbs */}
        <div
          className="orb animate-orb-1 w-96 h-96 pointer-events-none"
          style={{ top: '-80px', left: '10%', background: 'radial-gradient(ellipse, rgba(59,130,246,0.18) 0%, transparent 70%)' }}
        />
        <div
          className="orb animate-orb-2 w-80 h-80 pointer-events-none"
          style={{ bottom: '-60px', right: '10%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)' }}
        />
        <div
          className="orb w-64 h-64 pointer-events-none"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 70%)' }}
        />

        {/* Fine grid */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.14] text-cyan-300 text-xs font-bold uppercase tracking-wider mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Ready to Purchase?
          </div>
          <h3 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
            Have a Specific Vehicle in Mind?
          </h3>
          <p className="text-slate-400 text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Our Telangana yard network receives new batches of cars, trucks, and equipment weekly. Talk to the sales team now.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onOpenEnquiry}
              className="btn-shine btn-primary px-8 py-4 rounded-2xl text-sm"
            >
              Submit an online enquiry
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onBrowse}
              className="btn-shine btn-dark px-8 py-4 rounded-2xl text-sm flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-cyan-400" />
              Browse Inventory
            </button>
          </div>
        </div>
      </section>
    </>
  );
};


// ─── FOOTER ───────────────────────────────────────────────────────────────────
export const Footer: React.FC<FooterProps> = ({ settings, onNavigate, onOpenEnquiry }) => {
  const VEHICLE_CATEGORIES = [
    { label: 'Own Cars (Private)', value: 'Own Car' },
    { label: 'Taxi Cars (Fleet)',  value: 'Taxi Car' },
    { label: 'SCV — Small Commercial', value: 'SCV' },
    { label: 'LCV — Light Commercial', value: 'LCV' },
    { label: 'HCV — Heavy Commercial', value: 'HCV' },
    { label: 'Agricultural Tractors',  value: 'Tractor' },
    { label: 'Commercial Equipment (CE)', value: 'CE' },
  ];

  return (
    <footer id="contact-section" className="text-slate-400 text-xs border-t border-white/5" style={{ background: '#060E1A' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

          {/* Brand Column */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 bg-white p-1 rounded-xl shadow-xs">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
                  AH
                </div>
              </div>
              <div>
                <div className="font-heading font-black text-xl text-white leading-none">
                  AutoHub Vehicles
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Yard Marketplace</div>
              </div>
            </div>
            <p className="text-slate-400 text-[12px] leading-relaxed">
              AutoHub — Certified passenger cars, commercial vehicles, trucks, agricultural tractors, and commercial equipment with direct yard sales.
            </p>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[10px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live DB
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[10px] text-slate-400">
                7 Categories
              </span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-widest text-[10px] mb-5">
              Vehicle Categories
            </h4>
            <ul className="space-y-2.5">
              {VEHICLE_CATEGORIES.map((cat) => (
                <li key={cat.value}>
                  <button
                    onClick={() => onNavigate('inventory', cat.value)}
                    className="hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-1.5 text-[12px]"
                  >
                    <ArrowRight className="w-3 h-3 opacity-40" />
                    {cat.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-widest text-[10px] mb-5">
              Yard & Sales Contact
            </h4>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span className="text-[12px] leading-relaxed">{settings.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <a href={`tel:${settings.phone}`} className="hover:text-white font-mono text-[12px] transition-colors">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-white text-[12px] transition-colors">
                  {settings.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-widest text-[10px] mb-5">
              Quick Actions
            </h4>
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('inventory')}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] text-slate-300 hover:text-white transition-all text-xs font-semibold"
              >
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                Browse Catalog
              </button>
              <button
                onClick={onOpenEnquiry}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/[0.12] hover:bg-cyan-500/[0.22] border border-cyan-400/[0.20] text-cyan-300 hover:text-white transition-all text-xs font-semibold"
              >
                <Mail className="w-3.5 h-3.5" />
                Submit an online enquiry
              </button>
              <button
                onClick={() => onNavigate('admin')}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-slate-500 hover:text-slate-300 transition-all text-xs font-semibold"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Admin Portal
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Vehicles are sold as-is via physical yard inspection. Guide prices are subject to final yard confirmation.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-600">
          <div>
            © {new Date().getFullYear()} {settings.brand_name}. All rights reserved.
          </div>
          <div className="flex items-center gap-5">
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Terms &amp; Conditions</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Inspection Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
