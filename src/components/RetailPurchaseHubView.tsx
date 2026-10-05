import React, { useState, useMemo } from 'react';
import {
  Building2,
  CreditCard,
  Clock,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Search,
  Download,
  Printer,
  Eye,
  History,
  Smartphone,
  Banknote,
  Building,
  FileText,
  Plus,
  Phone,
  Mail,
  MapPin,
  ArrowUpRight,
  RefreshCw,
  X,
  Filter,
  AlertCircle,
  Truck,
  Receipt,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  PurchaseInvoice,
  Supplier,
  SupplierPaymentEntry,
  Medicine
} from '../types';
import { StorageService } from '../services/storage';
import { SupplierPaymentModal } from './SupplierPaymentModal';
import {
  exportReportToExcel,
  exportReportToPDF,
  exportReportToCSV,
  printReportWindow
} from '../utils/exportUtils';
import { VoiceInputButton } from './VoiceInputButton';

export type RetailPurchaseTab = 'payment-pending' | 'payment-report' | 'supplier-list' | 'all-purchases';

interface RetailPurchaseHubViewProps {
  initialTab?: RetailPurchaseTab;
  onRefreshData?: () => void;
  onNavigateToPurchases?: () => void;
}

export const RetailPurchaseHubView: React.FC<RetailPurchaseHubViewProps> = ({
  initialTab = 'payment-pending',
  onRefreshData,
  onNavigateToPurchases
}) => {
  const [activeTab, setActiveTab] = useState<RetailPurchaseTab>(initialTab);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>(() => StorageService.getPurchaseInvoices());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => StorageService.getSuppliers());

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('all');
  const [pendingFilter, setPendingFilter] = useState<'all' | 'overdue' | 'due-7d' | 'paid'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'fy' | 'custom'>('month');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<PurchaseInvoice | null>(null);
  const [defaultPaymentType, setDefaultPaymentType] = useState<'FULL' | 'PART'>('FULL');

  // Viewing detail modal & history
  const [viewingInvoice, setViewingInvoice] = useState<PurchaseInvoice | null>(null);
  const [expandedHistoryInvoiceId, setExpandedHistoryInvoiceId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Supplier Modal state
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');
  const [newSupplierGstin, setNewSupplierGstin] = useState('');
  const [newSupplierDl, setNewSupplierDl] = useState('');
  const [newSupplierTerms, setNewSupplierTerms] = useState<'Net 15' | 'Net 30' | 'Net 45' | 'Immediate'>('Net 30');

  // Reload data
  const reload = () => {
    setInvoices(StorageService.getPurchaseInvoices());
    setSuppliers(StorageService.getSuppliers());
    if (onRefreshData) onRefreshData();
  };

  // Helper to compute invoice finances & aging
  const getInvoiceFinance = (inv: PurchaseInvoice) => {
    const grandTotal = inv.grandTotal || 0;
    const paidAmount = inv.paidAmount != null ? inv.paidAmount : (inv.paymentStatus === 'Paid' ? grandTotal : 0);
    const balanceAmount = inv.balanceAmount != null ? inv.balanceAmount : Math.max(0, grandTotal - paidAmount);
    const dueDateStr = inv.paymentDueDate || (inv as any).dueDate || '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let isOverdue = false;
    let daysOverdue = 0;
    let daysRemaining = 0;

    if (dueDateStr && balanceAmount > 0.001) {
      const due = new Date(dueDateStr);
      due.setHours(0, 0, 0, 0);
      if (due < today) {
        isOverdue = true;
        daysOverdue = Math.round((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        daysRemaining = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    const calculatedStatus: 'Paid' | 'Partially Paid' | 'Unpaid' =
      balanceAmount <= 0.001 ? 'Paid' : paidAmount > 0 ? 'Partially Paid' : 'Unpaid';

    return {
      grandTotal,
      paidAmount,
      balanceAmount,
      dueDateStr,
      isOverdue,
      daysOverdue,
      daysRemaining,
      calculatedStatus
    };
  };

  // Filtered Invoices by Date & Supplier
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Date filter
      const invDate = new Date(inv.invoiceDate);
      const now = new Date();
      let inDate = true;

      if (dateRange === 'today') {
        inDate = invDate.toDateString() === now.toDateString();
      } else if (dateRange === 'yesterday') {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        inDate = invDate.toDateString() === yest.toDateString();
      } else if (dateRange === '7d') {
        const past = new Date();
        past.setDate(past.getDate() - 7);
        inDate = invDate >= past;
      } else if (dateRange === '30d') {
        const past = new Date();
        past.setDate(past.getDate() - 30);
        inDate = invDate >= past;
      } else if (dateRange === 'month') {
        inDate = invDate.getFullYear() === now.getFullYear() && invDate.getMonth() === now.getMonth();
      } else if (dateRange === 'fy') {
        const curYear = now.getFullYear();
        const fyStart = new Date(curYear, 3, 1);
        inDate = invDate >= fyStart;
      } else if (dateRange === 'custom') {
        if (startDate && inv.invoiceDate < startDate) inDate = false;
        if (endDate && inv.invoiceDate > endDate) inDate = false;
      }
      if (!inDate) return false;

      // Supplier filter
      if (selectedSupplierFilter !== 'all' && inv.distributorId !== selectedSupplierFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const no = (inv.invoiceNo || (inv as any).invoiceNumber || '').toLowerCase();
        const sup = (inv.distributorName || '').toLowerCase();
        const itemsMatch = (inv.items || []).some(
          it => it.medicineName.toLowerCase().includes(q) || (it.genericName && it.genericName.toLowerCase().includes(q))
        );
        if (!no.includes(q) && !sup.includes(q) && !itemsMatch) return false;
      }

      return true;
    });
  }, [invoices, dateRange, startDate, endDate, selectedSupplierFilter, searchQuery]);

  // Dues Financial KPIs
  const duesKPIs = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    let overdueAmount = 0;
    let overdueCount = 0;
    let pendingCount = 0;
    let dueSoonCount = 0;
    let paidCount = 0;

    filteredInvoices.forEach(inv => {
      const fin = getInvoiceFinance(inv);
      totalInvoiced += fin.grandTotal;
      totalPaid += fin.paidAmount;
      totalBalance += fin.balanceAmount;

      if (fin.balanceAmount > 0.001) {
        pendingCount += 1;
        if (fin.isOverdue) {
          overdueCount += 1;
          overdueAmount += fin.balanceAmount;
        } else if (fin.daysRemaining <= 7) {
          dueSoonCount += 1;
        }
      } else {
        paidCount += 1;
      }
    });

    return {
      totalInvoiced,
      totalPaid,
      totalBalance,
      overdueAmount,
      overdueCount,
      pendingCount,
      dueSoonCount,
      paidCount,
      totalBills: filteredInvoices.length
    };
  }, [filteredInvoices]);

  // Invoices filtered by pending status
  const pendingInvoicesList = useMemo(() => {
    return filteredInvoices.filter(inv => {
      const fin = getInvoiceFinance(inv);
      if (pendingFilter === 'all') {
        return fin.balanceAmount > 0.001;
      }
      if (pendingFilter === 'overdue') {
        return fin.isOverdue;
      }
      if (pendingFilter === 'due-7d') {
        return fin.balanceAmount > 0.001 && !fin.isOverdue && fin.daysRemaining <= 7;
      }
      if (pendingFilter === 'paid') {
        return fin.balanceAmount <= 0.001;
      }
      return true;
    });
  }, [filteredInvoices, pendingFilter]);

  // All recorded payment transactions for the Payment Report tab
  const recordedPaymentsList = useMemo(() => {
    const list: {
      payment: SupplierPaymentEntry;
      invoice: PurchaseInvoice;
      finance: ReturnType<typeof getInvoiceFinance>;
    }[] = [];

    filteredInvoices.forEach(inv => {
      const fin = getInvoiceFinance(inv);
      (inv.payments || []).forEach(p => {
        // filter by payment method
        if (paymentMethodFilter !== 'all' && p.paymentMethod !== paymentMethodFilter) {
          return;
        }
        list.push({
          payment: p,
          invoice: inv,
          finance: fin
        });
      });
    });

    // Sort newest payment first
    return list.sort((a, b) => new Date(b.payment.date).getTime() - new Date(a.payment.date).getTime());
  }, [filteredInvoices, paymentMethodFilter]);

  // Payment Breakdown Summary
  const paymentBreakdown = useMemo(() => {
    let totalSettled = 0;
    let upiAmount = 0;
    let bankAmount = 0;
    let cashAmount = 0;
    let chequeAmount = 0;

    recordedPaymentsList.forEach(item => {
      const amt = Number(item.payment.amount) || 0;
      totalSettled += amt;
      if (item.payment.paymentMethod === 'UPI') upiAmount += amt;
      else if (item.payment.paymentMethod === 'Bank_Transfer') bankAmount += amt;
      else if (item.payment.paymentMethod === 'Cash') cashAmount += amt;
      else if (item.payment.paymentMethod === 'Cheque') chequeAmount += amt;
    });

    return {
      totalSettled,
      upiAmount,
      bankAmount,
      cashAmount,
      chequeAmount,
      count: recordedPaymentsList.length
    };
  }, [recordedPaymentsList]);

  // Suppliers with calculated pending dues
  const suppliersWithDues = useMemo(() => {
    return suppliers.map(s => {
      const supplierInvoices = invoices.filter(inv => inv.distributorId === s.id);
      let totalBilled = 0;
      let totalPaid = 0;
      let totalPending = 0;
      let overdueBillsCount = 0;

      supplierInvoices.forEach(inv => {
        const fin = getInvoiceFinance(inv);
        totalBilled += fin.grandTotal;
        totalPaid += fin.paidAmount;
        totalPending += fin.balanceAmount;
        if (fin.isOverdue) overdueBillsCount += 1;
      });

      return {
        supplier: s,
        invoicesCount: supplierInvoices.length,
        totalBilled,
        totalPaid,
        totalPending: totalPending > 0 ? totalPending : (s.outstandingPayable || 0),
        overdueBillsCount
      };
    }).sort((a, b) => b.totalPending - a.totalPending);
  }, [suppliers, invoices]);

  // Payment Actions Handlers
  const handleOpenFullPayment = (inv: PurchaseInvoice) => {
    setPaymentTargetInvoice(inv);
    setDefaultPaymentType('FULL');
    setShowPaymentModal(true);
  };

  const handleOpenPartPayment = (inv: PurchaseInvoice) => {
    setPaymentTargetInvoice(inv);
    setDefaultPaymentType('PART');
    setShowPaymentModal(true);
  };

  // Add Supplier Handler
  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim() || !newSupplierPhone.trim()) {
      return;
    }

    const newSup: Supplier = {
      id: `sup-${Date.now().toString().slice(-4)}`,
      name: newSupplierName.trim(),
      contactPerson: newSupplierContact.trim() || newSupplierName.trim(),
      phone: newSupplierPhone.trim(),
      email: newSupplierEmail.trim() || 'orders@pharma-distributor.com',
      address: newSupplierAddress.trim() || 'Wholesale Pharma Complex, Tamil Nadu',
      gstin: newSupplierGstin.trim().toUpperCase() || '33AABCM9124Q1Z2',
      drugLicenseNo: newSupplierDl.trim().toUpperCase() || 'TN-MDU-20B-99124',
      paymentTerms: newSupplierTerms,
      outstandingPayable: 0,
      rating: 5.0
    };

    const updated = StorageService.getSuppliers();
    updated.unshift(newSup);
    StorageService.saveSuppliers(updated);
    reload();
    setShowAddSupplierModal(false);
    setToastMessage(`Supplier "${newSup.name}" added successfully.`);
    setTimeout(() => setToastMessage(null), 5000);

    // reset fields
    setNewSupplierName('');
    setNewSupplierContact('');
    setNewSupplierPhone('');
    setNewSupplierEmail('');
    setNewSupplierAddress('');
    setNewSupplierGstin('');
    setNewSupplierDl('');
  };

  // =========================================================================
  // EXPORT HANDLERS FOR RETAIL PAYMENT PENDING
  // =========================================================================
  const handleExportPendingPDF = () => {
    const headers = ['Date', 'Bill No', 'Supplier Name', 'Bill Amt (₹)', 'Paid (₹)', 'Pending (₹)', 'Due Date', 'Status'];
    const rows = pendingInvoicesList.map(inv => {
      const fin = getInvoiceFinance(inv);
      return [
        inv.invoiceDate,
        inv.invoiceNo || (inv as any).invoiceNumber || inv.id,
        inv.distributorName,
        fin.grandTotal.toFixed(2),
        fin.paidAmount.toFixed(2),
        fin.balanceAmount.toFixed(2),
        fin.dueDateStr ? (fin.isOverdue ? `${fin.dueDateStr} (${fin.daysOverdue}d Overdue)` : fin.dueDateStr) : 'Immediate',
        fin.calculatedStatus
      ];
    });

    exportReportToPDF({
      title: 'RETAIL PURCHASE PAYMENT PENDING STATEMENT',
      subtitle: `Scope: ${pendingFilter.toUpperCase()} | Total Pay Pending: ₹${duesKPIs.totalBalance.toFixed(2)} | Overdue: ₹${duesKPIs.overdueAmount.toFixed(2)}`,
      filename: `Retail_Payment_Pending_${pendingFilter}_${new Date().toISOString().split('T')[0]}.pdf`,
      headers,
      rows,
      summaryRows: [
        { label: 'Pending Bills Count', value: pendingInvoicesList.length },
        { label: 'Total Pending Liabilities', value: `₹${duesKPIs.totalBalance.toFixed(2)}` },
        { label: 'Critical Overdue Amount', value: `₹${duesKPIs.overdueAmount.toFixed(2)} (${duesKPIs.overdueCount} bills)` }
      ],
      summaryCards: [
        { label: 'Pending Dues (₹)', value: duesKPIs.totalBalance.toFixed(2) },
        { label: 'Overdue Dues (₹)', value: duesKPIs.overdueAmount.toFixed(2) },
        { label: 'Pending Bills', value: duesKPIs.pendingCount },
        { label: 'Suppliers with Dues', value: suppliersWithDues.filter(s => s.totalPending > 0).length }
      ],
      orientation: 'landscape'
    });
    setToastMessage('Downloaded Retail Payment Pending Report as PDF.');
  };

  const handleExportPendingExcel = () => {
    const filename = `Retail_Payment_Pending_${pendingFilter}_${new Date().toISOString().split('T')[0]}`;
    const headers = [
      'Bill Date',
      'Invoice Number',
      'Distributor / Supplier',
      'Total Bill (₹)',
      'Paid Amount (₹)',
      'Pending Balance (₹)',
      'Due Date',
      'Aging Status',
      'Payment Status'
    ];

    const rows = pendingInvoicesList.map(inv => {
      const fin = getInvoiceFinance(inv);
      return [
        inv.invoiceDate,
        inv.invoiceNo || (inv as any).invoiceNumber || inv.id,
        inv.distributorName,
        fin.grandTotal.toFixed(2),
        fin.paidAmount.toFixed(2),
        fin.balanceAmount.toFixed(2),
        fin.dueDateStr || 'N/A',
        fin.isOverdue ? `${fin.daysOverdue} days Overdue` : fin.daysRemaining > 0 ? `Due in ${fin.daysRemaining} days` : 'On Time',
        fin.calculatedStatus
      ];
    });

    exportReportToExcel(filename, 'Retail Pending Dues', headers, rows, {
      title: 'RETAIL PURCHASE PAYMENT PENDING AUDIT',
      subtitle: `Total Outstanding Balance: ₹${duesKPIs.totalBalance.toLocaleString('en-IN')}`,
      summary: [
        { label: 'Pending Bills Count', value: pendingInvoicesList.length },
        { label: 'Total Remaining Balance', value: `₹${duesKPIs.totalBalance.toLocaleString('en-IN')}` },
        { label: 'Overdue Payable Amount', value: `₹${duesKPIs.overdueAmount.toLocaleString('en-IN')}` }
      ]
    });
    setToastMessage('Downloaded Retail Payment Pending Report as Excel (XLS).');
  };

  const handleExportPendingCSV = () => {
    const filename = `Retail_Payment_Pending_${pendingFilter}_${new Date().toISOString().split('T')[0]}`;
    const headers = [
      'Bill Date',
      'Invoice No',
      'Supplier',
      'Total Bill (₹)',
      'Paid Amount (₹)',
      'Pending Due (₹)',
      'Due Date',
      'Aging Status',
      'Status'
    ];

    const rows = pendingInvoicesList.map(inv => {
      const fin = getInvoiceFinance(inv);
      return [
        inv.invoiceDate,
        inv.invoiceNo || (inv as any).invoiceNumber || inv.id,
        inv.distributorName,
        fin.grandTotal.toFixed(2),
        fin.paidAmount.toFixed(2),
        fin.balanceAmount.toFixed(2),
        fin.dueDateStr || 'N/A',
        fin.isOverdue ? `${fin.daysOverdue}d Overdue` : fin.daysRemaining > 0 ? `Due in ${fin.daysRemaining}d` : 'On Time',
        fin.calculatedStatus
      ];
    });

    exportReportToCSV(filename, headers, rows, {
      title: 'RETAIL PURCHASE PAYMENT PENDING STATEMENT',
      subtitle: `Generated on ${new Date().toLocaleDateString('en-IN')}`
    });
    setToastMessage('Downloaded Retail Payment Pending Report as CSV.');
  };

  // =========================================================================
  // EXPORT HANDLERS FOR PAYMENT REPORT
  // =========================================================================
  const handleExportPaymentReportPDF = () => {
    const headers = ['Date', 'Bill No', 'Supplier', 'Payment Option', 'Reference / UTR', 'Paid (₹)', 'Remaining (₹)'];
    const rows = recordedPaymentsList.map(item => [
      item.payment.date ? new Date(item.payment.date).toLocaleDateString('en-IN') : 'N/A',
      item.invoice.invoiceNo || (item.invoice as any).invoiceNumber || item.invoice.id,
      item.invoice.distributorName,
      item.payment.paymentMethod.replace('_', ' '),
      item.payment.referenceNo || '—',
      Number(item.payment.amount).toFixed(2),
      item.finance.balanceAmount.toFixed(2)
    ]);

    exportReportToPDF({
      title: 'RETAIL PURCHASE PAYMENT SETTLEMENT REPORT',
      subtitle: `Total Paid to Suppliers: ₹${paymentBreakdown.totalSettled.toFixed(2)} | Transactions: ${paymentBreakdown.count}`,
      filename: `Retail_Purchase_Payments_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      headers,
      rows,
      summaryCards: [
        { label: 'Total Paid (₹)', value: paymentBreakdown.totalSettled.toFixed(2) },
        { label: 'UPI Payments (₹)', value: paymentBreakdown.upiAmount.toFixed(2) },
        { label: 'Bank Transfer (₹)', value: paymentBreakdown.bankAmount.toFixed(2) },
        { label: 'Cash Payments (₹)', value: paymentBreakdown.cashAmount.toFixed(2) }
      ],
      orientation: 'landscape'
    });
    setToastMessage('Downloaded Retail Purchase Payment Report as PDF.');
  };

  const handleExportPaymentReportExcel = () => {
    const filename = `Retail_Purchase_Payments_Report_${new Date().toISOString().split('T')[0]}`;
    const headers = [
      'Payment Date',
      'Invoice No',
      'Supplier / Sublayer',
      'Payment Option',
      'Transaction Ref / UTR / Cheque',
      'Amount Settled (₹)',
      'Remaining Balance (₹)',
      'Recorded By',
      'Notes'
    ];

    const rows = recordedPaymentsList.map(item => [
      item.payment.date ? new Date(item.payment.date).toLocaleString('en-IN') : 'N/A',
      item.invoice.invoiceNo || (item.invoice as any).invoiceNumber || item.invoice.id,
      item.invoice.distributorName,
      item.payment.paymentMethod.replace('_', ' '),
      item.payment.referenceNo || '—',
      Number(item.payment.amount).toFixed(2),
      item.finance.balanceAmount.toFixed(2),
      item.payment.recordedBy || 'Accounts Desk',
      item.payment.notes || '—'
    ]);

    exportReportToExcel(filename, 'Payment History', headers, rows, {
      title: 'RETAIL PURCHASE PAYMENT SETTLEMENT REGISTER',
      subtitle: `Total Settled: ₹${paymentBreakdown.totalSettled.toLocaleString('en-IN')}`,
      summary: [
        { label: 'Total Amount Settled', value: `₹${paymentBreakdown.totalSettled.toLocaleString('en-IN')}` },
        { label: 'UPI (GPay / PhonePe)', value: `₹${paymentBreakdown.upiAmount.toLocaleString('en-IN')}` },
        { label: 'Bank Transfer (NEFT/RTGS)', value: `₹${paymentBreakdown.bankAmount.toLocaleString('en-IN')}` },
        { label: 'Cash at Counter', value: `₹${paymentBreakdown.cashAmount.toLocaleString('en-IN')}` },
        { label: 'Cheque Clearance', value: `₹${paymentBreakdown.chequeAmount.toLocaleString('en-IN')}` }
      ]
    });
    setToastMessage('Downloaded Retail Purchase Payment Report as Excel (XLS).');
  };

  const handleExportPaymentReportCSV = () => {
    const filename = `Retail_Purchase_Payments_Report_${new Date().toISOString().split('T')[0]}`;
    const headers = [
      'Date',
      'Invoice No',
      'Supplier',
      'Payment Option',
      'Reference / UTR',
      'Amount (₹)',
      'Remaining Balance (₹)',
      'Recorded By'
    ];

    const rows = recordedPaymentsList.map(item => [
      item.payment.date ? new Date(item.payment.date).toLocaleString('en-IN') : 'N/A',
      item.invoice.invoiceNo || (item.invoice as any).invoiceNumber || item.invoice.id,
      item.invoice.distributorName,
      item.payment.paymentMethod,
      item.payment.referenceNo || '—',
      Number(item.payment.amount).toFixed(2),
      item.finance.balanceAmount.toFixed(2),
      item.payment.recordedBy || 'Accounts Desk'
    ]);

    exportReportToCSV(filename, headers, rows, {
      title: 'RETAIL PURCHASE PAYMENT SETTLEMENT AUDIT'
    });
    setToastMessage('Downloaded Retail Purchase Payment Report as CSV.');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-bold mb-2">
              <Receipt className="w-3.5 h-3.5" />
              <span>Retail Accounts Payable & Supplier Settlement Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Retail Purchase & Payment Operations</span>
            </h1>
            <p className="text-teal-200/80 text-xs sm:text-sm mt-1 max-w-2xl">
              Track retail pharmacy suppliers, payment pending bills, part payment installments, full settlements, and audit reports with UPI, Bank Transfer, Cash, and Cheque options.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onNavigateToPurchases && (
              <button
                type="button"
                onClick={onNavigateToPurchases}
                className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>New Purchase Entry</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAddSupplierModal(true)}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 border border-white/20 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-teal-300" />
              <span>Add Supplier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Buttons */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {/* 1. Payment Pending Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('payment-pending')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'payment-pending'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 ring-2 ring-amber-500'
              : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
          }`}
          id="tab-retail-payment-pending"
        >
          <Clock className="w-4 h-4" />
          <span>Retail Payment Pending</span>
          {duesKPIs.overdueCount > 0 ? (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black animate-pulse">
              {duesKPIs.overdueCount} Overdue
            </span>
          ) : duesKPIs.pendingCount > 0 ? (
            <span className="px-1.5 py-0.2 bg-amber-900/30 text-amber-100 rounded-full text-[10px] font-bold">
              {duesKPIs.pendingCount} Bills
            </span>
          ) : (
            <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded-full text-[10px] font-bold">
              0 Dues
            </span>
          )}
        </button>

        {/* 2. Purchase Payment Report Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('payment-report')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'payment-report'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 ring-2 ring-teal-500'
              : 'bg-white text-slate-700 hover:bg-teal-50 border border-slate-200'
          }`}
          id="tab-retail-purchase-payment-report"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Retail Purchase Payment Report</span>
          <span className="px-1.5 py-0.2 bg-teal-900/30 text-teal-100 rounded-full text-[10px] font-bold">
            Audit
          </span>
        </button>

        {/* 3. Retail Supplier List Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('supplier-list')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'supplier-list'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-500'
              : 'bg-white text-slate-700 hover:bg-indigo-50 border border-slate-200'
          }`}
          id="tab-retail-supplier-list"
        >
          <Building2 className="w-4 h-4" />
          <span>Retail Supplier List</span>
          <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">
            {suppliers.length} Vendors
          </span>
        </button>

        {/* 4. Inward Bills Register Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('all-purchases')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'all-purchases'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
          id="tab-retail-inward-register"
        >
          <Receipt className="w-4 h-4" />
          <span>All Inward Bills ({filteredInvoices.length})</span>
        </button>
      </div>

      {/* Global Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search bill #, supplier name, molecule..."
            className="w-full pl-9 pr-14 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <VoiceInputButton
              onTranscript={text => setSearchQuery(text)}
              size="xs"
              title="Speak supplier or bill number"
            />
          </div>
        </div>

        {/* Supplier & Period Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Supplier selector */}
          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedSupplierFilter}
              onChange={e => setSelectedSupplierFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-hidden text-xs"
            >
              <option value="all">All Retail Suppliers</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as any)}
              className="bg-transparent font-medium text-slate-700 focus:outline-hidden text-xs"
            >
              <option value="month">This Month</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="fy">Financial Year (FY)</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RETAIL PAYMENT PENDING (PART PAYMENT & FULL PAYMENT ACTIONS)       */}
      {/* ========================================================================= */}
      {activeTab === 'payment-pending' && (
        <div className="space-y-4">
          {/* Financial Dues Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block flex items-center justify-between">
                <span>Total Payment Pending</span>
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-black text-[10px]">
                  Pay Pending
                </span>
              </span>
              <p className="text-2xl font-black text-amber-900 font-mono">
                ₹{duesKPIs.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-amber-800 font-medium block">
                Across {duesKPIs.pendingCount} pending retail invoices
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block flex items-center justify-between">
                <span>Overdue Payables</span>
                {duesKPIs.overdueCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded font-black text-[10px] animate-pulse">
                    Immediate Action
                  </span>
                )}
              </span>
              <p className="text-2xl font-black text-rose-700 font-mono">
                ₹{duesKPIs.overdueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-rose-700 font-bold block flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                <span>{duesKPIs.overdueCount} bills past distributor due date</span>
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Amount Paid So Far
              </span>
              <p className="text-2xl font-black text-emerald-700 font-mono">
                ₹{duesKPIs.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold block">
                {duesKPIs.paidCount} bills fully settled
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Inward Billed
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono">
                ₹{duesKPIs.totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-slate-500 font-medium block">
                {duesKPIs.totalBills} total supplier bills logged
              </span>
            </div>
          </div>

          {/* Pending Filter Bar & Export Buttons */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">Status:</span>
              <button
                type="button"
                onClick={() => setPendingFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  pendingFilter === 'all'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                }`}
              >
                <span>All Pending Dues</span>
                <span className="ml-1.5 text-[10px] font-mono">({duesKPIs.pendingCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setPendingFilter('overdue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  pendingFilter === 'overdue'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                <span>Overdue Bills</span>
                <span className="px-1.5 py-0.2 bg-rose-900/20 rounded font-mono text-[10px]">
                  {duesKPIs.overdueCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPendingFilter('due-7d')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  pendingFilter === 'due-7d'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200'
                }`}
              >
                <Clock className="w-3 h-3 text-indigo-500" />
                <span>Due in 7 Days</span>
                <span className="ml-1 text-[10px] font-mono">({duesKPIs.dueSoonCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setPendingFilter('paid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  pendingFilter === 'paid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Fully Settled</span>
                <span className="ml-1 text-[10px] font-mono">({duesKPIs.paidCount})</span>
              </button>
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-1 hidden lg:inline">
                Download:
              </span>
              <button
                type="button"
                onClick={handleExportPendingPDF}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Download Pending Dues as PDF"
              >
                <Download className="w-3 h-3 text-rose-600" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={handleExportPendingExcel}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Download Pending Dues as Excel (XLS)"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                <span>XLS</span>
              </button>
              <button
                type="button"
                onClick={handleExportPendingCSV}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Download Pending Dues as CSV"
              >
                <Download className="w-3 h-3 text-indigo-600" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Pending Dues Ledger Table with Part Payment & Full Payment Buttons */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3 text-center w-8">#</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Bill No</th>
                    <th className="py-3 px-4">Supplier / Distributor</th>
                    <th className="py-3 px-4 text-right">Bill Amount (₹)</th>
                    <th className="py-3 px-4 text-right">Paid (₹)</th>
                    <th className="py-3 px-4 text-right">Pending Due (₹)</th>
                    <th className="py-3 px-4 text-center">Due Date & Aging</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center w-52">Payment Settlement Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pendingInvoicesList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                        No retail purchase invoices found matching "{pendingFilter}".
                      </td>
                    </tr>
                  ) : (
                    pendingInvoicesList.map((inv, idx) => {
                      const fin = getInvoiceFinance(inv);
                      const isExpanded = expandedHistoryInvoiceId === inv.id;
                      const hasPayments = inv.payments && inv.payments.length > 0;

                      return (
                        <React.Fragment key={inv.id}>
                          <tr className={`hover:bg-teal-50/40 transition-colors ${fin.isOverdue ? 'bg-rose-50/20' : ''}`}>
                            <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4 font-mono font-medium text-slate-600">
                              {inv.invoiceDate}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-extrabold text-slate-900 font-mono">
                                {inv.invoiceNo || (inv as any).invoiceNumber || inv.id}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{inv.distributorName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {inv.distributorPhone ? `Ph: ${inv.distributorPhone}` : 'Vendor ID: ' + inv.distributorId}
                                {inv.distributorGstin ? ` • GSTIN: ${inv.distributorGstin}` : ''}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              ₹{fin.grandTotal.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                              ₹{fin.paidAmount.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {fin.balanceAmount > 0.001 ? (
                                <span className={`inline-block font-mono font-black text-xs px-2 py-0.5 rounded-md ${
                                  fin.isOverdue
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                                }`}>
                                  ₹{fin.balanceAmount.toFixed(2)}
                                </span>
                              ) : (
                                <span className="font-mono text-slate-400 font-medium">₹0.00</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {fin.balanceAmount <= 0.001 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>Settled</span>
                                </span>
                              ) : fin.isOverdue ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs">
                                  <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>{fin.daysOverdue}d Overdue</span>
                                </span>
                              ) : fin.daysRemaining <= 7 && fin.daysRemaining >= 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  <Clock className="w-2.5 h-2.5 text-amber-600" />
                                  <span>Due in {fin.daysRemaining}d</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-mono">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>{fin.dueDateStr || 'Immediate'}</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  fin.calculatedStatus === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : fin.calculatedStatus === 'Partially Paid'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {fin.calculatedStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                {fin.balanceAmount > 0.001 ? (
                                  <>
                                    {/* 1. Full Payment Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenFullPayment(inv)}
                                      className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-black shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                      title={`Pay full balance of ₹${fin.balanceAmount.toFixed(2)}`}
                                      id={`btn-full-pay-${inv.id}`}
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Full Pay</span>
                                    </button>

                                    {/* 2. Part Payment Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPartPayment(inv)}
                                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-black shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                      title={`Make partial installment payment`}
                                      id={`btn-part-pay-${inv.id}`}
                                    >
                                      <DollarSign className="w-3 h-3 text-amber-600" />
                                      <span>Part Pay</span>
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Settled</span>
                                  </span>
                                )}

                                {hasPayments && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedHistoryInvoiceId(isExpanded ? null : inv.id)}
                                    className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                    title={isExpanded ? 'Hide payment installments' : 'View payment installments history'}
                                  >
                                    <History className="w-3.5 h-3.5 text-slate-600" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setViewingInvoice(inv)}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                                  title="View invoice voucher"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Payment Installment History Drawer */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-y border-slate-200">
                              <td colSpan={10} className="py-3 px-6">
                                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <History className="w-4 h-4 text-teal-600" />
                                      <span className="text-xs font-bold text-slate-900">
                                        Recorded Payment Installments for Bill #{inv.invoiceNo || (inv as any).invoiceNumber}
                                      </span>
                                    </div>
                                    <span className="text-xs font-mono font-semibold text-slate-500">
                                      Paid: ₹{fin.paidAmount.toFixed(2)} | Remaining Balance: ₹{fin.balanceAmount.toFixed(2)}
                                    </span>
                                  </div>

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                                        <tr>
                                          <th className="py-2 px-3">Date</th>
                                          <th className="py-2 px-3">Payment Option</th>
                                          <th className="py-2 px-3">Ref / UTR / Cheque #</th>
                                          <th className="py-2 px-3 text-right">Amount (₹)</th>
                                          <th className="py-2 px-3">Recorded By</th>
                                          <th className="py-2 px-3">Notes</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {(inv.payments || []).map((p, pIdx) => (
                                          <tr key={p.id || pIdx} className="hover:bg-slate-50">
                                            <td className="py-2 px-3 font-mono">
                                              {p.date ? new Date(p.date).toLocaleString('en-IN') : 'N/A'}
                                            </td>
                                            <td className="py-2 px-3 font-bold text-slate-800">
                                              {p.paymentMethod.replace('_', ' ')}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-slate-600">
                                              {p.referenceNo || '—'}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                                              ₹{Number(p.amount).toFixed(2)}
                                            </td>
                                            <td className="py-2 px-3 text-slate-500">
                                              {p.recordedBy || 'Accounts Pharmacist'}
                                            </td>
                                            <td className="py-2 px-3 text-slate-400 italic">
                                              {p.notes || '—'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RETAIL PURCHASE PAYMENT REPORT (PAYMENT MODES AUDIT)               */}
      {/* ========================================================================= */}
      {activeTab === 'payment-report' && (
        <div className="space-y-4">
          {/* Payment Method Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Settled
              </span>
              <p className="text-lg font-black text-slate-900 font-mono">
                ₹{paymentBreakdown.totalSettled.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-teal-600 font-bold block">
                {paymentBreakdown.count} Transactions
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-teal-200 bg-teal-50/20 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-teal-600" />
                <span>UPI / QR</span>
              </span>
              <p className="text-lg font-black text-teal-800 font-mono">
                ₹{paymentBreakdown.upiAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-teal-700 font-medium block">
                Google Pay / PhonePe
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block flex items-center gap-1">
                <Building className="w-3 h-3 text-indigo-600" />
                <span>Bank Transfer</span>
              </span>
              <p className="text-lg font-black text-indigo-800 font-mono">
                ₹{paymentBreakdown.bankAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-indigo-700 font-medium block">
                NEFT / RTGS / IMPS
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block flex items-center gap-1">
                <Banknote className="w-3 h-3 text-emerald-600" />
                <span>Cash at Counter</span>
              </span>
              <p className="text-lg font-black text-emerald-800 font-mono">
                ₹{paymentBreakdown.cashAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-emerald-700 font-medium block">
                Cash Vouchers
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block flex items-center gap-1">
                <FileText className="w-3 h-3 text-purple-600" />
                <span>Bank Cheque</span>
              </span>
              <p className="text-lg font-black text-purple-800 font-mono">
                ₹{paymentBreakdown.chequeAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-purple-700 font-medium block">
                Cheques Issued
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Pending Balance
              </span>
              <p className="text-lg font-black text-amber-900 font-mono">
                ₹{duesKPIs.totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-amber-800 font-bold block">
                {duesKPIs.pendingCount} unpaid bills
              </span>
            </div>
          </div>

          {/* Payment Method Filter & Export Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">Option:</span>
              <button
                type="button"
                onClick={() => setPaymentMethodFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentMethodFilter === 'all'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All Options ({recordedPaymentsList.length})
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethodFilter('UPI')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentMethodFilter === 'UPI'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                }`}
              >
                UPI / QR
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethodFilter('Bank_Transfer')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentMethodFilter === 'Bank_Transfer'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
                }`}
              >
                Bank Transfer
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethodFilter('Cash')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentMethodFilter === 'Cash'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethodFilter('Cheque')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentMethodFilter === 'Cheque'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200'
                }`}
              >
                Cheque
              </button>
            </div>

            {/* Export actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-1 hidden lg:inline">
                Report:
              </span>
              <button
                type="button"
                onClick={handleExportPaymentReportPDF}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Download Payment Audit as PDF"
              >
                <Download className="w-3 h-3 text-rose-600" />
                <span>PDF Report</span>
              </button>
              <button
                type="button"
                onClick={handleExportPaymentReportExcel}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Download Payment Audit as Excel"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                <span>Excel (XLS)</span>
              </button>
              <button
                type="button"
                onClick={handleExportPaymentReportCSV}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Download Payment Audit as CSV"
              >
                <Download className="w-3 h-3 text-indigo-600" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Payments Audit Register Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3 text-center w-8">#</th>
                    <th className="py-3 px-4">Payment Date & Time</th>
                    <th className="py-3 px-4">Bill No</th>
                    <th className="py-3 px-4">Supplier / Vendor</th>
                    <th className="py-3 px-4 text-center">Payment Option</th>
                    <th className="py-3 px-4">Reference / UTR / Cheque #</th>
                    <th className="py-3 px-4 text-right">Amount Settled (₹)</th>
                    <th className="py-3 px-4 text-right">Balance After (₹)</th>
                    <th className="py-3 px-4">Recorded By</th>
                    <th className="py-3 px-4 text-center">Voucher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recordedPaymentsList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                        No payment entries recorded in this period.
                      </td>
                    </tr>
                  ) : (
                    recordedPaymentsList.map((item, idx) => (
                      <tr key={item.payment.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-800">
                          {item.payment.date ? new Date(item.payment.date).toLocaleString('en-IN') : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-slate-900 font-mono">
                            {item.invoice.invoiceNo || (item.invoice as any).invoiceNumber || item.invoice.id}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.invoice.distributorName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.invoice.distributorPhone || 'Ph: N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.payment.paymentMethod === 'UPI'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : item.payment.paymentMethod === 'Bank_Transfer'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : item.payment.paymentMethod === 'Cash'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}>
                            {item.payment.paymentMethod === 'UPI' && <Smartphone className="w-2.5 h-2.5" />}
                            {item.payment.paymentMethod === 'Bank_Transfer' && <Building className="w-2.5 h-2.5" />}
                            {item.payment.paymentMethod === 'Cash' && <Banknote className="w-2.5 h-2.5" />}
                            {item.payment.paymentMethod === 'Cheque' && <FileText className="w-2.5 h-2.5" />}
                            <span>{item.payment.paymentMethod.replace('_', ' ')}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                          {item.payment.referenceNo || '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                          ₹{Number(item.payment.amount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          ₹{item.finance.balanceAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.payment.recordedBy || 'Accounts Desk'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setViewingInvoice(item.invoice)}
                            className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                            title="View Invoice Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
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
      {/* TAB 3: RETAIL SUPPLIER LIST & VENDOR ACCOUNTS PAYABLE                     */}
      {/* ========================================================================= */}
      {activeTab === 'supplier-list' && (
        <div className="space-y-4">
          {/* Supplier Directory Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Retail Supplier Directory & Credit Ledgers</span>
              </h2>
              <p className="text-xs text-slate-500">
                {suppliers.length} registered pharmaceutical distributors, payment terms, and vendor balances
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddSupplierModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Retail Supplier</span>
            </button>
          </div>

          {/* Supplier Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliersWithDues.map(item => {
              const s = item.supplier;
              const hasDues = item.totalPending > 0.001;

              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-2xl border p-4 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs ${
                    item.overdueBillsCount > 0
                      ? 'border-rose-300 ring-1 ring-rose-200'
                      : hasDues
                      ? 'border-amber-300'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-slate-900 text-sm">{s.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{s.contactPerson || 'Vendor Rep'}</p>
                      </div>

                      {hasDues ? (
                        <div className="text-right font-mono">
                          <span className={`text-[10px] font-bold block ${
                            item.overdueBillsCount > 0 ? 'text-rose-600' : 'text-amber-800'
                          }`}>
                            {item.overdueBillsCount > 0 ? `${item.overdueBillsCount} Overdue` : 'Pending Due'}
                          </span>
                          <span className={`text-sm font-black ${
                            item.overdueBillsCount > 0 ? 'text-rose-700' : 'text-amber-900'
                          }`}>
                            ₹{item.totalPending.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          0 Dues (Clean)
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`tel:${s.phone}`} className="font-mono text-teal-700 hover:underline">
                          {s.phone}
                        </a>
                      </div>
                      {s.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{s.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono font-semibold text-[11px]">GSTIN: {s.gstin}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Terms: <strong className="text-slate-800">{s.paymentTerms}</strong></span>
                        <span className="text-slate-500 font-mono">{item.invoicesCount} Invoices</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSupplierFilter(s.id);
                        setActiveTab('payment-pending');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Bills ({item.invoicesCount})</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>

                    {hasDues ? (
                      <button
                        type="button"
                        onClick={() => {
                          const firstPending = invoices.find(inv => inv.distributorId === s.id && getInvoiceFinance(inv).balanceAmount > 0.001);
                          if (firstPending) {
                            setPaymentTargetInvoice(firstPending);
                            setShowPaymentModal(true);
                          } else {
                            setSelectedSupplierFilter(s.id);
                            setActiveTab('payment-pending');
                          }
                        }}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Settle Payment</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>All Settled</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ALL RETAIL INWARD BILLS REGISTER                                   */}
      {/* ========================================================================= */}
      {activeTab === 'all-purchases' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Bill No</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Taxable (₹)</th>
                  <th className="py-3 px-4 text-right">GST Tax (₹)</th>
                  <th className="py-3 px-4 text-right">Total Bill (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      No purchase invoices found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => {
                    const fin = getInvoiceFinance(inv);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono">{inv.invoiceDate}</td>
                        <td className="py-3 px-4 font-extrabold text-slate-900 font-mono">
                          {inv.invoiceNo || (inv as any).invoiceNumber || inv.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{inv.distributorName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {inv.paymentDueDate ? `Due: ${inv.paymentDueDate}` : 'Immediate'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          {(inv.items || []).length}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          ₹{(inv.taxableAmount || inv.subtotal).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-teal-700">
                          ₹{(inv.totalTax || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                          ₹{inv.grandTotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            fin.calculatedStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : fin.calculatedStatus === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {fin.calculatedStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setViewingInvoice(inv)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Payment Modal (Full Payment & Part Payment) */}
      {showPaymentModal && paymentTargetInvoice && (
        <SupplierPaymentModal
          isOpen={showPaymentModal}
          invoice={paymentTargetInvoice}
          defaultPaymentType={defaultPaymentType}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentTargetInvoice(null);
          }}
          onPaymentSuccess={updated => {
            reload();
            setToastMessage(`Payment of ₹${(updated.paidAmount || 0).toFixed(2)} recorded for bill ${updated.invoiceNo || (updated as any).invoiceNumber}. Remaining balance: ₹${(updated.balanceAmount || 0).toFixed(2)}`);
            setTimeout(() => setToastMessage(null), 6000);
          }}
        />
      )}

      {/* Add New Retail Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">Add New Retail Supplier</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSupplierModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supplier / Agency Trade Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSupplierName}
                  onChange={e => setNewSupplierName(e.target.value)}
                  placeholder="e.g. Apex MedPharma Distributors Pvt Ltd"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={newSupplierContact}
                    onChange={e => setNewSupplierContact(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone / Mobile <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSupplierPhone}
                    onChange={e => setNewSupplierPhone(e.target.value)}
                    placeholder="e.g. +91 98201 44521"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={newSupplierGstin}
                    onChange={e => setNewSupplierGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 33AABCA1234F1Z5"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Drug License No (Form 20B/21B)
                  </label>
                  <input
                    type="text"
                    value={newSupplierDl}
                    onChange={e => setNewSupplierDl(e.target.value.toUpperCase())}
                    placeholder="e.g. TN-MDU-20B-1092"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Credit Payment Terms
                  </label>
                  <select
                    value={newSupplierTerms}
                    onChange={e => setNewSupplierTerms(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Net 30">Net 30 Days (Standard)</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 45">Net 45 Days</option>
                    <option value="Immediate">Immediate / Advance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newSupplierEmail}
                    onChange={e => setNewSupplierEmail(e.target.value)}
                    placeholder="e.g. billing@distributor.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Warehouse / Office Address
                </label>
                <input
                  type="text"
                  value={newSupplierAddress}
                  onChange={e => setNewSupplierAddress(e.target.value)}
                  placeholder="e.g. 14, Pharma Trade Complex, Madurai Main Road, Tamil Nadu"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Purchase Voucher: {viewingInvoice.invoiceNo || (viewingInvoice as any).invoiceNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewingInvoice.distributorName} • Dated: {viewingInvoice.invoiceDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3 text-center">Batch</th>
                      <th className="py-2 px-3 text-center">Exp</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Rate (₹)</th>
                      <th className="py-2 px-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingInvoice.items.map((it, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-semibold text-slate-800">{it.medicineName}</td>
                        <td className="py-2 px-3 text-center font-mono">{it.batchNumber}</td>
                        <td className="py-2 px-3 text-center font-mono">{it.expiryDate}</td>
                        <td className="py-2 px-3 text-center font-mono">
                          {it.billedQuantity} {it.freeQuantity ? `(+${it.freeQuantity})` : ''}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">₹{it.purchaseRate}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">₹{it.totalAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Taxable:</span>
                  <span>₹{(viewingInvoice.taxableAmount || viewingInvoice.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-teal-700 font-semibold">
                  <span>GST Total:</span>
                  <span>₹{(viewingInvoice.totalTax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span>₹{viewingInvoice.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              {getInvoiceFinance(viewingInvoice).balanceAmount > 0.001 ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingInvoice(null);
                      handleOpenFullPayment(viewingInvoice);
                    }}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Pay Full (₹{getInvoiceFinance(viewingInvoice).balanceAmount.toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewingInvoice(null);
                      handleOpenPartPayment(viewingInvoice);
                    }}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl"
                  >
                    Pay Part
                  </button>
                </div>
              ) : (
                <span className="text-xs font-bold text-emerald-700">All settled</span>
              )}

              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
