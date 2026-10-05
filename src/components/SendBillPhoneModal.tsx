import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  Send,
  Receipt,
  FileText
} from 'lucide-react';
import { SaleTransaction, PharmacyProfile } from '../types';
import {
  cleanPhoneNumber,
  generateWhatsAppBillMessage,
  generateSmsBillMessage,
  shareBillViaWhatsApp,
  shareBillViaSms,
  copyToClipboardSafely
} from '../utils/billShareUtils';

interface SendBillPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: SaleTransaction;
  profile: PharmacyProfile;
  initialChannel?: 'WhatsApp' | 'SMS';
  initialPhone?: string;
  onSuccessStatus?: (msg: string) => void;
}

export const SendBillPhoneModal: React.FC<SendBillPhoneModalProps> = ({
  isOpen,
  onClose,
  transaction,
  profile,
  initialChannel = 'WhatsApp',
  initialPhone = '',
  onSuccessStatus
}) => {
  const [phone, setPhone] = useState(
    initialPhone || (transaction.patientPhone && transaction.patientPhone !== '-' ? transaction.patientPhone : '')
  );
  const [activeTab, setActiveTab] = useState<'WhatsApp' | 'SMS'>(initialChannel);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const rawDigits = phone.replace(/\D/g, '');
  const isValidPhone = rawDigits.length >= 10;
  const waMessage = generateWhatsAppBillMessage(transaction, profile);
  const smsMessage = generateSmsBillMessage(transaction, profile);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (validationError) setValidationError(null);
  };

  const handleSendWhatsApp = async (openWeb = false) => {
    if (!isValidPhone) {
      setValidationError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const clean = cleanPhoneNumber(phone);
    await copyToClipboardSafely(waMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);

    const targetUrl = openWeb
      ? `https://web.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(waMessage)}`
      : `https://wa.me/${clean}?text=${encodeURIComponent(waMessage)}`;

    try {
      const anchor = document.createElement('a');
      anchor.href = targetUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (e) {
      console.warn('Anchor click error', e);
    }

    const msg = 'WhatsApp bill prepared & copied to clipboard!';
    setStatusMessage(msg);
    if (onSuccessStatus) onSuccessStatus(msg);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleSendSms = async () => {
    if (!isValidPhone) {
      setValidationError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const result = await shareBillViaSms(phone, transaction, profile);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);

    const msg = result.statusText;
    setStatusMessage(msg);
    if (onSuccessStatus) onSuccessStatus(msg);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleCopyCurrentText = async () => {
    const textToCopy = activeTab === 'WhatsApp' ? waMessage : smsMessage;
    await copyToClipboardSafely(textToCopy);
    setIsCopied(true);
    setStatusMessage(`${activeTab} bill copied to clipboard!`);
    setTimeout(() => {
      setIsCopied(false);
      setStatusMessage(null);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-emerald-50/40 to-teal-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              {activeTab === 'WhatsApp' ? (
                <MessageCircle className="w-5 h-5 fill-current" />
              ) : (
                <Smartphone className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span>Send Bill to Customer</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-teal-100 text-teal-800">
                  #{transaction.id}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Customer: <span className="font-semibold text-slate-700">{transaction.patientName || 'Walk-in'}</span> • Net: <span className="font-semibold text-emerald-700">₹{transaction.grandTotal.toFixed(2)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('WhatsApp');
                setValidationError(null);
              }}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'WhatsApp'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageCircle className="w-4 h-4 fill-current text-emerald-600" />
              <span>WhatsApp Bill</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('SMS');
                setValidationError(null);
              }}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'SMS'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Send className="w-4 h-4 text-sky-600" />
              <span>SMS Bill</span>
            </button>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Mobile input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Customer Mobile Number (10 Digits)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={e => handlePhoneChange(e.target.value)}
                placeholder="Enter 10-digit customer phone"
                autoFocus
                className={`w-full pl-12 pr-4 py-2.5 bg-slate-50 border rounded-2xl text-sm font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-2 ${
                  validationError
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/40'
                    : 'border-slate-200 focus:ring-teal-500'
                }`}
              />
            </div>
            {validationError && (
              <p className="text-[11px] font-semibold text-rose-600 mt-1">
                {validationError}
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Supports Indian mobile numbers with or without +91 prefix.
            </p>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Live Bill Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>{activeTab === 'WhatsApp' ? 'Formatted WhatsApp Receipt' : 'SMS Message'} Preview</span>
              </span>
              <button
                type="button"
                onClick={handleCopyCurrentText}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{isCopied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-[11px] leading-relaxed text-slate-700 max-h-40 overflow-y-auto whitespace-pre-wrap select-all">
              {activeTab === 'WhatsApp' ? waMessage : smsMessage}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleCopyCurrentText}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{isCopied ? 'Copied to Clipboard' : 'Copy Bill Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {activeTab === 'WhatsApp' ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(false)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  id="modal-submit-whatsapp-btn"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Send WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(true)}
                  className="px-2.5 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Open in WhatsApp Web (Desktop browser)"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Web</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendSms}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                id="modal-submit-sms-btn"
              >
                <Send className="w-4 h-4" />
                <span>Send SMS</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
