import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  Smartphone,
  Printer,
  Copy,
  Check,
  Clock,
  User,
  Stethoscope,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { Patient, Doctor } from '../types';
import { StorageService } from '../services/storage';
import { copyToClipboardSafely, cleanPhoneNumber } from '../utils/billShareUtils';

interface PatientConsultationAlertModalProps {
  isOpen: boolean;
  patient: Patient | null;
  onClose: () => void;
  onAlertSent?: (updatedPatient: Patient) => void;
}

export const PatientConsultationAlertModal: React.FC<PatientConsultationAlertModalProps> = ({
  isOpen,
  patient,
  onClose,
  onAlertSent
}) => {
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [consultationTime, setConsultationTime] = useState<string>('');
  const [tokenFormatted, setTokenFormatted] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showSlipPreview, setShowSlipPreview] = useState<boolean>(false);

  const pharmacyProfile = StorageService.getPharmacyProfile();
  const doctors = StorageService.getDoctors();

  useEffect(() => {
    if (patient) {
      setSelectedDoctor(patient.consultationDoctorName || doctors[0]?.name || 'Dr. Robert Chen, MD');
      setConsultationTime(patient.consultationTime || '10:30 AM');
      setTokenFormatted(patient.tokenFormatted || (patient.tokenNumber ? `#${patient.tokenNumber < 10 ? '0' : ''}${patient.tokenNumber}` : '#01'));
      setStatusMessage(null);
      setIsCopied(false);
      setShowSlipPreview(false);
    }
  }, [patient]);

  if (!isOpen || !patient) return null;

  const rawPhone = cleanPhoneNumber(patient.phone);
  const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

  // Build consultation alert message
  const alertMessage = 
`*City Medical Hall - Consultation Alert*
--------------------------------
Hello *${patient.name}*,
Your consultation Token is: *${tokenFormatted}*
Doctor: *${selectedDoctor}*
Scheduled Time: *${consultationTime}*
Date: *${new Date().toLocaleDateString('en-IN')}*

Please report to the OPD reception 10 minutes prior to your time.
Location: ${pharmacyProfile.addressLine1}, ${pharmacyProfile.taluk}, ${pharmacyProfile.district}
Helpline: ${pharmacyProfile.mobile || '8438678498'}

Wishing you a speedy recovery!`;

  // SMS message (concise)
  const smsMessage = `${pharmacyProfile.name || 'City Medical'}: Hello ${patient.name}, your Token is ${tokenFormatted} with ${selectedDoctor} at ${consultationTime}. Please arrive 10m early. Helpline: ${pharmacyProfile.mobile || '8438678498'}.`;

  const handleSendWhatsApp = async () => {
    await copyToClipboardSafely(alertMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);

    const waUrl = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(alertMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(alertMessage)}`;

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

    // Save notification
    StorageService.addPatientNotification({
      id: `notif-wa-${Date.now().toString().slice(-6)}`,
      patientId: patient.id,
      patientName: patient.name,
      patientPhone: patient.phone,
      channel: 'WhatsApp',
      templateType: 'appointment',
      message: alertMessage,
      status: 'Sent',
      sentAt: new Date().toISOString()
    });

    // Update patient
    const updated: Patient = {
      ...patient,
      consultationDoctorName: selectedDoctor,
      consultationTime,
      tokenFormatted,
      lastConsultationAlertSent: new Date().toISOString()
    };
    StorageService.updatePatient(updated);
    if (onAlertSent) onAlertSent(updated);

    setStatusMessage('WhatsApp consultation alert sent & copied to clipboard!');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSendSMS = async () => {
    await copyToClipboardSafely(smsMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);

    const smsUri = `sms:+${formattedPhone}?body=${encodeURIComponent(smsMessage)}`;
    try {
      const a = document.createElement('a');
      a.href = smsUri;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(smsUri);
    }

    StorageService.addPatientNotification({
      id: `notif-sms-${Date.now().toString().slice(-6)}`,
      patientId: patient.id,
      patientName: patient.name,
      patientPhone: patient.phone,
      channel: 'SMS',
      templateType: 'appointment',
      message: smsMessage,
      status: 'Sent',
      sentAt: new Date().toISOString()
    });

    const updated: Patient = {
      ...patient,
      consultationDoctorName: selectedDoctor,
      consultationTime,
      tokenFormatted,
      lastConsultationAlertSent: new Date().toISOString()
    };
    StorageService.updatePatient(updated);
    if (onAlertSent) onAlertSent(updated);

    setStatusMessage('SMS consultation alert composer opened & copied to clipboard!');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleCopyAlert = async () => {
    await copyToClipboardSafely(alertMessage);
    setIsCopied(true);
    setStatusMessage('Consultation message copied to clipboard!');
    setTimeout(() => {
      setIsCopied(false);
      setStatusMessage(null);
    }, 2500);
  };

  const handlePrintSlip = () => {
    try {
      window.print();
    } catch {
      // non-blocking
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-teal-800 via-slate-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 font-mono font-black text-lg">
              {tokenFormatted}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Consultation Alert & Token</span>
              </h2>
              <p className="text-xs text-teal-200/80">
                {patient.name} • {patient.phone}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {statusMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Token Card */}
          <div className="p-4 bg-gradient-to-br from-teal-50/80 via-emerald-50/40 to-slate-50 rounded-2xl border border-teal-200/80 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                Daily OPD Consultation Token
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                {tokenFormatted}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Issued for today: <span className="font-semibold text-slate-800">{new Date().toLocaleDateString('en-IN')}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSlipPreview(!showSlipPreview)}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-teal-600" />
              <span>{showSlipPreview ? 'Hide Slip' : 'View Token Slip'}</span>
            </button>
          </div>

          {/* Printable Token Slip Preview */}
          {showSlipPreview && (
            <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-teal-300 text-slate-900 font-mono text-center space-y-2 shadow-xs animate-in fade-in">
              <p className="text-xs font-black uppercase text-teal-800">{pharmacyProfile.name || 'City Medical Hall'}</p>
              <p className="text-[10px] text-slate-500">
                {pharmacyProfile.addressLine1}, {pharmacyProfile.taluk} • Ph: {pharmacyProfile.mobile}
              </p>
              <div className="py-2 border-y border-dashed border-slate-300 my-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient Token</span>
                <span className="text-3xl font-black text-slate-900">{tokenFormatted}</span>
                <p className="text-xs font-bold text-slate-800 mt-1">{patient.name} ({patient.age}y / {patient.gender})</p>
                <p className="text-[11px] text-slate-600">Doctor: {selectedDoctor}</p>
                <p className="text-[11px] text-teal-700 font-bold">Time: {consultationTime}</p>
              </div>
              <button
                type="button"
                onClick={handlePrintSlip}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Token Slip</span>
              </button>
            </div>
          )}

          {/* Doctor & Time Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                <span>Consulting Doctor</span>
              </label>
              <select
                value={selectedDoctor}
                onChange={e => setSelectedDoctor(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                {doctors.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.specialization})
                  </option>
                ))}
                <option value="Consulting Physician">Duty Medical Officer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>Consultation Time</span>
              </label>
              <input
                type="text"
                value={consultationTime}
                onChange={e => setConsultationTime(e.target.value)}
                placeholder="e.g. 10:30 AM, 04:00 PM"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp / SMS Notification Preview</span>
              </label>
              <button
                type="button"
                onClick={handleCopyAlert}
                className="text-[11px] text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{isCopied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
              {alertMessage}
            </div>
          </div>

          {/* Action Dispatch Buttons */}
          <div className="pt-2 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              title="Launch WhatsApp with pre-filled message"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Send WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleSendSMS}
              className="w-full py-3 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition-all cursor-pointer"
              title="Launch SMS composer with pre-filled message"
            >
              <Smartphone className="w-4 h-4" />
              <span>Send SMS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
