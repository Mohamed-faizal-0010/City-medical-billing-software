import React, { useState } from 'react';
import { X, Building2, User, Phone, Mail, MapPin, FileText, CreditCard, Calendar, CheckCircle2 } from 'lucide-react';
import { WholesaleBuyer } from '../types';

interface AddWholesaleBuyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (buyer: WholesaleBuyer) => void;
  initialBuyer?: WholesaleBuyer | null;
}

export const AddWholesaleBuyerModal: React.FC<AddWholesaleBuyerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBuyer
}) => {
  const [businessName, setBusinessName] = useState(initialBuyer?.businessName || '');
  const [contactPerson, setContactPerson] = useState(initialBuyer?.contactPerson || '');
  const [phone, setPhone] = useState(initialBuyer?.phone || '');
  const [email, setEmail] = useState(initialBuyer?.email || '');
  const [address, setAddress] = useState(initialBuyer?.address || '');
  const [city, setCity] = useState(initialBuyer?.city || 'Melur');
  const [district, setDistrict] = useState(initialBuyer?.district || 'Madurai');
  const [state, setState] = useState(initialBuyer?.state || 'Tamil Nadu');
  const [stateCode, setStateCode] = useState(initialBuyer?.stateCode || '33');
  const [pincode, setPincode] = useState(initialBuyer?.pincode || '625106');
  const [gstin, setGstin] = useState(initialBuyer?.gstin || '');
  const [drugLicenseNo, setDrugLicenseNo] = useState(initialBuyer?.drugLicenseNo || '');
  const [creditLimit, setCreditLimit] = useState(initialBuyer?.creditLimit?.toString() || '50000');
  const [creditDays, setCreditDays] = useState(initialBuyer?.creditDays?.toString() || '30');
  const [notes, setNotes] = useState(initialBuyer?.notes || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !phone.trim()) {
      alert('Please fill in Business Name and Phone number.');
      return;
    }

    const buyer: WholesaleBuyer = {
      id: initialBuyer?.id || `wb-${Date.now()}`,
      businessName: businessName.trim(),
      contactPerson: contactPerson.trim() || businessName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      district: district.trim(),
      state: state.trim(),
      stateCode: stateCode.trim() || '33',
      pincode: pincode.trim(),
      gstin: gstin.trim().toUpperCase(),
      drugLicenseNo: drugLicenseNo.trim(),
      creditLimit: parseFloat(creditLimit) || 0,
      creditDays: parseInt(creditDays) || 30,
      outstandingBalance: initialBuyer?.outstandingBalance || 0,
      notes: notes.trim()
    };

    onSave(buyer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
              <Building2 className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {initialBuyer ? 'Edit Wholesale Buyer' : 'Register New Wholesale Chemist / Hospital'}
              </h2>
              <p className="text-xs text-indigo-200/80">B2B client profile with GSTIN and Drug License details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Business Name */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Chemist / Hospital / Clinic Trade Name *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="e.g. Sri Meenakshi Medicals & General Store"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Contact Person & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Pharmacist / Proprietor Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  placeholder="e.g. S. Ramanathan, D.Pharm"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mobile / WhatsApp Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 9842109841"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Address (Optional)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. chemist.melur@gmail.com"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* GSTIN & Drug License */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
            <div>
              <label className="font-bold text-indigo-950 block mb-1">Buyer GSTIN (15 Digits)</label>
              <input
                type="text"
                value={gstin}
                onChange={e => setGstin(e.target.value.toUpperCase())}
                placeholder="33AABCM8921R1ZC"
                className="w-full px-3 py-2 border border-indigo-200 rounded-xl font-mono uppercase bg-white"
              />
              <span className="text-[10px] text-indigo-600 block mt-0.5">Required for B2B GST Input Tax Credit</span>
            </div>
            <div>
              <label className="font-bold text-indigo-950 block mb-1">Drug License No. (DL 20/21 or 20B/21B)</label>
              <input
                type="text"
                value={drugLicenseNo}
                onChange={e => setDrugLicenseNo(e.target.value)}
                placeholder="TN-MDU-2022-R20/21-4192"
                className="w-full px-3 py-2 border border-indigo-200 rounded-xl font-mono bg-white"
              />
              <span className="text-[10px] text-indigo-600 block mt-0.5">Statutory requirement for all pharma sales</span>
            </div>
          </div>

          {/* Address & City */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Shop / Delivery Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. 42 Main Bazaar Street, Near Roundana"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">City / Town</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">State & Code</label>
              <input
                type="text"
                value={`${state} (${stateCode})`}
                disabled
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">PIN Code</label>
              <input
                type="text"
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                placeholder="625106"
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Credit Limit & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Credit Limit (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={e => setCreditLimit(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-xl bg-white font-mono font-bold"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-800 block mb-1">Credit Period (Days)</label>
              <select
                value={creditDays}
                onChange={e => setCreditDays(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-bold"
              >
                <option value="0">Immediate Payment (0 Days)</option>
                <option value="7">7 Days Credit</option>
                <option value="15">15 Days Credit</option>
                <option value="30">30 Days Credit (Standard)</option>
                <option value="45">45 Days Credit</option>
                <option value="60">60 Days Credit</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Remarks / Delivery Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Regular weekly orders, preferred tempo delivery"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialBuyer ? 'Update Chemist' : 'Save Chemist Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
