import React, { useState, useEffect } from 'react';
import {
  Pill,
  ShieldCheck,
  Bell,
  AlertTriangle,
  Clock,
  UserCheck,
  Search,
  Menu,
  ChevronDown,
  LogOut,
  RefreshCw,
  Sparkles,
  MapPin,
  Smartphone,
  Monitor,
  Download,
  UserPlus,
  Mic,
  ShoppingBag,
  Edit2,
  Award,
  Store,
  Building2,
  Check
} from 'lucide-react';
import { User, Medicine, Patient, PharmacyProfile, PharmacyBusinessType } from '../types';
import { INITIAL_USERS } from '../mockData';
import { StorageService } from '../services/storage';
import { PharmacyLogo } from './PharmacyLogo';
import { PharmacyLocationModal } from './PharmacyLocationModal';
import { PlayStoreInstallModal } from './PlayStoreInstallModal';
import { DesktopDownloadModal } from './DesktopDownloadModal';
import { EditStaffModal } from './EditStaffModal';
import { EditPharmacistModal } from './EditPharmacistModal';

interface NavbarProps {
  currentUser: User | null;
  onSelectUser: (user: User) => void;
  onLogout: () => void;
  medicines: Medicine[];
  patients: Patient[];
  onNavigateTab: (tabId: string) => void;
  onToggleMobileNav: () => void;
  onOpenGlobalSearch: () => void;
  onOpenVoiceAssistant?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSelectUser,
  onLogout,
  medicines,
  patients,
  onNavigateTab,
  onToggleMobileNav,
  onOpenGlobalSearch,
  onOpenVoiceAssistant,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileAppModal, setShowMobileAppModal] = useState(false);
  const [showDesktopAppModal, setShowDesktopAppModal] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<User | null>(null);
  const [showPharmacistModal, setShowPharmacistModal] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [businessType, setBusinessType] = useState<PharmacyBusinessType>(() => StorageService.getBusinessType());
  const [currentMode, setCurrentMode] = useState<'retail' | 'wholesale'>(() => StorageService.getActivePOSMode());
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  useEffect(() => {
    const handleModeChanged = (e: any) => {
      if (e.detail) setCurrentMode(e.detail);
    };
    const handleBusinessModeUpdated = (e: any) => {
      if (e.detail) setBusinessType(e.detail);
    };
    window.addEventListener('pharmacy:pos-mode-changed', handleModeChanged);
    window.addEventListener('pharmacy:business-mode-updated', handleBusinessModeUpdated);
    window.addEventListener('pharmacy:profile-updated', () => {
      setBusinessType(StorageService.getBusinessType());
    });
    return () => {
      window.removeEventListener('pharmacy:pos-mode-changed', handleModeChanged);
      window.removeEventListener('pharmacy:business-mode-updated', handleBusinessModeUpdated);
    };
  }, []);

  const handleSelectMode = (mode: 'retail' | 'wholesale') => {
    StorageService.setActivePOSMode(mode);
    setCurrentMode(mode);
    setShowModeDropdown(false);
    onNavigateTab('pos');
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute live alerts
  const lowStockCount = (medicines || []).filter(m => {
    const batches = Array.isArray(m.batches) ? m.batches : [];
    const totalStock = batches.reduce((sum, b) => sum + (b.stock || 0), 0);
    return totalStock <= m.minStockAlert;
  }).length;

  const now = new Date();
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(now.getDate() + 60);

  const expiringBatchesCount = (medicines || []).flatMap(m => Array.isArray(m.batches) ? m.batches : []).filter(b => {
    if (!b || !b.expiryDate) return false;
    const exp = new Date(b.expiryDate);
    return exp <= sixtyDaysFromNow;
  }).length;

  const dueRefillsCount = (patients || []).flatMap(p => Array.isArray(p.refillReminders) ? p.refillReminders : []).filter(
    r => r && (r.status === 'Due Soon' || r.status === 'Overdue')
  ).length;

  const totalAlerts = lowStockCount + expiringBatchesCount + dueRefillsCount;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 py-2.5 transition-all">
      <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile menu toggle + Logo & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileNav}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden"
            aria-label="Toggle navigation menu"
            id="mobile-nav-toggle-btn"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onNavigateTab('pos')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <PharmacyLogo size="sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 tracking-tight text-lg">City Rx</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Melur
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                City Medical • Chokkalingapuram, Melur Taluk, TN 625103
              </p>
            </div>
          </div>

          {/* Business Mode Indicator / Fast Switcher */}
          <div className="relative ml-1 sm:ml-2">
            <button
              type="button"
              onClick={() => setShowModeDropdown(prev => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                currentMode === 'wholesale'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100 ring-2 ring-indigo-500/20'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100 ring-2 ring-emerald-500/20'
              }`}
              id="navbar-business-mode-btn"
              title="Switch between Retail Pharmacy and Wholesale Pharma mode"
            >
              {currentMode === 'wholesale' ? (
                <>
                  <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="font-extrabold text-[11px] sm:text-xs">Wholesale Pharma</span>
                </>
              ) : (
                <>
                  <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-extrabold text-[11px] sm:text-xs">Retail Pharmacy</span>
                </>
              )}
              <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
            </button>

            {/* Dropdown Menu */}
            {showModeDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowModeDropdown(false)}
                />
                <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fade-in text-xs">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                    <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Pharmacy Operating Mode</p>
                    <p className="text-[10px] text-slate-500">Switch current active sales desk mode</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectMode('retail')}
                    className={`w-full text-left p-2 rounded-xl flex items-start gap-2.5 transition-colors cursor-pointer ${
                      currentMode === 'retail'
                        ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
                      <Store className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">Retail Pharmacy</span>
                        {currentMode === 'retail' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                        Patient billing, retail MRP, loose tabs/strips, doctor Rx, retail cash memo
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectMode('wholesale')}
                    className={`w-full text-left p-2 rounded-xl flex items-start gap-2.5 transition-colors cursor-pointer mt-1 ${
                      currentMode === 'wholesale'
                        ? 'bg-indigo-50 text-indigo-950 font-bold border border-indigo-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg shrink-0 mt-0.5">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">Wholesale Pharma</span>
                        {currentMode === 'wholesale' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                        B2B to chemists & hospitals, PTR pricing, Box/Shipper packs, B2B GST tax invoice
                      </p>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 mt-1.5 pt-1.5 px-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModeDropdown(false);
                        onNavigateTab('settings');
                      }}
                      className="w-full text-center py-1.5 px-2 text-[11px] text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg font-bold transition-colors cursor-pointer"
                    >
                      Configure Operating Mode in Settings →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Center: Global Quick Search & Voice Assistant */}
        <div className="flex-1 max-w-md hidden md:flex items-center gap-2">
          <button
            onClick={onOpenGlobalSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-slate-500 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/70 rounded-xl transition-colors text-left"
            id="global-search-btn"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Search drugs, generic molecules, patients, invoices...</span>
            </span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded">
              ⌘K
            </kbd>
          </button>
          {onOpenVoiceAssistant && (
            <button
              onClick={onOpenVoiceAssistant}
              className="px-2.5 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 text-teal-800 border border-teal-200 rounded-xl transition-all shrink-0 flex items-center gap-1.5 text-xs font-bold shadow-2xs group"
              title="City Rx Voice Assistant [Alt+V / Ctrl+Shift+V]"
              id="navbar-voice-assistant-btn"
            >
              <Mic className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
              <span className="hidden lg:inline">Voice</span>
            </button>
          )}
        </div>

        {/* Right: Security & Alert Badges + Live Clock + User Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search & Voice Triggers */}
          <button
            onClick={onOpenGlobalSearch}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Search (⌘K)"
          >
            <Search className="w-4 h-4 text-slate-600" />
          </button>
          {onOpenVoiceAssistant && (
            <button
              onClick={onOpenVoiceAssistant}
              className="md:hidden p-2 text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors"
              title="Voice Assistant"
            >
              <Mic className="w-4 h-4 text-teal-600" />
            </button>
          )}
          {/* Security Status Tag */}
          <div
            onClick={() => onNavigateTab('security')}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg text-xs font-medium border border-slate-200 cursor-pointer transition-colors"
            title="AES-256 Cloud Encryption Active"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit Encrypted</span>
          </div>

          {/* Clock */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime}</span>
          </div>

          {/* Quick Notification Pills */}
          <div className="flex items-center gap-1.5">
            {lowStockCount > 0 && (
              <button
                onClick={() => onNavigateTab('purchases')}
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                title={`${lowStockCount} items below restocking threshold`}
                id="navbar-low-stock-badge"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>{lowStockCount} Low</span>
              </button>
            )}

            {expiringBatchesCount > 0 && (
              <button
                onClick={() => onNavigateTab('inventory')}
                className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                title={`${expiringBatchesCount} batches expiring within 60 days`}
                id="navbar-expiring-batches-badge"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{expiringBatchesCount} Near Exp</span>
              </button>
            )}

            {dueRefillsCount > 0 && (
              <button
                onClick={() => onNavigateTab('patients')}
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                title={`${dueRefillsCount} patient medication refills due soon`}
                id="navbar-due-refills-badge"
              >
                <Bell className="w-3.5 h-3.5 text-teal-600" />
                <span>{dueRefillsCount} Refills</span>
              </button>
            )}
          </div>

          {/* Customer Online Order Portal & Live Store */}
          <button
            onClick={() => onNavigateTab('online-orders')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            title="Customer Online Order Portal, Dynamic UPI & Local Delivery"
            id="navbar-online-orders-btn"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Online Store</span>
          </button>

          {/* Download Desktop App (PC / Mac) */}
          <button
            onClick={() => setShowDesktopAppModal(true)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
            title="Download / Install Desktop Software for Windows & Mac"
            id="navbar-desktop-download-btn"
          >
            <Monitor className="w-3.5 h-3.5 text-teal-600" />
            <span>Desktop App</span>
          </button>

          {/* Download Play Store App / Android PWA Button */}
          <button
            onClick={() => setShowMobileAppModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
            title="Install City Medical Google Play / Android App"
            id="navbar-mobile-download-btn"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Play Store App</span>
          </button>

          {/* Quick OTP Sign Up & Login Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            title="Sign Up / OTP Login with 8438678498"
            id="navbar-otp-auth-btn"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Up / OTP (8438678498)</span>
            <span className="md:hidden">OTP</span>
          </button>

          {/* User Account / Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              id="user-profile-menu-btn"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  {currentUser?.name ? currentUser.name[0] : 'U'}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser?.name || 'Guest Staff'}
                </div>
                <div className="text-[10px] uppercase font-semibold text-emerald-700">
                  {currentUser?.role || 'User'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-400">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{currentUser?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                    </div>
                    {currentUser && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          setStaffToEdit(currentUser);
                        }}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-emerald-200 cursor-pointer shrink-0 transition-colors"
                        title="Edit my staff profile & name"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                  {currentUser?.licenseNumber && (
                    <span className="inline-block mt-1 text-[10px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                      License: {currentUser.licenseNumber}
                    </span>
                  )}
                </div>

                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Switch Staff User</span>
                  <span className="text-[10px] text-emerald-700 font-bold">Multi-User</span>
                </div>

                <div className="space-y-0.5 px-1.5 max-h-48 overflow-y-auto">
                  {StorageService.getUsers().map(user => (
                    <div
                      key={user.id}
                      className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
                        currentUser?.id === user.id
                          ? 'bg-emerald-50 text-emerald-900 font-semibold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectUser(user);
                          setShowUserDropdown(false);
                        }}
                        className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-6 h-6 rounded-md object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium text-xs">{user.name.split(',')[0]}</div>
                          <div className="text-[10px] text-slate-500 capitalize flex items-center gap-1 truncate">
                            <span className="font-mono">@{user.username}</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">{user.role}</span>
                          </div>
                        </div>
                        {currentUser?.id === user.id && (
                          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mr-1" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowUserDropdown(false);
                          setStaffToEdit(user);
                        }}
                        title={`Edit ${user.name}`}
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/70 rounded-md transition-colors cursor-pointer shrink-0"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 mt-2 pt-1 px-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowPharmacistModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-emerald-900 hover:bg-emerald-50 font-bold transition-colors cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Edit Reg. Pharmacist (Bill Header)</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      if (currentUser) {
                        StorageService.downloadUserCredentials(currentUser);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download Staff Pass (.txt)</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-emerald-800 hover:bg-emerald-50 font-bold transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sign Up / OTP Login (8438678498)</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onNavigateTab('security');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Manage Users & Passwords</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 font-medium transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Lock Session / Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Play Store & Mobile App Download Modal */}
      {showMobileAppModal && (
        <PlayStoreInstallModal
          isOpen={showMobileAppModal}
          onClose={() => setShowMobileAppModal(false)}
        />
      )}

      {/* Desktop App Download & Troubleshooting Modal */}
      {showDesktopAppModal && (
        <DesktopDownloadModal
          isOpen={showDesktopAppModal}
          onClose={() => setShowDesktopAppModal(false)}
        />
      )}

      {/* Edit Staff Modal */}
      {staffToEdit && (
        <EditStaffModal
          user={staffToEdit}
          isOpen={staffToEdit !== null}
          onClose={() => setStaffToEdit(null)}
          onSaved={(updatedUser) => {
            if (currentUser?.id === updatedUser.id) {
              onSelectUser(updatedUser);
            }
          }}
        />
      )}

      {/* Edit Pharmacist Modal */}
      <EditPharmacistModal
        isOpen={showPharmacistModal}
        onClose={() => setShowPharmacistModal(false)}
        onSaved={(_updatedProfile) => {
          // Profile is persisted in storage
        }}
      />
    </header>
  );
};
