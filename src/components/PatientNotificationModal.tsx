import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  MessageCircle,
  Smartphone,
  Send,
  Copy,
  Check,
  RotateCcw,
  Languages,
  User,
  Phone,
  Calendar,
  Pill,
  Clock,
  FileCheck,
  Stethoscope,
  Sparkles,
  History,
  AlertCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import { Patient, PatientNotification, RefillReminder } from '../types';
import { StorageService } from '../services/storage';
import { copyToClipboardSafely } from '../utils/billShareUtils';

interface PatientNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPatient?: Patient | null;
  initialChannel?: 'WhatsApp' | 'SMS';
  initialTemplate?: 'refill' | 'rx_ready' | 'appointment' | 'health_tip' | 'custom';
  initialReference?: {
    reminderId?: string;
    medicineName?: string;
    dueDate?: string;
    billId?: string;
    amount?: number;
    doctorName?: string;
    appointmentDate?: string;
    timeSlot?: string;
  };
  onNotificationSent?: (notification: PatientNotification) => void;
}

type TemplateType = 'refill' | 'rx_ready' | 'appointment' | 'health_tip' | 'custom';

export const PatientNotificationModal: React.FC<PatientNotificationModalProps> = ({
  isOpen,
  onClose,
  initialPatient,
  initialChannel = 'WhatsApp',
  initialTemplate = 'refill',
  initialReference,
  onNotificationSent
}) => {
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [phoneOverride, setPhoneOverride] = useState<string>('');
  const [channel, setChannel] = useState<'WhatsApp' | 'SMS'>(initialChannel);
  const [templateType, setTemplateType] = useState<TemplateType>(initialTemplate);
  const [language, setLanguage] = useState<'en' | 'ta'>('en');

  // Dynamic template field states
  const [medName, setMedName] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [billAmount, setBillAmount] = useState<string>('');
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [doctorName, setDoctorName] = useState<string>('');
  const [appointmentSlot, setAppointmentSlot] = useState<string>('');
  const [customBody, setCustomBody] = useState<string>('');

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const pharmacyProfile = useMemo(() => StorageService.getPharmacyProfile(), []);

  // Initialize patients and active patient
  useEffect(() => {
    if (isOpen) {
      const patients = StorageService.getPatients();
      setAllPatients(patients);

      const targetPat = initialPatient || patients[0];
      if (targetPat) {
        setSelectedPatientId(targetPat.id);
        setPhoneOverride(targetPat.phone);
      }

      setChannel(initialChannel);
      setTemplateType(initialTemplate);

      // Populate reference details
      if (initialReference?.medicineName) setMedName(initialReference.medicineName);
      else if (targetPat?.refillReminders?.[0]?.medicineName) {
        setMedName(targetPat.refillReminders[0].medicineName);
      } else {
        setMedName('Glycomet-GP 1 / Telma 40');
      }

      if (initialReference?.dueDate) setDueDate(initialReference.dueDate);
      else if (targetPat?.refillReminders?.[0]?.nextRefillDue) {
        setDueDate(targetPat.refillReminders[0].nextRefillDue);
      } else {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        setDueDate(d.toISOString().split('T')[0]);
      }

      if (initialReference?.amount) setBillAmount(initialReference.amount.toString());
      else setBillAmount('480');

      if (initialReference?.billId) setInvoiceId(initialReference.billId);
      else setInvoiceId('INV-2026-089');

      if (initialReference?.doctorName) setDoctorName(initialReference.doctorName);
      else setDoctorName('Dr. S. Meenakshi Sundaram, MD (Gen Med)');

      if (initialReference?.appointmentDate) {
        setAppointmentSlot(`${initialReference.appointmentDate} at ${initialReference.timeSlot || '10:30 AM'}`);
      } else {
        setAppointmentSlot('Tomorrow at 10:30 AM');
      }

      setSendSuccess(null);
      setIsCopied(false);
    }
  }, [isOpen, initialPatient, initialChannel, initialTemplate, initialReference]);

  const activePatient = useMemo(() => {
    return allPatients.find(p => p.id === selectedPatientId) || initialPatient || allPatients[0];
  }, [allPatients, selectedPatientId, initialPatient]);

  // When patient changes, sync phone & refill suggestion
  const handlePatientSelect = (patId: string) => {
    setSelectedPatientId(patId);
    const pat = allPatients.find(p => p.id === patId);
    if (pat) {
      setPhoneOverride(pat.phone);
      if (pat.refillReminders && pat.refillReminders.length > 0) {
        setMedName(pat.refillReminders[0].medicineName);
        setDueDate(pat.refillReminders[0].nextRefillDue);
      }
    }
  };

  // Compile final message according to template, language, and fields
  const finalMessage = useMemo(() => {
    const pName = activePatient?.name || 'Customer';
    const pharmacyName = pharmacyProfile.name || 'City Medical';
    const pharmacyPhone = pharmacyProfile.mobile || '+91 98421 87654';

    if (templateType === 'refill') {
      if (language === 'ta') {
        return `வணக்கம் ${pName} அவர்களே, ${pharmacyName}, மேலூர் சார்பாக மருந்து மறுநிரப்பல் நினைவுறுத்தல். உங்கள் மருந்து: ${medName || 'மாதாந்திர மருந்து'}. உரிய தேதி: ${dueDate || 'விரைவில்'}. உடனடி இலவச டோர் டெலிவரிக்கு தொடர்பு கொள்ளவும்: ${pharmacyPhone}. ஆரோக்கியம் காப்போம்!`;
      }
      return `Vanakkam ${pName}, this is a gentle refill reminder from ${pharmacyName}, Melur. Your medication ${medName || 'monthly prescription'} is due for refill on ${dueDate || 'upcoming date'}. Call or WhatsApp us at ${pharmacyPhone} for free doorstep delivery. Wishing you good health!`;
    }

    if (templateType === 'rx_ready') {
      if (language === 'ta') {
        return `வணக்கம் ${pName}, ${pharmacyName}, மேலூரில் உங்கள் மருந்துப் பட்டியல் (${invoiceId || 'பில்'}) தயாராக பேக் செய்யப்பட்டுள்ளது. பில் தொகை: ₹${billAmount || '0'}. மருந்து கடையிலோ அல்லது டோர் டெலிவரியிலோ பெற்றுக்கொள்ளலாம். தொடர்பு: ${pharmacyPhone}.`;
      }
      return `Dear ${pName}, your medicine order from ${pharmacyName}, Melur (${invoiceId || 'Bill'}) is packed and ready for pickup. Total Bill Amount: Rs. ${billAmount || '0'}. You can collect at our counter or call ${pharmacyPhone} for local delivery. Thank you!`;
    }

    if (templateType === 'appointment') {
      if (language === 'ta') {
        return `வணக்கம் ${pName}, ${doctorName || 'மருத்துவர்'} உடனான உங்கள் கிளினிக் சந்திப்பு நேரம்: ${appointmentSlot || 'நாளை'}. இடம்: ${pharmacyName} கிளினிக் போர்ட்டல், மேலூர். தயவுசெய்து 10 நிமிடங்கள் முன்பாக வரவும். அவசர உதவிக்கு: ${pharmacyPhone}.`;
      }
      return `Hello ${pName}, your OPD consultation with ${doctorName || 'the doctor'} is confirmed for ${appointmentSlot || 'scheduled time'} at ${pharmacyName} Clinic, Melur. Please arrive 10 mins prior. For inquiries call: ${pharmacyPhone}.`;
    }

    if (templateType === 'health_tip') {
      if (language === 'ta') {
        return `அன்பான ${pName}, ${pharmacyName} மருத்துவக் குழுவின் ஆரோக்கிய குறிப்பு: உங்கள் நாள்பட்ட நோய்களுக்கான மாத்திரைகளை தினமும் குறித்த நேரத்தில் உட்கொள்ளவும், போதுமான தண்ணீர் குடிக்கவும். ஏதேனும் மருந்து ஆலோசனைக்கு அணுகவும்: ${pharmacyPhone}.`;
      }
      return `Dear ${pName}, care reminder from ${pharmacyName}: Remember to take your prescribed medications on time with meals as advised. Keep monitoring your blood pressure and sugar levels. We are always here for your care at ${pharmacyPhone}.`;
    }

    // Custom
    if (customBody.trim()) {
      return customBody
        .replace(/{PatientName}/g, pName)
        .replace(/{PharmacyName}/g, pharmacyName)
        .replace(/{Phone}/g, pharmacyPhone)
        .replace(/{Date}/g, dueDate || new Date().toLocaleDateString('en-IN'));
    }

    return `Vanakkam ${pName}, greetings from ${pharmacyName}, Melur. Please reach us at ${pharmacyPhone} for any pharmaceutical inquiries.`;
  }, [
    templateType,
    language,
    activePatient,
    pharmacyProfile,
    medName,
    dueDate,
    billAmount,
    invoiceId,
    doctorName,
    appointmentSlot,
    customBody
  ]);

  // Clean Indian phone format
  const sanitizedPhone = useMemo(() => {
    const raw = (phoneOverride || activePatient?.phone || '').replace(/[^0-9]/g, '');
    if (!raw) return '';
    if (raw.length === 10) return `91${raw}`;
    return raw;
  }, [phoneOverride, activePatient]);

  const smsSegments = useMemo(() => {
    const len = finalMessage.length;
    // Standard GSM 160 chars per segment, or 70 if unicode
    const isUnicode = /[^\u0000-\u00ff]/.test(finalMessage);
    const segmentSize = isUnicode ? 70 : 160;
    const count = Math.ceil(len / segmentSize) || 1;
    return { len, segmentSize, count, isUnicode };
  }, [finalMessage]);

  // Copy to clipboard
  const handleCopy = async () => {
    await copyToClipboardSafely(finalMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2200);
  };

  // Record notification into storage & trigger external app
  const handleSend = async (overrideChannel?: 'WhatsApp' | 'SMS') => {
    const targetChannel = overrideChannel || channel;
    const phoneToUse = sanitizedPhone;

    if (!phoneToUse) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      setTimeout(() => setPhoneError(null), 4000);
      return;
    }
    setPhoneError(null);

    // Create Notification Record
    const newNotif: PatientNotification = {
      id: `notif-${Date.now().toString().slice(-6)}`,
      patientId: activePatient?.id || 'guest',
      patientName: activePatient?.name || 'Customer',
      patientPhone: phoneOverride || activePatient?.phone || '',
      channel: targetChannel,
      templateType,
      message: finalMessage,
      status: 'Sent',
      sentAt: new Date().toISOString(),
      referenceId: initialReference?.reminderId || initialReference?.billId,
      language
    };

    StorageService.addPatientNotification(newNotif);

    // If this was a refill reminder, update its status
    if (initialReference?.reminderId && activePatient?.id) {
      StorageService.markRefillReminderSent(activePatient.id, initialReference.reminderId);
    }

    if (onNotificationSent) {
      onNotificationSent(newNotif);
    }

    // Launch external app
    await copyToClipboardSafely(finalMessage);

    if (targetChannel === 'WhatsApp') {
      const encoded = encodeURIComponent(finalMessage);
      const url = `https://wa.me/${phoneToUse}?text=${encoded}`;
      try {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        console.warn(e);
      }
      setSendSuccess(`WhatsApp opened & message copied for ${activePatient?.name} (${phoneToUse})!`);
    } else {
      // SMS URI
      const encoded = encodeURIComponent(finalMessage);
      const smsUri = `sms:+${phoneToUse}?body=${encoded}`;
      try {
        const a = document.createElement('a');
        a.href = smsUri;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        console.warn(e);
      }
      setSendSuccess(`SMS composer opened & message copied for ${activePatient?.name} (${phoneToUse})!`);
    }

    setTimeout(() => setSendSuccess(null), 4000);
  };

  // Recent notifications for this patient
  const patientNotifications = useMemo(() => {
    if (!activePatient) return [];
    const all = StorageService.getPatientNotifications();
    return all.filter(n => n.patientId === activePatient.id || n.patientPhone === activePatient.phone);
  }, [activePatient, sendSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight">Patient Notification Gateway</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Direct SMS & WhatsApp
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Send personalized prescription, refill, and clinic updates directly to patient phone
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Bar */}
        {sendSuccess && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-all">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-200" />
              <span>{sendSuccess}</span>
            </div>
            <button
              onClick={() => setSendSuccess(null)}
              className="text-emerald-200 hover:text-white text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Top Controls Grid: Patient, Channel, Language */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. Recipient Patient */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Recipient Patient</span>
              </label>
              <select
                value={selectedPatientId}
                onChange={e => handlePatientSelect(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {allPatients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.phone})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 pt-1">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={phoneOverride}
                  onChange={e => setPhoneOverride(e.target.value)}
                  placeholder="Mobile number with country code"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* 2. Dispatch Channel */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-slate-400" />
                <span>Notification Channel</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setChannel('WhatsApp')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                    channel === 'WhatsApp'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('SMS')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                    channel === 'SMS'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-white" />
                  <span>Carrier SMS</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-500 pt-0.5 flex items-center justify-between">
                <span>{channel === 'WhatsApp' ? 'Opens WhatsApp chat directly' : 'Opens native device SMS composer'}</span>
                <span className="font-semibold text-emerald-700">+91 Ready</span>
              </div>
            </div>

            {/* 3. Language Selection */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-slate-400" />
                <span>Message Language</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                    language === 'en'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>English</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage('ta')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                    language === 'ta'
                      ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>தமிழ் (Tamil)</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-500 pt-0.5">
                <span>{language === 'ta' ? 'மேலூர் உள்ளூர் தமிழ் அறிவிப்பு' : 'Standard clinical English'}</span>
              </div>
            </div>
          </div>

          {/* Template Selectors */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Select Pharmacy & Clinical Notification Template</span>
              <span className="text-[11px] text-emerald-700 font-semibold normal-case">
                Click template below to autofill
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setTemplateType('refill')}
                className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  templateType === 'refill'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <Pill className="w-4 h-4" />
                  <span className="font-bold text-xs">Refill Due</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2">
                  Chronic medication renewal alert
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('rx_ready')}
                className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  templateType === 'rx_ready'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-blue-700">
                  <FileCheck className="w-4 h-4" />
                  <span className="font-bold text-xs">Order Ready</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2">
                  Medicines packed & total bill ready
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('appointment')}
                className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  templateType === 'appointment'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-purple-700">
                  <Stethoscope className="w-4 h-4" />
                  <span className="font-bold text-xs">OPD Doctor</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2">
                  Doctor appointment confirmation
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('health_tip')}
                className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  templateType === 'health_tip'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-amber-700">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-bold text-xs">Advisory</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2">
                  Care guidance & wellness tip
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('custom')}
                className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  templateType === 'custom'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-slate-700">
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-bold text-xs">Custom</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2">
                  Type personalized free-form text
                </p>
              </button>
            </div>
          </div>

          {/* Dynamic Inputs for Context Variables */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-teal-600" />
              <span>Customize Variables for {templateType.toUpperCase().replace('_', ' ')}:</span>
            </div>

            {templateType === 'refill' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Medicine Name</label>
                  <input
                    type="text"
                    value={medName}
                    onChange={e => setMedName(e.target.value)}
                    placeholder="e.g. Glycomet-GP 1 / Telma 40"
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Next Refill Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>
            )}

            {templateType === 'rx_ready' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Invoice / Bill ID</label>
                  <input
                    type="text"
                    value={invoiceId}
                    onChange={e => setInvoiceId(e.target.value)}
                    placeholder="e.g. INV-2026-089"
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Total Bill Amount (₹)</label>
                  <input
                    type="number"
                    value={billAmount}
                    onChange={e => setBillAmount(e.target.value)}
                    placeholder="e.g. 480"
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>
            )}

            {templateType === 'appointment' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Doctor Name & Title</label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    placeholder="e.g. Dr. S. Meenakshi Sundaram, MD"
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Appointment Date & Time</label>
                  <input
                    type="text"
                    value={appointmentSlot}
                    onChange={e => setAppointmentSlot(e.target.value)}
                    placeholder="e.g. Tomorrow at 10:30 AM"
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>
            )}

            {templateType === 'custom' && (
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                  <span>Custom Message Template</span>
                  <span className="text-[10px] text-slate-400">Tokens: {`{PatientName}`}, {`{PharmacyName}`}, {`{Phone}`}</span>
                </label>
                <textarea
                  rows={3}
                  value={customBody}
                  onChange={e => setCustomBody(e.target.value)}
                  placeholder="Vanakkam {PatientName}, this is City Medical Melur..."
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Two Columns: Live Preview vs Message Text Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left: Interactive Preview (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-4 text-white shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      channel === 'WhatsApp' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                  />
                  <span className="text-xs font-bold tracking-wide">
                    {channel === 'WhatsApp' ? 'WhatsApp Live Preview' : 'Carrier SMS Preview'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {sanitizedPhone ? `+${sanitizedPhone}` : 'No phone set'}
                </span>
              </div>

              {/* Message Simulation Bubble */}
              <div className="py-2">
                <div className="text-[10px] text-center text-slate-400 font-mono mb-2">
                  Today • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                {channel === 'WhatsApp' ? (
                  <div className="bg-[#005c4b] text-emerald-50 rounded-2xl rounded-tr-xs p-3.5 shadow-md space-y-2 text-xs leading-relaxed border border-emerald-500/20">
                    <div className="font-bold text-[11px] text-emerald-300 pb-0.5 flex items-center justify-between border-b border-emerald-400/20">
                      <span>{pharmacyProfile.name || 'City Medical Melur'}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-400/30 text-emerald-200">Verified Rx</span>
                    </div>
                    <p className="whitespace-pre-wrap font-sans">{finalMessage}</p>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-300/80 pt-1">
                      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-emerald-400 font-black">✓✓</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-600 text-white rounded-2xl rounded-bl-xs p-3.5 shadow-md space-y-1.5 text-xs leading-relaxed">
                    <div className="text-[10px] font-bold text-blue-200 flex items-center justify-between border-b border-blue-400/30 pb-1">
                      <span>SMS Gateway (VM-CITYMED)</span>
                      <span>160 char segs</span>
                    </div>
                    <p className="whitespace-pre-wrap font-sans">{finalMessage}</p>
                    <div className="text-[9px] text-blue-200/80 text-right">
                      Delivered via Carrier
                    </div>
                  </div>
                )}
              </div>

              {/* Character Counter & Specs */}
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                <span>
                  Length: <strong className="text-white">{smsSegments.len}</strong> chars
                </span>
                <span>
                  Segment count: <strong className="text-emerald-400">{smsSegments.count} SMS</strong>
                </span>
              </div>
            </div>

            {/* Right: Message Content Inspector & Actions (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Compiled Dispatch Text
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed min-h-[140px] max-h-[220px] overflow-y-auto">
                {finalMessage}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleSend('WhatsApp')}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send via WhatsApp (+91)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSend('SMS')}
                  className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Send via Carrier SMS</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                <button
                  type="button"
                  onClick={() => setShowHistory(prev => !prev)}
                  className="font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>
                    {showHistory ? 'Hide' : 'View'} Notification History for {activePatient?.name} ({patientNotifications.length})
                  </span>
                </button>

                <span className="text-slate-400 text-[10px]">
                  Records saved in secure audit log
                </span>
              </div>
            </div>
          </div>

          {/* Past Communication History for this patient */}
          {showHistory && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-teal-600" />
                  <span>Recent Notifications Dispatched to {activePatient?.name}</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  Total logged: {patientNotifications.length}
                </span>
              </div>

              {patientNotifications.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No prior notifications sent to this patient.</p>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto">
                  {patientNotifications.map(notif => (
                    <div key={notif.id} className="p-3 text-xs flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              notif.channel === 'WhatsApp'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {notif.channel}
                          </span>
                          <span className="font-bold text-slate-800 capitalize">
                            {notif.templateType.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.sentAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] line-clamp-2">{notif.message}</p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            await copyToClipboardSafely(notif.message);
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2000);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <Info className="w-3.5 h-3.5 text-teal-600" />
            <span>Targeting {activePatient?.name} • Mobile: {sanitizedPhone ? `+${sanitizedPhone}` : 'N/A'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
};
