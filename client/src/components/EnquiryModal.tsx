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
  const [tab, setTab] = useState<'bid' | 'enquiry'>('bid');
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
      if (numericBid < minBasePrice) {
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
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-heading text-white">
                Submit an online enquiry
              </h3>
              <p className="text-[11px] text-slate-400">
                IKF Vehicle Finance • Direct Yard Sales
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
                Bid Registered Successfully!
              </h4>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                {successMsg}
              </p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bidder Name:</span>
                  <strong className="text-slate-900">{customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Number:</span>
                  <strong className="text-slate-900 font-mono">{phoneNumber}</strong>
                </div>
                {bidPrice && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Bid Amount:</span>
                    <strong className="font-mono text-sm">₹{Number(bidPrice).toLocaleString('en-IN')}</strong>
                  </div>
                )}
                {vehicle && (
                  <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                    <span>Purchase Branch:</span>
                    <strong>{vehicle.branch_location}</strong>
                  </div>
                )}
              </div>
              <button
                onClick={handleReset}
                className="w-full py-3.5 bg-brand-navy hover:bg-slate-800 text-white text-xs font-bold rounded-2xl transition shadow-md"
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
                        Base Asking Price: <strong className="text-slate-900">{formatPrice(vehicle.price)}</strong>
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
                </div>
              )}

              {/* Mode Tabs */}
              {vehicle && (
                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setTab('bid')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      tab === 'bid'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Gavel className="w-3.5 h-3.5 text-amber-500" />
                    Place Price Bid
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('enquiry')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      tab === 'enquiry'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    General Enquiry
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Bid Amount Input (when tab === 'bid') */}
              {tab === 'bid' && vehicle && (
                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-black text-amber-950 uppercase tracking-wider">
                      Your Offer / Bid Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] font-bold text-amber-800">
                      Min: ₹{minBasePrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      min={minBasePrice}
                      value={bidPrice}
                      onChange={(e) => setBidPrice(e.target.value)}
                      placeholder={String(minBasePrice)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-amber-300 bg-white text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs font-mono"
                    />
                  </div>

                  {/* Quick increment pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[5000, 10000, 25000, 50000].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => handleIncrementBid(inc)}
                        className="text-[10px] font-bold text-amber-800 bg-amber-100/90 hover:bg-amber-200 px-2 py-1 rounded-md transition flex items-center gap-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" /> ₹{(inc / 1000)}k
                      </button>
                    ))}
                  </div>
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
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-extrabold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Submitting to IKF System...</span>
                ) : (
                  <>
                    <Gavel className="w-4 h-4" />
                    <span>Submit an online enquiry {tab === 'bid' && bidPrice ? `(₹${Number(bidPrice).toLocaleString('en-IN')})` : ''}</span>
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
