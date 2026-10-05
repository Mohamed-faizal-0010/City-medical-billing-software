import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Calendar,
  Layers,
  FileText,
  User,
  History,
  ArrowRight
} from 'lucide-react';
import { Medicine, MedicineBatch, StockAdjustment } from '../types';
import { StorageService } from '../services/storage';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicine: Medicine | null;
  batch?: MedicineBatch | null;
  initialType?: 'ADD' | 'REMOVE';
  onSuccess: (adjustment: StockAdjustment) => void;
}

const ADD_REASONS = [
  'Physical stock count surplus',
  'Supplier bonus / free goods inward',
  'Unbilled purchase arrival',
  'Customer return (shelf restocking)',
  'Packing recount correction',
  'Clinical sample stock received',
  'Discrepancy reconciliation'
];

const REMOVE_REASONS = [
  'Damaged ampoule / broken vial',
  'Broken tablet strip / leaked bottle',
  'Expired drug disposal / biohazard write-off',
  'Physical stock shortage / shrinkage',
  'Dispensing breakage / drop error',
  'Damaged packaging / seal broken',
  'Return to distributor (debit note)',
  'Clinical sample / doctor test'
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  medicine,
  batch: initialBatch,
  initialType = 'ADD',
  onSuccess
}) => {
  const [mode, setMode] = useState<'ADD' | 'REMOVE'>(initialType);
  const [selectedBatchNumber, setSelectedBatchNumber] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [viewHistoryTab, setViewHistoryTab] = useState(false);
  const [recentAdjustments, setRecentAdjustments] = useState<StockAdjustment[]>([]);

  useEffect(() => {
    if (medicine) {
      const medBatches = Array.isArray(medicine.batches) ? medicine.batches : [];
      if (initialBatch) {
        setSelectedBatchNumber(initialBatch.batchNumber);
      } else if (medBatches.length > 0) {
        setSelectedBatchNumber(medBatches[0].batchNumber);
      }
      setMode(initialType);
      setQuantity(1);
      setReason(initialType === 'ADD' ? ADD_REASONS[0] : REMOVE_REASONS[0]);
      setNotes('');
      setViewHistoryTab(false);

      // Load recent adjustments for this medicine
      const allAdj = StorageService.getStockAdjustments();
      setRecentAdjustments((allAdj || []).filter(a => a.medicineId === medicine.id));
    }
  }, [medicine, initialBatch, initialType, isOpen]);

  if (!isOpen || !medicine) return null;

  const batches = Array.isArray(medicine.batches) ? medicine.batches : [];
  const activeBatch = batches.find(b => b.batchNumber === selectedBatchNumber) || batches[0];
  const currentStock = activeBatch ? (activeBatch.stock || 0) : 0;
  const deltaQuantity = mode === 'ADD' ? quantity : -quantity;
  const resultingStock = Math.max(0, Math.round((currentStock + deltaQuantity) * 100) / 100);

  const currentUser = StorageService.getCurrentUser();

  const handleModeChange = (newMode: 'ADD' | 'REMOVE') => {
    setMode(newMode);
    setReason(newMode === 'ADD' ? ADD_REASONS[0] : REMOVE_REASONS[0]);
  };

  const handleApplyDelta = (amt: number) => {
    setQuantity(prev => Math.max(1, prev + amt));
  };

  const handleSetDirectQty = (qty: number) => {
    setQuantity(Math.max(1, qty));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBatch) {
      alert('Please select an active batch to adjust.');
      return;
    }

    if (quantity <= 0) {
      alert('Adjustment quantity must be greater than zero.');
      return;
    }

    if (mode === 'REMOVE' && quantity > currentStock) {
      const confirmExceed = window.confirm(
        `Remove quantity (${quantity}) is greater than current stock (${currentStock}). Stock will become 0. Proceed?`
      );
      if (!confirmExceed) return;
    }

    const adjustment = StorageService.adjustBatchStock(
      medicine.id,
      activeBatch.batchNumber,
      deltaQuantity,
      reason,
      notes,
      currentUser?.name || 'Chief Pharmacist'
    );

    if (adjustment) {
      onSuccess(adjustment);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full flex flex-col overflow-hidden max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                mode === 'ADD'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {mode === 'ADD' ? (
                <PlusCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <MinusCircle className="w-5 h-5 text-rose-600" />
              )}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Stock Adjust (Add / Remove)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Physical Inventory Reconciliation & FEFO Audit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewHistoryTab(prev => !prev)}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                viewHistoryTab
                  ? 'bg-teal-100 text-teal-800'
                  : 'text-slate-500 hover:bg-slate-200/60'
              }`}
              title="View past adjustments history"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Audit Log</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {viewHistoryTab ? (
            /* Audit Log History Panel */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Past Stock Adjustments ({recentAdjustments.length})
                </span>
                <button
                  type="button"
                  onClick={() => setViewHistoryTab(false)}
                  className="text-xs font-semibold text-teal-700 hover:underline"
                >
                  Back to Adjust
                </button>
              </div>

              {recentAdjustments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No adjustments recorded yet for this medicine.
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {recentAdjustments.map(adj => (
                    <div
                      key={adj.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                            adj.type === 'ADD'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {adj.type === 'ADD' ? `+ Added ${adj.quantity}` : `- Removed ${adj.quantity}`} units
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">
                          {new Date(adj.date).toLocaleDateString()} {new Date(adj.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 font-mono text-[11px]">
                        <span>Batch: #{adj.batchNumber}</span>
                        <span>{adj.previousStock} → <strong className="text-slate-900">{adj.newStock}</strong> units</span>
                      </div>
                      <div className="text-slate-700 font-medium">
                        Reason: <span className="font-normal">{adj.reason}</span>
                      </div>
                      {adj.customNotes && (
                        <div className="text-slate-500 italic text-[11px]">
                          Note: "{adj.customNotes}"
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Adjusted by {adj.adjustedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Main Stock Adjust Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Medicine & Batch Info Header */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{medicine.name}</h3>
                    <p className="text-xs text-slate-500">{medicine.genericName} • {medicine.form}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg shrink-0">
                    Rack {medicine.rackLocation || 'A-01'}
                  </span>
                </div>

                {/* Batch Selector if multiple batches exist */}
                {batches.length > 1 ? (
                  <div className="pt-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Select Target Batch:
                    </label>
                    <select
                      value={selectedBatchNumber}
                      onChange={e => setSelectedBatchNumber(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                    >
                      {batches.map(b => (
                        <option key={b.batchNumber} value={b.batchNumber}>
                          Batch #{b.batchNumber} (Exp: {b.expiryDate}) • Current: {b.stock} units
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1 font-mono">
                    <span>Batch: <strong>#{activeBatch?.batchNumber || 'MAIN'}</strong></span>
                    <span>Expiry: {activeBatch?.expiryDate || 'N/A'}</span>
                  </div>
                )}
              </div>

              {/* Mode Toggle: ADD vs REMOVE */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Adjustment Operation
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleModeChange('ADD')}
                    id="adjust-mode-add"
                    className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                      mode === 'ADD'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Add Stock (Surplus/Inward)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('REMOVE')}
                    id="adjust-mode-remove"
                    className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                      mode === 'REMOVE'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" />
                    <span>- Remove Stock (Damage/Expiry)</span>
                  </button>
                </div>
              </div>

              {/* Quantity Adjustment Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Adjustment Quantity
                  </label>
                  <span className="text-xs text-slate-500">Units to {mode === 'ADD' ? 'add' : 'deduct'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyDelta(-5)}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyDelta(-1)}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    -1
                  </button>

                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                      className={`w-full px-4 py-2.5 border rounded-xl font-mono text-xl font-black text-center focus:ring-2 focus:outline-none ${
                        mode === 'ADD'
                          ? 'border-emerald-300 text-emerald-800 focus:ring-emerald-500'
                          : 'border-rose-300 text-rose-800 focus:ring-rose-500'
                      }`}
                    />
                    <span className="absolute right-3 top-3 text-xs text-slate-400 font-semibold pointer-events-none">
                      units
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyDelta(1)}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyDelta(5)}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    +5
                  </button>
                </div>

                {/* Quick Increment Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quick:</span>
                  {[1, 5, 10, 25, 50, 100].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSetDirectQty(amt)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold font-mono transition-colors ${
                        quantity === amt
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-Time Stock Calculation Projection Banner */}
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
                  mode === 'ADD'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50/70 border-rose-200 text-rose-950'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase tracking-wider opacity-75">Current Stock</div>
                  <div className="font-mono text-sm font-bold">{currentStock} units</div>
                </div>

                <div className="flex items-center gap-1 text-slate-400 font-black">
                  <ArrowRight className="w-4 h-4" />
                </div>

                <div className="space-y-0.5 text-center">
                  <div className="text-[10px] uppercase tracking-wider opacity-75">Adjustment</div>
                  <div
                    className={`font-mono text-sm font-black ${
                      mode === 'ADD' ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {mode === 'ADD' ? `+${quantity}` : `-${quantity}`}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-400 font-black">
                  <ArrowRight className="w-4 h-4" />
                </div>

                <div className="space-y-0.5 text-right">
                  <div className="text-[10px] uppercase tracking-wider opacity-75">Resulting Stock</div>
                  <div className="font-mono text-base font-black text-slate-900">{resultingStock} units</div>
                </div>
              </div>

              {/* Reason Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Reason for Adjustment *
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  {(mode === 'ADD' ? ADD_REASONS : REMOVE_REASONS).map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Custom Notes / Remark (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g., Ampoule cracked during unloading, reported to manager"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Staff Sign-off */}
              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                <span>Authorized Pharmacist:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {currentUser?.name || 'Chief Pharmacist (Admin)'}
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="confirm-stock-adjustment-btn"
                  className={`flex-1 py-2.5 px-4 text-white font-black rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'ADD'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Confirm {mode === 'ADD' ? `+${quantity}` : `-${quantity}`} Units Adjustment
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
