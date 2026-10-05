import React, { useState, useRef } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Building,
  AlertCircle,
  ArrowRight,
  Phone,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  FileCheck
} from 'lucide-react';
import { QRCode } from './QRCode';
import { OnlinePaymentMethod, OnlinePaymentStatus } from '../types';
import { StorageService } from '../services/storage';
import { copyToClipboardSafely } from '../utils/billShareUtils';

interface CustomerOnlinePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  onPaymentComplete: (
    paymentMethod: OnlinePaymentMethod,
    paymentStatus: OnlinePaymentStatus,
    upiRef?: string,
    paymentReceiptUrl?: string,
    paymentReceiptFileName?: string
  ) => void;
}

export const CustomerOnlinePaymentModal: React.FC<CustomerOnlinePaymentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  amount,
  customerName,
  customerPhone,
  onPaymentComplete
}) => {
  const profile = StorageService.getPharmacyProfile();
  const storeUpiId = profile.upiVpa || profile.upiId || '8438678498@upi';
  const storeName = profile.name || 'City Rx - City Medical';
  const storeQrImage = profile.upiQrCodeUrl;

  const [selectedMethod, setSelectedMethod] = useState<OnlinePaymentMethod>('UPI');
  const [upiRef, setUpiRef] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeQrTab, setActiveQrTab] = useState<'dynamic' | 'store_standee'>('dynamic');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [paymentScreenshotFileName, setPaymentScreenshotFileName] = useState<string | null>(null);
  const [showScreenshotPreview, setShowScreenshotPreview] = useState(false);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4532 8912 3456 7890',
    cardExpiry: '08/28',
    cardCvv: '392',
    cardName: customerName || 'Card Holder'
  });
  const [selectedBank, setSelectedBank] = useState('State Bank of India (SBI)');

  if (!isOpen) return null;

  // Standard NPCI UPI URI with order total and transaction reference
  const upiUri = `upi://pay?pa=${encodeURIComponent(storeUpiId)}&pn=${encodeURIComponent(
    storeName
  )}&am=${amount.toFixed(2)}&cu=INR&tr=${encodeURIComponent(orderId)}&tn=${encodeURIComponent(
    `Order ${orderId} - City Medical Melur`
  )}`;

  const handleCopyUpi = async () => {
    await copyToClipboardSafely(storeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (screenshot/receipt).');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const res = ev.target?.result as string;
      if (res) {
        setPaymentScreenshot(res);
        setPaymentScreenshotFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCompletePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (selectedMethod === 'UPI') {
        const ref = upiRef.trim() || `UPI-TXN-${Date.now().toString().slice(-8)}`;
        onPaymentComplete(
          'UPI',
          'Paid',
          ref,
          paymentScreenshot || undefined,
          paymentScreenshotFileName || undefined
        );
      } else if (selectedMethod === 'CARD') {
        onPaymentComplete('CARD', 'Paid', `CARD-${Date.now().toString().slice(-8)}`);
      } else if (selectedMethod === 'NET_BANKING') {
        onPaymentComplete('NET_BANKING', 'Paid', `NB-${selectedBank.slice(0, 4)}-${Date.now().toString().slice(-6)}`);
      } else {
        onPaymentComplete('COD', 'Cash on Delivery');
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-300">
              Order #{orderId}
            </span>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Select Online Payment Option
            </h3>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-200 block">Total Payable</span>
            <span className="text-lg font-black text-white font-mono">₹{amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method Selector Tabs */}
        <div className="grid grid-cols-4 p-2 bg-slate-100 border-b border-slate-200 text-xs font-bold shrink-0">
          <button
            onClick={() => setSelectedMethod('UPI')}
            className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
              selectedMethod === 'UPI'
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>UPI Instant</span>
          </button>

          <button
            onClick={() => setSelectedMethod('CARD')}
            className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
              selectedMethod === 'CARD'
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>Debit/Credit</span>
          </button>

          <button
            onClick={() => setSelectedMethod('NET_BANKING')}
            className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
              selectedMethod === 'NET_BANKING'
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4 text-purple-600" />
            <span>Net Banking</span>
          </button>

          <button
            onClick={() => setSelectedMethod('COD')}
            className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
              selectedMethod === 'COD'
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4 text-amber-600" />
            <span>Cash on Del.</span>
          </button>
        </div>

        {/* Method Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: UPI OPTION */}
          {selectedMethod === 'UPI' && (
            <div className="space-y-4 text-center">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2 text-left">
                  <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Scan QR with any UPI App (GPay, PhonePe, Paytm, BHIM)</span>
                </div>
                <span className="font-bold text-emerald-700">0% Convenience Fee</span>
              </div>

              {/* QR Code Tab Switcher if Store Standee exists */}
              {storeQrImage && (
                <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => setActiveQrTab('dynamic')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                      activeQrTab === 'dynamic'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Dynamic Bill QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveQrTab('store_standee')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                      activeQrTab === 'store_standee'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Store QR Standee
                  </button>
                </div>
              )}

              {/* QR Code Display Card */}
              <div className="inline-block p-3 bg-white rounded-2xl border-2 border-dashed border-emerald-300 shadow-sm">
                {activeQrTab === 'dynamic' || !storeQrImage ? (
                  <>
                    <QRCode value={upiUri} size={170} />
                    <p className="mt-2 text-xs font-extrabold text-slate-800">
                      Exact Amount Locked: ₹{amount.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-slate-500">Scan & Pay to City Medical</p>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <img
                      src={storeQrImage}
                      alt="Store Official Counter UPI Standee QR"
                      className="w-44 h-44 object-contain rounded-xl"
                    />
                    <p className="mt-2 text-xs font-extrabold text-emerald-800">
                      Amount to Pay: ₹{amount.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-slate-500">City Medical Official Standee</p>
                  </div>
                )}
              </div>

              {/* UPI ID copy */}
              <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 flex items-center gap-1.5 flex-1 justify-between">
                  <span>{storeUpiId}</span>
                  <button
                    onClick={handleCopyUpi}
                    className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* 1-Click Pay Buttons on Mobile */}
              <div className="pt-1">
                <span className="text-xs text-slate-500 block mb-2 font-medium">
                  Direct mobile app links:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <a
                    href={upiUri}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-teal-400" />
                    <span>Open Any UPI App</span>
                  </a>
                  <a
                    href={`tez://upi/pay?pa=${encodeURIComponent(storeUpiId)}&pn=${encodeURIComponent(
                      storeName
                    )}&am=${amount.toFixed(2)}`}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
                  >
                    <span>Google Pay</span>
                  </a>
                  <a
                    href={`phonepe://pay?pa=${encodeURIComponent(storeUpiId)}&pn=${encodeURIComponent(
                      storeName
                    )}&am=${amount.toFixed(2)}`}
                    className="px-2.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
                  >
                    <span>PhonePe</span>
                  </a>
                  <a
                    href={`paytmmp://pay?pa=${encodeURIComponent(storeUpiId)}&pn=${encodeURIComponent(
                      storeName
                    )}&am=${amount.toFixed(2)}`}
                    className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
                  >
                    <span>Paytm</span>
                  </a>
                </div>
              </div>

              {/* Upload Payment Screenshot / Receipt Section */}
              <input
                type="file"
                ref={screenshotInputRef}
                onChange={handleScreenshotChange}
                accept="image/*"
                className="hidden"
                id="customer-payment-screenshot-upload"
              />

              <div className="text-left bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload UPI Payment Screenshot / Receipt</span>
                  </label>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                    Recommended
                  </span>
                </div>

                {paymentScreenshot ? (
                  <div className="p-2.5 bg-white border border-emerald-300 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img
                        src={paymentScreenshot}
                        alt="Payment Receipt"
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0 cursor-pointer"
                        onClick={() => setShowScreenshotPreview(true)}
                      />
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{paymentScreenshotFileName || 'Payment Screenshot.png'}</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-semibold block">
                          Attached for Pharmacist Verification
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowScreenshotPreview(true)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg text-xs cursor-pointer"
                        title="Preview screenshot"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentScreenshot(null);
                          setPaymentScreenshotFileName(null);
                        }}
                        className="p-1.5 text-red-600 hover:text-red-800 bg-red-50 rounded-lg text-xs cursor-pointer"
                        title="Remove screenshot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => screenshotInputRef.current?.click()}
                    className="p-3 border border-dashed border-slate-300 hover:border-emerald-500 rounded-xl bg-white hover:bg-emerald-50/20 text-center cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>Click to upload payment screenshot from GPay / PhonePe</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Speeds up instant dispatch & cash receipt reconciliation
                    </span>
                  </div>
                )}
              </div>

              {/* Enter UPI Reference ID */}
              <div className="text-left bg-slate-50 border border-slate-200 rounded-xl p-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  12-Digit UPI Transaction / UTR No. (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={upiRef}
                    onChange={e => setUpiRef(e.target.value)}
                    placeholder="e.g. 423981029384"
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setUpiRef(`UPI-${Date.now().toString().slice(-8)}`)}
                    className="px-2.5 py-1.5 text-xs text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg font-semibold cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CARD PAYMENT */}
          {selectedMethod === 'CARD' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>256-Bit SSL Encrypted • All Major RuPay, Visa & MasterCard Accepted</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardDetails.cardNumber}
                  onChange={e => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    value={cardDetails.cardExpiry}
                    onChange={e => setCardDetails({ ...cardDetails, cardExpiry: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CVV</label>
                  <input
                    type="password"
                    maxLength={3}
                    value={cardDetails.cardCvv}
                    onChange={e => setCardDetails({ ...cardDetails, cardCvv: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Name on Card</label>
                <input
                  type="text"
                  value={cardDetails.cardName}
                  onChange={e => setCardDetails({ ...cardDetails, cardName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: NET BANKING */}
          {selectedMethod === 'NET_BANKING' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Bank</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'State Bank of India (SBI)',
                  'HDFC Bank',
                  'ICICI Bank',
                  'Canara Bank',
                  'Indian Bank',
                  'Axis Bank'
                ].map(bank => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => setSelectedBank(bank)}
                    className={`p-2.5 rounded-lg border text-left text-xs font-medium cursor-pointer transition-all ${
                      selectedBank === bank
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: COD */}
          {selectedMethod === 'COD' && (
            <div className="space-y-3 text-center py-2">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Cash on Delivery (COD)</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                You can pay <strong>₹{amount.toFixed(2)}</strong> in cash or scan the delivery rider's UPI QR code upon doorstep receipt.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 text-left">
                <strong>Important:</strong> Our pharmacist will call your number <strong>+91 {customerPhone}</strong> to verify prescription and confirm the delivery address before rider dispatch.
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleCompletePayment}
            disabled={isProcessing}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black rounded-lg shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
            id="confirm-payment-btn"
          >
            {isProcessing ? (
              <span>Verifying Payment...</span>
            ) : selectedMethod === 'COD' ? (
              <>
                <span>Confirm COD Order</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>I Have Paid ₹{amount.toFixed(2)}</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Payment Screenshot Preview Modal */}
      {showScreenshotPreview && paymentScreenshot && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs truncate">
                  {paymentScreenshotFileName || 'Payment Screenshot'}
                </span>
              </div>
              <button
                onClick={() => setShowScreenshotPreview(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center">
              <img
                src={paymentScreenshot}
                alt="Payment proof preview"
                className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-md bg-white border border-slate-300"
              />
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowScreenshotPreview(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
