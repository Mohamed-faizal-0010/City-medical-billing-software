import React, { useState, useMemo, useEffect } from 'react';
import {
  Stethoscope,
  Calendar,
  Filter,
  Search,
  Printer,
  Download,
  FileSpreadsheet,
  DollarSign,
  Receipt,
  Percent,
  CheckCircle2,
  Eye,
  ChevronDown,
  ChevronUp,
  Award,
  TrendingUp,
  Building2,
  UserCheck
} from 'lucide-react';
import { SaleTransaction, Doctor } from '../types';
import { StorageService } from '../services/storage';
import {
  exportReportToExcel,
  exportReportToPDF,
  exportReportToCSV,
  printReportWindow
} from '../utils/exportUtils';
import { formatDateDMY } from '../utils/dateUtils';

export interface DoctorCommissionsReportViewProps {
  transactions?: SaleTransaction[];
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  onViewInvoice?: (tx: SaleTransaction) => void;
}

export interface DoctorCommissionRow {
  doctorKey: string;
  doctorId?: string;
  doctorName: string;
  specialization: string;
  clinicName: string;
  registrationNumber: string;
  phone: string;
  prescriptionCount: number;
  totalItemsDispensed: number;
  grossRxSales: number;
  totalDiscounts: number;
  netRxRevenue: number;
  estimatedCogs: number;
  grossProfit: number;
  commissionRatePercent: number;
  flatFeePerRx: number;
  totalCommissionAmount: number;
  isSettled: boolean;
  matchingTransactions: SaleTransaction[];
}

type CommissionBasis = 'net_sales' | 'gross_margin' | 'hybrid';

export const DoctorCommissionsReportView: React.FC<DoctorCommissionsReportViewProps> = ({
  transactions: propTransactions,
  dateRange: propDateRange,
  startDate: propStartDate,
  endDate: propEndDate,
  onViewInvoice
}) => {
  const [allTransactions] = useState<SaleTransaction[]>(() => StorageService.getTransactions());
  const [doctors, setDoctors] = useState<Doctor[]>(() => StorageService.getDoctors());

  // Local Date Filter State (synced with parent ReportsView when changed)
  const [localDateRange, setLocalDateRange] = useState<string>(propDateRange || 'all');
  const [localStartDate, setLocalStartDate] = useState<string>(() => {
    if (propStartDate) return propStartDate;
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [localEndDate, setLocalEndDate] = useState<string>(() => {
    return propEndDate || new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    if (propDateRange) setLocalDateRange(propDateRange);
  }, [propDateRange]);

  useEffect(() => {
    if (propStartDate) setLocalStartDate(propStartDate);
  }, [propStartDate]);

  useEffect(() => {
    if (propEndDate) setLocalEndDate(propEndDate);
  }, [propEndDate]);

  // Commission Configuration State
  const [defaultCommissionRate, setDefaultCommissionRate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('cityrx_default_doctor_commission_pct');
      if (saved !== null) return Number(saved) || 10;
    } catch {}
    return 10;
  });
  const [flatFeePerRx, setFlatFeePerRx] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('cityrx_doctor_flat_fee_per_rx');
      if (saved !== null) return Number(saved) || 0;
    } catch {}
    return 0;
  });
  const [commissionBasis, setCommissionBasis] = useState<CommissionBasis>('net_sales');
  const [includeOtcSelf, setIncludeOtcSelf] = useState<boolean>(false);
  const [includeAllRegisteredDoctors, setIncludeAllRegisteredDoctors] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedDoctorKey, setExpandedDoctorKey] = useState<string | null>(null);

  // Per-doctor custom commission rates & settled status
  const [customRatesMap, setCustomRatesMap] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem('cityrx_doctor_commission_rates_v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });

  const [settledDoctorsMap, setSettledDoctorsMap] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('cityrx_doctor_commission_settled_v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });

  const handleUpdateDoctorRate = (doctorKey: string, doctorId: string | undefined, newRate: number) => {
    const clamped = Math.max(0, Math.min(100, Number(newRate) || 0));
    const updatedMap = { ...customRatesMap, [doctorKey]: clamped };
    setCustomRatesMap(updatedMap);
    try {
      localStorage.setItem('cityrx_doctor_commission_rates_v1', JSON.stringify(updatedMap));
    } catch {}

    if (doctorId) {
      const updatedDoctors = doctors.map(d =>
        d.id === doctorId ? { ...d, commissionPercent: clamped } : d
      );
      setDoctors(updatedDoctors);
      StorageService.saveDoctors(updatedDoctors);
    }
  };

  const handleToggleSettled = (doctorKey: string) => {
    const updated = { ...settledDoctorsMap, [doctorKey]: !settledDoctorsMap[doctorKey] };
    setSettledDoctorsMap(updated);
    try {
      localStorage.setItem('cityrx_doctor_commission_settled_v1', JSON.stringify(updated));
    } catch {}
  };

  // Filter transactions by selected date range
  const dateFilteredTransactions = useMemo(() => {
    const sourceList = propTransactions && localDateRange === propDateRange ? allTransactions : allTransactions;
    return sourceList.filter(tx => {
      if (!tx.date) return true;
      if (localDateRange === 'all') return true;
      if (localDateRange === 'custom') {
        const dStr = tx.date.slice(0, 10);
        if (localStartDate && dStr < localStartDate) return false;
        if (localEndDate && dStr > localEndDate) return false;
        return true;
      }
      const d = new Date(tx.date);
      const now = new Date();
      if (localDateRange === 'today') {
        return d.toDateString() === now.toDateString();
      }
      if (localDateRange === 'yesterday') {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        return d.toDateString() === yest.toDateString();
      }
      if (localDateRange === '7d') {
        const past = new Date();
        past.setDate(past.getDate() - 7);
        return d >= past;
      }
      if (localDateRange === '30d') {
        const past = new Date();
        past.setDate(past.getDate() - 30);
        return d >= past;
      }
      if (localDateRange === 'this_month') {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
      if (localDateRange === 'last_month') {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
      }
      if (localDateRange === 'year') {
        const curYear = now.getFullYear();
        const finYearStart = new Date(curYear, 3, 1);
        return d >= finYearStart;
      }
      return true;
    });
  }, [allTransactions, propTransactions, localDateRange, propDateRange, localStartDate, localEndDate]);

  // Human-readable period label
  const periodLabel = useMemo(() => {
    if (localDateRange === 'today') return 'Today';
    if (localDateRange === 'yesterday') return 'Yesterday';
    if (localDateRange === '7d') return 'Last 7 Days';
    if (localDateRange === '30d') return 'Last 30 Days';
    if (localDateRange === 'this_month') return 'This Month';
    if (localDateRange === 'last_month') return 'Last Month';
    if (localDateRange === 'year') return 'FY 2026-27';
    if (localDateRange === 'custom') return `${formatDateDMY(localStartDate)} to ${formatDateDMY(localEndDate)}`;
    return 'All-Time Records';
  }, [localDateRange, localStartDate, localEndDate]);

  // Aggregate Doctor Commission Rows from POS Prescriptions
  const doctorCommissionRows = useMemo<DoctorCommissionRow[]>(() => {
    const map = new Map<
      string,
      {
        doctorId?: string;
        doctorName: string;
        specialization: string;
        clinicName: string;
        registrationNumber: string;
        phone: string;
        matchingTransactions: SaleTransaction[];
      }
    >();

    // Helper to normalize doctor name for matching
    const normalizeDocName = (name: string) =>
      name
        .toLowerCase()
        .replace(/^dr\.?\s*/i, '')
        .replace(/[^a-z0-9]/g, '');

    // Seed registered doctors if includeAllRegisteredDoctors is enabled
    if (includeAllRegisteredDoctors) {
      doctors.forEach(doc => {
        const key = doc.id || `doc-${normalizeDocName(doc.name)}`;
        map.set(key, {
          doctorId: doc.id,
          doctorName: doc.name,
          specialization: doc.specialization || 'General Physician',
          clinicName: doc.clinicName || 'City Medical Partner Clinic',
          registrationNumber: doc.registrationNumber || 'TNMC-REG',
          phone: doc.phone || '-',
          matchingTransactions: []
        });
      });
    }

    // Group POS transactions by prescribing doctor
    dateFilteredTransactions.forEach(tx => {
      const rawDocName = (tx.doctorName || '').trim();
      const isOtcOrSelf =
        !rawDocName ||
        /^(self|otc|walk-?in|general|none|-)$/i.test(rawDocName) ||
        rawDocName.toLowerCase().includes('self / otc');

      if (isOtcOrSelf && !includeOtcSelf) {
        return;
      }

      // Match against registered doctors list by ID or normalized name
      const matchedDoc =
        (tx.doctorId && doctors.find(d => d.id === tx.doctorId)) ||
        (rawDocName
          ? doctors.find(
              d =>
                normalizeDocName(d.name) === normalizeDocName(rawDocName) ||
                d.name.toLowerCase().trim() === rawDocName.toLowerCase()
            )
          : undefined);

      const doctorKey = matchedDoc
        ? matchedDoc.id
        : isOtcOrSelf
        ? 'otc-self-walkin'
        : `custom-${normalizeDocName(rawDocName)}`;

      if (!map.has(doctorKey)) {
        map.set(doctorKey, {
          doctorId: matchedDoc?.id || tx.doctorId,
          doctorName: matchedDoc?.name || (isOtcOrSelf ? 'Self / OTC Counter Prescriptions' : rawDocName),
          specialization: matchedDoc?.specialization || (isOtcOrSelf ? 'OTC / Pharmacist Guided' : 'Visiting / External Prescriber'),
          clinicName: matchedDoc?.clinicName || (isOtcOrSelf ? 'In-Store Counter' : 'External Referral Clinic'),
          registrationNumber: matchedDoc?.registrationNumber || tx.doctorRegNo || (isOtcOrSelf ? 'OTC' : 'EXT-RX'),
          phone: matchedDoc?.phone || '-',
          matchingTransactions: []
        });
      }

      map.get(doctorKey)!.matchingTransactions.push(tx);
    });

    const rows: DoctorCommissionRow[] = [];

    map.forEach((entry, key) => {
      // If includeAllRegisteredDoctors is false, skip doctors with 0 prescriptions in range
      if (!includeAllRegisteredDoctors && entry.matchingTransactions.length === 0) {
        return;
      }

      const prescriptionCount = entry.matchingTransactions.length;
      const totalItemsDispensed = entry.matchingTransactions.reduce(
        (sum, tx) => sum + (tx.items || []).reduce((s, it) => s + (it.quantity || 0), 0),
        0
      );
      const grossRxSales = entry.matchingTransactions.reduce(
        (sum, tx) => sum + (tx.subtotal ?? tx.grandTotal ?? 0),
        0
      );
      const totalDiscounts = entry.matchingTransactions.reduce(
        (sum, tx) => sum + (tx.totalDiscount ?? 0),
        0
      );
      const netRxRevenue = entry.matchingTransactions.reduce(
        (sum, tx) => sum + (tx.grandTotal ?? 0),
        0
      );
      const estimatedCogs = entry.matchingTransactions.reduce(
        (sum, tx) => sum + (tx.costOfGoodsSold || (tx.grandTotal ?? 0) * 0.65),
        0
      );
      const grossProfit = Math.max(0, netRxRevenue - estimatedCogs);

      const docObj = entry.doctorId ? doctors.find(d => d.id === entry.doctorId) : undefined;
      const commissionRatePercent =
        customRatesMap[key] !== undefined
          ? customRatesMap[key]
          : docObj?.commissionPercent !== undefined
          ? docObj.commissionPercent
          : key === 'otc-self-walkin'
          ? 0
          : defaultCommissionRate;

      let totalCommissionAmount = 0;
      if (prescriptionCount > 0) {
        if (commissionBasis === 'net_sales') {
          totalCommissionAmount = (netRxRevenue * commissionRatePercent) / 100;
        } else if (commissionBasis === 'gross_margin') {
          totalCommissionAmount = (grossProfit * commissionRatePercent) / 100;
        } else {
          totalCommissionAmount =
            prescriptionCount * flatFeePerRx + (netRxRevenue * commissionRatePercent) / 100;
        }
      }

      rows.push({
        doctorKey: key,
        doctorId: entry.doctorId,
        doctorName: entry.doctorName,
        specialization: entry.specialization,
        clinicName: entry.clinicName,
        registrationNumber: entry.registrationNumber,
        phone: entry.phone,
        prescriptionCount,
        totalItemsDispensed,
        grossRxSales,
        totalDiscounts,
        netRxRevenue,
        estimatedCogs,
        grossProfit,
        commissionRatePercent,
        flatFeePerRx,
        totalCommissionAmount,
        isSettled: Boolean(settledDoctorsMap[key]),
        matchingTransactions: entry.matchingTransactions
      });
    });

    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? rows.filter(
          r =>
            r.doctorName.toLowerCase().includes(q) ||
            r.specialization.toLowerCase().includes(q) ||
            r.clinicName.toLowerCase().includes(q) ||
            r.registrationNumber.toLowerCase().includes(q)
        )
      : rows;

    // Sort by highest commission amount first, then by prescription count
    return filtered.sort((a, b) => {
      if (b.totalCommissionAmount !== a.totalCommissionAmount) {
        return b.totalCommissionAmount - a.totalCommissionAmount;
      }
      return b.prescriptionCount - a.prescriptionCount;
    });
  }, [
    doctors,
    dateFilteredTransactions,
    includeOtcSelf,
    includeAllRegisteredDoctors,
    customRatesMap,
    defaultCommissionRate,
    commissionBasis,
    flatFeePerRx,
    settledDoctorsMap,
    searchQuery
  ]);

  // Summary Totals
  const totals = useMemo(() => {
    const activeDoctorsWithSales = doctorCommissionRows.filter(r => r.prescriptionCount > 0).length;
    const totalPrescriptions = doctorCommissionRows.reduce((s, r) => s + r.prescriptionCount, 0);
    const totalUnits = doctorCommissionRows.reduce((s, r) => s + r.totalItemsDispensed, 0);
    const totalRxRevenue = doctorCommissionRows.reduce((s, r) => s + r.netRxRevenue, 0);
    const totalGrossProfit = doctorCommissionRows.reduce((s, r) => s + r.grossProfit, 0);
    const totalCommissionPayable = doctorCommissionRows.reduce((s, r) => s + r.totalCommissionAmount, 0);
    const settledCommission = doctorCommissionRows
      .filter(r => r.isSettled)
      .reduce((s, r) => s + r.totalCommissionAmount, 0);
    const pendingCommission = Math.max(0, totalCommissionPayable - settledCommission);
    const effectiveRate =
      totalRxRevenue > 0 ? ((totalCommissionPayable / totalRxRevenue) * 100).toFixed(1) : '0.0';

    return {
      activeDoctorsWithSales,
      totalPrescriptions,
      totalUnits,
      totalRxRevenue,
      totalGrossProfit,
      totalCommissionPayable,
      settledCommission,
      pendingCommission,
      effectiveRate
    };
  }, [doctorCommissionRows]);

  // Export & Print Helper
  const getExportData = () => {
    const headers = [
      'Doctor Name',
      'Reg. No.',
      'Specialization',
      'Clinic / Hospital',
      'POS Rx Count',
      'Units Sold',
      'Net POS Rx Sales (₹)',
      'Est. Gross Profit (₹)',
      'Commission Rate (%)',
      'Total Commission (₹)',
      'Payout Status'
    ];
    const rows = doctorCommissionRows.map(r => [
      r.doctorName,
      r.registrationNumber,
      r.specialization,
      r.clinicName,
      r.prescriptionCount,
      r.totalItemsDispensed,
      r.netRxRevenue.toFixed(2),
      r.grossProfit.toFixed(2),
      `${r.commissionRatePercent}%`,
      r.totalCommissionAmount.toFixed(2),
      r.isSettled ? 'Settled' : 'Pending Payout'
    ]);
    const summary = [
      { label: 'Period', value: periodLabel },
      { label: 'POS Prescriptions Sold', value: totals.totalPrescriptions },
      { label: 'Total POS Rx Revenue', value: `₹${totals.totalRxRevenue.toFixed(2)}` },
      { label: 'Total Doctor Commissions', value: `₹${totals.totalCommissionPayable.toFixed(2)}` },
      { label: 'Pending Payout', value: `₹${totals.pendingCommission.toFixed(2)}` }
    ];
    return { headers, rows, summary };
  };

  const handlePrintReport = () => {
    const { headers, rows, summary } = getExportData();
    printReportWindow({
      title: 'Doctor Prescription Commissions Statement (POS Sales)',
      subtitle: `City Medical ERP • Period: ${periodLabel} • Basis: ${
        commissionBasis === 'net_sales'
          ? '% of Net POS Rx Sales'
          : commissionBasis === 'gross_margin'
          ? '% of Rx Gross Profit'
          : 'Flat Fee + % Bonus'
      }`,
      headers,
      rows,
      orientation: 'landscape',
      summaryCards: summary
    });
  };

  const handleExportPDF = () => {
    const { headers, rows, summary } = getExportData();
    exportReportToPDF({
      filename: `CityRx-Doctor-Commissions-${localDateRange}.pdf`,
      title: 'Doctor Prescription Commissions Statement (POS Sales)',
      subtitle: `Period: ${periodLabel} | Generated: ${new Date().toLocaleDateString('en-IN')}`,
      headers,
      rows,
      orientation: 'landscape',
      summaryCards: summary
    });
  };

  const handleExportExcel = () => {
    const { headers, rows, summary } = getExportData();
    exportReportToExcel(
      `CityRx-Doctor-Commissions-${localDateRange}.xlsx`,
      'Doctor Commissions',
      headers,
      rows,
      {
        title: 'Doctor Prescription Commissions Statement (POS Sales)',
        subtitle: `Period: ${periodLabel}`,
        summary
      }
    );
  };

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    exportReportToCSV(`CityRx-Doctor-Commissions-${localDateRange}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Date Range Filter Controls */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 text-white rounded-2xl p-5 shadow-md border border-teal-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/30 mb-1.5">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>POS Prescription Referral &amp; Commission Audit</span>
            </div>
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span>Doctor Commissions Report (POS Prescriptions)</span>
            </h3>
            <p className="text-xs text-teal-100/80 mt-0.5">
              Calculates total doctor commissions based on prescriptions dispensed and sold via the POS, filterable by date range.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintReport}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 border border-white/15 cursor-pointer transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-teal-300" />
              <span>Print Statement</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 cursor-pointer transition-all"
            >
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Dedicated Date Range Filter Bar inside Sub-Tab */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Date Range Filter:</span>
            </span>
            {[
              { id: 'all', label: 'All-Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'custom', label: 'Custom Dates' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setLocalDateRange(p.id)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  localDateRange === p.id
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Start & End Date Inputs */}
          <div className="flex items-center gap-2 bg-slate-950/60 border border-white/15 px-3 py-1.5 rounded-xl">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase text-teal-300">From:</span>
              <input
                type="date"
                value={localStartDate}
                onChange={e => {
                  setLocalStartDate(e.target.value);
                  setLocalDateRange('custom');
                }}
                className="bg-slate-900 text-white border border-slate-700 rounded px-2 py-0.5 text-xs font-mono font-bold"
              />
            </div>
            <span className="text-slate-500">to</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase text-teal-300">To:</span>
              <input
                type="date"
                value={localEndDate}
                onChange={e => {
                  setLocalEndDate(e.target.value);
                  setLocalDateRange('custom');
                }}
                className="bg-slate-900 text-white border border-slate-700 rounded px-2 py-0.5 text-xs font-mono font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Executive KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Prescriptions Sold (POS)
            </span>
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {totals.totalPrescriptions}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {totals.totalUnits} medicine units across {totals.activeDoctorsWithSales} prescribing doctors
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              POS Prescription Revenue
            </span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            ₹{totals.totalRxRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            Est. Rx Gross Profit: ₹{totals.totalGrossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs ring-1 ring-emerald-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Total Doctor Commissions
            </span>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            ₹{totals.totalCommissionPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            Effective Commission Rate: <strong>{totals.effectiveRate}%</strong> of Rx Sales
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Commission Payout
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1 font-mono">
            ₹{totals.pendingCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            Settled: ₹{totals.settledCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Commission Formula & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search doctor, specialization, reg no..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-600">Calculation Basis:</span>
            <select
              value={commissionBasis}
              onChange={e => setCommissionBasis(e.target.value as CommissionBasis)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-800 text-xs focus:outline-hidden"
            >
              <option value="net_sales">% of POS Rx Net Sales</option>
              <option value="gross_margin">% of POS Rx Gross Margin</option>
              <option value="hybrid">Flat Fee / Rx + % of Sales</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Percent className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-[11px] font-bold text-slate-600">Default Rate:</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={defaultCommissionRate}
              onChange={e => {
                const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                setDefaultCommissionRate(v);
                try {
                  localStorage.setItem('cityrx_default_doctor_commission_pct', String(v));
                } catch {}
              }}
              className="w-16 px-2 py-0.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-center"
            />
            <span className="font-bold text-slate-600">%</span>
          </div>

          {commissionBasis === 'hybrid' && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600">Flat / Rx: ₹</span>
              <input
                type="number"
                min={0}
                step={5}
                value={flatFeePerRx}
                onChange={e => {
                  const v = Math.max(0, Number(e.target.value) || 0);
                  setFlatFeePerRx(v);
                  try {
                    localStorage.setItem('cityrx_doctor_flat_fee_per_rx', String(v));
                  } catch {}
                }}
                className="w-16 px-2 py-0.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-center"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 font-semibold">
            <input
              type="checkbox"
              checked={includeAllRegisteredDoctors}
              onChange={e => setIncludeAllRegisteredDoctors(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Show All Panel Doctors</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 font-semibold">
            <input
              type="checkbox"
              checked={includeOtcSelf}
              onChange={e => setIncludeOtcSelf(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Include Self / OTC Bills</span>
          </label>
        </div>
      </div>

      {/* Doctor Commissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-teal-600" />
            <h4 className="font-black text-slate-900 text-sm">
              Doctor-Wise Prescription Sales &amp; Commission Ledger ({periodLabel})
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            Click any doctor row to inspect individual POS prescriptions sold in this period
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Doctor &amp; Registration</th>
                <th className="py-3 px-3">Clinic / Specialization</th>
                <th className="py-3 px-3 text-center">POS Rx Sold</th>
                <th className="py-3 px-3 text-center">Units Dispensed</th>
                <th className="py-3 px-3 text-right">Net POS Rx Sales (₹)</th>
                <th className="py-3 px-3 text-right">Est. Gross Profit (₹)</th>
                <th className="py-3 px-3 text-center">Commission %</th>
                <th className="py-3 px-3 text-right">Total Commission (₹)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctorCommissionRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    No doctor prescription records found for the selected date range ({periodLabel}).
                  </td>
                </tr>
              ) : (
                doctorCommissionRows.map(row => {
                  const isExpanded = expandedDoctorKey === row.doctorKey;
                  return (
                    <React.Fragment key={row.doctorKey}>
                      <tr className="hover:bg-teal-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>{row.doctorName}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            Reg: {row.registrationNumber} {row.phone !== '-' ? `• Ph: ${row.phone}` : ''}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800">{row.specialization}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{row.clinicName}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full font-mono font-black text-xs ${
                              row.prescriptionCount > 0
                                ? 'bg-teal-100 text-teal-900'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {row.prescriptionCount} Rx
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                          {row.totalItemsDispensed}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{row.netRxRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">
                          ₹{row.grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-0.5">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={row.commissionRatePercent}
                              onChange={e =>
                                handleUpdateDoctorRate(
                                  row.doctorKey,
                                  row.doctorId,
                                   parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-12 text-center font-mono font-black text-xs text-teal-900 bg-transparent focus:outline-hidden"
                              title="Edit commission percentage for this doctor"
                            />
                            <span className="text-[10px] font-bold text-slate-500">%</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <span className="font-mono font-black text-sm text-emerald-700">
                            ₹{row.totalCommissionAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSettled(row.doctorKey)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
                              row.isSettled
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                            }`}
                            title="Click to toggle commission payout status"
                          >
                            {row.isSettled ? '✓ Settled' : 'Pending'}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedDoctorKey(isExpanded ? null : row.doctorKey)
                            }
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>{isExpanded ? 'Hide Rx' : `View Rx (${row.prescriptionCount})`}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded POS Prescriptions Breakdown for this Doctor */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90">
                          <td colSpan={10} className="p-4 border-b border-slate-200">
                            <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-black text-slate-800 text-xs">
                                  POS Prescriptions Dispensed under {row.doctorName} ({row.matchingTransactions.length} Bills)
                                </span>
                                <span className="text-[11px] text-emerald-700 font-mono font-bold">
                                  Commission Rate: {row.commissionRatePercent}% • Total Commission: ₹{row.totalCommissionAmount.toFixed(2)}
                                </span>
                              </div>

                              {row.matchingTransactions.length === 0 ? (
                                <p className="text-xs text-slate-400 py-3 text-center">
                                  No POS prescription sales recorded for {row.doctorName} in this date range ({periodLabel}).
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-[11px]">
                                    <thead>
                                      <tr className="text-slate-500 border-b border-slate-200 uppercase text-[9.5px] font-bold">
                                        <th className="py-1.5 px-2">Invoice #</th>
                                        <th className="py-1.5 px-2">Date</th>
                                        <th className="py-1.5 px-2">Patient</th>
                                        <th className="py-1.5 px-2">Dispensed Medicines</th>
                                        <th className="py-1.5 px-2 text-right">Bill Amount (₹)</th>
                                        <th className="py-1.5 px-2 text-right">Doctor Commission (₹)</th>
                                        {onViewInvoice && <th className="py-1.5 px-2 text-right">Bill</th>}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {row.matchingTransactions.map(tx => {
                                        const txProfit = Math.max(
                                          0,
                                          (tx.grandTotal ?? 0) -
                                            (tx.costOfGoodsSold || (tx.grandTotal ?? 0) * 0.65)
                                        );
                                        const txComm =
                                          commissionBasis === 'net_sales'
                                            ? ((tx.grandTotal ?? 0) * row.commissionRatePercent) / 100
                                            : commissionBasis === 'gross_margin'
                                            ? (txProfit * row.commissionRatePercent) / 100
                                            : flatFeePerRx +
                                              ((tx.grandTotal ?? 0) * row.commissionRatePercent) / 100;

                                        return (
                                          <tr key={tx.id} className="hover:bg-slate-50">
                                            <td className="py-1.5 px-2 font-mono font-bold text-teal-800">
                                              #{tx.id}
                                            </td>
                                            <td className="py-1.5 px-2 font-mono text-slate-600">
                                              {formatDateDMY(tx.date)}
                                            </td>
                                            <td className="py-1.5 px-2 font-semibold text-slate-800">
                                              {tx.patientName}
                                            </td>
                                            <td className="py-1.5 px-2 text-slate-600 max-w-md truncate">
                                              {(tx.items || [])
                                                .map(it => `${it.medicineName} (${it.quantity})`)
                                                .join(', ')}
                                            </td>
                                            <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                                              ₹{(tx.grandTotal ?? 0).toFixed(2)}
                                            </td>
                                            <td className="py-1.5 px-2 text-right font-mono font-bold text-emerald-700">
                                              ₹{txComm.toFixed(2)}
                                            </td>
                                            {onViewInvoice && (
                                              <td className="py-1.5 px-2 text-right">
                                                <button
                                                  type="button"
                                                  onClick={() => onViewInvoice(tx)}
                                                  className="px-2 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded font-bold inline-flex items-center gap-1 cursor-pointer"
                                                >
                                                  <Eye className="w-3 h-3" />
                                                  <span>Bill</span>
                                                </button>
                                              </td>
                                            )}
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
            {doctorCommissionRows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white font-black text-xs">
                  <td colSpan={2} className="py-3 px-4 uppercase tracking-wider">
                    Total Doctor Commissions ({doctorCommissionRows.length} Doctors)
                  </td>
                  <td className="py-3 px-3 text-center font-mono">{totals.totalPrescriptions} Rx</td>
                  <td className="py-3 px-3 text-center font-mono">{totals.totalUnits}</td>
                  <td className="py-3 px-3 text-right font-mono">
                    ₹{totals.totalRxRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-300">
                    ₹{totals.totalGrossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-teal-300">
                    Avg {totals.effectiveRate}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-emerald-400">
                    ₹{totals.totalCommissionPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2} className="py-3 px-4 text-right font-mono text-[11px] text-amber-300">
                    Pending: ₹{totals.pendingCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
