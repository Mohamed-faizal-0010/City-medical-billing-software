import React, { useState, useEffect } from 'react';
import {
  X,
  FileBadge,
  Award,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Printer
} from 'lucide-react';
import { PharmacyProfile } from '../types';
import { StorageService } from '../services/storage';

interface EditPharmacistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedProfile: PharmacyProfile) => void;
}

export const EditPharmacistModal: React.FC<EditPharmacistModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [profile, setProfile] = useState<PharmacyProfile>(() => StorageService.getPharmacyProfile());
  const [pharmacistName, setPharmacistName] = useState('');
  const [pharmacistRegNo, setPharmacistRegNo] = useState('');
  const [pharmacistQualification, setPharmacistQualification] = useState('');
  const [syncUserAccount, setSyncUserAccount] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      const p = StorageService.getPharmacyProfile();
      setProfile(p);
      setPharmacistName(p.pharmacistName || 'Anusya Begum');
      setPharmacistRegNo(p.pharmacistRegNo || 'TN-RPH-78419');
      setPharmacistQualification(p.pharmacistQualification || 'D.Pharm, Reg. Pharmacist');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = pharmacistName.trim();
    if (!trimmedName) {
      setError('Pharmacist name is required.');
      return;
    }

    const updated: PharmacyProfile = {
      ...profile,
      pharmacistName: trimmedName,
      pharmacistRegNo: pharmacistRegNo.trim(),
      pharmacistQualification: pharmacistQualification.trim()
    };

    StorageService.savePharmacyProfile(updated);

    // If sync with pharmacist user account is checked, update usr-2 or pharmacist role user
    if (syncUserAccount) {
      const users = StorageService.getUsers();
      const pharmUser = users.find(u => u.role === 'pharmacist' || u.username === 'pharmacist');
      if (pharmUser) {
        StorageService.updateUser(pharmUser.id, {
          name: trimmedName,
          licenseNumber: pharmacistRegNo.trim() || pharmUser.licenseNumber
        });
      }
    }

    setSuccess('Registered Pharmacist details updated across all bills and records!');
    setTimeout(() => {
      onSaved(updated);
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-emerald-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Edit Registered Pharmacist</h3>
              <p className="text-xs text-emerald-200/90">
                Official licensing details printed on Tax Invoices & Registers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Pharmacist Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Registered Pharmacist Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={pharmacistName}
              onChange={e => setPharmacistName(e.target.value)}
              placeholder="e.g. Anusya Begum"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Printed on POS tax bills, thermal slips, counter standees, and official registers.
            </p>
          </div>

          {/* Registration Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileBadge className="w-3.5 h-3.5 text-emerald-600" />
              <span>State Pharmacy Council Registration No.</span>
            </label>
            <input
              type="text"
              value={pharmacistRegNo}
              onChange={e => setPharmacistRegNo(e.target.value)}
              placeholder="e.g. TN-RPH-78419 / TN-PC-48291"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Qualifications & Degree */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-teal-600" />
              <span>Qualifications / Designation</span>
            </label>
            <input
              type="text"
              value={pharmacistQualification}
              onChange={e => setPharmacistQualification(e.target.value)}
              placeholder="e.g. D.Pharm, Reg. Pharmacist / B.Pharm"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Sync User Account */}
          <label className="flex items-start gap-2.5 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={syncUserAccount}
              onChange={e => setSyncUserAccount(e.target.checked)}
              className="mt-0.5 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-emerald-950 block">
                Sync with Pharmacist Login Account (@pharmacist)
              </span>
              <span className="text-[11px] text-emerald-800 block mt-0.5">
                Also updates the display name and license number for the pharmacist user account.
              </span>
            </div>
          </label>

          {/* Live Preview Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1 text-slate-700 font-bold">
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              <span>How it will appear on customer bills:</span>
            </div>
            <div className="font-mono bg-white p-2 rounded-lg border border-slate-200 text-slate-800">
              Reg. Pharmacist: <span className="font-bold text-emerald-800">{pharmacistName || '...'}</span>
              {pharmacistQualification ? ` (${pharmacistQualification})` : ''}
              {pharmacistRegNo ? ` • Reg #${pharmacistRegNo}` : ''}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Pharmacist Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
