import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Printer,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Clock,
  Layers,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Filter,
  Boxes,
  DollarSign,
  TrendingUp,
  TrendingDown,
  MapPin,
  X,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  PlusCircle,
  MinusCircle,
  RefreshCw
} from 'lucide-react';
import { Medicine, MedicineBatch, StockAdjustment } from '../types';
import {
  TARGET_PRODUCT_FORMS,
  PRODUCT_FORM_CONFIGS,
  normalizeFormName,
  getFormConfig
} from '../utils/productFormUtils';
import {
  exportReportToExcel,
  exportReportToPDF,
  exportReportToCSV,
  printReportWindow
} from '../utils/exportUtils';
import { StorageService } from '../services/storage';
import { VoiceInputButton } from './VoiceInputButton';
import { StockAdjustmentModal } from './StockAdjustmentModal';

interface StockReportViewProps {
  medicines?: Medicine[];
  onSelectForPOS?: (medicine: Medicine) => void;
}

export const StockReportView: React.FC<StockReportViewProps> = ({ medicines = [], onSelectForPOS }) => {
  const [localMedicines, setLocalMedicines] = useState<Medicine[]>(() => {
    const list = Array.isArray(medicines) && medicines.length > 0 ? medicines : StorageService.getMedicines();
    return (list || []).map(m => ({
      ...m,
      batches: Array.isArray(m.batches) ? m.batches : []
    }));
  });
  const [selectedForm, setSelectedForm] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'expiring'>('all');
  const [sortField, setSortField] = useState<'name' | 'stock' | 'costVal' | 'retailVal'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedMedicineId, setExpandedMedicineId] = useState<string | null>(null);

  // Quick Adjustment Modal Target
  const [adjustmentTarget, setAdjustmentTarget] = useState<{
    medicine: Medicine;
    batch?: MedicineBatch;
    initialType?: 'ADD' | 'REMOVE';
  } | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync local medicines when parent props change
  useEffect(() => {
    if (Array.isArray(medicines) && medicines.length > 0) {
      setLocalMedicines(medicines.map(m => ({
        ...m,
        batches: Array.isArray(m.batches) ? m.batches : []
      })));
    }
  }, [medicines]);

  const reloadMedicines = () => {
    const updated = StorageService.getMedicines();
    setLocalMedicines((updated || []).map(m => ({
      ...m,
      batches: Array.isArray(m.batches) ? m.batches : []
    })));
  };

  const now = new Date();
  const sixtyDaysAhead = new Date();
  sixtyDaysAhead.setDate(now.getDate() + 60);

  // Form counts and valuation summaries across all inventory
  const formStats = useMemo(() => {
    const stats: Record<string, { count: number; units: number; costVal: number; retailVal: number }> = {};

    for (const f of TARGET_PRODUCT_FORMS) {
      stats[f] = { count: 0, units: 0, costVal: 0, retailVal: 0 };
    }

    (localMedicines || []).forEach(m => {
      const norm = normalizeFormName(m.form);
      if (!stats[norm]) {
        stats[norm] = { count: 0, units: 0, costVal: 0, retailVal: 0 };
      }
      const batches = Array.isArray(m.batches) ? m.batches : [];
      const totalUnits = batches.reduce((sum, b) => sum + (b.stock || 0), 0);
      const costVal = batches.reduce((sum, b) => sum + (b.stock || 0) * (b.costPrice || 0), 0);
      const retailVal = batches.reduce((sum, b) => sum + (b.stock || 0) * (b.mrp || b.sellingPrice || 0), 0);

      stats[norm].count += 1;
      stats[norm].units += totalUnits;
      stats[norm].costVal += costVal;
      stats[norm].retailVal += retailVal;
    });

    return stats;
  }, [localMedicines]);

  // Filtered medicines based on selected form, search query, and stock status
  const filteredList = useMemo(() => {
    return (localMedicines || []).filter(med => {
      const norm = normalizeFormName(med.form);
      const matchesForm = selectedForm === 'All' || norm.toLowerCase() === selectedForm.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const batches = Array.isArray(med.batches) ? med.batches : [];
      const matchesSearch =
        !q ||
        med.name.toLowerCase().includes(q) ||
        med.genericName.toLowerCase().includes(q) ||
        med.manufacturer.toLowerCase().includes(q) ||
        (med.rackLocation && med.rackLocation.toLowerCase().includes(q)) ||
        batches.some(b => b.batchNumber.toLowerCase().includes(q));

      const totalStock = batches.reduce((sum, b) => sum + (b.stock || 0), 0);
      const isLowStock = totalStock <= med.minStockAlert && totalStock > 0;
      const isOutOfStock = totalStock === 0;
      const isExpiring = batches.some(b => b.stock > 0 && new Date(b.expiryDate) <= sixtyDaysAhead);

      let matchesStockStatus = true;
      if (stockStatusFilter === 'in-stock') matchesStockStatus = totalStock > 0;
      else if (stockStatusFilter === 'low-stock') matchesStockStatus = isLowStock;
      else if (stockStatusFilter === 'out-of-stock') matchesStockStatus = isOutOfStock;
      else if (stockStatusFilter === 'expiring') matchesStockStatus = isExpiring;

      return matchesForm && matchesSearch && matchesStockStatus;
    }).sort((a, b) => {
      const aBatches = Array.isArray(a.batches) ? a.batches : [];
      const bBatches = Array.isArray(b.batches) ? b.batches : [];
      const aStock = aBatches.reduce((sum, b) => sum + (b.stock || 0), 0);
      const bStock = bBatches.reduce((sum, b) => sum + (b.stock || 0), 0);
      const aCostVal = aBatches.reduce((sum, b) => sum + (b.stock || 0) * (b.costPrice || 0), 0);
      const bCostVal = bBatches.reduce((sum, b) => sum + (b.stock || 0) * (b.costPrice || 0), 0);
      const aRetailVal = aBatches.reduce((sum, b) => sum + (b.stock || 0) * (b.mrp || b.sellingPrice || 0), 0);
      const bRetailVal = bBatches.reduce((sum, b) => sum + (b.stock || 0) * (b.mrp || b.sellingPrice || 0), 0);

      let comparison = 0;
      if (sortField === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortField === 'stock') comparison = aStock - bStock;
      else if (sortField === 'costVal') comparison = aCostVal - bCostVal;
      else if (sortField === 'retailVal') comparison = aRetailVal - bRetailVal;

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [localMedicines, selectedForm, searchQuery, stockStatusFilter, sortField, sortDirection, sixtyDaysAhead]);

  // Overall summary for current filtered view
  const currentSummary = useMemo(() => {
    let totalItems = filteredList.length;
    let totalUnits = 0;
    let totalCostVal = 0;
    let totalRetailVal = 0;
    let zeroStockCount = 0;
    let lowStockCount = 0;
    let expiringCount = 0;

    filteredList.forEach(m => {
      const stock = m.batches.reduce((s, b) => s + (b.stock || 0), 0);
      totalUnits += stock;
      totalCostVal += m.batches.reduce((s, b) => s + (b.stock || 0) * (b.costPrice || 0), 0);
      totalRetailVal += m.batches.reduce((s, b) => s + (b.stock || 0) * (b.mrp || b.sellingPrice || 0), 0);

      if (stock === 0) zeroStockCount += 1;
      else if (stock <= m.minStockAlert) lowStockCount += 1;
      if (m.batches.some(b => b.stock > 0 && new Date(b.expiryDate) <= sixtyDaysAhead)) {
        expiringCount += 1;
      }
    });

    const potentialMargin = totalRetailVal - totalCostVal;
    const potentialMarginPercent = totalRetailVal > 0 ? ((potentialMargin / totalRetailVal) * 100).toFixed(1) : '0.0';

    return {
      totalItems,
      totalUnits,
      totalCostVal,
      totalRetailVal,
      potentialMargin,
      potentialMarginPercent,
      zeroStockCount,
      lowStockCount,
      expiringCount
    };
  }, [filteredList, sixtyDaysAhead]);

  // Total SKUs across everything
  const overallTotalUnits = useMemo(() => {
    return (localMedicines || []).reduce((sum, m) => {
      const batches = Array.isArray(m.batches) ? m.batches : [];
      return sum + batches.reduce((s, b) => s + (b.stock || 0), 0);
    }, 0);
  }, [localMedicines]);

  // Global counts for all stock statuses
  const globalStockCounts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let expiring = 0;

    (localMedicines || []).forEach(m => {
      const batches = Array.isArray(m.batches) ? m.batches : [];
      const stock = batches.reduce((s, b) => s + (b.stock || 0), 0);
      if (stock > 0) inStock += 1;
      if (stock === 0) outOfStock += 1;
      else if (stock <= m.minStockAlert) lowStock += 1;

      if (batches.some(b => (b.stock || 0) > 0 && new Date(b.expiryDate) <= sixtyDaysAhead)) {
        expiring += 1;
      }
    });

    return {
      all: (localMedicines || []).length,
      inStock,
      lowStock,
      outOfStock,
      expiring
    };
  }, [localMedicines, sixtyDaysAhead]);

  // Data generator for Print / PDF / Excel exports
  const getExportDataset = (medList: Medicine[] = filteredList, scopeName: string = selectedForm) => {
    const headers = [
      'Sl #',
      'Product Name',
      'Generic Formulation',
      'Form',
      'Manufacturer',
      'Batches & Expiry',
      'Rack Location',
      'Current Qty (Units)',
      'Cost Price (₹)',
      'MRP (₹)',
      'Cost Valuation (₹)',
      'Retail Valuation (₹)',
      'Status'
    ];

    let totalUnits = 0;
    let totalCostVal = 0;
    let totalRetailVal = 0;
    let lowStockCount = 0;
    let expiringCount = 0;

    const rows = (medList || []).map((m, index) => {
      const batches = Array.isArray(m.batches) ? m.batches : [];
      const totalStock = batches.reduce((s, b) => s + (b.stock || 0), 0);
      const costVal = batches.reduce((s, b) => s + (b.stock || 0) * (b.costPrice || 0), 0);
      const retailVal = batches.reduce((s, b) => s + (b.stock || 0) * (b.mrp || b.sellingPrice || 0), 0);
      const avgCost = batches[0]?.costPrice || 0;
      const mrp = batches[0]?.mrp || batches[0]?.sellingPrice || 0;
      const batchSummary = batches.map(b => `${b.batchNumber} (Exp: ${b.expiryDate} | Qty: ${b.stock})`).join(', ');

      totalUnits += totalStock;
      totalCostVal += costVal;
      totalRetailVal += retailVal;

      let status = 'Adequate';
      if (totalStock === 0) status = 'Out of Stock';
      else if (totalStock <= m.minStockAlert) {
        status = 'Low Stock';
        lowStockCount += 1;
      }
      if (batches.some(b => b.stock > 0 && new Date(b.expiryDate) <= sixtyDaysAhead)) {
        expiringCount += 1;
      }

      return [
        index + 1,
        m.name,
        m.genericName,
        normalizeFormName(m.form),
        m.manufacturer,
        batchSummary || 'No active batch',
        m.rackLocation || 'Rack A-1',
        totalStock,
        avgCost.toFixed(2),
        mrp.toFixed(2),
        costVal.toFixed(2),
        retailVal.toFixed(2),
        status
      ];
    });

    const potentialMargin = totalRetailVal - totalCostVal;
    const potentialMarginPercent = totalRetailVal > 0 ? ((potentialMargin / totalRetailVal) * 100).toFixed(1) : '0.0';

    const summary = [
      { label: 'Category / Form Scope', value: scopeName === 'All' ? 'Complete Pharmacy Inventory (All Categories)' : `${scopeName} Register` },
      { label: 'Total Products (SKUs)', value: medList.length },
      { label: 'Total Stock On-Hand', value: `${totalUnits.toLocaleString('en-IN')} Units` },
      { label: 'Inventory Cost Valuation', value: `₹${totalCostVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
      { label: 'Retail Value at MRP', value: `₹${totalRetailVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
      { label: 'Potential Gross Margin', value: `₹${potentialMargin.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${potentialMarginPercent}%)` },
      { label: 'Low Stock Items', value: lowStockCount },
      { label: 'Near Expiry (<60 Days)', value: expiringCount }
    ];

    return { headers, rows, summary };
  };

  // Batch-level export dataset for detailed FEFO audit
  const getBatchExportDataset = (medList: Medicine[], scopeName: string) => {
    const headers = [
      '#',
      'Product Name',
      'Dosage Form',
      'Generic Molecule',
      'Batch Number',
      'Expiry Date',
      'Days to Expiry',
      'Stock Units',
      'Cost Price (₹)',
      'MRP (₹)',
      'Cost Valuation (₹)',
      'Retail Valuation (₹)',
      'Rack Location',
      'Manufacturer'
    ];

    let totalUnits = 0;
    let totalCost = 0;
    let totalRetail = 0;
    const rows: (string | number)[][] = [];
    let rowIdx = 1;

    (medList || []).forEach(m => {
      const batches = Array.isArray(m.batches) ? m.batches : [];
      batches.forEach(b => {
        const qty = b.stock || 0;
        const cost = b.costPrice || 0;
        const mrp = b.sellingPrice || b.mrp || 0;
        const costVal = qty * cost;
        const retVal = qty * mrp;
        const daysLeft = b.expiryDate ? Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 999;

        totalUnits += qty;
        totalCost += costVal;
        totalRetail += retVal;

        rows.push([
          rowIdx++,
          m.name,
          normalizeFormName(m.form),
          m.genericName || '',
          b.batchNumber,
          b.expiryDate || '',
          daysLeft <= 0 ? 'EXPIRED' : `${daysLeft} days`,
          qty,
          cost.toFixed(2),
          mrp.toFixed(2),
          costVal.toFixed(2),
          retVal.toFixed(2),
          b.location || m.rackLocation || 'Rack A-1',
          m.manufacturer || ''
        ]);
      });
    });

    const summary = [
      { label: 'Scope', value: `Batch-Wise Stock Register (${scopeName})` },
      { label: 'Total Batches Logged', value: rows.length },
      { label: 'Total Stock Units', value: totalUnits.toLocaleString('en-IN') },
      { label: 'Total Cost Valuation', value: `₹${totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
      { label: 'Total Retail Valuation', value: `₹${totalRetail.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` }
    ];

    return { headers, rows, summary };
  };

  // Master All Products PDF Export
  const handlePDFAllStockReport = () => {
    const { headers, rows, summary } = getExportDataset(localMedicines, 'All Inventory Products');
    exportReportToPDF({
      filename: `CityRx-Master-Stock-Report-All-Products.pdf`,
      title: `Pharmacy Master Stock Inventory Register (All Categories)`,
      subtitle: `Complete Store Inventory On-Hand Valuation, Batches & Locations (${localMedicines.length} SKUs)`,
      headers,
      rows,
      orientation: 'landscape',
      summaryCards: summary
    });
    setToastMessage('Downloaded Master All-Products Stock Report as PDF.');
  };

  // Master All Products Excel (XLS) Export
  const handleExcelAllStockReport = () => {
    const { headers, rows, summary } = getExportDataset(localMedicines, 'All Inventory Products');
    exportReportToExcel(
      `CityRx-Master-Stock-Report-All-Products.xlsx`,
      'Master Stock Register',
      headers,
      rows,
      {
        title: `City Medical - Master Inventory Stock Report (All Products)`,
        subtitle: `Wholesale Cost vs Retail MRP Valuation with Batch Breakdown`,
        summary
      }
    );
    setToastMessage('Downloaded Master All-Products Stock Report as Excel (XLS).');
  };

  // Master All Products CSV Export
  const handleCSVAllStockReport = () => {
    const { headers, rows, summary } = getExportDataset(localMedicines, 'All Inventory Products');
    exportReportToCSV(
      `CityRx-Master-Stock-Report-All-Products.csv`,
      headers,
      rows,
      {
        title: `City Medical - Master Inventory Stock Report (All Products)`,
        subtitle: `Wholesale Cost vs Retail MRP Valuation with Batch Breakdown`,
        summary
      }
    );
    setToastMessage('Downloaded Master All-Products Stock Report as CSV.');
  };

  // Current Filtered PDF Export
  const handlePDFStockReport = () => {
    const { headers, rows, summary } = getExportDataset(filteredList, selectedForm);
    const categoryLabel = selectedForm === 'All' ? 'All-Categories' : selectedForm.replace(/\s+/g, '-');
    exportReportToPDF({
      filename: `CityRx-Stock-Report-${categoryLabel}.pdf`,
      title: `Stock Report - ${selectedForm === 'All' ? 'All Filtered Products' : selectedForm}`,
      subtitle: `Comprehensive FEFO Stock On-Hand, Valuation & Location Register`,
      headers,
      rows,
      orientation: 'landscape',
      summaryCards: summary
    });
    setToastMessage(`Downloaded ${selectedForm} Stock Report as PDF.`);
  };

  // Current Filtered Excel (XLS) Export
  const handleExcelStockReport = () => {
    const { headers, rows, summary } = getExportDataset(filteredList, selectedForm);
    const categoryLabel = selectedForm === 'All' ? 'All-Categories' : selectedForm.replace(/\s+/g, '-');
    exportReportToExcel(
      `CityRx-Stock-Report-${categoryLabel}.xlsx`,
      'Current Stock View',
      headers,
      rows,
      {
        title: `City Medical - Current Stock Report (${selectedForm})`,
        subtitle: `Wholesale Cost vs Retail MRP Valuation with Batch Register`,
        summary
      }
    );
    setToastMessage(`Downloaded ${selectedForm} Stock Report as Excel (XLS).`);
  };

  // Current Filtered CSV Export
  const handleCSVStockReport = () => {
    const { headers, rows, summary } = getExportDataset(filteredList, selectedForm);
    const categoryLabel = selectedForm === 'All' ? 'All-Categories' : selectedForm.replace(/\s+/g, '-');
    exportReportToCSV(
      `CityRx-Stock-Report-${categoryLabel}.csv`,
      headers,
      rows,
      {
        title: `City Medical - Current Stock Report (${selectedForm})`,
        subtitle: `Wholesale Cost vs Retail MRP Valuation with Batch Register`,
        summary
      }
    );
    setToastMessage(`Downloaded ${selectedForm} Stock Report as CSV.`);
  };

  // Batch-Wise Stock Exports (FEFO)
  const handlePDFBatchStockReport = () => {
    const { headers, rows, summary } = getBatchExportDataset(filteredList, selectedForm);
    const categoryLabel = selectedForm === 'All' ? 'All-Batches' : `${selectedForm.replace(/\s+/g, '-')}-Batches`;
    exportReportToPDF({
      filename: `CityRx-Batch-Stock-Report-${categoryLabel}.pdf`,
      title: `Batch-Wise Stock Register (FEFO) - ${selectedForm}`,
      subtitle: `Granular Batch Inventory, Expiry Dates & Valuation Audit`,
      headers,
      rows,
      orientation: 'landscape',
      summaryCards: summary
    });
    setToastMessage('Downloaded Batch-Wise Stock Report as PDF.');
  };

  const handleExcelBatchStockReport = () => {
    const { headers, rows, summary } = getBatchExportDataset(filteredList, selectedForm);
    const categoryLabel = selectedForm === 'All' ? 'All-Batches' : `${selectedForm.replace(/\s+/g, '-')}-Batches`;
    exportReportToExcel(
      `CityRx-Batch-Stock-Report-${categoryLabel}.xlsx`,
      'Batch-Wise FEFO Stock',
      headers,
      rows,
      {
        title: `City Medical - Batch-Wise FEFO Stock Register (${selectedForm})`,
        subtitle: `Batch Numbers, Expiry Dates, Cost & Retail Valuation`,
        summary
      }
    );
    setToastMessage('Downloaded Batch-Wise Stock Report as Excel (XLS).');
  };

  const handleCSVBatchStockReport = () => {
    const { headers, rows, summary } = getBatchExportDataset(filteredList, selectedForm);
    const categoryLabel = selectedForm === 'All' ? 'All-Batches' : `${selectedForm.replace(/\s+/g, '-')}-Batches`;
    exportReportToCSV(
      `CityRx-Batch-Stock-Report-${categoryLabel}.csv`,
      headers,
      rows,
      {
        title: `City Medical - Batch-Wise FEFO Stock Register (${selectedForm})`,
        subtitle: `Batch Numbers, Expiry Dates, Cost & Retail Valuation`,
        summary
      }
    );
    setToastMessage('Downloaded Batch-Wise Stock Report as CSV.');
  };

  // Low Stock Reorder PDF Export
  const handlePDFReorderReport = () => {
    const lowStockItems = localMedicines.filter(m => {
      const stock = m.batches.reduce((s, b) => s + (b.stock || 0), 0);
      return stock <= m.minStockAlert;
    });
    const { headers, rows, summary } = getExportDataset(lowStockItems, 'Low Stock & Reorder Register');
    exportReportToPDF({
      filename: `CityRx-Low-Stock-Reorder-Report.pdf`,
      title: `Pharmacy Wholesale Purchase Reorder Register`,
      subtitle: `Items At or Below Reorder Threshold requiring PO (${lowStockItems.length} SKUs)`,
      headers,
      rows,
      orientation: 'landscape',
      summaryCards: summary
    });
  };

  // Near Expiry PDF Export
  const handlePDFExpiringReport = () => {
    const expiringItems = localMedicines.filter(m =>
      m.batches.some(b => b.stock > 0 && new Date(b.expiryDate) <= sixtyDaysAhead)
    );
    const { headers, rows, summary } = getExportDataset(expiringItems, 'Near Expiry Alert Register (<60 Days)');
    exportReportToPDF({
      filename: `CityRx-Near-Expiry-Batches-Report.pdf`,
      title: `Critical Near-Expiry Batch Register (<60 Days)`,
      subtitle: `Fast-track clearance / Return to Distributor register (${expiringItems.length} SKUs)`,
      headers,
      rows,
      orientation: 'landscape',
      summaryCards: summary
    });
  };

  const handlePrintStockReport = () => {
    const { headers, rows, summary } = getExportDataset(filteredList, selectedForm);
    const categoryLabel = selectedForm === 'All' ? 'Complete Pharmacy Stock' : `${selectedForm} Stock`;
    printReportWindow({
      title: `Current Stock Report & Inventory Valuation - ${categoryLabel}`,
      subtitle: `City Medical ERP • Melur, Madurai • Generated: ${new Date().toLocaleString()}`,
      headers,
      rows,
      summaryCards: summary
    });
  };

  const currentFormConfig = selectedForm === 'All' ? null : getFormConfig(selectedForm);
  const CurrentFormIcon = currentFormConfig?.icon || Boxes;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{toastMessage}</p>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & EXPORT BAR                                                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Boxes className="w-5 h-5 text-teal-600" />
              <span>Current Stock View & Category Report</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
              {TARGET_PRODUCT_FORMS.length} Product Forms (Including Injections)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time batch stock on hand, purchase cost valuation, and retail margin across all product dosage types
          </p>
        </div>

        {/* Action Controls: Master Print, PDF, and Excel */}
        <div className="flex flex-wrap items-center gap-2">
          {/* MASTER SHOW REPORT ALL BUTTONS */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200">
            <button
              onClick={handlePDFAllStockReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black shadow-xs transition-colors cursor-pointer"
              id="show-report-all-pdf-btn"
              title="Show and Download Master Report of ALL Products as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>All PDF</span>
            </button>

            <button
              onClick={handleExcelAllStockReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black shadow-xs transition-colors cursor-pointer"
              id="show-report-all-xls-btn"
              title="Show and Download Master Report of ALL Products as Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>All XLS</span>
            </button>

            <button
              onClick={handleCSVAllStockReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-black shadow-xs transition-colors cursor-pointer"
              id="show-report-all-csv-btn"
              title="Show and Download Master Report of ALL Products as CSV (.csv)"
            >
              <Download className="w-3.5 h-3.5 text-indigo-200" />
              <span>All CSV</span>
            </button>
          </div>

          {/* FILTERED VIEW EXPORT BUTTONS */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1.5 pr-0.5 hidden sm:inline">
              Filtered:
            </span>
            <button
              onClick={handlePDFStockReport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              id="pdf-stock-report-btn"
              title="Download Filtered Category PDF"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>

            <button
              onClick={handleExcelStockReport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              id="excel-stock-report-btn"
              title="Download Filtered Category Excel Spreadsheet (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>XLS</span>
            </button>

            <button
              onClick={handleCSVStockReport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              id="csv-stock-report-btn"
              title="Download Filtered Category CSV (.csv)"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>CSV</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset ALL stock to 0 units across all medicines? This will make total stock zero.')) {
                const res = StorageService.setAllStockToZero();
                const updated = StorageService.getMedicines();
                setLocalMedicines(updated.map(m => ({ ...m, batches: Array.isArray(m.batches) ? m.batches : [] })));
                setToastMessage(`Total stock is now 0! Reset all stock across ${res.count} products (${res.totalZeroed} units zeroed).`);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            id="report-zero-all-stock-btn"
            title="Reset all current stock on hand to 0 (Make Zero Stock Total)"
          >
            <RefreshCw className="w-4 h-4 text-rose-600" />
            <span>Make Zero Stock Total</span>
          </button>

          <button
            onClick={handlePrintStockReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            id="print-stock-report-btn"
            title="Print Current Stock Report"
          >
            <Printer className="w-4 h-4 text-teal-400" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Quick Alert Export Shortcuts Bar & Batch-Wise Stock Downloads */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 px-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Current Stock Downloads:</span>
          </span>
          <button
            onClick={handlePDFStockReport}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-xl font-bold text-xs shadow-2xs cursor-pointer transition-colors"
            id="btn-quick-stock-pdf"
            title="Download Current Stock in PDF"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>Current Stock (PDF)</span>
          </button>
          <button
            onClick={handleExcelStockReport}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs shadow-2xs cursor-pointer transition-colors"
            id="btn-quick-stock-xls"
            title="Download Current Stock in Excel (XLS)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Current Stock (XLS)</span>
          </button>
          <button
            onClick={handleCSVStockReport}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-300 rounded-xl font-bold text-xs shadow-2xs cursor-pointer transition-colors"
            id="btn-quick-stock-csv"
            title="Download Current Stock in CSV format"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Current Stock (CSV)</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-600 text-[11px]">Batch-Wise (FEFO):</span>
          <button
            onClick={handlePDFBatchStockReport}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold text-[11px] shadow-2xs cursor-pointer transition-colors"
            title="Batch-Wise Stock with Expiry Dates (PDF)"
          >
            <span>Batch PDF</span>
          </button>
          <button
            onClick={handleExcelBatchStockReport}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold text-[11px] shadow-2xs cursor-pointer transition-colors"
            title="Batch-Wise Stock with Expiry Dates (XLS)"
          >
            <span>Batch XLS</span>
          </button>
          <button
            onClick={handleCSVBatchStockReport}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold text-[11px] shadow-2xs cursor-pointer transition-colors"
            title="Batch-Wise Stock with Expiry Dates (CSV)"
          >
            <span>Batch CSV</span>
          </button>

          <span className="text-slate-300">|</span>

          <button
            onClick={handlePDFReorderReport}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-lg font-bold text-[11px] shadow-2xs cursor-pointer transition-colors"
            id="btn-quick-reorder-pdf"
          >
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Low Stock (PDF)</span>
          </button>
          <button
            onClick={handlePDFExpiringReport}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-900 border border-rose-300 rounded-lg font-bold text-[11px] shadow-2xs cursor-pointer transition-colors"
            id="btn-quick-expiring-pdf"
          >
            <Clock className="w-3 h-3 text-rose-600" />
            <span>Near-Expiry (PDF)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PRODUCT FORM / DOSAGE FILTER CHIPS (Horizontal Scroll Ribbon)          */}
      {/* ========================================================================= */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-teal-600" />
            <span>Filter by Product Form / Category ({TARGET_PRODUCT_FORMS.length} Formats)</span>
          </span>
          <span>Showing {filteredList.length} of {(localMedicines || []).length} items</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-slate-300">
          {/* All Forms Tab */}
          <button
            onClick={() => setSelectedForm('All')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedForm === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
            id="filter-form-all"
          >
            <Boxes className="w-3.5 h-3.5 text-teal-400" />
            <span>All Products</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              selectedForm === 'All' ? 'bg-slate-700 text-teal-300' : 'bg-white text-slate-700'
            }`}>
              {(localMedicines || []).length}
            </span>
          </button>

          {/* 22 Explicit Product Form Buttons */}
          {TARGET_PRODUCT_FORMS.map(formName => {
            const cfg = PRODUCT_FORM_CONFIGS[formName];
            const FormIcon = cfg.icon;
            const count = formStats[formName]?.count || 0;
            const units = formStats[formName]?.units || 0;
            const isSelected = selectedForm === formName;

            return (
              <button
                key={formName}
                onClick={() => setSelectedForm(formName)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                    : `${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder} hover:brightness-95`
                }`}
                id={`filter-form-${cfg.key.replace(/\s+/g, '-')}`}
                title={`${formName}: ${count} products (${units} units in stock)`}
              >
                <FormIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : cfg.iconColor}`} />
                <span>{formName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isSelected ? 'bg-teal-800 text-teal-200' : 'bg-white/80 text-slate-800 border border-slate-200'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTIVE SELECTION SPOTLIGHT & SUMMARY KPIS                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Category</div>
          <div className="mt-1">
            <div className="text-lg font-black text-slate-900 truncate flex items-center gap-1.5">
              {currentFormConfig && <CurrentFormIcon className="w-4 h-4 text-teal-600 shrink-0" />}
              <span>{selectedForm === 'All' ? 'All Products' : selectedForm}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{currentSummary.totalItems} distinct SKUs</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Units On-Hand</div>
          <div className="mt-1">
            <div className="text-xl font-black text-slate-900 font-mono">
              {currentSummary.totalUnits.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Physical Stock In Shop</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cost Valuation (FIFO)</div>
          <div className="mt-1">
            <div className="text-xl font-black text-slate-900 font-mono">
              ₹{currentSummary.totalCostVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Wholesale Capital</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Retail Value (MRP)</div>
          <div className="mt-1">
            <div className="text-xl font-black text-emerald-700 font-mono">
              ₹{currentSummary.totalRetailVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
              Margin: {currentSummary.potentialMarginPercent}%
            </div>
          </div>
        </div>

        {/* ZERO STOCK TOTAL KPI CARD */}
        <button
          type="button"
          onClick={() => setStockStatusFilter(prev => prev === 'out-of-stock' ? 'all' : 'out-of-stock')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs flex flex-col justify-between ${
            stockStatusFilter === 'out-of-stock'
              ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-500'
              : 'bg-white border-rose-200 hover:border-rose-300 bg-rose-50/20'
          }`}
          id="stock-report-zero-stock-card"
          title="Click to toggle filter for Zero Stock items"
        >
          <div className="text-[11px] font-black text-rose-700 uppercase tracking-wider flex items-center justify-between">
            <span>Zero Stock Total</span>
            <span className="p-0.5 rounded bg-rose-100 text-rose-700">
              <TrendingDown className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1">
            <div className="text-xl font-black text-rose-800 font-mono">{currentSummary.zeroStockCount}</div>
            <div className="text-[11px] text-rose-700 font-medium mt-0.5">0 units on hand</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStockStatusFilter(prev => prev === 'low-stock' ? 'all' : 'low-stock')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs flex flex-col justify-between ${
            stockStatusFilter === 'low-stock'
              ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-500'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
          id="stock-report-low-stock-card"
          title="Click to toggle filter for Low Stock items"
        >
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
            <span>Low Stock</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-1">
            <div className="text-xl font-black text-amber-800 font-mono">{currentSummary.lowStockCount}</div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">Below alert threshold</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStockStatusFilter(prev => prev === 'expiring' ? 'all' : 'expiring')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs flex flex-col justify-between ${
            stockStatusFilter === 'expiring'
              ? 'bg-indigo-100 border-indigo-400 ring-2 ring-indigo-500'
              : 'bg-white border-slate-200 hover:border-indigo-300'
          }`}
          id="stock-report-expiring-card"
          title="Click to toggle filter for Near Expiry items"
        >
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Near Expiry (60D)</span>
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="mt-1">
            <div className="text-xl font-black text-slate-900 font-mono">{currentSummary.expiringCount}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">FEFO action needed</div>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. SEARCH & STATUS FILTER BAR                                            */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input with Voice */}
        <div className="relative w-full md:w-80 flex items-center">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search ${selectedForm === 'All' ? 'all' : selectedForm} products, molecules, batches...`}
            className="w-full pl-9 pr-14 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            id="stock-search-input"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <VoiceInputButton
              onTranscript={(text) => setSearchQuery(text)}
              size="xs"
              title="Speak medicine name, molecule, or batch"
            />
          </div>
        </div>

        {/* Stock Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">Status:</span>
          {(['all', 'in-stock', 'low-stock', 'out-of-stock', 'expiring'] as const).map(status => {
            const count =
              status === 'all'
                ? globalStockCounts.all
                : status === 'in-stock'
                ? globalStockCounts.inStock
                : status === 'low-stock'
                ? globalStockCounts.lowStock
                : status === 'out-of-stock'
                ? globalStockCounts.outOfStock
                : globalStockCounts.expiring;

            return (
              <button
                key={status}
                onClick={() => setStockStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  stockStatusFilter === status
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                id={`stock-status-${status}`}
              >
                <span>
                  {status === 'all' && 'All'}
                  {status === 'in-stock' && 'In Stock'}
                  {status === 'low-stock' && 'Low Stock'}
                  {status === 'out-of-stock' && 'Zero Stock'}
                  {status === 'expiring' && 'Near Expiry'}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    stockStatusFilter === status
                      ? 'bg-white/20 text-white'
                      : status === 'out-of-stock' && count > 0
                      ? 'bg-rose-100 text-rose-800'
                      : status === 'low-stock' && count > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Sort Dropdown */}
          <select
            value={`${sortField}-${sortDirection}`}
            onChange={e => {
              const [f, d] = e.target.value.split('-');
              setSortField(f as any);
              setSortDirection(d as any);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer ml-auto"
            id="stock-sort-select"
          >
            <option value="name-asc">Sort: Name (A-Z)</option>
            <option value="name-desc">Sort: Name (Z-A)</option>
            <option value="stock-desc">Sort: Stock (High to Low)</option>
            <option value="stock-asc">Sort: Stock (Low to High)</option>
            <option value="costVal-desc">Sort: Cost Valuation (Highest)</option>
            <option value="retailVal-desc">Sort: Retail MRP Value (Highest)</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. CURRENT STOCK DETAILED LEDGER TABLE                                    */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>{selectedForm === 'All' ? 'Master Product Inventory Ledger' : `${selectedForm} Stock Register`}</span>
              <span className="text-xs font-normal text-slate-500">({filteredList.length} items listed)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              {currentFormConfig ? currentFormConfig.description : 'Inventory breakdown across all categories and packaging forms'}
            </p>
          </div>
          <div className="text-xs text-slate-600 font-medium">
            Total Valuation: <span className="font-bold text-slate-900">₹{currentSummary.totalCostVal.toFixed(2)}</span>
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700 text-sm">No items found matching criteria</p>
            <p className="text-xs text-slate-400 mt-1">
              Try switching the category filter or resetting the search query.
            </p>
            <button
              onClick={() => {
                setSelectedForm('All');
                setSearchQuery('');
                setStockStatusFilter('all');
              }}
              className="mt-3 px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3 w-8 text-center">#</th>
                  <th className="p-3">Product Name & Molecule</th>
                  <th className="p-3">Form</th>
                  <th className="p-3">Manufacturer</th>
                  <th className="p-3">Batches & Expiry</th>
                  <th className="p-3">Rack</th>
                  <th className="p-3 text-right">Current Stock</th>
                  <th className="p-3 text-right">Cost (₹)</th>
                  <th className="p-3 text-right">MRP (₹)</th>
                  <th className="p-3 text-right">Cost Val (₹)</th>
                  <th className="p-3 text-right">Retail Val (₹)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((m, idx) => {
                  const formName = normalizeFormName(m.form);
                  const cfg = getFormConfig(formName);
                  const FormIcon = cfg.icon;
                  const batches = Array.isArray(m.batches) ? m.batches : [];
                  const totalStock = batches.reduce((sum, b) => sum + (b.stock || 0), 0);
                  const costVal = batches.reduce((sum, b) => sum + (b.stock || 0) * (b.costPrice || 0), 0);
                  const retailVal = batches.reduce((sum, b) => sum + (b.stock || 0) * (b.mrp || b.sellingPrice || 0), 0);
                  const primaryBatch = batches[0];
                  const isLow = totalStock <= m.minStockAlert && totalStock > 0;
                  const isOut = totalStock === 0;
                  const hasExpiring = batches.some(b => b.stock > 0 && new Date(b.expiryDate) <= sixtyDaysAhead);
                  const isExpanded = expandedMedicineId === m.id;

                  return (
                    <React.Fragment key={m.id}>
                      <tr className={`hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-teal-50/30' : ''}`}>
                        <td className="p-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <button
                              onClick={() => setExpandedMedicineId(isExpanded ? null : m.id)}
                              className="text-slate-400 hover:text-teal-600 transition-colors cursor-pointer"
                              title={isExpanded ? 'Hide Batches' : 'Expand Batch Details'}
                            >
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-teal-600" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                            <span>{m.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs ml-5">{m.genericName}</div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}>
                            <FormIcon className={`w-3 h-3 ${cfg.iconColor}`} />
                            <span>{formName}</span>
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 font-medium text-[11px]">{m.manufacturer}</td>
                        <td className="p-3">
                          {batches.length > 0 ? (
                            <div className="space-y-0.5">
                              {batches.slice(0, 2).map(b => {
                                const expDate = new Date(b.expiryDate);
                                const isExp = expDate <= sixtyDaysAhead;
                                return (
                                  <div key={b.batchNumber} className="flex items-center gap-1 text-[10px] font-mono">
                                    <span className="font-bold text-slate-700">{b.batchNumber}</span>
                                    <span className="text-slate-400">•</span>
                                    <span className={isExp ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                                      Exp: {b.expiryDate}
                                    </span>
                                    <span className="text-slate-400 font-semibold">({b.stock})</span>
                                  </div>
                                );
                              })}
                              {batches.length > 2 && (
                                <button
                                  onClick={() => setExpandedMedicineId(isExpanded ? null : m.id)}
                                  className="text-[10px] text-teal-600 font-bold hover:underline cursor-pointer"
                                >
                                  +{batches.length - 2} more batches (view)
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No batches</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{m.rackLocation || 'A-1'}</span>
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className={`font-mono font-bold text-xs ${
                            isOut ? 'text-slate-400' : isLow ? 'text-rose-700' : 'text-slate-900'
                          }`}>
                            {totalStock} {cfg.defaultUnit ? `(${cfg.defaultUnit})` : ''}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-700 text-[11px]">
                          ₹{(primaryBatch?.costPrice || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-slate-900 text-[11px]">
                          ₹{(primaryBatch?.mrp || primaryBatch?.sellingPrice || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 text-[11px]">
                          ₹{costVal.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700 text-[11px]">
                          ₹{retailVal.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          {isOut ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Low Stock
                            </span>
                          ) : hasExpiring ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-2.5 h-2.5" />
                              Expiring
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Adequate
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setAdjustmentTarget({ medicine: m, initialType: 'ADD' })}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[10px] font-bold shadow-2xs transition-colors cursor-pointer"
                              title="Adjust Stock for this Product"
                              id={`adjust-stock-btn-${m.id}`}
                            >
                              <SlidersHorizontal className="w-3 h-3 text-teal-600" />
                              <span>Adjust</span>
                            </button>
                            <button
                              onClick={() => setExpandedMedicineId(isExpanded ? null : m.id)}
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="Toggle batch details"
                            >
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Batch Detail Drawer */}
                      {isExpanded && (
                        <tr className="bg-teal-50/20 border-y border-teal-100/60">
                          <td colSpan={13} className="p-3 pl-10">
                            <div className="bg-white rounded-xl border border-teal-200/80 p-3 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900">
                                    All Active Batches for {m.name} ({batches.length} registered)
                                  </span>
                                  <span className="text-[10px] text-slate-500">FEFO priority order</span>
                                </div>
                                <button
                                  onClick={() => setAdjustmentTarget({ medicine: m, initialType: 'ADD' })}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-[10px] font-bold shadow-2xs cursor-pointer"
                                >
                                  <PlusCircle className="w-3 h-3" />
                                  <span>Add New Batch / Stock</span>
                                </button>
                              </div>

                              {batches.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-2">No active batches available.</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                                  {batches.map(b => {
                                    const expDate = new Date(b.expiryDate);
                                    const isExp = expDate <= sixtyDaysAhead;
                                    const bCost = (b.stock || 0) * (b.costPrice || 0);
                                    const bRetail = (b.stock || 0) * (b.mrp || b.sellingPrice || 0);

                                    return (
                                      <div
                                        key={b.batchNumber}
                                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-teal-300 transition-all flex flex-col justify-between"
                                      >
                                        <div className="flex items-start justify-between gap-1">
                                          <div>
                                            <span className="text-xs font-mono font-black text-slate-900">
                                              Batch #{b.batchNumber}
                                            </span>
                                            <div className={`text-[10px] font-mono mt-0.5 ${isExp ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                                              Expiry: {b.expiryDate} {isExp && '(Near Expiry!)'}
                                            </div>
                                          </div>
                                          <span className="text-xs font-mono font-black px-2 py-0.5 bg-teal-100 text-teal-900 rounded-md">
                                            {b.stock} units
                                          </span>
                                        </div>

                                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono text-slate-600">
                                          <div>
                                            <span>CP: ₹{b.costPrice?.toFixed(2)}</span>
                                            <span className="mx-1">•</span>
                                            <span className="text-emerald-700 font-bold">MRP: ₹{b.mrp?.toFixed(2)}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => setAdjustmentTarget({ medicine: m, batch: b, initialType: 'ADD' })}
                                              className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-bold cursor-pointer"
                                              title="Add Stock (+)"
                                            >
                                              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                                            </button>
                                            <button
                                              onClick={() => setAdjustmentTarget({ medicine: m, batch: b, initialType: 'REMOVE' })}
                                              className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded font-bold cursor-pointer"
                                              title="Remove/Deduct Stock (-)"
                                            >
                                              <MinusCircle className="w-3.5 h-3.5 text-rose-600" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-800">
                  <td colSpan={6} className="p-3 text-right uppercase tracking-wider text-[11px] text-teal-300">
                    Total Selected Stock Summary ({filteredList.length} SKUs):
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-sm text-teal-300">
                    {currentSummary.totalUnits.toLocaleString('en-IN')}
                  </td>
                  <td colSpan={2} className="p-3"></td>
                  <td className="p-3 text-right font-mono font-bold text-sm text-white">
                    ₹{currentSummary.totalCostVal.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-sm text-emerald-400">
                    ₹{currentSummary.totalRetailVal.toFixed(2)}
                  </td>
                  <td className="p-3 text-center text-[10px] text-teal-300">
                    Margin: {currentSummary.potentialMarginPercent}%
                  </td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. CATEGORY DIRECTORY BENTO GRID (All 22 Product Forms)                   */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Category Stock Distribution Matrix (22 Product Types)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Click on any product category card to filter the stock report instantly
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600">
            Total Inventory: {overallTotalUnits.toLocaleString('en-IN')} units
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
          {TARGET_PRODUCT_FORMS.map(formName => {
            const cfg = PRODUCT_FORM_CONFIGS[formName];
            const FormIcon = cfg.icon;
            const stats = formStats[formName] || { count: 0, units: 0, costVal: 0, retailVal: 0 };
            const isActive = selectedForm === formName;

            return (
              <button
                key={formName}
                onClick={() => setSelectedForm(formName)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-teal-500'
                    : `${cfg.badgeBg} border-slate-200 hover:border-slate-300 hover:shadow-2xs`
                }`}
                id={`card-form-${cfg.key.replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`p-1.5 rounded-lg ${isActive ? 'bg-slate-800' : 'bg-white shadow-2xs'}`}>
                    <FormIcon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : cfg.iconColor}`} />
                  </span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-teal-900 text-teal-200' : 'bg-white text-slate-700 border border-slate-200'
                  }`}>
                    {stats.count} SKUs
                  </span>
                </div>

                <div className="mt-2">
                  <div className={`font-bold text-xs truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {formName}
                  </div>
                  <div className={`text-[11px] font-mono font-semibold ${isActive ? 'text-teal-300' : 'text-slate-600'}`}>
                    {stats.units} units
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                    ₹{stats.costVal > 0 ? stats.costVal.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustmentTarget && (
        <StockAdjustmentModal
          isOpen={true}
          onClose={() => setAdjustmentTarget(null)}
          medicine={adjustmentTarget.medicine}
          batch={adjustmentTarget.batch}
          initialType={adjustmentTarget.initialType}
          onSuccess={(adj: StockAdjustment) => {
            reloadMedicines();
            setToastMessage(
              `Stock adjustment saved: ${adj.type === 'ADD' ? 'Added' : 'Removed'} ${adj.quantity} units for ${adj.medicineName} (Batch #${adj.batchNumber}). New stock: ${adj.newStock} units.`
            );
            setTimeout(() => setToastMessage(null), 6000);
            setAdjustmentTarget(null);
          }}
        />
      )}
    </div>
  );
};
