import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Phone, Send, CheckCircle2, AlertCircle, Gavel, MapPin, Building2, Plus } from 'lucide-react';
import { PublicVehicle, DealershipSettings } from '../types';
import { submitCustomerEnquiry } from '../services/api';
import { formatPrice } from './VehicleCard';

interface EnquiryModalProps {
  vehicle: PublicVehicle | null;
  settings: DealershipSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  vehicle,
  settings,
  isOpen,
  onClose
}) => {
  const [tab, setTab] = useState<'bid' | 'enquiry'>('enquiry');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [bidPrice, setBidPrice] = useState<string>('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const minBasePrice = vehicle?.price || 0;

  useEffect(() => {
    if (vehicle && minBasePrice > 0) {
      setBidPrice(String(minBasePrice));
    } else {
      setBidPrice('');
    }
  }, [vehicle]);

  if (!isOpen) return null;

  const handleIncrementBid = (delta: number) => {
    const current = Number(bidPrice) || minBasePrice;
    setBidPrice(String(current + delta));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Please provide your full name');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 8) {
      setError('Please provide a valid contact phone number');
      return;
    }

    let numericBid: number | undefined = undefined;
    if (tab === 'bid' && vehicle) {
      numericBid = Number(bidPrice);
      if (isNaN(numericBid) || numericBid <= 0) {
        setError('Please enter a valid numeric bid amount');
        return;
      }
      if (minBasePrice > 0 && numericBid < minBasePrice) {
        setError(`Your bid of ₹${numericBid.toLocaleString('en-IN')} cannot be less than the base asking price of ₹${minBasePrice.toLocaleString('en-IN')}`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await submitCustomerEnquiry({
        vehicle_id: vehicle ? vehicle.id : undefined,
        customer_name: customerName,
        phone_number: phoneNumber,
        email,
        bid_price: numericBid,
        message: message.trim() || (
          numericBid
            ? `I would like to place a bid of ₹${numericBid.toLocaleString('en-IN')} on ${vehicle?.make} ${vehicle?.model} (${vehicle?.registration_number}). Please register my bid.`
            : `I am interested in ${vehicle ? `${vehicle.vehicle_category} - ${vehicle.make} ${vehicle.model}` : 'available inventory'}. Please contact me.`
        )
      });

      setSuccess(true);
      setSuccessMsg(res.message || 'Submitted successfully!');
    } catch (err: any) {
      setError(err.message || 'Unable to submit enquiry at this time.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setError(null);
    setCustomerName('');
    setPhoneNumber('');
    setEmail('');
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-heading text-white">
                Direct Yard Enquiry
              </h3>
              <p className="text-[11px] text-slate-400">
                AutoHub Marketplace • Direct Yard Contact
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-black text-slate-900 font-heading">
                Enquiry Sent Successfully!
              </h4>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                {successMsg || 'Our yard representative will contact you shortly regarding vehicle inspection.'}
              </p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Name:</span>
                  <strong className="text-slate-900">{customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone Number:</span>
                  <strong className="text-slate-900 font-mono">{phoneNumber}</strong>
                </div>
                {vehicle && (
                  <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                    <span>Yard Location:</span>
                    <strong>{vehicle.yard_name || vehicle.branch_location}</strong>
                  </div>
                )}
                <div className="flex justify-between text-emerald-700 pt-1">
                  <span>Yard Representative:</span>
                  <strong className="font-mono">7673982156</strong>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl transition shadow-md"
              >
                Close & Return
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Vehicle Context Preview */}
              {vehicle && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={vehicle.primary_image_url}
                      alt={vehicle.make}
                      className="w-16 h-14 object-cover rounded-xl bg-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                          {vehicle.vehicle_category}
                        </span>
                        {vehicle.registration_number && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                            {vehicle.registration_number}
                          </span>
                        )}
                      </div>
                      <h5 className="text-sm font-black text-slate-900 truncate">
                        {vehicle.make} {vehicle.model}
                      </h5>
                      <div className="text-xs text-slate-600 font-medium">
                        Price: <strong className="text-slate-900">NA</strong>
                      </div>
                    </div>
                  </div>

                  {/* Branch and Yard Details (User requirement) */}
                  <div className="pt-2 border-t border-slate-200/70 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate"><strong>Branch:</strong> {vehicle.branch_location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate"><strong>Yard:</strong> {vehicle.yard_name || 'Designated Yard'}</span>
                    </div>
                  </div>

                  {/* Direct Yard Contact */}
                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-semibold">Yard Hotline:</span>
                    <a
                      href="tel:7673982156"
                      className="font-mono font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>7673982156</span>
                    </a>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-sky"
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-sky font-mono"
                />
              </div>

              {/* Optional Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-sky"
                />
              </div>

              {/* Optional Message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Special Notes / Preferred Inspection Date <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Planning to visit Kodada yard this Friday..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-sky"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
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
  );
};
