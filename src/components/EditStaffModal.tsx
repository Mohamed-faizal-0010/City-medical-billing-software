import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Shield,
  Phone,
  Mail,
  FileBadge,
  Lock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Save
} from 'lucide-react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storage';

interface EditStaffModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedUser: User) => void;
}

export const EditStaffModal: React.FC<EditStaffModalProps> = ({
  user,
  isOpen,
  onClose,
  onSaved
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [newPassword, setNewPassword] = useState('');
  const [syncWithPharmacistBill, setSyncWithPharmacistBill] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setRole(user.role || 'cashier');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setLicenseNumber(user.licenseNumber || '');
      setStatus(user.status || 'active');
      setNewPassword('');
      setError('');
      setSuccess('');
      // If role is pharmacist, default sync to true
      setSyncWithPharmacistBill(user.role === 'pharmacist');
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Staff Full Name is required.');
      return;
    }

    const trimmedUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    if (!trimmedUsername) {
      setError('Username is required.');
      return;
    }

    const updates: Partial<User> = {
      name: trimmedName,
      username: trimmedUsername,
      role,
      phone: phone.trim(),
      email: email.trim(),
      licenseNumber: licenseNumber.trim(),
      status
    };

    if (newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        setError('New password must be at least 4 characters long.');
        return;
      }
      updates.password = newPassword.trim();
    }

    const res = StorageService.updateUser(user.id, updates);

    if (res.success && res.user) {
      // If sync requested or if this is the registered pharmacist, also update the store's official registered pharmacist profile
      if (syncWithPharmacistBill || role === 'pharmacist') {
        const currentProfile = StorageService.getPharmacyProfile();
        StorageService.savePharmacyProfile({
          ...currentProfile,
          pharmacistName: trimmedName,
          pharmacistRegNo: licenseNumber.trim() || currentProfile.pharmacistRegNo
        });
      }

      setSuccess(`Staff profile for "${res.user.name}" updated successfully!`);
      setTimeout(() => {
        onSaved(res.user!);
        onClose();
      }, 500);
    } else {
      setError(res.error || 'Failed to update staff member.');
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-emerald-300">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Edit Staff Member</h3>
              <p className="text-xs text-emerald-200/90">
                Update name, credentials, and role for <span className="font-mono font-semibold text-white">@{user.username}</span>
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
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

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Staff Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Anusya Begum, D.Pharm / Muthu Kumar"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              This name will be stamped on POS receipts, Schedule H1 registers, and system activity logs.
            </p>
          </div>

          {/* Username & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username (@login) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Designation / Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="pharmacist">Registered Pharmacist</option>
                <option value="cashier">POS Cashier (Billing)</option>
                <option value="admin">System Administrator</option>
                <option value="doctor">Consultant Doctor</option>
              </select>
            </div>
          </div>

          {/* Pharmacy Council License / Reg Number & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <FileBadge className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pharmacy Reg. / License No.</span>
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={e => setLicenseNumber(e.target.value)}
                placeholder="e.g. TN-RPH-78419"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mobile Number</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 8438678498"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Email & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. anusya.citymed@gmail.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="active">Active (Can Login & Bill)</option>
                <option value="inactive">Suspended (Access Disabled)</option>
              </select>
            </div>
          </div>

          {/* Optional Password Update */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>Change Password / Security PIN (Optional)</span>
            </label>
            <input
              type="text"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Sync With Pharmacist On Invoice Checkbox */}
          {(role === 'pharmacist' || user.role === 'pharmacist') && (
            <label className="flex items-start gap-2.5 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={syncWithPharmacistBill}
                onChange={e => setSyncWithPharmacistBill(e.target.checked)}
                className="mt-0.5 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-emerald-950 block">
                  Sync as Primary Registered Pharmacist for Invoices & Tax Bills
                </span>
                <span className="text-[11px] text-emerald-800 block mt-0.5">
                  Automatically updates "Reg. Pharmacist: {name || '...'}" printed on all Tax Invoices, thermal slips, and Schedule H1 ledgers.
                </span>
              </div>
            </label>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Staff Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
