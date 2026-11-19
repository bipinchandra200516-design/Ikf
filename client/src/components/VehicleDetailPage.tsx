import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, MapPin, Calendar, Tag, Phone, 
  Share2, ShieldCheck, ChevronRight, Check, AlertCircle, Info,
  Calculator, Sparkles, Building2, CheckCircle2, Camera, Gavel,
  CheckCircle, Plus, Send, Car, Truck, Tractor, HardHat, BadgeCheck
} from 'lucide-react';
import { PublicVehicle, DealershipSettings, VehicleCategory } from '../types';
import { fetchPublicVehicleById, fetchSimilarVehicles, submitCustomerEnquiry } from '../services/api';
import { formatPrice, VehicleCard } from './VehicleCard';

interface VehicleDetailPageProps {
  vehicleId: string;
  settings: DealershipSettings;
  onBack: () => void;
  onSelectVehicle: (vehicle: PublicVehicle) => void;
  onEnquire: (vehicle: PublicVehicle) => void;
}

export const VehicleDetailPage: React.FC<VehicleDetailPageProps> = ({
  vehicleId,
  settings,
  onBack,
  onSelectVehicle,
  onEnquire
}) => {
  const [vehicle, setVehicle] = useState<PublicVehicle | null>(null);
  const [similarVehicles, setSimilarVehicles] = useState<PublicVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);

  // Direct Bidding Form State
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidderName, setBidderName] = useState<string>('');
  const [bidderPhone, setBidderPhone] = useState<string>('');
  const [bidderNotes, setBidderNotes] = useState<string>('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);
  const [bidError, setBidError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setActiveImageIndex(0);
    setBidSuccess(null);
    setBidError(null);

    Promise.all([
      fetchPublicVehicleById(vehicleId),
      fetchSimilarVehicles(vehicleId)
    ])
      .then(([v, similar]) => {
        setVehicle(v);
        setSimilarVehicles(similar);
        setLoading(false);
        if (v && v.price > 0) {
          setBidAmount(String(v.price));
        }
      })
      .catch((err) => {
        console.error('Failed to load vehicle details:', err);
        setLoading(false);
      });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [vehicleId]);

  const handleShare = () => {
    if (navigator.share && vehicle) {
      navigator.share({
        title: `${vehicle.make} ${vehicle.model} - AutoHub Vehicles`,
        text: `Check out this certified ${vehicle.manufacturing_year} ${vehicle.make} ${vehicle.model} available at ${vehicle.branch_location} branch.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleDirectBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError(null);
    setBidSuccess(null);

    if (!bidderName.trim()) {
      setBidError('Please enter your full name');
      return;
    }
    if (!bidderPhone.trim() || bidderPhone.trim().length < 8) {
      setBidError('Please enter a valid contact phone number');
      return;
    }

    const numBid = Number(bidAmount);
    const minPrice = vehicle?.price || 0;
    if (isNaN(numBid) || numBid <= 0) {
      setBidError('Please enter a valid bid amount greater than ₹0');
      return;
    }
    if (minPrice > 0 && numBid < minPrice) {
      setBidError(`Your bid must be greater than or equal to the base asking price of ₹${minPrice.toLocaleString('en-IN')}`);
      return;
    }

    setSubmittingBid(true);
    try {
      const res = await submitCustomerEnquiry({
        vehicle_id: vehicle?.id,
        customer_name: bidderName,
        phone_number: bidderPhone,
        bid_price: numBid,
        message: bidderNotes.trim() || `Online bid of ₹${numBid.toLocaleString('en-IN')} placed on ${vehicle?.make} ${vehicle?.model} (${vehicle?.registration_number}).`
      });

      setBidSuccess(res.message || `Bid of ₹${numBid.toLocaleString('en-IN')} registered! The yard team will contact you.`);
    } catch (err: any) {
      setBidError(err.message || 'Failed to submit bid. Please try again.');
    } finally {
      setSubmittingBid(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">Loading verified vehicle details...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20 px-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-slate-200 shadow-card">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-black text-slate-900 font-heading">Vehicle Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            The vehicle listing you are looking for may have been sold or removed from the database.
          </p>
          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
          >
            Return to Inventory
          </button>
        </div>
      </div>
    );
  }

  const galleryImages = (vehicle.images && vehicle.images.length > 0)
    ? vehicle.images.map(img => img.image_url)
    : [vehicle.primary_image_url];

  const currentMainPhoto = galleryImages[activeImageIndex] || vehicle.primary_image_url;

  return (
    <div className="bg-slate-50 min-h-screen pb-28 sm:pb-20">
      {/* Top Breadcrumb & Action Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-[72px] z-30 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span>Back to Inventory</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{copiedShare ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* Vehicle Header Info */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider">
              {vehicle.vehicle_category}
            </span>
            {vehicle.registration_number && (
              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-md bg-white border border-slate-300 text-slate-900 shadow-xs">
                {vehicle.registration_number}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
              Certified Dealership Unit
            </span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-4xl lg:text-5xl text-slate-900 leading-tight">
            {vehicle.manufacturing_year} {vehicle.make} {vehicle.model}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 mt-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{vehicle.branch_location} Branch Yard</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{vehicle.yard_name || 'Designated Yard'}</span>
            </span>
            <span>•</span>
            <span className="text-slate-400">Stock ID: {vehicle.id}</span>
          </div>
        </div>

        {/* Master 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column (7 cols): Gallery + Specs + Inspection Note */}
          <div className="lg:col-span-7 space-y-6">

            {/* Photo Gallery Card */}
            <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/90 shadow-card overflow-hidden">
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900">
                <img
                  src={currentMainPhoto}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />

                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Photo {activeImageIndex + 1} of {galleryImages.length}</span>
                </div>
              </div>

              {/* Thumbnails Row */}
              {galleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pt-3 pb-1 scrollbar-thin">
                  {galleryImages.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        activeImageIndex === idx
                          ? 'border-blue-600 ring-2 ring-blue-600/30'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Physical Yard Inspection Card (Swapped Requirement) */}
            <div className="bg-gradient-to-br from-[#0B192C] to-[#1B3B6F] text-white rounded-3xl p-6 sm:p-7 shadow-card">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                    Yard Visit & Inspection Location
                  </span>
                  <h3 className="text-xl font-black text-white font-heading mt-0.5">
                    {vehicle.branch_location} Branch & Depot
                  </h3>
                  <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                    Buyers are invited to physically inspect the unit at <strong>{vehicle.yard_name || 'Designated Yard'}</strong> in Telangana. Verify engine serials, chassis embossing, and tire condition prior to finalizing settlement.
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Yard Staff Direct Contact
                      </span>
                      <strong className="text-sm font-mono text-emerald-400 font-black">
                        📞 {vehicle.yard_contact_number || '1800-309-3090'}
                      </strong>
                    </div>

                    <a
                      href={`tel:${vehicle.yard_contact_number || '1800-309-3090'}`}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Yard Staff</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Verified Specifications */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-card space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-heading font-black text-lg text-slate-900">
                  Verified Technical Specifications
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registration Number</span>
                  <strong className="text-slate-900 font-mono text-sm font-black">{vehicle.registration_number || 'Verified'}</strong>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Manufacturing Year</span>
                  <strong className="text-slate-900 text-sm font-black">{vehicle.manufacturing_year}</strong>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chassis Number</span>
                  <strong className="text-slate-900 font-mono text-xs font-bold break-all">
                    {vehicle.chassis_number || 'Verified at Yard'}
                  </strong>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Engine Number</span>
                  <strong className="text-slate-900 font-mono text-xs font-bold break-all">
                    {vehicle.engine_number || 'Verified at Yard'}
                  </strong>
                </div>
              </div>

              {vehicle.public_description && (
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                  {vehicle.public_description}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Pricing Card + "Submit an online enquiry" Form */}
          <div id="bidding-section" className="lg:col-span-5 space-y-6">

            {/* Base Price Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/80">
                  {vehicle.price_label || 'Base Asking Price'}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Available
                </span>
              </div>

              <div>
                <div className="font-heading font-black text-3xl sm:text-4xl text-slate-900">
                  NA
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Open for competitive online bidding. Enter your best offer below.
                </p>
              </div>
            </div>

            {/* "Submit an online enquiry" Box */}
            <div className="bg-[#0B192C] text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Gavel className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-base text-white">
                      Submit an online enquiry
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Direct Bidding & Yard Registration
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono">
                  Live
                </span>
              </div>

              {bidSuccess ? (
                <div className="p-5 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-center space-y-3">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-white text-base">Enquiry & Bid Received!</h4>
                  <p className="text-xs text-emerald-200 leading-relaxed">{bidSuccess}</p>
                  <button
                    type="button"
                    onClick={() => setBidSuccess(null)}
                    className="text-xs font-bold text-amber-300 hover:underline pt-2 block mx-auto"
                  >
                    Submit another online enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDirectBidSubmit} className="space-y-4">
                  {bidError && (
                    <div className="p-3 bg-rose-950/90 border border-rose-500/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{bidError}</span>
                    </div>
                  )}

                  {/* Bid Amount Input */}
                  <div>
                    <div className="flex justify-between items-center text-xs text-slate-300 mb-1.5 font-semibold">
                      <span>Your Offer / Bid (₹)</span>
                      <span className="text-amber-400 font-mono">Open Bidding</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        required
                        min={1}
                        placeholder="Enter bid amount (e.g. 150000)"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="w-full h-12 pl-8 pr-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white font-mono font-bold text-lg focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Quick increment chips */}
                    <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                      {[5000, 10000, 25000, 50000].map(inc => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => {
                            const curr = Number(bidAmount) || 0;
                            setBidAmount(String(curr + inc));
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 shrink-0"
                        >
                          +{inc >= 1000 ? `₹${inc / 1000}k` : inc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Buyer Name & Phone */}
                  <div className="space-y-2.5">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Your Full Name"
                        value={bidderName}
                        onChange={(e) => setBidderName(e.target.value)}
                        className="w-full h-11 px-3.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        required
                        placeholder="Your Contact Phone Number"
                        value={bidderPhone}
                        onChange={(e) => setBidderPhone(e.target.value)}
                        className="w-full h-11 px-3.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingBid}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingBid ? (
                      <span>Submitting Bid...</span>
                    ) : (
                      <>
                        <Gavel className="w-4 h-4" />
                        <span>Submit an online enquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Similar Vehicles Grid */}
        {similarVehicles.length > 0 && (
          <div className="mt-16 sm:mt-20 pt-10 border-t border-slate-200">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-blue-700 block mb-1">
                  More Options in {vehicle.vehicle_category}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                  Similar Available Units
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarVehicles.map((sim) => (
                <VehicleCard
                  key={sim.id}
                  vehicle={sim}
                  onViewDetails={onSelectVehicle}
                  onEnquire={onEnquire}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Action Bar for Mobile View */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-3 shadow-sheet flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Base Asking Price
          </span>
          <strong className="font-heading font-black text-lg text-slate-900 leading-tight">
            {formatPrice(vehicle.price)}
          </strong>
        </div>

        <a
          href="#bidding-section"
          className="h-11 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md active:scale-95"
        >
          <Gavel className="w-4 h-4" />
          <span>Submit an online enquiry</span>
        </a>
      </div>
    </div>
  );
};
