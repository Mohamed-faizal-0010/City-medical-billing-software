import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  X,
  Download,
  QrCode,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  WifiOff,
  Sparkles,
  Monitor
} from 'lucide-react';
import { PharmacyLogo } from './PharmacyLogo';
import { QRCode } from './QRCode';
import { StorageService } from '../services/storage';
import { downloadWindowsDesktopLauncher } from '../utils/desktopDownloadUtils';

interface MobileAppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileAppDownloadModal: React.FC<MobileAppDownloadModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (!isOpen) return null;

  const currentUrl = window.location.href;
  const profile = StorageService.getPharmacyProfile();

  const handleInstallClick = async () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      const choiceResult = await installPromptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalledSuccessfully(true);
      }
      setInstallPromptEvent(null);
    } else {
      // Guide user to use browser install options
      alert(
        'To install City Rx on your device:\n\n• On Android / Chrome: Tap ⋮ menu and select "Install app" or "Add to Home screen"\n• On iPhone / iPad Safari: Tap Share button and select "Add to Home Screen"'
      );
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 lg:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 lg:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <PharmacyLogo size="md" />
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>Direct Download City Rx (Computer / Mobile)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  PWA Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Install City Rx on Windows PC, Mac, Android, and iPhone with Offline Support
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 lg:p-6 overflow-y-auto space-y-6">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-teal-700 to-emerald-700 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
                Direct Mobile App
              </span>
              <h3 className="text-xl font-extrabold tracking-tight">
                City Rx Pharmacy in your Pocket
              </h3>
              <p className="text-xs text-teal-100 max-w-md">
                Ultra-fast point-of-sale billing, barcode scanning with phone camera, inventory lookups, and customer WhatsApp receipts.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-4 py-3 bg-white text-teal-900 hover:bg-teal-50 font-black text-xs rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span>{installPromptEvent ? 'Install Mobile App' : 'Add to Mobile Home'}</span>
              </button>
              <button
                onClick={() => downloadWindowsDesktopLauncher(currentUrl, 'City Rx')}
                className="px-4 py-3 bg-emerald-950/80 hover:bg-emerald-900 text-white font-black text-xs rounded-xl border border-white/20 shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
                title="Download 1-Click Windows PC Launcher (.bat)"
              >
                <Monitor className="w-4 h-4 text-emerald-300" />
                <span>Download for PC / Mac</span>
              </button>
            </div>
          </div>

          {/* QR Code + Direct Link Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-xs text-center">
              <div className="w-36 h-36 flex items-center justify-center bg-white p-2">
                <QRCode value={currentUrl} size={130} />
              </div>
              <p className="text-[11px] font-bold text-slate-800 mt-2">
                Scan with Phone Camera
              </p>
              <p className="text-[10px] text-slate-500">
                Instantly opens City Rx on your phone
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Direct Web App Link
                </span>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 truncate select-all">
                  {currentUrl}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Mobile Link'}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-600 space-y-1 pt-1">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Works offline without active internet</span>
                </div>
                <div className="flex items-center gap-1.5 text-teal-700 font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Instant startup • zero app store delay</span>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Installation Guide */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Quick 2-Step Installation Guide
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Android */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Android (Google Chrome)</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    Recommended
                  </span>
                </div>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
                  <li>Scan QR or open link in Chrome.</li>
                  <li>Tap the <strong>three dots (⋮)</strong> at top right.</li>
                  <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>City Rx icon appears directly on your phone home screen!</li>
                </ol>
              </div>

              {/* iPhone / iPad */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>iPhone / iPad (Safari)</span>
                  </span>
                  <span className="text-[10px] font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">
                    iOS 14+
                  </span>
                </div>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
                  <li>Open link in Apple <strong>Safari</strong> browser.</li>
                  <li>Tap the <strong>Share</strong> button at bottom (square with arrow).</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                  <li>Tap <strong>Add</strong> at top right to launch full screen.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
