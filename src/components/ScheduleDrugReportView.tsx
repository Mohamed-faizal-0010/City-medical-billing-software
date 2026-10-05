import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Calendar,
  Search,
  Filter,
  AlertOctagon,
  ShieldCheck,
  Download,
  Clock,
  User,
  MapPin,
  Phone,
  Stethoscope,
  Pill,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  Info,
  BadgeAlert
} from 'lucide-react';
import { SaleTransaction, Medicine, Patient, Doctor } from '../types';
import { StorageService } from '../services/storage';
import {
  ScheduleDrugItem,
  ScheduleClassification,
  extractScheduledDrugItems,
  filterScheduleDrugItems,
  exportScheduleDrugXLS,
  exportScheduleDrugPDF,
  printScheduleDrugReportWindow,
  getMedicineScheduleInfo
} from '../utils/scheduleDrugUtils';

interface ScheduleDrugReportViewProps {
  onNavigateToPOS?: () => void;
  onRefreshData?: () => void;
}

type PeriodMode = 'daily' | 'monthly' | 'custom' | 'all';

export const ScheduleDrugReportView: React.FC<ScheduleDrugReportViewProps> = ({
  onNavigateToPOS,
  onRefreshData
}) => {
  // Load data from StorageService
  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => StorageService.getTransactions());
  const [medicines] = useState<Medicine[]>(() => StorageService.getMedicines());
  const [patients] = useState<Patient[]>(() => StorageService.getPatients());
  const [doctors] = useState<Doctor[]>(() => StorageService.getDoctors());
  const profile = useMemo(() => StorageService.getPharmacyProfile(), []);

  // Filter States
  const [periodMode, setPeriodMode] = useState<PeriodMode>('daily');
  
  // Daily mode: defaults to today (or latest transaction date if available)
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // If we have recent transactions, select today or the most recent transaction's date
    const txs = StorageService.getTransactions();
    if (txs.length > 0) {
      const dates = txs.map(t => t.date.slice(0, 10)).sort().reverse();
      return dates[0] || new Date().toISOString().slice(0, 10);
    }
    return new Date().toISOString().slice(0, 10);
  });

  // Monthly mode: defaults to current month YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 7);
  });

  // Custom date range
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Schedule type filter
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'H1' | 'H' | 'X' | 'G' | 'Narcotic'>('all');

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all scheduled items
  const allScheduledItems = useMemo(() => {
    return extractScheduledDrugItems(transactions, patients, doctors, medicines);
  }, [transactions, patients, doctors, medicines]);

  // Apply active filters
  const filteredItems = useMemo(() => {
    return filterScheduleDrugItems(allScheduledItems, periodMode, {
      selectedDate,
      selectedMonth,
      startDate,
      endDate,
      scheduleFilter,
      searchQuery
    });
  }, [allScheduledItems, periodMode, selectedDate, selectedMonth, startDate, endDate, scheduleFilter, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalQty = 0;
    let totalVal = 0;
    let h1Count = 0;
    let hCount = 0;
    let xCount = 0;
    let gCount = 0;
    const uniqueDoctors = new Set<string>();
    const uniquePatients = new Set<string>();
    const uniqueInvoices = new Set<string>();

    filteredItems.forEach(i => {
      totalQty += i.quantity;
      totalVal += i.total;
      if (i.scheduleType === 'H1') h1Count++;
      if (i.scheduleType === 'H') hCount++;
      if (i.scheduleType === 'X') xCount++;
      if (i.scheduleType === 'G') gCount++;
      if (i.doctorName) uniqueDoctors.add(i.doctorName);
      if (i.patientName) uniquePatients.add(i.patientName);
      if (i.transactionId) uniqueInvoices.add(i.transactionId);
    });

    return {
      totalBills: uniqueInvoices.size,
      totalEntries: filteredItems.length,
      totalQty,
      totalVal,
      h1Count,
      hCount,
      xCount,
      gCount,
      doctorCount: uniqueDoctors.size,
      patientCount: uniquePatients.size
    };
  }, [filteredItems]);

  // Period label for export titles
  const periodLabel = useMemo(() => {
    if (periodMode === 'daily') {
      const d = new Date(selectedDate);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (periodMode === 'monthly') {
      const [y, m] = selectedMonth.split('-');
      const date = new Date(Number(y), Number(m) - 1, 1);
      return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
    if (periodMode === 'custom') {
      return `${startDate} to ${endDate}`;
    }
    return 'All Records To Date';
  }, [periodMode, selectedDate, selectedMonth, startDate, endDate]);

  // Export handlers
  const handleExportXLS = () => {
    const title = periodMode === 'daily' 
      ? `Schedule Drug Register (Daily Report)` 
      : periodMode === 'monthly'
      ? `Schedule Drug Register (Monthly Statutory Register)`
      : `Schedule Drug Register (${periodLabel})`;

    const filename = `CityMedical_Schedule_Drug_Report_${periodMode}_${periodMode === 'daily' ? selectedDate : periodMode === 'monthly' ? selectedMonth : 'Custom'}`;
    exportScheduleDrugXLS(filteredItems, title, periodLabel, filename);
  };

  const handleExportPDF = () => {
    const title = periodMode === 'daily' 
      ? `Schedule Drug Register (Daily EOD Register)` 
      : periodMode === 'monthly'
      ? `Schedule Drug Register (Monthly Statutory Report)`
      : `Schedule Drug Register (${periodLabel})`;

    const filename = `CityMedical_Schedule_Drug_Report_${periodMode}_${periodMode === 'daily' ? selectedDate : periodMode === 'monthly' ? selectedMonth : 'Custom'}`;
    exportScheduleDrugPDF(filteredItems, title, periodLabel, filename);
  };

  const handlePrint = () => {
    const title = periodMode === 'daily' 
      ? `Schedule Drug Register (Daily EOD Log)` 
      : periodMode === 'monthly'
      ? `Schedule Drug Register (Monthly Audit Register)`
      : `Schedule Drug Register (${periodLabel})`;

    printScheduleDrugReportWindow(filteredItems, title, periodLabel);
  };

  // Seed realistic schedule drug sales if needed
  const handleSeedDemoScheduledSales = () => {
    const sampleTxs: SaleTransaction[] = [
      {
        id: `INV-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        patientId: 'pat-101',
        patientName: 'Kavita Sundaram',
        patientPhone: '9845012345',
        patientAge: 42,
        patientAddress: 'Melur Main Road, Madurai',
        doctorName: 'Dr. Ananya Iyer, MD',
        doctorId: 'doc-2',
        items: [
          {
            medicineId: 'med-sch-01',
            medicineName: 'Taxim-O 200 (Cefixime)',
            genericName: 'Cefixime Trihydrate 200mg',
            scheduleType: 'H1',
            batchNumber: 'TXM-26A04',
            expiryDate: '2027-08-31',
            quantity: 10,
            unitPrice: 11.50,
            discountPercent: 0,
            taxRate: 12,
            total: 115.00,
            unitType: 'pack',
            pack: '10 Tablets'
          },
          {
            medicineId: 'med-sch-02',
            medicineName: 'Alprax 0.5 (Alprazolam)',
            genericName: 'Alprazolam 0.5mg',
            scheduleType: 'H1',
            batchNumber: 'ALP-991B',
            expiryDate: '2027-04-30',
            quantity: 15,
            unitPrice: 4.20,
            discountPercent: 0,
            taxRate: 12,
            total: 63.00,
            unitType: 'pack',
            pack: '15 Tablets'
          }
        ],
        subtotal: 178.00,
        totalTax: 19.07,
        totalDiscount: 0,
        grandTotal: 178.00,
        costOfGoodsSold: 112.00,
        paymentMethod: 'UPI',
        paymentStatus: 'Paid',
        cashierName: 'Anusya Begum, D.Pharm'
      },
      {
        id: `INV-${(Date.now() - 3600000).toString().slice(-6)}`,
        date: new Date().toISOString(),
        patientName: 'Muthukumar S',
        patientPhone: '9842155891',
        patientAge: 56,
        patientAddress: 'Therkkutheru, Melur',
        doctorName: 'Dr. K. Rajesh, MS (Ortho)',
        items: [
          {
            medicineId: 'med-sch-03',
            medicineName: 'Ultracet (Tramadol + Paracetamol)',
            genericName: 'Tramadol 37.5mg + Paracetamol 325mg',
            scheduleType: 'H1',
            batchNumber: 'ULT-552K',
            expiryDate: '2027-11-30',
            quantity: 10,
            unitPrice: 22.00,
            discountPercent: 0,
            taxRate: 12,
            total: 220.00,
            unitType: 'pack',
            pack: '10 Tablets'
          },
          {
            medicineId: 'med-sch-04',
            medicineName: 'Telma 40',
            genericName: 'Telmisartan 40mg',
            scheduleType: 'H',
            batchNumber: 'TLM-882A',
            expiryDate: '2027-09-30',
            quantity: 30,
            unitPrice: 8.50,
            discountPercent: 0,
            taxRate: 12,
            total: 255.00,
            unitType: 'pack',
            pack: '30 Tablets'
          }
        ],
        subtotal: 475.00,
        totalTax: 50.89,
        totalDiscount: 0,
        grandTotal: 475.00,
        costOfGoodsSold: 310.00,
        paymentMethod: 'Cash',
        paymentStatus: 'Paid',
        cashierName: 'Anusya Begum, D.Pharm'
      }
    ];

    const currentTxs = StorageService.getTransactions();
    const merged = [...sampleTxs, ...currentTxs];
    StorageService.saveTransactions(merged);
    setTransactions(merged);
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Top Title & Statutory Compliance Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Rule 65(9) & Form 35
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Drugs & Cosmetics Act Compliance
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <AlertOctagon className="w-7 h-7 text-rose-400" />
              Schedule Drug Register
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Statutory Dispensation Log for Schedule H1, Schedule H & Schedule X drugs with patient age, location, and doctor credentials.
            </p>
            <div className="mt-2 text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span><strong>Pharmacy:</strong> {profile.name}</span>
              <span>•</span>
              <span><strong>DL No:</strong> {profile.drugLicenseNo || 'TN-MDU-2024-004928 (20B/21B)'}</span>
              <span>•</span>
              <span><strong>Supervising R.Ph:</strong> Anusya Begum (TN-RPH-78419)</span>
            </div>
          </div>

          {/* Quick Action Buttons: XLS, PDF, Print */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportXLS}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md transition-all active:scale-95"
              title="Download Excel Spreadsheet (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download XLS</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-md transition-all active:scale-95"
              title="Download Audit PDF Document (.pdf)"
            >
              <FileText className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700 shadow-md transition-all active:scale-95"
              title="Print Statutory Register"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Control Bar: Period (Daily/Monthly) + Schedule Selector */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Period Mode Selector (Daily, Monthly, Custom, All) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setPeriodMode('daily')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                periodMode === 'daily'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Report
            </button>
            <button
              onClick={() => setPeriodMode('monthly')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                periodMode === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Register
            </button>
            <button
              onClick={() => setPeriodMode('custom')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                periodMode === 'custom'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom Range
            </button>
            <button
              onClick={() => setPeriodMode('all')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                periodMode === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records
            </button>
          </div>

          {/* Date Picker depending on mode */}
          <div className="flex flex-wrap items-center gap-3">
            {periodMode === 'daily' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Select Date:
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Today
                </button>
              </div>
            )}

            {periodMode === 'monthly' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Select Month:
                </span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {periodMode === 'custom' && (
              <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="schedule-start-date" className="text-xs font-bold text-slate-600">
                    Start Date:
                  </label>
                  <input
                    id="schedule-start-date"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="px-2 py-1 rounded border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-teal-500"
                  />
                </div>
                <span className="text-slate-400 font-bold text-xs">-</span>
                <div className="flex items-center gap-1.5">
                  <label htmlFor="schedule-end-date" className="text-xs font-bold text-slate-600">
                    End Date:
                  </label>
                  <input
                    id="schedule-end-date"
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="px-2 py-1 rounded border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-teal-500"
                  />
                </div>
                <div className="flex items-center gap-1 ml-1">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
                      const today = now.toISOString().slice(0, 10);
                      setStartDate(firstDay);
                      setEndDate(today);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const p = new Date();
                      p.setDate(p.getDate() - 30);
                      setStartDate(p.toISOString().slice(0, 10));
                      setEndDate(now.toISOString().slice(0, 10));
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Second Row: Schedule Classification Pills + Search Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Category:
            </span>
            <button
              onClick={() => setScheduleFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                scheduleFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Scheduled ({allScheduledItems.length})
            </button>

            <button
              onClick={() => setScheduleFilter('H1')}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                scheduleFilter === 'H1'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
            >
              Schedule H1 (High Alert)
            </button>

            <button
              onClick={() => setScheduleFilter('H')}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                scheduleFilter === 'H'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              Schedule H (Rx Only)
            </button>

            <button
              onClick={() => setScheduleFilter('X')}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                scheduleFilter === 'X'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
              }`}
            >
              Schedule X (Vault)
            </button>

            <button
              onClick={() => setScheduleFilter('G')}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                scheduleFilter === 'G'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
              }`}
            >
              Schedule G (Supervision)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search drug, patient, doctor, bill, batch..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Period</div>
          <div className="text-base font-bold text-slate-900 mt-1 truncate" title={periodLabel}>
            {periodLabel}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 capitalize">{periodMode} Register</div>
        </div>

        <div className="bg-rose-50/70 rounded-xl p-4 border border-rose-200 shadow-sm">
          <div className="text-xs font-semibold text-rose-700 flex items-center justify-between">
            <span>Schedule H1</span>
            <BadgeAlert className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900 mt-1">{stats.h1Count}</div>
          <div className="text-[11px] text-rose-600 mt-0.5">High-alert Antibiotics</div>
        </div>

        <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200 shadow-sm">
          <div className="text-xs font-semibold text-amber-700">Schedule H</div>
          <div className="text-2xl font-black text-amber-900 mt-1">{stats.hCount}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Prescription Entries</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Total Units</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalQty}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tablets / Strips</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Total Dispensed Value</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">₹{stats.totalVal.toFixed(2)}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Across {stats.totalBills} Bills</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Doctors Logged</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{stats.doctorCount}</div>
          <div className="text-[11px] text-indigo-600 mt-0.5">To {stats.patientCount} Patients</div>
        </div>
      </div>

      {/* Main Statutory Register Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
          <div>
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>Statutory Dispensation Records</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 text-slate-800 font-semibold">
                {filteredItems.length} records found
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Entries maintained in compliance with the Drugs and Cosmetics Rules, 1945
            </p>
          </div>

          <div className="flex items-center gap-2">
            {filteredItems.length === 0 && (
              <button
                onClick={handleSeedDemoScheduledSales}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                + Add Sample Scheduled Sales
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center px-4">
            <AlertOctagon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Scheduled Drug Records Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              There are no Schedule H1, Schedule H, or Schedule X dispensing transactions recorded for {periodLabel}.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setPeriodMode('all')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
              >
                View All Periods
              </button>
              <button
                onClick={handleSeedDemoScheduledSales}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
              >
                Load Sample Schedule Sales
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center w-10">#</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Bill / Inv No</th>
                  <th className="py-3 px-3">Patient Details</th>
                  <th className="py-3 px-3">Address / Location</th>
                  <th className="py-3 px-3">Prescribing Doctor</th>
                  <th className="py-3 px-3">Medicine & Molecule</th>
                  <th className="py-3 px-3 text-center">Schedule</th>
                  <th className="py-3 px-3 text-center">Batch & Expiry</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredItems.map((item, idx) => {
                  const isH1 = item.scheduleType === 'H1';
                  const isX = item.scheduleType === 'X';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isH1 ? 'bg-rose-50/20' : isX ? 'bg-purple-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-medium text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {new Date(item.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(item.date).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {item.transactionId}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.patientName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 pl-4.5">
                          {item.patientAge ? `${item.patientAge} yrs` : 'Age N/A'} • {item.patientPhone}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[140px]" title={item.patientAddress}>
                            {item.patientAddress || 'Melur, Madurai'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <Stethoscope className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{item.doctorName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 pl-4.5 flex flex-wrap items-center gap-1">
                          <span>{item.doctorRegNo || 'Reg. RMP'}</span>
                          {item.prescriptionNo && (
                            <span className="px-1 py-0.2 bg-rose-100 text-rose-800 font-mono font-bold rounded text-[9px] border border-rose-200">
                              Rx: {item.prescriptionNo}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.medicineName}</div>
                        <div className="text-[10px] text-emerald-700 font-medium truncate max-w-[180px]" title={item.genericName}>
                          {item.genericName}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase rounded-full border ${
                            item.scheduleType === 'H1'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : item.scheduleType === 'X'
                              ? 'bg-purple-100 text-purple-800 border-purple-300'
                              : item.scheduleType === 'G'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          Sched {item.scheduleType}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{item.batchNumber}</div>
                        <div className="text-[10px] text-slate-400">Exp: {item.expiryDate.slice(0, 7)}</div>
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        {item.quantity}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{item.total.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Verification & Statutory Certification Block */}
        {filteredItems.length > 0 && (
          <div className="p-5 bg-slate-50 border-t border-slate-200">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Statutory Rule 65 Compliance Verification
                </div>
                <p className="text-[11px] text-slate-500 max-w-2xl leading-relaxed">
                  I, <strong>Anusya Begum, D.Pharm (Reg No: TN-RPH-78419)</strong>, certify that all Schedule H, H1, and X drugs listed in this register were dispensed in accordance with the Drugs and Cosmetics Act, 1940 and Rules 1945, against genuine medical prescriptions.
                </p>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={handleExportXLS}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  Export XLS
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                  Export PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Register
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
