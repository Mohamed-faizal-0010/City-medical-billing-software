import React, { useState } from 'react';
import {
  Scan,
  Barcode,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Play,
  Zap,
  Tag,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Medicine } from '../types';
import { ScannerAudio } from '../utils/scannerAudio';

interface BarcodeScannerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: Medicine[];
  onSimulateScan: (barcode: string) => void;
  lastScannedBarcode: string | null;
  scanCount: number;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
}

export const BarcodeScannerGuideModal: React.FC<BarcodeScannerGuideModalProps> = ({
  isOpen,
  onClose,
  medicines,
  onSimulateScan,
  lastScannedBarcode,
  scanCount,
  soundEnabled,
  onToggleSound
}) => {
  const [testInput, setTestInput] = useState('');

  if (!isOpen) return null;

  const handleTestScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (testInput.trim()) {
      onSimulateScan(testInput.trim());
      setTestInput('');
    }
  };

  // Extract a few representative medicines with batches for quick testing
  const sampleMedicines = medicines.slice(0, 6).map(m => ({
    name: m.name,
    strength: m.strength,
    rack: m.rackLocation || m.batches[0]?.location || 'Rack A-01',
    batchNumber: m.batches[0]?.batchNumber || 'BATCH-01',
    barcode: m.barcode || m.batches[0]?.barcode || m.id,
    stock: m.batches.reduce((sum, b) => sum + b.stock, 0),
    mrp: m.batches[0]?.sellingPrice || 0
  }));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-xs">
              <Scan className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white tracking-tight">
                  POS Barcode Scanner Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Listener Active</span>
                </span>
              </div>
              <p className="text-xs text-teal-100 font-medium">
                USB, Bluetooth & Wireless HID Keyboard Wedge Auto-detection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-700">
          {/* Status & Audio Control Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Listener Status
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span className="font-extrabold text-sm text-slate-900">
                  Ready & Listening
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">
                Scan anywhere on screen
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Session Scans
              </span>
              <div className="mt-1 flex items-center gap-2">
                <Barcode className="w-4 h-4 text-teal-600" />
                <span className="font-extrabold text-sm text-slate-900 font-mono">
                  {scanCount} items scanned
                </span>
              </div>
              <span className="text-[10px] text-slate-500 truncate mt-1">
                Last: {lastScannedBarcode || 'None yet'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Audio Beeper
              </span>
              <div className="mt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const next = !soundEnabled;
                    onToggleSound(next);
                    ScannerAudio.setSoundEnabled(next);
                    if (next) ScannerAudio.playSuccessBeep();
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    soundEnabled
                      ? 'bg-teal-100 text-teal-800 border border-teal-300'
                      : 'bg-slate-200 text-slate-600 border border-slate-300'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-teal-700" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{soundEnabled ? 'Beep On' : 'Muted'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => ScannerAudio.playSuccessBeep()}
                  className="text-[10px] font-bold text-teal-700 hover:underline cursor-pointer"
                  title="Test Beep Sound"
                >
                  Test Tone
                </button>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">
                Realistic retail POS chirp
              </span>
            </div>
          </div>

          {/* How Hardware Scanners Work */}
          <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-teal-900 font-extrabold text-sm">
              <Zap className="w-4 h-4 text-teal-700" />
              <span>Plug & Play Hardware Barcode Scanning</span>
            </div>
            <p className="text-teal-900/90 leading-relaxed">
              City Rx ERP automatically captures inputs from any handheld 1D or 2D barcode scanner (Honeywell, Zebra, TVS, Datalogic, Eyoyo, Netum, etc.). Hardware scanners emulate keyboard wedge entry at ultra-fast speeds (&lt; 35ms per character).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-teal-950 font-medium">
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span><strong>No focus needed:</strong> Scan medicines directly even while viewing the cart or patient details.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span><strong>Smart duplicate check:</strong> Scanning an existing item automatically increments its quantity (+1).</span>
              </div>
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span><strong>Batch & FEFO matching:</strong> Matches manufacturer EAN barcodes, batch numbers, or product SKUs.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span><strong>Voice & Audio Chime:</strong> Plays instant confirmation beep tone and voice announcement.</span>
              </div>
            </div>
          </div>

          {/* Interactive Barcode Simulator & Quick Testing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-teal-600" />
                <span>Test & Simulate Scans from Inventory</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Click any medicine below to simulate hardware scan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleMedicines.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-slate-200 hover:border-teal-400 hover:shadow-xs rounded-2xl transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-slate-900 truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200 shrink-0">
                        {item.rack}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                      <span>Batch: <strong className="text-slate-700">{item.batchNumber}</strong></span>
                      <span>•</span>
                      <span>MRP: ₹{item.mrp.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      // Prefer batch number or barcode for exact match
                      onSimulateScan(item.batchNumber);
                    }}
                    className="px-2.5 py-1.5 bg-teal-50 group-hover:bg-teal-600 text-teal-700 group-hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                    title={`Simulate barcode scan for ${item.name} (${item.batchNumber})`}
                  >
                    <Scan className="w-3.5 h-3.5" />
                    <span>Scan</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Barcode Input */}
            <form onSubmit={handleTestScan} className="pt-2 flex items-center gap-2">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={testInput}
                  onChange={e => setTestInput(e.target.value)}
                  placeholder="Enter or paste any custom barcode, batch number, or med-id..."
                  className="w-full text-xs font-mono font-bold py-2 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                disabled={!testInput.trim()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 flex items-center gap-1 text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Connect USB/Bluetooth scanner in keyboard wedge mode. No driver needed.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
