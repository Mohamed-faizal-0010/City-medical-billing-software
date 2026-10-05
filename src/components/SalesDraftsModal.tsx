import React, { useState, useEffect } from 'react';
import {
  X,
  Archive,
  Save,
  Trash2,
  Play,
  Search,
  Clock,
  User,
  Stethoscope,
  ShoppingCart,
  AlertCircle,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { SalesDraft, CartItem } from '../types';
import { StorageService } from '../services/storage';

interface SalesDraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCart: CartItem[];
  currentPatientId?: string;
  currentPatientName?: string;
  currentPatientPhone?: string;
  currentDoctorId?: string;
  currentDoctorName?: string;
  currentGrandTotal: number;
  currentSubtotal: number;
  currentTotalDiscount: number;
  currentTotalTax: number;
  onSaveCurrentAsDraft: (note?: string, title?: string) => void;
  onResumeDraft: (draft: SalesDraft) => void;
  onDraftsUpdated?: () => void;
}

export const SalesDraftsModal: React.FC<SalesDraftsModalProps> = ({
  isOpen,
  onClose,
  currentCart,
  currentPatientId,
  currentPatientName,
  currentPatientPhone,
  currentDoctorId,
  currentDoctorName,
  currentGrandTotal,
  currentSubtotal,
  currentTotalDiscount,
  currentTotalTax,
  onSaveCurrentAsDraft,
  onResumeDraft,
  onDraftsUpdated
}) => {
  const [drafts, setDrafts] = useState<SalesDraft[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);

  // Manual save form state for active cart
  const [draftTitle, setDraftTitle] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Load drafts on open
  useEffect(() => {
    if (isOpen) {
      loadDrafts();
      setDraftTitle(currentPatientName || 'Walk-in Customer');
      setDraftNotes('');
      setSaveSuccessMsg(null);
    }
  }, [isOpen, currentPatientName]);

  const loadDrafts = () => {
    const loaded = StorageService.getSalesDrafts();
    setDrafts(loaded);
    if (onDraftsUpdated) onDraftsUpdated();
  };

  if (!isOpen) return null;

  // Handle Manual Save of Current Cart
  const handleManualSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentCart.length === 0) {
      alert('Current cart is empty. Add medicines to save as a draft.');
      return;
    }

    setIsSavingDraft(true);
    const newDraft: SalesDraft = {
      id: `DRF-SAL-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString(),
      title: draftTitle.trim() || currentPatientName || 'Counter Sale Draft',
      notes: draftNotes.trim() || undefined,
      patientName: currentPatientName || 'Walk-in Customer',
      patientId: currentPatientId,
      patientPhone: currentPatientPhone,
      doctorId: currentDoctorId,
      doctorName: currentDoctorName,
      cart: [...currentCart],
      itemCount: currentCart.length,
      subtotal: currentSubtotal,
      totalDiscount: currentTotalDiscount,
      totalTax: currentTotalTax,
      grandTotal: currentGrandTotal
    };

    StorageService.saveSalesDraft(newDraft);
    loadDrafts();
    setIsSavingDraft(false);
    setSaveSuccessMsg(`Sale draft "${newDraft.id}" saved successfully!`);
    onSaveCurrentAsDraft(draftNotes, draftTitle);

    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 4000);
  };

  // Handle Manual Delete of a Draft
  const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete sales draft "${id}"? This action cannot be undone.`)) {
      StorageService.deleteSalesDraft(id);
      loadDrafts();
    }
  };

  // Handle Clear All Drafts
  const handleClearAllDrafts = () => {
    if (drafts.length === 0) return;
    if (window.confirm(`Delete all ${drafts.length} saved sales drafts permanently?`)) {
      StorageService.clearAllSalesDrafts();
      loadDrafts();
    }
  };

  // Handle Resume Draft
  const handleResume = (draft: SalesDraft) => {
    onResumeDraft(draft);
    onClose();
  };

  // Filtered drafts list
  const filteredDrafts = drafts.filter(d => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchId = d.id.toLowerCase().includes(q);
    const matchPatient = (d.patientName || '').toLowerCase().includes(q);
    const matchNotes = (d.notes || '').toLowerCase().includes(q);
    const matchDoctor = (d.doctorName || '').toLowerCase().includes(q);
    const matchMed = d.cart.some(c => c.medicine.name.toLowerCase().includes(q));
    return matchId || matchPatient || matchNotes || matchDoctor || matchMed;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <Archive className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Sales Drafts Manager</h3>
                <span className="px-2 py-0.5 bg-teal-500/40 text-teal-100 rounded-full text-xs font-mono font-bold">
                  {drafts.length} Saved
                </span>
              </div>
              <p className="text-xs text-teal-100">
                Manually save, recall, or delete active sales. Drafts remain securely saved until removed.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Container */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Success Banner */}
          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* SECTION: Save Active Cart as Draft */}
          {currentCart.length > 0 ? (
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4 text-teal-700" />
                  <span className="text-xs font-extrabold text-teal-950 uppercase tracking-wider">
                    Save Active Counter Sale as Draft
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-teal-800">
                    {currentCart.length} item{currentCart.length > 1 ? 's' : ''} • ₹{currentGrandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Customer / Reference Name
                  </label>
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={e => setDraftTitle(e.target.value)}
                    placeholder="e.g., Ramesh Kumar, Token #4"
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Remarks / Hold Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={draftNotes}
                    onChange={e => setDraftNotes(e.target.value)}
                    placeholder="e.g., Customer stepped to ATM, Awaiting Rx"
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleManualSave()}
                  disabled={isSavingDraft}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft to Storage</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2 text-slate-500 text-xs">
              <ShoppingCart className="w-4 h-4 text-slate-400" />
              <span>Current sales cart is empty. Add products to save as a new draft.</span>
            </div>
          )}

          {/* SECTION: Saved Drafts List */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Saved Sales Drafts ({drafts.length})
                </h4>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by customer, drug, ID..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Draft Cards */}
            {filteredDrafts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Archive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No Sales Drafts Found</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  Add items to your sale cart and click "Save Draft to Storage" or press <kbd className="px-1 py-0.5 bg-slate-200 rounded text-[10px]">F8</kbd> to save a draft manually.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredDrafts.map(draft => {
                  const isExpanded = expandedDraftId === draft.id;
                  return (
                    <div
                      key={draft.id}
                      className="p-3.5 bg-white border border-slate-200 hover:border-teal-300 rounded-2xl shadow-2xs transition-all space-y-2.5"
                    >
                      {/* Top Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100">
                            {draft.id}
                          </span>
                          <span className="font-bold text-xs text-slate-900">
                            {draft.title || draft.patientName}
                          </span>
                          {draft.patientPhone && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              ({draft.patientPhone})
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-black text-sm text-slate-900">
                            ₹{draft.grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Middle Row: Meta */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{draft.timestamp || new Date(draft.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3 text-slate-400" />
                            <span>{(draft.cart || []).length} medicine{(draft.cart || []).length > 1 ? 's' : ''}</span>
                          </span>
                          {draft.doctorName && (
                            <span className="hidden sm:flex items-center gap-1">
                              <Stethoscope className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[130px]">{draft.doctorName}</span>
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setExpandedDraftId(isExpanded ? null : draft.id)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Preview item details"
                          >
                            <span>Items</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          <button
                            onClick={() => handleResume(draft)}
                            className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
                            title="Resume this sale in POS"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Resume</span>
                          </button>

                          <button
                            onClick={e => handleDeleteDraft(draft.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete this draft permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Notes badge */}
                      {draft.notes && (
                        <div className="p-2 bg-amber-50/70 border border-amber-200/70 rounded-xl text-[11px] text-amber-900 font-medium flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{draft.notes}</span>
                        </div>
                      )}

                      {/* Expanded Line Items preview */}
                      {isExpanded && (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs animate-in fade-in">
                          <div className="font-bold text-[10px] text-slate-500 uppercase tracking-wider flex justify-between border-b border-slate-200 pb-1">
                            <span>Medicine Name & Batch</span>
                            <span>Qty × Rate</span>
                          </div>
                          {draft.cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-slate-700 py-0.5">
                              <div>
                                <span className="font-bold text-slate-900">{item.medicine.name}</span>
                                <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                                  [{item.selectedBatch.batchNumber}]
                                </span>
                              </div>
                              <span className="font-mono text-slate-800 font-semibold">
                                {item.unitType === 'loose'
                                  ? `${item.looseQuantity || 1} Tab`
                                  : `${item.quantity} Pack`} × ₹{(item.customMrp || item.selectedBatch.sellingPrice).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {drafts.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllDrafts}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Drafts</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
