import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Share2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Key,
  Shield,
  Smartphone,
  Globe,
  DollarSign,
  CreditCard,
  QrCode,
  Copy,
  Check,
  Search,
  Filter,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Send,
  MessageCircle,
  RefreshCw,
  Store,
  Truck,
  UserCheck
} from 'lucide-react';
import { PharmacyTenant, PharmacyBusinessType } from '../types';
import { StorageService } from '../services/storage';

interface SoftwareControllerViewProps {
  onRefreshData?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const SoftwareControllerView: React.FC<SoftwareControllerViewProps> = ({
  onRefreshData,
  onNavigateTab
}) => {
  const [tenants, setTenants] = useState<PharmacyTenant[]>(() => StorageService.getPharmacyTenants());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'retail' | 'wholesale' | 'both'>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'Active' | 'Pending' | 'Grace_Period' | 'Suspended'>('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<PharmacyTenant | null>(null);
  const [whatsAppModalTenant, setWhatsAppModalTenant] = useState<PharmacyTenant | null>(null);
  const [whatsAppRecipientPhone, setWhatsAppRecipientPhone] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add/Edit Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formBusinessType, setFormBusinessType] = useState<PharmacyBusinessType>('both');
  const [formRetailActive, setFormRetailActive] = useState(true);
  const [formWholesaleActive, setFormWholesaleActive] = useState(true);
  const [formTagline, setFormTagline] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('Melur');
  const [formDistrict, setFormDistrict] = useState('Madurai District');
  const [formState, setFormState] = useState('Tamil Nadu');
  const [formPincode, setFormPincode] = useState('625103');
  const [formGstin, setFormGstin] = useState('');
  const [formDrugLicense, setFormDrugLicense] = useState('');
  const [formWholesaleLicense, setFormWholesaleLicense] = useState('');
  const [formRetailLicense, setFormRetailLicense] = useState('');

  // Payment state
  const [formPlan, setFormPlan] = useState<PharmacyTenant['subscriptionPlan']>('Annual');
  const [formPaymentStatus, setFormPaymentStatus] = useState<PharmacyTenant['paymentStatus']>('Active');
  const [formPaymentMethod, setFormPaymentMethod] = useState<PharmacyTenant['paymentMethod']>('UPI');
  const [formPaymentUpiId, setFormPaymentUpiId] = useState('');
  const [formRenewalDate, setFormRenewalDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [formSubscriptionFee, setFormSubscriptionFee] = useState<number>(9999);

  // User credentials
  const [formAdminUsername, setFormAdminUsername] = useState('');
  const [formAdminPassword, setFormAdminPassword] = useState('');
  const [formAdminEmail, setFormAdminEmail] = useState('');

  const currentProfile = StorageService.getPharmacyProfile();

  const reload = () => {
    setTenants(StorageService.getPharmacyTenants());
    if (onRefreshData) onRefreshData();
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const generateRandomPharmacyCode = () => {
    const prefix = 'CP-';
    const cityCode = formCity ? formCity.slice(0, 3).toUpperCase() : 'MDU';
    const num = Math.floor(100 + Math.random() * 900);
    return `${prefix}${cityCode}-${num}`;
  };

  const openAddModal = () => {
    setEditingTenant(null);
    const code = 'CP-MDU-' + Math.floor(100 + Math.random() * 900);
    setFormName('');
    setFormCode(code);
    setFormBusinessType('both');
    setFormRetailActive(true);
    setFormWholesaleActive(true);
    setFormTagline('Pharma Dispensing & B2B Distribution');
    setFormMobile('98421' + Math.floor(10000 + Math.random() * 90000));
    setFormEmail('');
    setFormAddress('Main Road');
    setFormCity('Melur');
    setFormDistrict('Madurai District');
    setFormState('Tamil Nadu');
    setFormPincode('625103');
    setFormGstin('33AABCC' + Math.floor(1000 + Math.random() * 9000) + 'Q1Z' + Math.floor(1 + Math.random() * 9));
    setFormDrugLicense('TN-MDU-2024-' + Math.floor(100000 + Math.random() * 900000));
    setFormWholesaleLicense('TN-MDU-2024-W20B/21B-' + Math.floor(1000 + Math.random() * 9000));
    setFormRetailLicense('TN-MDU-2024-R20/21-' + Math.floor(1000 + Math.random() * 9000));
    setFormPlan('Annual');
    setFormPaymentStatus('Active');
    setFormPaymentMethod('UPI');
    setFormPaymentUpiId('pharmacy@upi');
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    setFormRenewalDate(d.toISOString().split('T')[0]);
    setFormSubscriptionFee(9999);
    setFormAdminUsername('admin_' + Math.floor(10 + Math.random() * 90));
    setFormAdminPassword('rxpass' + Math.floor(100 + Math.random() * 900));
    setFormAdminEmail('');
    setShowAddModal(true);
  };

  const openEditModal = (t: PharmacyTenant) => {
    setEditingTenant(t);
    setFormName(t.name);
    setFormCode(t.pharmacyCode);
    setFormBusinessType(t.businessType);
    setFormRetailActive(t.retailActive ?? true);
    setFormWholesaleActive(t.wholesaleActive ?? (t.businessType !== 'retail'));
    setFormTagline(t.tagline || '');
    setFormMobile(t.mobile);
    setFormEmail(t.email);
    setFormAddress(t.addressLine1);
    setFormCity(t.city);
    setFormDistrict(t.district);
    setFormState(t.state);
    setFormPincode(t.pincode);
    setFormGstin(t.gstin);
    setFormDrugLicense(t.drugLicenseNo);
    setFormWholesaleLicense(t.wholesaleLicenseNo || '');
    setFormRetailLicense(t.retailLicenseNo || '');
    setFormPlan(t.subscriptionPlan);
    setFormPaymentStatus(t.paymentStatus);
    setFormPaymentMethod(t.paymentMethod || 'UPI');
    setFormPaymentUpiId(t.paymentUpiId || '');
    setFormRenewalDate(t.renewalDate || new Date().toISOString().split('T')[0]);
    setFormSubscriptionFee(t.subscriptionFee || 9999);
    setFormAdminUsername(t.adminUsername);
    setFormAdminPassword(t.adminPassword || 'admin123');
    setFormAdminEmail(t.adminEmail);
    setShowAddModal(true);
  };

  const handleSaveTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      alert('Pharmacy Name and Pharmacy Code are required.');
      return;
    }

    const payload: PharmacyTenant = {
      id: editingTenant ? editingTenant.id : `pharm-${Date.now().toString().slice(-4)}`,
      pharmacyCode: formCode.trim().toUpperCase(),
      name: formName.trim(),
      businessType: formBusinessType,
      retailActive: formRetailActive,
      wholesaleActive: formWholesaleActive,
      tagline: formTagline.trim(),
      mobile: formMobile.trim(),
      email: formEmail.trim() || `${formAdminUsername}@cityrx.com`,
      addressLine1: formAddress.trim(),
      city: formCity.trim(),
      district: formDistrict.trim(),
      state: formState.trim(),
      pincode: formPincode.trim(),
      gstin: formGstin.trim().toUpperCase(),
      drugLicenseNo: formDrugLicense.trim(),
      wholesaleLicenseNo: formWholesaleLicense.trim(),
      retailLicenseNo: formRetailLicense.trim(),
      subscriptionPlan: formPlan,
      paymentStatus: formPaymentStatus,
      paymentMethod: formPaymentMethod,
      paymentUpiId: formPaymentUpiId.trim(),
      renewalDate: formRenewalDate,
      subscriptionFee: Number(formSubscriptionFee) || 0,
      adminUsername: formAdminUsername.trim() || 'admin',
      adminPassword: formAdminPassword.trim() || 'admin123',
      adminEmail: formAdminEmail.trim() || formEmail.trim() || `${formAdminUsername}@cityrx.com`,
      createdAt: editingTenant ? editingTenant.createdAt : new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    if (editingTenant) {
      StorageService.updatePharmacyTenant(payload);
      setSuccessMessage(`Pharmacy "${payload.name}" updated successfully.`);
    } else {
      StorageService.addPharmacyTenant(payload);
      setSuccessMessage(`New Pharmacy "${payload.name}" registered with Code ${payload.pharmacyCode}.`);
    }

    reload();
    setShowAddModal(false);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleDeleteTenant = (t: PharmacyTenant) => {
    if (t.pharmacyCode === currentProfile.pharmacyCode && tenants.length <= 1) {
      alert('Cannot delete the last remaining primary pharmacy.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove pharmacy "${t.name}" (${t.pharmacyCode})?`)) {
      StorageService.deletePharmacyTenant(t.id);
      reload();
      setSuccessMessage(`Pharmacy "${t.name}" removed from software controller.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  const handleToggleRetail = (t: PharmacyTenant) => {
    const newState = StorageService.toggleTenantRetail(t.id);
    reload();
    setSuccessMessage(`Retail Action Button ${newState ? 'ACTIVATED' : 'REMOVED'} for ${t.name}.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleToggleWholesale = (t: PharmacyTenant) => {
    const newState = StorageService.toggleTenantWholesale(t.id);
    reload();
    setSuccessMessage(`Wholesale Action Button ${newState ? 'ACTIVATED' : 'REMOVED'} for ${t.name}.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSwitchTenant = (t: PharmacyTenant) => {
    StorageService.switchActiveTenant(t);
    reload();
    setSuccessMessage(`Switched active branch to "${t.name}" (${t.pharmacyCode}). All POS and mobile views are synchronized.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // WhatsApp Share Helper
  const openWhatsAppModal = (t: PharmacyTenant) => {
    setWhatsAppModalTenant(t);
    setWhatsAppRecipientPhone(t.mobile || '');
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://cityrx.link';

  const generateWhatsAppMessage = (t: PharmacyTenant) => {
    const websiteUrl = `${currentOrigin}/?code=${t.pharmacyCode}`;
    const mobileAppUrl = `${currentOrigin}/#mobile`;
    return `🏥 *Welcome to ${t.name}*
🔑 *Pharmacy Code:* ${t.pharmacyCode}

🌐 *Pharmacy Website & Online Ordering:*
${websiteUrl}

📱 *Mobile App (Android APK / PWA):*
${mobileAppUrl}

👤 *Pharmacy Login Credentials:*
• Username: ${t.adminUsername}
• Password: ${t.adminPassword || 'admin123'}

⚙️ *Active Features:*
• Retail Sales POS: ${t.retailActive ? '✅ Active' : '❌ Deactivated'}
• Wholesale B2B Sales: ${t.wholesaleActive ? '✅ Active' : '❌ Deactivated'}
• Billing Mode: ${t.businessType.toUpperCase()}
• Subscription Plan: ${t.subscriptionPlan} (${t.paymentStatus})

_Powered by Cloud Pharmacy ERP System (Multi-Device Computer & Mobile)_`;
  };

  const sendDirectToWhatsApp = (t: PharmacyTenant, customPhone?: string) => {
    const message = generateWhatsAppMessage(t);
    const encoded = encodeURIComponent(message);
    const targetPhone = (customPhone || t.mobile).replace(/[^0-9]/g, '');
    let url = '';
    if (targetPhone.length >= 10) {
      const fullPhone = targetPhone.length === 10 ? `91${targetPhone}` : targetPhone;
      url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encoded}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encoded}`;
    }
    window.open(url, '_blank');
  };

  // Filtered List
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        t.name.toLowerCase().includes(q) ||
        t.pharmacyCode.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.adminUsername.toLowerCase().includes(q) ||
        t.mobile.includes(q);

      const matchType =
        filterType === 'all' ||
        (filterType === 'both' && t.businessType === 'both') ||
        (filterType === 'retail' && (t.businessType === 'retail' || (t.retailActive && !t.wholesaleActive))) ||
        (filterType === 'wholesale' && (t.businessType === 'wholesale' || (!t.retailActive && t.wholesaleActive)));

      const matchPayment = filterPayment === 'all' || t.paymentStatus === filterPayment;

      return matchSearch && matchType && matchPayment;
    });
  }, [tenants, searchQuery, filterType, filterPayment]);

  const activeRetailCount = tenants.filter(t => t.retailActive).length;
  const activeWholesaleCount = tenants.filter(t => t.wholesaleActive).length;
  const totalRevenue = tenants.reduce((sum, t) => sum + (t.subscriptionFee || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>Multi-Store Master Controller</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Software Controller & Pharmacy Hub</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Create pharmacy codes, manage retail & wholesale action buttons, configure payment options, 
              generate credentials, and instantly dispatch website/app download links directly to WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              id="add-pharmacy-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Pharmacy</span>
            </button>

            <button
              onClick={reload}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-xs transition-all cursor-pointer"
              title="Refresh Tenants"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Pharmacies</span>
            <div className="text-xl sm:text-2xl font-black text-white">{tenants.length} Stores</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-teal-300">Retail Active POS</span>
            <div className="text-xl sm:text-2xl font-black text-teal-400">{activeRetailCount} Active</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-indigo-300">Wholesale Active</span>
            <div className="text-xl sm:text-2xl font-black text-indigo-400">{activeWholesaleCount} Active</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-amber-300">Annual License ARR</span>
            <div className="text-xl sm:text-2xl font-black text-amber-400">₹{totalRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Pharmacy Name, Code (e.g. CP-MDU-101), City, Phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Business Mode Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'hover:text-slate-900'}`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType('retail')}
              className={`px-2.5 py-1 rounded-lg transition-all ${filterType === 'retail' ? 'bg-emerald-600 text-white shadow-2xs font-black' : 'hover:text-slate-900'}`}
            >
              Retail
            </button>
            <button
              onClick={() => setFilterType('wholesale')}
              className={`px-2.5 py-1 rounded-lg transition-all ${filterType === 'wholesale' ? 'bg-indigo-600 text-white shadow-2xs font-black' : 'hover:text-slate-900'}`}
            >
              Wholesale
            </button>
            <button
              onClick={() => setFilterType('both')}
              className={`px-2.5 py-1 rounded-lg transition-all ${filterType === 'both' ? 'bg-slate-900 text-white shadow-2xs font-black' : 'hover:text-slate-900'}`}
            >
              Both
            </button>
          </div>

          {/* Payment Status Filter */}
          <select
            value={filterPayment}
            onChange={e => setFilterPayment(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Payment Status</option>
            <option value="Active">Payment: Active</option>
            <option value="Pending">Payment: Pending</option>
            <option value="Grace_Period">Grace Period</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Pharmacies List */}
      <div className="space-y-4">
        {filteredTenants.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No pharmacies found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching branch or pharmacy for "{searchQuery}". Click "Add New Pharmacy" to register a branch.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Create Pharmacy Code</span>
            </button>
          </div>
        ) : (
          filteredTenants.map(t => {
            const isCurrentActive = t.pharmacyCode === currentProfile.pharmacyCode;
            const isPasswordVisible = !!showPasswordMap[t.id];

            return (
              <div
                key={t.id}
                className={`bg-white rounded-3xl border transition-all p-5 sm:p-6 shadow-xs ${
                  isCurrentActive ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  {/* Left Column: Identity, Code, Address */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">{t.name}</h3>

                      {/* Pharmacy Code Badge */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-slate-900 text-teal-300 shadow-2xs">
                        <span>Code:</span>
                        <span>{t.pharmacyCode}</span>
                      </span>

                      {/* Current Active Badge */}
                      {isCurrentActive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-300">
                          <CheckCircle2 className="w-3 h-3 text-teal-700" />
                          <span>Active Computer & Mobile Branch</span>
                        </span>
                      )}

                      {/* Business Operating Mode */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                          t.businessType === 'both'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : t.businessType === 'wholesale'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {t.businessType === 'both' ? 'Retail + Wholesale' : t.businessType}
                      </span>
                    </div>

                    {t.tagline && <p className="text-xs text-slate-500 italic">{t.tagline}</p>}

                    {/* Metadata Specs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Location</span>
                        <span className="font-semibold text-slate-800">
                          {t.city}, {t.district} - {t.pincode}
                        </span>
                        <div className="text-[10px] text-slate-500 truncate">{t.addressLine1}</div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Drug License & GSTIN</span>
                        <span className="font-mono text-[11px] font-bold text-slate-800">{t.drugLicenseNo}</span>
                        <div className="font-mono text-[10px] text-slate-500">GST: {t.gstin || 'None'}</div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Phone & Email</span>
                        <span className="font-bold text-slate-800">{t.mobile}</span>
                        <div className="text-[10px] text-slate-500 truncate">{t.email}</div>
                      </div>
                    </div>

                    {/* ACTION BUTTON CONTROLS: RETAIL & WHOLESALE TOGGLE ACTIVATION */}
                    <div className="p-3 bg-slate-900 rounded-2xl text-white flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-teal-400" />
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                          Action Button Controller:
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* Retail Action Button Toggle */}
                        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                          <Store className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs font-bold text-slate-300">Retail Button:</span>
                          <button
                            onClick={() => handleToggleRetail(t)}
                            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              t.retailActive
                                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                                : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                            }`}
                            title="Toggle whether Retail POS action button appears in cashier workspace"
                          >
                            {t.retailActive ? 'ACTIVE (ON)' : 'REMOVED (OFF)'}
                          </button>
                        </div>

                        {/* Wholesale Action Button Toggle */}
                        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                          <Truck className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-xs font-bold text-slate-300">Wholesale Button:</span>
                          <button
                            onClick={() => handleToggleWholesale(t)}
                            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              t.wholesaleActive
                                ? 'bg-indigo-500 text-white shadow-xs'
                                : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                            }`}
                            title="Toggle whether Wholesale B2B action button appears in cashier workspace"
                          >
                            {t.wholesaleActive ? 'ACTIVE (ON)' : 'REMOVED (OFF)'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Payment Option & Credentials */}
                  <div className="lg:w-80 space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shrink-0">
                    {/* Subscription & Payment Option */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                          <span>Pharmacy Payment Option</span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            t.paymentStatus === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : t.paymentStatus === 'Pending'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {t.paymentStatus}
                        </span>
                      </div>

                      <div className="text-xs space-y-1 font-mono">
                        <div className="flex justify-between text-slate-700">
                          <span className="font-sans text-slate-500">Plan Tier:</span>
                          <span className="font-bold">{t.subscriptionPlan} (₹{t.subscriptionFee?.toLocaleString()})</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span className="font-sans text-slate-500">Payment Via:</span>
                          <span className="font-bold">{t.paymentMethod || 'UPI'}</span>
                        </div>
                        {t.paymentUpiId && (
                          <div className="flex justify-between text-slate-700">
                            <span className="font-sans text-slate-500">UPI ID:</span>
                            <span className="font-bold text-teal-700">{t.paymentUpiId}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-700">
                          <span className="font-sans text-slate-500">Renewal Date:</span>
                          <span>{t.renewalDate || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Admin Credentials */}
                    <div className="pt-2 border-t border-slate-200 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block flex items-center gap-1">
                        <Key className="w-3 h-3 text-slate-400" />
                        <span>Admin Login Credentials</span>
                      </span>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">User:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-slate-900">{t.adminUsername}</span>
                            <button
                              onClick={() => handleCopy(t.adminUsername, `user-${t.id}`)}
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                              title="Copy username"
                            >
                              {copiedKey === `user-${t.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Pass:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">
                              {isPasswordVisible ? t.adminPassword || 'admin123' : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(t.id)}
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                              title={isPasswordVisible ? 'Hide password' : 'Show password'}
                            >
                              {isPasswordVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => handleCopy(t.adminPassword || 'admin123', `pass-${t.id}`)}
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                              title="Copy password"
                            >
                              {copiedKey === `pass-${t.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
                      {/* Send to WhatsApp Button */}
                      <button
                        onClick={() => openWhatsAppModal(t)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                        title="Send website link, mobile app link, pharmacy code, and login details directly to WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-200 fill-emerald-200/30" />
                        <span>Send Links to WhatsApp</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {!isCurrentActive ? (
                          <button
                            onClick={() => handleSwitchTenant(t)}
                            className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                            title="Set this pharmacy as currently active on this computer/device"
                          >
                            Switch to Branch
                          </button>
                        ) : (
                          <span className="flex-1 py-1.5 px-3 text-center bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200">
                            Current Active
                          </span>
                        )}

                        <button
                          onClick={() => openEditModal(t)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                          title="Edit pharmacy details, plans, and licenses"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteTenant(t)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-all cursor-pointer"
                          title="Remove pharmacy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* WHATSAPP SHARE MODAL (WEBSITE LINK + MOBILE APP LINK + CREDENTIALS)      */}
      {/* ========================================================================= */}
      {whatsAppModalTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max mb-1">
                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                  <span>Direct WhatsApp Link Dispatch</span>
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Send App & Website Link to WhatsApp
                </h3>
                <p className="text-xs text-slate-500">
                  Pharmacy: <span className="font-bold text-slate-800">{whatsAppModalTenant.name}</span> ({whatsAppModalTenant.pharmacyCode})
                </p>
              </div>
              <button
                onClick={() => setWhatsAppModalTenant(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Recipient phone input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Recipient WhatsApp Number:
              </label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200">
                  +91
                </span>
                <input
                  type="text"
                  placeholder="e.g. 9842188442"
                  value={whatsAppRecipientPhone}
                  onChange={e => setWhatsAppRecipientPhone(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                You can send to the pharmacy owner, doctor, delivery rider, or customer.
              </p>
            </div>

            {/* Preview of WhatsApp message */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                WhatsApp Message Preview:
              </label>
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                {generateWhatsAppMessage(whatsAppModalTenant)}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  sendDirectToWhatsApp(whatsAppModalTenant, whatsAppRecipientPhone);
                  setWhatsAppModalTenant(null);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-white" />
                <span>Open in WhatsApp & Send Message</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCopy(generateWhatsAppMessage(whatsAppModalTenant), 'modal-full-msg')}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {copiedKey === 'modal-full-msg' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'modal-full-msg' ? 'Copied!' : 'Copy Full Message'}</span>
                </button>

                <button
                  onClick={() => handleCopy(`${currentOrigin}/?code=${whatsAppModalTenant.pharmacyCode}`, 'modal-link-only')}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {copiedKey === 'modal-link-only' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Globe className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'modal-link-only' ? 'Copied Link!' : 'Copy Link Only'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT PHARMACY MODAL                                                 */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 flex items-center gap-1 w-max mb-1">
                  <Building2 className="w-3 h-3 text-teal-600" />
                  <span>{editingTenant ? 'Edit Branch' : 'Register New Pharmacy'}</span>
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {editingTenant ? `Edit ${editingTenant.name}` : 'Add Pharmacy & Create Code'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure store code, retail/wholesale action buttons, payment plan, and admin credentials.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="space-y-5">
              {/* Section 1: Identification & Code */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  1. Store Identity & Code
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Pharmacy Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. City Rx - Othakadai Branch"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">Pharmacy Code *</label>
                      <button
                        type="button"
                        onClick={() => setFormCode(generateRandomPharmacyCode())}
                        className="text-[10px] font-bold text-teal-600 hover:text-teal-800 underline"
                      >
                        Auto Generate
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CP-MDU-102"
                      value={formCode}
                      onChange={e => setFormCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Operating Business Mode</label>
                    <select
                      value={formBusinessType}
                      onChange={e => {
                        const val = e.target.value as PharmacyBusinessType;
                        setFormBusinessType(val);
                        if (val === 'retail') {
                          setFormRetailActive(true);
                          setFormWholesaleActive(false);
                        } else if (val === 'wholesale') {
                          setFormRetailActive(false);
                          setFormWholesaleActive(true);
                        } else {
                          setFormRetailActive(true);
                          setFormWholesaleActive(true);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="both">Both Retail & Wholesale (Dual Mode)</option>
                      <option value="retail">Retail Chemist Only</option>
                      <option value="wholesale">Wholesale B2B Distributor Only</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Tagline / Branch Descriptor</label>
                    <input
                      type="text"
                      placeholder="e.g. 24/7 Hospital Counter / Melur Market"
                      value={formTagline}
                      onChange={e => setFormTagline(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* ACTION BUTTON ACTIVATION TOGGLES */}
                <div className="p-3.5 bg-slate-900 rounded-2xl text-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-300">Action Button Visibility Controller:</span>
                    <span className="text-[10px] text-slate-400">Activate or remove buttons dynamically</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2.5 p-2 bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-750">
                      <input
                        type="checkbox"
                        checked={formRetailActive}
                        onChange={e => setFormRetailActive(e.target.checked)}
                        className="rounded text-emerald-500 focus:ring-emerald-400 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">Retail POS Button</span>
                        <span className="text-[10px] text-slate-400">Show/Hide Retail Cashier Checkout</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-750">
                      <input
                        type="checkbox"
                        checked={formWholesaleActive}
                        onChange={e => setFormWholesaleActive(e.target.checked)}
                        className="rounded text-indigo-500 focus:ring-indigo-400 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">Wholesale B2B Button</span>
                        <span className="text-[10px] text-slate-400">Show/Hide Wholesale Tax Billing</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 2: Payment Option & Plan */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  2. Pharmacy Payment & Subscription Option
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Subscription Tier</label>
                    <select
                      value={formPlan}
                      onChange={e => setFormPlan(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Free_Trial">Free Trial (14 Days)</option>
                      <option value="Monthly">Monthly Plan (₹1,499)</option>
                      <option value="Annual">Annual Plan (₹9,999)</option>
                      <option value="Enterprise">Enterprise Multi-Store (₹14,999)</option>
                      <option value="Lifetime">Lifetime License</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Payment Status</label>
                    <select
                      value={formPaymentStatus}
                      onChange={e => setFormPaymentStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Active">Active / Paid</option>
                      <option value="Pending">Pending Payment</option>
                      <option value="Grace_Period">Grace Period</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Subscription Fee (₹)</label>
                    <input
                      type="number"
                      value={formSubscriptionFee}
                      onChange={e => setFormSubscriptionFee(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Payment Method</label>
                    <select
                      value={formPaymentMethod}
                      onChange={e => setFormPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Bank_NEFT">Bank NEFT / RTGS</option>
                      <option value="Card">Debit / Credit Card</option>
                      <option value="Cash">Cash / Counter</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Pharmacy Payment UPI ID</label>
                    <input
                      type="text"
                      placeholder="e.g. pharmacyname@upi"
                      value={formPaymentUpiId}
                      onChange={e => setFormPaymentUpiId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Renewal Date</label>
                    <input
                      type="date"
                      value={formRenewalDate}
                      onChange={e => setFormRenewalDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Admin Username & Password Creation */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  3. Pharmacy Username & Password Creation
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Admin Username *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. madurai_admin"
                      value={formAdminUsername}
                      onChange={e => setFormAdminUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Password Creation *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. pass123"
                      value={formAdminPassword}
                      onChange={e => setFormAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Admin Email</label>
                    <input
                      type="email"
                      placeholder="admin@cityrx.com"
                      value={formAdminEmail}
                      onChange={e => setFormAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Address & Tax Registration */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  4. Address, Drug License & GSTIN
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Address Line</label>
                    <input
                      type="text"
                      placeholder="e.g. 45 Bazaar Street"
                      value={formAddress}
                      onChange={e => setFormAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Mobile Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="8438678498"
                      value={formMobile}
                      onChange={e => setFormMobile(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">City / Taluk</label>
                    <input
                      type="text"
                      value={formCity}
                      onChange={e => setFormCity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">District</label>
                    <input
                      type="text"
                      value={formDistrict}
                      onChange={e => setFormDistrict(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">GSTIN</label>
                    <input
                      type="text"
                      value={formGstin}
                      onChange={e => setFormGstin(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Drug License No</label>
                    <input
                      type="text"
                      value={formDrugLicense}
                      onChange={e => setFormDrugLicense(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer"
                >
                  {editingTenant ? 'Save Changes' : 'Register Pharmacy & Create Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
