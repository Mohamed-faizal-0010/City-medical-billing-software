import React, { useState, useEffect, useMemo } from 'react';
import { Pill, X, CheckCircle2, Barcode, ShieldAlert, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { Medicine, PRODUCT_CATEGORIES, PRODUCT_FORMS } from '../types';
import { StorageService } from '../services/storage';
import { getMedicineScheduleInfo, ScheduleClassification } from '../utils/scheduleDrugUtils';

interface QuickAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (
    newMedicine: Medicine,
    initialBatchDetails?: {
      batch: string;
      expiry: string;
      costPrice: number;
      mrp: number;
      pack: string;
    }
  ) => void;
  initialQuery?: string;
}

export const QuickAddProductModal: React.FC<QuickAddProductModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
  initialQuery = ''
}) => {
  const [name, setName] = useState(initialQuery);
  const [genericName, setGenericName] = useState('');
  const [form, setForm] = useState('Tablet');
  const [strength, setStrength] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [category, setCategory] = useState<string>('Analgesic & Antipyretic');
  const [hsnCode, setHsnCode] = useState('300490');
  const [taxRate, setTaxRate] = useState<number>(12);
  const [pack, setPack] = useState('10 Tablets');
  const [scheduleType, setScheduleType] = useState<ScheduleClassification | 'None'>('OTC');
  const [isScheduleManual, setIsScheduleManual] = useState(false);
  const [prescriptionRequired, setPrescriptionRequired] = useState(false);
  const [minStockAlert, setMinStockAlert] = useState(20);

  // Initial batch details for immediate inward entry
  const [batchNumber, setBatchNumber] = useState(`BAT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [purchaseRate, setPurchaseRate] = useState<number>(20);
  const [mrp, setMrp] = useState<number>(35);
  const [error, setError] = useState<string | null>(null);

  // Automatically detect Schedule Drug classification when typing name or generic/salt composition
  useEffect(() => {
    if (!isScheduleManual) {
      const detected = getMedicineScheduleInfo({ name, genericName, category });
      if (detected.isScheduled) {
        setScheduleType(detected.scheduleType);
        if (detected.scheduleType === 'H1' || detected.scheduleType === 'H' || detected.scheduleType === 'X') {
          setPrescriptionRequired(true);
        }
      } else {
        // If categories like Soap, Shampoo, Paste, Biscuits, Candy, Food Products
        const lowerCat = category.toLowerCase();
        if (
          lowerCat.includes('soap') ||
          lowerCat.includes('shampoo') ||
          lowerCat.includes('paste') ||
          lowerCat.includes('biscuit') ||
          lowerCat.includes('candy') ||
          lowerCat.includes('food')
        ) {
          setScheduleType('OTC');
          setPrescriptionRequired(false);
        }
      }
    }
  }, [name, genericName, category, isScheduleManual]);

  const scheduleInfo = useMemo(() => {
    return getMedicineScheduleInfo({ name, genericName, category, scheduleType });
  }, [name, genericName, category, scheduleType]);

  // Validation: Purchase rate must be strictly less than MRP
  const isRateInvalid = mrp > 0 && purchaseRate >= mrp;

  if (!isOpen) return null;

  // Key navigation helper to move to next input field on Enter
  const handleKeyDownEnter = (nextFieldId: string) => (e: React.KeyboardEvent<any>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const el = document.getElementById(nextFieldId);
      if (el) {
        el.focus();
        if (el instanceof HTMLInputElement && el.select) el.select();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a Brand / Product Name');
      return;
    }
    if (!genericName.trim() && !category.match(/soap|shampoo|paste|biscuit|candy|food/i)) {
      setError('Please provide the Generic Salt / Molecule Name');
      return;
    }

    const numRate = Number(purchaseRate) || 0;
    const numMrp = Number(mrp) || 0;

    // Strict validation: Purchase rate must be less than MRP
    if (numMrp > 0 && numRate >= numMrp) {
      setError(`⚠️ Purchase Rate (₹${numRate}) must be strictly less than MRP (₹${numMrp})! Cannot purchase at or above MRP.`);
      return;
    }

    // Schedule H1 enforcement: Schedule H1 drugs must have prescriptionRequired = true
    const isH1 = scheduleType === 'H1' || scheduleInfo.scheduleType === 'H1';
    const effectivePrescriptionRequired = isH1 ? true : prescriptionRequired;

    const newMedId = `med-cust-${Date.now()}`;
    const cleanPack = pack.trim() || `10 ${form}s`;

    const newMedicine: Medicine = {
      id: newMedId,
      name: name.trim(),
      genericName: genericName.trim() || name.trim(),
      strength: strength.trim() || 'Standard',
      form,
      manufacturer: manufacturer.trim() || 'Standard Healthcare / FMCG',
      category,
      prescriptionRequired: effectivePrescriptionRequired,
      scheduleType: scheduleType as any,
      hsnCode: hsnCode.trim() || '300490',
      taxRate: Number(taxRate) || 12,
      minStockAlert: Number(minStockAlert) || 20,
      batches: [
        {
          batchNumber: batchNumber.trim().toUpperCase(),
          expiryDate: expiryDate.trim(),
          manufacturingDate: new Date().toISOString().split('T')[0],
          stock: 0, // Inward bill will increase stock upon saving
          costPrice: numRate,
          sellingPrice: numMrp,
          mrp: numMrp,
          location: 'Main Shelf / Storage'
        }
      ]
    };

    // Save to storage
    StorageService.updateMedicine(newMedicine);

    onProductAdded(newMedicine, {
      batch: batchNumber.trim().toUpperCase(),
      expiry: expiryDate.trim(),
      costPrice: numRate,
      mrp: numMrp,
      pack: cleanPack
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-3xl w-full border border-slate-200 shadow-2xl space-y-4 my-auto animate-fadeIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 shrink-0">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Add New Product to Catalog</h3>
              <p className="text-xs text-slate-500">
                Medicines, Soap, Shampoo, Paste, Biscuits, Candies & Food Products with Auto-Schedule Detection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {/* Product / Brand Name */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Brand / Product Name *
              </label>
              <input
                id="qadd-name"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={handleKeyDownEnter('qadd-strength')}
                placeholder="e.g. Augmentin 625 Duo, Dettol Soap, Parle-G"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Strength */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Strength / Weight
              </label>
              <input
                id="qadd-strength"
                type="text"
                value={strength}
                onChange={e => setStrength(e.target.value)}
                onKeyDown={handleKeyDownEnter('qadd-generic')}
                placeholder="e.g. 625mg, 100g, 200ml"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Generic / Molecule Composition */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Generic Composition / Salt Description *
              </label>
              <input
                id="qadd-generic"
                type="text"
                value={genericName}
                onChange={e => setGenericName(e.target.value)}
                onKeyDown={handleKeyDownEnter('qadd-form')}
                placeholder="e.g. Cefixime (200mg), Chloroxylenol, Calcium Carbonate"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Dosage Form */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Product Form
              </label>
              <select
                id="qadd-form"
                value={form}
                onChange={e => {
                  setForm(e.target.value);
                  setPack(`1 ${e.target.value}`);
                }}
                onKeyDown={handleKeyDownEnter('qadd-category')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                {PRODUCT_FORMS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Product Category (Medicines & FMCG) *
              </label>
              <select
                id="qadd-category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                onKeyDown={handleKeyDownEnter('qadd-mfr')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                {PRODUCT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Manufacturer / Brand
              </label>
              <input
                id="qadd-mfr"
                type="text"
                value={manufacturer}
                onChange={e => setManufacturer(e.target.value)}
                onKeyDown={handleKeyDownEnter('qadd-pack')}
                placeholder="e.g. Cipla, Reckitt, HUL, Britannia"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Pack Size */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pack Size
              </label>
              <input
                id="qadd-pack"
                type="text"
                value={pack}
                onChange={e => setPack(e.target.value)}
                onKeyDown={handleKeyDownEnter('qadd-hsn')}
                placeholder="e.g. 10 Tablets / 100g / 1 Pack"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* HSN Code */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                HSN Code
              </label>
              <input
                id="qadd-hsn"
                type="text"
                value={hsnCode}
                onChange={e => setHsnCode(e.target.value)}
                onKeyDown={handleKeyDownEnter('qadd-tax')}
                placeholder="300490"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* GST Rate */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                GST Tax Rate
              </label>
              <select
                id="qadd-tax"
                value={taxRate}
                onChange={e => setTaxRate(Number(e.target.value))}
                onKeyDown={handleKeyDownEnter('qadd-schedule')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5% (Basic FMCG / Meds)</option>
                <option value={12}>12% (Standard Pharma)</option>
                <option value={18}>18% (Cosmetics / Food)</option>
                <option value={28}>28%</option>
              </select>
            </div>

            {/* Statutory Schedule Classification */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Drug Schedule</span>
                {scheduleInfo.isScheduled && (
                  <span className="text-[10px] text-teal-700 font-extrabold">Auto-Detected</span>
                )}
              </label>
              <select
                id="qadd-schedule"
                value={scheduleType}
                onChange={e => {
                  setScheduleType(e.target.value as any);
                  setIsScheduleManual(true);
                  if (e.target.value === 'H1' || e.target.value === 'H' || e.target.value === 'X') {
                    setPrescriptionRequired(true);
                  }
                }}
                onKeyDown={handleKeyDownEnter('qadd-batch')}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold focus:outline-hidden ${
                  scheduleType === 'H1'
                    ? 'bg-rose-50 border-2 border-rose-400 text-rose-800'
                    : scheduleType === 'H' || scheduleType === 'X'
                    ? 'bg-amber-50 border-2 border-amber-400 text-amber-900'
                    : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`}
              >
                <option value="OTC">OTC / General Non-Scheduled</option>
                <option value="H1">Schedule H1 (Prescription Mandatory)</option>
                <option value="H">Schedule H (Prescription Drug)</option>
                <option value="X">Schedule X (Narcotic / Vault)</option>
                <option value="G">Schedule G (Medical Supervision)</option>
                <option value="Narcotic">Narcotic (NDPS)</option>
                <option value="None">None</option>
              </select>
            </div>
          </div>

          {/* Schedule H1 Statutory Compliance Banner */}
          {(scheduleType === 'H1' || scheduleInfo.scheduleType === 'H1') && (
            <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-extrabold text-rose-900 flex items-center gap-2">
                  <span>MANDATORY SCHEDULE H1 DRUG</span>
                  <span className="bg-rose-200 text-rose-800 text-[10px] px-2 py-0.5 rounded-full uppercase">
                    Drugs & Cosmetics Act Rule 65(9)
                  </span>
                </div>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Must be sold strictly against a valid Doctor's Prescription. Prescribing Doctor Name, Reg. No., and Patient Address are required by law for the Schedule H1 Register.
                </p>
              </div>
            </div>
          )}

          {/* Initial Inward Batch Info */}
          <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-bold text-teal-900 uppercase tracking-wide">
                  Purchase Inward Defaults (Auto-fills current bill)
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-600">
                Rule: Purchase Rate &lt; MRP
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Batch No *
                </label>
                <input
                  id="qadd-batch"
                  type="text"
                  required
                  value={batchNumber}
                  onChange={e => setBatchNumber(e.target.value)}
                  onKeyDown={handleKeyDownEnter('qadd-expiry')}
                  placeholder="BAT-102"
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Expiry (YYYY-MM) *
                </label>
                <input
                  id="qadd-expiry"
                  type="text"
                  required
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  onKeyDown={handleKeyDownEnter('qadd-mrp')}
                  placeholder="2028-06"
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1 text-right">
                  MRP (₹) *
                </label>
                <input
                  id="qadd-mrp"
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={mrp === 0 ? '' : mrp}
                  onChange={e => setMrp(Number(e.target.value) || 0)}
                  onKeyDown={handleKeyDownEnter('qadd-rate')}
                  placeholder="35.00"
                  className="w-full px-2.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-slate-900 text-right focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-teal-800 uppercase tracking-wider mb-1 text-right">
                  Purchase Rate (₹) *
                </label>
                <input
                  id="qadd-rate"
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={purchaseRate === 0 ? '' : purchaseRate}
                  onChange={e => setPurchaseRate(Number(e.target.value) || 0)}
                  placeholder="20.00"
                  className={`w-full px-2.5 py-2 bg-white rounded-xl text-xs font-mono font-bold text-right focus:outline-hidden ${
                    isRateInvalid
                      ? 'border-2 border-rose-500 text-rose-700 bg-rose-50 ring-2 ring-rose-300'
                      : 'border border-teal-300 text-slate-900 focus:ring-2 focus:ring-teal-500'
                  }`}
                />
              </div>
            </div>

            {/* Live Purchase Rate vs MRP validation feedback */}
            {isRateInvalid ? (
              <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  Validation Error: Purchase Rate (₹{purchaseRate}) cannot be greater than or equal to MRP (₹{mrp})! Purchase rate must be strictly less than MRP.
                </span>
              </div>
            ) : mrp > 0 && purchaseRate > 0 ? (
              <div className="text-[11px] text-teal-800 font-medium flex items-center justify-between px-1">
                <span>
                  Gross Margin: ₹{(mrp - purchaseRate).toFixed(2)} ({Math.round(((mrp - purchaseRate) / mrp) * 100)}% profit on MRP)
                </span>
                <span className="text-emerald-700 font-bold">✓ Valid: Purchase Rate &lt; MRP</span>
              </div>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRateInvalid}
              className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                isRateInvalid
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Select Product</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
