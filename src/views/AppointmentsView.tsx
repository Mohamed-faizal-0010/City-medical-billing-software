import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  Phone,
  User,
  X,
  Stethoscope,
  Building2,
  AlertCircle
} from 'lucide-react';
import { Doctor, Appointment, Patient } from '../types';
import { StorageService } from '../services/storage';

interface AppointmentsViewProps {
  onRefreshData?: () => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({ onRefreshData }) => {
  const [doctors, setDoctors] = useState<Doctor[]>(() => StorageService.getDoctors());
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    StorageService.getAppointments()
  );
  const [patients] = useState<Patient[]>(() => StorageService.getPatients());
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookModal, setShowBookModal] = useState(false);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);

  // Booking Form State
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || '');
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [appointmentTime, setAppointmentTime] = useState('10:30 AM');
  const [appointmentReason, setAppointmentReason] = useState('Routine Chronic Medication Review');

  // Add Doctor Form State
  const [docName, setDocName] = useState('');
  const [docSpecialization, setDocSpecialization] = useState('General Medicine');
  const [docClinic, setDocClinic] = useState('Melur Poly Clinic');
  const [docPhone, setDocPhone] = useState('+91 98421 00921');
  const [docRegNo, setDocRegNo] = useState('TNMC-49201');
  const [docFee, setDocFee] = useState(500);

  const reload = () => {
    setDoctors(StorageService.getDoctors());
    setAppointments(StorageService.getAppointments());
    if (onRefreshData) onRefreshData();
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const q = searchQuery.toLowerCase();
      return (
        apt.patientName.toLowerCase().includes(q) ||
        apt.doctorName.toLowerCase().includes(q) ||
        apt.reason.toLowerCase().includes(q)
      );
    });
  }, [appointments, searchQuery]);

  // Handle Book Appointment
  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === selectedPatientId);
    const doctor = doctors.find(d => d.id === selectedDoctorId);
    if (!patient || !doctor) return;

    const newApt: Appointment = {
      id: `apt-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      date: appointmentDate,
      time: appointmentTime,
      status: 'Confirmed',
      reason: appointmentReason,
      notes: 'Booked via City Medical Health Desk'
    };

    StorageService.addAppointment(newApt);
    reload();
    setShowBookModal(false);
  };

  // Handle Add Doctor
  const handleCreateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) return;

    const newDoc: Doctor = {
      id: `doc-${Date.now().toString().slice(-4)}`,
      name: docName,
      specialization: docSpecialization,
      clinicName: docClinic,
      phone: docPhone,
      email: 'doctor@citymedical.med',
      registrationNumber: docRegNo,
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      consultationFee: Number(docFee)
    };

    const currentDocs = StorageService.getDoctors();
    currentDocs.push(newDoc);
    StorageService.saveDoctors(currentDocs);
    reload();
    setShowAddDoctorModal(false);
    setDocName('');
  };

  // Update Status
  const handleStatusChange = (aptId: string, status: Appointment['status']) => {
    StorageService.updateAppointmentStatus(aptId, status);
    reload();
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-emerald-600" />
            <span>Doctors & Clinical Appointments</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Doctor registry, clinical referral scheduling, and patient consultation tracking
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowAddDoctorModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors"
          >
            <Stethoscope className="w-4 h-4 text-slate-600" />
            <span>Add Doctor</span>
          </button>
          <button
            onClick={() => setShowBookModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
            id="book-appointment-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Appointment</span>
          </button>
        </div>
      </div>

      {/* Doctor Cards Strip */}
      <div>
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          Consultant Physicians & Specialists ({doctors.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {doctors.map(doc => (
            <div
              key={doc.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                  <p className="text-xs text-emerald-700 font-medium">{doc.specialization}</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                <p className="flex items-center gap-1.5 text-slate-500">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{doc.clinicName}</span>
                </p>
                <p className="font-mono text-[11px] text-slate-500">Reg: {doc.registrationNumber}</p>
                <div className="flex justify-between items-center pt-1 font-mono">
                  <span className="text-slate-400">Consultation Fee:</span>
                  <span className="font-bold text-slate-900">₹{doc.consultationFee}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Scheduled Patient Consultations</h3>
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search patient, doctor, reason..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Consultant Doctor</th>
                <th className="py-3 px-4">Scheduled Date & Time</th>
                <th className="py-3 px-4">Visit Reason</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.map(apt => (
                <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{apt.patientName}</td>
                  <td className="py-3.5 px-4 text-slate-800 font-semibold">{apt.doctorName}</td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                    {apt.date} at {apt.time}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-700">{apt.reason}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        apt.status === 'Confirmed'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : apt.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {apt.status !== 'Completed' && (
                      <button
                        onClick={() => handleStatusChange(apt.id, 'Completed')}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                      >
                        Mark Completed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAppointments.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs">No appointments scheduled</div>
          )}
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Schedule Doctor Appointment</h3>
              <button
                onClick={() => setShowBookModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Select Patient *</label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-semibold"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Select Doctor / Specialist *</label>
                <select
                  value={selectedDoctorId}
                  onChange={e => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-semibold"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} - {d.specialization} (Fee: ₹{d.consultationFee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Date</label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={e => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Time Slot</label>
                  <select
                    value={appointmentTime}
                    onChange={e => setAppointmentTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono"
                  >
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="04:30 PM">04:30 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                    <option value="06:30 PM">06:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Reason for Visit</label>
                <input
                  type="text"
                  value={appointmentReason}
                  onChange={e => setAppointmentReason(e.target.value)}
                  placeholder="e.g. Blood pressure monitoring, diabetic checkup"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add New Doctor / Physician</h3>
              <button
                onClick={() => setShowAddDoctorModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  placeholder="e.g. Dr. K. Ramanathan, MD"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Specialization</label>
                  <input
                    type="text"
                    value={docSpecialization}
                    onChange={e => setDocSpecialization(e.target.value)}
                    placeholder="e.g. Diabetology"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Clinic Name</label>
                  <input
                    type="text"
                    value={docClinic}
                    onChange={e => setDocClinic(e.target.value)}
                    placeholder="e.g. Melur Heart Care"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Registration Number</label>
                  <input
                    type="text"
                    value={docRegNo}
                    onChange={e => setDocRegNo(e.target.value)}
                    placeholder="TNMC-..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={docFee}
                    onChange={e => setDocFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
