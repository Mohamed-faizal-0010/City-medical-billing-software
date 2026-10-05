import React, { useState } from 'react';
import {
  X,
  Phone,
  PhoneCall,
  MessageSquare,
  Clock,
  MapPin,
  ShieldCheck,
  Stethoscope,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Pill
} from 'lucide-react';
import { CustomerServiceInquiry } from '../types';
import { StorageService } from '../services/storage';

interface CustomerServiceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrderId?: string;
}

const HELPLINE_NUMBER = '8438678498';

export const CustomerServiceHubModal: React.FC<CustomerServiceHubModalProps> = ({
  isOpen,
  onClose,
  defaultOrderId
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [inquiryType, setInquiryType] = useState<CustomerServiceInquiry['inquiryType']>('general');
  const [medicineRequested, setMedicineRequested] = useState('');
  const [orderId, setOrderId] = useState(defaultOrderId || '');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !message.trim()) {
      alert('Please provide your name, 10-digit mobile number, and your message.');
      return;
    }

    const newInquiry: CustomerServiceInquiry = {
      id: `INQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      inquiryType,
      orderId: orderId.trim() || undefined,
      medicineRequested: medicineRequested.trim() || undefined,
      message: message.trim(),
      status: 'Open',
      createdAt: new Date().toISOString()
    };

    StorageService.addCustomerServiceInquiry(newInquiry);
    setIsSubmitted(true);
  };

  const whatsappUrl = `https://wa.me/91${HELPLINE_NUMBER}?text=${encodeURIComponent(
    `Hello City Medical Pharmacist, I need assistance regarding medicine availability / prescription order.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
              <PhoneCall className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>City Medical Customer Support & Helpline</span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full">
                  24/7 Available
                </span>
              </h3>
              <p className="text-xs text-emerald-100">
                Chokkalingapuram, Melur • Direct Registered Pharmacist Helpline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Quick Action Cards (Call Now & WhatsApp) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Direct Phone Call Card */}
            <a
              href={`tel:${HELPLINE_NUMBER}`}
              className="group p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 transition-all flex items-center gap-3.5 shadow-xs"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <Phone className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Click to Call Helpline
                </span>
                <span className="text-base font-black text-slate-900 block font-mono">
                  +91 {HELPLINE_NUMBER}
                </span>
                <span className="text-xs text-slate-600">
                  Instant response from on-duty pharmacist
                </span>
              </div>
            </a>

            {/* Direct WhatsApp Chat Card */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 rounded-xl border-2 border-teal-200 bg-teal-50/50 hover:bg-teal-100/60 transition-all flex items-center gap-3.5 shadow-xs"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                  Direct WhatsApp Chat
                </span>
                <span className="text-base font-black text-slate-900 block font-mono">
                  +91 {HELPLINE_NUMBER}
                </span>
                <span className="text-xs text-slate-600">
                  Send prescription photos & get price quote
                </span>
              </div>
            </a>
          </div>

          {/* Pharmacist & Store Badges */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-2">
            <div className="flex items-start gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">Duty Pharmacist: </span>
                Anusya Begum (D.Pharm / B.Pharm • TN State Pharmacy Council Reg. #58291-A)
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">Operating Hours: </span>
                Store Open: 7:00 AM – 11:00 PM (Emergency Delivery service operates 24 Hours)
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">Pharmacy Location: </span>
                City Medical, Chokkalingapuram, Melur Taluk, Madurai District, Tamil Nadu – 625103
              </div>
            </div>
          </div>

          {/* Inquiry / Callback Request Form */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            {isSubmitted ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Inquiry Submitted Successfully!
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Our duty pharmacist Anusya Begum has received your message and will call you on{' '}
                  <strong className="text-slate-900 font-mono">+91 {customerPhone}</strong> within 10-15 minutes.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  <span>Request a Pharmacist Callback or Submit an Inquiry</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Your Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98421 XXXXX"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Inquiry Category
                    </label>
                    <select
                      value={inquiryType}
                      onChange={e => setInquiryType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    >
                      <option value="medicine_availability">Medicine Availability Check</option>
                      <option value="pharmacist_consult">Ask Pharmacist (Dosage / Advice)</option>
                      <option value="order_tracking">Order Tracking Assistance</option>
                      <option value="refill_request">Monthly Prescription Refill</option>
                      <option value="general">Other Service Inquiries</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Related Medicine or Order # (Optional)
                    </label>
                    <input
                      type="text"
                      value={medicineRequested || orderId}
                      onChange={e => {
                        setMedicineRequested(e.target.value);
                        setOrderId(e.target.value);
                      }}
                      placeholder="e.g. Lantus Insulin or ORD-2026-8910"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Describe Your Question / Requirement <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Tell us what medicine you need, dosage queries, or special instructions..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500">
                    🔒 Your medical details are kept strictly confidential.
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit to Pharmacist</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Need immediate emergency medicines? Call <strong>+91 8438678498</strong></span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
