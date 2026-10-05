import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Building2,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Trash2,
  Check,
  CheckCircle2,
  Store,
  Layers,
  Sparkles,
  FileText,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Award,
  Link,
  Printer
} from 'lucide-react';
import { PharmacyProfile } from '../types';
import { StorageService } from '../services/storage';
import { PharmacyLogo } from './PharmacyLogo';
import { PHARMACY_LOGO_URL } from '../assets/logo';

export interface EditPharmacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updatedProfile: PharmacyProfile) => void;
  initialTab?: 'branding' | 'mode' | 'address';
}

// Preset vector logos as high-definition SVG data URIs
export const PRESET_LOGOS = [
  {
    id: 'default',
    name: 'City Rx Official',
    description: 'Stethoscope & Red Cross with Green Arc',
    url: PHARMACY_LOGO_URL
  },
  {
    id: 'caduceus_green',
    name: 'Emerald Caduceus',
    description: 'Traditional Pharmacist Staff & Serpents',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <rect width="120" height="120" rx="24" fill="#047857"/>
        <circle cx="60" cy="60" r="48" fill="#065f46" stroke="#34d399" stroke-width="2"/>
        <circle cx="60" cy="28" r="8" fill="#fbbf24"/>
        <line x1="60" y1="28" x2="60" y2="96" stroke="#fbbf24" stroke-width="5" stroke-linecap="round"/>
        <path d="M42 42 Q60 52 78 42 Q60 32 42 42 Z" fill="#34d399" opacity="0.9"/>
        <path d="M40 56 C50 68 70 48 80 60 C70 72 50 52 40 56 Z" fill="#6ee7b7"/>
        <path d="M42 74 C52 86 68 66 78 78 C68 90 52 70 42 74 Z" fill="#a7f3d0"/>
        <text x="60" y="112" text-anchor="middle" font-size="10" font-weight="900" fill="#ffffff" font-family="system-ui, sans-serif">RX PHARMA</text>
      </svg>
    `)}`
  },
  {
    id: 'mortar_pestle',
    name: 'Mortar & Pestle',
    description: 'Artisanal Apothecary Compounding',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <rect width="120" height="120" rx="24" fill="#0f172a"/>
        <circle cx="60" cy="60" r="48" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
        <!-- Mortar bowl -->
        <path d="M30 52 C30 82 90 82 90 52 Z" fill="#0284c7"/>
        <path d="M26 50 Q60 56 94 50 Q60 44 26 50 Z" fill="#38bdf8"/>
        <!-- Pestle -->
        <line x1="78" y1="26" x2="52" y2="62" stroke="#f1f5f9" stroke-width="9" stroke-linecap="round"/>
        <line x1="78" y1="26" x2="72" y2="34" stroke="#0284c7" stroke-width="7" stroke-linecap="round"/>
        <!-- Base foot -->
        <path d="M45 82 L75 82 L70 90 L50 90 Z" fill="#0369a1"/>
        <text x="60" y="108" text-anchor="middle" font-size="9" font-weight="800" fill="#bae6fd" font-family="system-ui, sans-serif">MEDICINE</text>
      </svg>
    `)}`
  },
  {
    id: 'modern_cross',
    name: 'Clinical Cross',
    description: 'Vibrant Teal Healthcare Cross',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="crossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0d9488" />
            <stop offset="100%" stop-color="#0284c7" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="24" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
        <!-- Medical Cross -->
        <rect x="46" y="24" width="28" height="72" rx="8" fill="url(#crossGrad)"/>
        <rect x="24" y="46" width="72" height="28" rx="8" fill="url(#crossGrad)"/>
        <!-- Heartbeat pulse in white -->
        <path d="M30 60 L45 60 L52 48 L60 72 L68 54 L74 60 L90 60" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `)}`
  },
  {
    id: 'capsule_rx',
    name: 'Modern Rx Capsule',
    description: 'Minimalist Two-Tone Capsule Pill',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <rect width="120" height="120" rx="24" fill="#134e4a"/>
        <g transform="rotate(-45 60 60)">
          <!-- Top half capsule -->
          <path d="M42 60 L42 42 A18 18 0 0 1 78 42 L78 60 Z" fill="#14b8a6"/>
          <!-- Bottom half capsule -->
          <path d="M42 60 L42 78 A18 18 0 0 0 78 78 L78 60 Z" fill="#f59e0b"/>
          <!-- Divider line -->
          <line x1="40" y1="60" x2="80" y2="60" stroke="#042f2e" stroke-width="3"/>
          <text x="60" y="54" text-anchor="middle" font-size="14" font-weight="900" fill="#ffffff" font-family="system-ui, sans-serif">Rx</text>
        </g>
      </svg>
    `)}`
  }
];

export const EditPharmacyModal: React.FC<EditPharmacyModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialTab = 'branding'
}) => {
  const [profile, setProfile] = useState<PharmacyProfile>(() => StorageService.getPharmacyProfile());
  const [activeTab, setActiveTab] = useState<'branding' | 'mode' | 'address'>(initialTab);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState(profile.name);
  const [tagline, setTagline] = useState(profile.tagline || '');
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl || PHARMACY_LOGO_URL);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [printLogo, setPrintLogo] = useState(profile.printLogo !== false);
  const [pharmacyType, setPharmacyType] = useState<'retail' | 'wholesale' | 'both'>(profile.pharmacyType || 'both');
  const [drugLicenseNo, setDrugLicenseNo] = useState(profile.drugLicenseNo || '');
  const [wholesaleLicenseNo, setWholesaleLicenseNo] = useState(profile.wholesaleLicenseNo || 'TN-MDU-2024-W20B-9481 & W21B-9482');
  const [defaultWholesaleMarginPercent, setDefaultWholesaleMarginPercent] = useState<number>(profile.defaultWholesaleMarginPercent || 10);
  const [gstin, setGstin] = useState(profile.gstin || '');
  const [mobile, setMobile] = useState(profile.mobile || '');
  const [email, setEmail] = useState(profile.email || '');
  const [addressLine1, setAddressLine1] = useState(profile.addressLine1 || '');
  const [taluk, setTaluk] = useState(profile.taluk || '');
  const [district, setDistrict] = useState(profile.district || '');
  const [state, setState] = useState(profile.state || '');
  const [pincode, setPincode] = useState(profile.pincode || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fresh = StorageService.getPharmacyProfile();
      setProfile(fresh);
      setName(fresh.name);
      setTagline(fresh.tagline || '');
      setLogoUrl(fresh.logoUrl || PHARMACY_LOGO_URL);
      setPrintLogo(fresh.printLogo !== false);
      setPharmacyType(fresh.pharmacyType || 'both');
      setDrugLicenseNo(fresh.drugLicenseNo || '');
      setWholesaleLicenseNo(fresh.wholesaleLicenseNo || 'TN-MDU-2024-W20B-9481 & W21B-9482');
      setDefaultWholesaleMarginPercent(fresh.defaultWholesaleMarginPercent || 10);
      setGstin(fresh.gstin || '');
      setMobile(fresh.mobile || '');
      setEmail(fresh.email || '');
      setAddressLine1(fresh.addressLine1 || '');
      setTaluk(fresh.taluk || '');
      setDistrict(fresh.district || '');
      setState(fresh.state || '');
      setPincode(fresh.pincode || '');
      setSavedSuccess(false);
      setUploadError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle local image file upload (PNG/JPG/WebP/SVG)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 3MB
    if (file.size > 3 * 1024 * 1024) {
      setUploadError('Image size exceeds 3MB. Please select an image under 3MB.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    setLogoUrl(customUrlInput.trim());
    setCustomUrlInput('');
  };

  const handleSelectPreset = (url: string) => {
    setLogoUrl(url);
    setUploadError(null);
  };

  const handleResetToDefaultLogo = () => {
    setLogoUrl(PHARMACY_LOGO_URL);
    setUploadError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Pharmacy name cannot be empty');
      return;
    }

    const updated: PharmacyProfile = {
      ...profile,
      name: name.trim(),
      tagline: tagline.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      printLogo,
      pharmacyType,
      drugLicenseNo: drugLicenseNo.trim(),
      wholesaleLicenseNo: wholesaleLicenseNo.trim(),
      defaultWholesaleMarginPercent: Number(defaultWholesaleMarginPercent) || 10,
      gstin: gstin.trim().toUpperCase(),
      mobile: mobile.trim(),
      email: email.trim(),
      addressLine1: addressLine1.trim(),
      taluk: taluk.trim(),
      district: district.trim(),
      state: state.trim(),
      pincode: pincode.trim()
    };

    StorageService.savePharmacyProfile(updated);
    setProfile(updated);
    setSavedSuccess(true);

    if (onSaved) onSaved(updated);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">
                Pharmacy Name, Logo & Business Mode
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                Configure store branding, logo image, and Retail vs Wholesale distribution
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'branding'
                ? 'border-emerald-600 text-emerald-700 font-extrabold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Pharmacy Name & Logo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mode')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'mode'
                ? 'border-emerald-600 text-emerald-700 font-extrabold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Retail vs Wholesale Option</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('address')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'address'
                ? 'border-emerald-600 text-emerald-700 font-extrabold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Address & Licenses</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-900 text-xs font-bold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pharmacy profile & business mode saved successfully! Propagated to all bills and POS.</span>
            </div>
          )}

          {/* TAB 1: BRANDING & LOGO */}
          {activeTab === 'branding' && (
            <div className="space-y-5">
              {/* Pharmacy Name & Tagline */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                    Pharmacy Legal / Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. City Rx - City Medical"
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-emerald-500 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-hidden"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Appears prominently on the app top-bar, sales receipts, WhatsApp bills, and reports.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    placeholder="e.g. Trusted Community Healthcare & Pharmacy"
                    className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-300 focus:border-emerald-500 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-hidden"
                  />
                </div>
              </div>

              {/* Logo Manager */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Pharmacy Logo Image
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Prints on Tax Invoices
                  </span>
                </div>

                {/* Preview & Actions */}
                <div className="flex items-center gap-4">
                  {/* Live preview */}
                  <div className="w-20 h-20 rounded-2xl bg-white border-2 border-emerald-200 shadow-xs flex items-center justify-center overflow-hidden p-1 shrink-0 relative group">
                    <img
                      src={logoUrl || PHARMACY_LOGO_URL}
                      alt="Logo preview"
                      className="w-full h-full object-contain rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetToDefaultLogo}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Reset to official City Rx logo"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Default Logo</span>
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                    />

                    <p className="text-[11px] text-slate-500">
                      Supports PNG, JPG, WebP, SVG. Stored locally in browser for offline printing.
                    </p>

                    {uploadError && (
                      <p className="text-[11px] text-rose-600 font-semibold">{uploadError}</p>
                    )}
                  </div>
                </div>

                {/* Custom URL Input */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Or Enter Direct Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customUrlInput}
                      onChange={e => setCustomUrlInput(e.target.value)}
                      placeholder="https://example.com/pharmacy-logo.png"
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      disabled={!customUrlInput.trim()}
                      className="px-3 py-1.5 bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Preset Medical Logos Picker */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Quick Pick: Preset Medical Logos</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {PRESET_LOGOS.map((preset) => {
                      const isSelected = logoUrl === preset.url;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset.url)}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all text-center ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/30'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-10 h-10 object-contain rounded-lg"
                          />
                          <span className="text-[10px] font-bold text-slate-800 truncate w-full">
                            {preset.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Print Logo Toggle */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-slate-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Print Logo on Invoices & Thermal Receipts
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Includes logo header on continuous 3-inch/2-inch thermal slips & A4 tax invoices
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={printLogo}
                    onChange={e => setPrintLogo(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RETAIL VS WHOLESALE OPTION */}
          {activeTab === 'mode' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                  Pharmacy Operating Type & Billing Engine
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Select whether your establishment functions as a retail chemist, wholesale distribution hub, or dual-mode facility.
                </p>
              </div>

              {/* 3 Interactive Cards */}
              <div className="grid grid-cols-1 gap-3">
                {/* 1. Retail Pharmacy */}
                <div
                  onClick={() => setPharmacyType('retail')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    pharmacyType === 'retail'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        pharmacyType === 'retail' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900">
                            Retail Pharmacy (Form 20 & 21)
                          </h4>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Walk-in Patients
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Dispenses directly to patients and consumers with doctor prescriptions. Sells at Retail MRP, supports loose tablet/capsule dispensing, and generates <strong className="text-emerald-900">Retail Tax Invoices / Cash Memos</strong>.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      pharmacyType === 'retail' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                    }`}>
                      {pharmacyType === 'retail' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {/* 2. Wholesale Pharmacy */}
                <div
                  onClick={() => setPharmacyType('wholesale')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    pharmacyType === 'wholesale'
                      ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        pharmacyType === 'wholesale' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900">
                            Wholesale Distribution Hub (Form 20B & 21B)
                          </h4>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-900">
                            B2B Supply
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Bulk supply to retail chemists, nursing homes, clinics, and hospitals. Sells in full boxes/packs at Wholesale Trade Rates (PTR), enforces Buyer GSTIN/DL registration, and generates statutory <strong className="text-teal-950">Wholesale Tax Invoices</strong>.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      pharmacyType === 'wholesale' ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300'
                    }`}>
                      {pharmacyType === 'wholesale' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {/* 3. Both Retail & Wholesale (Dual Mode) */}
                <div
                  onClick={() => setPharmacyType('both')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    pharmacyType === 'both'
                      ? 'border-cyan-600 bg-cyan-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        pharmacyType === 'both' ? 'bg-cyan-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900">
                            Both Retail & Wholesale (Dual Operating Mode)
                          </h4>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900">
                            Recommended
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Best for composite pharmacies. Provides a quick 1-click toggle in POS to bill either a <strong className="text-slate-900">Retail Patient Sale (MRP)</strong> or a <strong className="text-slate-900">Wholesale B2B Order (Trade Rate)</strong> with appropriate licenses and invoice templates.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      pharmacyType === 'both' ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-300'
                    }`}>
                      {pharmacyType === 'both' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statutory Licenses */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Statutory Drug License Numbers
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Retail Drug License (Form 20 & 21)
                    </label>
                    <input
                      type="text"
                      value={drugLicenseNo}
                      onChange={e => setDrugLicenseNo(e.target.value)}
                      placeholder="e.g. TN-MDU-2024-004928 (Form 20 & 21)"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Wholesale Drug License (Form 20B & 21B)
                    </label>
                    <input
                      type="text"
                      value={wholesaleLicenseNo}
                      onChange={e => setWholesaleLicenseNo(e.target.value)}
                      placeholder="e.g. TN-MDU-2024-W20B-9481 & W21B-9482"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900"
                    />
                  </div>
                </div>

                {pharmacyType !== 'retail' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Default Wholesale Trade Margin (%)
                    </label>
                    <div className="flex items-center gap-2 max-w-xs">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={defaultWholesaleMarginPercent}
                        onChange={e => setDefaultWholesaleMarginPercent(Number(e.target.value))}
                        className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900"
                      />
                      <span className="text-xs text-slate-500 font-medium">% over wholesale procurement cost</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ADDRESS & TAX DETAILS */}
          {activeTab === 'address' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Street Address Line 1 *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine1}
                    onChange={e => setAddressLine1(e.target.value)}
                    placeholder="Chokkalingapuram, Near Melur Bus Stand"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Taluk
                  </label>
                  <input
                    type="text"
                    value={taluk}
                    onChange={e => setTaluk(e.target.value)}
                    placeholder="Melur Taluk"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    placeholder="Madurai District"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    placeholder="Tamil Nadu"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                    placeholder="625103"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pharmacy Mobile / Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="8438678498"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="citymedical.melur@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    GSTIN Registration Number
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={e => setGstin(e.target.value.toUpperCase())}
                    placeholder="33AABCC5541Q1Z8"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Save & Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Pharmacy Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
