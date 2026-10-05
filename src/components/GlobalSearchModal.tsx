import React, { useState, useMemo } from 'react';
import {
  Search,
  Pill,
  Users,
  Building2,
  FileText,
  X,
  ArrowRight,
  Stethoscope
} from 'lucide-react';
import { Medicine, Patient, Doctor, Supplier, SaleTransaction } from '../types';
import { StorageService } from '../services/storage';
import { VoiceInputButton } from './VoiceInputButton';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string, itemData?: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState('');

  const medicines = useMemo(() => StorageService.getMedicines(), [isOpen]);
  const patients = useMemo(() => StorageService.getPatients(), [isOpen]);
  const doctors = useMemo(() => StorageService.getDoctors(), [isOpen]);
  const suppliers = useMemo(() => StorageService.getSuppliers(), [isOpen]);
  const transactions = useMemo(() => StorageService.getTransactions(), [isOpen]);
  const consultations = useMemo(() => StorageService.getConsultations(), [isOpen]);

  const appModules = [
    { id: 'software-controller', title: 'Software Controller & Pharmacy Codes', keywords: 'controller software add pharmacy code whatsapp payment credentials action button' },
    { id: 'wholesale-hub', title: 'Wholesale B2B Sales Report & Hub', keywords: 'wholesale sales report b2b chemist hospital buyer tax invoice' },
    { id: 'wholesale-pending', title: 'Wholesale Payment Pending & Receivables', keywords: 'wholesale payment pending credit due aging chemist receivable' },
    { id: 'wholesale-returns', title: 'Wholesale Sales Return (Credit Notes)', keywords: 'wholesale return credit note sales return breakage' },
    { id: 'purchases', title: 'Wholesale Purchase Entry from Pharmaceuticals', keywords: 'purchase entry inward pharmaceutical supplier medicine batch scheme box' },
    { id: 'purchase-returns', title: 'Wholesale Purchase Return (Debit Notes)', keywords: 'purchase return debit note supplier expired return' },
    { id: 'report-purchases', title: 'Wholesale Purchase Report (Pharma Inward ITC)', keywords: 'purchase report inward itc input tax credit register' }
  ];

  const results = useMemo(() => {
    if (!query.trim()) return { modules: [], medicines: [], patients: [], suppliers: [], transactions: [], consultations: [] };
    const q = query.toLowerCase();

    return {
      modules: appModules.filter(m => m.title.toLowerCase().includes(q) || m.keywords.includes(q)).slice(0, 3),
      medicines: (medicines || []).filter(
        m =>
          (m.name || '').toLowerCase().includes(q) ||
          (m.genericName || '').toLowerCase().includes(q) ||
          (m.manufacturer || '').toLowerCase().includes(q)
      ).slice(0, 6),
      patients: (patients || []).filter(
        p => (p.name || '').toLowerCase().includes(q) || (p.phone || '').includes(q)
      ).slice(0, 3),
      suppliers: (suppliers || []).filter(
        s => (s.name || '').toLowerCase().includes(q) || (s.gstin || '').toLowerCase().includes(q)
      ).slice(0, 3),
      transactions: (transactions || []).filter(
        t => (t.id || '').toLowerCase().includes(q) || (t.patientName || '').toLowerCase().includes(q)
      ).slice(0, 3),
      consultations: (consultations || []).filter(
        c => (c.id || '').toLowerCase().includes(q) || (c.patientName || '').toLowerCase().includes(q) || (c.diagnosis || '').toLowerCase().includes(q)
      ).slice(0, 3)
    };
  }, [query, medicines, patients, suppliers, transactions, consultations]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type drug, generic molecule, patient, supplier, or invoice #..."
            className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none"
            id="global-modal-search-input"
          />
          <VoiceInputButton
            onTranscript={(text) => setQuery(text)}
            size="sm"
            title="Speak search query"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="p-3 max-h-96 overflow-y-auto space-y-3 text-xs">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">Quick Global Navigation</p>
              <p className="text-[11px] text-slate-400">
                Search across all medicines, generic substitutions, patients, doctors, and purchase orders.
              </p>
            </div>
          ) : (
            <>
              {/* App Modules & Features Matches */}
              {results.modules && results.modules.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 px-2">
                    Applications & Quick Features
                  </span>
                  <div className="space-y-1 mt-1">
                    {results.modules.map(mod => (
                      <button
                        key={mod.id}
                        onClick={() => {
                          onNavigate(mod.id);
                          onClose();
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-teal-50/70 border border-transparent hover:border-teal-200 flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                            →
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{mod.title}</p>
                            <p className="text-teal-700 text-[10px] uppercase font-bold tracking-wider">Direct Navigation</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-teal-600" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Medicines Matches */}
              {results.medicines.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                    Medicines & Generics
                  </span>
                  <div className="space-y-1 mt-1">
                    {results.medicines.map(med => (
                      <button
                        key={med.id}
                        onClick={() => {
                          onNavigate('inventory');
                          onClose();
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            <Pill className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{med.name}</p>
                            <p className="text-slate-500 text-[11px]">{med.genericName} • {med.strength}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          ₹{med.batches[0]?.sellingPrice || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Patients Matches */}
              {results.patients.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                    Patients
                  </span>
                  <div className="space-y-1 mt-1">
                    {results.patients.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onNavigate('patients');
                          onClose();
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{p.name}</p>
                            <p className="text-slate-500 text-[11px]">Phone: {p.phone}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suppliers Matches */}
              {results.suppliers.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                    Suppliers
                  </span>
                  <div className="space-y-1 mt-1">
                    {results.suppliers.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          onNavigate('suppliers');
                          onClose();
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{s.name}</p>
                            <p className="text-slate-500 text-[11px]">GSTIN: {s.gstin}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices Matches */}
              {results.transactions.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                    Invoices & Sales
                  </span>
                  <div className="space-y-1 mt-1">
                    {results.transactions.map(tx => (
                      <button
                        key={tx.id}
                        onClick={() => {
                          onNavigate('sales-returns');
                          onClose();
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{tx.id}</p>
                            <p className="text-slate-500 text-[11px]">Customer: {tx.patientName}</p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-900">₹{(tx.grandTotal ?? 0).toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Consultations Matches */}
              {results.consultations.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                    Clinic Consultations & Digital Rx
                  </span>
                  <div className="space-y-1 mt-1">
                    {results.consultations.map(con => (
                      <button
                        key={con.id}
                        onClick={() => {
                          onNavigate('clinic');
                          onClose();
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                            <Stethoscope className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{con.patientName} ({con.id})</p>
                            <p className="text-slate-500 text-[11px]">Diagnosis: {con.diagnosis}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
