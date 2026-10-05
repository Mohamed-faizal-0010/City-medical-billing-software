import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Tag,
  MapPin,
  Calendar,
  Layers,
  X,
  Edit,
  RefreshCw,
  TrendingDown,
  History,
  PlusCircle,
  MinusCircle,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  FileSpreadsheet
} from 'lucide-react';
import { Medicine, MedicineBatch, StockAdjustment } from '../types';
import { StorageService } from '../services/storage';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal';
import { LowStockNotificationBanner } from '../components/LowStockNotificationBanner';
import { ImportInventoryCsvModal } from '../components/ImportInventoryCsvModal';
import { BulkImportResult } from '../utils/inventoryCsvParser';
import {
  TARGET_PRODUCT_FORMS,
  PRODUCT_FORM_CONFIGS,
  normalizeFormName,
  getFormConfig
} from '../utils/productFormUtils';
import { getDaysUntilExpiry } from '../utils/dateUtils';
import { ExpiryMonthYearInput } from '../components/ExpiryMonthYearInput';

interface InventoryViewProps {
  onSelectForPOS?: (medicine: Medicine, batch: MedicineBatch) => void;
  onNavigateToPurchases?: () => void;
  onRefreshData?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onSelectForPOS, onNavigateToPurchases, onRefreshData }) => {
  const [medicines, setMedicines] = useState<Medicine[]>(() => StorageService.getMedicines());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [formFilter, setFormFilter] = useState<string>('All');
  const [manufacturerFilter, setManufacturerFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'All' | 'LowStock' | 'ExpiringSoon' | 'Adequate' | 'ZeroStock'>('All');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [showAddBatchModal, setShowAddBatchModal] = useState<Medicine | null>(null);
  const [adjustmentTarget, setAdjustmentTarget] = useState<{
    medicine: Medicine;
    batch?: MedicineBatch;
    initialType?: 'ADD' | 'REMOVE';
  } | null>(null);
  const [showGlobalAuditLog, setShowGlobalAuditLog] = useState(false);
  const [showImportCsvModal, setShowImportCsvModal] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [adjustmentToast, setAdjustmentToast] = useState<string | null>(null);
  const [showExpiryWarningBanner, setShowExpiryWarningBanner] = useState(true);
  const [showExpiringBatchesDrawer, setShowExpiringBatchesDrawer] = useState(false);

  // Form states for new medicine
  const [newMedName, setNewMedName] = useState('');
  const [newMedGeneric, setNewMedGeneric] = useState('');
  const [newMedStrength, setNewMedStrength] = useState('');
  const [newMedForm, setNewMedForm] = useState('Tablet');
  const [newMedManufacturer, setNewMedManufacturer] = useState('');
  const [newMedCategory, setNewMedCategory] = useState('Analgesic & Antipyretic');
  const [newMedRx, setNewMedRx] = useState(false);
  const [newMedMinStock, setNewMedMinStock] = useState(25);
  const [newMedHsn, setNewMedHsn] = useState('300490');
  const [newMedTax, setNewMedTax] = useState(12);
  const [newMedBatchNo, setNewMedBatchNo] = useState('');
  const [newMedExpiry, setNewMedExpiry] = useState('');
  const [newMedStock, setNewMedStock] = useState(50);
  const [newMedCost, setNewMedCost] = useState(20);
  const [newMedSelling, setNewMedSelling] = useState(30);
  const [newMedMrp, setNewMedMrp] = useState(32);
  const [newMedPtr, setNewMedPtr] = useState(25);
  const [newMedBoxSize, setNewMedBoxSize] = useState(10);
  const [newMedLocation, setNewMedLocation] = useState('Rack A-01');

  // Reload medicines from storage
  const reload = () => {
    const updated = StorageService.getMedicines();
    setMedicines(updated);
    if (onRefreshData) onRefreshData();
  };

  // Handle successful CSV / Excel Bulk Import
  const handleImportComplete = (result: BulkImportResult) => {
    reload();
    setImportSuccessMessage(
      `Added ${result.createdMedicinesCount} new medicines, updated ${result.updatedMedicinesCount} existing drugs, with ${result.totalStockAdded.toLocaleString('en-IN')} total stock units (Valuation: ₹${result.totalValuationAdded.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).`
    );
    setTimeout(() => {
      setImportSuccessMessage(null);
    }, 10000);
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    medicines.forEach(m => set.add(m.category));
    return ['All', ...Array.from(set)];
  }, [medicines]);

  const manufacturers = useMemo(() => {
    const set = new Set<string>();
    medicines.forEach(m => {
      if (m.manufacturer) set.add(m.manufacturer);
    });
    return ['All', ...Array.from(set).sort()];
  }, [medicines]);

  // 90-Day Expiry Check Logic & Helpers (Stock Loss Prevention)
  const EXPIRY_THRESHOLD_DAYS = 90;


  // Medicine 90-day expiry risk analysis function
  const getMedicineExpiryInfo = (med: Medicine) => {
    const batches = Array.isArray(med.batches) ? med.batches : [];
    const expiringBatches = batches
      .map(b => ({
        ...b,
        daysLeft: getDaysUntilExpiry(b.expiryDate)
      }))
      .filter(b => b.daysLeft <= EXPIRY_THRESHOLD_DAYS)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    if (expiringBatches.length === 0) return null;

    const earliest = expiringBatches[0];
    const totalUnitsAtRisk = expiringBatches.reduce((sum, b) => sum + (b.stock > 0 ? b.stock : 0), 0);
    const totalValuationAtRisk = expiringBatches.reduce((sum, b) => sum + (b.stock > 0 ? b.stock * b.costPrice : 0), 0);
    const isExpired = earliest.daysLeft <= 0;
    const isCritical = earliest.daysLeft > 0 && earliest.daysLeft <= 30;
    const isWarning = earliest.daysLeft > 30 && earliest.daysLeft <= 90;

    return {
      expiringBatches,
      earliest,
      daysLeft: earliest.daysLeft,
      totalUnitsAtRisk,
      totalValuationAtRisk,
      isExpired,
      isCritical,
      isWarning,
      count: expiringBatches.length
    };
  };

  // All expiring batches across entire inventory (≤ 90 days)
  const allExpiringBatches90D = useMemo(() => {
    return medicines.flatMap(m =>
      (m.batches || [])
        .map(b => {
          const daysLeft = getDaysUntilExpiry(b.expiryDate);
          return {
            ...b,
            daysLeft,
            medicineId: m.id,
            medicineName: m.name,
            genericName: m.genericName,
            manufacturer: m.manufacturer,
            form: m.form
          };
        })
        .filter(b => b.daysLeft <= EXPIRY_THRESHOLD_DAYS)
        .sort((a, b) => a.daysLeft - b.daysLeft)
    );
  }, [medicines]);

  const medicinesWith90DExpiry = useMemo(() => {
    return medicines.filter(m => (m.batches || []).some(b => getDaysUntilExpiry(b.expiryDate) <= EXPIRY_THRESHOLD_DAYS));
  }, [medicines]);

  const total90DUnitsAtRisk = useMemo(() => {
    return allExpiringBatches90D.reduce((sum, b) => sum + (b.stock > 0 ? b.stock : 0), 0);
  }, [allExpiringBatches90D]);

  const total90DValueAtRisk = useMemo(() => {
    return allExpiringBatches90D.reduce((sum, b) => sum + (b.stock > 0 ? b.stock * b.costPrice : 0), 0);
  }, [allExpiringBatches90D]);

  // Form stats
  const formCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    medicines.forEach(m => {
      const norm = normalizeFormName(m.form);
      counts[norm] = (counts[norm] || 0) + 1;
    });
    return counts;
  }, [medicines]);

  const filteredMedicines = useMemo(() => {
    return medicines.filter(med => {
      const matchesSearch =
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.batches.some(b => b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = categoryFilter === 'All' || med.category === categoryFilter;
      const matchesForm = formFilter === 'All' || normalizeFormName(med.form).toLowerCase() === formFilter.toLowerCase();
      const matchesManufacturer =
        manufacturerFilter === 'All' ||
        med.manufacturer.toLowerCase().includes(manufacturerFilter.toLowerCase());

      const totalStock = med.batches.reduce((sum, b) => sum + b.stock, 0);
      const isLowStock = totalStock <= med.minStockAlert;
      const isExpiringSoon = med.batches.some(b => getDaysUntilExpiry(b.expiryDate) <= EXPIRY_THRESHOLD_DAYS);

      let matchesStockStatus = true;
      if (stockStatusFilter === 'ZeroStock') matchesStockStatus = totalStock === 0;
      else if (stockStatusFilter === 'LowStock') matchesStockStatus = totalStock > 0 && isLowStock;
      else if (stockStatusFilter === 'ExpiringSoon') matchesStockStatus = isExpiringSoon;
      else if (stockStatusFilter === 'Adequate') matchesStockStatus = !isLowStock && !isExpiringSoon && totalStock > 0;

      return matchesSearch && matchesCategory && matchesForm && matchesManufacturer && matchesStockStatus;
    });
  }, [medicines, searchQuery, categoryFilter, formFilter, manufacturerFilter, stockStatusFilter]);

  // Inventory Totals
  const totalSkuCount = medicines.length;
  const totalStockUnits = medicines.reduce((sum, m) => sum + m.batches.reduce((s, b) => s + b.stock, 0), 0);
  const totalInventoryValuation = medicines.reduce(
    (sum, m) => sum + m.batches.reduce((s, b) => s + b.stock * b.costPrice, 0),
    0
  );
  const zeroStockMedicines = medicines.filter(
    m => m.batches.reduce((s, b) => s + b.stock, 0) === 0
  );
  const lowStockMedicines = medicines.filter(m => {
    const s = m.batches.reduce((sum, b) => sum + b.stock, 0);
    return s > 0 && s <= m.minStockAlert;
  });
  const expiringBatches = allExpiringBatches90D;
  const adequateMedicines = medicines.filter(m => {
    const s = m.batches.reduce((sum, b) => sum + b.stock, 0);
    const hasExpiring = m.batches.some(b => getDaysUntilExpiry(b.expiryDate) <= EXPIRY_THRESHOLD_DAYS);
    return s > m.minStockAlert && !hasExpiring;
  });

  // Handle Adding a New Medicine
  const handleCreateMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName || !newMedGeneric || !newMedBatchNo) {
      alert('Please enter medicine name, generic salt, and initial batch number.');
      return;
    }

    const newMed: Medicine = {
      id: `med-${Date.now().toString().slice(-4)}`,
      name: newMedName,
      genericName: newMedGeneric,
      strength: newMedStrength,
      form: newMedForm,
      manufacturer: newMedManufacturer || 'City Pharma',
      category: newMedCategory,
      prescriptionRequired: newMedRx,
      hsnCode: newMedHsn,
      taxRate: newMedTax,
      minStockAlert: Number(newMedMinStock),
      boxSize: Number(newMedBoxSize) || 10,
      ptr: Number(newMedPtr) || Number((newMedCost * 1.12).toFixed(2)),
      wholesaleRate: Number(newMedPtr) || Number((newMedCost * 1.12).toFixed(2)),
      batches: [
        {
          batchNumber: newMedBatchNo.toUpperCase(),
          expiryDate: newMedExpiry || '2027-12-31',
          manufacturingDate: new Date().toISOString().split('T')[0],
          stock: Number(newMedStock),
          costPrice: Number(newMedCost),
          sellingPrice: Number(newMedSelling),
          mrp: Number(newMedMrp),
          ptr: Number(newMedPtr) || Number((newMedCost * 1.12).toFixed(2)),
          wholesalePrice: Number(newMedPtr) || Number((newMedCost * 1.12).toFixed(2)),
          wholesalePackSize: Number(newMedBoxSize) || 10,
          location: newMedLocation || 'Main Rack'
        }
      ]
    };

    StorageService.updateMedicine(newMed);
    reload();
    setShowAddMedicineModal(false);
    // Reset inputs
    setNewMedName('');
    setNewMedGeneric('');
    setNewMedBatchNo('');
  };

  // Handle Adding Batch to Existing Medicine
  const handleAddBatchToExisting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddBatchModal || !newMedBatchNo) return;

    const newBatch: MedicineBatch = {
      batchNumber: newMedBatchNo.toUpperCase(),
      expiryDate: newMedExpiry || '2027-12-31',
      manufacturingDate: new Date().toISOString().split('T')[0],
      stock: Number(newMedStock),
      costPrice: Number(newMedCost),
      sellingPrice: Number(newMedSelling),
      mrp: Number(newMedMrp),
      ptr: Number(newMedPtr) || Number((newMedCost * 1.12).toFixed(2)),
      wholesalePrice: Number(newMedPtr) || Number((newMedCost * 1.12).toFixed(2)),
      wholesalePackSize: Number(newMedBoxSize) || 10,
      location: newMedLocation || 'Rack A-01'
    };

    StorageService.addBatchToMedicine(showAddBatchModal.id, newBatch);
    reload();
    setShowAddBatchModal(null);
    setNewMedBatchNo('');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-emerald-600" />
            <span>Inventory & Batch Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time stock level monitoring with First-Expiry-First-Out (FEFO) batch tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to set ALL stock to ZERO across all medicines and batches? This will make total stock zero.')) {
                const res = StorageService.setAllStockToZero();
                reload();
                setAdjustmentToast(`Total stock is now 0! Reset all stock across ${res.count} medicines (${res.totalZeroed} units zeroed).`);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-sm rounded-xl shadow-2xs transition-colors cursor-pointer"
            id="btn-zero-all-stock"
            title="Make total stock zero across all medicine batches"
          >
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <span>Make Zero Stock Total</span>
          </button>

          <button
            onClick={() => setShowGlobalAuditLog(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-sm rounded-xl shadow-2xs transition-colors"
            id="stock-audit-history-btn"
            title="View all stock adjustments audit log"
          >
            <History className="w-4 h-4 text-teal-600" />
            <span>Audit History</span>
          </button>

          <button
            onClick={() => setShowImportCsvModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 hover:border-teal-300 font-bold text-sm rounded-xl shadow-2xs transition-all cursor-pointer"
            id="btn-import-inventory-csv"
            title="Bulk import medicines and initial opening stock from CSV or Excel spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setShowAddMedicineModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
            id="add-medicine-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Drug</span>
          </button>
        </div>
      </div>

      {/* Automated Low Stock Alert Banner */}
      <LowStockNotificationBanner
        viewMode="banner"
        onFilterLowStockInInventory={() => setStockStatusFilter('LowStock')}
        onNavigateToPurchases={onNavigateToPurchases}
      />

      {/* 90-Day Expiry Warning Indicator & Stock Loss Prevention Alert Banner */}
      {allExpiringBatches90D.length > 0 && showExpiryWarningBanner && (
        <div
          className="p-4 bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 border-2 border-amber-300 rounded-2xl shadow-xs text-slate-800 space-y-3 animate-in fade-in"
          id="expiry-90d-warning-banner"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-sm sm:text-base text-amber-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>90-Day Expiry Warning — Stock Loss Prevention</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300">
                    {allExpiringBatches90D.length} Batches Near Expiry
                  </span>
                  {allExpiringBatches90D.some(b => b.daysLeft <= 30) && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                      Urgent Clearance (&le;30d)
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
                  <strong className="font-bold text-amber-950">{medicinesWith90DExpiry.length} medicine{medicinesWith90DExpiry.length === 1 ? '' : 's'}</strong> have active batches expiring in &le; 90 days.
                  {total90DUnitsAtRisk > 0 && (
                    <> Stock Loss Risk: <strong className="font-mono font-bold text-rose-700">{total90DUnitsAtRisk} units</strong> valued at <strong className="font-mono font-bold text-slate-900">₹{total90DValueAtRisk.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> at cost.</>
                  )}
                  {' '}Action: Prioritize First-Expiry-First-Out (FEFO) dispensing, apply clearance discount in POS, or initiate return to supplier.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setStockStatusFilter(prev => prev === 'ExpiringSoon' ? 'All' : 'ExpiringSoon')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 ${
                  stockStatusFilter === 'ExpiringSoon'
                    ? 'bg-amber-800 text-white hover:bg-amber-900'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
                id="btn-filter-90d-expiry"
                title="Filter medicines expiring within 90 days in table"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{stockStatusFilter === 'ExpiringSoon' ? 'Showing 90D Items' : 'Filter 90D Expiring'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExpiringBatchesDrawer(prev => !prev)}
                className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                id="btn-toggle-expiring-batches-drawer"
                title="Toggle detailed list of all expiring batches"
              >
                <span>{showExpiringBatchesDrawer ? 'Hide Batches' : 'View Batches'}</span>
                {showExpiringBatchesDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {onNavigateToPurchases && (
                <button
                  type="button"
                  onClick={onNavigateToPurchases}
                  className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title="Navigate to Purchases to order fresh stock"
                >
                  <span>Reorder Fresh</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowExpiryWarningBanner(false)}
                className="p-1.5 text-amber-600 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                title="Dismiss warning banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expandable Batches Quick Breakdown */}
          {showExpiringBatchesDrawer && (
            <div className="pt-2 border-t border-amber-200/80">
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Top Batches Expiring Within 90 Days (FEFO Clearance Priority):</span>
                <span className="text-slate-500 font-mono font-normal">Sorted by earliest expiry date</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {allExpiringBatches90D.map((batch) => {
                  const isExp = batch.daysLeft <= 0;
                  const isCrit = batch.daysLeft > 0 && batch.daysLeft <= 30;
                  return (
                    <div
                      key={`${batch.medicineId}-${batch.batchNumber}`}
                      className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between ${
                        isExp
                          ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                          : isCrit
                          ? 'bg-orange-50/90 border-orange-300 text-orange-950'
                          : 'bg-white border-amber-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <div className="font-bold text-slate-900">{batch.medicineName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Batch #{batch.batchNumber} • Loc: {batch.location}
                          </div>
                        </div>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          isExp
                            ? 'bg-rose-200 text-rose-900'
                            : isCrit
                            ? 'bg-orange-200 text-orange-900 animate-pulse'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {isExp ? 'Expired' : `${batch.daysLeft}d left`}
                        </span>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                        <div>
                          <span className="text-slate-500">Stock: </span>
                          <strong className={batch.stock > 0 ? 'text-slate-900 font-bold' : 'text-slate-400'}>{batch.stock} units</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Exp: </span>
                          <strong className="text-amber-950 font-bold">{batch.expiryDate}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Adjustment Success Toast */}
      {adjustmentToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{adjustmentToast}</span>
          </div>
          <button
            onClick={() => setAdjustmentToast(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* CSV Bulk Import Success Banner */}
      {importSuccessMessage && (
        <div className="p-4 bg-teal-50 border-2 border-teal-300 text-teal-950 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-teal-900">Bulk Inventory Import Succeeded</p>
              <p className="text-teal-800 font-medium mt-0.5">{importSuccessMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setImportSuccessMessage(null)}
            className="px-3 py-1 bg-white hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-bold text-xs transition-colors shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Summary Strip with Zero Stock Total */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Formulations</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalSkuCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">{totalStockUnits.toLocaleString()} units available</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Valuation (Cost)</div>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{totalInventoryValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-0.5">Asset in storage</div>
        </div>

        {/* ZERO STOCK TOTAL KPI CARD */}
        <button
          type="button"
          onClick={() => setStockStatusFilter(prev => prev === 'ZeroStock' ? 'All' : 'ZeroStock')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
            stockStatusFilter === 'ZeroStock'
              ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-500'
              : 'bg-white border-rose-200 hover:border-rose-300 bg-rose-50/30'
          }`}
          id="kpi-zero-stock-total"
          title="Click to toggle filter by Zero Stock items"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-rose-700 uppercase tracking-wider">Zero Stock Total</div>
            <span className="p-1 rounded-lg bg-rose-100 text-rose-700">
              <TrendingDown className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-800 mt-1">{zeroStockMedicines.length}</div>
          <div className="text-xs text-rose-700 font-medium mt-0.5">
            {zeroStockMedicines.length === 1 ? '1 SKU with 0 stock' : `${zeroStockMedicines.length} SKUs at 0 units`}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStockStatusFilter(prev => prev === 'LowStock' ? 'All' : 'LowStock')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
            stockStatusFilter === 'LowStock'
              ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-500'
              : 'bg-white border-amber-200 hover:border-amber-300 bg-amber-50/30'
          }`}
          id="kpi-low-stock"
          title="Click to toggle filter by Low Stock items"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Low Stock Alerts</div>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">{lowStockMedicines.length}</div>
          <div className="text-xs text-amber-600 font-medium mt-0.5">Below threshold alert</div>
        </button>

        <button
          type="button"
          onClick={() => setStockStatusFilter(prev => prev === 'ExpiringSoon' ? 'All' : 'ExpiringSoon')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs col-span-2 sm:col-span-1 ${
            stockStatusFilter === 'ExpiringSoon'
              ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-500'
              : 'bg-white border-amber-200 hover:border-amber-300 bg-amber-50/20'
          }`}
          id="kpi-expiring-soon"
          title="Click to toggle filter by ≤90-Day Expiring Batches"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>90-Day Expiry Watch</span>
            </div>
            <span className="p-1 rounded-lg bg-amber-100 text-amber-800">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-950 mt-1">{allExpiringBatches90D.length}</div>
          <div className="text-xs text-amber-700 font-medium mt-0.5 truncate">
            {total90DUnitsAtRisk > 0 ? (
              <span>{total90DUnitsAtRisk} units at risk (₹{total90DValueAtRisk.toLocaleString('en-IN', { maximumFractionDigits: 0 })})</span>
            ) : (
              <span>{medicinesWith90DExpiry.length} SKUs affected</span>
            )}
          </div>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search medicine, salt, batch..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            id="inventory-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Manufacturer Filter */}
          <select
            value={manufacturerFilter}
            onChange={e => setManufacturerFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            id="inventory-manufacturer-select"
          >
            {manufacturers.map(mfg => (
              <option key={mfg} value={mfg}>
                Manufacturer: {mfg}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            id="inventory-category-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>

          {/* Stock Status Pills */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs flex-wrap">
            <button
              onClick={() => setStockStatusFilter('All')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                stockStatusFilter === 'All' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({medicines.length})
            </button>
            <button
              onClick={() => setStockStatusFilter('ZeroStock')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                stockStatusFilter === 'ZeroStock' ? 'bg-rose-700 text-white shadow-2xs' : 'text-slate-600 hover:text-rose-700'
              }`}
              id="filter-zero-stock-pill"
            >
              <span>Zero Stock</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                stockStatusFilter === 'ZeroStock' ? 'bg-rose-900 text-white' : 'bg-rose-100 text-rose-800'
              }`}>
                {zeroStockMedicines.length}
              </span>
            </button>
            <button
              onClick={() => setStockStatusFilter('LowStock')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                stockStatusFilter === 'LowStock' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-amber-600'
              }`}
            >
              <span>Low Stock</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                stockStatusFilter === 'LowStock' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {lowStockMedicines.length}
              </span>
            </button>
            <button
              onClick={() => setStockStatusFilter('ExpiringSoon')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                stockStatusFilter === 'ExpiringSoon' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-amber-700'
              }`}
              id="filter-expiring-90d-pill"
            >
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Expiring ≤90D</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                stockStatusFilter === 'ExpiringSoon' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-900'
              }`}>
                {allExpiringBatches90D.length}
              </span>
            </button>
            <button
              onClick={() => setStockStatusFilter('Adequate')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                stockStatusFilter === 'Adequate' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span>Normal</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                stockStatusFilter === 'Adequate' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {adequateMedicines.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Product Form Filter Ribbon (22 Product Types) */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap pl-1 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-teal-600" />
            <span>Form / Type:</span>
          </span>

          <button
            onClick={() => setFormFilter('All')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap text-xs font-bold transition-all cursor-pointer ${
              formFilter === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            id="inventory-form-all"
          >
            All Forms ({medicines.length})
          </button>

          {TARGET_PRODUCT_FORMS.map(formName => {
            const count = formCounts[formName] || 0;
            const isSelected = formFilter === formName;
            const cfg = PRODUCT_FORM_CONFIGS[formName];
            const FormIcon = cfg?.icon || Boxes;

            return (
              <button
                key={formName}
                onClick={() => setFormFilter(formName)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg whitespace-nowrap text-xs font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-teal-700 text-white border-teal-800 shadow-xs font-bold'
                    : `${cfg?.badgeBg || 'bg-slate-100'} ${cfg?.badgeText || 'text-slate-700'} ${cfg?.badgeBorder || 'border-slate-200'} hover:brightness-95`
                }`}
                id={`inventory-form-${formName.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <FormIcon className={`w-3 h-3 ${isSelected ? 'text-white' : cfg?.iconColor}`} />
                <span>{formName}</span>
                <span className={`text-[10px] px-1 rounded-full ${
                  isSelected ? 'bg-teal-900 text-teal-200' : 'bg-white/80 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Manufacturer Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap pl-1 mr-1">
          Brand Filter:
        </span>
        {['All', 'Cipla', 'Alkem', 'Sun', 'Himalaya', 'Anglo', 'Mankind', 'Micro', 'Blue Cross', 'GSK', 'Leeford', 'Wockhardt', 'Nestle', 'P&G'].map(chip => {
          const isSelected = chip === 'All' ? manufacturerFilter === 'All' : manufacturerFilter.toLowerCase().includes(chip.toLowerCase());
          return (
            <button
              key={chip}
              onClick={() => setManufacturerFilter(chip === 'All' ? 'All' : chip)}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-medium transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Medicine & Formulation</th>
                <th className="py-3 px-4">Active Generic Salt</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4 text-center">Batches</th>
                <th className="py-3 px-4 text-center">Total Stock</th>
                <th className="py-3 px-4 text-right">Pricing (MRP / PTR)</th>
                <th className="py-3 px-4 text-center">Stock Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedicines.map(med => {
                const totalStock = med.batches.reduce((sum, b) => sum + b.stock, 0);
                const isLow = totalStock <= med.minStockAlert;
                const expiryInfo = getMedicineExpiryInfo(med);
                const earliestBatch = [...med.batches].sort(
                  (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
                )[0];

                const rowHighlightClass = expiryInfo
                  ? expiryInfo.isExpired
                    ? 'border-l-4 border-l-rose-500 bg-rose-50/30 hover:bg-rose-50/60 transition-colors'
                    : expiryInfo.isCritical
                    ? 'border-l-4 border-l-orange-500 bg-orange-50/30 hover:bg-orange-50/60 transition-colors'
                    : 'border-l-4 border-l-amber-500 bg-amber-50/25 hover:bg-amber-50/50 transition-colors'
                  : 'hover:bg-slate-50/70 border-l-4 border-l-transparent transition-colors';

                return (
                  <tr key={med.id} className={rowHighlightClass}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{med.name}</span>
                            {med.prescriptionRequired && (
                              <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded border border-rose-200">
                                Rx
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {med.strength && <span className="text-xs text-slate-500">{med.strength}</span>}
                            {(() => {
                              const norm = normalizeFormName(med.form);
                              const cfg = getFormConfig(norm);
                              const FormIcon = cfg.icon;
                              return (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}>
                                  <FormIcon className={`w-2.5 h-2.5 ${cfg.iconColor}`} />
                                  <span>{norm}</span>
                                </span>
                              );
                            })()}
                          </div>

                          {/* 90-Day Expiry Visual Warning Indicator Badge */}
                          {expiryInfo && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-2xs ${
                                  expiryInfo.isExpired
                                    ? 'bg-rose-100 text-rose-950 border-rose-300'
                                    : expiryInfo.isCritical
                                    ? 'bg-orange-100 text-orange-950 border-orange-300 animate-pulse'
                                    : 'bg-amber-100 text-amber-950 border-amber-300'
                                }`}
                                title={`Batch #${expiryInfo.earliest.batchNumber} expires on ${expiryInfo.earliest.expiryDate} (${expiryInfo.daysLeft} days remaining)`}
                              >
                                <Clock className={`w-3 h-3 ${expiryInfo.isExpired ? 'text-rose-700' : 'text-amber-700'} shrink-0`} />
                                <span>
                                  {expiryInfo.isExpired
                                    ? `Expired (${Math.abs(expiryInfo.daysLeft)}d ago)`
                                    : expiryInfo.isCritical
                                    ? `⚠️ Critical: Exp in ${expiryInfo.daysLeft}d (#${expiryInfo.earliest.batchNumber})`
                                    : `⚠️ Exp in ${expiryInfo.daysLeft}d (Batch #${expiryInfo.earliest.batchNumber})`}
                                </span>
                              </span>

                              {expiryInfo.totalUnitsAtRisk > 0 ? (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100/90 text-amber-900 border border-amber-300 flex items-center gap-1"
                                  title="Stock loss risk: Units about to expire. Sell or return to vendor."
                                >
                                  <TrendingDown className="w-2.5 h-2.5 text-amber-700" />
                                  <span>{expiryInfo.totalUnitsAtRisk} units at risk (₹{expiryInfo.totalValuationAtRisk.toFixed(0)})</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  Batch record (0 stock)
                                </span>
                              )}

                              {expiryInfo.count > 1 && (
                                <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  +{expiryInfo.count - 1} more batch{expiryInfo.count > 2 ? 'es' : ''} &le;90d
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-xs font-medium text-slate-700 max-w-[180px] truncate">
                        {med.genericName}
                      </div>
                      <div className="text-[11px] text-slate-400">HSN: {med.hsnCode} (GST {med.taxRate}%)</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">{med.manufacturer}</td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedMedicine(selectedMedicine?.id === med.id ? null : med)}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          expiryInfo
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title={expiryInfo ? `Batches include ${expiryInfo.count} expiring within 90 days` : 'View batches'}
                      >
                        <Layers className={`w-3.5 h-3.5 ${expiryInfo ? 'text-amber-600' : 'text-slate-500'}`} />
                        <span>{(med.batches || []).length} {(med.batches || []).length === 1 ? 'batch' : 'batches'}</span>
                        {expiryInfo && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Batch expiring in ≤90 days" />
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-mono font-bold text-sm ${
                          totalStock === 0 ? 'text-rose-600 font-black' : isLow ? 'text-rose-700' : 'text-slate-900'
                        }`}
                      >
                        {totalStock}
                      </span>
                      <div className="text-[10px] text-slate-400">Min: {med.minStockAlert}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-slate-900 text-xs">
                        <span className="text-[10px] font-sans font-medium text-slate-400 mr-1">MRP:</span>
                        ₹{earliestBatch?.sellingPrice != null ? earliestBatch.sellingPrice.toFixed(2) : '-'}
                      </div>
                      <div className="text-[11px] font-bold text-indigo-700 mt-0.5">
                        <span className="text-[9px] font-sans font-medium text-indigo-400 mr-1">PTR:</span>
                        ₹{(
                          earliestBatch?.ptr ||
                          earliestBatch?.wholesalePrice ||
                          med.ptr ||
                          med.wholesaleRate ||
                          (earliestBatch?.costPrice ? Number((earliestBatch.costPrice * 1.12).toFixed(2)) : 0)
                        ).toFixed(2)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {/* 90-Day Expiry Indicator Pill */}
                        {expiryInfo && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs ${
                              expiryInfo.isExpired
                                ? 'bg-rose-100 text-rose-900 border-rose-300'
                                : expiryInfo.isCritical
                                ? 'bg-orange-100 text-orange-950 border-orange-300 animate-pulse'
                                : 'bg-amber-100 text-amber-950 border-amber-300'
                            }`}
                            title={`Stock Loss Prevention: Earliest batch expires in ${expiryInfo.daysLeft} days`}
                          >
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>
                              {expiryInfo.isExpired
                                ? 'Expired Batch'
                                : expiryInfo.isCritical
                                ? `≤30D Critical Expiry`
                                : `≤90D Expiry Alert`}
                            </span>
                          </span>
                        )}

                        {/* Stock Level Status Pill */}
                        {totalStock === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            Zero Stock (0)
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        ) : !expiryInfo ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Adequate
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setAdjustmentTarget({ medicine: med, initialType: 'ADD' })}
                          className="px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Stock Adjust Add or Remove"
                        >
                          <SlidersHorizontal className="w-3 h-3 text-teal-600" />
                          <span>Adjust</span>
                        </button>
                        <button
                          onClick={() => setShowAddBatchModal(med)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                          title="Add new batch"
                        >
                          + Batch
                        </button>
                        <button
                          onClick={() => setSelectedMedicine(selectedMedicine?.id === med.id ? null : med)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            selectedMedicine?.id === med.id
                              ? 'bg-slate-800 text-white'
                              : expiryInfo
                              ? 'text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 font-bold'
                              : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                          }`}
                          title={expiryInfo ? 'Review expiring batches' : 'Details'}
                        >
                          {selectedMedicine?.id === med.id ? 'Close' : expiryInfo ? 'Review Batches' : 'Details'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filteredMedicines.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 text-xs font-bold text-slate-700">
                <tr>
                  <td colSpan={5} className="py-3.5 px-4 text-slate-800 font-extrabold">
                    Showing {filteredMedicines.length} of {medicines.length} Products (
                    <span className="text-rose-700 font-black">
                      {filteredMedicines.filter(m => m.batches.reduce((s, b) => s + b.stock, 0) === 0).length} Zero Stock Total
                    </span>
                    {', '}
                    <span className="text-amber-700">
                      {filteredMedicines.filter(m => {
                        const s = m.batches.reduce((sum, b) => sum + b.stock, 0);
                        return s > 0 && s <= m.minStockAlert;
                      }).length} Low Stock
                    </span>
                    {', '}
                    <span className="text-amber-800 font-bold">
                      {filteredMedicines.filter(m => (m.batches || []).some(b => getDaysUntilExpiry(b.expiryDate) <= EXPIRY_THRESHOLD_DAYS)).length} Expiring &le;90D
                    </span>
                    )
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-black text-slate-900 text-sm">
                    {filteredMedicines.reduce((sum, m) => sum + m.batches.reduce((s, b) => s + b.stock, 0), 0)} units
                  </td>
                  <td colSpan={3} className="py-3.5 px-4 text-right text-slate-600 font-medium">
                    Filtered Valuation:{' '}
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ₹{filteredMedicines.reduce((sum, m) => sum + m.batches.reduce((s, b) => s + b.stock * b.costPrice, 0), 0).toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>

          {filteredMedicines.length === 0 && (
            <div className="text-center py-12 text-slate-500 space-y-3">
              <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <div>
                <p className="font-semibold text-slate-700">No medicines found</p>
                <p className="text-xs text-slate-400">
                  {medicines.length === 0
                    ? 'Your pharmacy inventory is currently empty. Start onboarding by importing your medicine list.'
                    : 'Try adjusting your search query or filters'}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowImportCsvModal(true)}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Bulk Import via CSV / Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMedicineModal(true)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Add Drug Manually</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Batches Drawer / Panel for Selected Medicine */}
      {selectedMedicine && (
        <div className="p-5 bg-white rounded-2xl border-2 border-emerald-500 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{selectedMedicine.name}</h3>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                  {selectedMedicine.genericName}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manufacturer: {selectedMedicine.manufacturer} • Min Threshold: {selectedMedicine.minStockAlert} units • HSN: {selectedMedicine.hsnCode}
              </p>
            </div>
            <button
              onClick={() => setSelectedMedicine(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Active Batches (FEFO Order: Earliest Expiry Dispensed First)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...selectedMedicine.batches]
                .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                .map((batch, idx) => {
                  const daysLeft = getDaysUntilExpiry(batch.expiryDate);
                  const isExpired = daysLeft <= 0;
                  const is30DCritical = daysLeft > 0 && daysLeft <= 30;
                  const is90DExpiring = daysLeft > 0 && daysLeft <= EXPIRY_THRESHOLD_DAYS;

                  return (
                    <div
                      key={batch.batchNumber}
                      className={`p-3.5 rounded-xl border ${
                        isExpired
                          ? 'border-2 border-rose-400 bg-rose-50/70 ring-1 ring-rose-200'
                          : is30DCritical
                          ? 'border-2 border-orange-400 bg-orange-50/70 ring-1 ring-orange-200'
                          : is90DExpiring
                          ? 'border-2 border-amber-400 bg-amber-50/60 ring-1 ring-amber-200'
                          : 'border border-slate-200 bg-slate-50/50'
                      } space-y-2 relative`}
                    >
                      {idx === 0 && (
                        <span className="absolute top-2.5 right-2.5 text-[9px] font-black uppercase bg-emerald-700 text-white px-1.5 py-0.5 rounded shadow-2xs">
                          FEFO Primary
                        </span>
                      )}

                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-mono font-bold text-sm text-slate-900 flex items-center gap-1.5">
                            <span>#{batch.batchNumber}</span>
                            {(is90DExpiring || isExpired) && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{batch.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expiry Loss Prevention Alert Box */}
                      {(is90DExpiring || isExpired) && (
                        <div
                          className={`p-2 rounded-lg text-xs font-bold flex flex-col gap-1 ${
                            isExpired
                              ? 'bg-rose-100 text-rose-950 border border-rose-300'
                              : is30DCritical
                              ? 'bg-orange-100 text-orange-950 border border-orange-300 animate-pulse'
                              : 'bg-amber-100 text-amber-950 border border-amber-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>
                                {isExpired
                                  ? `EXPIRED (${Math.abs(daysLeft)}d ago)`
                                  : is30DCritical
                                  ? `≤30D CRITICAL: ${daysLeft} days left`
                                  : `≤90D EXPIRY WATCH: ${daysLeft} days left`}
                              </span>
                            </span>
                            <span className="text-[10px] uppercase font-black px-1 rounded bg-white/70">
                              {isExpired ? 'Zero Dispense' : 'Clearance'}
                            </span>
                          </div>
                          {batch.stock > 0 && (
                            <div className="text-[11px] font-mono flex items-center justify-between pt-1 border-t border-amber-200/60">
                              <span className="text-amber-900 font-medium">Stock at risk:</span>
                              <span className="text-rose-700 font-bold">{batch.stock} units (₹{(batch.stock * batch.costPrice).toFixed(0)})</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60 font-mono">
                        <div>
                          <span className="text-slate-500">Units in Stock:</span>
                          <span className={`font-bold ml-1.5 ${batch.stock === 0 ? 'text-rose-600' : 'text-slate-900'}`}>{batch.stock}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Exp:</span>
                          <span
                            className={`font-bold ml-1.5 ${
                              isExpired
                                ? 'text-rose-700 font-black'
                                : is30DCritical
                                ? 'text-orange-700 font-black'
                                : is90DExpiring
                                ? 'text-amber-700 font-black'
                                : 'text-slate-700'
                            }`}
                          >
                            {batch.expiryDate}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Cost:</span>
                          <span className="ml-1 text-slate-800">₹{batch.costPrice}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">MRP:</span>
                          <span className="ml-1 font-bold text-emerald-800">₹{batch.sellingPrice}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">PTR (W/S):</span>
                          <span className="ml-1 font-bold text-indigo-700">
                            ₹{(batch.ptr || batch.wholesalePrice || (batch.costPrice * 1.12)).toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Pack/Box:</span>
                          <span className="ml-1 text-slate-700 font-sans">{batch.wholesalePackSize || selectedMedicine.boxSize || 10} / box</span>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-wrap gap-1.5">
                        <button
                          onClick={() => setAdjustmentTarget({ medicine: selectedMedicine, batch, initialType: 'ADD' })}
                          className="flex-1 py-1.5 px-2 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          title="Add stock to this batch"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>+ Add Stock</span>
                        </button>
                        <button
                          onClick={() => setAdjustmentTarget({ medicine: selectedMedicine, batch, initialType: 'REMOVE' })}
                          className="flex-1 py-1.5 px-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          title="Remove or write-off stock from this batch"
                        >
                          <MinusCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>- Remove Stock</span>
                        </button>
                        {onSelectForPOS && batch.stock > 0 && (
                          <button
                            onClick={() => onSelectForPOS(selectedMedicine, batch)}
                            className="py-1.5 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                          >
                            Add to POS
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Full-Feature Stock Adjustment Modal (Add / Remove) */}
      <StockAdjustmentModal
        isOpen={Boolean(adjustmentTarget)}
        onClose={() => setAdjustmentTarget(null)}
        medicine={adjustmentTarget?.medicine || null}
        batch={adjustmentTarget?.batch}
        initialType={adjustmentTarget?.initialType || 'ADD'}
        onSuccess={(adj) => {
          reload();
          setAdjustmentToast(
            `Successfully ${adj.type === 'ADD' ? 'added' : 'removed'} ${adj.quantity} units for ${adj.medicineName} (Batch #${adj.batchNumber}). New Stock: ${adj.newStock} units.`
          );
          setTimeout(() => setAdjustmentToast(null), 7000);
        }}
      />

      {/* Global Stock Adjustment Audit Log History Modal */}
      {showGlobalAuditLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <History className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Pharmacy Stock Adjustment Audit Log</h3>
                  <p className="text-xs text-slate-500">Chronological history of physical counts, additions & write-offs</p>
                </div>
              </div>
              <button
                onClick={() => setShowGlobalAuditLog(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
              {StorageService.getStockAdjustments().length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No stock adjustments recorded in this system yet.
                </div>
              ) : (
                StorageService.getStockAdjustments().map(adj => (
                  <div
                    key={adj.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider ${
                            adj.type === 'ADD'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {adj.type === 'ADD' ? `+ Added ${adj.quantity}` : `- Removed ${adj.quantity}`} units
                        </span>
                        <strong className="text-slate-900 text-xs">{adj.medicineName}</strong>
                      </div>
                      <span className="text-slate-400 text-[11px] font-mono">
                        {new Date(adj.date).toLocaleDateString()} {new Date(adj.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 font-mono text-[11px]">
                      <span>Batch: <strong className="text-slate-800">#{adj.batchNumber}</strong></span>
                      <span>Stock: {adj.previousStock} → <strong className="text-slate-900">{adj.newStock}</strong> units</span>
                    </div>

                    <div className="text-slate-700">
                      Reason: <span className="font-semibold text-slate-900">{adj.reason}</span>
                    </div>

                    {adj.customNotes && (
                      <div className="text-slate-500 italic text-[11px] bg-white p-1.5 rounded-lg border border-slate-200/60">
                        "{adj.customNotes}"
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 pt-0.5">
                      Authorized by: <span className="text-slate-600 font-semibold">{adj.adjustedBy}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setShowGlobalAuditLog(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Medicine Modal */}
      {showAddMedicineModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-lg">Add New Medicine & Batch</h3>
              </div>
              <button
                onClick={() => setShowAddMedicineModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-bold text-slate-700">Brand / Commercial Name *</label>
                  <input
                    type="text"
                    required
                    value={newMedName}
                    onChange={e => setNewMedName(e.target.value)}
                    placeholder="e.g. Paracip 500"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 text-sm font-semibold"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-bold text-slate-700">Active Generic Salt *</label>
                  <input
                    type="text"
                    required
                    value={newMedGeneric}
                    onChange={e => setNewMedGeneric(e.target.value)}
                    placeholder="e.g. Paracetamol"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Strength</label>
                  <input
                    type="text"
                    value={newMedStrength}
                    onChange={e => setNewMedStrength(e.target.value)}
                    placeholder="e.g. 500 mg"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Form</label>
                  <select
                    value={newMedForm}
                    onChange={e => setNewMedForm(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                  >
                    {TARGET_PRODUCT_FORMS.map(form => (
                      <option key={form} value={form}>{form}</option>
                    ))}
                    <option value="Injection">Injection</option>
                    <option value="Inhaler">Inhaler</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Category</label>
                  <select
                    value={newMedCategory}
                    onChange={e => setNewMedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                  >
                    <option value="Analgesic & Antipyretic">Analgesic & Antipyretic</option>
                    <option value="Antibiotic">Antibiotic</option>
                    <option value="Antidiabetic">Antidiabetic</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Gastrointestinal">Gastrointestinal</option>
                    <option value="Respiratory">Respiratory</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Manufacturer</label>
                  <input
                    type="text"
                    value={newMedManufacturer}
                    onChange={e => setNewMedManufacturer(e.target.value)}
                    placeholder="e.g. Cipla Ltd"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Min Stock Alert</label>
                  <input
                    type="number"
                    value={newMedMinStock}
                    onChange={e => setNewMedMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newMedRx}
                      onChange={e => setNewMedRx(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                    />
                    <span>Rx Required</span>
                  </label>
                </div>
              </div>

              {/* Initial Batch Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Initial Batch Details
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Batch Number *</label>
                    <input
                      type="text"
                      required
                      value={newMedBatchNo}
                      onChange={e => setNewMedBatchNo(e.target.value)}
                      placeholder="e.g. BT-8891"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl mt-1 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Expiry (Month / Year) *</label>
                    <ExpiryMonthYearInput
                      id="inventory-new-med-expiry"
                      value={newMedExpiry}
                      onChange={setNewMedExpiry}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Initial Stock Units</label>
                    <input
                      type="number"
                      value={newMedStock}
                      onChange={e => setNewMedStock(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl mt-1 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Cost Price (₹)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newMedCost}
                      onChange={e => {
                        const cost = Number(e.target.value);
                        setNewMedCost(cost);
                        if (!newMedSelling || newMedSelling === 30) setNewMedSelling(Number((cost * 1.3).toFixed(2)));
                        if (!newMedMrp || newMedMrp === 32) setNewMedMrp(Number((cost * 1.4).toFixed(2)));
                        if (!newMedPtr || newMedPtr === 25) setNewMedPtr(Number((cost * 1.15).toFixed(2)));
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Retail MRP (₹)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newMedMrp}
                      onChange={e => setNewMedMrp(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl mt-1 font-mono font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-indigo-950 flex items-center justify-between">
                      <span>Wholesale PTR (₹)</span>
                      <span className="text-[10px] text-indigo-600 font-normal">B2B Rate</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newMedPtr}
                      onChange={e => setNewMedPtr(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-200 rounded-xl mt-1 font-mono font-bold text-indigo-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Counter Sale (₹)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newMedSelling}
                      onChange={e => setNewMedSelling(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Packs per Box</label>
                    <input
                      type="number"
                      value={newMedBoxSize}
                      onChange={e => setNewMedBoxSize(Number(e.target.value))}
                      placeholder="10"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Shelf Location</label>
                    <input
                      type="text"
                      value={newMedLocation}
                      onChange={e => setNewMedLocation(e.target.value)}
                      placeholder="Rack A-01"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMedicineModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Medicine & Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Batch Modal to Existing Drug */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add New Batch</h3>
                <p className="text-xs text-slate-500">{showAddBatchModal.name}</p>
              </div>
              <button
                onClick={() => setShowAddBatchModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBatchToExisting} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={newMedBatchNo}
                    onChange={e => setNewMedBatchNo(e.target.value)}
                    placeholder="e.g. DL-1029"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Expiry (Month / Year) *</label>
                  <ExpiryMonthYearInput
                    id="inventory-new-batch-expiry"
                    value={newMedExpiry}
                    onChange={setNewMedExpiry}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Quantity</label>
                  <input
                    type="number"
                    value={newMedStock}
                    onChange={e => setNewMedStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Cost (₹)</label>
                  <input
                    type="number"
                    value={newMedCost}
                    onChange={e => {
                      const c = Number(e.target.value);
                      setNewMedCost(c);
                      setNewMedSelling(Number((c * 1.3).toFixed(2)));
                      setNewMedMrp(Number((c * 1.4).toFixed(2)));
                      setNewMedPtr(Number((c * 1.15).toFixed(2)));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Retail MRP (₹)</label>
                  <input
                    type="number"
                    value={newMedMrp}
                    onChange={e => setNewMedMrp(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-indigo-950">Wholesale PTR (₹)</label>
                  <input
                    type="number"
                    value={newMedPtr}
                    onChange={e => setNewMedPtr(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-200 rounded-xl mt-1 font-mono font-bold text-indigo-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Counter Sale (₹)</label>
                  <input
                    type="number"
                    value={newMedSelling}
                    onChange={e => setNewMedSelling(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Shelf Location</label>
                  <input
                    type="text"
                    value={newMedLocation}
                    onChange={e => setNewMedLocation(e.target.value)}
                    placeholder="e.g. Rack B-04"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(null)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Add Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk CSV / Excel Import Modal */}
      <ImportInventoryCsvModal
        isOpen={showImportCsvModal}
        onClose={() => setShowImportCsvModal(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};
