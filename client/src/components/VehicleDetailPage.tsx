import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, MapPin, Calendar, Tag, Phone, 
  Share2, ShieldCheck, ChevronRight, Check, AlertCircle, Info,
  Building2, CheckCircle2, Camera,
  CheckCircle, Send, Car, Truck, Tractor, HardHat, BadgeCheck
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

  // Enquiry Form State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState<string | null>(null);
  const [enquiryError, setEnquiryError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setActiveImageIndex(0);
    setEnquirySuccess(null);
    setEnquiryError(null);

    Promise.all([
      fetchPublicVehicleById(vehicleId),
      fetchSimilarVehicles(vehicleId)
    ])
      .then(([veh, similar]) => {
        setVehicle(veh);
        setSimilarVehicles(similar);
      })
      .catch((err) => {
        console.error('Failed to load vehicle details', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [vehicleId]);

  const handleShare = () => {
    if (navigator.share && vehicle) {
      navigator.share({
        title: `${vehicle.make} ${vehicle.model} - AutoHub`,
        text: `Check out this verified ${vehicle.make} ${vehicle.model} (${vehicle.manufacturing_year}) at AutoHub Yard!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnquiryError(null);
    setEnquirySuccess(null);

    if (!customerName.trim()) {
      setEnquiryError('Please enter your full name');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      setEnquiryError('Please enter a valid contact phone number');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitCustomerEnquiry({
        vehicle_id: vehicle?.id,
        customer_name: customerName,
        phone_number: customerPhone,
        message: customerNotes.trim() || `Inquiry for direct purchase of ${vehicle?.make} ${vehicle?.model} (${vehicle?.registration_number || ''}).`
      });

      setEnquirySuccess(res.message || 'Your enquiry has been received! The yard team will contact you shortly.');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerNotes('');
    } catch (err: any) {
      setEnquiryError(err.message || 'Failed to submit enquiry. Please try again or call the yard directly.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-medium text-sm">Loading vehicle records...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-card">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-heading font-black text-slate-900 mb-2">Vehicle Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">
            The vehicle listing you requested might have been sold or unpublished from the active yard catalogue.
          </p>
          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
          >
            Back to Vehicle Inventory
          </button>
        </div>
      </div>
    );
  }

  const categoryIcons: Record<string, any> = {
    'Own Car': Car,
    'Taxi Car': Car,
    'SCV': Truck,
    'LCV': Truck,
    'HCV': Truck,
    'Tractor': Tractor,
    'CE': HardHat,
  };
  const CategoryIcon = categoryIcons[vehicle.vehicle_category] || Car;

  const images: string[] = (vehicle.images && vehicle.images.length > 0)
    ? vehicle.images.map((img) => img.image_url)
    : (vehicle.primary_image_url ? [vehicle.primary_image_url] : []);

  const yardPhone = vehicle.yard_contact_number || '7673982156';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-16 z-30 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Inventory</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="h-9 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedShare ? 'Copied Link!' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Main Grid: Gallery + Core Info & Action Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Photo Gallery + Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Main Showcase Image */}
            <div className="relative aspect-[16/10] sm:aspect-[16/10] bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 shadow-card group">
              {images.length > 0 ? (
                <img
                  src={images[activeImageIndex]}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover transition duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                  <Camera className="w-12 h-12 mb-2 stroke-1" />
                  <span className="text-xs font-medium">No inspection photos available</span>
                </div>
              )}

              {/* Verified Badge */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                  <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                  Verified Stock
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-[11px] font-black uppercase tracking-wider font-mono">
                  {vehicle.vehicle_category}
                </span>
              </div>

              {/* Photo counter pill */}
              {images.length > 1 && (
                <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-mono font-bold">
                  {activeImageIndex + 1} / {images.length} Photos
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-16 rounded-2xl overflow-hidden border-2 shrink-0 transition ${
                      activeImageIndex === idx
                        ? 'border-blue-600 ring-2 ring-blue-600/30'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Vehicle Header Mobile-visible */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-card space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                  <CategoryIcon className="w-4 h-4" />
                  <span>{vehicle.vehicle_category}</span>
                  <span>•</span>
                  <span>{vehicle.manufacturing_year} Model</span>
                </div>
                <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
                  {vehicle.make} {vehicle.model}
                </h1>
                {vehicle.variant && (
                  <p className="text-sm font-semibold text-slate-500 mt-0.5">
                    {vehicle.variant}
                  </p>
                )}
              </div>

              {/* Key Highlights Pill Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Year</span>
                  <strong className="text-sm font-black text-slate-800">{vehicle.manufacturing_year}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Variant / Spec</span>
                  <strong className="text-sm font-black text-slate-800 truncate block">{vehicle.variant || 'Standard'}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registration</span>
                  <strong className="text-sm font-black text-slate-800 font-mono">
                    {vehicle.registration_number ? vehicle.registration_number.slice(0, 10) : 'Available'}
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Yard Location</span>
                  <strong className="text-sm font-black text-slate-800 truncate block">
                    {vehicle.yard_name || vehicle.branch_location}
                  </strong>
                </div>
              </div>
            </div>

            {/* Yard & Location Information Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-6 sm:p-7 shadow-card space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block">
                    Designated Regional Depot
                  </span>
                  <h3 className="text-lg font-heading font-black text-white mt-0.5">
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
                        📞 {yardPhone}
                      </strong>
                    </div>

                    <a
                      href={`tel:${yardPhone}`}
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Chassis Identification
                  </span>
                  <strong className="font-mono text-slate-800 text-xs">
                    {vehicle.chassis_number || 'Verified on Yard Log'}
                  </strong>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Engine Serial Number
                  </span>
                  <strong className="font-mono text-slate-800 text-xs">
                    {vehicle.engine_number || 'Available on physical check'}
                  </strong>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Category Type
                  </span>
                  <strong className="text-slate-800 text-xs">{vehicle.vehicle_category}</strong>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Physical Yard Stock Status
                  </span>
                  <strong className="text-emerald-700 text-xs flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ready for Inspection
                  </strong>
                </div>
              </div>

              {vehicle.public_description && (
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                  <p>{vehicle.public_description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pricing & Direct Yard Purchase / Enquiry */}
          <div className="lg:col-span-5 space-y-6">
            {/* Price Box */}
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
                  Available for direct physical inspection and purchase at the designated yard.
                </p>
              </div>
            </div>

            {/* Direct Yard Enquiry Box */}
            <div id="enquiry-section" className="bg-[#0B192C] text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-base text-white">
                      Direct Yard Purchase & Enquiry
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Connect Directly with Yard Personnel
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500 text-white font-mono">
                  Available
                </span>
              </div>

              {/* Direct Yard Hotline */}
              <a
                href={`tel:${yardPhone}`}
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 active:scale-98 flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Call Yard Directly: {yardPhone}</span>
              </a>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-white/10 w-full" />
                <span className="bg-[#0B192C] px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">or send enquiry</span>
              </div>

              {enquirySuccess ? (
                <div className="p-5 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-center space-y-3">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-white text-base">Enquiry Received!</h4>
                  <p className="text-xs text-emerald-200 leading-relaxed">{enquirySuccess}</p>
                  <button
                    type="button"
                    onClick={() => setEnquirySuccess(null)}
                    className="text-xs font-bold text-cyan-300 hover:underline pt-2 block mx-auto"
                  >
                    Send another enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="space-y-4">
                  {enquiryError && (
                    <div className="p-3 bg-rose-950/90 border border-rose-500/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{enquiryError}</span>
                    </div>
                  )}

                  {/* Buyer Name & Phone */}
                  <div className="space-y-2.5">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Your Full Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full h-11 px-3.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        required
                        placeholder="Your Contact Phone Number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full h-11 px-3.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                    <div>
                      <textarea
                        rows={2}
                        placeholder="Notes or questions for the yard..."
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        className="w-full p-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-blue-500/20 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <span>Sending Enquiry...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Yard Enquiry</span>
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
          href="#enquiry-section"
          className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-2 shadow-md active:scale-95"
        >
          <Phone className="w-4 h-4" />
          <span>Contact Yard Now</span>
        </a>
      </div>
    </div>
  );
};
