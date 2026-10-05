import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Calendar, X, UserPlus, CheckCircle2, HeartPulse } from 'lucide-react';
import { Patient } from '../types';
import { StorageService } from '../services/storage';

interface NewWalkInCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  initialName?: string;
  initialAge?: string | number;
  initialLocation?: string;
  onCustomerCreated: (customer: {
    name: string;
    phone: string;
    age: number;
    location: string;
    patientId?: string;
    gender?: 'Male' | 'Female' | 'Other';
  }) => void;
}

export const NewWalkInCustomerModal: React.FC<NewWalkInCustomerModalProps> = ({
  isOpen,
  onClose,
  initialPhone = '',
  initialName = '',
  initialAge = '',
  initialLocation = '',
  onCustomerCreated
}) => {
  const [name, setName] = useState(initialName === 'Walk-in Customer' ? '' : initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [age, setAge] = useState<string>(initialAge ? String(initialAge) : '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [location, setLocation] = useState(initialLocation);
  const [chronicConditionInput, setChronicConditionInput] = useState('');
  const [saveToDirectory, setSaveToDirectory] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialName === 'Walk-in Customer' ? '' : initialName);
      setPhone(initialPhone);
      setAge(initialAge ? String(initialAge) : '');
      setLocation(initialLocation);
      setErrorMsg('');
    }
  }, [isOpen, initialPhone, initialName, initialAge, initialLocation]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanName = name.trim();
    const parsedAge = parseInt(age, 10);

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit customer mobile number.');
      return;
    }

    if (!cleanName) {
      setErrorMsg('Please enter customer full name.');
      return;
    }

    const formattedPhone = cleanPhone.length === 10
      ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`
      : phone.trim();

    const customerAge = isNaN(parsedAge) || parsedAge <= 0 ? 30 : parsedAge;
    const customerLocation = location.trim();

    if (saveToDirectory) {
      // Register in Patient directory for lifetime records & refill tracking
      const chronicConditions = chronicConditionInput.trim()
        ? chronicConditionInput.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const newPatient: Patient = StorageService.addPatient({
        name: cleanName,
        phone: formattedPhone,
        age: customerAge,
        gender: gender,
        address: customerLocation || 'Local Walk-in',
        chronicConditions: chronicConditions,
        drugAllergies: [],
        refillReminders: []
      });

      onCustomerCreated({
        name: newPatient.name,
        phone: newPatient.phone,
        age: newPatient.age,
        location: newPatient.address,
        patientId: newPatient.id,
        gender: newPatient.gender
      });
    } else {
      // Use for current sale only
      onCustomerCreated({
        name: cleanName,
        phone: formattedPhone,
        age: customerAge,
        location: customerLocation,
        gender: gender
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-teal-700 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <UserPlus className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Add Walking New Customer</h3>
              <p className="text-teal-100/90 text-xs">Enter mobile, age, location & profile for POS Billing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-teal-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Customer Mobile Number */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Mobile Number (10 Digits) <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold pointer-events-none flex items-center gap-1">
                <Phone className="w-4 h-4 text-teal-600" />
                <span>+91</span>
              </div>
              <input
                type="tel"
                value={phone.replace(/^\+91\s?/, '')}
                onChange={e => {
                  setPhone(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="98765 43210"
                maxLength={14}
                autoFocus
                className="w-full pl-16 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Customer Full Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Customer Full Name <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="e.g. Ramesh Kumar / Ananya Sharma"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Age & Gender Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Age (Years) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  max="125"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="e.g. 35"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as any)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other / Child</option>
              </select>
            </div>
          </div>

          {/* Location / Address */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Customer Location / Area / Town
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-teal-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Bus Stand Colony, Main Road, Melur"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Optional Health Condition / Notes */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Chronic Conditions / Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <HeartPulse className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={chronicConditionInput}
                onChange={e => setChronicConditionInput(e.target.value)}
                placeholder="e.g. Diabetes, Hypertension, Asthma"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Save to Directory Toggle */}
          <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
              <div>
                <p className="font-bold text-teal-950 text-xs">Save to Patient Directory</p>
                <p className="text-[10px] text-teal-700">Enables recurring refill reminders, allergy alerts, and prescription history</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={saveToDirectory}
              onChange={e => setSaveToDirectory(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              id="submit-new-walkin-customer-btn"
            >
              <UserPlus className="w-4 h-4" />
              <span>{saveToDirectory ? 'Save & Set as Active Customer' : 'Use Customer in POS'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
