import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Building2,
  Boxes,
  TrendingUp,
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Eye,
  FileText,
  Percent,
  Layers,
  ChevronDown,
  ChevronRight,
  History,
  Banknote,
  X,
  CreditCard,
  AlertTriangle,
  AlertCircle,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { PurchaseInvoice, Supplier, Medicine } from '../types';
import { StorageService } from '../services/storage';
import { exportReportToExcel, exportReportToPDF, exportReportToCSV, printReportWindow } from '../utils/exportUtils';
import { VoiceInputButton } from './VoiceInputButton';
import { SupplierPaymentModal } from './SupplierPaymentModal';

interface PurchaseReportViewProps {
  onViewInvoice?: (invoice: PurchaseInvoice) => void;
  onRefreshData?: () => void;
  initialSubTab?: 'invoices' | 'payments-dues' | 'suppliers' | 'products' | 'gst-itc';
}

type ReportSubTab = 'invoices' | 'payments-dues' | 'suppliers' | 'products' | 'gst-itc';
type DateRangeOption = 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'fy' | 'custom';

export const PurchaseReportView: React.FC<PurchaseReportViewProps> = ({
  onViewInvoice,
  onRefreshData,
  initialSubTab
}) => {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>(() => StorageService.getPurchaseInvoices());
  const [suppliers] = useState<Supplier[]>(() => StorageService.getSuppliers());
  const [medicines] = useState<Medicine[]>(() => StorageService.getMedicines());

  const [activeSubTab, setActiveSubTab] = useState<ReportSubTab>(initialSubTab || 'invoices');
  const [duesStatusFilter, setDuesStatusFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<PurchaseInvoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>('month');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected invoice for detail modal
  const [viewingInvoice, setViewingInvoice] = useState<PurchaseInvoice | null>(null);
  const [expandedHistoryInvoiceId, setExpandedHistoryInvoiceId] = useState<string | null>(null);

  // Reload data
  const reload = () => {
    setInvoices(StorageService.getPurchaseInvoices());
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

  // Date Filtering Logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // 1. Date filter
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
        inDate =
          invDate.getFullYear() === now.getFullYear() &&
          invDate.getMonth() === now.getMonth();
      } else if (dateRange === 'fy') {
        const curYear = now.getFullYear();
        const fyStart = new Date(curYear, 3, 1); // April 1st
        inDate = invDate >= fyStart;
      } else if (dateRange === 'custom') {
        if (startDate && inv.invoiceDate < startDate) inDate = false;
        if (endDate && inv.invoiceDate > endDate) inDate = false;
      }

      if (!inDate) return false;

      // 2. Supplier filter
      if (selectedSupplierId !== 'all' && inv.distributorId !== selectedSupplierId) {
        return false;
      }

      // 3. Payment status filter
      if (selectedPaymentStatus !== 'all' && inv.paymentStatus !== selectedPaymentStatus) {
        return false;
      }

      // 4. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesInvNo = inv.invoiceNumber.toLowerCase().includes(q);
        const matchesSupplier = inv.distributorName.toLowerCase().includes(q);
        const matchesItems = inv.items.some(
          it =>
            it.medicineName.toLowerCase().includes(q) ||
            it.batchNumber.toLowerCase().includes(q) ||
            (it.genericName && it.genericName.toLowerCase().includes(q))
        );
        if (!matchesInvNo && !matchesSupplier && !matchesItems) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, dateRange, startDate, endDate, selectedSupplierId, selectedPaymentStatus, searchQuery]);

  // Overall KPI Metrics
  const summaryKPIs = useMemo(() => {
    let totalPurchases = 0;
    let totalTaxable = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalTax = 0;
    let totalDiscounts = 0;
    let totalBilledUnits = 0;
    let totalFreeUnits = 0;
    let unpaidAmount = 0;

    filteredInvoices.forEach(inv => {
      totalPurchases += inv.grandTotal;
      totalTaxable += inv.taxableAmount || inv.subtotal;
      totalCGST += inv.cgst || 0;
      totalSGST += inv.sgst || 0;
      totalIGST += inv.igst || 0;
      totalTax += inv.totalTax || (inv.cgst + inv.sgst + (inv.igst || 0));
      totalDiscounts += inv.discount || 0;

      if (inv.paymentStatus === 'Unpaid') {
        unpaidAmount += inv.grandTotal;
      }

      inv.items.forEach(it => {
        totalBilledUnits += it.billedQuantity || 0;
        totalFreeUnits += it.freeQuantity || 0;
      });
    });

    return {
      totalPurchases,
      totalTaxable,
      totalTax,
      totalCGST,
      totalSGST,
      totalDiscounts,
      totalUnits: totalBilledUnits + totalFreeUnits,
      totalBilledUnits,
      totalFreeUnits,
      unpaidAmount,
      invoiceCount: filteredInvoices.length
    };
  }, [filteredInvoices]);

  // Supplier-wise aggregation
  const supplierBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        supplierId: string;
        supplierName: string;
        invoiceCount: number;
        totalPurchases: number;
        totalTaxable: number;
        totalTax: number;
        unpaidAmount: number;
      }
    >();

    filteredInvoices.forEach(inv => {
      const existing = map.get(inv.distributorId) || {
        supplierId: inv.distributorId,
        supplierName: inv.distributorName,
        invoiceCount: 0,
        totalPurchases: 0,
        totalTaxable: 0,
        totalTax: 0,
        unpaidAmount: 0
      };

      existing.invoiceCount += 1;
      existing.totalPurchases += inv.grandTotal;
      existing.totalTaxable += inv.taxableAmount || inv.subtotal;
      existing.totalTax += inv.totalTax || (inv.cgst + inv.sgst);
      if (inv.paymentStatus === 'Unpaid') {
        existing.unpaidAmount += inv.grandTotal;
      }

      map.set(inv.distributorId, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalPurchases - a.totalPurchases);
  }, [filteredInvoices]);

  // Product-wise inward aggregation
  const productBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        medicineId: string;
        medicineName: string;
        genericName?: string;
        hsnCode?: string;
        totalBilledQty: number;
        totalFreeQty: number;
        totalInwardQty: number;
        avgPurchaseRate: number;
        totalCostSpent: number;
        gstRate: number;
        mrp: number;
        invoicesCount: number;
      }
    >();

    filteredInvoices.forEach(inv => {
      inv.items.forEach(it => {
        const key = `${it.medicineName.toLowerCase()}-${it.purchaseRate}`;
        const existing = map.get(key) || {
          medicineId: it.medicineId,
          medicineName: it.medicineName,
          genericName: it.genericName,
          hsnCode: it.hsnCode,
          totalBilledQty: 0,
          totalFreeQty: 0,
          totalInwardQty: 0,
          avgPurchaseRate: it.purchaseRate,
          totalCostSpent: 0,
          gstRate: it.gstRate,
          mrp: it.mrp,
          invoicesCount: 0
        };

        existing.totalBilledQty += it.billedQuantity || 0;
        existing.totalFreeQty += it.freeQuantity || 0;
        existing.totalInwardQty += (it.billedQuantity || 0) + (it.freeQuantity || 0);
        existing.totalCostSpent += it.totalAmount || (it.billedQuantity * it.purchaseRate);
        existing.invoicesCount += 1;

        map.set(key, existing);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalCostSpent - a.totalCostSpent);
  }, [filteredInvoices]);

  // GST Slab-wise ITC breakdown
  const gstBreakdown = useMemo(() => {
    const slabs = [0, 5, 12, 18, 28];
    const map = new Map<
      number,
      {
        rate: number;
        taxableAmount: number;
        cgst: number;
        sgst: number;
        totalTax: number;
        itemsCount: number;
      }
    >();

    slabs.forEach(rate => {
      map.set(rate, { rate, taxableAmount: 0, cgst: 0, sgst: 0, totalTax: 0, itemsCount: 0 });
    });

    filteredInvoices.forEach(inv => {
      inv.items.forEach(it => {
        const rate = it.gstRate || 12;
        const entry = map.get(rate) || { rate, taxableAmount: 0, cgst: 0, sgst: 0, totalTax: 0, itemsCount: 0 };
        const taxable = (it.billedQuantity * it.purchaseRate) * (1 - (it.discountPercentage || 0) / 100);
        const tax = (taxable * rate) / 100;

        entry.taxableAmount += taxable;
        entry.cgst += tax / 2;
        entry.sgst += tax / 2;
        entry.totalTax += tax;
        entry.itemsCount += 1;

        map.set(rate, entry);
      });
    });

    return Array.from(map.values());
  }, [filteredInvoices]);

  // Handle Export to Excel
  const handleExportExcel = () => {
    const filename = `Purchase_Report_${new Date().toISOString().split('T')[0]}`;
    const headers = [
      'Invoice Date',
      'Invoice No',
      'Supplier / Sublayer',
      'Items Count',
      'Taxable Amount (₹)',
      'CGST (₹)',
      'SGST (₹)',
      'Total GST ITC (₹)',
      'Grand Total (₹)',
      'Payment Status',
      'Due Date'
    ];

    const rows = filteredInvoices.map(inv => [
      inv.invoiceDate,
      inv.invoiceNumber,
      inv.distributorName,
      (inv.items || []).length,
      inv.taxableAmount?.toFixed(2) || inv.subtotal.toFixed(2),
      (inv.cgst || 0).toFixed(2),
      (inv.sgst || 0).toFixed(2),
      (inv.totalTax || 0).toFixed(2),
      inv.grandTotal.toFixed(2),
      inv.paymentStatus,
      inv.dueDate || 'N/A'
    ]);

    const summary = [
      { label: 'Total Invoices', value: summaryKPIs.invoiceCount },
      { label: 'Total Purchases Value', value: `₹${summaryKPIs.totalPurchases.toLocaleString('en-IN')}` },
      { label: 'Total GST Input Tax Credit (ITC)', value: `₹${summaryKPIs.totalTax.toLocaleString('en-IN')}` },
      { label: 'Total Inwarded Units', value: summaryKPIs.totalUnits },
      { label: 'Outstanding Payables', value: `₹${summaryKPIs.unpaidAmount.toLocaleString('en-IN')}` }
    ];

    exportReportToExcel(filename, 'Purchase Invoices', headers, rows, {
      title: 'PURCHASE INWARD REGISTER & TAX REPORT',
      subtitle: `Period: ${dateRange.toUpperCase()} | Total Spend: ₹${summaryKPIs.totalPurchases.toLocaleString('en-IN')}`,
      summary
    });
  };

  // Handle Export to PDF
  const handleExportPDF = () => {
    const headers = [
      'Date',
      'Invoice No',
      'Supplier',
      'Items',
      'Taxable (₹)',
      'GST (₹)',
      'Total (₹)',
      'Status'
    ];

    const rows = filteredInvoices.map(inv => [
      inv.invoiceDate,
      inv.invoiceNumber,
      inv.distributorName.slice(0, 20),
      (inv.items || []).length,
      (inv.taxableAmount || inv.subtotal).toFixed(2),
      (inv.totalTax || 0).toFixed(2),
      inv.grandTotal.toFixed(2),
      inv.paymentStatus
    ]);

    exportReportToPDF({
      title: 'PURCHASE REGISTER & ITC AUDIT REPORT',
      subtitle: `Generated on ${new Date().toLocaleDateString('en-IN')} | Scope: ${filteredInvoices.length} Bills`,
      filename: `Purchase_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      headers,
      rows,
      summaryRows: [
        { label: 'Total Inward Invoices', value: summaryKPIs.invoiceCount },
        { label: 'Gross Purchase Spend', value: `₹${summaryKPIs.totalPurchases.toFixed(2)}` },
        { label: 'Total Input Tax Credit (ITC)', value: `₹${summaryKPIs.totalTax.toFixed(2)}` },
        { label: 'Unpaid / Credit Purchases', value: `₹${summaryKPIs.unpaidAmount.toFixed(2)}` }
      ],
      summaryCards: [
        { label: 'Purchases (₹)', value: summaryKPIs.totalPurchases.toFixed(2) },
        { label: 'ITC Tax (₹)', value: summaryKPIs.totalTax.toFixed(2) },
        { label: 'Invoices', value: summaryKPIs.invoiceCount },
        { label: 'Units', value: summaryKPIs.totalUnits }
      ],
      orientation: 'landscape'
    });
  };

  // Handle Export to CSV
  const handleExportCSV = () => {
    const filename = `Purchase_Report_${new Date().toISOString().split('T')[0]}`;
    const headers = [
      'Invoice Date',
      'Invoice No',
      'Supplier / Sublayer',
      'Items Count',
      'Taxable Amount (₹)',
      'CGST (₹)',
      'SGST (₹)',
      'Total GST ITC (₹)',
      'Grand Total (₹)',
      'Paid Amount (₹)',
      'Remaining Balance (₹)',
      'Payment Status',
      'Due Date'
    ];

    const rows = filteredInvoices.map(inv => {
      const fin = getInvoiceFinance(inv);
      return [
        inv.invoiceDate,
        inv.invoiceNo || (inv as any).invoiceNumber || inv.id,
        inv.distributorName,
        (inv.items || []).length,
        inv.taxableAmount?.toFixed(2) || inv.subtotal.toFixed(2),
        (inv.cgstAmount || (inv as any).cgst || 0).toFixed(2),
        (inv.sgstAmount || (inv as any).sgst || 0).toFixed(2),
        (inv.totalTax || 0).toFixed(2),
        fin.grandTotal.toFixed(2),
        fin.paidAmount.toFixed(2),
        fin.balanceAmount.toFixed(2),
        fin.calculatedStatus,
        fin.dueDateStr || 'N/A'
      ];
    });

    exportReportToCSV(filename, headers, rows, {
      title: 'PURCHASE INWARD REGISTER & TAX REPORT',
      subtitle: `Period: ${dateRange.toUpperCase()} | Generated: ${new Date().toLocaleDateString('en-IN')}`,
      summary: [
        { label: 'Total Invoices', value: summaryKPIs.invoiceCount },
        { label: 'Total Purchases Spend', value: `₹${summaryKPIs.totalPurchases.toLocaleString('en-IN')}` },
        { label: 'Total GST ITC', value: `₹${summaryKPIs.totalTax.toLocaleString('en-IN')}` },
        { label: 'Outstanding Payables', value: `₹${summaryKPIs.unpaidAmount.toLocaleString('en-IN')}` }
      ]
    });
  };

  // Dues filtered list
  const filteredDuesInvoices = useMemo(() => {
    return filteredInvoices.filter(inv => {
      const fin = getInvoiceFinance(inv);
      if (duesStatusFilter === 'pending') {
        return fin.balanceAmount > 0.001;
      }
      if (duesStatusFilter === 'overdue') {
        return fin.isOverdue;
      }
      if (duesStatusFilter === 'paid') {
        return fin.balanceAmount <= 0.001;
      }
      return true;
    });
  }, [filteredInvoices, duesStatusFilter]);

  // Dues Summary KPIs
  const duesKPIs = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    let overdueAmount = 0;
    let overdueCount = 0;
    let pendingCount = 0;
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
      paidCount,
      totalBills: filteredInvoices.length
    };
  }, [filteredInvoices]);

  // Dues Export Handlers
  const handleExportDuesPDF = () => {
    const headers = ['Date', 'Invoice No', 'Supplier', 'Total (₹)', 'Paid (₹)', 'Remaining (₹)', 'Due Date', 'Status'];
    const rows = filteredDuesInvoices.map(inv => {
      const fin = getInvoiceFinance(inv);
      return [
        inv.invoiceDate,
        inv.invoiceNo || (inv as any).invoiceNumber || inv.id,
        inv.distributorName.slice(0, 20),
        fin.grandTotal.toFixed(2),
        fin.paidAmount.toFixed(2),
        fin.balanceAmount.toFixed(2),
        fin.dueDateStr ? (fin.isOverdue ? `${fin.dueDateStr} (${fin.daysOverdue}d Overdue)` : fin.dueDateStr) : 'N/A',
        fin.calculatedStatus
      ];
    });

    exportReportToPDF({
      title: 'SUPPLIER PURCHASE DUES & PAYMENT STATEMENT',
      subtitle: `Scope: ${duesStatusFilter.toUpperCase()} | Outstanding Balance: ₹${duesKPIs.totalBalance.toFixed(2)} | Overdue: ₹${duesKPIs.overdueAmount.toFixed(2)}`,
      filename: `Purchase_Dues_Report_${duesStatusFilter}_${new Date().toISOString().split('T')[0]}.pdf`,
      headers,
      rows,
      summaryRows: [
        { label: 'Total Bills Analyzed', value: duesKPIs.totalBills },
        { label: 'Total Invoiced Spend', value: `₹${duesKPIs.totalInvoiced.toFixed(2)}` },
        { label: 'Total Paid to Suppliers', value: `₹${duesKPIs.totalPaid.toFixed(2)}` },
        { label: 'Total Pending Payment / Balance', value: `₹${duesKPIs.totalBalance.toFixed(2)}` },
        { label: 'Overdue Payable Amount', value: `₹${duesKPIs.overdueAmount.toFixed(2)} (${duesKPIs.overdueCount} bills)` }
      ],
      summaryCards: [
        { label: 'Total Spend (₹)', value: duesKPIs.totalInvoiced.toFixed(2) },
        { label: 'Total Paid (₹)', value: duesKPIs.totalPaid.toFixed(2) },
        { label: 'Balance Due (₹)', value: duesKPIs.totalBalance.toFixed(2) },
        { label: 'Overdue Dues (₹)', value: duesKPIs.overdueAmount.toFixed(2) }
      ],
      orientation: 'landscape'
    });
    setToastMessage(`Exported Purchase Dues Report as PDF.`);
  };

  const handleExportDuesExcel = () => {
    const filename = `Purchase_Dues_Report_${duesStatusFilter}_${new Date().toISOString().split('T')[0]}`;
    const headers = [
      'Invoice Date',
      'Invoice No',
      'Supplier / Sublayer',
      'Total Bill (₹)',
      'Paid Amount (₹)',
      'Remaining Balance (₹)',
      'Due Date',
      'Aging Status',
      'Payment Status'
    ];

    const rows = filteredDuesInvoices.map(inv => {
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

    exportReportToExcel(filename, 'Dues & Payments', headers, rows, {
      title: 'PURCHASE PAYMENT DUES & AGING LEDGER',
      subtitle: `Filter: ${duesStatusFilter.toUpperCase()} | Outstanding Balance: ₹${duesKPIs.totalBalance.toLocaleString('en-IN')}`,
      summary: [
        { label: 'Total Invoiced Spend', value: `₹${duesKPIs.totalInvoiced.toLocaleString('en-IN')}` },
        { label: 'Total Paid Amount', value: `₹${duesKPIs.totalPaid.toLocaleString('en-IN')}` },
        { label: 'Total Remaining Balance', value: `₹${duesKPIs.totalBalance.toLocaleString('en-IN')}` },
        { label: 'Overdue Payables', value: `₹${duesKPIs.overdueAmount.toLocaleString('en-IN')} (${duesKPIs.overdueCount} bills)` }
      ]
    });
    setToastMessage(`Exported Purchase Dues Report as Excel (XLS).`);
  };

  const handleExportDuesCSV = () => {
    const filename = `Purchase_Dues_Report_${duesStatusFilter}_${new Date().toISOString().split('T')[0]}`;
    const headers = [
      'Invoice Date',
      'Invoice No',
      'Supplier',
      'Total Bill (₹)',
      'Paid Amount (₹)',
      'Remaining Balance (₹)',
      'Due Date',
      'Aging Status',
      'Payment Status'
    ];

    const rows = filteredDuesInvoices.map(inv => {
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

    exportReportToCSV(filename, headers, rows, {
      title: 'PURCHASE PAYMENT DUES & AGING STATEMENT',
      subtitle: `Scope: ${duesStatusFilter.toUpperCase()} | Generated: ${new Date().toLocaleDateString('en-IN')}`,
      summary: [
        { label: 'Total Invoiced Spend', value: `₹${duesKPIs.totalInvoiced.toFixed(2)}` },
        { label: 'Total Paid Amount', value: `₹${duesKPIs.totalPaid.toFixed(2)}` },
        { label: 'Remaining Balance Due', value: `₹${duesKPIs.totalBalance.toFixed(2)}` },
        { label: 'Overdue Payables', value: `₹${duesKPIs.overdueAmount.toFixed(2)}` }
      ]
    });
    setToastMessage(`Exported Purchase Dues Report as CSV.`);
  };

  const handlePrintDues = () => {
    const headers = ['Date', 'Invoice #', 'Supplier', 'Bill (₹)', 'Paid (₹)', 'Remaining (₹)', 'Due Date', 'Status'];
    const rows = filteredDuesInvoices.map(inv => {
      const fin = getInvoiceFinance(inv);
      return [
        inv.invoiceDate,
        inv.invoiceNo || (inv as any).invoiceNumber || inv.id,
        inv.distributorName,
        fin.grandTotal.toFixed(2),
        fin.paidAmount.toFixed(2),
        fin.balanceAmount.toFixed(2),
        fin.dueDateStr ? (fin.isOverdue ? `${fin.dueDateStr} (${fin.daysOverdue}d Overdue)` : fin.dueDateStr) : 'N/A',
        fin.calculatedStatus
      ];
    });

    printReportWindow({
      title: 'PURCHASE PAYMENT DUES & OVERDUE STATEMENT',
      subtitle: `Scope: ${duesStatusFilter.toUpperCase()} | Outstanding: ₹${duesKPIs.totalBalance.toFixed(2)} | Printed: ${new Date().toLocaleString('en-IN')}`,
      headers,
      rows,
      summaryCards: [
        { label: 'Total Spend (₹)', value: duesKPIs.totalInvoiced.toFixed(2) },
        { label: 'Total Paid (₹)', value: duesKPIs.totalPaid.toFixed(2) },
        { label: 'Remaining Balance (₹)', value: duesKPIs.totalBalance.toFixed(2) },
        { label: 'Overdue Dues (₹)', value: duesKPIs.overdueAmount.toFixed(2) }
      ]
    });
  };

  // Handle Print
  const handlePrint = () => {
    const headers = ['Date', 'Invoice #', 'Supplier / Sublayer', 'Items', 'Taxable (₹)', 'GST (₹)', 'Total (₹)', 'Status'];
    const rows = filteredInvoices.map(inv => [
      inv.invoiceDate,
      inv.invoiceNo || (inv as any).invoiceNumber || inv.id,
      inv.distributorName,
      (inv.items || []).length,
      (inv.taxableAmount || inv.subtotal).toFixed(2),
      (inv.totalTax || 0).toFixed(2),
      inv.grandTotal.toFixed(2),
      inv.paymentStatus
    ]);

    printReportWindow({
      title: 'PURCHASE INWARD REGISTER & TAX CREDIT STATEMENT',
      subtitle: `Period: ${dateRange.toUpperCase()} | Printed: ${new Date().toLocaleString('en-IN')}`,
      headers,
      rows,
      summaryCards: [
        { label: 'Total Spend (₹)', value: summaryKPIs.totalPurchases.toFixed(2) },
        { label: 'GST ITC (₹)', value: summaryKPIs.totalTax.toFixed(2) },
        { label: 'Inward Bills', value: summaryKPIs.invoiceCount },
        { label: 'Total Units', value: summaryKPIs.totalUnits }
      ]
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Receipt className="w-6 h-6 text-teal-600" />
              <span>Purchase & Inward Reports</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive inward purchase logs, distributor ledgers, and GST Input Tax Credit (ITC) reconciliation
            </p>
          </div>

          {/* Export and Print Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              id="btn-export-purchase-excel"
              title="Download Purchase Report as Excel (XLS)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel Export</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              id="btn-export-purchase-pdf"
              title="Download Purchase Report as PDF"
            >
              <Download className="w-4 h-4 text-rose-600" />
              <span>PDF Report</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              id="btn-export-purchase-csv"
              title="Download Purchase Report as CSV"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>CSV Export</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              id="btn-print-purchase-report"
              title="Print Purchase Register"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {/* Date Range Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Time Period
            </label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            >
              <option value="month">This Month (Current)</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="fy">Financial Year (FY)</option>
              <option value="all">All Time History</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Supplier / Sublayer Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Supplier / Sublayer
            </label>
            <select
              value={selectedSupplierId}
              onChange={e => setSelectedSupplierId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            >
              <option value="all">All Suppliers & Sublayers</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Payment Status
            </label>
            <select
              value={selectedPaymentStatus}
              onChange={e => setSelectedPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            >
              <option value="all">All Statuses (Paid & Unpaid)</option>
              <option value="Paid">Paid Only</option>
              <option value="Unpaid">Unpaid / Credit Only</option>
            </select>
          </div>

          {/* Search Query Input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Search Invoice / Item
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Invoice #, Supplier, Medicine..."
                className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                <VoiceInputButton
                  onTranscript={(text) => setSearchQuery(text)}
                  size="xs"
                  title="Speak invoice number, supplier or item name"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Custom Date Pickers when 'custom' is active */}
        {dateRange === 'custom' && (
          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs font-bold text-slate-600">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
            <span className="text-slate-400 text-xs font-bold">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </div>
        )}
      </div>

      {/* KPI Cards Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Purchases</span>
          <p className="text-lg font-black text-slate-900">₹{summaryKPIs.totalPurchases.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          <span className="text-[10px] font-semibold text-teal-600 block">Gross Invoiced Value</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">GST Input Credit (ITC)</span>
          <p className="text-lg font-black text-teal-700">₹{summaryKPIs.totalTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          <span className="text-[10px] font-semibold text-slate-500 block">CGST + SGST</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Inward Invoices</span>
          <p className="text-lg font-black text-slate-900">{summaryKPIs.invoiceCount}</p>
          <span className="text-[10px] font-semibold text-slate-500 block">Bills processed</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Units Inwarded</span>
          <p className="text-lg font-black text-slate-900">{summaryKPIs.totalUnits.toLocaleString('en-IN')}</p>
          <span className="text-[10px] font-semibold text-emerald-600 block">
            {summaryKPIs.totalFreeUnits > 0 ? `+${summaryKPIs.totalFreeUnits} Free bonus` : 'All billed packs'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Discounts Availed</span>
          <p className="text-lg font-black text-emerald-700">₹{summaryKPIs.totalDiscounts.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          <span className="text-[10px] font-semibold text-slate-500 block">Schemes + Cash disc</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Unpaid / Credit</span>
          <p className="text-lg font-black text-rose-700">₹{summaryKPIs.unpaidAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          <span className="text-[10px] font-semibold text-rose-600 block">Pending to pay</span>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'invoices'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          id="tab-inward-bills-register"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Inward Bills Register ({filteredInvoices.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('payments-dues')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'payments-dues'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          id="tab-purchase-payments-dues"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Purchase Payments & Dues</span>
          {duesKPIs.overdueCount > 0 ? (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black animate-pulse">
              {duesKPIs.overdueCount} Overdue
            </span>
          ) : duesKPIs.pendingCount > 0 ? (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
              {duesKPIs.pendingCount} Pending
            </span>
          ) : (
            <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded-full text-[10px] font-bold">
              All Paid
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('suppliers')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'suppliers'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Supplier-wise Spend ({supplierBreakdown.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('products')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'products'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Product-wise Inward Breakdown ({productBreakdown.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('gst-itc')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'gst-itc'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>GST ITC Reconciliation (GSTR-2B)</span>
        </button>
      </div>

      {/* Sub-Tab 1: Inward Invoices Register */}
      {activeSubTab === 'invoices' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Supplier / Sublayer</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Taxable (₹)</th>
                  <th className="py-3 px-4 text-right">GST (₹)</th>
                  <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      No purchase inward invoices match the selected period or filters.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-teal-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium">{inv.invoiceDate}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{inv.distributorName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {inv.dueDate ? `Due: ${inv.dueDate}` : 'Immediate'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {(inv.items || []).length}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium">
                        ₹{(inv.taxableAmount || inv.subtotal).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-teal-700">
                        ₹{(inv.totalTax || (inv.cgst + inv.sgst)).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                        ₹{inv.grandTotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            if (onViewInvoice) {
                              onViewInvoice(inv);
                            } else {
                              setViewingInvoice(inv);
                            }
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1B: PURCHASE PAYMENTS & DUES (PAY PENDING, REMAINING & OVERDUE)   */}
      {/* ========================================================================= */}
      {activeSubTab === 'payments-dues' && (
        <div className="space-y-4">
          {/* Top Dues Financial Metrics Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Inward Billed
              </span>
              <p className="text-xl font-black text-slate-900 font-mono">
                ₹{duesKPIs.totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-slate-500 font-medium block">
                Across {duesKPIs.totalBills} supplier invoices
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Amount Paid
              </span>
              <p className="text-xl font-black text-emerald-700 font-mono">
                ₹{duesKPIs.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold block">
                {duesKPIs.paidCount} bills fully settled
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block flex items-center justify-between">
                <span>Remaining Balance Due</span>
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-black text-[10px]">
                  Pay Pending
                </span>
              </span>
              <p className="text-xl font-black text-amber-900 font-mono">
                ₹{duesKPIs.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-amber-800 font-medium block">
                {duesKPIs.pendingCount} invoices awaiting payment
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block flex items-center justify-between">
                <span>Overdue Payables</span>
                {duesKPIs.overdueCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded font-black text-[10px] animate-pulse">
                    Action Required
                  </span>
                )}
              </span>
              <p className="text-xl font-black text-rose-700 font-mono">
                ₹{duesKPIs.overdueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-rose-700 font-bold block flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                <span>{duesKPIs.overdueCount} bills past credit due date</span>
              </span>
            </div>
          </div>

          {/* Filter Bar & Quick Export Ribbon */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">Filter:</span>
              <button
                type="button"
                onClick={() => setDuesStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  duesStatusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                id="filter-dues-all"
              >
                <span>All Bills</span>
                <span className="ml-1.5 text-[10px] opacity-80">({filteredInvoices.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDuesStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  duesStatusFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                }`}
                id="filter-dues-pending"
              >
                <Clock className="w-3 h-3" />
                <span>Pay Pending</span>
                <span className="px-1.5 py-0.2 bg-amber-900/20 rounded font-mono text-[10px]">
                  {duesKPIs.pendingCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDuesStatusFilter('overdue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  duesStatusFilter === 'overdue'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200'
                }`}
                id="filter-dues-overdue"
              >
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                <span>Overdue Bills</span>
                <span className="px-1.5 py-0.2 bg-rose-900/20 rounded font-mono text-[10px]">
                  {duesKPIs.overdueCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDuesStatusFilter('paid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  duesStatusFilter === 'paid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}
                id="filter-dues-paid"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Fully Settled</span>
                <span className="ml-1 text-[10px] opacity-80 font-mono">({duesKPIs.paidCount})</span>
              </button>
            </div>

            {/* Export Actions for Dues */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-1 hidden lg:inline">
                Dues Report:
              </span>
              <button
                type="button"
                onClick={handleExportDuesPDF}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Download Dues Statement as PDF"
                id="btn-export-dues-pdf"
              >
                <Download className="w-3 h-3 text-rose-600" />
                <span>Dues PDF</span>
              </button>

              <button
                type="button"
                onClick={handleExportDuesExcel}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Download Dues Ledger as Excel (XLS)"
                id="btn-export-dues-xls"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                <span>Dues XLS</span>
              </button>

              <button
                type="button"
                onClick={handleExportDuesCSV}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Download Dues Statement as CSV"
                id="btn-export-dues-csv"
              >
                <Download className="w-3 h-3 text-indigo-600" />
                <span>Dues CSV</span>
              </button>

              <button
                type="button"
                onClick={handlePrintDues}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Print Dues Ledger"
                id="btn-print-dues"
              >
                <Printer className="w-3 h-3 text-slate-700" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Dues & Payments Ledger Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3 text-center w-8">#</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Supplier / Sublayer</th>
                    <th className="py-3 px-4 text-right">Bill Amount (₹)</th>
                    <th className="py-3 px-4 text-right">Paid Amount (₹)</th>
                    <th className="py-3 px-4 text-right">Remaining Due (₹)</th>
                    <th className="py-3 px-4 text-center">Due Date & Aging</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center w-48">Payment & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredDuesInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                        No purchase invoices found matching the "{duesStatusFilter}" dues status filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDuesInvoices.map((inv, idx) => {
                      const fin = getInvoiceFinance(inv);
                      const isExpanded = expandedHistoryInvoiceId === inv.id;
                      const hasPayments = inv.payments && inv.payments.length > 0;

                      return (
                        <React.Fragment key={inv.id}>
                          <tr className={`hover:bg-teal-50/40 transition-colors ${fin.isOverdue ? 'bg-rose-50/15' : ''}`}>
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
                                {inv.distributorPhone ? `Ph: ${inv.distributorPhone}` : 'Distributor ID: ' + inv.distributorId}
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
                              ) : fin.daysRemaining <= 5 && fin.daysRemaining >= 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  <Clock className="w-2.5 h-2.5 text-amber-600" />
                                  <span>Due in {fin.daysRemaining}d</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-mono">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>{fin.dueDateStr || 'No due date'}</span>
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
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {fin.balanceAmount > 0.001 ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPaymentTargetInvoice(inv);
                                      setShowPaymentModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                    title={`Record payment of remaining balance ₹${fin.balanceAmount.toFixed(2)}`}
                                    id={`btn-pay-invoice-${inv.id}`}
                                  >
                                    <Banknote className="w-3 h-3" />
                                    <span>Pay ₹{fin.balanceAmount.toFixed(0)}</span>
                                  </button>
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
                                    title={isExpanded ? 'Hide payment installments history' : 'View payment installments history'}
                                  >
                                    <History className="w-3.5 h-3.5 text-slate-600" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onViewInvoice) {
                                      onViewInvoice(inv);
                                    } else {
                                      setViewingInvoice(inv);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                                  title="View invoice details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Payment Installments History Sub-Drawer */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-y border-slate-200">
                              <td colSpan={10} className="py-3 px-6">
                                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <History className="w-4 h-4 text-teal-600" />
                                      <span className="text-xs font-bold text-slate-900">
                                        Payment Installments History for Invoice #{inv.invoiceNo || (inv as any).invoiceNumber}
                                      </span>
                                    </div>
                                    <span className="text-xs font-mono font-semibold text-slate-500">
                                      Total Paid: ₹{fin.paidAmount.toFixed(2)} / ₹{fin.grandTotal.toFixed(2)}
                                    </span>
                                  </div>

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                                        <tr>
                                          <th className="py-2 px-3">Date</th>
                                          <th className="py-2 px-3">Method</th>
                                          <th className="py-2 px-3">Reference / UTR #</th>
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
                                              {p.paymentMethod}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-slate-600">
                                              {p.referenceNo || '—'}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                                              ₹{Number(p.amount).toFixed(2)}
                                            </td>
                                            <td className="py-2 px-3 text-slate-500">
                                              {p.recordedBy || 'Accounts Desk'}
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
      {activeSubTab === 'suppliers' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Supplier / Sublayer</th>
                  <th className="py-3 px-4 text-center">Invoices</th>
                  <th className="py-3 px-4 text-right">Taxable Spend (₹)</th>
                  <th className="py-3 px-4 text-right">GST Paid (₹)</th>
                  <th className="py-3 px-4 text-right">Total Purchased (₹)</th>
                  <th className="py-3 px-4 text-right">Avg Bill (₹)</th>
                  <th className="py-3 px-4 text-right">Pending Payable (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {supplierBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No supplier records found for this period.
                    </td>
                  </tr>
                ) : (
                  supplierBreakdown.map(s => {
                    const supObj = suppliers.find(sup => sup.id === s.supplierId);
                    return (
                      <tr key={s.supplierId} className="hover:bg-teal-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{s.supplierName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {supObj?.phone || 'Ph: N/A'} | Terms: {supObj?.paymentTerms || 'Net 30'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          {s.invoiceCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          ₹{s.totalTaxable.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-teal-700">
                          ₹{s.totalTax.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                          ₹{s.totalPurchases.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          ₹{(s.totalPurchases / s.invoiceCount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                          ₹{s.unpaidAmount.toFixed(2)}
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

      {/* Sub-Tab 3: Product-wise Inward Breakdown */}
      {activeSubTab === 'products' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Medicine / Product</th>
                  <th className="py-3 px-4 text-center">Billed Qty</th>
                  <th className="py-3 px-4 text-center">Free Qty</th>
                  <th className="py-3 px-4 text-center">Total Inward</th>
                  <th className="py-3 px-4 text-right">Avg Rate (₹)</th>
                  <th className="py-3 px-4 text-right">MRP (₹)</th>
                  <th className="py-3 px-4 text-center">GST %</th>
                  <th className="py-3 px-4 text-right">Total Spend (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {productBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      No products inwarded in the selected filter period.
                    </td>
                  </tr>
                ) : (
                  productBreakdown.map((p, idx) => (
                    <tr key={idx} className="hover:bg-teal-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.medicineName}</div>
                        <div className="text-[10px] text-slate-400">
                          {p.genericName || 'Generic composition'} • HSN: {p.hsnCode || '300490'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {p.totalBilledQty}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">
                        {p.totalFreeQty > 0 ? `+${p.totalFreeQty}` : '0'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-extrabold text-slate-900">
                        {p.totalInwardQty}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        ₹{p.avgPurchaseRate.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        ₹{p.mrp.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700">
                        {p.gstRate}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                        ₹{p.totalCostSpent.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: GST Input Tax Credit Statement (GSTR-2B Ready) */}
      {activeSubTab === 'gst-itc' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">GST Input Tax Credit (ITC) Slab-wise Breakdown</h3>
              <p className="text-xs text-slate-500">
                Ready for GSTR-2B monthly matching and GSTR-3B Table 4(A)(5) Input Tax Credit claim
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">GST Rate Slab</th>
                  <th className="py-3 px-4 text-center">Items Inwarded</th>
                  <th className="py-3 px-4 text-right">Taxable Value (₹)</th>
                  <th className="py-3 px-4 text-right">CGST (₹)</th>
                  <th className="py-3 px-4 text-right">SGST (₹)</th>
                  <th className="py-3 px-4 text-right">Total Eligible ITC (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {gstBreakdown.map(g => (
                  <tr key={g.rate} className="hover:bg-teal-50/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <span className="inline-block w-3 h-3 rounded-full bg-teal-500 mr-2 align-middle"></span>
                      GST {g.rate}% Slab
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {g.itemsCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      ₹{g.taxableAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-600">
                      ₹{g.cgst.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-600">
                      ₹{g.sgst.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-teal-700">
                      ₹{g.totalTax.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-slate-100/70 font-extrabold text-slate-900 border-t-2 border-slate-300">
                  <td className="py-3.5 px-4 uppercase text-xs">Total ITC (All Slabs)</td>
                  <td className="py-3.5 px-4 text-center">
                    {gstBreakdown.reduce((sum, g) => sum + g.itemsCount, 0)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    ₹{gstBreakdown.reduce((sum, g) => sum + g.taxableAmount, 0).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    ₹{gstBreakdown.reduce((sum, g) => sum + g.cgst, 0).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    ₹{gstBreakdown.reduce((sum, g) => sum + g.sgst, 0).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-teal-800 text-sm">
                    ₹{gstBreakdown.reduce((sum, g) => sum + g.totalTax, 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal (if clicked directly from report) */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4 my-auto animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Purchase Voucher: {viewingInvoice.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewingInvoice.distributorName} • Dated: {viewingInvoice.invoiceDate}
                </p>
              </div>
              <button
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

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Amount:</span>
                  <span className="font-mono">₹{(viewingInvoice.taxableAmount || viewingInvoice.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-teal-700 font-semibold">
                  <span>GST Total (CGST + SGST):</span>
                  <span className="font-mono">₹{(viewingInvoice.totalTax || (viewingInvoice.cgst + viewingInvoice.sgst)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="font-mono">₹{viewingInvoice.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Payment Modal */}
      {showPaymentModal && paymentTargetInvoice && (
        <SupplierPaymentModal
          isOpen={showPaymentModal}
          invoice={paymentTargetInvoice}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentTargetInvoice(null);
          }}
          onPaymentSuccess={(updated) => {
            reload();
            setToastMessage(`Payment recorded successfully for invoice ${updated.invoiceNo || (updated as any).invoiceNumber || updated.id}. Remaining balance: ₹${(updated.balanceAmount || 0).toFixed(2)}`);
            setTimeout(() => setToastMessage(null), 6000);
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{toastMessage}</p>
          <button
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
