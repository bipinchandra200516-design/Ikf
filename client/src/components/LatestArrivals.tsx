import React from 'react';
import { ArrowRight, Sparkles, Inbox, Phone, Zap } from 'lucide-react';
import { PublicVehicle, DealershipSettings } from '../types';
import { VehicleCard } from './VehicleCard';

interface LatestArrivalsProps {
  vehicles: PublicVehicle[];
  settings: DealershipSettings;
  onViewDetails: (vehicle: PublicVehicle) => void;
  onEnquire: (vehicle: PublicVehicle) => void;
  onBrowseAll: () => void;
}

export const LatestArrivals: React.FC<LatestArrivalsProps> = ({
  vehicles,
  settings,
  onViewDetails,
  onEnquire,
  onBrowseAll,
}) => {
  return (
    <section className="py-16 sm:py-24 relative overflow-hidden border-b border-slate-200/60"
      style={{ background: 'linear-gradient(180deg, #F8FAFF 0%, #FFFFFF 50%, #F8FAFF 100%)' }}>

      {/* Soft orb accent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12 animate-fade-in-up">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>Fresh Inspection Batches</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-black text-[#0A1628] tracking-tight">
              Featured Yard Arrivals
            </h2>
            <p className="mt-2 text-slate-500 text-xs sm:text-sm max-w-xl leading-relaxed">
              Certified vehicles recently processed across Telangana regional yards, ready for physical inspection and online bidding.
            </p>
          </div>

          <button
            onClick={onBrowseAll}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold shadow-sm transition group shrink-0"
          >
            <span>View All {vehicles.length > 0 ? `${vehicles.length}+` : ''} Units</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Vehicle Grid */}
        {vehicles.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
            <Inbox className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="font-heading font-black text-lg text-slate-800 mb-1">No Active Listings</h3>
            <p className="text-xs text-slate-500 mb-4">
              Inventory will appear here once vehicles are loaded from the database.
            </p>
            <a
              href={`tel:${settings.phone}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Helpline: {settings.phone}</span>
            </a>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {vehicles.slice(0, 6).map((v, i) => (
                <div key={v.id} className="animate-card-appear" style={{ animationDelay: `${i * 0.08}s` }}>
                  <VehicleCard
                    vehicle={v}
                    onViewDetails={onViewDetails}
                    onEnquire={onEnquire}
                  />
                </div>
              ))}
            </div>

            {/* Bottom Browse Button */}
            <div className="mt-12 text-center animate-fade-in-up delay-500">
              <button
                onClick={onBrowseAll}
                className="btn-primary btn-shine inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm"
              >
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>Browse Full Vehicle Database</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="mt-3 text-xs text-slate-400">
                75+ verified units · Telangana yards · Physical inspection available
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
