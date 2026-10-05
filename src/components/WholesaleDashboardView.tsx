import React, { useState, useMemo } from 'react';
import {
  Truck,
  TrendingUp,
  DollarSign,
  Building2,
  Receipt,
  RotateCcw,
  Clock,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  CreditCard,
  Eye,
  Plus,
  ArrowUpRight,
  Boxes,
  FileMinus,
  Download,
  Filter
} from 'lucide-react';
import { SaleTransaction, WholesaleBuyer, WholesalePaymentCollection, PurchaseInvoice } from '../types';
import { StorageService } from '../services/storage';
import { PrintInvoiceModal } from './PrintInvoiceModal';

interface WholesaleDashboardViewProps {
  onNavigateToWholesalePOS?: () => void;
  onNavigateToWholesaleHub?: (tab?: string) => void;
  onNavigateToPurchases?: () => void;
  onNavigateToExpiry?: () => void;
  onRefreshData?: () => void;
}

export const WholesaleDashboardView: React.FC<WholesaleDashboardViewProps> = ({
  onNavigateToWholesalePOS,
  onNavigateToWholesaleHub,
  onNavigateToPurchases,
  onNavigateToExpiry,
  onRefreshData
}) => {
  const [transactions] = useState<SaleTransaction[]>(() => StorageService.getTransactions());
  const [wholesaleBuyers] = useState<WholesaleBuyer[]>(() => StorageService.getWholesaleBuyers());
  const [wholesalePayments] = useState<WholesalePaymentCollection[]>(() => StorageService.getWholesalePayments());
  const [purchaseInvoices] = useState<PurchaseInvoice[]>(() => StorageService.getPurchaseInvoices());
  const [dateFilter, setDateFilter] = useState<'today' | '7d' | '30d' | 'all'>('all');
  const [viewingInvoice, setViewingInvoice] = useState<SaleTransaction | null>(null);

  const pharmacyProfile = useMemo(() => StorageService.getPharmacyProfile(), []);

  // Filter only wholesale transactions
  const wholesaleTransactions = useMemo(() => {
    return transactions.filter(t => t.saleType === 'wholesale');
  }, [transactions]);

  // Date filtering
  const filteredSales = useMemo(() => {
    const now = new Date();
    return wholesaleTransactions.filter(t => {
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
  }, [wholesaleTransactions, dateFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((acc, t) => acc + (t.grandTotal || 0), 0);
    const totalInvoices = filteredSales.length;
    const totalCogs = filteredSales.reduce((acc, t) => acc + (t.costOfGoodsSold || 0), 0);
    const grossMargin = totalRevenue - totalCogs;
    const marginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

    // Total outstanding receivables from all wholesale buyers
    const totalOutstandingDue = wholesaleBuyers.reduce((acc, b) => acc + (b.outstandingBalance || 0), 0);
    const buyersWithDue = wholesaleBuyers.filter(b => (b.outstandingBalance || 0) > 0).length;

    // Total payments collected in period
    const totalCollected = wholesalePayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // Inward stock purchases
    const inwardPurchases = purchaseInvoices.reduce((acc, p) => acc + (p.netAmount || 0), 0);

    return {
      totalRevenue,
      totalInvoices,
      totalCogs,
      grossMargin,
      marginPercent,
      totalOutstandingDue,
      buyersWithDue,
      totalCollected,
      inwardPurchases
    };
  }, [filteredSales, wholesaleBuyers, wholesalePayments, purchaseInvoices]);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-bold mb-2">
              <Truck className="w-3.5 h-3.5" />
              <span>Wholesale & B2B Distribution Division (Form 20B/21B)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Wholesale Operations Dashboard</span>
            </h1>
            <p className="text-indigo-200 text-xs sm:text-sm mt-1 max-w-2xl">
              Centralized B2B distribution hub for supplying retail chemists, nursing homes, and clinics across Melur & Madurai district.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Date filter pills */}
            <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-xs border border-white/20 text-xs font-bold text-white">
              <button
                type="button"
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  dateFilter === 'today' ? 'bg-white text-indigo-950 shadow-xs' : 'hover:bg-white/10'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('7d')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  dateFilter === '7d' ? 'bg-white text-indigo-950 shadow-xs' : 'hover:bg-white/10'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('30d')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  dateFilter === '30d' ? 'bg-white text-indigo-950 shadow-xs' : 'hover:bg-white/10'
                }`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  dateFilter === 'all' ? 'bg-white text-indigo-950 shadow-xs' : 'hover:bg-white/10'
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

            {onNavigateToWholesalePOS && (
              <button
                type="button"
                onClick={onNavigateToWholesalePOS}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ New B2B Invoice</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: B2B Revenue */}
        <div className="p-4 bg-white rounded-2xl border border-indigo-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Wholesale B2B Sales</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-950 mt-2 font-mono">
            ₹{metrics.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-indigo-800 font-medium mt-1 flex items-center justify-between">
            <span>{metrics.totalInvoices} Invoices Dispatched</span>
            <span className="font-bold">Margin: {metrics.marginPercent.toFixed(1)}%</span>
          </div>
        </div>

        {/* Card 2: Pending Receivables from Chemists */}
        <div
          onClick={() => onNavigateToWholesaleHub && onNavigateToWholesaleHub('payment-pending')}
          className="p-4 bg-white rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer group"
          title="Click to view Wholesale Payment Pending ledger"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Receivables</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-950 mt-2 font-mono">
            ₹{metrics.totalOutstandingDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-amber-800 font-medium mt-1 flex items-center justify-between">
            <span>{metrics.buyersWithDue} Chemists with Balance</span>
            <span className="font-bold text-amber-700 group-hover:underline">Collect &rarr;</span>
          </div>
        </div>

        {/* Card 3: Payments Collected */}
        <div
          onClick={() => onNavigateToWholesaleHub && onNavigateToWholesaleHub('payment-pending')}
          className="p-4 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group"
          title="Click to view Payment Collections"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Payments Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 mt-2 font-mono">
            ₹{metrics.totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-800 font-medium mt-1 flex items-center justify-between">
            <span>{wholesalePayments.length} Bank / Cheque Receipts</span>
            <span className="font-bold text-emerald-700 group-hover:underline">Ledger &rarr;</span>
          </div>
        </div>

        {/* Card 4: Inward Invoices */}
        <div
          onClick={onNavigateToPurchases}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
          title="Click to view Purchase Invoices & Inward Stock"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Inward Pharma Purchases</span>
            <Boxes className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            ₹{metrics.inwardPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1 flex items-center justify-between">
            <span>{purchaseInvoices.length} Manufacturer Invoices</span>
            <span className="text-indigo-700 font-bold group-hover:underline">Inward &rarr;</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Top Chemist Buyers & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Top Chemist / Hospital Buyers */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Registered Wholesale Chemist & Hospital Buyers ({wholesaleBuyers.length})</span>
            </h3>
            <span className="text-xs text-slate-500">Credit Terms & Balances</span>
          </div>

          <div className="divide-y divide-slate-100">
            {wholesaleBuyers.map(b => (
              <div key={b.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{b.businessName}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{b.city}</span>
                    <span>•</span>
                    <span className="font-mono">GST: {b.gstin || 'Unregistered'}</span>
                    <span>•</span>
                    <span className="font-mono text-indigo-700 font-bold">{b.creditDays}d Credit</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-black text-amber-900 text-sm">
                    ₹{(b.outstandingBalance || 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Limit: ₹{(b.creditLimit || 50000).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">All buyers licensed under Form 20, 21, 20B & 21B</span>
            <button
              type="button"
              onClick={() => onNavigateToWholesaleHub && onNavigateToWholesaleHub('payment-pending')}
              className="text-indigo-700 font-bold hover:underline"
            >
              Wholesale B2B Ledger &rarr;
            </button>
          </div>
        </div>

        {/* Right: Quick Wholesale Operations Hub */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-600" />
            <span>Wholesale Operations Shortcuts</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onNavigateToWholesalePOS}
              className="p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-950 rounded-xl text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>B2B Sales Invoice</span>
              </div>
              <p className="text-[10px] text-indigo-700 mt-1">
                Wholesale billing at PTR rate with e-Way bill & transport no.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToWholesaleHub && onNavigateToWholesaleHub('payment-pending')}
              className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 rounded-xl text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-xs flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-amber-600" />
                <span>Pending Receivables</span>
              </div>
              <p className="text-[10px] text-amber-800 mt-1">
                Chemist credit ledger & collection receipts.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToWholesaleHub && onNavigateToWholesaleHub('sales-return')}
              className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-950 rounded-xl text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-xs flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Sales Returns</span>
              </div>
              <p className="text-[10px] text-rose-800 mt-1">
                Credit note issue for short-expiry or damaged goods.
              </p>
            </button>

            <button
              type="button"
              onClick={onNavigateToPurchases}
              className="p-3 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-950 rounded-xl text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-xs flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-teal-600" />
                <span>Purchase Inward</span>
              </div>
              <p className="text-[10px] text-teal-800 mt-1">
                Stock entry from pharmaceutical manufacturers.
              </p>
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-800 block">Wholesale Tax & Compliance Note:</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Wholesale bills generate GST-compliant B2B Tax Invoices with Buyer GSTIN, Drug License 20B/21B, state codes, and HSN-wise tax summary.
            </p>
          </div>
        </div>
      </div>

      {/* Recent B2B Wholesale Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            <span>Recent Wholesale B2B Invoices ({filteredSales.length})</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToWholesaleHub && onNavigateToWholesaleHub('sales-report')}
            className="text-indigo-700 font-bold hover:underline"
          >
            All Wholesale Reports &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-600 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Chemist / Buyer</th>
                <th className="py-3 px-3">GSTIN / DL</th>
                <th className="py-3 px-3">e-Way Bill / Transport</th>
                <th className="py-3 px-3 text-right">Net Amount</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.slice(0, 10).map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-indigo-900">
                    {tx.id}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">
                    {new Date(tx.date).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">
                    {tx.patientName || 'Wholesale Buyer'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                    {tx.wholesaleBuyerGstin || '33AABCM8921R1ZC'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                    {tx.ewayBillNo || 'Local Dispatch'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900">
                    ₹{tx.grandTotal.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 font-mono">
                      {tx.creditDays ? `${tx.creditDays}d Credit` : '30d Credit'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => setViewingInvoice(tx)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      title="View Wholesale Invoice Details"
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
