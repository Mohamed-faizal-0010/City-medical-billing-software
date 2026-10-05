import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Bell,
  Phone,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  UserCheck,
  FileHeart,
  X,
  ShieldAlert,
  ShoppingCart,
  MessageCircle,
  Smartphone,
  Copy,
  Check,
  RotateCcw,
  SlidersHorizontal,
  History,
  Sparkles
} from 'lucide-react';
import { Patient, RefillReminder, Medicine, PatientNotification } from '../types';
import { StorageService } from '../services/storage';
import { PatientNotificationModal } from '../components/PatientNotificationModal';
import { PatientConsultationAlertModal } from '../components/PatientConsultationAlertModal';
import { copyToClipboardSafely } from '../utils/billShareUtils';

interface PatientsViewProps {
  onSelectPatientForPOS?: (patient: Patient) => void;
  onRefreshData?: () => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  onSelectPatientForPOS,
  onRefreshData
}) => {
  const [patients, setPatients] = useState<Patient[]>(() => StorageService.getPatients());
  const [medicines] = useState<Medicine[]>(() => StorageService.getMedicines());
  const [notifications, setNotifications] = useState<PatientNotification[]>(() => StorageService.getPatientNotifications());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'refills' | 'all' | 'notifications'>('refills');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showAddReminderModal, setShowAddReminderModal] = useState<Patient | null>(null);

  // Consultation Alert Modal States
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [consultationModalPatient, setConsultationModalPatient] = useState<Patient | null>(null);

  // Notification Modal States
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [modalPatient, setModalPatient] = useState<Patient | null>(null);
  const [modalChannel, setModalChannel] = useState<'WhatsApp' | 'SMS'>('WhatsApp');
  const [modalTemplate, setModalTemplate] = useState<'refill' | 'rx_ready' | 'appointment' | 'health_tip' | 'custom'>('refill');
  const [modalReference, setModalReference] = useState<any>(null);

  // Notification Audit Log Filters
  const [notifChannelFilter, setNotifChannelFilter] = useState<'All' | 'WhatsApp' | 'SMS'>('All');
  const [notifTypeFilter, setNotifTypeFilter] = useState<string>('All');
  const [copiedNotifId, setCopiedNotifId] = useState<string | null>(null);

  // New patient form
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(45);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [conditionsText, setConditionsText] = useState('');
  const [consultDoctor, setConsultDoctor] = useState('Dr. Robert Chen, MD');
  const [consultTime, setConsultTime] = useState('10:30 AM');

  const doctors = useMemo(() => StorageService.getDoctors(), []);
  const nextTokenPreview = useMemo(() => StorageService.getNextDailyTokenNumber(), [showAddPatientModal]);

  // New reminder form
  const [reminderMedName, setReminderMedName] = useState('');
  const [reminderDosage, setReminderDosage] = useState('1 tablet daily after food');
  const [reminderDaysSupply, setReminderDaysSupply] = useState(30);

  const pharmacyProfile = StorageService.getPharmacyProfile();

  const reload = () => {
    setPatients(StorageService.getPatients());
    setNotifications(StorageService.getPatientNotifications());
    if (onRefreshData) onRefreshData();
  };

  // Open the rich Notification Modal
  const handleOpenNotificationModal = (
    patient?: Patient | null,
    channel: 'WhatsApp' | 'SMS' = 'WhatsApp',
    template: 'refill' | 'rx_ready' | 'appointment' | 'health_tip' | 'custom' = 'refill',
    refData?: any
  ) => {
    setModalPatient(patient || null);
    setModalChannel(channel);
    setModalTemplate(template);
    setModalReference(refData || null);
    setShowNotificationModal(true);
  };

  // Quick Send WhatsApp for Refill
  const handleQuickSendWhatsApp = (patientId: string, reminderId: string, phone: string, patientName: string, medName: string, dueDate: string) => {
    StorageService.markRefillReminderSent(patientId, reminderId);

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
    const msg = `Vanakkam ${patientName}, this is a gentle reminder from ${pharmacyProfile.name}, Melur. Your prescription for ${medName} is due for refill on ${dueDate || 'upcoming date'}. Please visit us or call ${pharmacyProfile.mobile} for free doorstep delivery.`;

    // Record in notification audit log
    StorageService.addPatientNotification({
      id: `notif-${Date.now().toString().slice(-6)}`,
      patientId,
      patientName,
      patientPhone: phone,
      channel: 'WhatsApp',
      templateType: 'refill',
      message: msg,
      status: 'Sent',
      sentAt: new Date().toISOString(),
      referenceId: reminderId,
      language: 'en'
    });

    reload();

    copyToClipboardSafely(msg);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    try {
      const a = document.createElement('a');
      a.href = whatsappUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn('WhatsApp launch error', e);
    }
  };

  // Quick Send SMS for Refill
  const handleQuickSendSMS = (patientId: string, reminderId: string, phone: string, patientName: string, medName: string, dueDate: string) => {
    StorageService.markRefillReminderSent(patientId, reminderId);

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
    const msg = `Vanakkam ${patientName}, refill reminder from ${pharmacyProfile.name}, Melur for ${medName} due on ${dueDate || 'soon'}. Call ${pharmacyProfile.mobile} for door delivery.`;

    StorageService.addPatientNotification({
      id: `notif-${Date.now().toString().slice(-6)}`,
      patientId,
      patientName,
      patientPhone: phone,
      channel: 'SMS',
      templateType: 'refill',
      message: msg,
      status: 'Sent',
      sentAt: new Date().toISOString(),
      referenceId: reminderId,
      language: 'en'
    });

    reload();

    copyToClipboardSafely(msg);
    const smsUri = `sms:+${formattedPhone}?body=${encodeURIComponent(msg)}`;
    try {
      const a = document.createElement('a');
      a.href = smsUri;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn('SMS dispatch error', e);
    }
  };

  // Record Refill Completed
  const handleRecordRefilled = (patientId: string, reminderId: string) => {
    StorageService.recordRefillCompleted(patientId, reminderId);
    reload();
  };

  // Add Patient & Issue Sequential Registration Token
  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const tokenInfo = StorageService.getNextDailyTokenNumber();
    const newPatient: Patient = {
      id: `pat-${Date.now().toString().slice(-4)}`,
      name,
      age: Number(age),
      gender,
      phone,
      email: email || undefined,
      address: address || 'Melur, Madurai',
      tokenNumber: tokenInfo.tokenNumber,
      tokenFormatted: tokenInfo.tokenFormatted,
      tokenDate: tokenInfo.tokenDate,
      consultationDoctorName: consultDoctor || (doctors[0]?.name || 'Dr. Robert Chen, MD'),
      consultationTime: consultTime || '10:30 AM',
      consultationStatus: 'Waiting',
      chronicConditions: conditionsText ? conditionsText.split(',').map(s => s.trim()).filter(Boolean) : [],
      drugAllergies: allergiesText ? allergiesText.split(',').map(s => s.trim()).filter(Boolean) : [],
      prescriptions: [],
      refillReminders: []
    };

    StorageService.updatePatient(newPatient);
    reload();
    setShowAddPatientModal(false);
    // Reset
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setAllergiesText('');
    setConditionsText('');

    // Open consultation alert modal directly with newly registered token
    setConsultationModalPatient(newPatient);
    setShowConsultationModal(true);
  };

  // Add Refill Reminder to Patient
  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddReminderModal || !reminderMedName) return;

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + Number(reminderDaysSupply));

    const newReminder: RefillReminder = {
      id: `rem-${Date.now().toString().slice(-4)}`,
      medicineName: reminderMedName,
      dosage: reminderDosage,
      daysSupply: Number(reminderDaysSupply),
      nextRefillDue: nextDueDate.toISOString().split('T')[0],
      status: 'Scheduled',
      autoNotify: true
    };

    const targetPatient = patients.find(p => p.id === showAddReminderModal.id);
    if (targetPatient) {
      targetPatient.refillReminders.push(newReminder);
      StorageService.updatePatient(targetPatient);
      reload();
    }
    setShowAddReminderModal(null);
    setReminderMedName('');
  };

  const filteredPatients = useMemo(() => {
    return (patients || []).filter(p => {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (p.chronicConditions || []).some(c => c.toLowerCase().includes(q)) ||
        (p.drugAllergies || []).some(a => a.toLowerCase().includes(q))
      );
    });
  }, [patients, searchQuery]);

  // All active refill reminders across patients
  const allRefillReminders = useMemo(() => {
    return (patients || []).flatMap(patient =>
      (patient.refillReminders || []).map(reminder => ({
        ...reminder,
        patientName: patient.name,
        patientPhone: patient.phone,
        patientId: patient.id
      }))
    );
  }, [patients]);

  const dueSoonCount = allRefillReminders.filter(r => r.status === 'Due Soon' || r.status === 'Overdue').length;

  // Filtered Notifications for Audit Log Tab
  const filteredNotifications = useMemo(() => {
    return (notifications || []).filter(n => {
      const matchChannel = notifChannelFilter === 'All' || n.channel === notifChannelFilter;
      const matchType = notifTypeFilter === 'All' || n.templateType === notifTypeFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        n.patientName.toLowerCase().includes(q) ||
        n.patientPhone.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q);
      return matchChannel && matchType && matchSearch;
    });
  }, [notifications, notifChannelFilter, notifTypeFilter, searchQuery]);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600" />
            <span>Patient Health Records & Automated Refills</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Chronic medication schedules, allergy warnings, and WhatsApp & SMS patient alerts
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleOpenNotificationModal(null, 'WhatsApp', 'refill')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm rounded-xl shadow-xs transition-colors self-start sm:self-auto"
            id="send-patient-notification-btn"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Send SMS / WhatsApp</span>
          </button>

          <button
            onClick={() => setShowAddPatientModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-xs transition-colors self-start sm:self-auto"
            id="add-patient-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Patients</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{patients.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Encrypted electronic health files</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200 bg-amber-50/40 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Refills Due Soon / Overdue</div>
            <Bell className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">{dueSoonCount}</div>
          <div className="text-xs text-amber-700 font-medium mt-0.5">Require customer reminder dispatch</div>
        </div>

        <div
          onClick={() => setActiveTab('notifications')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group"
          title="Click to view notification history"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Automated Notification Channel</div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200 transition-colors">
              {notifications.length} Sent
            </span>
          </div>
          <div className="text-lg font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp & SMS Gateway</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
            <span>One-tap personalized alerts</span>
            <span className="text-teal-700 font-bold group-hover:underline text-[11px]">View Log &rarr;</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('refills')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-colors whitespace-nowrap ${
              activeTab === 'refills'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Refill Reminders ({allRefillReminders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Patient Profiles ({patients.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-colors whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Notification Audit Log ({notifications.length})</span>
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search patient, phone, allergy..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Tab 1: Refill Reminders Queue */}
      {activeTab === 'refills' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Patient Name & Phone</th>
                  <th className="py-3 px-4">Medication & Dosage</th>
                  <th className="py-3 px-4">Supply Duration</th>
                  <th className="py-3 px-4">Next Refill Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allRefillReminders.map(rem => {
                  const isDue = rem.status === 'Due Soon' || rem.status === 'Overdue';
                  const isRefilled = rem.status === 'Refilled';

                  return (
                    <tr key={rem.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{rem.patientName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 font-mono mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{rem.patientPhone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">{rem.medicineName}</span>
                        <div className="text-xs text-slate-500">{rem.dosage}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                        {rem.daysSupply} days supply
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`font-mono text-xs font-bold ${isDue ? 'text-amber-700' : 'text-slate-700'}`}>
                          {rem.nextRefillDue}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            rem.status === 'Due Soon'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : rem.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : rem.status === 'Sent'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : rem.status === 'Refilled'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {rem.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickSendWhatsApp(
                                rem.patientId,
                                rem.id,
                                rem.patientPhone,
                                rem.patientName,
                                rem.medicineName,
                                rem.nextRefillDue
                              )
                            }
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                            title="Send quick refill alert via WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleQuickSendSMS(
                                rem.patientId,
                                rem.id,
                                rem.patientPhone,
                                rem.patientName,
                                rem.medicineName,
                                rem.nextRefillDue
                              )
                            }
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                            title="Send carrier SMS refill reminder"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>SMS</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const targetPat = patients.find(p => p.id === rem.patientId);
                              handleOpenNotificationModal(targetPat, 'WhatsApp', 'refill', {
                                reminderId: rem.id,
                                medicineName: rem.medicineName,
                                dueDate: rem.nextRefillDue
                              });
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Customize message, switch language, or preview"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>

                          {!isRefilled && (
                            <button
                              type="button"
                              onClick={() => handleRecordRefilled(rem.patientId, rem.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              Mark Refilled
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: All Patient Profiles */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map(patient => (
            <div
              key={patient.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{patient.name}</h3>
                      {patient.tokenFormatted && (
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-teal-100 text-teal-900 border border-teal-200">
                          Token {patient.tokenFormatted}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {patient.gender}, {patient.age} yrs • ID: {patient.id}
                      {patient.consultationTime && ` • OPD: ${patient.consultationTime}`}
                    </p>
                  </div>
                  {(patient.drugAllergies || []).length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      <span>{(patient.drugAllergies || []).length} Allergies</span>
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-2 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{patient.phone}</span>
                  </div>
                  <div className="text-slate-500 truncate">{patient.address}</div>
                </div>

                {/* Chronic Conditions & Allergies Tags */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  {(patient.chronicConditions || []).length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Chronic Care
                      </span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {(patient.chronicConditions || []).map((cond, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                          >
                            {cond}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(patient.drugAllergies || []).length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                        Drug Allergies
                      </span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {(patient.drugAllergies || []).map((allg, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md"
                          >
                            {allg}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowAddReminderModal(patient)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  + Add Refill
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setConsultationModalPatient(patient);
                      setShowConsultationModal(true);
                    }}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                    title="Send Consultation Time & Token Alert via WhatsApp / SMS"
                  >
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Token Alert</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenNotificationModal(patient, 'WhatsApp', 'refill')}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                    title="Send SMS or WhatsApp notification to this patient"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Notify</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(patient)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors"
                  >
                    View Health File
                  </button>
                  {onSelectPatientForPOS && (
                    <button
                      type="button"
                      onClick={() => onSelectPatientForPOS(patient)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Activate customer phone and profile in POS Billing"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Bill POS</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Notification Audit Log */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {/* Sub-Filters & Actions Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs">
                {(['All', 'WhatsApp', 'SMS'] as const).map(ch => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setNotifChannelFilter(ch)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      notifChannelFilter === ch
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {ch === 'All' ? 'All Channels' : ch}
                  </button>
                ))}
              </div>

              <select
                value={notifTypeFilter}
                onChange={e => setNotifTypeFilter(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="All">All Notification Types</option>
                <option value="refill">Refill Reminders</option>
                <option value="rx_ready">Rx / Order Ready</option>
                <option value="appointment">OPD Consultation</option>
                <option value="health_tip">Care Advisory</option>
                <option value="custom">Custom Messages</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleOpenNotificationModal(null, 'WhatsApp', 'refill')}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Compose & Dispatch Notification</span>
            </button>
          </div>

          {/* Audit Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Recipient Patient</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Message Content</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNotifications.map(notif => {
                    const cleanPhone = (notif.patientPhone || '').replace(/[^0-9]/g, '');
                    const formattedPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;

                    return (
                      <tr key={notif.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                          {new Date(notif.sentAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{notif.patientName}</div>
                          <div className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{notif.patientPhone}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              notif.channel === 'WhatsApp'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {notif.channel === 'WhatsApp' ? (
                              <MessageCircle className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Smartphone className="w-3 h-3 text-blue-600" />
                            )}
                            <span>{notif.channel}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-semibold text-slate-700 capitalize px-2 py-0.5 bg-slate-100 rounded-md">
                            {notif.templateType.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="text-xs text-slate-700 line-clamp-2 leading-relaxed" title={notif.message}>
                            {notif.message}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" />
                            <span>{notif.status}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={async () => {
                                await copyToClipboardSafely(notif.message);
                                setCopiedNotifId(notif.id);
                                setTimeout(() => setCopiedNotifId(null), 2000);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                              title="Copy message text"
                            >
                              {copiedNotifId === notif.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            {notif.channel === 'WhatsApp' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  copyToClipboardSafely(notif.message);
                                  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(notif.message)}`;
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
                                }}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                title="Resend in WhatsApp"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Resend</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  copyToClipboardSafely(notif.message);
                                  const smsUri = `sms:+${formattedPhone}?body=${encodeURIComponent(notif.message)}`;
                                  try {
                                    const a = document.createElement('a');
                                    a.href = smsUri;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                  } catch (e) {
                                    console.warn(e);
                                  }
                                }}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                title="Resend in SMS"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Resend</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredNotifications.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs italic">
                        No dispatched notifications match the selected criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Patient Health File Drawer */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{selectedPatient.name}</h3>
                <p className="text-xs text-slate-500">
                  {selectedPatient.gender}, {selectedPatient.age} years • Phone: {selectedPatient.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Allergies Warning Strip */}
            {(selectedPatient.drugAllergies || []).length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-900 text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>CRITICAL DRUG ALLERGY WARNING:</strong>{' '}
                  {(selectedPatient.drugAllergies || []).join(', ')}. Do not dispense matching compounds.
                </span>
              </div>
            )}

            {/* Past Prescriptions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Prescription History
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {(selectedPatient.prescriptions || []).map(rx => (
                  <div key={rx.id} className="p-3 bg-white text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Doctor: {rx.doctorName}</span>
                      <span className="text-slate-500 font-mono">{rx.date}</span>
                    </div>
                    <p className="text-slate-600">Diagnosis: {rx.diagnosis}</p>
                    <div className="space-y-0.5 pt-1">
                      {(rx.items || []).map((it, idx) => (
                        <div key={idx} className="text-slate-700 font-mono text-[11px]">
                          • {it.medicineName} ({it.dosage} for {it.durationDays} days) - Qty: {it.quantity}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(selectedPatient.prescriptions || []).length === 0 && (
                  <p className="text-center text-slate-400 py-3 text-xs">No past prescriptions recorded</p>
                )}
              </div>
            </div>

            {/* Notifications Sent to this patient */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-teal-600" />
                  <span>Dispatched Notifications Log</span>
                </h4>
                <button
                  type="button"
                  onClick={() => handleOpenNotificationModal(selectedPatient, 'WhatsApp', 'refill')}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Send Notification</span>
                </button>
              </div>

              {notifications.filter(n => n.patientId === selectedPatient.id || n.patientPhone === selectedPatient.phone).length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">No prior notifications sent to this patient.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 max-h-36 overflow-y-auto">
                  {notifications
                    .filter(n => n.patientId === selectedPatient.id || n.patientPhone === selectedPatient.phone)
                    .map(notif => (
                      <div key={notif.id} className="p-2.5 text-xs flex items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                                notif.channel === 'WhatsApp' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {notif.channel}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(notif.sentAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] line-clamp-1">{notif.message}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleOpenNotificationModal(selectedPatient, 'WhatsApp', 'refill')}
                className="py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-xs text-xs flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send SMS / WhatsApp</span>
              </button>

              {onSelectPatientForPOS && (
                <button
                  onClick={() => {
                    onSelectPatientForPOS(selectedPatient);
                    setSelectedPatient(null);
                  }}
                  className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs text-xs flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Start New POS Sale for {selectedPatient.name}</span>
                </button>
              )}
              <button
                onClick={() => setSelectedPatient(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Patient Modal */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Register New Patient File</h3>
                <p className="text-xs text-slate-500">Auto-issues sequential token and prepares consultation alert</p>
              </div>
              <button
                onClick={() => setShowAddPatientModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Token Allocation Live Banner */}
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-teal-600 text-white font-black flex items-center justify-center text-sm shadow-xs font-mono">
                  {nextTokenPreview.tokenFormatted}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-teal-950">Daily OPD Registration Token</h4>
                  <p className="text-[11px] text-teal-700">Next available sequential token for today ({nextTokenPreview.tokenDate})</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-white text-teal-800 text-[10px] font-bold rounded-lg border border-teal-200 uppercase tracking-wider">
                Sequential
              </span>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. M. Muthukumar"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98401 22910"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono"
                  />
                </div>
              </div>

              {/* Consultation Doctor and Time Slot */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Consultation Doctor
                  </label>
                  <select
                    value={consultDoctor}
                    onChange={e => setConsultDoctor(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 text-xs"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.specialty})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Consultation Time Alert
                  </label>
                  <input
                    type="text"
                    value={consultTime}
                    onChange={e => setConsultTime(e.target.value)}
                    placeholder="10:30 AM"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Known Drug Allergies (comma separated)</label>
                <input
                  type="text"
                  value={allergiesText}
                  onChange={e => setAllergiesText(e.target.value)}
                  placeholder="e.g. Penicillin, Aspirin, Sulfa drugs"
                  className="w-full px-3 py-2 border border-rose-200 bg-rose-50/30 rounded-xl mt-1 text-rose-800 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Chronic Conditions (comma separated)</label>
                <input
                  type="text"
                  value={conditionsText}
                  onChange={e => setConditionsText(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes, Hypertension"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Address / Neighborhood</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. Chokkalingapuram, Melur"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPatientModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Save & Issue Token {nextTokenPreview.tokenFormatted}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Refill Reminder Modal */}
      {showAddReminderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Schedule Refill Reminder</h3>
                <p className="text-xs text-slate-500">{showAddReminderModal.name}</p>
              </div>
              <button
                onClick={() => setShowAddReminderModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Medicine Name *</label>
                <input
                  type="text"
                  required
                  value={reminderMedName}
                  onChange={e => setReminderMedName(e.target.value)}
                  placeholder="e.g. Glycomet-GP 1 or Telma 40"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Dosage Instructions</label>
                <input
                  type="text"
                  value={reminderDosage}
                  onChange={e => setReminderDosage(e.target.value)}
                  placeholder="e.g. 1 tablet in morning before food"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Days Supply Dispensed</label>
                <input
                  type="number"
                  value={reminderDaysSupply}
                  onChange={e => setReminderDaysSupply(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  System will automatically set reminder date {reminderDaysSupply} days from today.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddReminderModal(null)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Schedule Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient SMS / WhatsApp Notification Gateway Modal */}
      <PatientNotificationModal
        isOpen={showNotificationModal}
        onClose={() => {
          setShowNotificationModal(false);
          setModalPatient(null);
          setModalReference(null);
        }}
        initialPatient={modalPatient}
        initialChannel={modalChannel}
        initialTemplate={modalTemplate}
        initialReference={modalReference}
        onNotificationSent={() => {
          reload();
        }}
      />

      {/* Patient Registration & Consultation Time Alert WhatsApp / SMS Modal */}
      <PatientConsultationAlertModal
        isOpen={showConsultationModal}
        patient={consultationModalPatient}
        onClose={() => {
          setShowConsultationModal(false);
          setConsultationModalPatient(null);
        }}
        onAlertSent={updated => {
          reload();
          setConsultationModalPatient(updated);
        }}
      />
    </div>
  );
};
