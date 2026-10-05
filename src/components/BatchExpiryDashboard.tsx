import React, { useState, useMemo } from 'react';
import {
  Calendar,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Download,
  Printer,
  Boxes,
  Truck,
  RotateCcw,
  ShoppingCart,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { Medicine, Batch } from '../types';
import { StorageService } from '../services/storage';
import { getDaysUntilExpiry } from '../utils/dateUtils';
import { exportReportToExcel, exportReportToPDF, printReportWindow } from '../utils/exportUtils';

export interface ExpiringBatchItem extends Batch {
  medicineId: string;
  medicineName: string;
  genericName: string;
  form: string;
  manufacturer: string;
  rackLocation: string;
  daysLeft: number;
  urgency: 'critical' | 'warning' | 'watchlist' | 'expired';
}

interface BatchExpiryDashboardProps {
  medicines?: Medicine[];
  onSelectForPOS?: (medicine: Medicine, batch: Batch) => void;
  onNavigateToPurchaseReturn?: (medicine: Medicine, batch: Batch) => void;
  onRefreshData?: () => void;
}

export const BatchExpiryDashboard: React.FC<BatchExpiryDashboardProps> = ({
  medicines: propMedicines,
  onSelectForPOS,
  onNavigateToPurchaseReturn,
  onRefreshData
}) => {
  const [medicines] = useState<Medicine[]>(() => propMedicines || StorageService.getMedicines());
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'critical' | 'warning' | 'watchlist' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const pharmacyProfile = useMemo(() => StorageService.getPharmacyProfile(), []);

  // Compute all batches expiring within 90 days across the inventory
  const expiringBatches: ExpiringBatchItem[] = useMemo(() => {
    const list: ExpiringBatchItem[] = [];

    (medicines || []).forEach(med => {
      (med.batches || []).forEach(b => {
        const days = getDaysUntilExpiry(b.expiryDate);
        if (days <= 90) {
          let urgency: ExpiringBatchItem['urgency'] = 'watchlist';
          if (days <= 0) {
            urgency = 'expired';
          } else if (days <= 30) {
            urgency = 'critical';
          } else if (days <= 60) {
            urgency = 'warning';
          } else {
            urgency = 'watchlist';
          }

          list.push({
            ...b,
            medicineId: med.id,
            medicineName: med.name,
            genericName: med.genericName,
            form: med.form,
            manufacturer: med.manufacturer,
            rackLocation: med.rackLocation || b.location || 'Rack A-01',
            daysLeft: days,
            urgency
          });
        }
      });
    });

    // Sort by earliest expiry first
    return list.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [medicines]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalBatches = expiringBatches.length;
    const criticalCount = expiringBatches.filter(b => b.urgency === 'critical').length;
    const warningCount = expiringBatches.filter(b => b.urgency === 'warning').length;
    const watchlistCount = expiringBatches.filter(b => b.urgency === 'watchlist').length;
    const expiredCount = expiringBatches.filter(b => b.urgency === 'expired').length;

    const totalUnits = expiringBatches.reduce((acc, b) => acc + (b.stock > 0 ? b.stock : 0), 0);
    const totalValuationRisk = expiringBatches.reduce((acc, b) => acc + (b.stock > 0 ? b.stock * b.costPrice : 0), 0);
    const totalRetailRisk = expiringBatches.reduce((acc, b) => acc + (b.stock > 0 ? b.stock * b.sellingPrice : 0), 0);

    return {
      totalBatches,
      criticalCount,
      warningCount,
      watchlistCount,
      expiredCount,
      totalUnits,
      totalValuationRisk,
      totalRetailRisk
    };
  }, [expiringBatches]);

  // Unique locations for filter
  const locations = useMemo(() => {
    const set = new Set<string>();
    expiringBatches.forEach(b => {
      if (b.rackLocation) set.add(b.rackLocation);
    });
    return ['All', ...Array.from(set).sort()];
  }, [expiringBatches]);

  // Filtered List
  const filteredList = useMemo(() => {
    return expiringBatches.filter(item => {
      const matchUrgency =
        urgencyFilter === 'all'
          ? true
          : urgencyFilter === item.urgency;

      const matchLocation =
        selectedLocation === 'All'
          ? true
          : item.rackLocation === selectedLocation;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.medicineName.toLowerCase().includes(q) ||
        item.genericName.toLowerCase().includes(q) ||
        item.batchNumber.toLowerCase().includes(q) ||
        item.manufacturer.toLowerCase().includes(q) ||
        item.rackLocation.toLowerCase().includes(q);

      return matchUrgency && matchLocation && matchSearch;
    });
  }, [expiringBatches, urgencyFilter, selectedLocation, searchQuery]);

  // Export handlers
  const handleExportExcel = () => {
    const headers = [
      'Medicine Name',
      'Molecule / Generic',
      'Batch No',
      'Expiry Date',
      'Days Left',
      'Urgency Level',
      'Stock Units',
      'Purchase Rate (Rs)',
      'MRP (Rs)',
      'Value at Risk (Rs)',
      'Rack Location',
      'Manufacturer'
    ];
    const rows = filteredList.map(b => [
      b.medicineName,
      b.genericName,
      b.batchNumber,
      b.expiryDate,
      b.daysLeft <= 0 ? 'EXPIRED' : `${b.daysLeft} days`,
      b.urgency.toUpperCase(),
      b.stock,
      b.costPrice.toFixed(2),
      b.sellingPrice.toFixed(2),
      (b.stock * b.costPrice).toFixed(2),
      b.rackLocation,
      b.manufacturer
    ]);

    exportReportToExcel(
      `Batch_Expiry_Dashboard_90D_${new Date().toISOString().split('T')[0]}`,
      'Expiring Batches (90d)',
      headers,
      rows,
      {
        title: 'Batch Expiry Dashboard - 90 Days Loss Prevention Register',
        subtitle: `Urgency Filter: ${urgencyFilter.toUpperCase()} | Location: ${selectedLocation}`
      }
    );
  };

  const handleExportPDF = () => {
    const headers = ['Medicine', 'Form', 'Batch', 'Expiry', 'Days Left', 'Stock', 'Pur Rate (₹)', 'MRP (₹)', 'Loss Risk (₹)', 'Rack'];
    const rows = filteredList.map(b => [
      b.medicineName,
      b.form,
      b.batchNumber,
      b.expiryDate,
      b.daysLeft <= 0 ? 'EXPIRED' : `${b.daysLeft}d (${b.urgency})`,
      b.stock,
      b.costPrice.toFixed(2),
      b.sellingPrice.toFixed(2),
      (b.stock * b.costPrice).toFixed(2),
      b.rackLocation
    ]);

    exportReportToPDF({
      title: '90-Day Batch Expiry Risk & Return Audit Report',
      subtitle: `Filter: ${urgencyFilter.toUpperCase()} | Total Value at Risk: ₹${metrics.totalValuationRisk.toFixed(2)}`,
      filename: `Batch_Expiry_Dashboard_${new Date().toISOString().split('T')[0]}`,
      headers,
      rows,
      summaryCards: [
        { label: 'Batches <=90d', value: metrics.totalBatches },
        { label: 'Critical <=30d', value: metrics.criticalCount },
        { label: 'Warning 31-60d', value: metrics.warningCount },
        { label: 'Watchlist 61-90d', value: metrics.watchlistCount },
        { label: 'Total Value at Risk', value: `₹${metrics.totalValuationRisk.toFixed(2)}` }
      ]
    });
  };

  const handlePrint = () => {
    const headers = ['Medicine & Generic', 'Batch', 'Expiry', 'Days Left', 'Urgency', 'Stock', 'Purchase Rate', 'MRP', 'Value at Risk', 'Location'];
    const rows = filteredList.map(b => [
      `${b.medicineName} (${b.genericName})`,
      b.batchNumber,
      b.expiryDate,
      b.daysLeft <= 0 ? 'EXPIRED' : `${b.daysLeft} days`,
      b.urgency.toUpperCase(),
      b.stock,
      `₹${b.costPrice.toFixed(2)}`,
      `₹${b.sellingPrice.toFixed(2)}`,
      `₹${(b.stock * b.costPrice).toFixed(2)}`,
      b.rackLocation
    ]);

    printReportWindow({
      title: 'Batch Expiry Dashboard - 90 Days Loss Prevention Register',
      subtitle: `City Medical, Melur • Generated: ${new Date().toLocaleDateString()}`,
      headers,
      rows,
      summaryCards: [
        { label: 'Batches <=90d', value: metrics.totalBatches },
        { label: 'Critical <=30d', value: metrics.criticalCount },
        { label: 'Warning 31-60d', value: metrics.warningCount },
        { label: 'Loss Risk', value: `₹${metrics.totalValuationRisk.toFixed(2)}` }
      ]
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
          <Clock className="w-56 h-56" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/30 text-xs font-bold mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>FEFO Expiry Prevention Audit (Next 90 Days)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Batch Expiry Dashboard</span>
            </h1>
            <p className="text-rose-100 text-xs sm:text-sm mt-1 max-w-2xl">
              Real-time monitoring of all stock batches expiring within 30, 60, and 90 days. Return overstocked batches to distributors, adjust racks, or initiate POS clearance.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-xs transition-colors cursor-pointer"
              title="Download Excel Spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel Export</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-xs transition-colors cursor-pointer"
              title="Download Formatted PDF Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Report</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white text-rose-950 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title="Print Physical Audit Sheet"
            >
              <Printer className="w-3.5 h-3.5 text-rose-700" />
              <span>Print Audit Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Color-Coded Urgency Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Critical <= 30 Days */}
        <div
          onClick={() => setUrgencyFilter(urgencyFilter === 'critical' ? 'all' : 'critical')}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
            urgencyFilter === 'critical'
              ? 'bg-rose-50 border-rose-500 shadow-md ring-2 ring-rose-300'
              : 'bg-white border-rose-200 hover:border-rose-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span>Urgent: &le; 30 Days</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-mono font-bold">
              Immediate Action
            </span>
          </div>
          <div className="text-3xl font-black text-rose-900 mt-2 font-mono">
            {metrics.criticalCount} <span className="text-xs font-bold text-rose-700">Batches</span>
          </div>
          <div className="text-xs text-rose-800 font-medium mt-1 flex items-center justify-between">
            <span>High Risk of Total Loss</span>
            <span className="font-bold">Return to Supplier &rarr;</span>
          </div>
        </div>

        {/* Card 2: Warning 31 - 60 Days */}
        <div
          onClick={() => setUrgencyFilter(urgencyFilter === 'warning' ? 'all' : 'warning')}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
            urgencyFilter === 'warning'
              ? 'bg-amber-50 border-amber-500 shadow-md ring-2 ring-amber-300'
              : 'bg-white border-amber-200 hover:border-amber-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Warning: 31 - 60 Days</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
              Expiring Soon
            </span>
          </div>
          <div className="text-3xl font-black text-amber-900 mt-2 font-mono">
            {metrics.warningCount} <span className="text-xs font-bold text-amber-700">Batches</span>
          </div>
          <div className="text-xs text-amber-800 font-medium mt-1 flex items-center justify-between">
            <span>Clearance or Exchange</span>
            <span className="font-bold">Prioritize FEFO &rarr;</span>
          </div>
        </div>

        {/* Card 3: Watchlist 61 - 90 Days */}
        <div
          onClick={() => setUrgencyFilter(urgencyFilter === 'watchlist' ? 'all' : 'watchlist')}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
            urgencyFilter === 'watchlist'
              ? 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-300'
              : 'bg-white border-blue-200 hover:border-blue-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Watchlist: 61 - 90 Days</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
              Under Monitor
            </span>
          </div>
          <div className="text-3xl font-black text-blue-900 mt-2 font-mono">
            {metrics.watchlistCount} <span className="text-xs font-bold text-blue-700">Batches</span>
          </div>
          <div className="text-xs text-blue-800 font-medium mt-1 flex items-center justify-between">
            <span>Monitor Dispensing Velocity</span>
            <span className="font-bold">Watch &rarr;</span>
          </div>
        </div>

        {/* Card 4: Financial Risk Summary */}
        <div className="p-4 rounded-2xl border-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Total Capital at Risk (Cost)
            </span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2 font-mono">
            ₹{metrics.totalValuationRisk.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-slate-300 font-medium mt-1 flex items-center justify-between">
            <span>{metrics.totalUnits} Units in {metrics.totalBatches} Batches</span>
            <span className="text-amber-300 font-bold">MRP: ₹{metrics.totalRetailRisk.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Urgency Pill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setUrgencyFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              urgencyFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All 90-Day Batches ({expiringBatches.length})
          </button>

          <button
            type="button"
            onClick={() => setUrgencyFilter('critical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              urgencyFilter === 'critical'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>&le; 30 Days ({metrics.criticalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setUrgencyFilter('warning')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              urgencyFilter === 'warning'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>31 - 60 Days ({metrics.warningCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setUrgencyFilter('watchlist')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              urgencyFilter === 'watchlist'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>61 - 90 Days ({metrics.watchlistCount})</span>
          </button>

          {metrics.expiredCount > 0 && (
            <button
              type="button"
              onClick={() => setUrgencyFilter('expired')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                urgencyFilter === 'expired'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-red-50 hover:bg-red-100 text-red-900 border border-red-300'
              }`}
            >
              <span>Expired ({metrics.expiredCount})</span>
            </button>
          )}
        </div>

        {/* Search & Location Filter */}
        <div className="flex items-center gap-2 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search medicine, batch, rack..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden shrink-0"
            title="Filter by Rack / Shelf"
          >
            {locations.map(loc => (
              <option key={loc} value={loc}>
                {loc === 'All' ? 'All Racks' : loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-rose-600" />
            <span>Expiring Batches Queue ({filteredList.length} items)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-normal">
            Sorted by earliest expiry date (FEFO)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase text-[10px] tracking-wider font-extrabold">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 min-w-[200px]">Medicine Name & Salt</th>
                <th className="py-3 px-3 min-w-[100px]">Batch No</th>
                <th className="py-3 px-3 min-w-[100px]">Rack Location</th>
                <th className="py-3 px-3 min-w-[120px]">Expiry & Countdown</th>
                <th className="py-3 px-3 text-center min-w-[80px]">Stock</th>
                <th className="py-3 px-3 text-right min-w-[85px]">Purchase Rate</th>
                <th className="py-3 px-3 text-right min-w-[85px]">MRP</th>
                <th className="py-3 px-3 text-right min-w-[100px]">Loss Risk (₹)</th>
                <th className="py-3 px-3 text-center min-w-[160px]">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 space-y-2">
                    <Clock className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="font-bold text-slate-700 text-sm">No batches match the selected criteria</p>
                    <p className="text-xs text-slate-500">Your stock is safely within shelf-life thresholds.</p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const lossRisk = item.stock * item.costPrice;
                  const isExpired = item.daysLeft <= 0;
                  const isCritical = !isExpired && item.daysLeft <= 30;
                  const isWarning = item.daysLeft > 30 && item.daysLeft <= 60;

                  return (
                    <tr
                      key={`${item.medicineId}-${item.batchNumber}-${idx}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isExpired
                          ? 'bg-red-50/30'
                          : isCritical
                          ? 'bg-rose-50/30'
                          : isWarning
                          ? 'bg-amber-50/20'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500 text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Medicine details */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{item.medicineName}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[220px]">
                          {item.genericName}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.manufacturer} • {item.form}
                        </div>
                      </td>

                      {/* Batch */}
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {item.batchNumber}
                        </span>
                      </td>

                      {/* Rack Location */}
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-xs font-semibold text-slate-700">
                          {item.rackLocation}
                        </span>
                      </td>

                      {/* Expiry & Countdown pill */}
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {item.expiryDate}
                        </div>
                        <div className="mt-1">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                              <span>EXPIRED</span>
                            </span>
                          ) : isCritical ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                              <span>{item.daysLeft} Days Left</span>
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200">
                              <span>{item.daysLeft} Days Left</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                              <span>{item.daysLeft} Days Left</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded-lg ${
                            item.stock <= 10
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {item.stock}
                        </span>
                      </td>

                      {/* Purchase Rate */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        ₹{item.costPrice.toFixed(2)}
                      </td>

                      {/* MRP */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{item.sellingPrice.toFixed(2)}
                      </td>

                      {/* Loss Risk */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="font-mono font-extrabold text-rose-700 text-xs">
                          ₹{lossRisk.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Retail: ₹{(item.stock * item.sellingPrice).toFixed(2)}
                        </div>
                      </td>

                      {/* Quick Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {onSelectForPOS && (
                            <button
                              type="button"
                              onClick={() => {
                                const fullMed = medicines.find(m => m.id === item.medicineId);
                                if (fullMed) onSelectForPOS(fullMed, item);
                              }}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                              title="Dispense in POS (FEFO clearance discount)"
                            >
                              <ShoppingCart className="w-3 h-3 text-teal-600" />
                              <span>Clear in POS</span>
                            </button>
                          )}

                          {onNavigateToPurchaseReturn && (
                            <button
                              type="button"
                              onClick={() => {
                                const fullMed = medicines.find(m => m.id === item.medicineId);
                                if (fullMed) onNavigateToPurchaseReturn(fullMed, item);
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                              title="Create Supplier Return (Debit Note) for Credit Refund"
                            >
                              <RotateCcw className="w-3 h-3 text-rose-600" />
                              <span>Debit Note</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
