import React, { useState, useRef } from 'react';
import {
  QrCode,
  Upload,
  CheckCircle2,
  Trash2,
  Printer,
  Download,
  RefreshCw,
  Eye,
  X,
  FileImage,
  Sparkles,
  ShieldCheck,
  Building2,
  Phone,
  Smartphone,
  Check
} from 'lucide-react';
import { PharmacyProfile } from '../types';
import { StorageService } from '../services/storage';
import { copyToClipboardSafely } from '../utils/billShareUtils';

interface UpiQrCodeManagerProps {
  profile?: PharmacyProfile;
  onProfileUpdated?: (updated: PharmacyProfile) => void;
  isOpen?: boolean;
  onClose?: () => void;
  inline?: boolean;
}

export const UpiQrCodeManager: React.FC<UpiQrCodeManagerProps> = ({
  profile: propProfile,
  onProfileUpdated,
  isOpen = true,
  onClose,
  inline = false
}) => {
  const [profile, setProfile] = useState<PharmacyProfile>(
    () => propProfile || StorageService.getPharmacyProfile()
  );
  const [dragActive, setDragActive] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen && !inline) return null;

  const currentQrImage = profile.upiQrCodeUrl;
  const upiId = profile.upiVpa || profile.upiId || '8438678498@upi';
  const pharmacyName = profile.name || 'City Rx - City Medical';

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, JPEG, WebP).');
      return;
    }

    // Limit to 5MB to prevent localstorage bloat
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file is too large. Please upload an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      if (!result) return;

      const updated: PharmacyProfile = {
        ...profile,
        upiQrCodeUrl: result,
        upiQrUploadedAt: new Date().toISOString(),
        upiQrFileName: file.name
      };

      StorageService.savePharmacyProfile(updated);
      setProfile(updated);
      if (onProfileUpdated) onProfileUpdated(updated);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3500);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveQr = () => {
    if (window.confirm('Are you sure you want to remove the custom uploaded UPI QR code? The system will revert to the auto-generated dynamic QR.')) {
      const updated: PharmacyProfile = {
        ...profile,
        upiQrCodeUrl: undefined,
        upiQrUploadedAt: undefined,
        upiQrFileName: undefined
      };
      StorageService.savePharmacyProfile(updated);
      setProfile(updated);
      if (onProfileUpdated) onProfileUpdated(updated);
    }
  };

  // Generate a branded standee SVG template
  const handleGenerateDefaultStandee = () => {
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(pharmacyName)}&cu=INR&tn=${encodeURIComponent('City Medical Melur')}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUri)}&margin=10`;

    // Fetch and convert to base64
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 520;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Card background
      ctx.fillStyle = '#ffffff';
      ctx.roundRect(0, 0, 400, 520, 24);
      ctx.fill();

      // Top banner
      const grad = ctx.createLinearGradient(0, 0, 400, 0);
      grad.addColorStop(0, '#065f46');
      grad.addColorStop(1, '#047857');
      ctx.fillStyle = grad;
      ctx.roundRect(0, 0, 400, 95, [24, 24, 0, 0]);
      ctx.fill();

      // Banner text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pharmacyName.toUpperCase(), 200, 38);

      ctx.fillStyle = '#a7f3d0';
      ctx.font = '12px sans-serif';
      ctx.fillText('ACCEPTED HERE • ALL UPI APPS', 200, 62);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`UPI ID: ${upiId}`, 200, 80);

      // Draw QR Code
      ctx.drawImage(img, 60, 115, 280, 280);

      // Footer
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Scan with Any UPI App', 200, 425);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText('Google Pay • PhonePe • Paytm • BHIM', 200, 448);

      ctx.fillStyle = '#059669';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`Lic No: ${profile.drugLicenseNo?.split('(')[0] || 'TN-MDU-2024-004928'}`, 200, 480);

      const base64Url = canvas.toDataURL('image/png');
      const updated: PharmacyProfile = {
        ...profile,
        upiQrCodeUrl: base64Url,
        upiQrUploadedAt: new Date().toISOString(),
        upiQrFileName: 'city_medical_upi_standee.png'
      };
      StorageService.savePharmacyProfile(updated);
      setProfile(updated);
      if (onProfileUpdated) onProfileUpdated(updated);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3500);
    };
    img.src = qrApiUrl;
  };

  const handlePrintStandee = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrSrc = currentQrImage || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(pharmacyName)}`)}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>City Medical - UPI QR Standee</title>
          <style>
            @page { size: A5 portrait; margin: 10mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 95vh;
              background-color: #f8fafc;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .standee-card {
              width: 130mm;
              background: #ffffff;
              border: 3px solid #059669;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
              text-align: center;
            }
            .header {
              background: linear-gradient(135deg, #064e3b, #059669);
              color: white;
              padding: 20px 15px;
            }
            .header h1 {
              margin: 0 0 5px 0;
              font-size: 22px;
              letter-spacing: 0.5px;
            }
            .header p {
              margin: 0;
              font-size: 13px;
              color: #a7f3d0;
            }
            .upi-badge {
              display: inline-block;
              background: rgba(255,255,255,0.2);
              padding: 4px 12px;
              border-radius: 20px;
              font-family: monospace;
              font-size: 13px;
              margin-top: 8px;
              font-weight: bold;
            }
            .qr-container {
              padding: 25px 20px;
              background: #ffffff;
            }
            .qr-container img {
              width: 85mm;
              height: 85mm;
              object-fit: contain;
              border-radius: 12px;
              border: 2px dashed #cbd5e1;
              padding: 6px;
            }
            .footer {
              background: #f1f5f9;
              padding: 15px;
              border-top: 1px solid #e2e8f0;
            }
            .accepted-text {
              font-size: 13px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 8px 0;
            }
            .app-badges {
              display: flex;
              justify-content: center;
              gap: 8px;
              margin-bottom: 12px;
            }
            .app-badge {
              background: #ffffff;
              border: 1px solid #cbd5e1;
              padding: 3px 10px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: bold;
              color: #334155;
            }
            .address-footer {
              font-size: 10px;
              color: #64748b;
              line-height: 1.4;
            }
          </style>
        </head>
        <body>
          <div class="standee-card">
            <div class="header">
              <h1>${pharmacyName}</h1>
              <p>Trusted Community Healthcare & Pharmacy</p>
              <div class="upi-badge">UPI ID: ${upiId}</div>
            </div>
            <div class="qr-container">
              <img src="${qrSrc}" alt="UPI QR Code" />
              <div style="margin-top: 12px; font-weight: bold; font-size: 14px; color: #047857;">
                Scan with Any UPI App & Pay
              </div>
            </div>
            <div class="footer">
              <div class="accepted-text">Google Pay • PhonePe • Paytm • BHIM • Cred</div>
              <div class="address-footer">
                ${profile.addressLine1 || 'Chokkalingapuram'}, ${profile.taluk || 'Melur'}, Madurai - ${profile.pincode || '625103'}<br />
                Helpline: +91 ${profile.mobile || '8438678498'} | DL: ${profile.drugLicenseNo || 'TN-MDU-2024-004928'}
              </div>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const copyUpiId = async () => {
    await copyToClipboardSafely(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const content = (
    <div className="space-y-4">
      {/* Success banner */}
      {uploadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-900 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Official Store UPI Payment QR Code updated successfully! It will now appear on POS counter & Online checkout.</span>
        </div>
      )}

      {/* Main Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span>Official UPI Payment QR Code</span>
                {currentQrImage ? (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Custom Uploaded
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Auto-Generated
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Upload your pharmacy's official counter QR standee (PhonePe, GPay, Paytm, BHIM, Bank QR)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintStandee}
              type="button"
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              title="Print Counter Acrylic Standee"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Standee</span>
            </button>
          </div>
        </div>

        {/* Two-Column Grid: Preview on Left, Upload/Actions on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* QR Preview Card (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <div className="relative group w-48 h-48 sm:w-52 sm:h-52 bg-white rounded-2xl border-2 border-dashed border-emerald-300 p-2 shadow-xs flex items-center justify-center overflow-hidden">
              {currentQrImage ? (
                <img
                  src={currentQrImage}
                  alt="Official Store UPI QR Code"
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 p-3">
                  <QrCode className="w-16 h-16 text-emerald-500/60 mb-2" />
                  <span className="text-xs font-bold text-slate-600">Auto-Generated QR</span>
                  <span className="text-[11px] text-slate-400 font-mono mt-0.5">{upiId}</span>
                </div>
              )}

              {currentQrImage && (
                <button
                  onClick={() => setPreviewModalOpen(true)}
                  type="button"
                  className="absolute inset-0 bg-slate-950/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl cursor-pointer"
                >
                  <Eye className="w-6 h-6 mb-1" />
                  <span className="text-xs font-bold">View Full Size</span>
                </button>
              )}
            </div>

            {/* Merchant Details below preview */}
            <div className="mt-3 w-full space-y-1 text-xs">
              <div className="flex items-center justify-center gap-1 font-bold text-slate-800">
                <span>{pharmacyName}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-slate-500 font-mono text-[11px]">
                <span>UPI VPA: {upiId}</span>
                <button
                  onClick={copyUpiId}
                  type="button"
                  className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  title="Copy UPI ID"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="underline">Copy</span>}
                </button>
              </div>
              {profile.upiQrUploadedAt && (
                <p className="text-[10px] text-slate-400">
                  Uploaded: {new Date(profile.upiQrUploadedAt).toLocaleDateString()} ({profile.upiQrFileName || 'Custom QR'})
                </p>
              )}
            </div>

            {currentQrImage && (
              <div className="mt-3 flex items-center gap-2 w-full">
                <button
                  onClick={() => setPreviewModalOpen(true)}
                  type="button"
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3 text-slate-500" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={handleRemoveQr}
                  type="button"
                  className="py-1.5 px-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center justify-center gap-1 cursor-pointer"
                  title="Remove uploaded QR and revert to auto-generated"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              </div>
            )}
          </div>

          {/* Upload Zone & Instructions (7 cols) */}
          <div className="md:col-span-7 space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="upi-qr-file-input"
            />

            {/* Drag & Drop Box */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]'
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 bg-slate-50/50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 shadow-2xs">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">
                Click to browse or drag & drop QR image
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Upload your Google Pay Business, PhonePe, Paytm, BharatPe, or Bank counter QR standee photo
              </p>
              <div className="flex items-center gap-2 mt-3 text-[11px] font-bold text-slate-400">
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">PNG</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">JPG</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">WebP</span>
                <span>Max 5 MB</span>
              </div>
            </div>

            {/* Quick Generator Preset */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-xs text-slate-700">
                  <span className="font-bold block text-slate-900">Need an instant official standee?</span>
                  <span>Generate a branded City Medical standee with your UPI ID</span>
                </div>
              </div>
              <button
                onClick={handleGenerateDefaultStandee}
                type="button"
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shrink-0 shadow-xs transition-colors cursor-pointer"
              >
                Auto-Create Standee
              </button>
            </div>

            {/* Key benefits / specs */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Instant Billing Sync</span>
                  <span>Reflects immediately on POS checkout screen and customer tablet display.</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                <Smartphone className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Online Portal Checkout</span>
                  <span>Patients can scan this official QR code during home delivery checkout.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Preview Modal */}
      {previewModalOpen && currentQrImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Official Counter UPI QR Code Preview</span>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center bg-slate-100">
              <img
                src={currentQrImage}
                alt="Full size QR code"
                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-md border-2 border-slate-300 bg-white p-2"
              />
              <div className="mt-4 text-center">
                <span className="font-bold text-sm text-slate-900 block">{pharmacyName}</span>
                <span className="font-mono text-xs text-emerald-800 font-bold">{upiId}</span>
              </div>
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={handlePrintStandee}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Standee</span>
              </button>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg font-black text-slate-900">Manage UPI Payment QR Code</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {content}
      </div>
    </div>
  );
};
