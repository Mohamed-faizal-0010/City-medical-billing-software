import React, { useState, useMemo } from 'react';
import {
  Stethoscope,
  Calendar,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  FileText,
  UserCheck,
  Building,
  UserPlus,
  Printer,
  ChevronRight,
  Pill,
  HeartPulse,
  Activity,
  Thermometer,
  Shield,
  Send,
  X,
  Sparkles,
  ArrowRight,
  ClipboardList,
  Flame,
  BadgeCheck,
  MessageCircle
} from 'lucide-react';
import {
  Doctor,
  Appointment,
  Patient,
  Medicine,
  ClinicDetails,
  ClinicConsultation
} from '../types';
import { StorageService } from '../services/storage';
import { PatientConsultationAlertModal } from '../components/PatientConsultationAlertModal';

interface ClinicPortalViewProps {
  onSendToPOS?: (consultation: ClinicConsultation) => void;
  onRefreshData?: () => void;
}

export const ClinicPortalView: React.FC<ClinicPortalViewProps> = ({
  onSendToPOS,
  onRefreshData
}) => {
  const [clinicDetails, setClinicDetails] = useState<ClinicDetails>(() =>
    StorageService.getClinicDetails()
  );
  const [doctors, setDoctors] = useState<Doctor[]>(() => StorageService.getDoctors());
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    StorageService.getAppointments()
  );
  const [consultations, setConsultations] = useState<ClinicConsultation[]>(() =>
    StorageService.getConsultations()
  );
  const [patients, setPatients] = useState<Patient[]>(() => StorageService.getPatients());
  const [medicines] = useState<Medicine[]>(() => StorageService.getMedicines());

  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'consultations' | 'appointments' | 'doctors' | 'details'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [showNewConsultationModal, setShowNewConsultationModal] = useState(false);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showEditClinicModal, setShowEditClinicModal] = useState(false);
  const [viewingConsultation, setViewingConsultation] = useState<ClinicConsultation | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalPatient, setAlertModalPatient] = useState<Patient | null>(null);

  // New Consultation Form State
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || '');
  const [chiefComplaints, setChiefComplaints] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [bp, setBp] = useState('120/80');
  const [pulse, setPulse] = useState<number>(72);
  const [spo2, setSpo2] = useState<number>(98);
  const [temp, setTemp] = useState('98.4');
  const [bloodSugar, setBloodSugar] = useState('110');
  const [weight, setWeight] = useState<number>(65);
  const [followUpDate, setFollowUpDate] = useState('');
  
  // Prescriptions list for consultation
  const [prescribedItems, setPrescribedItems] = useState<
    { medicineId: string; dosage: string; durationDays: number; quantity: number; instructions: string }[]
  >([
    {
      medicineId: medicines[0]?.id || '',
      dosage: '1 tablet twice daily after food',
      durationDays: 5,
      quantity: 10,
      instructions: 'Take after meals'
    }
  ]);

  // New Appointment Form State
  const [aptPatientId, setAptPatientId] = useState(patients[0]?.id || '');
  const [aptDoctorId, setAptDoctorId] = useState(doctors[0]?.id || '');
  const [aptDate, setAptDate] = useState(new Date().toISOString().split('T')[0]);
  const [aptTimeSlot, setAptTimeSlot] = useState('10:00 AM');
  const [aptReason, setAptReason] = useState('Regular Checkup & Health Review');

  // New Doctor Form State
  const [docName, setDocName] = useState('');
  const [docSpec, setDocSpec] = useState('General Medicine & Family Physician');
  const [docRegNo, setDocRegNo] = useState('TNMC-');
  const [docPhone, setDocPhone] = useState('+91 ');
  const [docEmail, setDocEmail] = useState('');
  const [docFee, setDocFee] = useState<number>(500);
  const [docClinic, setDocClinic] = useState('City Medical Clinic');

  const reloadAll = () => {
    setClinicDetails(StorageService.getClinicDetails());
    setDoctors(StorageService.getDoctors());
    setAppointments(StorageService.getAppointments());
    setConsultations(StorageService.getConsultations());
    setPatients(StorageService.getPatients());
    if (onRefreshData) onRefreshData();
  };

  // Filtered consultations
  const filteredConsultations = useMemo(() => {
    return consultations.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.patientName.toLowerCase().includes(q) ||
        c.doctorName.toLowerCase().includes(q) ||
        c.diagnosis.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q);
      const matchesDoctor = doctorFilter === 'All' || c.doctorId === doctorFilter;
      return matchesSearch && matchesDoctor;
    });
  }, [consultations, searchQuery, doctorFilter]);

  // Today's appointments / OPD Queue
  const todayStr = new Date().toISOString().split('T')[0];
  const todayQueue = useMemo(() => {
    return appointments.filter(a => a.date === todayStr);
  }, [appointments, todayStr]);

  const handleCreateConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === selectedPatientId);
    const doctor = doctors.find(d => d.id === selectedDoctorId);
    if (!patient || !doctor) return;

    const newConId = `CON-2026-${String(consultations.length + 1).padStart(3, '0')}`;

    const formattedPrescriptions = prescribedItems.map(item => {
      const med = medicines.find(m => m.id === item.medicineId);
      return {
        medicineId: item.medicineId,
        medicineName: med ? `${med.name} (${med.genericName})` : 'Medicine',
        dosage: item.dosage,
        durationDays: item.durationDays,
        quantity: item.quantity,
        instructions: item.instructions
      };
    });

    const newConsultation: ClinicConsultation = {
      id: newConId,
      date: new Date().toISOString(),
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      patientPhone: patient.phone,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialization: doctor.specialization,
      doctorRegNo: doctor.registrationNumber,
      chiefComplaints,
      vitals: {
        bloodPressure: bp,
        pulse,
        spo2,
        temperature: temp ? `${temp} °F` : undefined,
        bloodSugar: bloodSugar ? `${bloodSugar} mg/dL` : undefined,
        weight
      },
      diagnosis,
      clinicalNotes,
      prescriptions: formattedPrescriptions,
      followUpDate: followUpDate || undefined,
      dispensedInPharmacy: false
    };

    StorageService.addConsultation(newConsultation);
    reloadAll();
    setShowNewConsultationModal(false);
    setViewingConsultation(newConsultation);

    // Reset fields
    setChiefComplaints('');
    setDiagnosis('');
    setClinicalNotes('');
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === aptPatientId);
    const doctor = doctors.find(d => d.id === aptDoctorId);
    if (!patient || !doctor) return;

    const newApt: Appointment = {
      id: `apt-${String(appointments.length + 1).padStart(2, '0')}`,
      patientId: patient.id,
      patientName: patient.name,
      patientPhone: patient.phone,
      doctorId: doctor.id,
      doctorName: doctor.name,
      date: aptDate,
      timeSlot: aptTimeSlot,
      reason: aptReason,
      status: 'Scheduled'
    };

    StorageService.addAppointment(newApt);
    reloadAll();
    setShowNewAppointmentModal(false);
  };

  const handleCreateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) return;

    const newDoc: Doctor = {
      id: `doc-${doctors.length + 1}`,
      name: docName,
      specialization: docSpec,
      clinicName: docClinic,
      phone: docPhone,
      email: docEmail,
      registrationNumber: docRegNo,
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      consultationFee: docFee
    };

    const updated = [...doctors, newDoc];
    StorageService.saveDoctors(updated);
    reloadAll();
    setShowAddDoctorModal(false);
    setDocName('');
  };

  const handleUpdateAptStatus = (aptId: string, status: Appointment['status']) => {
    StorageService.updateAppointmentStatus(aptId, status);
    reloadAll();
  };

  const handleSendPrescriptionToPOS = (con: ClinicConsultation) => {
    if (onSendToPOS) {
      onSendToPOS(con);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Clinic Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-teal-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-400/30 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                Attached Healthcare Facility
              </span>
              <span className="px-3 py-1 bg-white/10 text-white text-xs font-medium rounded-full">
                Melur Taluk, Madurai Dist • PIN 625103
              </span>
              <span className="px-3 py-1 bg-amber-400/20 text-amber-300 text-xs font-semibold rounded-full border border-amber-400/30">
                Ph: {clinicDetails.phone}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {clinicDetails.clinicName}
            </h1>
            <p className="text-sm text-teal-100/90 leading-relaxed">
              {clinicDetails.address}, Melur, Madurai, Tamil Nadu. Integrated outpatient consultation center with instant prescription-to-pharmacy dispensing.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-teal-200/80 pt-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Morning: {clinicDetails.opdTimingsMorning} | Evening: {clinicDetails.opdTimingsEvening}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-teal-400" />
                <span>Pharmacist In-Charge: <strong className="text-white">Anusya Begum, D.Pharm</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap md:flex-col gap-2.5 shrink-0">
            <button
              onClick={() => setShowNewConsultationModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-md transition-transform active:scale-95 text-sm"
              id="new-consultation-btn"
            >
              <Stethoscope className="w-4 h-4" />
              <span>New Clinical Consultation</span>
            </button>
            <button
              onClick={() => setShowNewAppointmentModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition-colors text-sm"
              id="book-appointment-btn"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
            <button
              onClick={() => setShowEditClinicModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-transparent hover:bg-white/5 text-teal-200 hover:text-white rounded-lg text-xs transition-colors"
            >
              <span>Facility Profile & Hours</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeSubTab === 'queue'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
          id="tab-queue"
        >
          <Activity className="w-4 h-4" />
          <span>Live OPD Queue ({todayQueue.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('consultations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeSubTab === 'consultations'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
          id="tab-consultations"
        >
          <FileText className="w-4 h-4" />
          <span>Consultations & Digital Rx ({consultations.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('appointments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeSubTab === 'appointments'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
          id="tab-appointments"
        >
          <Calendar className="w-4 h-4" />
          <span>All Appointments ({appointments.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('doctors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeSubTab === 'doctors'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
          id="tab-doctors"
        >
          <UserCheck className="w-4 h-4" />
          <span>Consulting Doctors ({doctors.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('details')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeSubTab === 'details'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
          id="tab-details"
        >
          <Building className="w-4 h-4" />
          <span>Clinic Details & Services</span>
        </button>
      </div>

      {/* TAB 1: LIVE OPD QUEUE */}
      {activeSubTab === 'queue' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Today's Total OPD</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{todayQueue.length}</p>
              <span className="text-[11px] text-emerald-600 font-medium">Melur OPD Session</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Waiting in Lobby</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {todayQueue.filter(q => q.status === 'Scheduled').length}
              </p>
              <span className="text-[11px] text-slate-400">Tokens In Queue</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Consultations Done</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {todayQueue.filter(q => q.status === 'Completed').length}
              </p>
              <span className="text-[11px] text-slate-400">Prescriptions Issued</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Active Doctors On-Duty</span>
              <p className="text-2xl font-bold text-teal-700 mt-1">{doctors.length}</p>
              <span className="text-[11px] text-slate-400">3 Consulting Chambers</span>
            </div>
          </div>

          {/* Queue List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Current Token Queue for Today</h3>
                <p className="text-xs text-slate-500">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewAppointmentModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Issue Next Token</span>
                </button>
              </div>
            </div>

            {todayQueue.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-base font-semibold text-slate-700">No OPD tokens in queue for today</p>
                <p className="text-xs text-slate-400 mt-1">
                  Issue a new OPD token or schedule an appointment for patient consultation.
                </p>
                <button
                  onClick={() => setShowNewAppointmentModal(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Issue Token
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {todayQueue.map((apt, index) => (
                  <div key={apt.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-extrabold flex items-center justify-center text-base border border-slate-200">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{apt.patientName}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              apt.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : apt.status === 'Cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}
                          >
                            {apt.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {apt.patientPhone} • Assigned to: <strong className="text-slate-700">{apt.doctorName}</strong>
                        </p>
                        <p className="text-xs text-slate-600 mt-1 italic">
                          "{apt.reason}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs font-mono text-slate-500 px-2 py-1 bg-slate-100 rounded-lg">
                        {apt.timeSlot}
                      </span>
                      <button
                        onClick={() => {
                          const existingPatient = StorageService.getPatients().find(p => p.id === apt.patientId || p.phone === apt.patientPhone);
                          const tokenNum = index + 1;
                          const formattedToken = `#${tokenNum < 10 ? '0' : ''}${tokenNum}`;
                          const targetPatient: Patient = existingPatient
                            ? {
                                ...existingPatient,
                                tokenNumber: tokenNum,
                                tokenFormatted: formattedToken,
                                consultationDoctorName: apt.doctorName,
                                consultationTime: apt.timeSlot
                              }
                            : {
                                id: apt.patientId,
                                name: apt.patientName,
                                age: 35,
                                gender: 'Other',
                                phone: apt.patientPhone,
                                address: 'Melur, Madurai',
                                tokenNumber: tokenNum,
                                tokenFormatted: formattedToken,
                                tokenDate: apt.date,
                                consultationDoctorName: apt.doctorName,
                                consultationTime: apt.timeSlot,
                                chronicConditions: [],
                                drugAllergies: [],
                                prescriptions: [],
                                refillReminders: []
                              };
                          setAlertModalPatient(targetPatient);
                          setShowAlertModal(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                        title="Send Token # and Consultation Time Alert via WhatsApp / SMS"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Alert</span>
                      </button>
                      {apt.status === 'Scheduled' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedPatientId(apt.patientId);
                              setSelectedDoctorId(apt.doctorId);
                              setChiefComplaints(apt.reason);
                              setShowNewConsultationModal(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>Start Consultation</span>
                          </button>
                          <button
                            onClick={() => handleUpdateAptStatus(apt.id, 'Completed')}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100"
                            title="Mark Completed"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CONSULTATIONS & DIGITAL PRESCRIPTIONS */}
      {activeSubTab === 'consultations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search consultations by patient, doctor, diagnosis..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={doctorFilter}
                onChange={e => setDoctorFilter(e.target.value)}
                className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              >
                <option value="All">All Doctors</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowNewConsultationModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Write New Rx</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredConsultations.map(con => (
              <div
                key={con.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-emerald-300 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">{con.id}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(con.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-base mt-0.5">{con.patientName}</h4>
                    <p className="text-xs text-slate-500">
                      {con.patientAge} yrs • {con.patientGender} • {con.patientPhone}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 block">{con.doctorName}</span>
                    <span className="text-[11px] text-teal-700 font-medium block">{con.doctorSpecialization}</span>
                    <span className="text-[10px] font-mono text-slate-400">Reg: {con.doctorRegNo}</span>
                  </div>
                </div>

                {/* Vitals */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">BP</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">{con.vitals.bloodPressure || '--'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Pulse</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">{con.vitals.pulse ? `${con.vitals.pulse} bpm` : '--'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">SpO2</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">{con.vitals.spo2 ? `${con.vitals.spo2}%` : '--'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Sugar</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">{con.vitals.bloodSugar || '--'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Temp</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">{con.vitals.temperature || '--'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Weight</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">{con.vitals.weight ? `${con.vitals.weight} kg` : '--'}</span>
                  </div>
                </div>

                {/* Diagnosis */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Diagnosis</span>
                  <p className="text-sm font-semibold text-slate-800">{con.diagnosis}</p>
                  {con.clinicalNotes && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed bg-amber-50/60 p-2 rounded-lg border border-amber-100/80">
                      <strong>Clinical Notes:</strong> {con.clinicalNotes}
                    </p>
                  )}
                </div>

                {/* Prescriptions */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Prescribed Medicines ({(con.prescriptions || []).length})
                  </span>
                  <div className="space-y-1.5">
                    {(con.prescriptions || []).map((rx, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs p-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
                        <div>
                          <p className="font-bold text-slate-800">{rx.medicineName}</p>
                          <p className="text-[11px] text-emerald-800 font-medium">{rx.dosage} • {rx.durationDays} Days</p>
                          {rx.instructions && <p className="text-[10px] text-slate-500 italic">{rx.instructions}</p>}
                        </div>
                        <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          Qty: {rx.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {con.dispensedInPharmacy ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Dispensed at POS ({con.posInvoiceId || 'Paid'})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Clock className="w-3.5 h-3.5" /> Pending Dispense
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingConsultation(con)}
                      className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium"
                    >
                      View Rx Slip
                    </button>
                    <button
                      onClick={() => handleSendPrescriptionToPOS(con)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                      title="Send prescribed drugs directly to City Medical POS cart"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      <span>Dispense in POS</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: APPOINTMENTS */}
      {activeSubTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Doctor Appointments Schedule</h3>
              <p className="text-xs text-slate-500">Manage patient bookings, follow-ups, and OPD slots</p>
            </div>
            <button
              onClick={() => setShowNewAppointmentModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Reason / Complaint</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{apt.date}</div>
                      <div className="text-xs text-slate-500 font-mono">{apt.timeSlot}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{apt.patientName}</div>
                      <div className="text-xs text-slate-500">{apt.patientPhone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{apt.doctorName}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                      {apt.reason}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          apt.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : apt.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedPatientId(apt.patientId);
                          setSelectedDoctorId(apt.doctorId);
                          setChiefComplaints(apt.reason);
                          setShowNewConsultationModal(true);
                        }}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 mr-3"
                      >
                        Consult
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateAptStatus(
                            apt.id,
                            apt.status === 'Completed' ? 'Scheduled' : 'Completed'
                          )
                        }
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                      >
                        Toggle Done
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DOCTORS ROSTER */}
      {activeSubTab === 'doctors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Consulting Specialists Directory</h3>
              <p className="text-xs text-slate-500">Resident and visiting medical consultants at City Medical Clinic</p>
            </div>
            <button
              onClick={() => setShowAddDoctorModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Doctor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map(doc => (
              <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-base truncate">{doc.name}</h4>
                    <p className="text-xs text-teal-700 font-semibold">{doc.specialization}</p>
                    <p className="text-[11px] text-slate-400 font-mono">Reg: {doc.registrationNumber}</p>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consultation Fee:</span>
                    <span className="font-bold text-slate-900">₹{doc.consultationFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="text-slate-700 font-mono">{doc.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Clinic:</span>
                    <span className="text-slate-700">{doc.clinicName}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Available Days
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {doc.availableDays.map(day => (
                      <span key={day} className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setAptDoctorId(doc.id);
                    setShowNewAppointmentModal(true);
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
                >
                  Book with {doc.name.split(' ')[1] || doc.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CLINIC DETAILS & SERVICES */}
      {activeSubTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Official Clinic Profile & Location</h3>
              <p className="text-xs text-slate-500 mt-1">
                Official regulatory and administrative details for City Medical Outpatient Clinic
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 font-medium block">Clinic / Facility Name</span>
                <span className="font-bold text-slate-900">{clinicDetails.clinicName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 font-medium block">Taluk & District</span>
                <span className="font-bold text-slate-900">
                  {clinicDetails.taluk}, {clinicDetails.district}, {clinicDetails.state} - {clinicDetails.pincode}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 font-medium block">Official Mobile / Helpline</span>
                <span className="font-bold text-emerald-700 font-mono">{clinicDetails.phone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 font-medium block">Emergency On-Call Number</span>
                <span className="font-bold text-rose-700 font-mono">{clinicDetails.emergencyPhone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 font-medium block">Morning OPD Timings</span>
                <span className="font-bold text-slate-800">{clinicDetails.opdTimingsMorning}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 font-medium block">Evening OPD Timings</span>
                <span className="font-bold text-slate-800">{clinicDetails.opdTimingsEvening}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">Attached Healthcare Services</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {clinicDetails.servicesOffered.map((srv, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 bg-emerald-50/60 text-emerald-950 rounded-xl text-xs font-medium border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{srv}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowEditClinicModal(true)}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
            >
              Edit Clinic Profile & Hours
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Registered Pharmacist</h3>
              <p className="text-xs text-slate-500 mt-0.5">Dispensary Lead & Drug Compliance In-Charge</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-200 text-emerald-900 font-extrabold flex items-center justify-center text-xl mx-auto shadow-xs border-2 border-white">
                AB
              </div>
              <h4 className="font-extrabold text-slate-900 text-base">{clinicDetails.registeredPharmacist}</h4>
              <span className="inline-block px-2.5 py-0.5 bg-emerald-200/80 text-emerald-900 text-xs font-bold rounded-full">
                Reg No: {clinicDetails.pharmacistLicense}
              </span>
              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                Authorized under Tamil Nadu Pharmacy Council (TNPC). Responsible for prescription auditing, drug interaction checks, and bioequivalent generic substitutions.
              </p>
            </div>

            <div className="text-xs space-y-2 text-slate-600">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                <span>Form 20B & 21B Drug License Holder</span>
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                <span>Schedule H & H1 Dispensing Authority</span>
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                <span>Automated Refill Reminders Overseer</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW CLINICAL CONSULTATION / DIGITAL RX */}
      {showNewConsultationModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">New Clinical Consultation & Digital Rx</h3>
                  <p className="text-xs text-slate-500">City Medical Clinic • Instant Pharmacy POS Dispensing</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewConsultationModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateConsultation} className="p-6 space-y-5">
              {/* Doctor & Patient Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Patient *</label>
                  <select
                    value={selectedPatientId}
                    onChange={e => setSelectedPatientId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.age} yrs, {p.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Consulting Doctor *</label>
                  <select
                    value={selectedDoctorId}
                    onChange={e => setSelectedDoctorId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} - {d.specialization}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vitals Input Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Clinical Vitals</label>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">BP (mmHg)</span>
                    <input
                      type="text"
                      placeholder="120/80"
                      value={bp}
                      onChange={e => setBp(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Pulse (bpm)</span>
                    <input
                      type="number"
                      placeholder="72"
                      value={pulse}
                      onChange={e => setPulse(Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">SpO2 (%)</span>
                    <input
                      type="number"
                      placeholder="98"
                      value={spo2}
                      onChange={e => setSpo2(Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Sugar (mg/dL)</span>
                    <input
                      type="text"
                      placeholder="120"
                      value={bloodSugar}
                      onChange={e => setBloodSugar(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Temp (°F)</span>
                    <input
                      type="text"
                      placeholder="98.6"
                      value={temp}
                      onChange={e => setTemp(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Weight (kg)</span>
                    <input
                      type="number"
                      placeholder="65"
                      value={weight}
                      onChange={e => setWeight(Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Complaints & Diagnosis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chief Complaints *</label>
                  <textarea
                    rows={2}
                    value={chiefComplaints}
                    onChange={e => setChiefComplaints(e.target.value)}
                    placeholder="e.g. Fever for 3 days, dry cough, headache"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Diagnosis *</label>
                  <textarea
                    rows={2}
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Viral Bronchitis, Type 2 Diabetes"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Prescribed Medicines Builder */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Prescribed Medicines</label>
                  <button
                    type="button"
                    onClick={() =>
                      setPrescribedItems([
                        ...prescribedItems,
                        {
                          medicineId: medicines[0]?.id || '',
                          dosage: '1 tablet twice daily after food',
                          durationDays: 5,
                          quantity: 10,
                          instructions: 'Take with water'
                        }
                      ])
                    }
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Drug
                  </button>
                </div>

                <div className="space-y-2">
                  {prescribedItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={item.medicineId}
                          onChange={e => {
                            const updated = [...prescribedItems];
                            updated[idx].medicineId = e.target.value;
                            setPrescribedItems(updated);
                          }}
                          className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
                        >
                          {medicines.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.genericName}) - Stock: {m.batches.reduce((s, b) => s + b.stock, 0)}
                            </option>
                          ))}
                        </select>
                        {prescribedItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPrescribedItems(prescribedItems.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Dosage (e.g. 1-0-1 after food)"
                          value={item.dosage}
                          onChange={e => {
                            const updated = [...prescribedItems];
                            updated[idx].dosage = e.target.value;
                            setPrescribedItems(updated);
                          }}
                          className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                        <input
                          type="number"
                          placeholder="Days (e.g. 5)"
                          value={item.durationDays}
                          onChange={e => {
                            const updated = [...prescribedItems];
                            const days = Number(e.target.value);
                            updated[idx].durationDays = days;
                            updated[idx].quantity = days * 2;
                            setPrescribedItems(updated);
                          }}
                          className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                        <input
                          type="number"
                          placeholder="Total Qty"
                          value={item.quantity}
                          onChange={e => {
                            const updated = [...prescribedItems];
                            updated[idx].quantity = Number(e.target.value);
                            setPrescribedItems(updated);
                          }}
                          className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow-up date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Follow-up Review Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={e => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Advice / Diet</label>
                  <input
                    type="text"
                    value={clinicalNotes}
                    onChange={e => setClinicalNotes(e.target.value)}
                    placeholder="e.g. Drink plenty of warm water, low sodium diet"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewConsultationModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Rx & Record Consultation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BOOK APPOINTMENT */}
      {showNewAppointmentModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Book Doctor Appointment / OPD Token</h3>
              <button onClick={() => setShowNewAppointmentModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Patient *</label>
                <select
                  value={aptPatientId}
                  onChange={e => setAptPatientId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  required
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor *</label>
                <select
                  value={aptDoctorId}
                  onChange={e => setAptDoctorId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  required
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={aptDate}
                    onChange={e => setAptDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot *</label>
                  <select
                    value={aptTimeSlot}
                    onChange={e => setAptTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                    <option value="06:30 PM">06:30 PM</option>
                    <option value="07:00 PM">07:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Visit *</label>
                <input
                  type="text"
                  value={aptReason}
                  onChange={e => setAptReason(e.target.value)}
                  placeholder="e.g. Quarterly Diabetes Review"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewAppointmentModal(false)}
                  className="px-3 py-2 text-xs text-slate-600 rounded-xl hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Confirm Token & Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DOCTOR */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Register Consulting Doctor</h3>
              <button onClick={() => setShowAddDoctorModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Full Name *</label>
                <input
                  type="text"
                  placeholder="Dr. Rajesh Kannan, MBBS, MD"
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specialization *</label>
                <input
                  type="text"
                  placeholder="e.g. Diabetology & General Medicine"
                  value={docSpec}
                  onChange={e => setDocSpec(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Medical Reg No *</label>
                  <input
                    type="text"
                    placeholder="TNMC-88192"
                    value={docRegNo}
                    onChange={e => setDocRegNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fee (₹) *</label>
                  <input
                    type="number"
                    value={docFee}
                    onChange={e => setDocFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone *</label>
                <input
                  type="text"
                  placeholder="+91 98450 11223"
                  value={docPhone}
                  onChange={e => setDocPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-3 py-2 text-xs text-slate-600 rounded-xl hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Add Consultant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW & PRINT DIGITAL RX SLIP */}
      {viewingConsultation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            {/* Header with Letterhead */}
            <div className="border-b-2 border-emerald-600 pb-4 text-center relative">
              <h2 className="text-xl font-extrabold text-slate-900">{clinicDetails.clinicName}</h2>
              <p className="text-xs text-slate-600 font-medium">
                {clinicDetails.address}, {clinicDetails.taluk}, {clinicDetails.district}, Tamil Nadu - {clinicDetails.pincode}
              </p>
              <p className="text-[11px] text-slate-500">
                Phone: {clinicDetails.phone} • Timings: {clinicDetails.opdTimingsMorning} & {clinicDetails.opdTimingsEvening}
              </p>
              <div className="absolute right-0 top-0">
                <button
                  onClick={() => setViewingConsultation(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Consultation Meta */}
            <div className="grid grid-cols-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 gap-2">
              <div>
                <p><strong>Patient:</strong> {viewingConsultation.patientName} ({viewingConsultation.patientAge}y/{viewingConsultation.patientGender})</p>
                <p><strong>Phone:</strong> {viewingConsultation.patientPhone}</p>
                <p><strong>Date:</strong> {new Date(viewingConsultation.date).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p><strong>Doctor:</strong> {viewingConsultation.doctorName}</p>
                <p><strong>Specialization:</strong> {viewingConsultation.doctorSpecialization}</p>
                <p><strong>Reg No:</strong> {viewingConsultation.doctorRegNo}</p>
              </div>
            </div>

            {/* Vitals Summary */}
            <div className="flex flex-wrap items-center justify-between text-xs bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
              <span><strong>BP:</strong> {viewingConsultation.vitals.bloodPressure || 'N/A'}</span>
              <span><strong>Pulse:</strong> {viewingConsultation.vitals.pulse ? `${viewingConsultation.vitals.pulse} bpm` : 'N/A'}</span>
              <span><strong>SpO2:</strong> {viewingConsultation.vitals.spo2 ? `${viewingConsultation.vitals.spo2}%` : 'N/A'}</span>
              <span><strong>Blood Sugar:</strong> {viewingConsultation.vitals.bloodSugar || 'N/A'}</span>
              <span><strong>Weight:</strong> {viewingConsultation.vitals.weight ? `${viewingConsultation.vitals.weight} kg` : 'N/A'}</span>
            </div>

            {/* Diagnosis */}
            <div className="text-sm">
              <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Clinical Diagnosis</h4>
              <p className="font-bold text-slate-900 mt-0.5">{viewingConsultation.diagnosis}</p>
              <p className="text-xs text-slate-600 mt-1 italic">{viewingConsultation.chiefComplaints}</p>
            </div>

            {/* Prescription List (Rx symbol) */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-serif font-black text-emerald-700">℞</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prescribed Medications</span>
              </div>
              <div className="space-y-2">
                {viewingConsultation.prescriptions.map((p, i) => (
                  <div key={i} className="flex justify-between items-start text-xs border-b border-slate-100 pb-2">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{i + 1}. {p.medicineName}</p>
                      <p className="text-emerald-800 font-semibold">{p.dosage} • For {p.durationDays} days</p>
                      {p.instructions && <p className="text-slate-500 italic text-[11px]">{p.instructions}</p>}
                    </div>
                    <span className="font-mono font-bold text-slate-800">Qty: {p.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Pharmacist Sign & Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left text-[11px] text-slate-500">
                <p>Dispensing Pharmacy: <strong>City Medical, Melur</strong></p>
                <p>Pharmacist In-Charge: <strong>Anusya Begum, D.Pharm (TN-RPH-78419)</strong></p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Rx</span>
                </button>
                <button
                  onClick={() => {
                    handleSendPrescriptionToPOS(viewingConsultation);
                    setViewingConsultation(null);
                  }}
                  className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  <Pill className="w-4 h-4" />
                  <span>Send to Pharmacy POS Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CLINIC PROFILE */}
      {showEditClinicModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Update Clinic Facility Details</h3>
              <button onClick={() => setShowEditClinicModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Facility Name</label>
                <input
                  type="text"
                  value={clinicDetails.clinicName}
                  onChange={e => setClinicDetails({ ...clinicDetails, clinicName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Helpline Phone</label>
                  <input
                    type="text"
                    value={clinicDetails.phone}
                    onChange={e => setClinicDetails({ ...clinicDetails, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    value={clinicDetails.emergencyPhone}
                    onChange={e => setClinicDetails({ ...clinicDetails, emergencyPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Morning OPD</label>
                  <input
                    type="text"
                    value={clinicDetails.opdTimingsMorning}
                    onChange={e => setClinicDetails({ ...clinicDetails, opdTimingsMorning: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Evening OPD</label>
                  <input
                    type="text"
                    value={clinicDetails.opdTimingsEvening}
                    onChange={e => setClinicDetails({ ...clinicDetails, opdTimingsEvening: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Registered Pharmacist</label>
                <input
                  type="text"
                  value={clinicDetails.registeredPharmacist}
                  onChange={e => setClinicDetails({ ...clinicDetails, registeredPharmacist: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                onClick={() => setShowEditClinicModal(false)}
                className="px-3 py-2 text-xs text-slate-600 rounded-xl hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  StorageService.saveClinicDetails(clinicDetails);
                  setShowEditClinicModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consultation Time Alert WhatsApp / SMS Modal */}
      <PatientConsultationAlertModal
        isOpen={showAlertModal}
        patient={alertModalPatient}
        onClose={() => {
          setShowAlertModal(false);
          setAlertModalPatient(null);
        }}
        onAlertSent={() => {
          if (onRefreshData) onRefreshData();
        }}
      />
    </div>
  );
};
