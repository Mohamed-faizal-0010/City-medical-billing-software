import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  AlertCircle,
  Bluetooth,
  Usb,
  Cpu,
  Wifi,
  Monitor,
  Scissors,
  DollarSign,
  FileText,
  Play,
  Settings2,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Check,
  Clock
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { PrinterSettings, PharmacyProfile } from '../types';
import {
  DEFAULT_PRINTER_SETTINGS,
  printThermalTestSlipViaBrowser,
  connectWebBluetoothPrinter,
  connectWebSerialPrinter,
  connectWebUsbPrinter,
  isWebBluetoothSupported,
  isWebSerialSupported,
  isWebUsbSupported
} from '../utils/escPosUtils';
import { ScannerAudio } from '../utils/scannerAudio';

interface ConnectPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrinterConnected?: (settings: PrinterSettings) => void;
}

export const ConnectPrinterModal: React.FC<ConnectPrinterModalProps> = ({
  isOpen,
  onClose,
  onPrinterConnected
}) => {
  const [profile, setProfile] = useState<PharmacyProfile>(() => StorageService.getPharmacyProfile());
  const [settings, setSettings] = useState<PrinterSettings>(() => StorageService.getPrinterSettings());
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setProfile(StorageService.getPharmacyProfile());
      setSettings(StorageService.getPrinterSettings());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestPrint = () => {
    try {
      ScannerAudio.playSuccess();
    } catch {}
    setStatusMessage({ type: 'info', text: 'Printing thermal test slip... Check printer paper output.' });
    printThermalTestSlipViaBrowser(profile, settings);
  };

  const handleConnectHardware = async (type: 'web-bluetooth' | 'web-serial' | 'web-usb') => {
    setIsConnecting(true);
    setStatusMessage({ type: 'info', text: `Initiating ${type.replace('web-', '').toUpperCase()} connection...` });

    try {
      if (type === 'web-bluetooth') {
        const res = await connectWebBluetoothPrinter();
        if (res.success) {
          const updated: PrinterSettings = {
            ...settings,
            connectionType: 'web-bluetooth',
            deviceName: res.deviceName || 'Bluetooth Thermal POS',
            status: 'connected',
            lastConnectedAt: new Date().toISOString()
          };
          setSettings(updated);
          StorageService.savePrinterSettings(updated);
          setStatusMessage({ type: 'success', text: `Connected to ${updated.deviceName} via Bluetooth!` });
          try { ScannerAudio.playSuccess(); } catch {}
          if (onPrinterConnected) onPrinterConnected(updated);
        } else {
          setStatusMessage({ type: 'error', text: res.error || 'Failed to connect Bluetooth printer.' });
          try { ScannerAudio.playError(); } catch {}
        }
      } else if (type === 'web-serial') {
        const res = await connectWebSerialPrinter();
        if (res.success) {
          const updated: PrinterSettings = {
            ...settings,
            connectionType: 'web-serial',
            deviceName: res.deviceName || 'Serial Thermal Printer',
            status: 'connected',
            lastConnectedAt: new Date().toISOString()
          };
          setSettings(updated);
          StorageService.savePrinterSettings(updated);
          setStatusMessage({ type: 'success', text: `Connected to ${updated.deviceName} via Serial/COM port!` });
          try { ScannerAudio.playSuccess(); } catch {}
          if (onPrinterConnected) onPrinterConnected(updated);
        } else {
          setStatusMessage({ type: 'error', text: res.error || 'Failed to connect Serial printer.' });
          try { ScannerAudio.playError(); } catch {}
        }
      } else if (type === 'web-usb') {
        const res = await connectWebUsbPrinter();
        if (res.success) {
          const updated: PrinterSettings = {
            ...settings,
            connectionType: 'web-usb',
            deviceName: res.deviceName || 'USB POS Thermal Printer',
            status: 'connected',
            lastConnectedAt: new Date().toISOString()
          };
          setSettings(updated);
          StorageService.savePrinterSettings(updated);
          setStatusMessage({ type: 'success', text: `Connected to ${updated.deviceName} via USB!` });
          try { ScannerAudio.playSuccess(); } catch {}
          if (onPrinterConnected) onPrinterConnected(updated);
        } else {
          setStatusMessage({ type: 'error', text: res.error || 'Failed to connect USB printer.' });
          try { ScannerAudio.playError(); } catch {}
        }
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.savePrinterSettings(settings);
    setStatusMessage({ type: 'success', text: 'Printer configuration saved as default for retail POS!' });
    if (onPrinterConnected) onPrinterConnected(settings);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Connect Thermal Printer & Hardware Setup</h3>
              <p className="text-xs text-slate-500">
                Configure 80mm/58mm thermal rolls, Bluetooth, USB, cash drawer & test printing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSaveSettings} className="p-6 space-y-5 overflow-y-auto">
          {statusMessage && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold animate-fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 border border-rose-200 text-rose-900'
                : 'bg-teal-50 border border-teal-200 text-teal-900'
            }`}>
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-teal-600 shrink-0 animate-spin" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Connection Mode Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Printer Connection Interface
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Browser / System Driver */}
              <button
                type="button"
                onClick={() => setSettings({ ...settings, connectionType: 'browser', status: 'ready' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.connectionType === 'browser'
                    ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <Monitor className={`w-5 h-5 mb-1.5 ${settings.connectionType === 'browser' ? 'text-teal-700' : 'text-slate-500'}`} />
                <div className="font-bold text-xs text-slate-900">System Spooler</div>
                <div className="text-[10px] text-slate-500">Windows/Mac/Android driver</div>
              </button>

              {/* Web Bluetooth */}
              <button
                type="button"
                onClick={() => {
                  setSettings({ ...settings, connectionType: 'web-bluetooth' });
                  handleConnectHardware('web-bluetooth');
                }}
                disabled={isConnecting}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.connectionType === 'web-bluetooth'
                    ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <Bluetooth className={`w-5 h-5 mb-1.5 ${settings.connectionType === 'web-bluetooth' ? 'text-teal-700' : 'text-slate-500'}`} />
                <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                  <span>Bluetooth</span>
                  {isWebBluetoothSupported() && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Supported" />
                  )}
                </div>
                <div className="text-[10px] text-slate-500">Portable receipt roll</div>
              </button>

              {/* Web USB */}
              <button
                type="button"
                onClick={() => {
                  setSettings({ ...settings, connectionType: 'web-usb' });
                  handleConnectHardware('web-usb');
                }}
                disabled={isConnecting}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.connectionType === 'web-usb'
                    ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <Usb className={`w-5 h-5 mb-1.5 ${settings.connectionType === 'web-usb' ? 'text-teal-700' : 'text-slate-500'}`} />
                <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                  <span>Direct USB</span>
                  {isWebUsbSupported() && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Supported" />
                  )}
                </div>
                <div className="text-[10px] text-slate-500">Epson / TVS / Xprinter</div>
              </button>

              {/* Web Serial / COM Port */}
              <button
                type="button"
                onClick={() => {
                  setSettings({ ...settings, connectionType: 'web-serial' });
                  handleConnectHardware('web-serial');
                }}
                disabled={isConnecting}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.connectionType === 'web-serial'
                    ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <Cpu className={`w-5 h-5 mb-1.5 ${settings.connectionType === 'web-serial' ? 'text-teal-700' : 'text-slate-500'}`} />
                <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                  <span>Serial COM</span>
                  {isWebSerialSupported() && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Supported" />
                  )}
                </div>
                <div className="text-[10px] text-slate-500">RS-232 / UART Port</div>
              </button>
            </div>
          </div>

          {/* Paper Format & Width Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Default Paper Format & Roll Size
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, paperWidth: '80mm', printerType: 'thermal' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.paperWidth === '80mm' && settings.printerType === 'thermal'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-black text-xs text-slate-900">80mm (3 Inch)</div>
                <div className="text-[10px] text-emerald-800 font-semibold">Standard Thermal POS</div>
                <div className="text-[9px] text-slate-500 mt-1">48 chars • Retail standard</div>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, paperWidth: '58mm', printerType: 'thermal58' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.paperWidth === '58mm' || settings.printerType === 'thermal58'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-black text-xs text-slate-900">58mm (2 Inch)</div>
                <div className="text-[10px] text-emerald-800 font-semibold">Mini Thermal Roll</div>
                <div className="text-[9px] text-slate-500 mt-1">32 chars • Handheld/Mobile</div>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, paperWidth: 'A4', printerType: 'a4' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.paperWidth === 'A4' || settings.printerType === 'a4'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-black text-xs text-slate-900">A4 Full Sheet</div>
                <div className="text-[10px] text-slate-600 font-semibold">Tax Invoice Sheet</div>
                <div className="text-[9px] text-slate-500 mt-1">Laser / Inkjet desktop</div>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, paperWidth: 'A5', printerType: 'a5' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.paperWidth === 'A5' || settings.printerType === 'a5'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-black text-xs text-slate-900">A5 Half Sheet</div>
                <div className="text-[10px] text-slate-600 font-semibold">Clinic & Rx Slip</div>
                <div className="text-[9px] text-slate-500 mt-1">Doctor prescription size</div>
              </button>
            </div>
          </div>

          {/* Hardware Feature Toggles */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Hardware Automation & Slip Elements
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.autoPrintOnComplete !== false}
                  onChange={e => setSettings({ ...settings, autoPrintOnComplete: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-teal-600" />
                  <span>Auto-Print Thermal Bill on Checkout Complete</span>
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.autoCut}
                  onChange={e => setSettings({ ...settings, autoCut: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-slate-500" />
                  <span>Auto Paper Cutter Pulse (ESC/POS)</span>
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.openCashDrawer}
                  onChange={e => setSettings({ ...settings, openCashDrawer: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                  <span>Kick Cash Drawer upon Checkout</span>
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.printQrCode}
                  onChange={e => setSettings({ ...settings, printQrCode: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print Dynamic UPI QR Code on Bill</span>
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.printPharmacistSign}
                  onChange={e => setSettings({ ...settings, printPharmacistSign: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print Pharmacist Name & Reg. No.</span>
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
              <span className="font-medium text-slate-600">Default Print Copies:</span>
              <div className="flex items-center gap-1 bg-white p-1 border border-slate-200 rounded-lg">
                {[1, 2, 3].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSettings({ ...settings, printCopies: num, printDualCopy: num === 2 })}
                    className={`px-2.5 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                      settings.printCopies === num ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bill Print Time & Spooler Timing Settings */}
          <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Bill Print Time Setting</span>
              </span>
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-teal-900">
                <input
                  type="checkbox"
                  checked={settings.showPrintTime !== false}
                  onChange={e => setSettings({ ...settings, showPrintTime: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                />
                <span>Print Time on Bill</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {/* Time Source */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Bill Timestamp Mode
                </label>
                <select
                  value={settings.billTimeSource || 'invoice_time'}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      billTimeSource: e.target.value as 'invoice_time' | 'current_print_time' | 'custom_time'
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  <option value="invoice_time">Sale Invoice Time</option>
                  <option value="current_print_time">Live Clock Time at Print</option>
                  <option value="custom_time">Custom Date &amp; Time</option>
                </select>
              </div>

              {/* 12h vs 24h Format */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Clock Format
                </label>
                <div className="grid grid-cols-2 gap-1 bg-white p-1 border border-slate-300 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, timeFormat: '12h' })}
                    className={`py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      (settings.timeFormat || '12h') === '12h'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    12h (AM/PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, timeFormat: '24h' })}
                    className={`py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      settings.timeFormat === '24h'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    24-Hour
                  </button>
                </div>
              </div>

              {/* Spooler Delay */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Print Spooler Speed
                </label>
                <select
                  value={settings.printDelayMs ?? 60}
                  onChange={e => setSettings({ ...settings, printDelayMs: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  <option value={40}>Instant (40ms)</option>
                  <option value={60}>Fast Default (60ms)</option>
                  <option value={150}>Standard (150ms)</option>
                  <option value={300}>Safe Buffer (300ms)</option>
                  <option value={600}>Slow Thermal (600ms)</option>
                </select>
              </div>
            </div>

            {settings.billTimeSource === 'custom_time' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Custom Bill Date
                  </label>
                  <input
                    type="date"
                    value={settings.customBillDate || new Date().toISOString().split('T')[0]}
                    onChange={e => setSettings({ ...settings, customBillDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-xl font-mono font-bold text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Custom Bill Time
                  </label>
                  <input
                    type="time"
                    value={settings.customBillTime || new Date().toTimeString().slice(0, 5)}
                    onChange={e => setSettings({ ...settings, customBillTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-xl font-mono font-bold text-xs text-slate-900"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(settings.showSeconds)}
                  onChange={e => setSettings({ ...settings, showSeconds: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Include Seconds (HH:MM:SS) on Bill</span>
              </label>
              <span className="font-mono text-[10px] text-teal-800 font-semibold">
                Applies to 3&quot; Thermal, 2&quot; Thermal, A4 &amp; A5
              </span>
            </div>
          </div>

          {/* Device Name display */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Active Printer Identity
            </label>
            <input
              type="text"
              value={settings.deviceName || 'Standard Thermal POS (80mm/58mm)'}
              onChange={e => setSettings({ ...settings, deviceName: e.target.value })}
              placeholder="e.g. TVS RP 3200 Star / Epson TM-T88VI"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 font-mono text-xs rounded-xl focus:bg-white text-slate-800"
            />
          </div>

          {/* Test Print Banner */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-amber-600" />
                <span>Test Printer Alignment & Output</span>
              </div>
              <div className="text-[11px] text-amber-800 mt-0.5">
                Verifies margin, font clarity, Tamil Nadu GSTIN header, items table, and cutter.
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestPrint}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shrink-0 cursor-pointer shadow-2xs transition-colors flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Run Test Print</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setSettings(DEFAULT_PRINTER_SETTINGS);
                StorageService.savePrinterSettings(DEFAULT_PRINTER_SETTINGS);
                setStatusMessage({ type: 'info', text: 'Reset to standard 80mm thermal receipt roll settings.' });
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              Reset to Defaults
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save & Set Default Printer</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
