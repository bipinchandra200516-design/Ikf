import React, { useState } from 'react';
import {
  MapPin, Calendar, ArrowRight, Camera,
  Eye, Heart, BadgeCheck, Tag, Fuel, Building2, Phone, Gavel
} from 'lucide-react';
import { PublicVehicle, VehicleCategory } from '../types';

interface VehicleCardProps {
  vehicle: PublicVehicle;
  onViewDetails: (vehicle: PublicVehicle) => void;
  onEnquire: (vehicle: PublicVehicle) => void;
  whatsappNumber?: string;
}

export const formatPrice = (amount?: number): string => {
  if (!amount || amount === 0) return 'NA';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000)   return `₹${(amount / 100000).toFixed(2)} L`;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const getCategoryBadge = (cat: VehicleCategory) => {
  switch (cat) {
    case 'Own Car':
      return { badge: 'bg-blue-600 text-white', label: 'Own Car' };
    case 'Taxi Car':
      return { badge: 'bg-amber-600 text-white', label: 'Taxi Car' };
    case 'SCV':
      return { badge: 'bg-emerald-600 text-white', label: 'SCV' };
    case 'LCV':
      return { badge: 'bg-teal-600 text-white', label: 'LCV' };
    case 'HCV':
      return { badge: 'bg-violet-600 text-white', label: 'HCV' };
    case 'Tractor':
      return { badge: 'bg-orange-600 text-white', label: 'Tractor' };
    case 'CE':
      return { badge: 'bg-amber-700 text-white', label: 'Equipment (CE)' };
    default:
      return { badge: 'bg-slate-700 text-white', label: cat };
  }
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onViewDetails, onEnquire }) => {
  const [imgError, setImgError] = useState(false);
  const [liked, setLiked] = useState(false);
  const catStyle = getCategoryBadge(vehicle.vehicle_category);

  const imageUrl = imgError
    ? FALLBACK_IMG
    : vehicle.primary_image_url || FALLBACK_IMG;

  const imageCount = vehicle.images?.length ?? 1;

  return (
    <article
      onClick={() => onViewDetails(vehicle)}
      className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_2px_12px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_36px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* ── Image Area ── */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
        <img
          src={imageUrl}
          alt={`${vehicle.make} ${vehicle.model}`}
          onError={() => setImgError(true)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
        />

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 flex items-center gap-1.5">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${catStyle.badge}`}>
            {catStyle.label}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[9px] font-bold backdrop-blur-md shadow-xs">
            <BadgeCheck className="w-3 h-3" />
            Verified
          </span>
        </div>

        {/* Top Right: Wishlist + Photo Count */}
        <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 flex items-center gap-1.5">
          {imageCount > 1 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold shadow-xs">
              <Camera className="w-3 h-3" />
              <span>{imageCount}</span>
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setLiked(!liked);
            }}
            className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition active:scale-90"
            title="Wishlist"
            aria-label="Wishlist"
          >
            <Heart className={`w-3.5 h-3.5 transition-colors ${liked ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
          </button>
        </div>

        {/* Bottom Banner on Image: Registration Plate */}
        {vehicle.registration_number && (
          <div className="absolute bottom-2.5 left-2.5 sm:left-3">
            <span className="font-mono text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded bg-white/95 text-slate-900 shadow-md border border-slate-300 tracking-wider">
              {vehicle.registration_number}
            </span>
          </div>
        )}
      </div>

      {/* ── Content Area ── */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
        <div>
          {/* Title Row */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] sm:text-[11px] font-extrabold text-blue-700 uppercase tracking-wider block">
                {vehicle.manufacturing_year} • {vehicle.make}
              </span>
              <h3 className="font-heading font-black text-base sm:text-lg text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1 mt-0.5">
                {vehicle.model}
              </h3>
            </div>
          </div>

          {/* Price Box: Harmonious styling with dual-tone luxury feel */}
          <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block">
                Price
              </span>
              <div className="font-heading font-black text-lg sm:text-xl text-slate-900 leading-tight">
                NA
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-900 border border-blue-500/20">
                <Tag className="w-3 h-3 text-blue-700" />
                Direct Sale
              </span>
            </div>
          </div>

          {/* Location & Yard Pill */}
          <div className="mt-3 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-semibold text-slate-800">{vehicle.branch_location || 'Telangana Yard'}</span>
              <span className="text-slate-400">•</span>
              <span className="truncate text-slate-500" title={vehicle.yard_name || 'Designated Yard'}>
                {vehicle.yard_name || 'Designated Yard'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400 font-medium">Yard Contact:</span>
              <a
                href={`tel:${vehicle.yard_contact_number || '7673982156'}`}
                onClick={(e) => e.stopPropagation()}
                className="font-mono text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>{vehicle.yard_contact_number || '7673982156'}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Action Buttons: 2 buttons side by side */}
        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(vehicle);
            }}
            className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>Details</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEnquire(vehicle);
            }}
            className="flex-1 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition active:scale-98"
          >
            <Phone className="w-3.5 h-3.5 text-white" />
            <span>Contact Yard</span>
          </button>
        </div>
      </div>
    </article>
  );
};
