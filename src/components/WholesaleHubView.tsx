import React, { useState, useMemo } from 'react';
import {
  Truck,
  Receipt,
  RotateCcw,
  DollarSign,
  FileSpreadsheet,
  FileMinus,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Download,
  Building2,
  Calendar,
  Filter,
  CreditCard,
  Layers,
  ExternalLink,
  Eye,
  Check,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Percent
} from 'lucide-react';
import {
  SaleTransaction,
  WholesaleBuyer,
  WholesalePaymentCollection,
  SalesReturn,
  PurchaseInvoice,
  PurchaseReturn,
  Medicine,
  Supplier
} from '../types';
import { StorageService } from '../services/storage';
import { PrintInvoiceModal } from './PrintInvoiceModal';
import {
  exportReportToExcel,
  exportReportToPDF,
  printReportWindow
} from '../utils/exportUtils';

export type WholesaleTab =
  | 'sales-report'
  | 'payment-pending'
  | 'sales-return'
  | 'purchase-entry'
  | 'purchase-return'
  | 'purchase-report';

interface WholesaleHubViewProps {
  initialTab?: WholesaleTab;
  onNavigateToPurchases?: () => void;
  onRefreshData?: () => void;
}

export const WholesaleHubView: React.FC<WholesaleHubViewProps> = ({
  initialTab = 'sales-report',
  onNavigateToPurchases,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<WholesaleTab>(initialTab);
  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => StorageService.getTransactions());
  const [wholesaleBuyers, setWholesaleBuyers] = useState<WholesaleBuyer[]>(() => StorageService.getWholesaleBuyers());
  const [wholesalePayments, setWholesalePayments] = useState<WholesalePaymentCollection[]>(() => StorageService.getWholesalePayments());
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>(() => StorageService.getSalesReturns());
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(() => StorageService.getPurchaseInvoices());
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>(() => StorageService.getPurchaseReturns());
  const [suppliers] = useState<Supplier[]>(() => StorageService.getSuppliers());
  const [medicines] = useState<Medicine[]>(() => StorageService.getMedicines());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuyerFilter, setSelectedBuyerFilter] = useState('All');
  const [selectedDateRange, setSelectedDateRange] = useState<'all' | 'today' | '7d' | '30d' | 'month'>('all');

  // Modals state
  const [viewingTransaction, setViewingTransaction] = useState<SaleTransaction | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBuyerForPayment, setSelectedBuyerForPayment] = useState<WholesaleBuyer | null>(null);
  const [payAmount, setPayAmount] = useState<number>(10000);
  const [payMode, setPayMode] = useState<WholesalePaymentCollection['paymentMode']>('Bank_NEFT');
  const [payRefNo, setPayRefNo] = useState('');
  const [payBankName, setPayBankName] = useState('State Bank of India');
  const [payNotes, setPayNotes] = useState('Payment settlement against outstanding B2B credit');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // New Wholesale Sales Return Modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnInvoiceId, setReturnInvoiceId] = useState('');
  const [returnReason, setReturnReason] = useState('Short Expiry / Overstock return from Chemist');
  const [returnAmount, setReturnAmount] = useState<number>(500);

  // New Wholesale Purchase Return (Debit Note) Modal
  const [showDebitModal, setShowDebitModal] = useState(false);
  const [debitSupplierId, setDebitSupplierId] = useState(suppliers[0]?.id || '');
  const [debitMedicineId, setDebitMedicineId] = useState(medicines[0]?.id || '');
  const [debitQuantity, setDebitQuantity] = useState<number>(20);
  const [debitReason, setDebitReason] = useState<'Expired Stock' | 'Damaged in Transit' | 'Recalled by Manufacturer'>('Expired Stock');

  const reload = () => {
    setTransactions(StorageService.getTransactions());
    setWholesaleBuyers(StorageService.getWholesaleBuyers());
    setWholesalePayments(StorageService.getWholesalePayments());
    setSalesReturns(StorageService.getSalesReturns());
    setPurchaseInvoices(StorageService.getPurchaseInvoices());
    setPurchaseReturns(StorageService.getPurchaseReturns());
    if (onRefreshData) onRefreshData();
  };

  // Helper date filter
  const isDateInFilter = (dateStr: string) => {
    if (!dateStr || selectedDateRange === 'all') return true;
    const d = new Date(dateStr);
    const now = new Date();
    if (selectedDateRange === 'today') return d.toDateString() === now.toDateString();
    if (selectedDateRange === '7d') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      return d >= past;
    }
    if (selectedDateRange === '30d') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      return d >= past;
    }
    if (selectedDateRange === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // 1. Filtered Wholesale Sales Transactions
  const wholesaleSales = useMemo(() => {
    return transactions.filter(tx => {
      const isWholesale = tx.saleType === 'wholesale' || Boolean(tx.buyerBusinessName || tx.buyerGstin || tx.wholesaleBuyerName);
      if (!isWholesale) return false;
      if (!isDateInFilter(tx.date)) return false;

      const q = searchQuery.toLowerCase();
      const buyer = (tx.buyerBusinessName || tx.wholesaleBuyerName || tx.patientName || '').toLowerCase();
      const gstin = (tx.buyerGstin || tx.wholesaleBuyerGstin || '').toLowerCase();
      const invoiceNo = tx.id.toLowerCase();

      const matchSearch = buyer.includes(q) || gstin.includes(q) || invoiceNo.includes(q);
      const matchBuyer = selectedBuyerFilter === 'All' || buyer.includes(selectedBuyerFilter.toLowerCase());

      return matchSearch && matchBuyer;
    });
  }, [transactions, selectedDateRange, searchQuery, selectedBuyerFilter]);

  const totalWholesaleGross = useMemo(() => {
    return wholesaleSales.reduce((sum, tx) => sum + (tx.grandTotal ?? 0), 0);
  }, [wholesaleSales]);

  const totalWholesaleTax = useMemo(() => {
    return wholesaleSales.reduce((sum, tx) => sum + (tx.totalTax ?? 0), 0);
  }, [wholesaleSales]);

  // 2. Pending Payments & Outstanding Receivables
  const totalOutstandingCredit = useMemo(() => {
    return wholesaleBuyers.reduce((sum, b) => sum + (b.outstandingBalance || 0), 0);
  }, [wholesaleBuyers]);

  const totalCreditLimitGranted = useMemo(() => {
    return wholesaleBuyers.reduce((sum, b) => sum + (b.creditLimit || 0), 0);
  }, [wholesaleBuyers]);

  const pendingSalesInvoices = useMemo(() => {
    return transactions.filter(
      tx => (tx.saleType === 'wholesale' || tx.buyerBusinessName) && tx.paymentStatus === 'Pending'
    );
  }, [transactions]);

  // 3. Wholesale Sales Returns
  const wholesaleReturnsList = useMemo(() => {
    return salesReturns.filter(sr => {
      if (!isDateInFilter(sr.date)) return false;
      const q = searchQuery.toLowerCase();
      const name = (sr.customerName || sr.patientName || '').toLowerCase();
      const inv = sr.invoiceId.toLowerCase();
      return name.includes(q) || inv.includes(q) || sr.id.toLowerCase().includes(q);
    });
  }, [salesReturns, selectedDateRange, searchQuery]);

  const totalSalesReturnAmount = useMemo(() => {
    return wholesaleReturnsList.reduce((sum, r) => sum + (r.refundAmount ?? r.totalRefundAmount ?? 0), 0);
  }, [wholesaleReturnsList]);

  // 4. Inward Purchases from Pharmaceuticals
  const filteredPurchases = useMemo(() => {
    return purchaseInvoices.filter(inv => {
      if (!isDateInFilter(inv.invoiceDate)) return false;
      const q = searchQuery.toLowerCase();
      const sup = inv.distributorName.toLowerCase();
      const invNo = inv.invoiceNo.toLowerCase();
      return sup.includes(q) || invNo.includes(q);
    });
  }, [purchaseInvoices, selectedDateRange, searchQuery]);

  const totalPurchaseInwardGross = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + (p.grandTotal ?? 0), 0);
  }, [filteredPurchases]);

  const totalPurchaseITC = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + (p.totalTax ?? 0), 0);
  }, [filteredPurchases]);

  // 5. Wholesale Purchase Returns (Debit Notes)
  const filteredDebitNotes = useMemo(() => {
    return purchaseReturns.filter(pr => {
      if (!isDateInFilter(pr.returnDate)) return false;
      const q = searchQuery.toLowerCase();
      const sup = pr.supplierName.toLowerCase();
      const dn = pr.debitNoteNumber.toLowerCase();
      return sup.includes(q) || dn.includes(q);
    });
  }, [purchaseReturns, selectedDateRange, searchQuery]);

  const totalDebitNotesValue = useMemo(() => {
    return filteredDebitNotes.reduce((sum, pr) => sum + (pr.totalDebitAmount || 0), 0);
  }, [filteredDebitNotes]);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  // Record Wholesale Payment Collection
  const handleSavePaymentCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuyerForPayment) return;
    if (payAmount <= 0) {
      alert('Please enter a valid payment collection amount.');
      return;
    }

    const newPayment: WholesalePaymentCollection = {
      id: `RCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      buyerId: selectedBuyerForPayment.id,
      buyerName: selectedBuyerForPayment.businessName,
      amount: Number(payAmount),
      paymentMode: payMode,
      referenceNo: payRefNo || `UTR-${Date.now().toString().slice(-8)}`,
      bankName: payBankName,
      notes: payNotes,
      receivedBy: 'Chief Accountant'
    };

    StorageService.addWholesalePayment(newPayment);
    reload();
    setShowPaymentModal(false);
    setSuccessBanner(
      `Payment collection of ₹${payAmount.toLocaleString('en-IN')} recorded for ${selectedBuyerForPayment.businessName}. Outstanding balance updated.`
    );
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  // Submit Sales Return
  const handleCreateSalesReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const newSR: SalesReturn = {
      id: `CN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceId: returnInvoiceId || 'INV-2026-B2B-101',
      date: new Date().toISOString(),
      customerName: selectedBuyerFilter !== 'All' ? selectedBuyerFilter : 'Meenakshi Medicals & General Store',
      items: [
        {
          medicineId: medicines[0]?.id || 'med-001',
          medicineName: medicines[0]?.name || 'Dolo 650mg Tablet',
          batchNumber: 'BATCH-2026-RET',
          quantity: 10,
          refundAmount: Number(returnAmount),
          reason: returnReason,
          returnToStock: true
        }
      ],
      refundAmount: Number(returnAmount),
      totalRefundAmount: Number(returnAmount),
      refundMethod: 'Store_Credit',
      processedBy: 'Pharmacist Anusya Begum',
      notes: `Wholesale B2B credit note issued against ${returnReason}`
    };

    StorageService.addSalesReturn(newSR);
    reload();
    setShowReturnModal(false);
    setSuccessBanner(`Wholesale Credit Note ${newSR.id} issued for ₹${returnAmount}.`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  // Submit Purchase Return (Debit Note)
  const handleCreatePurchaseReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === debitSupplierId) || suppliers[0];
    const med = medicines.find(m => m.id === debitMedicineId) || medicines[0];
    const batch = med?.batches?.[0];
    const unitCost = batch?.costPrice || 25;
    const totalAmount = unitCost * debitQuantity;

    const newPR: PurchaseReturn = {
      id: `PR-${Date.now().toString().slice(-5)}`,
      debitNoteNumber: `DN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierId: sup?.id || 'sup-001',
      supplierName: sup?.name || 'Standard Pharma Super-Stockist',
      returnDate: new Date().toISOString().split('T')[0],
      totalDebitAmount: totalAmount,
      accountsPayableAdjusted: true,
      status: 'Debit_Note_Issued',
      items: [
        {
          medicineId: med?.id || 'med-001',
          medicineName: med?.name || 'Paracetamol 650mg',
          batchNumber: batch?.batchNumber || 'EXP-BATCH-01',
          quantity: debitQuantity,
          unitCostPrice: unitCost,
          totalDebit: totalAmount,
          reason: debitReason
        }
      ],
      notes: `Wholesale Debit Note issued for returning ${debitQuantity} packs to ${sup?.name}`
    };

    StorageService.addPurchaseReturn(newPR);
    reload();
    setShowDebitModal(false);
    setSuccessBanner(`Debit Note ${newPR.debitNoteNumber} issued to ${sup?.name} for ₹${totalAmount.toFixed(2)}.`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  // ==========================================
  // EXPORT DISPATCHERS
  // ==========================================
  const handleExportSalesExcel = () => {
    const headers = ['Invoice #', 'Date', 'Wholesale Buyer (Chemist / Clinic)', 'GSTIN', 'DL No', 'Pay Mode', 'Status', 'Taxable (₹)', 'GST (₹)', 'Grand Total (₹)'];
    const rows = wholesaleSales.map(tx => [
      tx.id,
      new Date(tx.date).toLocaleDateString(),
      tx.buyerBusinessName || tx.wholesaleBuyerName || tx.patientName,
      tx.buyerGstin || tx.wholesaleBuyerGstin || 'Unregistered',
      tx.buyerDrugLicense || tx.wholesaleBuyerDrugLicense || '-',
      tx.paymentMethod,
      tx.paymentStatus,
      (tx.subtotal ?? 0).toFixed(2),
      (tx.totalTax ?? 0).toFixed(2),
      (tx.grandTotal ?? 0).toFixed(2)
    ]);
    exportReportToExcel('Wholesale-Sales-Register.xlsx', 'Wholesale Sales', headers, rows, {
      title: 'City Medical ERP - Wholesale B2B Sales Register',
      subtitle: `Total Dispatched: ₹${totalWholesaleGross.toFixed(2)}`
    });
  };

  const handleExportPurchasesExcel = () => {
    const headers = ['Bill #', 'Date', 'Pharmaceutical Company / Distributor', 'Supplier GSTIN', 'Items Count', 'Payment Status', 'Taxable (₹)', 'Input GST (ITC)', 'Grand Total (₹)'];
    const rows = filteredPurchases.map(p => [
      p.invoiceNo,
      p.invoiceDate,
      p.distributorName,
      p.distributorGstin || '33AABCS8891Q1Z8',
      (p.items || []).length,
      p.paymentStatus || 'Credit',
      (p.subtotal ?? 0).toFixed(2),
      (p.totalTax ?? 0).toFixed(2),
      (p.grandTotal ?? 0).toFixed(2)
    ]);
    exportReportToExcel('Pharmaceutical-Inward-Purchase-Report.xlsx', 'Inward Purchases', headers, rows, {
      title: 'Pharmaceutical Inward Purchase Report & ITC Register',
      subtitle: `Total Inward Purchases: ₹${totalPurchaseInwardGross.toFixed(2)}`
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Truck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Wholesale & B2B Distribution Hub</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Wholesale Sales, Purchases & Accounts Hub</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Complete B2B sales register, chemist credit tracking & payment pending, wholesale sales return, 
              inward entry from pharmaceuticals, debit notes, and purchase reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (onNavigateToPurchases) onNavigateToPurchases();
                else setActiveTab('purchase-entry');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Purchase Entry</span>
            </button>

            <button
              onClick={() => {
                setSelectedBuyerForPayment(wholesaleBuyers[0] || null);
                setShowPaymentModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span>Record Payment Received</span>
            </button>
          </div>
        </div>

        {/* Wholesale KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-indigo-300">Wholesale B2B Sales</span>
            <div className="text-lg sm:text-xl font-black text-white">₹{totalWholesaleGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <span className="text-[10px] text-slate-300">{wholesaleSales.length} Tax Invoices</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-amber-300">Pending Credit Due</span>
            <div className="text-lg sm:text-xl font-black text-amber-400">₹{totalOutstandingCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <span className="text-[10px] text-slate-300">{pendingSalesInvoices.length} Unsettled Bills</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-emerald-300">Inward from Pharma</span>
            <div className="text-lg sm:text-xl font-black text-emerald-400">₹{totalPurchaseInwardGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <span className="text-[10px] text-slate-300">Input ITC: ₹{totalPurchaseITC.toFixed(0)}</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-rose-300">Debit Notes Issued</span>
            <div className="text-lg sm:text-xl font-black text-rose-400">₹{totalDebitNotesValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <span className="text-[10px] text-slate-300">{filteredDebitNotes.length} Supplier Returns</span>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6 DEDICATED WHOLESALE WORKSPACE BUTTONS                                    */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Wholesale Sales Report */}
          <button
            onClick={() => setActiveTab('sales-report')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'sales-report'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4 text-indigo-400" />
            <span>Wholesale Sales Report</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${activeTab === 'sales-report' ? 'bg-slate-800 text-indigo-300' : 'bg-slate-100 text-slate-600'}`}>
              {wholesaleSales.length}
            </span>
          </button>

          {/* 2. Wholesale Payment Pending */}
          <button
            onClick={() => setActiveTab('payment-pending')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'payment-pending'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>Wholesale Payment Pending</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${activeTab === 'payment-pending' ? 'bg-slate-800 text-amber-300' : 'bg-amber-50 text-amber-800'}`}>
              ₹{totalOutstandingCredit.toFixed(0)}
            </span>
          </button>

          {/* 3. Wholesale Sales Return */}
          <button
            onClick={() => setActiveTab('sales-return')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'sales-return'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Wholesale Sales Return</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${activeTab === 'sales-return' ? 'bg-slate-800 text-rose-300' : 'bg-slate-100 text-slate-600'}`}>
              Credit Notes
            </span>
          </button>

          {/* 4. Wholesale Purchase Entry from Pharmaceuticals */}
          <button
            onClick={() => {
              if (onNavigateToPurchases) onNavigateToPurchases();
              else setActiveTab('purchase-entry');
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'purchase-entry'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-teal-400" />
            <span>Purchase Entry (Pharma)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${activeTab === 'purchase-entry' ? 'bg-slate-800 text-teal-300' : 'bg-teal-50 text-teal-800'}`}>
              Inward
            </span>
          </button>

          {/* 5. Wholesale Purchase Return */}
          <button
            onClick={() => setActiveTab('purchase-return')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'purchase-return'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileMinus className="w-4 h-4 text-orange-400" />
            <span>Wholesale Purchase Return</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${activeTab === 'purchase-return' ? 'bg-slate-800 text-orange-300' : 'bg-slate-100 text-slate-600'}`}>
              Debit Notes
            </span>
          </button>

          {/* 6. Wholesale Purchase Report */}
          <button
            onClick={() => setActiveTab('purchase-report')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'purchase-report'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Wholesale Purchase Report</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${activeTab === 'purchase-report' ? 'bg-slate-800 text-emerald-300' : 'bg-emerald-50 text-emerald-800'}`}>
              ITC Register
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. WHOLESALE SALES REPORT                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'sales-report' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Buyer Chemist, GSTIN, Invoice #..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedDateRange}
                onChange={e => setSelectedDateRange(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="month">This Month</option>
              </select>

              <button
                onClick={handleExportSalesExcel}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-3">Invoice #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Buyer (Chemist / Hospital)</th>
                    <th className="py-3 px-3">GSTIN & Drug License</th>
                    <th className="py-3 px-3 text-center">Items</th>
                    <th className="py-3 px-3 text-right">Taxable (₹)</th>
                    <th className="py-3 px-3 text-right">GST (₹)</th>
                    <th className="py-3 px-3 text-right font-black">Grand Total (₹)</th>
                    <th className="py-3 px-3 text-center">Payment</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wholesaleSales.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No wholesale B2B invoices recorded yet. Start a wholesale sale from POS by toggling "Wholesale (B2B)".
                      </td>
                    </tr>
                  ) : (
                    wholesaleSales.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{tx.id}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {tx.buyerBusinessName || tx.wholesaleBuyerName || tx.patientName}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {tx.buyerAddress || tx.patientAddress || 'Melur Market'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          <div>GST: {tx.buyerGstin || tx.wholesaleBuyerGstin || 'Unregistered'}</div>
                          <div className="text-[10px] text-slate-400">DL: {tx.buyerDrugLicense || tx.wholesaleBuyerDrugLicense || 'TN-MDU-R20/21'}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-700">{(tx.items || []).length} items</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">₹{(tx.subtotal ?? 0).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">₹{(tx.totalTax ?? 0).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-900">
                          ₹{(tx.grandTotal ?? 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {tx.paymentStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setViewingTransaction(tx)}
                            className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] cursor-pointer"
                          >
                            View B2B Bill
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WHOLESALE PAYMENT PENDING (ACCOUNTS RECEIVABLE)                         */}
      {/* ========================================================================= */}
      {activeTab === 'payment-pending' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 text-sm">Wholesale Payment Pending & Chemist Credit Aging</h3>
              <p className="text-xs text-slate-500">Track outstanding due balances, credit limits, and record payment collections</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedBuyerForPayment(wholesaleBuyers[0] || null);
                  setShowPaymentModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Payment Received</span>
              </button>
            </div>
          </div>

          {/* Wholesale Buyers Credit Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-3">Chemist / Hospital Name</th>
                    <th className="py-3 px-3">GSTIN & License</th>
                    <th className="py-3 px-3">Contact Phone</th>
                    <th className="py-3 px-3 text-right">Credit Limit (₹)</th>
                    <th className="py-3 px-3 text-right font-black text-rose-700">Outstanding Due (₹)</th>
                    <th className="py-3 px-3 text-center">Credit Term</th>
                    <th className="py-3 px-3 text-center">Aging Status</th>
                    <th className="py-3 px-3 text-center">Collection Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wholesaleBuyers.map(b => {
                    const isOverdue = (b.outstandingBalance || 0) > (b.creditLimit || 50000);
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {b.businessName}
                          <div className="text-[10px] text-slate-400 font-normal">{b.address}, {b.city}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          <div>{b.gstin}</div>
                          <div className="text-[10px] text-slate-400">{b.drugLicenseNo}</div>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-700">{b.phone}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">₹{(b.creditLimit || 50000).toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-mono font-black text-rose-600 text-sm">
                          ₹{(b.outstandingBalance || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">{b.creditDays || 30} Days</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              (b.outstandingBalance || 0) === 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-800 animate-pulse'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {(b.outstandingBalance || 0) === 0 ? 'Nil Due' : isOverdue ? 'Credit Exceeded' : 'Due Normal'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedBuyerForPayment(b);
                              setPayAmount(b.outstandingBalance || 5000);
                              setShowPaymentModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            Collect ₹
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Receipts History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Recent Wholesale Payment Receipts Collected</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 font-bold">Receipt #</th>
                    <th className="py-2 px-3 font-bold">Date</th>
                    <th className="py-2 px-3 font-bold">Wholesale Buyer</th>
                    <th className="py-2 px-3 font-bold">Payment Mode</th>
                    <th className="py-2 px-3 font-bold">Ref / UTR No</th>
                    <th className="py-2 px-3 font-bold text-right">Amount Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wholesalePayments.map(p => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">{p.id}</td>
                      <td className="py-2 px-3 text-slate-600">{p.date}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{p.buyerName}</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                          {p.paymentMode}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">{p.referenceNo || '-'}</td>
                      <td className="py-2 px-3 font-mono font-bold text-right text-emerald-700">
                        ₹{p.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. WHOLESALE SALES RETURN (CREDIT NOTES)                                   */}
      {/* ========================================================================= */}
      {activeTab === 'sales-return' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 text-sm">Wholesale Sales Return & B2B Credit Notes</h3>
              <p className="text-xs text-slate-500">Record customer returns from chemists, overstock adjustments, and issue GST Credit Notes</p>
            </div>

            <button
              onClick={() => setShowReturnModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue Credit Note / Sales Return</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-3">Credit Note #</th>
                    <th className="py-3 px-3">Original Invoice #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Chemist / Buyer</th>
                    <th className="py-3 px-3">Returned Medicine & Batch</th>
                    <th className="py-3 px-3">Reason</th>
                    <th className="py-3 px-3 text-right">Credit Amount (₹)</th>
                    <th className="py-3 px-3 text-center">Restocked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wholesaleReturnsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No wholesale sales returns recorded.
                      </td>
                    </tr>
                  ) : (
                    wholesaleReturnsList.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.id}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{r.invoiceId}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{r.customerName || r.patientName}</td>
                        <td className="py-2.5 px-3">
                          {r.items.map((item, idx) => (
                            <div key={idx} className="font-semibold text-slate-800">
                              {item.medicineName} ({item.quantity} units, Batch: {item.batchNumber})
                            </div>
                          ))}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{r.items[0]?.reason || r.notes}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-rose-700">
                          ₹{(r.refundAmount ?? r.totalRefundAmount ?? 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Restocked
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PURCHASE ENTRY FROM PHARMACEUTICALS                                    */}
      {/* ========================================================================= */}
      {activeTab === 'purchase-entry' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 text-center">
          <Building2 className="w-12 h-12 text-teal-600 mx-auto" />
          <h3 className="text-lg font-black text-slate-900">Wholesale Purchase Entry from Pharmaceuticals</h3>
          <p className="text-xs text-slate-600 max-w-lg mx-auto">
            Record inward goods received from pharmaceutical manufacturers (Sun Pharma, Cipla, Alkem, Mankind, Torrent)
            with master shipper cases, boxes, free scheme bonus packs, and GST Input Tax Credit (ITC).
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                if (onNavigateToPurchases) onNavigateToPurchases();
                else setActiveTab('purchase-report');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Open Full Inward Purchase Entry Workspace</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. WHOLESALE PURCHASE RETURN (DEBIT NOTES TO PHARMA DISTRIBUTORS)          */}
      {/* ========================================================================= */}
      {activeTab === 'purchase-return' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 text-sm">Wholesale Purchase Return & Supplier Debit Notes</h3>
              <p className="text-xs text-slate-500">Return expired, damaged, or recalled medicines to pharmaceutical super-stockists and adjust accounts payable</p>
            </div>

            <button
              onClick={() => setShowDebitModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue Debit Note to Supplier</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-3">Debit Note #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Pharmaceutical Supplier</th>
                    <th className="py-3 px-3">Returned Medicine & Batch</th>
                    <th className="py-3 px-3">Quantity</th>
                    <th className="py-3 px-3">Return Reason</th>
                    <th className="py-3 px-3 text-right">Debit Amount (₹)</th>
                    <th className="py-3 px-3 text-center">Ledger Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDebitNotes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No purchase returns or debit notes recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredDebitNotes.map(pr => (
                      <tr key={pr.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{pr.debitNoteNumber}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{pr.returnDate}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{pr.supplierName}</td>
                        <td className="py-2.5 px-3">
                          {pr.items.map((i, idx) => (
                            <div key={idx} className="font-semibold text-slate-800">
                              {i.medicineName} (Batch: {i.batchNumber})
                            </div>
                          ))}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{pr.items[0]?.quantity} units</td>
                        <td className="py-2.5 px-3 text-slate-600">{pr.items[0]?.reason}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-orange-700">
                          ₹{pr.totalDebitAmount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Adjusted in Payables
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. WHOLESALE PURCHASE REPORT (PHARMA INWARD ITC REGISTER)                  */}
      {/* ========================================================================= */}
      {activeTab === 'purchase-report' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Pharmaceutical Supplier, Bill #..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
              />
            </div>

            <button
              onClick={handleExportPurchasesExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Inward Register (Excel)</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-3">Inward Bill #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Pharmaceutical Supplier</th>
                    <th className="py-3 px-3">GSTIN</th>
                    <th className="py-3 px-3 text-center">Items</th>
                    <th className="py-3 px-3 text-right">Taxable (₹)</th>
                    <th className="py-3 px-3 text-right font-bold text-teal-700">Input GST (ITC)</th>
                    <th className="py-3 px-3 text-right font-black text-slate-900">Total Bill (₹)</th>
                    <th className="py-3 px-3 text-center">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPurchases.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.invoiceNo}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{p.invoiceDate}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{p.distributorName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{p.distributorGstin || '33AABCS8891Q1Z8'}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700">{(p.items || []).length}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">₹{(p.subtotal ?? 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-700">₹{(p.totalTax ?? 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">₹{(p.grandTotal ?? 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {p.paymentStatus || 'Credit'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: RECORD WHOLESALE PAYMENT RECEIVED                                */}
      {/* ========================================================================= */}
      {showPaymentModal && selectedBuyerForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Record Wholesale Payment Received</h3>
                <p className="text-xs text-slate-500">Buyer: {selectedBuyerForPayment.businessName}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePaymentCollection} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Chemist / Wholesale Buyer:</label>
                <select
                  value={selectedBuyerForPayment.id}
                  onChange={e => {
                    const b = wholesaleBuyers.find(item => item.id === e.target.value);
                    if (b) {
                      setSelectedBuyerForPayment(b);
                      setPayAmount(b.outstandingBalance || 5000);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  {wholesaleBuyers.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.businessName} (Due: ₹{(b.outstandingBalance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount Collected (₹) *</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={e => setPayMode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Bank_NEFT">Bank NEFT / RTGS</option>
                    <option value="UPI">UPI / QR Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cheque / UTR Ref No</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-98214"
                    value={payRefNo}
                    onChange={e => setPayRefNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={payBankName}
                  onChange={e => setPayBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Collection & Update Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NEW WHOLESALE SALES RETURN (CREDIT NOTE)                          */}
      {/* ========================================================================= */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Issue Wholesale Credit Note</h3>
                <p className="text-xs text-slate-500">Record customer chemist return and adjust ledger</p>
              </div>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSalesReturn} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Chemist Buyer</label>
                <select
                  value={selectedBuyerFilter}
                  onChange={e => setSelectedBuyerFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  {wholesaleBuyers.map(b => (
                    <option key={b.id} value={b.businessName}>{b.businessName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Original Invoice #</label>
                <input
                  type="text"
                  value={returnInvoiceId}
                  placeholder="e.g. INV-2026-4821"
                  onChange={e => setReturnInvoiceId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Credit Adjustment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={returnAmount}
                  onChange={e => setReturnAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Return Reason</label>
                <select
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Short Expiry / Overstock return from Chemist">Short Expiry / Overstock return from Chemist</option>
                  <option value="Damaged Shipper / Breakage">Damaged Shipper / Breakage</option>
                  <option value="Customer Physician Discontinued Therapy">Customer Physician Discontinued Therapy</option>
                  <option value="Billing Rate Correction">Billing Rate Correction</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Issue Credit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: NEW WHOLESALE DEBIT NOTE TO PHARMA SUPPLIER                       */}
      {/* ========================================================================= */}
      {showDebitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Issue Debit Note to Pharma Supplier</h3>
                <p className="text-xs text-slate-500">Return expired or damaged stock to manufacturer distributor</p>
              </div>
              <button onClick={() => setShowDebitModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePurchaseReturn} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pharmaceutical Supplier</label>
                <select
                  value={debitSupplierId}
                  onChange={e => setDebitSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Medicine to Return</label>
                <select
                  value={debitMedicineId}
                  onChange={e => setDebitMedicineId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  {medicines.slice(0, 15).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.genericName})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity (Units / Strips)</label>
                  <input
                    type="number"
                    value={debitQuantity}
                    onChange={e => setDebitQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Return Reason</label>
                  <select
                    value={debitReason}
                    onChange={e => setDebitReason(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Expired Stock">Expired Stock</option>
                    <option value="Damaged in Transit">Damaged in Transit</option>
                    <option value="Recalled by Manufacturer">Recalled by Manufacturer</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDebitModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Issue Debit Note & Adjust Payables
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal for Viewing and Printing */}
      {viewingTransaction && (
        <PrintInvoiceModal
          isOpen={true}
          onClose={() => setViewingTransaction(null)}
          transaction={viewingTransaction}
        />
      )}
    </div>
  );
};
