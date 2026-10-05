import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Users,
  Bell,
  Clock,
  Printer,
  FileText,
  RotateCcw,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  QrCode,
  CreditCard,
  Banknote,
  Split,
  MessageCircle,
  Eye,
  Plus,
  ArrowUpRight,
  Boxes,
  Stethoscope,
  Building2,
  Receipt,
  FileSpreadsheet,
  Truck
} from 'lucide-react';
import { SaleTransaction, Patient, Medicine } from '../types';
import { StorageService } from '../services/storage';
import { PrintInvoiceModal } from './PrintInvoiceModal';

interface RetailDashboardViewProps {
  onNavigateToPOS?: () => void;
  onNavigateToPatients?: () => void;
  onNavigateToClinic?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToExpiry?: () => void;
  onNavigateToRetailPurchases?: (tab: 'payment-pending' | 'payment-report' | 'supplier-list') => void;
  onRefreshData?: () => void;
}

export const RetailDashboardView: React.FC<RetailDashboardViewProps> = ({
  onNavigateToPOS,
  onNavigateToPatients,
  onNavigateToClinic,
  onNavigateToReports,
  onNavigateToExpiry,
  onNavigateToRetailPurchases,
  onRefreshData
}) => {
  const [transactions] = useState<SaleTransaction[]>(() => StorageService.getTransactions());
  const [patients] = useState<Patient[]>(() => StorageService.getPatients());
  const [medicines] = useState<Medicine[]>(() => StorageService.getMedicines());
  const [dateFilter, setDateFilter] = useState<'today' | '7d' | '30d' | 'all'>('today');
  const [viewingInvoice, setViewingInvoice] = useState<SaleTransaction | null>(null);

  const pharmacyProfile = useMemo(() => StorageService.getPharmacyProfile(), []);

  // Filter only retail sales
  const retailTransactions = useMemo(() => {
    return transactions.filter(t => t.saleType !== 'wholesale');
  }, [transactions]);

  // Apply date range filter
  const filteredSales = useMemo(() => {
    const now = new Date();
    return retailTransactions.filter(t => {
      const d = new Date(t.date);
      if (dateFilter === 'today') {
        return d.toDateString() === now.toDateString();
      }
      if (dateFilter === '7d') {
        const past = new Date();
        past.setDate(past.getDate() - 7);
        return d >= past;
      }
      if (dateFilter === '30d') {
        const past = new Date();
        past.setDate(past.getDate() - 30);
        return d >= past;
      }
      return true;
    });
  }, [retailTransactions, dateFilter]);

  // Key Retail Metrics
  const metrics = useMemo(() => {
    const totalSales = filteredSales.reduce((acc, t) => acc + (t.grandTotal || 0), 0);
    const totalBills = filteredSales.length;
    const totalItems = filteredSales.reduce((acc, t) => acc + (t.items?.length || 0), 0);
    const avgBasketSize = totalBills > 0 ? totalSales / totalBills : 0;

    const totalCogs = filteredSales.reduce((acc, t) => acc + (t.costOfGoodsSold || 0), 0);
    const grossProfit = totalSales - totalCogs;
    const grossMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
    const totalDiscount = filteredSales.reduce((acc, t) => acc + (t.totalDiscount || 0), 0);

    // Payment methods breakdown
    const upiSales = filteredSales.filter(t => t.paymentMethod === 'UPI').reduce((acc, t) => acc + t.grandTotal, 0);
    const cashSales = filteredSales.filter(t => t.paymentMethod === 'Cash').reduce((acc, t) => acc + t.grandTotal, 0);
    const cardSales = filteredSales.filter(t => t.paymentMethod === 'Card').reduce((acc, t) => acc + t.grandTotal, 0);
    const splitSales = filteredSales.filter(t => t.paymentMethod === 'Split').reduce((acc, t) => acc + t.grandTotal, 0);
    const creditSales = filteredSales.filter(t => t.paymentMethod === 'Credit').reduce((acc, t) => acc + t.grandTotal, 0);

    // Patient Credit Dues across all registered patients
    const totalOutstandingKhata = patients.reduce((acc, p) => acc + (p.outstandingDue || 0), 0);
    const patientsWithDues = patients.filter(p => (p.outstandingDue || 0) > 0).length;

    // Chronic Refills due
    const refillsDue = patients.flatMap(p => p.refillReminders || []).filter(r => r.status === 'Due Soon' || r.status === 'Overdue').length;

    return {
      totalSales,
      totalBills,
      totalItems,
      avgBasketSize,
      totalCogs,
      grossProfit,
      grossMargin,
      totalDiscount,
      upiSales,
      cashSales,
      cardSales,
      splitSales,
      creditSales,
      totalOutstandingKhata,
      patientsWithDues,
      refillsDue
    };
  }, [filteredSales, patients]);

  // Top retail dispensed items
  const topRetailMedicines = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();
    filteredSales.forEach(t => {
      (t.items || []).forEach(it => {
        const key = it.medicineName;
        const existing = map.get(key) || { name: key, quantity: 0, revenue: 0 };
        existing.quantity += it.quantity || 1;
        existing.revenue += it.total || 0;
        map.set(key, existing);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [filteredSales]);

  // Retail Supplier Payables & Procurement stats
  const supplierPayables = useMemo(() => {
    const invoices = StorageService.getPurchaseInvoices();
    const suppliers = StorageService.getSuppliers();
    let totalPending = 0;
    let overduePending = 0;
    let overdueCount = 0;
    let pendingBillsCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    invoices.forEach(inv => {
      const grandTotal = inv.grandTotal || 0;
      const paid = inv.paidAmount != null ? inv.paidAmount : (inv.paymentStatus === 'Paid' ? grandTotal : 0);
      const bal = inv.balanceAmount != null ? inv.balanceAmount : Math.max(0, grandTotal - paid);
      if (bal > 0.001) {
        pendingBillsCount += 1;
        totalPending += bal;
        const dueStr = inv.paymentDueDate || (inv as any).dueDate;
        if (dueStr) {
          const dueDate = new Date(dueStr);
          dueDate.setHours(0, 0, 0, 0);
          if (dueDate < today) {
            overdueCount += 1;
            overduePending += bal;
          }
        }
      }
    });

    return {
      totalPending,
      overduePending,
      overdueCount,
      pendingBillsCount,
      suppliersCount: suppliers.length
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/30 text-xs font-bold mb-2">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Retail Pharmacy Counter Operations (Melur Main)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Retail Operations Dashboard</span>
            </h1>
            <p className="text-teal-100 text-xs sm:text-sm mt-1 max-w-2xl">
              Real-time monitoring of counter prescriptions, OTC dispensary, UPI payments, patient Khata credit, and automated refill reminders.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Date filter pills */}
            <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-xs border border-white/20 text-xs font-bold text-white">
              <button
                type="button"
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  dateFilter === 'today' ? 'bg-white text-teal-950 shadow-xs' : 'hover:bg-white/10'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('7d')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  dateFilter === '7d' ? 'bg-white text-teal-950 shadow-xs' : 'hover:bg-white/10'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('30d')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  dateFilter === '30d' ? 'bg-white text-teal-950 shadow-xs' : 'hover:bg-white/10'
                }`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  dateFilter === 'all' ? 'bg-white text-teal-950 shadow-xs' : 'hover:bg-white/10'
                }`}
              >
                All
              </button>
            </div>

            {onNavigateToExpiry && (
              <button
                type="button"
                onClick={onNavigateToExpiry}
                className="px-3 py-2 bg-white/15 hover:bg-white/25 text-amber-200 border border-amber-300/30 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="View batches expiring within 90 days"
              >
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>Batch Expiry (90d)</span>
              </button>
            )}

            {onNavigateToPOS && (
              <button
                type="button"
                onClick={onNavigateToPOS}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Retail Sale (POS)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Retail Supplier Payables & Procurement Operations Quick Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-teal-950 rounded-2xl p-4 text-white border border-teal-800/40 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">Retail Supplier Payables & Procurement Hub</span>
                {supplierPayables.overdueCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {supplierPayables.overdueCount} Overdue Bills (₹{supplierPayables.overduePending.toFixed(0)})
                  </span>
                )}
              </div>
              <p className="text-xs text-teal-200/80 mt-0.5">
                Outstanding Payables: <span className="font-bold text-amber-300 font-mono">₹{supplierPayables.totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> across {supplierPayables.pendingBillsCount} pending bills from {supplierPayables.suppliersCount} pharma distributors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {onNavigateToRetailPurchases && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateToRetailPurchases('payment-pending')}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="View pending inward bills, part payment and full payment options"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Retail Payment Pending</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToRetailPurchases('payment-report')}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  title="View settled supplier payments breakdown & audit register"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-teal-300" />
                  <span>Payment Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToRetailPurchases('supplier-list')}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  title="View registered retail suppliers, contact details, GSTIN and ledgers"
                >
                  <Building2 className="w-3.5 h-3.5 text-teal-300" />
                  <span>Supplier List ({supplierPayables.suppliersCount})</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Retail Sales */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Retail Sales</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            ₹{metrics.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1 flex items-center justify-between">
            <span>{metrics.totalBills} Bills Issued</span>
            <span className="text-teal-700 font-bold">Avg: ₹{metrics.avgBasketSize.toFixed(0)}</span>
          </div>
        </div>

        {/* Retail Gross Profit */}
        <div className="p-4 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Gross Margin</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 mt-2 font-mono">
            ₹{metrics.grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-800 font-medium mt-1 flex items-center justify-between">
            <span>Margin: {metrics.grossMargin.toFixed(1)}%</span>
            <span className="text-emerald-700 font-bold">COGS: ₹{metrics.totalCogs.toFixed(0)}</span>
          </div>
        </div>

        {/* Patient Khata Dues */}
        <div
          onClick={onNavigateToPatients}
          className="p-4 bg-white rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer group"
          title="Click to view Patient Khata Ledger & Dues"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Patient Khata Dues</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-950 mt-2 font-mono">
            ₹{metrics.totalOutstandingKhata.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-amber-800 font-medium mt-1 flex items-center justify-between">
            <span>{metrics.patientsWithDues} Patients Pending</span>
            <span className="text-amber-700 font-bold group-hover:underline">Collect Dues &rarr;</span>
          </div>
        </div>

        {/* Chronic Refills Queue */}
        <div
          onClick={onNavigateToPatients}
          className="p-4 bg-white rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer group"
          title="Click to view upcoming refills & send WhatsApp reminders"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Refills Due Soon</span>
            <Bell className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-950 mt-2 font-mono">
            {metrics.refillsDue} <span className="text-xs font-bold text-rose-700">Prescriptions</span>
          </div>
          <div className="text-xs text-rose-800 font-medium mt-1 flex items-center justify-between">
            <span>Next 7 Days Schedule</span>
            <span className="text-rose-700 font-bold group-hover:underline">Send Alerts &rarr;</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Payment Split & Top Retail Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Payment Method Split */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-teal-600" />
              <span>Counter Payment Methods</span>
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">Total: ₹{metrics.totalSales.toFixed(0)}</span>
          </div>

          <div className="space-y-3">
            {/* UPI */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>UPI / QR Scan</span>
                </span>
                <span className="font-mono">₹{metrics.upiSales.toFixed(2)}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${metrics.totalSales > 0 ? (metrics.upiSales / metrics.totalSales) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Cash */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-slate-800">
                  <Banknote className="w-3.5 h-3.5 text-slate-600" />
                  <span>Cash Tendered</span>
                </span>
                <span className="font-mono">₹{metrics.cashSales.toFixed(2)}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-700 rounded-full transition-all"
                  style={{ width: `${metrics.totalSales > 0 ? (metrics.cashSales / metrics.totalSales) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Split */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-teal-800">
                  <Split className="w-3.5 h-3.5 text-teal-600" />
                  <span>Part Cash + Part UPI</span>
                </span>
                <span className="font-mono">₹{metrics.splitSales.toFixed(2)}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all"
                  style={{ width: `${metrics.totalSales > 0 ? (metrics.splitSales / metrics.totalSales) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Card */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-indigo-800">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>POS EDC Card</span>
                </span>
                <span className="font-mono">₹{metrics.cardSales.toFixed(2)}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${metrics.totalSales > 0 ? (metrics.cardSales / metrics.totalSales) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Credit / Khata */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-amber-800">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Patient Credit (Khata)</span>
                </span>
                <span className="font-mono text-amber-900 font-bold">₹{metrics.creditSales.toFixed(2)}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${metrics.totalSales > 0 ? (metrics.creditSales / metrics.totalSales) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Saved in discounts: ₹{metrics.totalDiscount.toFixed(2)}</span>
            <button
              type="button"
              onClick={onNavigateToReports}
              className="text-teal-700 font-bold hover:underline"
            >
              View Full P&L &rarr;
            </button>
          </div>
        </div>

        {/* Right: Top Retail Products */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-600" />
              <span>Top Dispensed Retail Medicines</span>
            </h3>
            <span className="text-xs text-slate-500">Highest Counter Volume</span>
          </div>

          <div className="divide-y divide-slate-100">
            {topRetailMedicines.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No retail sales recorded for the selected period.
              </div>
            ) : (
              topRetailMedicines.map((item, idx) => (
                <div key={item.name} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-800 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 font-mono">
                    <span className="text-slate-500">{item.quantity} units</span>
                    <span className="font-bold text-slate-900">₹{item.revenue.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={onNavigateToPOS}
              className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-[11px] font-bold text-center transition-colors cursor-pointer"
            >
              POS Billing [F1]
            </button>
            <button
              type="button"
              onClick={onNavigateToPatients}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-bold text-center transition-colors cursor-pointer"
            >
              Patient Khata Dues
            </button>
            <button
              type="button"
              onClick={onNavigateToClinic}
              className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-[11px] font-bold text-center transition-colors cursor-pointer"
            >
              Clinic & Rx
            </button>
            <button
              type="button"
              onClick={onNavigateToExpiry}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-[11px] font-bold text-center transition-colors cursor-pointer"
            >
              Expiry Alerts
            </button>
          </div>
        </div>
      </div>

      {/* Recent Retail Counter Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>Recent Counter Prescriptions & Bills ({filteredSales.length})</span>
          </div>
          <button
            type="button"
            onClick={onNavigateToReports}
            className="text-teal-700 font-bold hover:underline"
          >
            All Sales Reports &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-600 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Time & Date</th>
                <th className="py-3 px-3">Customer / Patient</th>
                <th className="py-3 px-3">Doctor / Rx</th>
                <th className="py-3 px-3">Payment Mode</th>
                <th className="py-3 px-3 text-right">Net Amount</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.slice(0, 10).map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-teal-800">
                    {tx.id}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">
                    {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-slate-800">{tx.patientName || 'Walk-in Customer'}</span>
                    {tx.patientPhone && <span className="text-[10px] text-slate-500 block font-mono">{tx.patientPhone}</span>}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {tx.doctorName || 'Self / OTC'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        tx.paymentMethod === 'UPI'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tx.paymentMethod === 'Cash'
                          ? 'bg-slate-100 text-slate-800'
                          : tx.paymentMethod === 'Credit'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900">
                    ₹{tx.grandTotal.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => setViewingInvoice(tx)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      title="View Bill Details & Reprint"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Viewer Modal */}
      {viewingInvoice && (
        <PrintInvoiceModal
          isOpen={!!viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          transaction={viewingInvoice}
          cart={[]}
          paymentMethod={viewingInvoice.paymentMethod}
        />
      )}
    </div>
  );
};
