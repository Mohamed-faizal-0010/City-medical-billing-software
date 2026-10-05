import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Search,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
  Boxes,
  FlaskConical,
  Percent,
  Sparkles,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Eye,
  Info,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { SaleTransaction, Medicine, PurchaseInvoice } from '../types';
import { StorageService } from '../services/storage';
import {
  exportReportToExcel,
  exportReportToPDF,
  exportReportToCSV,
  printReportWindow
} from '../utils/exportUtils';
import { VoiceInputButton } from './VoiceInputButton';

export interface ProfitabilityReportViewProps {
  transactions?: SaleTransaction[];
  medicines?: Medicine[];
  purchaseInvoices?: PurchaseInvoice[];
  dateRange?: string;
  startDate?: string;
  endDate?: string;
}

export interface MedicineMarginRow {
  medicineId: string;
  medicineName: string;
  genericName: string;
  category: string;
  form: string;
  totalQuantitySold: number;
  totalRevenue: number;
  averageSellingPrice: number;
  unitCostPrice: number;
  netUnitMargin: number;
  netMarginPercent: number;
  markupPercent: number;
  totalCost: number;
  totalProfit: number;
  transactionCount: number;
  currentStock: number;
  mrp: number;
  marginBand: 'High' | 'Good' | 'Moderate' | 'Low' | 'Negative';
}

type SortField =
  | 'netMarginPercent'
  | 'totalProfit'
  | 'totalQuantitySold'
  | 'totalRevenue'
  | 'netUnitMargin'
  | 'averageSellingPrice'
  | 'medicineName';

type SortDirection = 'asc' | 'desc';

export const ProfitabilityReportView: React.FC<ProfitabilityReportViewProps> = ({
  transactions: propTransactions,
  medicines: propMedicines,
  purchaseInvoices: propPurchaseInvoices,
  dateRange: propDateRange,
  startDate: propStartDate,
  endDate: propEndDate
}) => {
  // Load data
  const transactions = useMemo(
    () => (Array.isArray(propTransactions) ? propTransactions : StorageService.getTransactions()),
    [propTransactions]
  );
  const medicines = useMemo(
    () => (Array.isArray(propMedicines) ? propMedicines : StorageService.getMedicines()),
    [propMedicines]
  );
  const purchaseInvoices = useMemo(
    () => (Array.isArray(propPurchaseInvoices) ? propPurchaseInvoices : StorageService.getPurchaseInvoices()),
    [propPurchaseInvoices]
  );

  // Local Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMarginBand, setSelectedMarginBand] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'transactions' | 'catalog'>('transactions');
  const [sortField, setSortField] = useState<SortField>('netMarginPercent');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [timeFilter, setTimeFilter] = useState<string>(propDateRange || '30d');
  const [customStart, setCustomStart] = useState<string>(propStartDate || '');
  const [customEnd, setCustomEnd] = useState<string>(propEndDate || '');
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'retail' | 'wholesale'>('all');

  // Filter transactions by timeFilter
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(tx => {
      // Channel filter
      if (selectedChannel === 'retail' && tx.saleType === 'wholesale') return false;
      if (selectedChannel === 'wholesale' && tx.saleType !== 'wholesale') return false;

      // Time filter
      const txDate = new Date(tx.date);
      if (timeFilter === 'today') {
        return txDate.toDateString() === now.toDateString();
      }
      if (timeFilter === 'yesterday') {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        return txDate.toDateString() === yest.toDateString();
      }
      if (timeFilter === '7d') {
        const past = new Date();
        past.setDate(past.getDate() - 7);
        return txDate >= past;
      }
      if (timeFilter === '30d') {
        const past = new Date();
        past.setDate(past.getDate() - 30);
        return txDate >= past;
      }
      if (timeFilter === 'this_month') {
        return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
      }
      if (timeFilter === 'custom') {
        if (customStart && tx.date.slice(0, 10) < customStart) return false;
        if (customEnd && tx.date.slice(0, 10) > customEnd) return false;
        return true;
      }
      return true; // 'all'
    });
  }, [transactions, timeFilter, customStart, customEnd, selectedChannel]);

  // Master Cost Price resolver for any medicine / batch
  const getMedicineCostPrice = (med: Medicine | undefined, batchNo?: string, sellingPrice: number = 0): number => {
    if (!med) return sellingPrice > 0 ? sellingPrice * 0.72 : 0;

    // 1. Direct batch match
    if (batchNo && Array.isArray(med.batches)) {
      const b = med.batches.find(batch => batch.batchNumber.toLowerCase() === batchNo.toLowerCase());
      if (b && b.costPrice > 0) return b.costPrice;
    }

    // 2. Latest Purchase Invoice item
    const purchaseItem = purchaseInvoices
      .flatMap(pi => pi.items || [])
      .find(pi => pi.medicineId === med.id || pi.medicineName.toLowerCase() === med.name.toLowerCase());
    if (purchaseItem && purchaseItem.purchaseRate > 0) return purchaseItem.purchaseRate;

    // 3. Any available batch cost
    if (Array.isArray(med.batches) && med.batches.length > 0) {
      const anyCost = med.batches.find(b => b.costPrice > 0);
      if (anyCost) return anyCost.costPrice;
    }

    // 4. Default realistic pharmaceutical margin fallback (28% margin => 72% cost)
    if (sellingPrice > 0) return Math.round(sellingPrice * 0.72 * 100) / 100;
    return 0;
  };

  // Compute profitability from actual recent transactions
  const transactionMargins = useMemo<MedicineMarginRow[]>(() => {
    const medMap = new Map<
      string,
      {
        medicine: Medicine | undefined;
        medicineName: string;
        genericName: string;
        category: string;
        form: string;
        totalUnits: number;
        totalRevenue: number;
        totalCost: number;
        totalDiscount: number;
        txSet: Set<string>;
        latestSellingPrice: number;
        mrp: number;
      }
    >();

    filteredTransactions.forEach(tx => {
      (tx.items || []).forEach(item => {
        const med = medicines.find(
          m => m.id === item.medicineId || m.name.toLowerCase() === item.medicineName.toLowerCase()
        );
        const medKey = med ? med.id : item.medicineName.toLowerCase().trim();
        const qty = item.quantity || 1;
        const lineRev = item.total != null ? item.total : (qty * item.unitPrice * (1 - (item.discountPercent || 0) / 100));
        const unitCost = getMedicineCostPrice(med, item.batchNumber, item.unitPrice);
        const lineCost = unitCost * qty;
        const lineDisc = (qty * item.unitPrice * (item.discountPercent || 0)) / 100;

        let entry = medMap.get(medKey);
        if (!entry) {
          entry = {
            medicine: med,
            medicineName: med ? med.name : item.medicineName,
            genericName: med?.genericName || item.genericName || 'Standard Formulation',
            category: med?.category || 'General Healthcare',
            form: med?.form || 'Tablet',
            totalUnits: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalDiscount: 0,
            txSet: new Set(),
            latestSellingPrice: item.unitPrice,
            mrp: med?.batches?.[0]?.mrp || med?.batches?.[0]?.sellingPrice || item.unitPrice
          };
          medMap.set(medKey, entry);
        }

        entry.totalUnits += qty;
        entry.totalRevenue += lineRev;
        entry.totalCost += lineCost;
        entry.totalDiscount += lineDisc;
        entry.txSet.add(tx.id);
        entry.latestSellingPrice = item.unitPrice;
      });
    });

    const rows: MedicineMarginRow[] = [];
    medMap.forEach((data, id) => {
      if (data.totalUnits <= 0) return;
      const avgSellingPrice = data.totalRevenue / data.totalUnits;
      const avgCostPrice = data.totalCost / data.totalUnits;
      const netUnitMargin = avgSellingPrice - avgCostPrice;
      const netMarginPercent = avgSellingPrice > 0 ? (netUnitMargin / avgSellingPrice) * 100 : 0;
      const markupPercent = avgCostPrice > 0 ? (netUnitMargin / avgCostPrice) * 100 : 0;
      const totalProfit = data.totalRevenue - data.totalCost;

      let marginBand: 'High' | 'Good' | 'Moderate' | 'Low' | 'Negative' = 'Moderate';
      if (netMarginPercent >= 25) marginBand = 'High';
      else if (netMarginPercent >= 15) marginBand = 'Good';
      else if (netMarginPercent >= 8) marginBand = 'Moderate';
      else if (netMarginPercent >= 0) marginBand = 'Low';
      else marginBand = 'Negative';

      const currentStock = data.medicine
        ? (data.medicine.batches || []).reduce((sum, b) => sum + (b.stock || 0), 0)
        : 0;

      rows.push({
        medicineId: id,
        medicineName: data.medicineName,
        genericName: data.genericName,
        category: data.category,
        form: data.form,
        totalQuantitySold: data.totalUnits,
        totalRevenue: data.totalRevenue,
        averageSellingPrice: Math.round(avgSellingPrice * 100) / 100,
        unitCostPrice: Math.round(avgCostPrice * 100) / 100,
        netUnitMargin: Math.round(netUnitMargin * 100) / 100,
        netMarginPercent: Math.round(netMarginPercent * 10) / 10,
        markupPercent: Math.round(markupPercent * 10) / 10,
        totalCost: Math.round(data.totalCost * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        transactionCount: data.txSet.size,
        currentStock,
        mrp: data.mrp,
        marginBand
      });
    });

    return rows;
  }, [filteredTransactions, medicines, purchaseInvoices]);

  // Compute profitability across all catalog medicines (projected baseline)
  const catalogMargins = useMemo<MedicineMarginRow[]>(() => {
    return medicines.map(med => {
      const batches = Array.isArray(med.batches) ? med.batches : [];
      const primaryBatch = batches[0];
      const costPrice = primaryBatch?.costPrice || getMedicineCostPrice(med, undefined, primaryBatch?.sellingPrice || 10);
      const sellingPrice = primaryBatch?.sellingPrice || primaryBatch?.mrp || (costPrice > 0 ? costPrice * 1.3 : 10);
      const netUnitMargin = sellingPrice - costPrice;
      const netMarginPercent = sellingPrice > 0 ? (netUnitMargin / sellingPrice) * 100 : 0;
      const markupPercent = costPrice > 0 ? (netUnitMargin / costPrice) * 100 : 0;
      const currentStock = batches.reduce((sum, b) => sum + (b.stock || 0), 0);

      let marginBand: 'High' | 'Good' | 'Moderate' | 'Low' | 'Negative' = 'Moderate';
      if (netMarginPercent >= 25) marginBand = 'High';
      else if (netMarginPercent >= 15) marginBand = 'Good';
      else if (netMarginPercent >= 8) marginBand = 'Moderate';
      else if (netMarginPercent >= 0) marginBand = 'Low';
      else marginBand = 'Negative';

      return {
        medicineId: med.id,
        medicineName: med.name,
        genericName: med.genericName || 'Standard Formulation',
        category: med.category || 'General Healthcare',
        form: med.form || 'Tablet',
        totalQuantitySold: 0,
        totalRevenue: 0,
        averageSellingPrice: Math.round(sellingPrice * 100) / 100,
        unitCostPrice: Math.round(costPrice * 100) / 100,
        netUnitMargin: Math.round(netUnitMargin * 100) / 100,
        netMarginPercent: Math.round(netMarginPercent * 10) / 10,
        markupPercent: Math.round(markupPercent * 10) / 10,
        totalCost: 0,
        totalProfit: 0,
        transactionCount: 0,
        currentStock,
        mrp: primaryBatch?.mrp || sellingPrice,
        marginBand
      };
    });
  }, [medicines, purchaseInvoices]);

  // Determine active dataset based on viewMode
  const activeDataset = useMemo(() => {
    if (viewMode === 'catalog' || (transactionMargins.length === 0 && viewMode === 'transactions')) {
      return viewMode === 'catalog' ? catalogMargins : (transactionMargins.length > 0 ? transactionMargins : catalogMargins);
    }
    return transactionMargins;
  }, [viewMode, transactionMargins, catalogMargins]);

  // Available categories for filter dropdown
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    activeDataset.forEach(row => {
      if (row.category) set.add(row.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [activeDataset]);

  // Filtered and Sorted Rows
  const displayedRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const filtered = activeDataset.filter(row => {
      // Category filter
      if (selectedCategory !== 'All' && row.category !== selectedCategory) return false;

      // Margin band filter
      if (selectedMarginBand !== 'All' && row.marginBand !== selectedMarginBand) return false;

      // Search query
      if (q) {
        const matchesName = row.medicineName.toLowerCase().includes(q);
        const matchesGeneric = row.genericName.toLowerCase().includes(q);
        const matchesCategory = row.category.toLowerCase().includes(q);
        if (!matchesName && !matchesGeneric && !matchesCategory) return false;
      }

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortDirection === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
  }, [activeDataset, searchQuery, selectedCategory, selectedMarginBand, sortField, sortDirection]);

  // Overall Financial & Margin KPIs
  const summaryKPIs = useMemo(() => {
    const totalRev = displayedRows.reduce((sum, r) => sum + r.totalRevenue, 0);
    const totalCost = displayedRows.reduce((sum, r) => sum + r.totalCost, 0);
    const totalProfit = displayedRows.reduce((sum, r) => sum + r.totalProfit, 0);
    const totalUnits = displayedRows.reduce((sum, r) => sum + r.totalQuantitySold, 0);

    const overallMargin = totalRev > 0 ? (totalProfit / totalRev) * 100 : (
      displayedRows.length > 0
        ? displayedRows.reduce((sum, r) => sum + r.netMarginPercent, 0) / displayedRows.length
        : 0
    );

    const highCount = displayedRows.filter(r => r.marginBand === 'High').length;
    const goodCount = displayedRows.filter(r => r.marginBand === 'Good').length;
    const moderateCount = displayedRows.filter(r => r.marginBand === 'Moderate').length;
    const lowCount = displayedRows.filter(r => r.marginBand === 'Low' || r.marginBand === 'Negative').length;

    // Top Profit Earner
    const topProfitMedicine = [...displayedRows].sort((a, b) => b.totalProfit - a.totalProfit)[0] || null;
    // Highest Margin % Formulation
    const topMarginMedicine = [...displayedRows].sort((a, b) => b.netMarginPercent - a.netMarginPercent)[0] || null;

    return {
      totalRev,
      totalCost,
      totalProfit,
      totalUnits,
      overallMargin: Math.round(overallMargin * 10) / 10,
      highCount,
      goodCount,
      moderateCount,
      lowCount,
      topProfitMedicine,
      topMarginMedicine
    };
  }, [displayedRows]);

  // Handle Sort Click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Export handlers
  const getExportData = () => {
    const headers = [
      '#',
      'Medicine Name',
      'Generic Salt / Composition',
      'Category',
      'Units Dispensed',
      'Avg Cost Price (₹)',
      'Avg Selling Price (₹)',
      'Net Margin / Unit (₹)',
      'Net Margin %',
      'Total Profit (₹)',
      'Total Revenue (₹)',
      'Stock (FEFO)'
    ];

    const rows = displayedRows.map((r, idx) => [
      idx + 1,
      r.medicineName,
      r.genericName,
      r.category,
      r.totalQuantitySold,
      r.unitCostPrice.toFixed(2),
      r.averageSellingPrice.toFixed(2),
      r.netUnitMargin.toFixed(2),
      `${r.netMarginPercent}%`,
      r.totalProfit.toFixed(2),
      r.totalRevenue.toFixed(2),
      r.currentStock
    ]);

    const summaryCards = [
      { label: 'Overall Net Margin', value: `${summaryKPIs.overallMargin}%` },
      { label: 'Total Realized Profit', value: `₹${summaryKPIs.totalProfit.toFixed(2)}` },
      { label: 'Total Revenue', value: `₹${summaryKPIs.totalRev.toFixed(2)}` },
      { label: 'Total Units Dispensed', value: summaryKPIs.totalUnits }
    ];

    return { headers, rows, summaryCards };
  };

  const handlePrint = () => {
    const { headers, rows, summaryCards } = getExportData();
    printReportWindow({
      title: 'Medicine Profitability & Net Margin Audit Report',
      subtitle: `City Medical ERP • Period: ${timeFilter.toUpperCase()} • Generated: ${new Date().toLocaleString()}`,
      headers,
      rows,
      summaryCards
    });
  };

  const handleDownloadPDF = () => {
    const { headers, rows, summaryCards } = getExportData();
    exportReportToPDF({
      filename: `CityRx-Medicine-Profitability-${timeFilter}.pdf`,
      title: 'Medicine Profitability & Net Margin Audit Report',
      subtitle: `Comparison of Cost Price vs Average Realized Selling Price • City Medical ERP`,
      headers,
      rows,
      orientation: 'landscape',
      summaryCards
    });
  };

  const handleDownloadExcel = () => {
    const { headers, rows, summaryCards } = getExportData();
    exportReportToExcel(
      `CityRx-Medicine-Profitability-${timeFilter}.xlsx`,
      'Profitability Margin',
      headers,
      rows,
      {
        title: 'Medicine Profitability & Net Margin Audit Report',
        subtitle: `Comparison of Cost Price vs Average Selling Price across Transactions`,
        summary: summaryCards
      }
    );
  };

  const handleDownloadCSV = () => {
    const { headers, rows } = getExportData();
    exportReportToCSV(`CityRx-Medicine-Profitability-${timeFilter}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: HEADER & MASTER CONTROLS */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-teal-800/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300">
                <Percent className="w-6 h-6" />
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white">
                Medicine Profitability & Margin Intelligence
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Net Margin Audit
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Calculates net profit margin per formulation by comparing batch wholesale cost price against actual average selling price across recent transactions.
            </p>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-xs"
              title="Print Profitability Report"
            >
              <Printer className="w-3.5 h-3.5 text-teal-400" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Report</span>
            </button>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Download Excel Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* View Mode & Channel Toggle Bar */}
        <div className="mt-6 pt-5 border-t border-teal-800/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/60">
            <button
              onClick={() => setViewMode('transactions')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'transactions'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dispensed Sales ({transactionMargins.length} Sold)</span>
            </button>
            <button
              onClick={() => setViewMode('catalog')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'catalog'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>All Stock Formulations ({catalogMargins.length})</span>
            </button>
          </div>

          {/* Timeframe & Channel Selection */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-800/90 rounded-xl px-2.5 py-1.5 border border-slate-700 text-xs">
              <span className="text-slate-400 mr-2 font-medium">Channel:</span>
              <select
                value={selectedChannel}
                onChange={e => setSelectedChannel(e.target.value as any)}
                className="bg-transparent text-white font-bold focus:outline-hidden cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Channels (Retail & B2B)</option>
                <option value="retail" className="bg-slate-900 text-white">Retail Walk-in Counter</option>
                <option value="wholesale" className="bg-slate-900 text-white">Wholesale (B2B)</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-800/90 rounded-xl px-2.5 py-1.5 border border-slate-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-teal-400 mr-1.5" />
              <select
                value={timeFilter}
                onChange={e => setTimeFilter(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-hidden cursor-pointer"
              >
                <option value="today" className="bg-slate-900 text-white">Today</option>
                <option value="yesterday" className="bg-slate-900 text-white">Yesterday</option>
                <option value="7d" className="bg-slate-900 text-white">Last 7 Days</option>
                <option value="30d" className="bg-slate-900 text-white">Last 30 Days</option>
                <option value="this_month" className="bg-slate-900 text-white">This Month</option>
                <option value="all" className="bg-slate-900 text-white">All Time</option>
                <option value="custom" className="bg-slate-900 text-white">Custom Range</option>
              </select>
            </div>

            {timeFilter === 'custom' && (
              <div className="flex items-center gap-1.5 text-xs">
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="bg-slate-800 text-white px-2 py-1 rounded-lg border border-slate-700 text-xs"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="bg-slate-800 text-white px-2 py-1 rounded-lg border border-slate-700 text-xs"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: 4 SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Average Net Margin */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Weighted Net Margin
            </span>
            <span
              className={`p-1.5 rounded-lg text-xs font-bold ${
                summaryKPIs.overallMargin >= 20
                  ? 'bg-emerald-50 text-emerald-700'
                  : summaryKPIs.overallMargin >= 10
                  ? 'bg-teal-50 text-teal-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {summaryKPIs.overallMargin}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              Profitability
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Realized return on gross revenue across {displayedRows.length} formulations
          </p>
        </div>

        {/* Card 2: Total Realized Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Realized Net Profit
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">
              ₹{summaryKPIs.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Revenue (₹{summaryKPIs.totalRev.toLocaleString('en-IN', { maximumFractionDigits: 0 })}) minus Wholesale COGS
          </p>
        </div>

        {/* Card 3: Top Profit Driver */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              #1 Profit Driver Formulation
            </span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          {summaryKPIs.topProfitMedicine ? (
            <div className="mt-2">
              <p className="text-base font-black text-slate-900 truncate" title={summaryKPIs.topProfitMedicine.medicineName}>
                {summaryKPIs.topProfitMedicine.medicineName}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-emerald-700">
                  ₹{summaryKPIs.topProfitMedicine.totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })} profit
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold bg-teal-50 text-teal-800">
                  {summaryKPIs.topProfitMedicine.netMarginPercent}% margin
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-2">No transaction data</p>
          )}
          <p className="text-xs text-slate-500 mt-1">Highest total cash earnings contributor</p>
        </div>

        {/* Card 4: Margin Health Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Margin Health Spread
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-100">
              <span className="text-[10px] text-emerald-800 font-bold block">High (≥25%)</span>
              <span className="text-base font-black text-emerald-900">{summaryKPIs.highCount}</span>
            </div>
            <div className="bg-teal-50/70 p-1.5 rounded-lg border border-teal-100">
              <span className="text-[10px] text-teal-800 font-bold block">Good (15-25%)</span>
              <span className="text-base font-black text-teal-900">{summaryKPIs.goodCount}</span>
            </div>
            <div className="bg-amber-50/70 p-1.5 rounded-lg border border-amber-100">
              <span className="text-[10px] text-amber-800 font-bold block">Moderate (8-15%)</span>
              <span className="text-base font-black text-amber-900">{summaryKPIs.moderateCount}</span>
            </div>
            <div className="bg-rose-50/70 p-1.5 rounded-lg border border-rose-100">
              <span className="text-[10px] text-rose-800 font-bold block">Slim / Alert (&lt;8%)</span>
              <span className="text-base font-black text-rose-900">{summaryKPIs.lowCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: TOP 5 PROFIT DRIVERS & TOP 5 HIGHEST MARGIN CHAMPIONS CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 Cash Profit Generators */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Top 5 Cash Profit Generators</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Ranked by total ₹ earned</span>
          </div>

          <div className="space-y-2.5">
            {[...displayedRows]
              .sort((a, b) => b.totalProfit - a.totalProfit)
              .slice(0, 5)
              .map((item, idx) => (
                <div
                  key={item.medicineId}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 hover:bg-teal-50/50 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-900 text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">{item.medicineName}</div>
                      <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                        <FlaskConical className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                        <span>{item.genericName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-xs text-emerald-700">
                      +₹{item.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {item.netMarginPercent}% • {item.totalQuantitySold} sold
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Top 5 Margin % Champions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Percent className="w-4 h-4 text-teal-600" />
              <span>Highest Margin % Formulations</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Ranked by % return</span>
          </div>

          <div className="space-y-2.5">
            {[...displayedRows]
              .sort((a, b) => b.netMarginPercent - a.netMarginPercent)
              .slice(0, 5)
              .map((item, idx) => (
                <div
                  key={item.medicineId}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 hover:bg-teal-50/50 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">{item.medicineName}</div>
                      <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                        <FlaskConical className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                        <span>{item.genericName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-xs text-teal-800">
                      {item.netMarginPercent}% Margin
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Cost: ₹{item.unitCostPrice.toFixed(2)} | Sell: ₹{item.averageSellingPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* SECTION 4: SEARCH & FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by brand name, salt/generic composition, or category..."
              className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <VoiceInputButton onTranscript={text => setSearchQuery(text)} size="xs" title="Speak search terms" />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-400 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-transparent text-slate-900 font-bold focus:outline-hidden cursor-pointer"
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Margin Health Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <Percent className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-400 font-medium">Margin:</span>
              <select
                value={selectedMarginBand}
                onChange={e => setSelectedMarginBand(e.target.value)}
                className="bg-transparent text-slate-900 font-bold focus:outline-hidden cursor-pointer"
              >
                <option value="All">All Margin Levels</option>
                <option value="High">High (≥25%)</option>
                <option value="Good">Good (15-25%)</option>
                <option value="Moderate">Moderate (8-15%)</option>
                <option value="Low">Low (&lt;8%)</option>
                <option value="Negative">Negative / Loss</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count & active tags */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div>
            Showing <strong className="text-slate-900">{displayedRows.length}</strong> formulations •{' '}
            <span>Sorted by {sortField} ({sortDirection === 'desc' ? 'High to Low' : 'Low to High'})</span>
          </div>
          {(searchQuery || selectedCategory !== 'All' || selectedMarginBand !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedMarginBand('All');
              }}
              className="text-teal-700 hover:text-teal-900 font-bold cursor-pointer hover:underline text-xs"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* SECTION 5: MEDICINE PROFITABILITY LEDGER TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-600 bg-slate-50/80 select-none">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th
                  onClick={() => handleSort('medicineName')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors min-w-[200px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Medicine Formulation & Composition</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalQuantitySold')}
                  className="py-3 px-2 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Units Sold</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('averageSellingPrice')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Avg Sell Price</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span>Cost Price</span>
                    <Info className="w-3 h-3 text-slate-400" title="Wholesale inward purchase rate" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('netUnitMargin')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Margin / Unit</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('netMarginPercent')}
                  className="py-3 px-3 min-w-[150px] cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Net Margin % (Return)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalProfit')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Net Profit</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-slate-600">No medicines matched your filter</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try clearing search queries or switching between "Dispensed Sales" and "All Stock Formulations".
                    </p>
                  </td>
                </tr>
              ) : (
                displayedRows.map((row, idx) => {
                  const isHigh = row.marginBand === 'High';
                  const isGood = row.marginBand === 'Good';
                  const isModerate = row.marginBand === 'Moderate';
                  const isLow = row.marginBand === 'Low';
                  const isNegative = row.marginBand === 'Negative';

                  const badgeClass = isHigh
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : isGood
                    ? 'bg-teal-50 text-teal-800 border-teal-300'
                    : isModerate
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : isLow
                    ? 'bg-orange-50 text-orange-800 border-orange-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300';

                  // Cost vs Margin ratio for visual bar (clamped 0 to 100)
                  const marginBarWidth = Math.max(0, Math.min(100, row.netMarginPercent));
                  const costBarWidth = Math.max(0, 100 - marginBarWidth);

                  return (
                    <tr key={row.medicineId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Medicine Formulation & Salt */}
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-slate-900 text-xs">{row.medicineName}</div>
                        <div className="flex items-center gap-1 text-[10px] text-teal-800 mt-0.5 max-w-[240px] truncate">
                          <FlaskConical className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                          <span className="truncate">{row.genericName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {row.category}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {row.form}
                          </span>
                        </div>
                      </td>

                      {/* Units Sold */}
                      <td className="py-3 px-2 text-center">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {row.totalQuantitySold}
                        </span>
                        {row.transactionCount > 0 && (
                          <span className="text-[10px] text-slate-400 block font-sans">
                            {row.transactionCount} bill{row.transactionCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </td>

                      {/* Avg Selling Price */}
                      <td className="py-3 px-3 text-right font-mono">
                        <span className="font-bold text-slate-900 text-xs">
                          ₹{row.averageSellingPrice.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          MRP: ₹{row.mrp.toFixed(2)}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-3 text-right font-mono">
                        <span className="font-bold text-slate-700 text-xs">
                          ₹{row.unitCostPrice.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Inward Cost
                        </span>
                      </td>

                      {/* Margin / Unit */}
                      <td className="py-3 px-3 text-right font-mono">
                        <span
                          className={`font-black text-xs ${
                            row.netUnitMargin >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {row.netUnitMargin >= 0 ? '+' : ''}₹{row.netUnitMargin.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          per unit
                        </span>
                      </td>

                      {/* Net Margin % with Visual Progress Bar */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black border ${badgeClass}`}
                          >
                            {row.netMarginPercent}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            +{row.markupPercent}% markup
                          </span>
                        </div>

                        {/* Visual Ratio Bar */}
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex mt-1.5" title={`Cost: ${costBarWidth.toFixed(0)}% | Margin: ${marginBarWidth.toFixed(0)}%`}>
                          <div
                            style={{ width: `${costBarWidth}%` }}
                            className="bg-slate-400 h-full"
                          />
                          <div
                            style={{ width: `${marginBarWidth}%` }}
                            className={`h-full ${
                              isHigh
                                ? 'bg-emerald-500'
                                : isGood
                                ? 'bg-teal-500'
                                : isModerate
                                ? 'bg-amber-500'
                                : isLow
                                ? 'bg-orange-500'
                                : 'bg-rose-500'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Total Net Profit */}
                      <td className="py-3 px-3 text-right font-mono">
                        <span
                          className={`font-black text-xs ${
                            row.totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {row.totalProfit >= 0 ? '+' : ''}₹{row.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          Rev: ₹{row.totalRevenue.toFixed(0)}
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                            row.currentStock > 20
                              ? 'bg-slate-100 text-slate-800'
                              : row.currentStock > 0
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}
                        >
                          {row.currentStock}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600">
            Total formulations evaluated: <strong>{displayedRows.length}</strong> | Total Units Dispensed:{' '}
            <strong>{summaryKPIs.totalUnits}</strong>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500 mr-1.5">Net Profit:</span>
              <strong className="font-mono text-emerald-800 text-sm">
                ₹{summaryKPIs.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 mr-1.5">Average Margin:</span>
              <strong className="font-mono text-teal-800 text-sm">
                {summaryKPIs.overallMargin}%
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
