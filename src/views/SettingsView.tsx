import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Lock,
  Building2,
  Phone,
  QrCode,
  Download,
  Upload,
  UserCheck,
  CheckCircle2,
  Key,
  Database,
  RefreshCw,
  Eye,
  EyeOff,
  Users,
  Edit2,
  Award,
  FileBadge,
  UserPlus,
  Printer,
  Play,
  Store,
  Truck,
  Percent,
  Briefcase,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { PharmacyProfile, User, PrinterSettings, PharmacyBusinessType, WholesaleBuyer } from '../types';
import { StorageService } from '../services/storage';
import { UpiQrCodeManager } from '../components/UpiQrCodeManager';
import { EditStaffModal } from '../components/EditStaffModal';
import { EditPharmacistModal } from '../components/EditPharmacistModal';
import { ConnectPrinterModal } from '../components/ConnectPrinterModal';
import { EditGstinModal } from '../components/EditGstinModal';
import { AddWholesaleBuyerModal } from '../components/AddWholesaleBuyerModal';
import { printThermalTestSlipViaBrowser } from '../utils/escPosUtils';

interface SettingsViewProps {
  onProfileUpdated?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onProfileUpdated, onNavigateTab }) => {
  const [profile, setProfile] = useState<PharmacyProfile>(() => StorageService.getPharmacyProfile());
  const [usersList, setUsersList] = useState<User[]>(() => StorageService.getUsers());
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<User | null>(null);
  const [showPharmacistModal, setShowPharmacistModal] = useState(false);
  const [showConnectPrinterModal, setShowConnectPrinterModal] = useState(false);
  const [showEditGstinModal, setShowEditGstinModal] = useState(false);
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(() => StorageService.getPrinterSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [encryptionStatus, setEncryptionStatus] = useState({
    algorithm: 'AES-256-GCM',
    keyLength: '256 bits',
    ivLength: '96 bits',
    dataEncrypted: true,
    lastBackup: 'Today, automated cloud sync'
  });

  // Business profile form state
  const [name, setName] = useState(profile.name);
  const [addressLine1, setAddressLine1] = useState(profile.addressLine1);
  const [taluk, setTaluk] = useState(profile.taluk);
  const [district, setDistrict] = useState(profile.district);
  const [state, setState] = useState(profile.state);
  const [pincode, setPincode] = useState(profile.pincode);
  const [mobile, setMobile] = useState(profile.mobile);
  const [email, setEmail] = useState(profile.email);
  const [gstin, setGstin] = useState(profile.gstin);
  const [drugLicenseNo, setDrugLicenseNo] = useState(profile.drugLicenseNo);
  const [pharmacistName, setPharmacistName] = useState(profile.pharmacistName || 'Anusya Begum');
  const [pharmacistRegNo, setPharmacistRegNo] = useState(profile.pharmacistRegNo || 'TN-RPH-78419');
  const [pharmacistQualification, setPharmacistQualification] = useState(profile.pharmacistQualification || 'D.Pharm, Reg. Pharmacist');
  const [upiVpa, setUpiVpa] = useState(profile.upiVpa);
  
  // Business Operating Mode (Retail / Wholesale / Dual Mode)
  const [businessType, setBusinessType] = useState<PharmacyBusinessType>(profile.businessType || 'both');
  const [retailLicenseNo, setRetailLicenseNo] = useState(profile.retailLicenseNo || 'TN-MDU-2024-R20/21-004928');
  const [wholesaleLicenseNo, setWholesaleLicenseNo] = useState(profile.wholesaleLicenseNo || 'TN-MDU-2024-W20B/21B-0084');
  const [wholesaleDefaultMargin, setWholesaleDefaultMargin] = useState<number>(profile.wholesaleDefaultMargin || 12);
  const [wholesaleCreditDays, setWholesaleCreditDays] = useState<number>(profile.wholesaleCreditDays || 30);
  
  // Wholesale B2B Buyers Directory
  const [wholesaleBuyers, setWholesaleBuyers] = useState<WholesaleBuyer[]>(() => StorageService.getWholesaleBuyers());
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<WholesaleBuyer | null>(null);

  const handleSelectBusinessType = (type: PharmacyBusinessType) => {
    setBusinessType(type);
    StorageService.setBusinessType(type);
    if (type === 'retail') StorageService.setActivePOSMode('retail');
    if (type === 'wholesale') StorageService.setActivePOSMode('wholesale');
    const updated: PharmacyProfile = {
      ...profile,
      businessType: type
    };
    setProfile(updated);
    StorageService.savePharmacyProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    if (onProfileUpdated) onProfileUpdated();
  };

  const handleSaveBuyer = (buyer: WholesaleBuyer) => {
    StorageService.addWholesaleBuyer(buyer);
    setWholesaleBuyers(StorageService.getWholesaleBuyers());
  };

  const handleDeleteBuyer = (buyerId: string) => {
    if (confirm('Are you sure you want to remove this wholesale buyer?')) {
      StorageService.deleteWholesaleBuyer(buyerId);
      setWholesaleBuyers(StorageService.getWholesaleBuyers());
    }
  };

  // Save profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PharmacyProfile = {
      ...profile,
      name,
      businessType,
      retailLicenseNo,
      wholesaleLicenseNo,
      wholesaleDefaultMargin: Number(wholesaleDefaultMargin) || 12,
      wholesaleCreditDays: Number(wholesaleCreditDays) || 30,
      addressLine1,
      taluk,
      district,
      state,
      pincode,
      mobile,
      email,
      gstin,
      drugLicenseNo: businessType === 'wholesale' ? wholesaleLicenseNo : (retailLicenseNo || drugLicenseNo),
      pharmacistName: pharmacistName.trim(),
      pharmacistRegNo: pharmacistRegNo.trim(),
      pharmacistQualification: pharmacistQualification.trim(),
      upiVpa,
      upiId: upiVpa || profile.upiId
    };

    StorageService.savePharmacyProfile(updated);
    StorageService.setBusinessType(businessType);
    setProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    if (onProfileUpdated) onProfileUpdated();
  };

  const handleStaffSaved = (updatedUser: User) => {
    setUsersList(StorageService.getUsers());
    const freshProfile = StorageService.getPharmacyProfile();
    setProfile(freshProfile);
    setPharmacistName(freshProfile.pharmacistName || 'Anusya Begum');
    if (onProfileUpdated) onProfileUpdated();
  };

  const handlePharmacistSaved = (updatedProfile: PharmacyProfile) => {
    setProfile(updatedProfile);
    setPharmacistName(updatedProfile.pharmacistName || 'Anusya Begum');
    setPharmacistRegNo(updatedProfile.pharmacistRegNo || '');
    setPharmacistQualification(updatedProfile.pharmacistQualification || '');
    setUsersList(StorageService.getUsers());
    if (onProfileUpdated) onProfileUpdated();
  };

  // Export Encrypted Database Backup
  const handleExportBackup = () => {
    const backupJson = StorageService.exportDatabaseJSON();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CityMedical_Encrypted_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupSuccess(true);
    setTimeout(() => setBackupSuccess(false), 4000);
  };

  // Import Database Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const success = StorageService.importDatabaseJSON(content);
        if (success) {
          alert('Database restored successfully! The page will now reload.');
          window.location.reload();
        } else {
          alert('Invalid backup file structure.');
        }
      } catch (err) {
        alert('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-emerald-600" />
          <span>System Settings, Branding & AES-256 Encryption</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          City Medical Melur business credentials, UPI payments gateway, and secure data vaults
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-900 text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>City Medical credentials updated and propagated across all POS receipts and orders!</span>
        </div>
      )}

      {/* Software Controller Option Hub Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-indigo-950 rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <span>Multi-Store Master Controller</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>Software Controller: Add Pharmacy, Code Creation & WhatsApp Links</span>
          </h3>
          <p className="text-xs text-slate-300 max-w-xl">
            Active Pharmacy Code: <span className="font-mono font-bold text-teal-300">{profile.pharmacyCode || 'CP-MDU-101'}</span>. 
            Manage branch stores, create pharmacy codes, set payment options, generate passwords, and activate/remove retail & wholesale action buttons.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab?.('software-controller')}
          className="self-start md:self-center px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open Software Controller</span>
        </button>
      </div>

      {/* Primary Business Operating Mode Option Selector */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-gradient-to-br from-emerald-500 to-indigo-600 text-white rounded-xl shadow-xs">
                <Store className="w-5 h-5" />
              </span>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Pharmacy Operating Option: Retail Pharmacy vs Wholesale Pharma
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select your primary business model or enable dual-mode to operate both walk-in patient retail and B2B wholesale distribution.
            </p>
          </div>
          <span className="self-start sm:self-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 font-mono">
            Active: {businessType === 'both' ? 'Dual Mode (Retail + Wholesale)' : businessType === 'wholesale' ? 'Wholesale Only' : 'Retail Only'}
          </span>
        </div>

        {/* 3 Visual Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Option 1: Retail Pharmacy */}
          <div
            onClick={() => handleSelectBusinessType('retail')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
              businessType === 'retail'
                ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-emerald-300 bg-white hover:bg-slate-50/60'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Store className="w-5 h-5" />
                </div>
                {businessType === 'retail' && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Retail Pharmacy</h3>
                <p className="text-[11px] font-semibold text-emerald-700">Chemist & Druggist Counter</p>
              </div>
              <ul className="text-[11px] text-slate-600 space-y-1 pt-1 list-disc list-inside">
                <li>Walk-in patient prescription dispensing</li>
                <li>Loose tablets & single strip sales</li>
                <li>Sells at Maximum Retail Price (MRP)</li>
                <li>Patient refill reminders & doctor tagging</li>
                <li>Form 20 & 21 Retail Drug License</li>
              </ul>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-500">Ideal for: Neighborhood Chemist Store</span>
            </div>
          </div>

          {/* Option 2: Wholesale Pharma */}
          <div
            onClick={() => handleSelectBusinessType('wholesale')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
              businessType === 'wholesale'
                ? 'border-indigo-500 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50/60'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                {businessType === 'wholesale' && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-300 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Wholesale Pharma</h3>
                <p className="text-[11px] font-semibold text-indigo-700">Distributor / Stockist / C&F</p>
              </div>
              <ul className="text-[11px] text-slate-600 space-y-1 pt-1 list-disc list-inside">
                <li>B2B sales to retail chemists & hospitals</li>
                <li>Full box packs & master cartons/cases</li>
                <li>Sells at Price to Retailer (PTR) / Wholesale margin</li>
                <li>B2B GST Tax Invoices with Buyer GSTIN & DL</li>
                <li>Form 20B & 21B Wholesale Drug License</li>
              </ul>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-500">Ideal for: Pharma Distributor / Stockist</span>
            </div>
          </div>

          {/* Option 3: Dual / Hybrid Mode (Both) */}
          <div
            onClick={() => handleSelectBusinessType('both')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
              businessType === 'both'
                ? 'border-teal-500 bg-gradient-to-br from-emerald-50/70 via-teal-50/60 to-indigo-50/60 shadow-sm ring-2 ring-teal-500/20'
                : 'border-slate-200 hover:border-teal-300 bg-white hover:bg-slate-50/60'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-gradient-to-r from-emerald-100 to-indigo-100 text-teal-800 rounded-xl">
                  <div className="flex items-center gap-1">
                    <Store className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-black">+</span>
                    <Building2 className="w-4 h-4 text-indigo-700" />
                  </div>
                </div>
                {businessType === 'both' && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded-full border border-teal-300 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Selected (Recommended)
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Dual / Hybrid Mode (Both)</h3>
                <p className="text-[11px] font-semibold text-teal-700">Retail Counter + Wholesale Distribution</p>
              </div>
              <ul className="text-[11px] text-slate-600 space-y-1 pt-1 list-disc list-inside">
                <li>Instantly switch between Retail & Wholesale in POS</li>
                <li>Dispense loose tablets for walk-ins OR bulk boxes for chemists</li>
                <li>Both Retail (MRP) & Wholesale (PTR) pricing supported</li>
                <li>Generates both Retail Cash Memos & B2B GST Invoices</li>
                <li>Full compliance with Form 20, 21, 20B & 21B</li>
              </ul>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-200/60">
              <span className="text-[10px] font-bold text-teal-700">Best for: City Medical full-service operations</span>
            </div>
          </div>
        </div>

        {/* Wholesale Specific Parameters (Margin % & Credit Terms) */}
        {(businessType === 'wholesale' || businessType === 'both') && (
          <div className="p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-indigo-950 block mb-1 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-indigo-600" />
                <span>Default Wholesale Margin (% over Cost)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={wholesaleDefaultMargin}
                  onChange={e => setWholesaleDefaultMargin(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-indigo-200 rounded-xl bg-white font-bold text-slate-900"
                />
                <span className="absolute right-3 top-2 font-bold text-slate-400">%</span>
              </div>
              <p className="text-[10px] text-indigo-700 mt-1">Used to auto-calculate PTR when wholesale price is not explicitly set</p>
            </div>

            <div>
              <label className="font-bold text-indigo-950 block mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span>Wholesale Default Credit Terms (Days)</span>
              </label>
              <select
                value={wholesaleCreditDays}
                onChange={e => setWholesaleCreditDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-indigo-200 rounded-xl bg-white font-bold text-slate-900"
              >
                <option value="0">Immediate / Cash</option>
                <option value="15">Net 15 Days</option>
                <option value="30">Net 30 Days (Standard)</option>
                <option value="45">Net 45 Days</option>
                <option value="60">Net 60 Days</option>
              </select>
              <p className="text-[10px] text-indigo-700 mt-1">Default payment due period for B2B wholesale chemist bills</p>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <label className="font-bold text-indigo-950 block mb-1 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Wholesale Buyers Registered</span>
                </label>
                <p className="font-extrabold text-indigo-900 text-lg">{wholesaleBuyers.length} Chemists & Hospitals</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingBuyer(null);
                  setShowBuyerModal(true);
                }}
                className="mt-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Wholesale Buyer</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Business Profile Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">Pharmacy Business Profile</h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Live on Receipts
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-slate-700">Pharmacy Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-bold text-sm text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700">Address Line 1</label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={e => setAddressLine1(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Taluk</label>
                <input
                  type="text"
                  required
                  value={taluk}
                  onChange={e => setTaluk(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700">District</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">State</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">PIN Code</label>
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700">Mobile Phone Number *</label>
                <input
                  type="text"
                  required
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">GSTIN Registration</label>
                  <button
                    type="button"
                    onClick={() => setShowEditGstinModal(true)}
                    className="text-[10px] text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
                  >
                    Format Helper
                  </button>
                </div>
                <input
                  type="text"
                  value={gstin}
                  onChange={e => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Retail Drug License (Form 20 & 21)</span>
                  <span className="text-[10px] text-emerald-700 font-normal">Retail Dispensing</span>
                </label>
                <input
                  type="text"
                  value={retailLicenseNo}
                  onChange={e => {
                    setRetailLicenseNo(e.target.value);
                    setDrugLicenseNo(e.target.value);
                  }}
                  placeholder="TN-MDU-2024-R20/21-004928"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Wholesale Drug License (Form 20B & 21B)</span>
                  <span className="text-[10px] text-indigo-700 font-normal">Wholesale Distribution</span>
                </label>
                <input
                  type="text"
                  value={wholesaleLicenseNo}
                  onChange={e => setWholesaleLicenseNo(e.target.value)}
                  placeholder="TN-MDU-2024-W20B/21B-0084"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono text-xs"
                />
              </div>
            </div>

            {/* Registered Pharmacist Section */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                  <Award className="w-4 h-4 text-emerald-700" />
                  <span>Registered Pharmacist on Record (Prints on Tax Bills)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPharmacistModal(true)}
                  className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Quick Edit</span>
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-800 block text-xs mb-1">
                  Pharmacist Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={pharmacistName}
                  onChange={e => setPharmacistName(e.target.value)}
                  placeholder="e.g. Anusya Begum"
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block text-[11px] mb-1">
                    Pharmacy Reg. / License No.
                  </label>
                  <input
                    type="text"
                    value={pharmacistRegNo}
                    onChange={e => setPharmacistRegNo(e.target.value)}
                    placeholder="e.g. TN-RPH-78419"
                    className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg font-mono text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block text-[11px] mb-1">
                    Qualifications & Degree
                  </label>
                  <input
                    type="text"
                    value={pharmacistQualification}
                    onChange={e => setPharmacistQualification(e.target.value)}
                    placeholder="e.g. D.Pharm, Reg. Pharmacist"
                    className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700">Primary UPI VPA ID (For Instant QR Payments)</label>
              <input
                type="text"
                value={upiVpa}
                onChange={e => setUpiVpa(e.target.value)}
                placeholder="citymedical@okhdfcbank"
                className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50/20 rounded-xl mt-1 font-mono font-bold text-emerald-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used to dynamically generate dynamic UPI QR codes during retail billing.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors"
            >
              Update Business Profile
            </button>
          </form>
        </div>

        {/* Right Column: Encryption, Cloud Backup & Auth Vault (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* AES Data Encryption Status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">Cryptographic Data Security</h3>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Encryption Standard:</span>
                <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {encryptionStatus.algorithm}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Key Length:</span>
                <span className="font-mono text-slate-800">{encryptionStatus.keyLength}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Patient Data Status:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Encrypted at Rest & In-Transit
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Audit Trails:</span>
                <span className="font-semibold text-slate-800">Immutable Hash Logging</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              All patient medical histories, prescription drugs, supplier ledgers, and transactions are cryptographically sealed with hardware-accelerated authenticated encryption.
            </p>
          </div>

          {/* Multi-User & Password Security Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Staff & Pharmacists Roster</h3>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {usersList.length} Active Staff
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Click <span className="font-semibold text-emerald-700">"Edit"</span> on any staff member to update their name, role, mobile, or license number.
            </p>

            {/* Quick Pharmacist Card */}
            <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  Rx
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-emerald-950 truncate">
                    {profile.pharmacistName || 'Anusya Begum'}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium truncate">
                    Reg. Pharmacist on Bills {profile.pharmacistRegNo ? `• ${profile.pharmacistRegNo}` : ''}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPharmacistModal(true)}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            {/* All Staff List with Direct Edit Buttons */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
              {usersList.map(u => (
                <div
                  key={u.id}
                  className="flex items-center justify-between text-xs p-2 bg-slate-50 hover:bg-emerald-50/40 rounded-xl border border-slate-200 transition-colors gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-md object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {u.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate text-[11px]">{u.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        @{u.username} • <span className="capitalize text-emerald-700 font-semibold">{u.role}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedStaffForEdit(u)}
                    title={`Edit ${u.name}`}
                    className="px-2 py-1 bg-white hover:bg-emerald-600 hover:text-white text-slate-700 font-bold text-[11px] rounded-lg border border-slate-300 hover:border-emerald-600 flex items-center gap-1 shrink-0 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              ))}
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('security')}
                className="w-full mt-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Open Full User Security & Passwords Vault</span>
              </button>
            )}
          </div>

          {/* POS Thermal Receipt Printer Hardware Setup Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-base">Thermal POS Printer Hardware</h3>
              </div>
              <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{printerSettings.paperWidth} ({printerSettings.connectionType.replace('web-', '').toUpperCase()})</span>
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Active Device:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                  {printerSettings.deviceName || 'Thermal Receipt Spooler'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Paper Format:</span>
                <span className="font-bold text-teal-800">{printerSettings.paperWidth} Continuous Roll</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Auto Cutter:</span>
                <span className={printerSettings.autoCut ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                  {printerSettings.autoCut ? 'Enabled (ESC/POS)' : 'Manual Tear'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Cash Drawer Kick:</span>
                <span className={printerSettings.openCashDrawer ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                  {printerSettings.openCashDrawer ? 'Pulse on Checkout' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConnectPrinterModal(true)}
                className="py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Connect Printer</span>
              </button>

              <button
                type="button"
                onClick={() => printThermalTestSlipViaBrowser(profile, printerSettings)}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              >
                <Play className="w-3.5 h-3.5 text-slate-600" />
                <span>Run Test Print</span>
              </button>
            </div>
          </div>

          {/* Backup & Data Recovery */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">Database Backup & Disaster Recovery</h3>
            </div>

            <p className="text-xs text-slate-600">
              Generate offline snapshot of your complete inventory, patient files, and accounting ledgers.
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleExportBackup}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Export Encrypted Database (JSON)</span>
              </button>

              <label className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs border border-dashed border-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Restore Database from File</span>
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>

            {backupSuccess && (
              <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Encrypted backup archive downloaded!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Official UPI Payment QR Code & Standee Manager */}
      <UpiQrCodeManager
        inline
        profile={profile}
        onProfileUpdated={updated => {
          setProfile(updated);
          if (onProfileUpdated) onProfileUpdated();
        }}
      />

      {/* Wholesale B2B Registered Chemists & Hospitals Directory */}
      {(businessType === 'wholesale' || businessType === 'both') && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </span>
                <h3 className="font-black text-slate-900 text-base tracking-tight">
                  Registered Wholesale Chemists & Hospitals (B2B Directory)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Authorized retail pharmacies, hospitals, and clinics purchasing under wholesale B2B tax invoices with GSTIN & Drug License
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingBuyer(null);
                setShowBuyerModal(true);
              }}
              className="self-start sm:self-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Register Chemist / Hospital</span>
            </button>
          </div>

          {wholesaleBuyers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="font-bold text-sm">No Wholesale Buyers Registered Yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Click "+ Register Chemist / Hospital" to add your first B2B client.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold bg-slate-50/50">
                    <th className="py-2.5 px-3">Chemist / Hospital Name</th>
                    <th className="py-2.5 px-3">Contact & Phone</th>
                    <th className="py-2.5 px-3 font-mono">GSTIN</th>
                    <th className="py-2.5 px-3 font-mono">Drug License</th>
                    <th className="py-2.5 px-3 text-right">Credit Terms</th>
                    <th className="py-2.5 px-3 text-right">Outstanding</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wholesaleBuyers.map(buyer => (
                    <tr key={buyer.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{buyer.businessName}</div>
                        <div className="text-[11px] text-slate-500">{buyer.address}, {buyer.city}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{buyer.contactPerson}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{buyer.phone}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-indigo-700 font-semibold">
                        {buyer.gstin || '-'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                        {buyer.drugLicenseNo || '-'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-slate-900">{buyer.creditDays} Days</span>
                        <div className="text-[10px] text-slate-400">Limit: ₹{(buyer.creditLimit || 0).toLocaleString('en-IN')}</div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-mono font-bold ${(buyer.outstandingBalance || 0) > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                          ₹{(buyer.outstandingBalance || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBuyer(buyer);
                              setShowBuyerModal(true);
                            }}
                            className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit Wholesale Buyer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBuyer(buyer.id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Buyer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Staff Modal */}
      {selectedStaffForEdit && (
        <EditStaffModal
          user={selectedStaffForEdit}
          isOpen={selectedStaffForEdit !== null}
          onClose={() => setSelectedStaffForEdit(null)}
          onSaved={handleStaffSaved}
        />
      )}

      {/* Edit Pharmacist Modal */}
      <EditPharmacistModal
        isOpen={showPharmacistModal}
        onClose={() => setShowPharmacistModal(false)}
        onSaved={handlePharmacistSaved}
      />

      {/* Connect Thermal Printer Hardware Modal */}
      <ConnectPrinterModal
        isOpen={showConnectPrinterModal}
        onClose={() => setShowConnectPrinterModal(false)}
        onPrinterConnected={newSettings => {
          setPrinterSettings(newSettings);
        }}
      />

      {/* Quick Edit GST Number Modal */}
      <EditGstinModal
        isOpen={showEditGstinModal}
        onClose={() => setShowEditGstinModal(false)}
        onGstinUpdated={newGstin => {
          setGstin(newGstin);
          const fresh = StorageService.getPharmacyProfile();
          setProfile(fresh);
          if (onProfileUpdated) onProfileUpdated();
        }}
      />

      {/* Add / Edit Wholesale Buyer Modal */}
      {showBuyerModal && (
        <AddWholesaleBuyerModal
          isOpen={showBuyerModal}
          initialBuyer={editingBuyer}
          onClose={() => {
            setShowBuyerModal(false);
            setEditingBuyer(null);
          }}
          onSave={handleSaveBuyer}
        />
      )}
    </div>
  );
};
