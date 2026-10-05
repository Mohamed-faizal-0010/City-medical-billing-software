import React, { useState, useEffect } from 'react';
import { Tag, Percent, IndianRupee, X, Check, ArrowRight, Sparkles, RotateCcw } from 'lucide-react';

interface TotalDiscountEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  currentTotalDiscount: number;
  onApplyDiscount: (options: {
    mode: 'percent' | 'amount';
    value: number;
    distribution: 'proportional' | 'bill_level';
  }) => void;
}

export const TotalDiscountEditModal: React.FC<TotalDiscountEditModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  currentTotalDiscount,
  onApplyDiscount
}) => {
  const currentPercent = subtotal > 0 ? (currentTotalDiscount / subtotal) * 100 : 0;

  const [mode, setMode] = useState<'percent' | 'amount'>('percent');
  const [percentVal, setPercentVal] = useState<string>(
    currentPercent > 0 ? currentPercent.toFixed(1) : '10'
  );
  const [amountVal, setAmountVal] = useState<string>(
    currentTotalDiscount > 0 ? currentTotalDiscount.toFixed(2) : '50'
  );
  const [distribution, setDistribution] = useState<'proportional' | 'bill_level'>('proportional');

  // Compute calculated amounts for preview
  const numPercent = Math.min(100, Math.max(0, parseFloat(percentVal) || 0));
  const numAmount = Math.min(subtotal, Math.max(0, parseFloat(amountVal) || 0));

  const calculatedDiscountAmt =
    mode === 'percent' ? (subtotal * numPercent) / 100 : numAmount;

  const calculatedDiscountPercent =
    subtotal > 0
      ? mode === 'percent'
        ? numPercent
        : (numAmount / subtotal) * 100
      : 0;

  const calculatedNetPayable = Math.max(0, subtotal - calculatedDiscountAmt);

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onApplyDiscount({
      mode,
      value: mode === 'percent' ? numPercent : numAmount,
      distribution
    });
    onClose();
  };

  const handleSetPercent = (pct: number) => {
    setMode('percent');
    setPercentVal(String(pct));
  };

  const handleSetAmount = (amt: number) => {
    setMode('amount');
    setAmountVal(String(amt));
  };

  const handleRoundOff = () => {
    // Round down the net total to nearest 10
    const roundedNet = Math.floor(subtotal / 10) * 10;
    const diff = subtotal - roundedNet;
    setMode('amount');
    setAmountVal(diff.toFixed(2));
  };

  const handleClearDiscount = () => {
    onApplyDiscount({
      mode: 'percent',
      value: 0,
      distribution: 'proportional'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Edit Total Discount</h2>
              <p className="text-[11px] text-slate-400">
                Apply counter discount on entire bill gross total
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleApply} className="p-6 space-y-5">
          {/* Mode Switcher: Percentage vs Flat Amount */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode('percent')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'percent'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Percent className="w-3.5 h-3.5 text-emerald-600" />
              <span>Discount by % (Percent)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('amount')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'amount'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              <span>Discount by ₹ (Flat Amount)</span>
            </button>
          </div>

          {/* Value Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              {mode === 'percent' ? 'Discount Percentage (%)' : 'Discount Flat Amount (₹)'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                {mode === 'percent' ? (
                  <Percent className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="font-bold text-emerald-600 font-mono">₹</span>
                )}
              </div>
              <input
                type="number"
                step={mode === 'percent' ? '0.5' : '1'}
                min="0"
                max={mode === 'percent' ? '100' : String(subtotal)}
                value={mode === 'percent' ? percentVal : amountVal}
                onChange={e => {
                  if (mode === 'percent') setPercentVal(e.target.value);
                  else setAmountVal(e.target.value);
                }}
                autoFocus
                placeholder={mode === 'percent' ? 'e.g. 10%' : 'e.g. 50'}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-mono font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Quick Discount Presets
            </span>
            {mode === 'percent' ? (
              <div className="flex flex-wrap gap-1.5">
                {[5, 10, 12, 15, 20, 25].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleSetPercent(pct)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      numPercent === pct
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {[10, 20, 50, 100, 200].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSetAmount(amt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      numAmount === amt
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleRoundOff}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                  title="Round off bill amount to nearest ₹10"
                >
                  Round Off
                </button>
              </div>
            )}
          </div>

          {/* Distribution Option */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Application Strategy
            </span>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`p-2.5 rounded-xl border text-xs cursor-pointer flex flex-col justify-between ${
                  distribution === 'proportional'
                    ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                    : 'bg-slate-50/60 border-slate-200 text-slate-600 font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="dist"
                    checked={distribution === 'proportional'}
                    onChange={() => setDistribution('proportional')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Distribute to Items</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Updates each item's discount % for itemized receipts
                </span>
              </label>

              <label
                className={`p-2.5 rounded-xl border text-xs cursor-pointer flex flex-col justify-between ${
                  distribution === 'bill_level'
                    ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                    : 'bg-slate-50/60 border-slate-200 text-slate-600 font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="dist"
                    checked={distribution === 'bill_level'}
                    onChange={() => setDistribution('bill_level')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Bill-Level Cash Disc</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Keeps item prices intact and subtracts on invoice total
                </span>
              </label>
            </div>
          </div>

          {/* Calculation Live Summary */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Gross Bill Subtotal:</span>
              <span className="font-mono font-bold text-slate-800">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Total Discount to Deduct:</span>
              <span className="font-mono">
                -₹{calculatedDiscountAmt.toFixed(2)} ({calculatedDiscountPercent.toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-emerald-200">
              <span>Net Payable Amount:</span>
              <span className="font-mono text-emerald-800 text-base">
                ₹{calculatedNetPayable.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {currentTotalDiscount > 0 && (
              <button
                type="button"
                onClick={handleClearDiscount}
                className="px-3 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                title="Remove all discounts"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Apply Total Discount</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
