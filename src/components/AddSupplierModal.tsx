import React, { useState } from 'react';
import { Building2, X, Phone, Mail, MapPin, FileText, CheckCircle2, ShieldCheck, DollarSign } from 'lucide-react';
import { Supplier } from '../types';
import { StorageService } from '../services/storage';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierAdded: (newSupplier: Supplier) => void;
  initialName?: string;
}

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({
  isOpen,
  onClose,
  onSupplierAdded,
  initialName = ''
}) => {
  const [name, setName] = useState(initialName);
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Madurai');
  const [state, setState] = useState('Tamil Nadu');
  const [gstin, setGstin] = useState('');
  const [drugLicenseNo, setDrugLicenseNo] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<'Net 15' | 'Net 30' | 'Net 45' | 'Immediate'>('Net 30');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [agencyCode, setAgencyCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter Supplier / Sublayer Name');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter a valid contact phone number');
      return;
    }

    const newSupplierId = `sup-${Date.now().toString().slice(-5)}`;
    const fullAddress = address.trim() 
      ? `${address.trim()}, ${city}, ${state}` 
      : `${city}, ${state}`;

    const newSupplier: Supplier = {
      id: newSupplierId,
      name: name.trim(),
      contactPerson: contactPerson.trim() || name.trim(),
      phone: phone.trim(),
      email: email.trim() || 'orders@distributor.com',
      address: fullAddress,
      gstin: gstin.trim().toUpperCase() || '33AABCM9901M1ZQ',
      drugLicenseNo: drugLicenseNo.trim().toUpperCase() || 'TN-MDU-DL-2026',
      paymentTerms,
      outstandingPayable: Number(openingBalance) || 0,
      rating: 5.0,
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=80',
      agencyCode: agencyCode.trim().toUpperCase() || `AGY-${name.trim().slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
    };

    // Persist via StorageService
    const current = StorageService.getSuppliers();
    current.unshift(newSupplier);
    StorageService.saveSuppliers(current);

    onSupplierAdded(newSupplier);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4 my-auto animate-fadeIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Add Supplier / Sublayer</h3>
              <p className="text-xs text-slate-500">Register new wholesale pharmaceutical distributor or sub-agency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Supplier / Sublayer Name */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Supplier / Sublayer Firm Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Apex Pharma Distributors / Sublayer Agencies"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Phone / Mobile */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mobile / Phone *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98421 12345"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="orders@apexpharma.com"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            {/* Agency Code / Short Code */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Agency / Sublayer Code
              </label>
              <input
                type="text"
                value={agencyCode}
                onChange={e => setAgencyCode(e.target.value)}
                placeholder="e.g. AGY-APX-01"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* GSTIN */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                GSTIN (GST Number)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={e => setGstin(e.target.value)}
                placeholder="e.g. 33AABCA1234F1Z5"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 uppercase focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Drug License Number */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Drug License No. (D.L. No.)
              </label>
              <input
                type="text"
                value={drugLicenseNo}
                onChange={e => setDrugLicenseNo(e.target.value)}
                placeholder="e.g. TN-MDU-20B-9988"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 uppercase focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Credit / Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                <option value="Net 30">Net 30 Days (Standard)</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 45">Net 45 Days</option>
                <option value="Immediate">Immediate / Cash on Delivery</option>
              </select>
            </div>

            {/* Opening Balance */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Opening Payable Balance (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={openingBalance}
                onChange={e => setOpeningBalance(Number(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Warehouse / Office Address
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Shop 14, Wholesale Medicine Market, Melur Road"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Select Supplier</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
