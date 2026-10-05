import React, { useState, useMemo } from 'react';
import {
  Monitor,
  Laptop,
  Smartphone,
  Download,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Terminal,
  Share2,
  Zap,
  WifiOff,
  Printer,
  Barcode,
  Globe,
  Key,
  Award,
  DollarSign,
  Building2,
  Package,
  HardDrive,
  FileCode,
  Cpu,
  Store,
  RefreshCw,
  FileText,
  Lock,
  ChevronRight,
  Server,
  Cloud
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { StorageService } from '../services/storage';
import { PharmacyProfile } from '../types';
import { DesktopDownloadModal } from '../components/DesktopDownloadModal';
import {
  downloadWindowsDesktopLauncher,
  downloadWindowsVbsLauncher,
  downloadDesktopOfflineApp,
  downloadElectronSourceFiles,
  checkDesktopEnvironment
} from '../utils/desktopDownloadUtils';

interface PlayStoreAppViewProps {
  onNavigateTab?: (tabId: string) => void;
}

type ActiveSection = 'desktop' | 'mobile' | 'publish' | 'sale-control';

export const PlayStoreAppView: React.FC<PlayStoreAppViewProps> = ({ onNavigateTab }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, isWindows, isMac, isDesktop, install } = usePWAInstall();
  const [activeSection, setActiveSection] = useState<ActiveSection>('desktop');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const existingProfile = StorageService.getPharmacyProfile();
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://cityrx.link';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(currentOrigin)}&margin=10`;

  // White-Label Configuration State for Selling Software to other pharmacies
  const [clientProfile, setClientProfile] = useState({
    name: 'Apollo Medicals & Clinic',
    tagline: 'Retail Pharmacy & Doctor OPD Center',
    ownerName: 'Dr. K. Senthil Kumar, M.Pharm',
    address: '42 Bazaar Main Road, Melur Taluk',
    city: 'Madurai',
    state: 'Tamil Nadu',
    pincode: '625106',
    phone: '+91 98421 77321',
    email: 'contact@apollomedicals.in',
    drugLicenseNo: 'TN-625106-20B / 21B',
    gstin: '33AAAPL9921D1Z4',
    currency: '₹'
  });

  // Commercial Software License Generator State
  const [licenseConfig, setLicenseConfig] = useState({
    clientName: 'Sri Murugan Healthcare & Pharmacy',
    tier: 'Single-Store Counter Terminal (Perpetual)',
    licenseType: 'PERPETUAL_LIFETIME',
    licenseKey: 'CM-2026-PERP-8924-LIC',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: 'Lifetime (No Expiry)',
    maxCounters: '3 Terminals',
    issuedBy: 'Ajmal Software Solutions',
    supportYears: '1 Year AMC Included'
  });

  const [generatedSuccess, setGeneratedSuccess] = useState(false);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateNewKey = () => {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const key = `CM-${new Date().getFullYear()}-${licenseConfig.licenseType === 'PERPETUAL_LIFETIME' ? 'PERP' : 'SUB'}-${randomNum}-${randomHex}`;
    setLicenseConfig(prev => ({
      ...prev,
      licenseKey: key
    }));
    setGeneratedSuccess(true);
    setTimeout(() => setGeneratedSuccess(false), 2500);
  };

  const handleDownloadClientConfig = () => {
    const jsonStr = JSON.stringify(clientProfile, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmacy-client-config-${clientProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintLicenseCertificate = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=750');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Software License Certificate - ${licenseConfig.clientName}</title>
          <style>
            body {
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              padding: 40px;
              color: #0f172a;
              background-color: #f8fafc;
            }
            .certificate-container {
              border: 8px double #0d9488;
              background: #ffffff;
              padding: 50px;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.08);
              position: relative;
              max-width: 800px;
              margin: 0 auto;
            }
            .header-badge {
              text-align: center;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 2px;
              color: #0d9488;
              margin-bottom: 8px;
            }
            h1 {
              text-align: center;
              font-size: 28px;
              margin: 0 0 10px 0;
              color: #0f172a;
              font-weight: 900;
              letter-spacing: -0.5px;
            }
            .subtitle {
              text-align: center;
              font-size: 14px;
              color: #475569;
              margin-bottom: 30px;
            }
            .certify-text {
              text-align: center;
              font-size: 14px;
              color: #64748b;
              margin-bottom: 12px;
            }
            .client-title {
              text-align: center;
              font-size: 24px;
              font-weight: 800;
              color: #0f172a;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 12px;
              margin-bottom: 25px;
            }
            .grid-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 30px;
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .grid-item {
              font-size: 13px;
            }
            .grid-label {
              font-weight: bold;
              color: #64748b;
              font-size: 11px;
              text-transform: uppercase;
              display: block;
              margin-bottom: 3px;
            }
            .grid-val {
              font-weight: 700;
              color: #0f172a;
            }
            .key-box {
              background: #042f2e;
              color: #5eead4;
              font-family: monospace;
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              padding: 14px;
              border-radius: 8px;
              letter-spacing: 2px;
              margin-bottom: 30px;
            }
            .footer-signatures {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
            }
            .signature-block {
              text-align: center;
            }
            .signature-line {
              width: 180px;
              border-top: 1px solid #94a3b8;
              margin-bottom: 6px;
            }
            .stamp {
              width: 90px;
              height: 90px;
              border: 3px dashed #0d9488;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
              font-size: 10px;
              font-weight: 800;
              color: #0d9488;
              text-transform: uppercase;
              transform: rotate(-10deg);
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <div class="header-badge">Certificate of Software Ownership & Right of Use</div>
            <h1>COMMERCIAL SOFTWARE LICENSE</h1>
            <div class="subtitle">City Medical Enterprise Pharmacy Management System (ERP)</div>
            
            <div class="certify-text">This certifies that commercial authorization and perpetual right to use have been granted to:</div>
            <div class="client-title">${licenseConfig.clientName}</div>

            <div class="grid-details">
              <div class="grid-item">
                <span class="grid-label">License Type & Tier</span>
                <span class="grid-val">${licenseConfig.tier}</span>
              </div>
              <div class="grid-item">
                <span class="grid-label">Authorized Terminals</span>
                <span class="grid-val">${licenseConfig.maxCounters}</span>
              </div>
              <div class="grid-item">
                <span class="grid-label">Date of Grant / Issue</span>
                <span class="grid-val">${licenseConfig.issueDate}</span>
              </div>
              <div class="grid-item">
                <span class="grid-label">Validity / AMC Period</span>
                <span class="grid-val">${licenseConfig.expiryDate} (${licenseConfig.supportYears})</span>
              </div>
            </div>

            <div class="key-box">
              LICENSE KEY: ${licenseConfig.licenseKey}
            </div>

            <p style="font-size: 11px; color: #64748b; line-height: 1.5; text-align: center; margin-bottom: 20px;">
              This software is granted for commercial dispensing, GST billing, inventory, and clinic operations under the full control of the licensee.
              All patient and sales records remain strictly confidential and stored on the licensee's own local machine or private cloud.
            </p>

            <div class="footer-signatures">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div style="font-size: 12px; font-weight: bold; color: #0f172a;">${licenseConfig.issuedBy}</div>
                <div style="font-size: 10px; color: #64748b;">Software Vendor / Licensor</div>
              </div>

              <div class="stamp">
                AUTHENTICATED<br/>VERIFIED LICENSE
              </div>

              <div class="signature-block">
                <div class="signature-line"></div>
                <div style="font-size: 12px; font-weight: bold; color: #0f172a;">Authorized Signatory</div>
                <div style="font-size: 10px; color: #64748b;">${licenseConfig.clientName}</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const bubblewrapCode = `# 1. Install Google Bubblewrap CLI
npm install -g @bubblewrap/cli

# 2. Initialize Play Store Android project from PWA manifest
bubblewrap init --manifest=${currentOrigin}/manifest.webmanifest

# 3. Build signed Android App Bundle (.aab) & APK
bubblewrap build

# Output: app-release-bundle.aab (Upload this directly to Google Play Console)`;

  const electronCode = `# 1. Install Electron and Builder
npm install --save-dev electron electron-builder

# 2. In package.json, add:
# "main": "electron-main.js",
# "scripts": { "desktop:build": "electron-builder --win --mac --linux" }

# 3. Build native standalone installer (.exe / .dmg / .deb)
npm run desktop:build

# Output: dist/CityMedical-Setup.exe (Runs 100% standalone on Windows)`;

  const dockerDeployCode = `# 1. Build Docker container image
docker build -t city-medical-erp .

# 2. Run locally or on your own VPS (Port 3000)
docker run -d -p 3000:3000 --name pharmacy-pos city-medical-erp

# 3. Deploy to Google Cloud Run (Serverless, your own Google Cloud account)
gcloud run deploy city-medical --source . --region asia-southeast1 --allow-unauthenticated`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Top Hero Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="h-36 sm:h-44 bg-gradient-to-r from-teal-900 via-emerald-800 to-slate-900 relative p-6 sm:p-8 flex flex-col justify-end text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/20 text-teal-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Code Ownership & Control</span>
            </span>
          </div>
          <div className="relative z-10 flex flex-wrap items-center gap-2 text-xs font-semibold text-teal-200 mb-1">
            <span>Windows Desktop (.exe)</span>
            <span>•</span>
            <span>Android APK (.aab)</span>
            <span>•</span>
            <span>Cloud & Domain Self-Hosting</span>
            <span>•</span>
            <span>White-Label Commercial Resale</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
            App Download, Publishing & Commercial Control Hub
          </h1>
        </div>

        {/* Section Navigation Tabs */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveSection('desktop')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeSection === 'desktop'
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Desktop Application (PC / Mac)</span>
              {isWindows && <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-800 text-teal-200">Windows</span>}
            </button>

            <button
              onClick={() => setActiveSection('mobile')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeSection === 'mobile'
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Mobile App (Android APK / iOS)</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800">Play Store</span>
            </button>

            <button
              onClick={() => setActiveSection('publish')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeSection === 'publish'
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Publish & Deploy (Your Own Domain)</span>
            </button>

            <button
              onClick={() => setActiveSection('sale-control')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeSection === 'sale-control'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Sell Software & White-Label (100% Your Control)</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 font-extrabold">License</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: DESKTOP APP (WINDOWS / MAC / LINUX) */}
      {/* ========================================================================= */}
      {activeSection === 'desktop' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Card: 1-Click Desktop Install */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
                    <Laptop className="w-3.5 h-3.5 text-teal-600" />
                    <span>Native Standalone Desktop Experience</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Install City Medical on Windows & Mac
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Runs in its own window without browser toolbars, creates a desktop shortcut, launches automatically on Windows startup, and stores all inventory locally.
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 p-2 flex items-center justify-center shrink-0">
                  <Monitor className="w-8 h-8 text-teal-700" />
                </div>
              </div>

              {/* Install Action Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-slate-50 border border-teal-200 flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2 justify-center sm:justify-start">
                      {isInstalled ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span>Installed on this Desktop</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5 text-teal-700" />
                          <span>Desktop Software Ready for Download</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      {isInstalled
                        ? 'You are running City Medical inside a dedicated standalone desktop app window.'
                        : 'Download the 1-click Windows launcher, standalone portable runner, or install directly into your desktop.'}
                    </p>
                  </div>

                  {isInstalled ? (
                    <div className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Active Desktop App</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          downloadWindowsDesktopLauncher(currentOrigin, existingProfile?.name || 'City Medical');
                          setDownloadNotice('Windows Desktop Launcher (.bat) downloaded! Double-click to launch.');
                          setTimeout(() => setDownloadNotice(null), 4000);
                        }}
                        id="playstore-desktop-bat-btn"
                        className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Download 1-Click Windows Launcher"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Windows App (.bat)</span>
                      </button>

                      <button
                        onClick={() => setShowDesktopModal(true)}
                        id="playstore-desktop-options-btn"
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Monitor className="w-3.5 h-3.5 text-teal-600" />
                        <span>All Download Options &amp; Fix</span>
                      </button>
                    </div>
                  )}
                </div>

                {downloadNotice && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{downloadNotice}</span>
                  </div>
                )}
              </div>

              {/* Desktop Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <WifiOff className="w-4 h-4 text-teal-600" />
                    <span>100% Offline POS Billing</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Never stops during broadband or Wi-Fi failure. Cache keeps all 8,000+ medicines, prices, and bills ready.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <Printer className="w-4 h-4 text-emerald-600" />
                    <span>Thermal Printer & Cash Drawer</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Direct USB, COM, and Network ESC/POS thermal printing (58mm / 80mm) with instant automatic paper cut.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <Barcode className="w-4 h-4 text-indigo-600" />
                    <span>USB Barcode Scanner Guns</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Instant laser scanning directly into the billing search bar without touching the keyboard.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <HardDrive className="w-4 h-4 text-amber-600" />
                    <span>Local Data Sovereignty</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    All transaction logs, tax invoices, and doctor prescriptions are stored locally under your physical control.
                  </p>
                </div>
              </div>

              {/* OS Guided Instructions */}
              <div className="pt-2 border-t border-slate-200">
                <h3 className="font-black text-xs uppercase tracking-wider text-slate-500 mb-3">
                  Step-by-Step Installation by Operating System
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5">
                    <span className="font-extrabold text-teal-800 flex items-center gap-1">
                      <Monitor className="w-3.5 h-3.5" /> Windows 10 / 11
                    </span>
                    <p className="text-[11px] text-slate-600">
                      In Google Chrome or Microsoft Edge, look at the right end of the address bar. Click the <strong>Install (⊕)</strong> icon, then confirm.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5">
                    <span className="font-extrabold text-slate-800 flex items-center gap-1">
                      <Laptop className="w-3.5 h-3.5" /> Apple macOS
                    </span>
                    <p className="text-[11px] text-slate-600">
                      In Safari (macOS Sonoma+), click <strong>File &gt; Add to Dock</strong>. In Chrome, click <strong>Menu &gt; Save and Share &gt; Install</strong>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5">
                    <span className="font-extrabold text-slate-800 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5" /> Linux / Ubuntu
                    </span>
                    <p className="text-[11px] text-slate-600">
                      In Chromium, click <strong>Menu &gt; Install City Medical</strong>. A launcher icon is added to your GNOME application menu.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Build Native Windows (.exe) with Electron */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 space-y-5 shadow-lg border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-black text-white">
                      Build Standalone Windows (.exe)
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Electron &amp; Tauri
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Want to distribute a traditional offline Windows setup file (e.g. <code className="text-emerald-300">CityMedical-Setup.exe</code>) on a USB flash drive to other pharmacies? You can wrap this exact codebase into Electron with 3 commands:
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Build Commands:
                    </span>
                    <button
                      onClick={() => copyText(electronCode, 'electron')}
                      className="text-xs font-bold text-teal-300 hover:text-teal-200 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'electron' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'electron' ? 'Copied' : 'Copy Commands'}</span>
                    </button>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800">
                    {electronCode}
                  </pre>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Zero Cloud Dependency Mode</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    The compiled <code className="text-emerald-300">.exe</code> contains its own internal Chromium runtime and Node engine. It runs on Windows 7, 10, and 11 without requiring internet access or any server configuration.
                  </p>
                </div>
              </div>

              {/* Hardware POS Terminal Bundle Box */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-teal-600" />
                  <span>Compatible Hardware POS Terminals</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>All Windows 10/11 all-in-one touch POS machines (Posiflex, TVS, Epson)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>58mm &amp; 80mm USB thermal receipt printers (TVS RP-3200, Pegasus, Rongta)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Standard USB 1D / 2D laser barcode scanners</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Electronic Cash Drawers with RJ11 printer trigger cable</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: MOBILE APP (ANDROID APK / PLAY STORE / IOS) */}
      {/* ========================================================================= */}
      {activeSection === 'mobile' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Live Smartphone QR Code + Install guide */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-teal-600" />
                      <span>Instant Phone Install via Camera QR</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Scan the QR code with any Android camera or iPhone to install directly
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    Zero Play Store Fees
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0">
                    <img
                      src={qrCodeUrl}
                      alt="City Medical App QR Code"
                      className="w-44 h-44 object-contain rounded-xl"
                    />
                  </div>

                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Point Smartphone Camera</span>
                    </div>
                    <h4 className="text-base font-black text-slate-900">
                      Instant Access on Mobile Phone
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Point your phone camera at this QR code. It opens City Medical with camera barcode scanner, loose strip calculator, and touch POS.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                      <button
                        onClick={() => copyText(currentOrigin, 'url')}
                        className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'url' ? 'URL Copied!' : 'Copy Mobile URL'}</span>
                      </button>
                      <a
                        href={currentOrigin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Launch in Browser</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Android & iOS Guided Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                        A
                      </span>
                      <span className="font-bold text-slate-900 text-xs">Android Devices</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tap Chrome&apos;s <strong>⋮ (three dots)</strong> at top right, then tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs font-black">
                        i
                      </span>
                      <span className="font-bold text-slate-900 text-xs">Apple iOS Devices</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tap Safari&apos;s <strong>Share (⎋)</strong> icon at bottom, scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Built-in Mobile Hardware Capabilities */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Native Mobile Features Included</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <WifiOff className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Offline-First Engine</h4>
                      <p className="text-[11px] text-slate-500">Service Worker caches drug catalog, pricing, and allows counter billing even when broadband drops.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <Barcode className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Phone Camera Barcode Scan</h4>
                      <p className="text-[11px] text-slate-500">Scan medicine strip EAN/UPC barcodes using your smartphone camera lens.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <Printer className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Bluetooth Thermal Receipts</h4>
                      <p className="text-[11px] text-slate-500">Supports standard 58mm &amp; 80mm wireless thermal POS bill printers directly from Android.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <Share2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">WhatsApp Instant e-Receipts</h4>
                      <p className="text-[11px] text-slate-500">Generates 1-click shareable invoices with short links (e.g. cityrx.link/inv-001).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Google Play Console & Bubblewrap CLI Package Builder */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Play Store Package Configuration Card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-teal-700" />
                    <span>Google Play Store Package Info</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    APK / AAB Ready
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Package ID:</span>
                    <span className="font-mono font-bold text-slate-900">in.citymedical.pharmacy</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Version Name:</span>
                    <span className="font-bold text-slate-900">2.4.0 (Build 240)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Asset Links Status:</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>/.well-known/assetlinks.json</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">PWA Manifest:</span>
                    <span className="font-bold text-teal-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>/manifest.webmanifest</span>
                    </span>
                  </div>
                </div>

                {/* Bubblewrap CLI instructions */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Google Bubblewrap CLI Export:
                    </span>
                    <button
                      onClick={() => copyText(bubblewrapCode, 'bubblewrap')}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'bubblewrap' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'bubblewrap' ? 'Copied' : 'Copy Commands'}</span>
                    </button>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto">
                    {bubblewrapCode}
                  </pre>
                </div>
              </div>

              {/* Play Store Listing Preview Card */}
              <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-3xl p-6 shadow-md space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Play Store Listing Preview
                  </h4>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <p>
                    <strong className="text-white">Short Description:</strong> Modern cloud pharmacy ERP, POS counter billing, barcode scanning, and clinic OPD prescription integration for City Medical.
                  </p>
                  <p>
                    <strong className="text-white">What&apos;s New in v2.4.0:</strong>
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                    <li>Universal medicine search with generic alternative recommendations</li>
                    <li>Branded short link generator for customer invoices</li>
                    <li>Full offline caching and Android home screen installability</li>
                    <li>Schedule H1 register tracking and GST tax filing exports</li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-teal-200">
                  <span>Developer: City Medical Inc.</span>
                  <span>Tamil Nadu, India</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: PUBLISH TO CUSTOM DOMAIN & CLOUD (YOUR CONTROL) */}
      {/* ========================================================================= */}
      {activeSection === 'publish' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
                <Globe className="w-3.5 h-3.5 text-teal-600" />
                <span>Hosting Under Your Own Control</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Deploy to Your Own Domain &amp; Cloud Infrastructure
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                You have 100% control over where and how this application runs. You can host it on your own custom domain (e.g. <code className="text-teal-700 font-mono">billing.yourpharmacy.in</code>), on your private Linux server, or deploy free on Vercel / Cloud Run.
              </p>
            </div>

            {/* How to Export Source Code */}
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 font-black text-amber-900 text-sm">
                <Package className="w-4 h-4 text-amber-700" />
                <span>How to Download the Complete Source Code (ZIP / GitHub)</span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed">
                In Google AI Studio, look at the top-right header menu. Click on <strong>Settings (⚙)</strong> and select either <strong>&quot;Export to GitHub&quot;</strong> or <strong>&quot;Download as ZIP&quot;</strong>.
                You receive the entire unminified project codebase containing all TypeScript, React, Tailwind CSS styling, Vite build scripts, and local database storage adapters.
              </p>
            </div>

            {/* 4 Hosting Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* Option 1: Custom Domain with Cloud Run */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-teal-700" />
                    <span>Google Cloud Run (Recommended)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                    Auto-SSL
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Directly click the <strong>&quot;Deploy to Cloud Run&quot;</strong> button in your AI Studio project settings. You can map any custom domain (e.g. <code className="text-slate-800 font-mono">rx.citymedical.in</code>) with free automatic SSL/TLS certificates and zero server maintenance.
                </p>
                <div className="text-[11px] text-slate-500 font-medium">
                  • Zero maintenance serverless container<br/>
                  • Scale to zero when not in use (near ₹0 monthly cost)
                </div>
              </div>

              {/* Option 2: Self-Hosted VPS (Ubuntu/Nginx) */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-700" />
                    <span>Self-Hosted Linux VPS (Full Control)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    Your Server
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Rent any ₹300–₹500/mo VPS (Hostinger, DigitalOcean, Linode). Run <code className="text-slate-800 font-mono">npm run build &amp;&amp; npm start</code> under PM2 or Docker behind Nginx reverse proxy.
                </p>
                <div className="text-[11px] text-slate-500 font-medium">
                  • 100% physical ownership of all data files<br/>
                  • Unlimited counters and branches connecting to 1 VPS
                </div>
              </div>

              {/* Option 3: Local Offline LAN Server (In-Shop Network) */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-700" />
                    <span>Local LAN Medical Shop Server</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    No Internet Needed
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Run the software on 1 main desktop computer inside the pharmacy. Other counter computers, doctor OPD tablets, and cashiers connect via local shop Wi-Fi (e.g. <code className="text-slate-800 font-mono">http://192.168.1.50:3000</code>) even when internet is completely cut.
                </p>
                <div className="text-[11px] text-slate-500 font-medium">
                  • Zero recurring broadband dependency<br/>
                  • Instant multi-terminal counter billing
                </div>
              </div>

              {/* Option 4: Free Vercel / Netlify Deployment */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>Vercel / Netlify (Free Hosting)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    100% Free
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Push your exported code to GitHub. Connect the repo to Vercel or Netlify. It automatically compiles your static app, provisions worldwide CDN caching, and assigns a free custom domain.
                </p>
                <div className="text-[11px] text-slate-500 font-medium">
                  • 1-click updates on git push<br/>
                  • Unlimited bandwidth on free tier
                </div>
              </div>

            </div>

            {/* Docker Deployment snippet */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Production Docker &amp; Cloud Deployment Commands:
                </span>
                <button
                  onClick={() => copyText(dockerDeployCode, 'docker')}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'docker' ? 'Copied' : 'Copy Commands'}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto">
                {dockerDeployCode}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: SELL SOFTWARE & WHITE-LABEL (100% YOUR CONTROL) */}
      {/* ========================================================================= */}
      {activeSection === 'sale-control' && (
        <div className="space-y-6">
          
          {/* Freedom & Ownership Guarantee */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Award className="w-3.5 h-3.5" />
                <span>Commercial Freedom &amp; Zero Royalty</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Sell, Rebrand &amp; Distribute Under Your Own Commercial Control
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                You own this software completely. There are <strong>no per-transaction fees</strong>, <strong>no mandatory subscriptions</strong>, and <strong>no third-party revenue sharing</strong>.
                You can rebrand this application for other pharmacies, sell it as a standalone software package, or offer it as a managed cloud service.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('software-controller')}
                  className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Launch Software Controller (Add Pharmacies, Codes & WhatsApp Dispatch)</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: White-Label Configurator (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-teal-700" />
                  <span>Client Pharmacy White-Label Customizer</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Configure this package for a client or another medical store you are selling the software to.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Client Pharmacy / Store Name:</label>
                  <input
                    type="text"
                    value={clientProfile.name}
                    onChange={e => setClientProfile({ ...clientProfile, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tagline / Subtitle:</label>
                  <input
                    type="text"
                    value={clientProfile.tagline}
                    onChange={e => setClientProfile({ ...clientProfile, tagline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Registered Pharmacist / Doctor:</label>
                  <input
                    type="text"
                    value={clientProfile.ownerName}
                    onChange={e => setClientProfile({ ...clientProfile, ownerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Drug License No (DL 20B/21B):</label>
                  <input
                    type="text"
                    value={clientProfile.drugLicenseNo}
                    onChange={e => setClientProfile({ ...clientProfile, drugLicenseNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">GSTIN / Tax Registration:</label>
                  <input
                    type="text"
                    value={clientProfile.gstin}
                    onChange={e => setClientProfile({ ...clientProfile, gstin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone / WhatsApp Number:</label>
                  <input
                    type="text"
                    value={clientProfile.phone}
                    onChange={e => setClientProfile({ ...clientProfile, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-teal-500"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700">Physical Store Address:</label>
                  <input
                    type="text"
                    value={clientProfile.address}
                    onChange={e => setClientProfile({ ...clientProfile, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-teal-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleDownloadClientConfig}
                  className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Client Config (JSON)</span>
                </button>

                <button
                  onClick={() => {
                    StorageService.savePharmacyProfile({
                      ...existingProfile,
                      name: clientProfile.name,
                      tagline: clientProfile.tagline,
                      gstin: clientProfile.gstin,
                      drugLicenseNo: clientProfile.drugLicenseNo,
                      mobile: clientProfile.phone,
                      addressLine1: clientProfile.address
                    });
                    alert(`Updated active store branding to "${clientProfile.name}"!`);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  <span>Apply Branding to this App Instance</span>
                </button>
              </div>

              {/* Commercial Pricing & Monetization Model */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Recommended Pricing Strategies When Selling</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-extrabold text-slate-900 block">Single Counter Store</span>
                    <div className="text-emerald-700 font-black text-sm">₹15,000 – ₹20,000</div>
                    <p className="text-[11px] text-slate-500">One-time perpetual software license + ₹3,000/yr AMC support.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-extrabold text-slate-900 block">Hardware Bundle Combo</span>
                    <div className="text-emerald-700 font-black text-sm">₹35,000 – ₹45,000</div>
                    <p className="text-[11px] text-slate-500">Software + 80mm USB Thermal Printer + Laser Barcode Gun scanner.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-extrabold text-slate-900 block">Monthly Cloud SaaS</span>
                    <div className="text-emerald-700 font-black text-sm">₹999 – ₹1,499 / mo</div>
                    <p className="text-[11px] text-slate-500">Hosted on your cloud with automatic daily backups and WhatsApp invoice link service.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Commercial License Certificate Generator (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-600" />
                    <span>Commercial License Generator</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Official Cert
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Client / Store Licensee Name:</label>
                    <input
                      type="text"
                      value={licenseConfig.clientName}
                      onChange={e => setLicenseConfig({ ...licenseConfig, clientName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 bg-slate-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">License Model:</label>
                    <select
                      value={licenseConfig.licenseType}
                      onChange={e => {
                        const val = e.target.value;
                        setLicenseConfig({
                          ...licenseConfig,
                          licenseType: val,
                          tier: val === 'PERPETUAL_LIFETIME'
                            ? 'Single-Store Counter Terminal (Perpetual)'
                            : 'Multi-Terminal Enterprise Cloud (1-Year AMC)',
                          expiryDate: val === 'PERPETUAL_LIFETIME' ? 'Lifetime (No Expiry)' : '31 March 2027'
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-slate-50"
                    >
                      <option value="PERPETUAL_LIFETIME">Perpetual Lifetime License (One-Time)</option>
                      <option value="ANNUAL_SUBSCRIPTION">Annual Subscription (1-Year AMC)</option>
                      <option value="MULTI_STORE">Multi-Branch Chain License (Enterprise)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700">Generated License Key:</label>
                      <button
                        onClick={handleGenerateNewKey}
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Regenerate Key</span>
                      </button>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 font-mono font-bold text-xs flex items-center justify-between">
                      <span className="tracking-wider truncate">{licenseConfig.licenseKey}</span>
                      <button
                        onClick={() => copyText(licenseConfig.licenseKey, 'lic-key')}
                        className="text-slate-400 hover:text-white ml-2 cursor-pointer"
                        title="Copy Key"
                      >
                        {copiedKey === 'lic-key' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Issued By (Your Company / Agency Name):</label>
                    <input
                      type="text"
                      value={licenseConfig.issuedBy}
                      onChange={e => setLicenseConfig({ ...licenseConfig, issuedBy: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 bg-slate-50"
                    />
                  </div>
                </div>

                {/* License Certificate Action */}
                <div className="pt-2">
                  <button
                    onClick={handlePrintLicenseCertificate}
                    className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Official License Certificate (PDF)</span>
                  </button>
                </div>
              </div>

              {/* Certificate Preview Card */}
              <div className="p-5 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                    Live Certificate Preview
                  </span>
                  <Award className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">Commercial Right to Use</div>
                  <div className="text-sm font-black text-slate-900">{licenseConfig.clientName}</div>
                  <div className="text-[11px] text-slate-600">
                    Tier: {licenseConfig.tier} • {licenseConfig.expiryDate}
                  </div>
                  <div className="p-1.5 bg-slate-900 text-emerald-400 font-mono text-[10px] font-bold rounded text-center">
                    {licenseConfig.licenseKey}
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Desktop Computer Download & Fix Modal */}
      <DesktopDownloadModal
        isOpen={showDesktopModal}
        onClose={() => setShowDesktopModal(false)}
        pharmacyName={existingProfile?.name || 'City Medical'}
      />

    </div>
  );
};
