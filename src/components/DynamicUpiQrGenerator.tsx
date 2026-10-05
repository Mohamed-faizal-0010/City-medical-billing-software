import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  CheckCircle2,
  X,
  Copy,
  Check,
  Printer,
  Smartphone,
  MessageCircle,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  ExternalLink,
  Edit2,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { copyToClipboardSafely } from '../utils/billShareUtils';
import { generateQrSvgDataUrl } from './QRCode';
import { printQrPaymentSlip } from '../utils/printDirectUtils';

interface DynamicUpiQrGeneratorProps {
  amount: number;
  invoiceId?: string;
  customerName?: string;
  customerPhone?: string;
  cartItemCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
  onPaymentConfirmed: (paymentDetails: {
    method: 'UPI';
    upiId: string;
    amount: number;
    reference: string;
    timestamp: string;
  }) => void;
  inline?: boolean; // If true, renders as an inline widget inside POSView rather than modal
}

export const DynamicUpiQrGenerator: React.FC<DynamicUpiQrGeneratorProps> = ({
  amount,
  invoiceId: propInvoiceId,
  customerName = 'Walk-in Customer',
  customerPhone = '',
  cartItemCount = 0,
  isOpen = true,
  onClose,
  onPaymentConfirmed,
  inline = false
}) => {
  const profile = StorageService.getPharmacyProfile();
  const pharmacyName = profile.name || 'City Rx - City Medical';
  
  const [upiId, setUpiId] = useState<string>(() => profile.upiVpa || profile.upiId || '8438678498@upi');
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [tempUpiId, setTempUpiId] = useState(upiId);
  const [copied, setCopied] = useState(false);
  const [isCustomerDisplay, setIsCustomerDisplay] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [paymentReceivedState, setPaymentReceivedState] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(true);

  // Store uploaded QR code state
  const [storeQrImage, setStoreQrImage] = useState<string | undefined>(profile.upiQrCodeUrl);
  const [qrMode, setQrMode] = useState<'dynamic' | 'store_qr'>('dynamic');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStoreQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;

      const updated = {
        ...profile,
        upiQrCodeUrl: dataUrl,
        upiQrUploadedAt: new Date().toISOString(),
        upiQrFileName: file.name
      };
      StorageService.savePharmacyProfile(updated);
      setStoreQrImage(dataUrl);
      setQrMode('store_qr');
    };
    reader.readAsDataURL(file);
  };

  const activeInvoiceId = useRef(
    propInvoiceId || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  ).current;

  // Safe formatted amount
  const safeAmount = Math.max(0, Number(amount) || 0);
  const formattedAmount = safeAmount.toFixed(2);

  // Generate NPCI UPI standard deep link
  const note = `City Medical ${activeInvoiceId}`;
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(pharmacyName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(note)}`;

  // Generate dynamic QR code SVG Data URL synchronously (0ms load, offline-ready)
  const qrImageUrl = generateQrSvgDataUrl(upiUri, 2, 'M');

  // Announce payment with voice synthesis
  const announceSoundbox = (amt: string) => {
    if (!soundEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Payment of rupees ${amt} received on UPI.`);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore audio failure in sandboxed environments
    }
  };

  // Keyboard shortcut listener: Enter to confirm payment, Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isEditingUpi && !paymentReceivedState) {
        e.preventDefault();
        handleConfirmPayment();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (isCustomerDisplay) {
          setIsCustomerDisplay(false);
        } else if (onClose) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditingUpi, paymentReceivedState, isCustomerDisplay, safeAmount]);

  const handleConfirmPayment = () => {
    setPaymentReceivedState(true);
    announceSoundbox(formattedAmount);

    // Execute immediately within user gesture so instant bill print triggers cleanly
    onPaymentConfirmed({
      method: 'UPI',
      upiId,
      amount: safeAmount,
      reference: `UPI-RR-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      timestamp: new Date().toISOString()
    });
  };

  const handlePrintQrSlip = () => {
    printQrPaymentSlip({
      amount: safeAmount,
      invoiceId: activeInvoiceId,
      customerName,
      customerPhone,
      upiId,
      profile
    });
  };

  const handleCopyLink = async () => {
    await copyToClipboardSafely(upiUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveUpiId = () => {
    if (tempUpiId.trim()) {
      setUpiId(tempUpiId.trim());
      const updated = { ...profile, upiId: tempUpiId.trim() };
      StorageService.savePharmacyProfile(updated);
      setIsEditingUpi(false);
    }
  };

  const handleSendWhatsApp = async () => {
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = `Hello ${customerName || 'Customer'},\nThank you for visiting ${pharmacyName}.\n\n*Invoice No:* ${activeInvoiceId}\n*Total Payable:* ₹${formattedAmount}\n\n👉 *Pay directly via UPI (Google Pay, PhonePe, Paytm):*\n${upiUri}\n\n*UPI ID:* ${upiId}\nHave a speedy recovery!`;
    await copyToClipboardSafely(message);
    const waUrl = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    try {
      const a = document.createElement('a');
      a.href = waUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(waUrl, '_blank');
    }
  };

  if (!isOpen && !inline) return null;

  // Content body
  const content = (
    <div className={`flex flex-col ${isCustomerDisplay ? 'max-w-xl' : 'max-w-md'} w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 transition-all`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-800 to-slate-900 text-white p-4 sm:p-5 relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <QrCode className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-sm sm:text-base tracking-tight text-white">
                Dynamic UPI Payment QR
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-teal-100/80">
              Amount auto-locked to exact bill total: ₹{formattedAmount}
            </p>
          </div>
        </div>

        {/* Controls in Header */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${soundEnabled ? 'bg-white/15 text-emerald-200 border-white/20' : 'bg-white/5 text-slate-400 border-white/10'}`}
            title={soundEnabled ? 'Voice Soundbox Enabled (Announces ₹ on payment)' : 'Soundbox Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {!inline && (
            <button
              onClick={() => setIsCustomerDisplay(!isCustomerDisplay)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs transition-colors"
              title={isCustomerDisplay ? 'Normal View' : 'Large Customer Display Mode'}
            >
              {isCustomerDisplay ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {!inline && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
              title="Close [Esc]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main QR Section */}
      <div className="p-5 sm:p-6 flex flex-col items-center text-center space-y-4 bg-slate-50/50">
        {/* Dynamic Amount Highlight */}
        <div className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between shadow-2xs">
          <div className="text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Bill Total Payable
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
              ₹{formattedAmount}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Ref Invoice
            </span>
            <span className="text-xs font-mono font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200 inline-block">
              {activeInvoiceId}
            </span>
          </div>
        </div>

        {/* Mode Selector & Quick Store QR Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleStoreQrUpload}
          accept="image/*"
          className="hidden"
          id="pos-quick-qr-upload"
        />

        <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-200/80 rounded-xl text-xs font-bold w-full max-w-sm">
          <button
            type="button"
            onClick={() => setQrMode('dynamic')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              qrMode === 'dynamic'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Dynamic QR (₹{formattedAmount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!storeQrImage) {
                fileInputRef.current?.click();
              } else {
                setQrMode('store_qr');
              }
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              qrMode === 'store_qr'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
            <span>Store Standee QR</span>
            {!storeQrImage && (
              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded flex items-center gap-0.5">
                <Upload className="w-2.5 h-2.5" />
                Upload
              </span>
            )}
          </button>
        </div>

        {/* Dynamic or Store QR Code Card */}
        <div className="relative group p-4 bg-white rounded-3xl border-2 border-dashed border-teal-300 shadow-md flex flex-col items-center">
          {/* Authentic Corner Accents */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-teal-600 rounded-tl" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-teal-600 rounded-tr" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-teal-600 rounded-bl" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-teal-600 rounded-br" />

          {/* QR Image with live total or uploaded store standee */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center bg-white rounded-2xl overflow-hidden p-1">
            {qrMode === 'dynamic' ? (
              <>
                <img
                  src={qrImageUrl}
                  alt={`UPI Payment QR for ₹${formattedAmount}`}
                  className="w-full h-full object-contain rounded-xl"
                  onLoad={() => setQrLoaded(true)}
                  onError={() => setQrLoaded(false)}
                />
                {/* Center UPI Badge */}
                <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-white shadow-md border-2 border-teal-600 flex items-center justify-center p-1 pointer-events-none">
                  <span className="text-[11px] font-black text-teal-800">UPI</span>
                </div>
              </>
            ) : storeQrImage ? (
              <img
                src={storeQrImage}
                alt="Store Official Counter UPI Standee QR Code"
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:bg-emerald-50/50 rounded-xl transition-colors w-full h-full"
              >
                <Upload className="w-10 h-10 text-emerald-600 mb-2" />
                <span className="text-xs font-bold text-slate-800">No Store QR Uploaded</span>
                <span className="text-[11px] text-emerald-700 underline mt-1 font-semibold">
                  Click here to upload QR image
                </span>
              </div>
            )}
          </div>

          <div className="mt-2 text-xs font-bold text-slate-700 flex items-center gap-1.5">
            {qrMode === 'dynamic' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Scan with any UPI App • Auto-Fills ₹{formattedAmount}</span>
              </>
            ) : (
              <div className="flex items-center justify-between w-full px-2">
                <span className="text-emerald-800 font-bold">Official Store QR Standee</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-teal-700 hover:text-teal-900 underline flex items-center gap-0.5 ml-2 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Supported UPI Apps Row */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI', 'Cred', 'Amazon Pay'].map(app => (
            <span
              key={app}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700 shadow-2xs"
            >
              {app}
            </span>
          ))}
        </div>

        {/* Pharmacy UPI ID & Copy Bar */}
        <div className="w-full p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-2 text-xs">
          <div className="text-left overflow-hidden">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Merchant VPA / UPI ID
            </span>
            {isEditingUpi ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <input
                  type="text"
                  value={tempUpiId}
                  onChange={e => setTempUpiId(e.target.value)}
                  className="px-2 py-1 text-xs border border-teal-300 rounded font-mono w-44"
                  placeholder="name@upi"
                />
                <button
                  onClick={handleSaveUpiId}
                  className="px-2 py-1 bg-teal-700 text-white rounded text-[11px] font-bold cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingUpi(false)}
                  className="px-1 text-slate-400 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-800 text-xs truncate">
                  {upiId}
                </span>
                <button
                  onClick={() => {
                    setTempUpiId(upiId);
                    setIsEditingUpi(true);
                  }}
                  className="text-slate-400 hover:text-teal-600 p-0.5 cursor-pointer"
                  title="Change Store UPI ID"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handlePrintQrSlip}
              className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl font-bold text-xs flex items-center gap-1 border border-teal-200 transition-colors cursor-pointer"
              title="Print QR Payment Slip / Bill"
              id="dynamic-upi-print-qr-slip-btn"
            >
              <Printer className="w-3.5 h-3.5 text-teal-700" />
              <span>Print QR</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1 border border-slate-200 transition-colors cursor-pointer"
              title="Copy UPI Deep Link to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center gap-1 border border-emerald-200 transition-colors cursor-pointer"
              title="Send UPI QR & Bill Link to Customer WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Action Button: Mark Paid & Print Bill */}
        <div className="w-full space-y-2 pt-1">
          <button
            onClick={handleConfirmPayment}
            disabled={paymentReceivedState || safeAmount <= 0}
            id="dynamic-upi-confirm-btn"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            {paymentReceivedState ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-200 animate-bounce" />
                <span>Payment Verified! Generating Invoice...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>Payment Received (Complete &amp; Print) [Enter]</span>
              </>
            )}
          </button>

          {!inline && onClose && (
            <button
              onClick={onClose}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel / Switch Payment Method [Esc]
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      {content}
    </div>
  );
};
