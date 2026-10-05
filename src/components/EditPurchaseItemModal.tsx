import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Calculator, Edit3, Package, DollarSign, Percent, AlertCircle } from 'lucide-react';
import { PurchaseInvoiceItem } from '../types';
import { ExpiryMonthYearInput } from './ExpiryMonthYearInput';

interface EditPurchaseItemModalProps {
  item: PurchaseInvoiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: PurchaseInvoiceItem) => void;
}

export const EditPurchaseItemModal: React.FC<EditPurchaseItemModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  const [medicineName, setMedicineName] = useState(item?.medicineName || '');
  const [genericName, setGenericName] = useState(item?.genericName || '');
  const [hsnCode, setHsnCode] = useState(item?.hsnCode || '300490');
  const [batchNumber, setBatchNumber] = useState(item?.batchNumber || '');
  const [expiryDate, setExpiryDate] = useState(item?.expiryDate || '');
  const [pack, setPack] = useState(item?.pack || '10s');
  const [boxes, setBoxes] = useState<number>(item?.boxes || 1);
  const [unitsPerBox, setUnitsPerBox] = useState<number>(item?.unitsPerBox || 10);
  const [billedQuantity, setBilledQuantity] = useState<number>(item?.billedQuantity || 0);
  const [freeQuantity, setFreeQuantity] = useState<number>(item?.freeQuantity || 0);
  const [mrp, setMrp] = useState<number>(item?.mrp || 0);
  const [purchaseRate, setPurchaseRate] = useState<number>(item?.purchaseRate || 0);
  const [schemePercentage, setSchemePercentage] = useState<number>(item?.schemePercentage || 0);
  const [discountPercentage, setDiscountPercentage] = useState<number>(item?.discountPercentage || 0);
  const [gstRate, setGstRate] = useState<number>(item?.gstRate || 12);
  const [isManualQty, setIsManualQty] = useState<boolean>(false);

  // Sync state if item changes
  useEffect(() => {
    if (item) {
      setMedicineName(item.medicineName);
      setGenericName(item.genericName || '');
      setHsnCode(item.hsnCode || '300490');
      setBatchNumber(item.batchNumber);
      setExpiryDate(item.expiryDate);
      setPack(item.pack || '10s');
      setBoxes(item.boxes || 1);
      setUnitsPerBox(item.unitsPerBox || 10);
      setBilledQuantity(item.billedQuantity);
      setFreeQuantity(item.freeQuantity || 0);
      setMrp(item.mrp || 0);
      setPurchaseRate(item.purchaseRate || 0);
      setSchemePercentage(item.schemePercentage || 0);
      setDiscountPercentage(item.discountPercentage || 0);
      setGstRate(item.gstRate || 12);
      setIsManualQty(item.billedQuantity !== (item.boxes || 1) * (item.unitsPerBox || 10));
    }
  }, [item]);

  // Handle box or unit change
  const handleBoxesChange = (val: number) => {
    setBoxes(val);
    if (!isManualQty) {
      setBilledQuantity(val * unitsPerBox);
    }
  };

  const handleUnitsChange = (val: number) => {
    setUnitsPerBox(val);
    if (!isManualQty) {
      setBilledQuantity(boxes * val);
    }
  };

  // Real-time calculation
  const calculations = useMemo(() => {
    const qty = Math.max(0, billedQuantity || 0);
    const free = Math.max(0, freeQuantity || 0);
    const totalQty = qty + free;

    const baseAmount = qty * purchaseRate;
    const schemeAmt = (baseAmount * (schemePercentage || 0)) / 100;
    const afterScheme = Math.max(0, baseAmount - schemeAmt);
    const discountAmt = (afterScheme * (discountPercentage || 0)) / 100;
    const taxableAmt = Math.max(0, afterScheme - discountAmt);
    const gstAmt = (taxableAmt * (gstRate || 0)) / 100;
    const netAmt = taxableAmt + gstAmt;

    const marginPct = mrp > 0 ? Math.max(0, ((mrp - purchaseRate) / mrp) * 100) : 0;

    return {
      totalQuantity: totalQty,
      baseAmount,
      schemeAmount: schemeAmt,
      discountAmount: discountAmt,
      taxableAmount: taxableAmt,
      gstAmount: gstAmt,
      netAmount: netAmt,
      marginPercentage: marginPct,
    };
  }, [billedQuantity, freeQuantity, purchaseRate, schemePercentage, discountPercentage, gstRate, mrp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!batchNumber.trim()) {
      alert('Batch Number is required');
      return;
    }

    if (!expiryDate.trim()) {
      alert('Expiry Date is required (e.g. 2028-06)');
      return;
    }

    if (billedQuantity <= 0 && freeQuantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    if (purchaseRate <= 0) {
      alert('Purchase Rate must be greater than 0');
      return;
    }

    const updated: PurchaseInvoiceItem = {
      ...item,
      medicineName: medicineName.trim(),
      genericName: genericName.trim() || undefined,
      hsnCode: hsnCode.trim() || '300490',
      batchNumber: batchNumber.trim().toUpperCase(),
      expiryDate: expiryDate.trim(),
      pack: pack.trim() || '10s',
      boxes: Number(boxes) || 1,
      unitsPerBox: Number(unitsPerBox) || 10,
      billedQuantity: Number(billedQuantity) || 0,
      freeQuantity: Number(freeQuantity) || 0,
      totalQuantity: calculations.totalQuantity,
      mrp: Number(mrp) || 0,
      purchaseRate: Number(purchaseRate) || 0,
      schemePercentage: Number(schemePercentage) || 0,
      schemeAmount: calculations.schemeAmount,
      discountPercentage: Number(discountPercentage) || 0,
      discountAmount: calculations.discountAmount,
      taxableAmount: calculations.taxableAmount,
      gstRate: Number(gstRate) || 0,
      gstAmount: calculations.gstAmount,
      netAmount: calculations.netAmount,
    };

    onSave(updated);
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-wide">Edit Purchase Entry Item</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-100 text-[10px] font-bold uppercase tracking-wider">
                  Line Editor
                </span>
              </div>
              <p className="text-xs text-amber-100/90 font-medium mt-0.5">
                {medicineName} • Batch: {batchNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Section 1: Medicine Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Medicine Name *
              </label>
              <input
                type="text"
                required
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Generic Molecule
              </label>
              <input
                type="text"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                placeholder="e.g. Paracetamol"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Section 2: Batch, Expiry, Pack & HSN */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Batch No *
              </label>
              <input
                type="text"
                required
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
                placeholder="DL-993A"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Expiry (Month / Year) *
              </label>
              <ExpiryMonthYearInput
                id="edit-modal-expiry"
                value={expiryDate}
                onChange={setExpiryDate}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pack Type
              </label>
              <input
                type="text"
                value={pack}
                onChange={(e) => setPack(e.target.value)}
                placeholder="10s / 1x10"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                HSN Code
              </label>
              <input
                type="text"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                placeholder="300490"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Section 3: Quantity & Packaging */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-600" />
                Quantity & Package Breakdown
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={isManualQty}
                  onChange={(e) => setIsManualQty(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Override Billed Qty Manually</span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Boxes</label>
                <input
                  type="number"
                  min="0"
                  value={boxes}
                  onChange={(e) => handleBoxesChange(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-center font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Units / Box</label>
                <input
                  type="number"
                  min="1"
                  value={unitsPerBox}
                  onChange={(e) => handleUnitsChange(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-center font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Billed Units *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  disabled={!isManualQty}
                  value={billedQuantity}
                  onChange={(e) => setBilledQuantity(Math.max(0, Number(e.target.value) || 0))}
                  className={`w-full px-3 py-1.5 border rounded-xl text-xs font-mono text-center font-black ${
                    isManualQty
                      ? 'bg-white border-amber-300 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden'
                      : 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed'
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-1">
                  Free Units
                </label>
                <input
                  type="number"
                  min="0"
                  value={freeQuantity}
                  onChange={(e) => setFreeQuantity(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs font-mono text-center font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 px-1 pt-1 border-t border-slate-200/70">
              <span>
                Calculation: {boxes} boxes × {unitsPerBox} units = <strong>{billedQuantity}</strong> units
              </span>
              <span className="font-bold text-teal-800">
                Total Inward Stock: {calculations.totalQuantity} units ({billedQuantity} + {freeQuantity} free)
              </span>
            </div>
          </div>

          {/* Section 4: Rates, Schemes & Taxes */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                MRP (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={mrp}
                onChange={(e) => setMrp(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 text-right focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Purchase Rate (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={purchaseRate}
                onChange={(e) => setPurchaseRate(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 text-right focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Scheme %
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={schemePercentage}
                onChange={(e) => setSchemePercentage(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 text-center focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Trade Disc %
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 text-center focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                GST Rate %
              </label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 text-center focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>
          </div>

          {/* Section 5: Live Summary Box */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-amber-700" />
                Live Line Calculation Preview
              </span>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Gross Margin: {calculations.marginPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                <span className="text-[10px] text-slate-500 block uppercase">Base Value</span>
                <span className="font-mono font-bold text-slate-800">₹{calculations.baseAmount.toFixed(2)}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                <span className="text-[10px] text-slate-500 block uppercase">Taxable Value</span>
                <span className="font-mono font-bold text-slate-900">₹{calculations.taxableAmount.toFixed(2)}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                <span className="text-[10px] text-slate-500 block uppercase">GST ({gstRate}%)</span>
                <span className="font-mono font-bold text-slate-900">+₹{calculations.gstAmount.toFixed(2)}</span>
              </div>
              <div className="bg-amber-100/70 p-2.5 rounded-xl border border-amber-300">
                <span className="text-[10px] text-amber-900 font-bold block uppercase">Net Line Total</span>
                <span className="font-mono font-black text-amber-950 text-sm">
                  ₹{calculations.netAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes to Line Item</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
