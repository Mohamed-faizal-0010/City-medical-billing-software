import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  FileText,
  AlertCircle,
  Building2,
  MapPin,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { PharmacyProfile } from '../types';

interface EditGstinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGstinUpdated?: (newGstin: string) => void;
}

// Indian State Codes for GST
const GST_STATE_CODES: Record<string, string> = {
  '33': 'Tamil Nadu',
  '32': 'Kerala',
  '29': 'Karnataka',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '27': 'Maharashtra',
  '07': 'Delhi',
  '09': 'Uttar Pradesh',
  '24': 'Gujarat',
  '19': 'West Bengal'
};

const DEFAULT_GSTIN = '33AALFC1234F1Z5';

export const EditGstinModal: React.FC<EditGstinModalProps> = ({
  isOpen,
  onClose,
  onGstinUpdated
}) => {
  const [profile, setProfile] = useState<PharmacyProfile>(() => StorageService.getPharmacyProfile());
  const [gstinInput, setGstinInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = StorageService.getPharmacyProfile();
      setProfile(current);
      setGstinInput(current.gstin || DEFAULT_GSTIN);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Validate Indian GSTIN format (15 characters alphanumeric)
  // Structure: 2-digit state code + 10-char PAN + 1 entity num + 'Z' + 1 check digit
  const cleanGstin = gstinInput.trim().toUpperCase().replace(/\s/g, '');
  const stateCode = cleanGstin.slice(0, 2);
  const panPart = cleanGstin.slice(2, 12);
  const stateName = GST_STATE_CODES[stateCode] || (stateCode.length === 2 ? 'Other State' : 'Unknown');

  const isValidLength = cleanGstin.length === 15;
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const isStrictValid = gstinRegex.test(cleanGstin);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanGstin) {
      setError('GST number cannot be empty.');
      return;
    }

    if (cleanGstin.length !== 15) {
      setError('GSTIN must be exactly 15 alphanumeric characters (e.g. 33AALFC1234F1Z5).');
      return;
    }

    // Save to storage
    const updated = StorageService.updateGstin(cleanGstin);
    setProfile(updated);
    setSuccess(true);
    if (onGstinUpdated) {
      onGstinUpdated(cleanGstin);
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleResetToDefault = () => {
    setGstinInput(DEFAULT_GSTIN);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Edit Pharmacy GST Number</h3>
              <p className="text-xs text-slate-500">GSTIN Registration for Tax Invoices & B2B Inward</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-900 text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>GSTIN updated successfully! Propagated to all POS receipts and bills.</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-900 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Goods & Services Tax Identification Number (GSTIN) *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={15}
                value={gstinInput}
                onChange={e => {
                  setGstinInput(e.target.value.toUpperCase().replace(/\s/g, ''));
                  setError(null);
                }}
                placeholder="33AALFC1234F1Z5"
                className={`w-full px-4 py-3 bg-slate-50 border font-mono font-black text-lg tracking-widest uppercase rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  isStrictValid
                    ? 'border-emerald-300 text-emerald-950 focus:ring-emerald-500'
                    : isValidLength
                    ? 'border-teal-300 text-slate-900 focus:ring-teal-500'
                    : 'border-slate-300 text-slate-900 focus:ring-teal-500'
                }`}
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs">
                <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                  cleanGstin.length === 15 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {cleanGstin.length}/15
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Indian GSTIN format: 2 Digits State Code + 10 Digits PAN + 1 Entity + 'Z' + 1 Checksum
            </p>
          </div>

          {/* GSTIN Analysis Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                State Code:
              </span>
              <span className="font-mono font-bold text-slate-800">
                {stateCode || '--'} {stateCode ? `(${stateName})` : ''}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                Business PAN Entity:
              </span>
              <span className="font-mono font-bold text-slate-800">
                {panPart || '--'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Pharmacy Name:
              </span>
              <span className="font-semibold text-slate-900">
                {profile.name}
              </span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to City Medical (33AALFC1234F1Z5)</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Apply GSTIN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
