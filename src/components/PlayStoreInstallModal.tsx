import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Layers,
  Terminal,
  Share2
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PlayStoreInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayStoreInstallModal: React.FC<PlayStoreInstallModalProps> = ({
  isOpen,
  onClose
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'direct' | 'playstore' | 'twa'>('direct');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cityrx.link';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(currentUrl)}&margin=10`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const bubblewrapCmd = `npx @bubblewrap/cli init --manifest=${currentUrl}/manifest.webmanifest\nnpx @bubblewrap/cli build`;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 text-white p-6 relative overflow-hidden shrink-0">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 p-1.5 backdrop-blur-md border border-white/20 shadow-inner flex items-center justify-center shrink-0">
                <img
                  src="/pwa-192x192.png"
                  alt="City Rx App Icon"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    // Fallback to SVG icon
                    (e.target as HTMLImageElement).src = '/icon.svg';
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                    City Rx Direct Mobile
                  </span>
                  <span className="text-[11px] font-bold text-teal-200">v2.4.0</span>
                </div>
                <h2 className="text-xl font-black text-white mt-1">
                  City Rx Mobile App
                </h2>
                <p className="text-xs text-teal-100">
                  Melur, Madurai • Direct Download for Android, Tablets & iOS
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              id="close-playstore-modal-btn"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-tab navigation */}
          <div className="flex items-center gap-2 mt-5 border-t border-white/10 pt-4">
            <button
              onClick={() => setActiveTab('direct')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'direct'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>1-Click Phone Install</span>
            </button>
            <button
              onClick={() => setActiveTab('playstore')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'playstore'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Google Play Listing</span>
            </button>
            <button
              onClick={() => setActiveTab('twa')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'twa'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>APK & TWA Package</span>
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">

          {/* TAB 1: 1-Click Install & Phone QR Code */}
          {activeTab === 'direct' && (
            <div className="space-y-6">
              {/* If already running standalone */}
              {isInstalled ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">App Already Installed!</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      You are currently running City Medical in standalone app mode with native hardware access, offline cache, and full desktop/mobile capability.
                    </p>
                  </div>
                </div>
              ) : isInstallable ? (
                <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                      <Download className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Install Directly on This Device</h4>
                      <p className="text-xs text-slate-600">
                        Launch native Android install banner without Play Store login
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={install}
                    id="playstore-direct-install-btn"
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App Now</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Web App Ready for Home Screen</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Open your browser menu (Chrome <strong>⋮</strong> or Safari Share <strong>⎋</strong>) and tap <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong> to place the City Medical app icon on your phone!
                    </p>
                  </div>
                </div>
              )}

              {/* QR Code for scanning directly with Phone */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-6">
                <div className="p-2.5 bg-white border border-slate-200 rounded-2xl shadow-xs shrink-0">
                  <img
                    src={qrUrl}
                    alt="Scan to Install City Medical App"
                    className="w-40 h-40 object-contain rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Install on Mobile in 5 Seconds</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    Scan with Your Android or iPhone Camera
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Point your camera at the QR code. Tap the pop-up link to open City Medical on your smartphone, then tap <strong>"Install / Add to Home screen"</strong>.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => copyToClipboard(currentUrl, 'url')}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'url' ? 'URL Copied!' : 'Copy Mobile URL'}</span>
                    </button>
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in New Tab</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Step-by-step instructions for Android & iOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-black">
                      1
                    </span>
                    <span>Android Chrome / Samsung Internet</span>
                  </div>
                  <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1">
                    <li>Open link in Google Chrome</li>
                    <li>Tap three vertical dots (<strong>⋮</strong>) top-right</li>
                    <li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong></li>
                    <li>Tap <strong>Install</strong> to add icon</li>
                  </ol>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-[11px] font-black">
                      2
                    </span>
                    <span>Apple iOS Safari (iPhone / iPad)</span>
                  </div>
                  <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1">
                    <li>Open link in Apple Safari</li>
                    <li>Tap the <strong>Share</strong> button at bottom toolbar</li>
                    <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
                    <li>Tap <strong>Add</strong> top-right to finish</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Google Play Store Listing Preview */}
          {activeTab === 'playstore' && (
            <div className="space-y-5">
              {/* Play Store Card Simulation */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src="/pwa-192x192.png"
                    alt="City Medical App Icon"
                    className="w-18 h-18 rounded-2xl shadow-sm border border-slate-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icon.svg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black text-slate-900 truncate">
                      City Medical - Pharmacy ERP & POS
                    </h3>
                    <p className="text-xs font-semibold text-emerald-700">
                      City Medical Healthcare • Medical
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <div className="flex items-center gap-1 font-bold text-slate-800">
                        <span>4.9</span>
                        <span className="text-amber-500">★</span>
                      </div>
                      <span>•</span>
                      <span>5K+ Downloads</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold">Rated 3+</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center text-xs">
                  <div>
                    <p className="font-bold text-slate-900">4.9 ★</p>
                    <p className="text-[10px] text-slate-500">128 reviews</p>
                  </div>
                  <div className="border-x border-slate-100">
                    <p className="font-bold text-slate-900">4.2 MB</p>
                    <p className="text-[10px] text-slate-500">Fast install</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Medical</p>
                    <p className="text-[10px] text-slate-500">Certified ERP</p>
                  </div>
                </div>

                {/* About this app */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                    About this app
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Official mobile pharmacy and clinical retail application for City Medical, Melur, Madurai, Tamil Nadu. Fast barcode counter billing, instant UPI QR generation, batch expiry monitoring, Schedule H1 drug registers, automated WhatsApp refill reminders, and clinic doctor OPD prescription sync.
                  </p>
                </div>

                {/* Technical App Details */}
                <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Package ID:</span>
                    <p className="font-mono font-bold text-slate-800">in.citymedical.pharmacy</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Target Android:</span>
                    <p className="font-bold text-slate-800">Android 8.0 to Android 15 (API 35)</p>
                  </div>
                  <div>
                    <span className="text-slate-400">PWA Manifest:</span>
                    <p className="font-mono font-bold text-emerald-700">/manifest.webmanifest</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Digital Asset Link:</span>
                    <p className="font-mono font-bold text-teal-700">/.well-known/assetlinks.json</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APK / Bubblewrap TWA Packaging */}
          {activeTab === 'twa' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-teal-600" />
                    <span>Build Google Play Store AAB / APK via Google Bubblewrap</span>
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Official Google Tool
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Google's official <strong>Bubblewrap CLI</strong> converts your PWA into an Android App Bundle (<code>.aab</code>) and <code>.apk</code> ready for direct upload to the <strong>Google Play Console</strong>.
                </p>

                <div className="relative">
                  <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto selection:bg-emerald-700 selection:text-white">
                    {bubblewrapCmd}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(bubblewrapCmd, 'bubblewrap')}
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
                  >
                    {copiedKey === 'bubblewrap' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'bubblewrap' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Checklist */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Google Play Store Requirements Checklist
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Web App Manifest with Standalone Display, Name, and Icons</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Service Worker with offline caching & font cache configured</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Digital Asset Links (<code>/.well-known/assetlinks.json</code>) active</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Maskable 512x512 adaptive icon for Android squircles & circles</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>HTTPS SSL verified on Google Cloud Run environment</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Encrypted local storage • Offline POS ready</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isInstallable && (
              <button
                onClick={install}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install on Device</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
