import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  Trash2,
  QrCode,
  Smartphone,
  Eye,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { PharmacyProfile } from '../types';
import { copyToClipboardSafely } from '../utils/billShareUtils';
import { generateQrSvgDataUrl } from './QRCode';

interface EditQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQrUpdated?: (updated: PharmacyProfile) => void;
}

export const EditQrCodeModal: React.FC<EditQrCodeModalProps> = ({
  isOpen,
  onClose,
  onQrUpdated
}) => {
  const [profile, setProfile] = useState<PharmacyProfile>(() => StorageService.getPharmacyProfile());
  const [upiIdInput, setUpiIdInput] = useState<string>('');
  const [customQrImage, setCustomQrImage] = useState<string | undefined>(undefined);
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const current = StorageService.getPharmacyProfile();
      setProfile(current);
      setUpiIdInput(current.upiVpa || current.upiId || '8438678498@upi');
      setCustomQrImage(current.upiQrCodeUrl);
      setFileName(current.upiQrFileName);
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUpi = upiIdInput.trim() || '8438678498@upi';
  const dynamicQrUrl = generateQrSvgDataUrl(
    `upi://pay?pa=${encodeURIComponent(currentUpi)}&pn=${encodeURIComponent(profile.name || 'City Rx')}&cu=INR`,
    1,
    'M'
  );

  const handleProcessFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', text: 'Please select an image file (PNG, JPG, JPEG, WebP).' });
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setFeedback({ type: 'error', text: 'Image file is too large. Please select an image under 4MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const base64 = ev.target?.result as string;
      if (base64) {
        setCustomQrImage(base64);
        setFileName(file.name);
        setFeedback({ type: 'success', text: `Loaded image "${file.name}". Click "Save QR Settings" to apply.` });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveCustomQr = () => {
    setCustomQrImage(undefined);
    setFileName(undefined);
    setFeedback({ type: 'success', text: 'Custom image removed. Auto-generated dynamic QR code will be used.' });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiIdInput.trim()) {
      setFeedback({ type: 'error', text: 'UPI ID cannot be blank.' });
      return;
    }

    const updated = StorageService.updateUpiQr({
      upiQrCodeUrl: customQrImage,
      upiQrFileName: fileName,
      upiVpa: upiIdInput.trim(),
      upiId: upiIdInput.trim()
    });

    setProfile(updated);
    setFeedback({ type: 'success', text: 'UPI payment QR code saved and live across all checkout & thermal bills!' });
    if (onQrUpdated) onQrUpdated(updated);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleCopyUpi = async () => {
    await copyToClipboardSafely(currentUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">QR Code Upload, Change & Edit</h3>
              <p className="text-xs text-slate-500">Live payment QR for POS counter, customer slips & thermal bills</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto">
          {feedback && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border border-rose-200 text-rose-900'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* UPI ID Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Primary Pharmacy UPI ID / VPA *
              </label>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUpi ? 'Copied!' : 'Copy ID'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={upiIdInput}
              onChange={e => setUpiIdInput(e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="e.g. 8438678498@upi or citymedical@okhdfcbank"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 font-mono font-bold text-slate-900 text-sm rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Used to generate dynamic billing QR codes with bill invoice ID and exact payable amounts.
            </p>
          </div>

          {/* QR Code Preview & Upload Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Live QR Preview Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {customQrImage ? 'Custom Counter Standee QR' : 'Dynamic Auto-Generated QR'}
              </span>
              <div className="w-40 h-40 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                <img
                  src={customQrImage || dynamicQrUrl}
                  alt="Payment QR"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="mt-2.5">
                <span className="font-mono text-xs font-bold text-slate-800 break-all">
                  {currentUpi}
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {customQrImage ? 'Uploaded Custom QR' : 'Real-time Dynamic UPI'}
                </p>
              </div>
            </div>

            {/* Upload & Drag Drop Area */}
            <div className="space-y-3">
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-300 hover:border-emerald-400 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-900 text-xs">
                  {customQrImage ? 'Upload Different QR Image' : 'Upload Standee QR Image'}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Drag & drop PNG/JPG or click to browse
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {customQrImage && (
                <button
                  type="button"
                  onClick={handleRemoveCustomQr}
                  className="w-full py-2 px-3 text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Custom QR (Use Dynamic)</span>
                </button>
              )}

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-950 text-[11px] leading-relaxed">
                <div className="font-bold flex items-center gap-1 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dual POS Modes:</span>
                </div>
                You can upload a photo of your GPay/PhonePe/Paytm counter standee, or let City Rx generate dynamic QR codes embedding invoice numbers.
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => setUpiIdInput('8438678498@upi')}
              className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Use Master UPI: 8438678498@upi</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save QR Code Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
