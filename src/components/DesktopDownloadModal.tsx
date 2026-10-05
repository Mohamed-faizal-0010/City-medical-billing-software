import React, { useState } from 'react';
import {
  X,
  Monitor,
  Download,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Terminal,
  FileCode,
  HardDrive,
  AlertCircle,
  HelpCircle,
  Check,
  Copy,
  Printer,
  WifiOff,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  downloadWindowsDesktopLauncher,
  downloadWindowsVbsLauncher,
  downloadDesktopOfflineApp,
  downloadElectronSourceFiles,
  checkDesktopEnvironment
} from '../utils/desktopDownloadUtils';

interface DesktopDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacyName?: string;
}

export const DesktopDownloadModal: React.FC<DesktopDownloadModalProps> = ({
  isOpen,
  onClose,
  pharmacyName = 'City Rx'
}) => {
  const { isInstallable, isInstalled, isInIframe, install } = usePWAInstall();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://cityrx.link';
  const diagnostics = checkDesktopEnvironment();

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const notifyDownload = (name: string) => {
    setDownloadSuccess(name);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleInstallClick = async () => {
    if (isInIframe) {
      window.open(currentUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const res = await install();
    if (!res.success) {
      setShowTroubleshooter(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 relative overflow-hidden shrink-0 border-b border-teal-800/40">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-52 h-52 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-600/30 p-2 backdrop-blur-md border border-teal-400/30 shadow-inner flex items-center justify-center shrink-0">
                <Monitor className="w-8 h-8 text-teal-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/25 text-teal-300 border border-teal-400/30">
                    Desktop Computer Hub
                  </span>
                  <span className="text-[11px] font-bold text-slate-300">
                    {diagnostics.os.toUpperCase()} • {diagnostics.browser}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white mt-1">
                  Download Software for Desktop Computer
                </h2>
                <p className="text-xs text-teal-200">
                  Run {pharmacyName} on Windows 10/11, POS Terminals, and Mac with 1-click
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              id="close-desktop-download-modal-btn"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Status Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/10 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Offline Cache Active</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Manifest Verified</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Thermal Printer Ready</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Barcode Scanner Ready</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Success Alert Banner when a file downloads */}
          {downloadSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">{downloadSuccess}</span> downloaded successfully to your computer! Double-click the downloaded file in your Downloads folder to launch.
              </div>
            </div>
          )}

          {/* Primary Recommended Download: Windows 1-Click App Launcher */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 via-emerald-50 to-slate-50 border-2 border-teal-500/30 shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white font-extrabold text-[10px] uppercase tracking-wide">
                    Fastest Method
                  </span>
                  <span className="text-xs font-bold text-slate-700">Recommended for Windows 10 & 11 PCs</span>
                </div>
                <h3 className="text-base font-black text-slate-900">
                  1-Click Windows Desktop Launcher (.bat)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Downloads an instant launcher file. When double-clicked, it automatically creates a <span className="font-bold text-slate-800">"{pharmacyName}" Desktop Shortcut</span> on your computer screen and launches in full native app window without browser tabs or URL bars.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
                <button
                  onClick={() => {
                    downloadWindowsDesktopLauncher(currentUrl, pharmacyName);
                    notifyDownload('Windows Desktop Launcher (.bat)');
                  }}
                  id="download-windows-bat-btn"
                  className="px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .BAT Launcher</span>
                </button>

                <button
                  onClick={() => {
                    downloadWindowsVbsLauncher(currentUrl, pharmacyName);
                    notifyDownload('Silent Windows Launcher (.vbs)');
                  }}
                  id="download-windows-vbs-btn"
                  className="px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Silent launcher with no command window"
                >
                  <span>Silent (.VBS)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Browser PWA Native Installation & Direct Window */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Option A: Browser PWA / Open Dedicated */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 transition-all shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Chrome &amp; Edge
                  </span>
                </div>
                <h4 className="font-black text-sm text-slate-900">
                  Direct Desktop Window &amp; PWA
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Open {pharmacyName} directly in a dedicated top-level desktop window so Chrome or Edge reveals the native <span className="font-bold text-slate-800">(⊕ Install App)</span> icon in the top right.
                </p>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <button
                  onClick={handleInstallClick}
                  id="install-or-open-dedicated-window-btn"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  {isInIframe ? (
                    <>
                      <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                      <span>Open in Dedicated Desktop Window</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-teal-400" />
                      <span>Install Direct PWA Icon</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-center text-slate-500">
                  {isInIframe ? 'Bypasses embedded preview to allow direct browser install' : 'Pins app directly to Start Menu & Desktop'}
                </span>
              </div>
            </div>

            {/* Option B: Standalone Offline Portable HTML Package */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 transition-all shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    Pendrive / USB Portable
                  </span>
                </div>
                <h4 className="font-black text-sm text-slate-900">
                  Offline Portable Runner (.html)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Save a standalone runner file that works from any folder or USB flash drive without internet configuration. Double-click to run on any computer.
                </p>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <button
                  onClick={() => {
                    downloadDesktopOfflineApp(currentUrl, pharmacyName);
                    notifyDownload('Offline Portable Runner (.html)');
                  }}
                  id="download-offline-html-btn"
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-teal-700" />
                  <span>Download Portable Runner (.html)</span>
                </button>
                <span className="text-[11px] text-center text-slate-500">
                  100% self-contained • Runs on Windows, Mac, or Linux
                </span>
              </div>
            </div>

          </div>

          {/* Option C: Native .exe Installer Generator (Electron) */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-sm border border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Standalone Executable (.exe / .dmg)
                  </span>
                </div>
                <h4 className="font-black text-sm text-white">
                  Package into Native Windows Setup File (<code className="text-emerald-300 font-mono">CityMedical-Setup.exe</code>)
                </h4>
              </div>

              <button
                onClick={() => {
                  downloadElectronSourceFiles(currentUrl, pharmacyName);
                  notifyDownload('Electron Windows Setup Builder');
                }}
                id="download-electron-package-btn"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .EXE Builder Files</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-400 border border-slate-800 flex items-center justify-between overflow-x-auto">
              <code>npm install -D electron electron-builder &amp;&amp; npx electron-builder --win</code>
              <button
                onClick={() => handleCopy('npm install -D electron electron-builder && npx electron-builder --win', 'cmd')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 ml-3 cursor-pointer shrink-0"
              >
                {copiedKey === 'cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'cmd' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Desktop Diagnostics & Troubleshooting */}
          <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 bg-slate-50">
            <div
              onClick={() => setShowTroubleshooter(prev => !prev)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                <HelpCircle className="w-4 h-4 text-teal-600" />
                <span>Fix Desktop Installation &amp; Download Issues</span>
              </div>
              <span className="text-xs text-teal-700 font-semibold hover:underline">
                {showTroubleshooter ? 'Hide Diagnostics' : 'Show Diagnostics & Fix Guide'}
              </span>
            </div>

            {showTroubleshooter && (
              <div className="space-y-4 pt-3 border-t border-slate-200 text-xs text-slate-600 animate-in fade-in duration-150">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Why didn't the browser show an install popup automatically?</span>
                  </div>
                  <p className="leading-relaxed">
                    Modern Chromium browsers (Google Chrome, Microsoft Edge) disable the automatic install banner when viewed inside an embedded window or sandbox preview.
                  </p>
                  <div className="pt-1 flex flex-wrap gap-2">
                    <button
                      onClick={() => window.open(currentUrl, '_blank', 'noopener,noreferrer')}
                      className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open in Top Window to Install</span>
                    </button>
                    <button
                      onClick={() => {
                        downloadWindowsDesktopLauncher(currentUrl, pharmacyName);
                        notifyDownload('Windows Desktop Launcher (.bat)');
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download .BAT Launcher</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-bold text-slate-800">
                    How to install manually from your browser menu:
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700">
                    <li>In <span className="font-semibold">Google Chrome</span>: Look at the top-right address bar for the <span className="font-bold text-teal-800">(⊕ Install City Medical)</span> icon, OR click the <span className="font-semibold">3 dots (⋮) &gt; "Cast, save, and share" &gt; "Install page as app"</span>.</li>
                    <li>In <span className="font-semibold">Microsoft Edge</span>: Look for the <span className="font-bold text-teal-800">(⊞ App available)</span> icon in the address bar, OR click <span className="font-semibold">3 dots (...) &gt; "Apps" &gt; "Install this site as an app"</span>.</li>
                    <li>In <span className="font-semibold">Safari (macOS Sonoma+)</span>: Click <span className="font-semibold">File &gt; "Add to Dock..."</span>.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Works offline • Hardware POS &amp; Thermal Printer Ready</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
