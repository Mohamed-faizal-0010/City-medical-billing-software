import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  FileSpreadsheet,
  Calendar,
  Layers,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  X,
  Receipt,
  CheckCircle2,
  Boxes,
  Download,
  FileText,
  AlertTriangle,
  Clock,
  Eye,
  Filter,
  AlertOctagon,
  RotateCcw,
  Truck,
  Building2,
  Percent,
  Stethoscope
} from 'lucide-react';
import {
  SaleTransaction,
  Medicine,
  PurchaseOrder,
  PurchaseInvoice,
  OperatingExpense,
  SalesReturn,
  PurchaseReturn
} from '../types';
import { StorageService } from '../services/storage';
import { PrintInvoiceModal } from '../components/PrintInvoiceModal';
import { StockReportView } from '../components/StockReportView';
import { PurchaseReportView } from '../components/PurchaseReportView';
import { ScheduleDrugReportView } from '../components/ScheduleDrugReportView';
import { DailyRevenueTrendsChart } from '../components/DailyRevenueTrendsChart';
import { WholesaleHubView, WholesaleTab } from '../components/WholesaleHubView';
import { RetailPurchaseHubView } from '../components/RetailPurchaseHubView';
import { ProfitabilityReportView } from '../components/ProfitabilityReportView';
import { DoctorCommissionsReportView } from '../components/DoctorCommissionsReportView';
import {
  exportReportToExcel,
  exportReportToPDF,
  printReportWindow,
  exportThermalReceiptToPDF
} from '../utils/exportUtils';
import { printDirectBill } from '../utils/printDirectUtils';
import { parseExpiryDate, getDaysUntilExpiry } from '../utils/dateUtils';

interface ReportsViewProps {
  onRefreshData?: () => void;
  initialSubTab?: SubTab;
}

export type SubTab =
  | 'all'
  | 'sales'
  | 'wholesale-sales'
  | 'wholesale-pending'
  | 'wholesale-returns'
  | 'purchases'
  | 'retail-pending'
  | 'retail-payments'
  | 'retail-suppliers'
  | 'wholesale-purchases'
  | 'wholesale-purchase-returns'
  | 'stock-report'
  | 'profitability'
  | 'doctor-commissions'
  | 'schedule-drugs'
  | 'pnl'
  | 'valuation'
  | 'gst'
  | 'expiry'
  | 'expenses';
type DateRange = 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | 'last_month' | 'year' | 'custom';

export const ReportsView: React.FC<ReportsViewProps> = ({ onRefreshData, initialSubTab }) => {
  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => StorageService.getTransactions());
  const [medicines] = useState<Medicine[]>(() => StorageService.getMedicines());
  const [purchaseOrders] = useState<PurchaseOrder[]>(() => StorageService.getPurchaseOrders());
  const [purchaseInvoices] = useState<PurchaseInvoice[]>(() => StorageService.getPurchaseInvoices());
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>(() => StorageService.getSalesReturns());
  const [expenses, setExpenses] = useState<OperatingExpense[]>(() => StorageService.getExpenses());

  const handleResetSalesToZero = () => {
    if (window.confirm('Reset all sales invoices and metrics to ZERO? This will clear historical sales so all sales, Gross Sales, COGS, Discounts Conceded, and Output GST start fresh from today onwards.')) {
      StorageService.clearAllSalesTransactions();
      setTransactions([]);
      setSalesReturns([]);
      if (onRefreshData) onRefreshData();
    }
  };

  const [activeSubTab, setActiveSubTab] = useState<SubTab>(initialSubTab || 'all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<SaleTransaction | null>(null);

  // Sync with initialSubTab changes from parent navigation
  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // New Expense form state
  const [expCategory, setExpCategory] = useState<OperatingExpense['category']>('Rent');
  const [expAmount, setExpAmount] = useState<number>(5000);
  const [expDesc, setExpDesc] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);

  // Date filtering helper
  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return true;
    if (dateRange === 'all') return true;
    if (dateRange === 'custom') {
      const dStr = dateStr.slice(0, 10);
      if (startDate && dStr < startDate) return false;
      if (endDate && dStr > endDate) return false;
      return true;
    }
    const d = new Date(dateStr);
    const now = new Date();
    if (dateRange === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (dateRange === 'yesterday') {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      return d.toDateString() === yest.toDateString();
    }
    if (dateRange === '7d') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      return d >= past;
    }
    if (dateRange === '30d') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      return d >= past;
    }
    if (dateRange === 'this_month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    if (dateRange === 'last_month') {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
    }
    if (dateRange === 'year') {
      const curYear = now.getFullYear();
      const finYearStart = new Date(curYear, 3, 1); // April 1st
      return d >= finYearStart;
    }
    return true;
  };

  // Human-readable period description for headers & exports
  const periodDescription = useMemo(() => {
    if (dateRange === 'today') return `Today (${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`;
    if (dateRange === 'yesterday') {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      return `Yesterday (${yest.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`;
    }
    if (dateRange === '7d') return 'Last 7 Days';
    if (dateRange === '30d') return 'Last 30 Days';
    if (dateRange === 'this_month') {
      return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
    if (dateRange === 'last_month') {
      const lm = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
      return lm.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
    if (dateRange === 'year') return 'FY 2026-27 (Tamil Nadu)';
    if (dateRange === 'custom') {
      return `${startDate} to ${endDate}`;
    }
    return 'All-Time Records';
  }, [dateRange, startDate, endDate]);

  const periodFileSlug = useMemo(() => {
    if (dateRange === 'custom') {
      return `${startDate}_to_${endDate}`;
    }
    return dateRange;
  }, [dateRange, startDate, endDate]);

  // Filtered datasets
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => isDateInRange(tx.date));
  }, [transactions, dateRange, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => isDateInRange(exp.date));
  }, [expenses, dateRange, startDate, endDate]);

  const filteredSalesReturns = useMemo(() => {
    return salesReturns.filter(r => isDateInRange(r.date));
  }, [salesReturns, dateRange, startDate, endDate]);

  // 1. Sales & Revenue metrics
  const totalSalesGross = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + (tx.grandTotal ?? 0), 0);
  }, [filteredTransactions]);

  const totalCOGS = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + (tx.costOfGoodsSold || (tx.grandTotal ?? 0) * 0.65), 0);
  }, [filteredTransactions]);

  const totalSalesRefunds = useMemo(() => {
    return filteredSalesReturns.reduce((sum, r) => sum + (r.totalRefundAmount ?? r.refundAmount ?? 0), 0);
  }, [filteredSalesReturns]);

  const totalDiscountGiven = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + (tx.totalDiscount ?? 0), 0);
  }, [filteredTransactions]);

  const netSalesRevenue = (totalSalesGross ?? 0) - (totalSalesRefunds ?? 0);
  const grossProfit = netSalesRevenue - (totalCOGS ?? 0);
  const grossMarginPercent = netSalesRevenue > 0 ? (((grossProfit || 0) / netSalesRevenue) * 100).toFixed(1) : '0.0';

  const totalOperatingExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  }, [filteredExpenses]);

  const netOperatingProfit = grossProfit - totalOperatingExpenses;
  const netMarginPercent = netSalesRevenue > 0 ? (((netOperatingProfit || 0) / netSalesRevenue) * 100).toFixed(1) : '0.0';

  // 2. Inventory valuation metrics
  const inventoryMetrics = useMemo(() => {
    let totalUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let expiringUnits = 0;
    let expiringValuation = 0;

    const sixtyDaysLater = new Date();
    sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60);

    medicines.forEach(m => {
      m.batches.forEach(b => {
        const stock = b.stock ?? 0;
        const costPrice = b.costPrice ?? 0;
        const sellingPrice = b.sellingPrice ?? 0;
        totalUnits += stock;
        totalCostValuation += stock * costPrice;
        totalRetailValuation += stock * sellingPrice;

        const exp = parseExpiryDate(b.expiryDate);
        if (exp && exp <= sixtyDaysLater) {
          expiringUnits += stock;
          expiringValuation += stock * costPrice;
        }
      });
    });

    const potentialMargin = totalRetailValuation - totalCostValuation;
    const potentialMarginPercent = totalRetailValuation > 0
      ? (((potentialMargin || 0) / totalRetailValuation) * 100).toFixed(1)
      : '0.0';

    const zeroStockCount = medicines.filter(
      m => (Array.isArray(m.batches) ? m.batches : []).reduce((s, b) => s + (b.stock || 0), 0) === 0
    ).length;

    return {
      totalUnits,
      totalCostValuation,
      totalRetailValuation,
      potentialMargin,
      potentialMarginPercent,
      expiringUnits,
      expiringValuation,
      zeroStockCount
    };
  }, [medicines]);

  // 3. GST metrics
  const gstMetrics = useMemo(() => {
    let outputTaxCollected = 0;
    let taxable12Sales = 0;
    let taxable18Sales = 0;
    let taxable5Sales = 0;

    filteredTransactions.forEach(tx => {
      outputTaxCollected += tx.totalTax ?? 0;
      tx.items.forEach(item => {
        if (item.taxRate === 12) taxable12Sales += item.total ?? 0;
        else if (item.taxRate === 18) taxable18Sales += item.total ?? 0;
        else if (item.taxRate === 5) taxable5Sales += item.total ?? 0;
      });
    });

    let inputTaxCredit = 0;
    purchaseInvoices.forEach(inv => {
      if (isDateInRange(inv.invoiceDate)) {
        inputTaxCredit += inv.totalTax ?? 0;
      }
    });

    const netTaxPayable = Math.max(0, outputTaxCollected - inputTaxCredit);
    const cgstSplit = outputTaxCollected / 2;
    const sgstSplit = outputTaxCollected / 2;

    return {
      outputTaxCollected,
      inputTaxCredit,
      netTaxPayable,
      cgstSplit,
      sgstSplit,
      taxable5Sales,
      taxable12Sales,
      taxable18Sales
    };
  }, [filteredTransactions, purchaseOrders, dateRange, startDate, endDate]);

  // 4. Expiry & Batch analysis list
  const expiryBatches = useMemo(() => {
    const list: {
      medicineName: string;
      genericName: string;
      category: string;
      rackLocation: string;
      batchNumber: string;
      expiryDate: string;
      daysRemaining: number;
      stock: number;
      costPrice: number;
      sellingPrice: number;
      totalCostValue: number;
      status: 'Expired' | 'Critical' | 'Warning' | 'Safe';
    }[] = [];

    const now = new Date();

    medicines.forEach(med => {
      med.batches.forEach(batch => {
        const daysRemaining = getDaysUntilExpiry(batch.expiryDate);

        let status: 'Expired' | 'Critical' | 'Warning' | 'Safe' = 'Safe';
        if (daysRemaining < 0) status = 'Expired';
        else if (daysRemaining <= 30) status = 'Critical';
        else if (daysRemaining <= 60) status = 'Warning';

        list.push({
          medicineName: med.name,
          genericName: med.genericName,
          category: med.category,
          rackLocation: med.rackLocation || 'Rack A-1',
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          daysRemaining,
          stock: batch.stock,
          costPrice: batch.costPrice,
          sellingPrice: batch.sellingPrice,
          totalCostValue: batch.stock * batch.costPrice,
          status
        });
      });
    });

    // Sort: Expired & critical first
    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [medicines]);

  // Expense recording handler
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const newExp: OperatingExpense = {
      id: `exp-${Date.now()}`,
      date: expDate,
      category: expCategory,
      amount: Number(expAmount),
      description: expDesc || `${expCategory} payment`
    };

    StorageService.addExpense(newExp);
    setExpenses(StorageService.getExpenses());
    setShowAddExpenseModal(false);
    setExpDesc('');
    if (onRefreshData) onRefreshData();
  };

  // =========================================================================
  // EXPORT HANDLERS FOR EVERY REPORT
  // =========================================================================

  // 1. Sales Register Exports
  const getSalesExportData = () => {
    const headers = ['Invoice #', 'Date & Time', 'Customer', 'Doctor', 'Payment', 'Items', 'Subtotal (₹)', 'Discount (₹)', 'GST (₹)', 'Net Total (₹)'];
    const rows = filteredTransactions.map(tx => [
      tx.id,
      new Date(tx.date).toLocaleString(),
      tx.patientName || 'Walk-in Customer',
      tx.doctorName || 'Self / OTC Recommendation',
      tx.paymentMethod,
      (tx.items || []).length,
      (tx.subtotal ?? 0).toFixed(2),
      (tx.totalDiscount ?? 0).toFixed(2),
      (tx.totalTax ?? 0).toFixed(2),
      (tx.grandTotal ?? 0).toFixed(2)
    ]);
    const summary = [
      { label: 'Total Invoiced Amount', value: `₹${totalSalesGross.toFixed(2)}` },
      { label: 'Total Invoices Count', value: filteredTransactions.length },
      { label: 'Total Output GST Collected', value: `₹${gstMetrics.outputTaxCollected.toFixed(2)}` },
      { label: 'Total Discounts Given', value: `₹${totalDiscountGiven.toFixed(2)}` }
    ];
    return { headers, rows, summary };
  };

  const handlePrintSales = () => {
    const { headers, rows, summary } = getSalesExportData();
    printReportWindow({
      title: 'Daily Sales & POS Transaction Audit Register',
      subtitle: `City Medical ERP • Period: ${periodDescription} • Generated: ${new Date().toLocaleString()}`,
      headers,
      rows,
      summaryCards: summary
    });
  };

  const handlePDFSales = () => {
    const { headers, rows, summary } = getSalesExportData();
    exportReportToPDF({
      filename: `CityRx-Sales-Register-${periodFileSlug}.pdf`,
      title: 'Daily Sales & POS Transaction Audit Register',
      subtitle: `Period: ${periodDescription} | Pharmacy License: TN-625103-20B/21B`,
      headers,
      rows,
      orientation: 'landscape',
      summaryCards: summary
    });
  };

  const handleExcelSales = () => {
    const { headers, rows, summary } = getSalesExportData();
    exportReportToExcel(
      `CityRx-Sales-Register-${periodFileSlug}.xlsx`,
      'Sales Register',
      headers,
      rows,
      {
        title: 'Daily Sales & Transaction Audit Register',
        subtitle: `Period: ${periodDescription}`,
        summary
      }
    );
  };

  // 2. Profit & Loss Exports
  const getPnLExportData = () => {
    const headers = ['Financial Line Item', 'Particulars / Description', 'Amount (INR)'];
    const rows: (string | number)[][] = [
      ['Operating Revenue', 'Retail Medicine POS Sales', `₹${totalSalesGross.toFixed(2)}`],
      ['Operating Revenue', 'Less: Customer Returns & Refunds', `-₹${totalSalesRefunds.toFixed(2)}`],
      ['Net Operating Revenue', 'Gross Sales minus Returns', `₹${netSalesRevenue.toFixed(2)}`],
      ['Cost of Goods Sold (COGS)', 'Wholesale Purchase Cost of Medicines Dispensed', `₹${totalCOGS.toFixed(2)}`],
      ['Gross Profit', `Margin: ${grossMarginPercent}%`, `₹${grossProfit.toFixed(2)}`],
      ['Operating Expenses', 'Operating Overhead Ledger', ''],
      ...filteredExpenses.map(exp => [
        `OPEX: ${exp.category}`,
        `${exp.description} (${exp.date})`,
        `-₹${Number(exp.amount).toFixed(2)}`
      ]),
      ['Total Operating Expenses', 'Overheads (Rent, Salaries, Utilities, Chiller)', `-₹${totalOperatingExpenses.toFixed(2)}`],
      ['Net Bottom-Line Profit', `Net Margin: ${netMarginPercent}%`, `₹${netOperatingProfit.toFixed(2)}`]
    ];
    const summary = [
      { label: 'Net Revenue', value: `₹${netSalesRevenue.toFixed(2)}` },
      { label: 'COGS', value: `₹${totalCOGS.toFixed(2)}` },
      { label: 'Gross Profit', value: `₹${grossProfit.toFixed(2)} (${grossMarginPercent}%)` },
      { label: 'Operating Expenses', value: `₹${totalOperatingExpenses.toFixed(2)}` },
      { label: 'Net Operating Profit', value: `₹${netOperatingProfit.toFixed(2)} (${netMarginPercent}%)` }
    ];
    return { headers, rows, summary };
  };

  const handlePrintPnL = () => {
    const { headers, rows, summary } = getPnLExportData();
    printReportWindow({
      title: 'Comprehensive Profit & Loss Statement (P&L)',
      subtitle: `City Medical • Melur Taluk, Madurai • Period: ${periodDescription}`,
      headers,
      rows,
      summaryCards: summary
    });
  };

  const handlePDFPnL = () => {
    const { headers, rows, summary } = getPnLExportData();
    exportReportToPDF({
      filename: `CityRx-Profit-Loss-Statement-${periodFileSlug}.pdf`,
      title: 'Comprehensive Profit & Loss Statement (P&L)',
      subtitle: `Melur Taluk, Madurai | Period: ${periodDescription}`,
      headers,
      rows,
      orientation: 'portrait',
      summaryCards: summary
    });
  };

  const handleExcelPnL = () => {
    const { headers, rows, summary } = getPnLExportData();
    exportReportToExcel(
      `CityRx-Profit-Loss-Statement-${periodFileSlug}.xlsx`,
      'Income Statement',
      headers,
      rows,
      {
        title: 'Comprehensive Profit & Loss Statement',
        subtitle: `Period: ${periodDescription}`,
        summary
      }
    );
  };

  // 3. Inventory Valuation Exports
  const getValuationExportData = () => {
    const headers = ['Medicine Name', 'Generic Molecule', 'Category', 'Rack', 'Stock Qty', 'Cost Price (₹)', 'Retail MRP (₹)', 'Total Cost (₹)', 'Retail Value (₹)', 'Potential Margin'];
    const rows = (medicines || []).map(m => {
      const batches = Array.isArray(m.batches) ? m.batches : [];
      const totalStock = batches.reduce((s, b) => s + (b.stock || 0), 0);
      const avgCost = batches.length > 0 ? batches.reduce((s, b) => s + (b.costPrice || 0), 0) / batches.length : 0;
      const avgMRP = batches.length > 0 ? batches.reduce((s, b) => s + (b.sellingPrice || 0), 0) / batches.length : 0;
      const costVal = batches.reduce((s, b) => s + (b.stock || 0) * (b.costPrice || 0), 0);
      const retailVal = batches.reduce((s, b) => s + (b.stock || 0) * (b.sellingPrice || 0), 0);
      const marginPct = retailVal > 0 ? (((retailVal - costVal) / retailVal) * 100).toFixed(1) + '%' : '0%';
      return [
        m.name,
        m.genericName,
        m.category,
        m.rackLocation || 'Rack A-1',
        totalStock,
        avgCost.toFixed(2),
        avgMRP.toFixed(2),
        costVal.toFixed(2),
        retailVal.toFixed(2),
        marginPct
      ];
    });
    const summary = [
      { label: 'Total Units On-Hand', value: inventoryMetrics.totalUnits },
      { label: 'Zero Stock Total (0 Units)', value: `${inventoryMetrics.zeroStockCount} SKUs` },
      { label: 'Valuation at Cost (FIFO)', value: `₹${inventoryMetrics.totalCostValuation.toFixed(2)}` },
      { label: 'Valuation at Retail MRP', value: `₹${inventoryMetrics.totalRetailValuation.toFixed(2)}` },
      { label: 'Potential Gross Margin', value: `₹${inventoryMetrics.potentialMargin.toFixed(2)} (${inventoryMetrics.potentialMarginPercent}%)` },
      { label: 'Stock Near Expiry (60D)', value: `₹${inventoryMetrics.expiringValuation.toFixed(2)} (${inventoryMetrics.expiringUnits} units)` }
    ];
    return { headers, rows, summary };
  };

  const handlePrintValuation = () => {
    const { headers, rows, summary } = getValuationExportData();
    printReportWindow({
      title: 'Inventory Asset Valuation & Margin Metrics Report',
      subtitle: `City Medical • Real-time FEFO/FIFO valuation • ${medicines.length} molecules`,
      headers,
      rows,
      summaryCards: summary
    });
  };

  const handlePDFValuation = () => {
    const { headers, rows, summary } = getValuationExportData();
    exportReportToPDF({
      filename: `CityRx-Inventory-Valuation.pdf`,
      title: 'Inventory Asset Valuation & Margin Metrics Report',
      subtitle: `FIFO/FEFO Costing & Retail Valuation • ${medicines.length} Distinct Molecules`,
      headers,
      rows,
      orientation: 'landscape',
      summaryCards: summary
    });
  };

  const handleExcelValuation = () => {
    const { headers, rows, summary } = getValuationExportData();
    exportReportToExcel(
      `CityRx-Inventory-Valuation.xlsx`,
      'Stock Valuation',
      headers,
      rows,
      {
        title: 'Inventory Asset Valuation Report',
        subtitle: `Wholesale Cost vs Retail MRP Valuation`,
        summary
      }
    );
  };

  // 4. GST & Tax Compliance Exports
  const getGSTExportData = () => {
    const headers = ['Invoice / Doc #', 'Date', 'Party / Customer', 'HSN Code', 'Tax Rate', 'Taxable Base (₹)', 'CGST (₹)', 'SGST (₹)', 'Total Bill (₹)'];
    const rows = filteredTransactions.map(tx => {
      const taxable = (tx.grandTotal ?? 0) - (tx.totalTax ?? 0);
      const cgst = (tx.totalTax ?? 0) / 2;
      const sgst = (tx.totalTax ?? 0) / 2;
      return [
        tx.id,
        new Date(tx.date).toLocaleDateString(),
        tx.patientName || 'Retail Customer',
        '300490',
        '12% / 18%',
        taxable.toFixed(2),
        cgst.toFixed(2),
        sgst.toFixed(2),
        (tx.grandTotal ?? 0).toFixed(2)
      ];
    });
    const summary = [
      { label: 'Total Output GST Collected', value: `₹${gstMetrics.outputTaxCollected.toFixed(2)}` },
      { label: 'Input Tax Credit (ITC)', value: `₹${gstMetrics.inputTaxCredit.toFixed(2)}` },
      { label: 'Net Cash Ledger GST Payable', value: `₹${gstMetrics.netTaxPayable.toFixed(2)}` },
      { label: 'CGST Total (Central 50%)', value: `₹${gstMetrics.cgstSplit.toFixed(2)}` },
      { label: 'SGST Total (Tamil Nadu 50%)', value: `₹${gstMetrics.sgstSplit.toFixed(2)}` }
    ];
    return { headers, rows, summary };
  };

  const handlePrintGST = () => {
    const { headers, rows, summary } = getGSTExportData();
    printReportWindow({
      title: 'GST & Commercial Tax Compliance Register (GSTR-1 & 3B)',
      subtitle: `GSTIN: 33AABCC5541Q1Z8 (Tamil Nadu) • Period: ${periodDescription}`,
      headers,
      rows,
      summaryCards: summary
    });
  };

  const handlePDFGST = () => {
    const { headers, rows, summary } = getGSTExportData();
    exportReportToPDF({
      filename: `CityRx-GST-Compliance-${periodFileSlug}.pdf`,
      title: 'GST & Commercial Tax Compliance Register (GSTR-1 & 3B)',
      subtitle: `GSTIN: 33AABCC5541Q1Z8 | Period: ${periodDescription}`,
      headers,
      rows,
      orientation: 'landscape',
      summaryCards: summary
    });
  };

  const handleExcelGST = () => {
    const { headers, rows, summary } = getGSTExportData();
    exportReportToExcel(
      `CityRx-GST-Compliance-${periodFileSlug}.xlsx`,
      'GST Register',
      headers,
      rows,
      {
        title: 'GST Compliance Register (GSTR-1 / 3B Format)',
        subtitle: `GSTIN: 33AABCC5541Q1Z8 (Tamil Nadu) | Period: ${periodDescription}`,
        summary
      }
    );
  };

  // 5. Expiry Risk Register Exports
  const getExpiryExportData = () => {
    const headers = ['Medicine Name', 'Generic Molecule', 'Batch #', 'Expiry Date', 'Days Left', 'Status', 'Stock Qty', 'Unit Cost (₹)', 'Value at Risk (₹)', 'Location'];
    const rows = expiryBatches.map(b => [
      b.medicineName,
      b.genericName,
      b.batchNumber,
      b.expiryDate,
      b.daysRemaining,
      b.status,
      b.stock,
      b.costPrice.toFixed(2),
      b.totalCostValue.toFixed(2),
      b.rackLocation
    ]);
    const totalRiskVal = expiryBatches.filter(b => b.status !== 'Safe').reduce((s, b) => s + b.totalCostValue, 0);
    const criticalCount = expiryBatches.filter(b => b.status === 'Critical' || b.status === 'Expired').length;
    const summary = [
      { label: 'Total Batches Monitored', value: expiryBatches.length },
      { label: 'Expired & Critical Batches', value: criticalCount },
      { label: 'Total Stock Capital at Risk', value: `₹${totalRiskVal.toFixed(2)}` }
    ];
    return { headers, rows, summary };
  };

  const handlePrintExpiry = () => {
    const { headers, rows, summary } = getExpiryExportData();
    printReportWindow({
      title: 'Drug Expiry & Batch Risk Register',
      subtitle: `City Medical ERP • FEFO Risk Analysis • Generated: ${new Date().toLocaleString()}`,
      headers,
      rows,
      summaryCards: summary
    });
  };

  const handlePDFExpiry = () => {
    const { headers, rows, summary } = getExpiryExportData();
    exportReportToPDF({
      filename: `CityRx-Drug-Expiry-Risk-Register.pdf`,
      title: 'Drug Expiry & Batch Risk Register',
      subtitle: `Drugs & Cosmetics Act Compliance • Stock Rotation & Return To Supplier`,
      headers,
      rows,
      orientation: 'landscape',
      summaryCards: summary
    });
  };

  const handleExcelExpiry = () => {
    const { headers, rows, summary } = getExpiryExportData();
    exportReportToExcel(
      `CityRx-Drug-Expiry-Risk-Register.xlsx`,
      'Expiry Register',
      headers,
      rows,
      {
        title: 'Drug Expiry & Batch Risk Register',
        subtitle: `FEFO Compliance & Stock Rotation`,
        summary
      }
    );
  };

  // 6. Expenses Ledger Exports
  const getExpensesExportData = () => {
    const headers = ['Date', 'Category', 'Description', 'Amount (INR)'];
    const rows = filteredExpenses.map(exp => [
      exp.date,
      exp.category,
      exp.description,
      Number(exp.amount).toFixed(2)
    ]);
    const summary = [
      { label: 'Total Operating Expenses', value: `₹${totalOperatingExpenses.toFixed(2)}` },
      { label: 'Number of Expense Records', value: filteredExpenses.length }
    ];
    return { headers, rows, summary };
  };

  const handlePrintExpenses = () => {
    const { headers, rows, summary } = getExpensesExportData();
    printReportWindow({
      title: 'Operating Expenses Ledger',
      subtitle: `City Medical • Period: ${periodDescription} • Generated: ${new Date().toLocaleString()}`,
      headers,
      rows,
      summaryCards: summary
    });
  };

  const handlePDFExpenses = () => {
    const { headers, rows, summary } = getExpensesExportData();
    exportReportToPDF({
      filename: `CityRx-Operating-Expenses-${periodFileSlug}.pdf`,
      title: 'Operating Expenses Ledger',
      subtitle: `Rent, Salaries, Utilities & Maintenance | Period: ${periodDescription}`,
      headers,
      rows,
      orientation: 'portrait',
      summaryCards: summary
    });
  };

  const handleExcelExpenses = () => {
    const { headers, rows, summary } = getExpensesExportData();
    exportReportToExcel(
      `CityRx-Operating-Expenses-${periodFileSlug}.xlsx`,
      'Operating Expenses',
      headers,
      rows,
      {
        title: 'Operating Expenses Ledger',
        subtitle: `Period: ${periodDescription}`,
        summary
      }
    );
  };

  // 7. All Reports Executive Summary Exports
  const getAllSummaryExportData = () => {
    const headers = ['Report Category', 'Metric / Indicator', 'Current Value', 'Status / Remarks'];
    const rows: (string | number)[][] = [
      ['Sales & Revenue', 'Gross Sales Turnover', `₹${totalSalesGross.toFixed(2)}`, `${filteredTransactions.length} Invoices dispensed`],
      ['Sales & Revenue', 'Discounts Conceded', `-₹${totalDiscountGiven.toFixed(2)}`, 'Retail MRP Discounts'],
      ['Sales & Revenue', 'Sales Returns / Refunds', `-₹${totalSalesRefunds.toFixed(2)}`, `${filteredSalesReturns.length} credit notes issued`],
      ['Procurement', 'Wholesale COGS Dispensed', `₹${totalCOGS.toFixed(2)}`, 'Cost of retail inventory sold'],
      ['Profitability', 'Gross Margin', `₹${grossProfit.toFixed(2)}`, `${grossMarginPercent}% of Net Sales`],
      ['Profitability', 'Operating Overhead (OPEX)', `₹${totalOperatingExpenses.toFixed(2)}`, `${filteredExpenses.length} Expense vouchers`],
      ['Profitability', 'Net Operating Profit', `₹${netOperatingProfit.toFixed(2)}`, `${netMarginPercent}% Net bottom line`],
      ['Inventory Assets', 'Total Stock Valuation (Cost)', `₹${inventoryMetrics.totalCostValuation.toFixed(2)}`, `${inventoryMetrics.totalUnits} physical units in stock`],
      ['Inventory Assets', 'Total Retail Stock Value (MRP)', `₹${inventoryMetrics.totalRetailValuation.toFixed(2)}`, `Unrealized Margin: ₹${(inventoryMetrics.totalRetailValuation - inventoryMetrics.totalCostValuation).toFixed(2)}`],
      ['Tax Compliance', 'Output GST Collected', `₹${gstMetrics.outputTaxCollected.toFixed(2)}`, 'Liabilities on retail bills'],
      ['Tax Compliance', 'Input Tax Credit (ITC)', `₹${gstMetrics.inputTaxCredit.toFixed(2)}`, 'Credit from inward purchase bills'],
      ['Tax Compliance', 'Net GST Payable to Govt', `₹${gstMetrics.netTaxPayable.toFixed(2)}`, 'GSTR-3B Cash Ledger payable'],
      ['Expiry Risk', 'Stock at Risk (FEFO)', `₹${expiryBatches.filter(b => b.status !== 'Safe').reduce((s, b) => s + b.totalCostValue, 0).toFixed(2)}`, `${expiryBatches.filter(b => b.status === 'Critical' || b.status === 'Expired').length} critical batches`]
    ];
    const summary = [
      { label: 'Gross Sales', value: `₹${totalSalesGross.toFixed(2)}` },
      { label: 'Gross Profit', value: `₹${grossProfit.toFixed(2)} (${grossMarginPercent}%)` },
      { label: 'Net Profit', value: `₹${netOperatingProfit.toFixed(2)} (${netMarginPercent}%)` },
      { label: 'Stock Value (Cost)', value: `₹${inventoryMetrics.totalCostValuation.toFixed(2)}` },
      { label: 'Net GST Payable', value: `₹${gstMetrics.netTaxPayable.toFixed(2)}` }
    ];
    return { headers, rows, summary };
  };

  const handlePrintAllSummary = () => {
    const { headers, rows, summary } = getAllSummaryExportData();
    printReportWindow({
      title: 'City Medical ERP - Comprehensive All Reports Executive Summary',
      subtitle: `Melur Taluk, Madurai • Period: ${periodDescription} • Generated: ${new Date().toLocaleString()}`,
      headers,
      rows,
      summaryCards: summary
    });
  };

  const handlePDFAllSummary = () => {
    const { headers, rows, summary } = getAllSummaryExportData();
    exportReportToPDF({
      filename: `CityRx-All-Reports-Summary-${periodFileSlug}.pdf`,
      title: 'Comprehensive All Reports Executive Summary',
      subtitle: `Melur Taluk, Madurai | Period: ${periodDescription}`,
      headers,
      rows,
      orientation: 'portrait',
      summaryCards: summary
    });
  };

  const handleExcelAllSummary = () => {
    const { headers, rows, summary } = getAllSummaryExportData();
    exportReportToExcel(
      `CityRx-All-Reports-Summary-${periodFileSlug}.xlsx`,
      'Executive Summary',
      headers,
      rows,
      {
        title: 'Comprehensive All Reports Executive Summary',
        subtitle: `Period: ${periodDescription}`,
        summary
      }
    );
  };

  // Master dispatcher based on currently active subtab
  const handlePrintActiveReport = () => {
    switch (activeSubTab) {
      case 'all': handlePrintAllSummary(); break;
      case 'stock-report': handlePrintValuation(); break;
      case 'profitability': handlePrintPnL(); break;
      case 'sales': handlePrintSales(); break;
      case 'purchases': handlePrintAllSummary(); break;
      case 'pnl': handlePrintPnL(); break;
      case 'valuation': handlePrintValuation(); break;
      case 'gst': handlePrintGST(); break;
      case 'expiry': handlePrintExpiry(); break;
      case 'expenses': handlePrintExpenses(); break;
    }
  };

  const handlePDFActiveReport = () => {
    switch (activeSubTab) {
      case 'all': handlePDFAllSummary(); break;
      case 'stock-report': handlePDFValuation(); break;
      case 'profitability': handlePDFPnL(); break;
      case 'sales': handlePDFSales(); break;
      case 'purchases': handlePDFAllSummary(); break;
      case 'pnl': handlePDFPnL(); break;
      case 'valuation': handlePDFValuation(); break;
      case 'gst': handlePDFGST(); break;
      case 'expiry': handlePDFExpiry(); break;
      case 'expenses': handlePDFExpenses(); break;
    }
  };

  const handleExcelActiveReport = () => {
    switch (activeSubTab) {
      case 'all': handleExcelAllSummary(); break;
      case 'stock-report': handleExcelValuation(); break;
      case 'profitability': handleExcelPnL(); break;
      case 'sales': handleExcelSales(); break;
      case 'purchases': handleExcelAllSummary(); break;
      case 'pnl': handleExcelPnL(); break;
      case 'valuation': handleExcelValuation(); break;
      case 'gst': handleExcelGST(); break;
      case 'expiry': handleExcelExpiry(); break;
      case 'expenses': handleExcelExpenses(); break;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & MASTER EXPORT ACTION BAR                                  */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              <span>Pharmacy Reports & Financial Audit</span>
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
              Print • PDF • Excel
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            City Medical ERP • Every report prints clean and exports directly to formatted PDF & Excel (.xlsx)
          </p>
        </div>

        {/* Action controls: Date Range Filter + Master Print & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter Dropdown */}
          <div className="flex items-center bg-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700 gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={dateRange}
              onChange={e => {
                const val = e.target.value as DateRange;
                setDateRange(val);
                const now = new Date();
                if (val === 'today') {
                  const today = now.toISOString().split('T')[0];
                  setStartDate(today);
                  setEndDate(today);
                } else if (val === 'yesterday') {
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  const yStr = y.toISOString().split('T')[0];
                  setStartDate(yStr);
                  setEndDate(yStr);
                } else if (val === '7d') {
                  const p = new Date();
                  p.setDate(p.getDate() - 7);
                  setStartDate(p.toISOString().split('T')[0]);
                  setEndDate(now.toISOString().split('T')[0]);
                } else if (val === '30d') {
                  const p = new Date();
                  p.setDate(p.getDate() - 30);
                  setStartDate(p.toISOString().split('T')[0]);
                  setEndDate(now.toISOString().split('T')[0]);
                } else if (val === 'this_month') {
                  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                  setStartDate(start);
                  setEndDate(now.toISOString().split('T')[0]);
                } else if (val === 'last_month') {
                  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
                  const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
                  setStartDate(start);
                  setEndDate(end);
                } else if (val === 'year') {
                  const start = new Date(now.getFullYear(), 3, 1).toISOString().split('T')[0];
                  setStartDate(start);
                  setEndDate(now.toISOString().split('T')[0]);
                }
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              id="report-date-range-filter"
            >
              <option value="all">All-Time Records</option>
              <option value="custom">📅 Custom Range (Start - End)</option>
              <option value="today">Today Only</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days (Month)</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="year">FY 2026-27 (Tamil Nadu)</option>
            </select>
          </div>

          {/* Start Date and End Date Pickers */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <div className="flex items-center gap-1">
              <label htmlFor="report-start-date-input" className="text-[10px] font-bold uppercase text-slate-500">
                Start:
              </label>
              <input
                id="report-start-date-input"
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setDateRange('custom');
                }}
                className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-teal-500 cursor-pointer"
                title="Report Start Date"
              />
            </div>
            <span className="text-slate-400 font-bold text-xs">-</span>
            <div className="flex items-center gap-1">
              <label htmlFor="report-end-date-input" className="text-[10px] font-bold uppercase text-slate-500">
                End:
              </label>
              <input
                id="report-end-date-input"
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setDateRange('custom');
                }}
                className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-teal-500 cursor-pointer"
                title="Report End Date"
              />
            </div>
            {dateRange === 'custom' && (
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-teal-100 text-teal-800">
                Custom
              </span>
            )}
          </div>

          {/* Master Print Button */}
          <button
            onClick={handlePrintActiveReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            id="master-print-report-btn"
            title="Open printer-friendly version of currently active report"
          >
            <Printer className="w-4 h-4 text-teal-400" />
            <span>Print Report</span>
          </button>

          {/* Master Download PDF Button */}
          <button
            onClick={handlePDFActiveReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            id="master-download-pdf-btn"
            title="Download active report as PDF document"
          >
            <Download className="w-4 h-4 text-rose-600" />
            <span>Download PDF</span>
          </button>

          {/* Master Download Excel / XL Button */}
          <button
            onClick={handleExcelActiveReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            id="master-download-xl-btn"
            title="Download active report as Excel spreadsheet (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Download XL</span>
          </button>

          {/* Add Expense Shortcut */}
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer ml-auto sm:ml-0"
            id="record-expense-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>

          {/* Reset Sales to Zero Button */}
          <button
            onClick={handleResetSalesToZero}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            id="reset-sales-zero-btn"
            title="Make sales invoice zero so all sales start fresh from today onwards"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset Sales to Zero</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ONE-BY-ONE REPORT SELECTION BUTTONS (SEPARATE IN ONE DEDICATED HUB)    */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 sm:p-2.5 shadow-2xs">
        <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>Select Report (One-by-One or All Reports)</span>
          </span>
          <span className="text-[10px] text-teal-700 font-semibold lowercase">
            showing: {activeSubTab.replace('-', ' ')}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* ALL REPORTS BUTTON */}
          <button
            onClick={() => setActiveSubTab('all')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 ring-2 ring-teal-500'
                : 'bg-white text-slate-700 hover:bg-teal-50 hover:text-teal-900 border border-slate-200'
            }`}
            id="tab-all-reports-hub"
          >
            <BarChart3 className="w-4 h-4" />
            <span>All Reports Hub</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${activeSubTab === 'all' ? 'bg-teal-800 text-white' : 'bg-teal-100 text-teal-800'}`}>
              Overview
            </span>
          </button>

          {/* 1. SALES REPORT BUTTON */}
          <button
            onClick={() => setActiveSubTab('sales')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'sales'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
            id="tab-sales-register"
          >
            <Receipt className="w-4 h-4 text-teal-400" />
            <span>Sales Report</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${activeSubTab === 'sales' ? 'bg-slate-800 text-teal-300' : 'bg-slate-100 text-slate-600'}`}>
              {filteredTransactions.length}
            </span>
          </button>

          {/* WHOLESALE B2B SALES REPORT BUTTON */}
          <button
            onClick={() => setActiveSubTab('wholesale-sales')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'wholesale-sales'
                ? 'bg-indigo-900 text-white shadow-xs ring-2 ring-indigo-500'
                : 'bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 border border-slate-200'
            }`}
            id="tab-wholesale-sales-report"
          >
            <Truck className="w-4 h-4 text-indigo-400" />
            <span>Wholesale Sales Report</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${activeSubTab === 'wholesale-sales' ? 'bg-indigo-800 text-white' : 'bg-indigo-100 text-indigo-800'}`}>
              B2B
            </span>
          </button>

          {/* WHOLESALE PAYMENT PENDING BUTTON */}
          <button
            onClick={() => setActiveSubTab('wholesale-pending')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'wholesale-pending'
                ? 'bg-amber-900 text-white shadow-xs ring-2 ring-amber-500'
                : 'bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-900 border border-slate-200'
            }`}
            id="tab-wholesale-payment-pending"
          >
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>Wholesale Payment Pending</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${activeSubTab === 'wholesale-pending' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'}`}>
              Credit Due
            </span>
          </button>

          {/* 2. PURCHASE REPORT BUTTON */}
          <button
            onClick={() => setActiveSubTab('purchases')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'purchases'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
            id="tab-purchases-register"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            <span>Purchase Inward Register</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${activeSubTab === 'purchases' ? 'bg-slate-800 text-teal-300' : 'bg-slate-100 text-slate-600'}`}>
              GST Inward
            </span>
          </button>

          {/* RETAIL PAYMENT PENDING BUTTON */}
          <button
            onClick={() => setActiveSubTab('retail-pending')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'retail-pending'
                ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400'
                : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
            }`}
            id="tab-retail-payment-pending-reports"
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Retail Payment Pending</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${activeSubTab === 'retail-pending' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'}`}>
              Due ₹
            </span>
          </button>

          {/* RETAIL PURCHASE PAYMENT REPORT BUTTON */}
          <button
            onClick={() => setActiveSubTab('retail-payments')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'retail-payments'
                ? 'bg-teal-600 text-white shadow-xs ring-2 ring-teal-400'
                : 'bg-white text-slate-700 hover:bg-teal-50 border border-slate-200'
            }`}
            id="tab-retail-payment-report-reports"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Purchase Payment Report</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${activeSubTab === 'retail-payments' ? 'bg-teal-800 text-white' : 'bg-teal-100 text-teal-800'}`}>
              Settled
            </span>
          </button>

          {/* RETAIL SUPPLIER LIST BUTTON */}
          <button
            onClick={() => setActiveSubTab('retail-suppliers')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'retail-suppliers'
                ? 'bg-slate-900 text-white shadow-xs ring-2 ring-slate-400'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
            id="tab-retail-supplier-list-reports"
          >
            <Building2 className="w-4 h-4 text-teal-500" />
            <span>Retail Supplier List</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${activeSubTab === 'retail-suppliers' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
              Pharma
            </span>
          </button>

          {/* 3. STOCK REPORT BUTTON */}
          <button
            onClick={() => setActiveSubTab('stock-report')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'stock-report'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
            id="tab-current-stock-report"
          >
            <Boxes className="w-4 h-4 text-teal-400" />
            <span>Stock Report</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${activeSubTab === 'stock-report' ? 'bg-slate-800 text-teal-300' : 'bg-slate-100 text-slate-600'}`}>
              22 Forms
            </span>
          </button>

          {/* SCHEDULE DRUG REPORT BUTTON */}
          <button
            onClick={() => setActiveSubTab('schedule-drugs')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'schedule-drugs'
                ? 'bg-rose-900 text-white shadow-xs ring-2 ring-rose-500'
                : 'bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-900 border border-slate-200'
            }`}
            id="tab-schedule-drug-report"
          >
            <AlertOctagon className="w-4 h-4 text-rose-500" />
            <span>Schedule Drug Report</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${activeSubTab === 'schedule-drugs' ? 'bg-rose-800 text-rose-200' : 'bg-rose-100 text-rose-800'}`}>
              Daily/Mth
            </span>
          </button>

          {/* PROFITABILITY REPORT BUTTON */}
          <button
            onClick={() => setActiveSubTab('profitability')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'profitability'
                ? 'bg-emerald-900 text-white shadow-xs ring-2 ring-emerald-500'
                : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200'
            }`}
            id="tab-profitability-report"
          >
            <Percent className="w-4 h-4 text-emerald-500" />
            <span>Profitability</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${activeSubTab === 'profitability' ? 'bg-emerald-800 text-emerald-200' : 'bg-emerald-100 text-emerald-800'}`}>
              Net Margin
            </span>
          </button>

          {/* DOCTOR COMMISSIONS REPORT BUTTON */}
          <button
            onClick={() => setActiveSubTab('doctor-commissions')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'doctor-commissions'
                ? 'bg-teal-900 text-white shadow-xs ring-2 ring-teal-500'
                : 'bg-white text-slate-700 hover:bg-teal-50 hover:text-teal-900 border border-slate-200'
            }`}
            id="tab-doctor-commissions-report"
          >
            <Stethoscope className="w-4 h-4 text-teal-500" />
            <span>Doctor Commissions</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${activeSubTab === 'doctor-commissions' ? 'bg-teal-800 text-teal-200' : 'bg-teal-100 text-teal-800'}`}>
              POS Rx
            </span>
          </button>

          {/* 4. P&L STATEMENT BUTTON */}
          <button
            onClick={() => setActiveSubTab('pnl')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'pnl'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
            id="tab-pnl-statement"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Profit & Loss</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${activeSubTab === 'pnl' ? 'bg-slate-800 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
              {grossMarginPercent}%
            </span>
          </button>

          {/* 5. INVENTORY VALUATION BUTTON */}
          <button
            onClick={() => setActiveSubTab('valuation')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'valuation'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
            id="tab-inventory-valuation"
          >
            <Boxes className="w-4 h-4 text-amber-400" />
            <span>Valuation</span>
          </button>

          {/* 6. GST COMPLIANCE BUTTON */}
          <button
            onClick={() => setActiveSubTab('gst')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'gst'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
            id="tab-gst-compliance"
          >
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>GST Tax (1/3B)</span>
          </button>

          {/* 7. EXPIRY RISK BUTTON */}
          <button
            onClick={() => setActiveSubTab('expiry')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'expiry'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
            id="tab-expiry-register"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Expiry Risk</span>
          </button>

          {/* 8. OPERATING EXPENSES BUTTON */}
          <button
            onClick={() => setActiveSubTab('expenses')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'expenses'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
            id="tab-operating-expenses"
          >
            <DollarSign className="w-4 h-4 text-sky-400" />
            <span>Expenses ({filteredExpenses.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB ALL: COMPREHENSIVE ALL-REPORTS MASTER HUB & EXECUTIVE OVERVIEW        */}
      {/* ========================================================================= */}
      {activeSubTab === 'all' && (
        <div className="space-y-6">
          {/* Executive Overview KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Gross Sales */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Gross Sales</span>
              <div className="text-xl font-black text-slate-900 mt-1">₹{totalSalesGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <span className="text-[10px] text-teal-700 font-semibold">{filteredTransactions.length} Invoices dispensed</span>
            </div>

            {/* 2. COGS */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Wholesale COGS</span>
              <div className="text-xl font-black text-slate-800 mt-1">₹{totalCOGS.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <span className="text-[10px] text-slate-500 font-medium">Cost of retail items</span>
            </div>

            {/* 3. Gross Margin */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Gross Profit</span>
              <div className="text-xl font-black text-emerald-600 mt-1">₹{grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <span className="text-[10px] text-emerald-700 font-bold">{grossMarginPercent}% Margin</span>
            </div>

            {/* 4. Net Operating Profit */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Net Bottom-Line</span>
              <div className="text-xl font-black text-teal-700 mt-1">₹{netOperatingProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <span className="text-[10px] text-teal-800 font-bold">{netMarginPercent}% Net Profit</span>
            </div>

            {/* 5. Inventory Asset Valuation */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Stock Asset (Cost)</span>
              <div className="text-xl font-black text-indigo-700 mt-1">₹{inventoryMetrics.totalCostValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <span className="text-[10px] text-indigo-900 font-medium">MRP: ₹{inventoryMetrics.totalRetailValuation.toFixed(0)}</span>
            </div>

            {/* 6. Net GST Payable */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Net GST Payable</span>
              <div className="text-xl font-black text-amber-700 mt-1">₹{gstMetrics.netTaxPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <span className="text-[10px] text-amber-800 font-medium">Output ₹{gstMetrics.outputTaxCollected.toFixed(0)} - ITC</span>
            </div>
          </div>

          {/* ONE-BY-ONE REPORTS DIRECT CARDS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                <span>One-by-One Reports Catalog (Click to open full audit)</span>
              </h3>
              <span className="text-xs text-slate-500">Every report is standalone with instant PDF / Excel / Print exports</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Sales Report */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
                      <Receipt className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                      {filteredTransactions.length} bills
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Sales & POS Report</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Daily retail and OTC transactions, cash vs UPI splits, discounts given, and invoice reprinting.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('sales')}
                  className="mt-4 w-full py-2 bg-slate-900 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Sales Report</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 2: Purchase Report */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-100">
                      <FileSpreadsheet className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md">
                      Inward Bills
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Purchase Report</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Wholesale distributor invoices, supplier GSTINs, inward tax breakdown, and ITC reconciliation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('purchases')}
                  className="mt-4 w-full py-2 bg-slate-900 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Purchase Report</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 3: Stock Report */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
                      <Boxes className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                      22 Forms
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Current Stock Report</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Tablets, capsules, syrups, injections, and ointments categorized with unit-level inventory counts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('stock-report')}
                  className="mt-4 w-full py-2 bg-slate-900 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Stock Report</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 3B: Schedule Drug Register */}
              <div className="bg-white p-4 rounded-2xl border border-rose-200 hover:border-rose-400 transition-all shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-200">
                      <AlertOctagon className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      Drugs Rules 1945
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Schedule Drug Register</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Statutory register for Schedule H1, H, X, G & Narcotics with doctor, patient, batch, daily/monthly breakdown and PDF/XLS exports.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('schedule-drugs')}
                  className="mt-4 w-full py-2 bg-rose-900 hover:bg-rose-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Open Schedule Drug Report</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 4: Profit & Loss Statement */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-100">
                      <TrendingUp className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                      {netMarginPercent}% Net
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Profit & Loss (P&L)</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Operational income, wholesale COGS, staff and shop overhead deductions, and final net margins.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('pnl')}
                  className="mt-4 w-full py-2 bg-slate-900 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open P&L Statement</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 4B: Medicine Profitability & Net Margins */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 hover:border-emerald-400 transition-all shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Percent className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Cost vs. Sell Margin
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Medicine Profitability</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Itemized net margin per medicine by comparing batch wholesale cost price against average selling price across recent transactions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('profitability')}
                  className="mt-4 w-full py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Open Profitability Report</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 5: Inventory Valuation */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-100">
                      <Boxes className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md">
                      ₹ Asset
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Inventory Valuation</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    FIFO/FEFO batch valuation comparing acquisition cost vs potential retail MRP revenue.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('valuation')}
                  className="mt-4 w-full py-2 bg-slate-900 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Valuation Report</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 6: GST Compliance */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                      GSTR-1 & 3B
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">GST Compliance</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Tamil Nadu commercial tax return registers, CGST/SGST 50-50 splits, and Net tax payable.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('gst')}
                  className="mt-4 w-full py-2 bg-slate-900 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open GST Report</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 7: Expiry Risk */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-100">
                      <AlertTriangle className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md">
                      FEFO Risk
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Expiry & Batch Risk</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Medicines nearing expiration within 30-90 days, capital preservation, and supplier returns.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('expiry')}
                  className="mt-4 w-full py-2 bg-slate-900 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Expiry Risk Report</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 8: Operating Expenses */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-sky-50 text-sky-800 border border-sky-100">
                      <DollarSign className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md">
                      {filteredExpenses.length} Vouchers
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Operating Expenses</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Pharmacy shop rent, staff wages, electricity bills, chiller maintenance, and office supplies.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('expenses')}
                  className="mt-4 w-full py-2 bg-slate-900 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Expenses Ledger</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 9: Doctor Commissions (POS Rx) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
                      <Stethoscope className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                      POS Prescriptions
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Doctor Commissions</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Calculates total referral commissions for doctors based on prescriptions sold via POS, filterable by date range.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('doctor-commissions')}
                  className="mt-4 w-full py-2 bg-slate-900 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Doctor Commissions</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Recent Sales vs Recent Purchases Audit Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sales Register Preview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-teal-600" />
                  <span>Recent Sales Invoices (Audit Trail)</span>
                </h4>
                <button
                  onClick={() => setActiveSubTab('sales')}
                  className="text-xs font-bold text-teal-700 hover:underline"
                >
                  View All ({filteredTransactions.length}) →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5 font-bold">Invoice #</th>
                      <th className="py-2 px-2.5 font-bold">Customer</th>
                      <th className="py-2 px-2.5 font-bold">Pay Mode</th>
                      <th className="py-2 px-2.5 font-bold text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.slice(0, 5).map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50/60">
                        <td className="py-2 px-2.5 font-mono font-bold text-slate-900">{tx.id}</td>
                        <td className="py-2 px-2.5 text-slate-700">{tx.patientName || 'Walk-in'}</td>
                        <td className="py-2 px-2.5">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 font-mono font-bold text-right text-teal-800">
                          ₹{(tx.grandTotal ?? 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Operating Expenses Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-sky-600" />
                  <span>Recent Operating Expenses</span>
                </h4>
                <button
                  onClick={() => setActiveSubTab('expenses')}
                  className="text-xs font-bold text-teal-700 hover:underline"
                >
                  View All ({filteredExpenses.length}) →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5 font-bold">Date</th>
                      <th className="py-2 px-2.5 font-bold">Category</th>
                      <th className="py-2 px-2.5 font-bold">Description</th>
                      <th className="py-2 px-2.5 font-bold text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.slice(0, 5).map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50/60">
                        <td className="py-2 px-2.5 font-mono text-slate-600">{exp.date}</td>
                        <td className="py-2 px-2.5 font-bold text-slate-800">{exp.category}</td>
                        <td className="py-2 px-2.5 text-slate-600 truncate max-w-[140px]">{exp.description}</td>
                        <td className="py-2 px-2.5 font-mono font-bold text-right text-rose-700">
                          ₹{Number(exp.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 0: CURRENT STOCK REPORT & 22 PRODUCT FORMS VIEW                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'stock-report' && (
        <StockReportView medicines={medicines} />
      )}

      {/* ========================================================================= */}
      {/* TAB 0-PROF: MEDICINE PROFITABILITY & NET MARGIN PER MEDICINE              */}
      {/* ========================================================================= */}
      {activeSubTab === 'profitability' && (
        <ProfitabilityReportView
          transactions={transactions}
          medicines={medicines}
          purchaseInvoices={purchaseInvoices}
          dateRange={dateRange}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 0-DOC-COMM: DOCTOR COMMISSIONS FROM POS PRESCRIPTIONS                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'doctor-commissions' && (
        <DoctorCommissionsReportView
          transactions={transactions}
          dateRange={dateRange}
          startDate={startDate}
          endDate={endDate}
          onViewInvoice={tx => setViewingInvoice(tx)}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 0-WS: WHOLESALE B2B SALES REPORT                                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'wholesale-sales' && (
        <WholesaleHubView initialTab="sales-report" onRefreshData={onRefreshData} />
      )}

      {/* ========================================================================= */}
      {/* TAB 0-WP: WHOLESALE PAYMENT PENDING & ACCOUNTS RECEIVABLE                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'wholesale-pending' && (
        <WholesaleHubView initialTab="payment-pending" onRefreshData={onRefreshData} />
      )}

      {/* ========================================================================= */}
      {/* TAB 0-WR: WHOLESALE SALES RETURN & B2B CREDIT NOTES                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'wholesale-returns' && (
        <WholesaleHubView initialTab="sales-return" onRefreshData={onRefreshData} />
      )}

      {/* ========================================================================= */}
      {/* TAB 0-WPR: WHOLESALE PURCHASE RETURN & SUPPLIER DEBIT NOTES               */}
      {/* ========================================================================= */}
      {activeSubTab === 'wholesale-purchase-returns' && (
        <WholesaleHubView initialTab="purchase-return" onRefreshData={onRefreshData} />
      )}

      {/* ========================================================================= */}
      {/* TAB 0-WPO: WHOLESALE PURCHASE REPORT FROM PHARMACEUTICALS                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'wholesale-purchases' && (
        <WholesaleHubView initialTab="purchase-report" onRefreshData={onRefreshData} />
      )}

      {/* ========================================================================= */}
      {/* TAB 0B: PURCHASE REPORT & INWARD BILL REGISTER                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'purchases' && (
        <PurchaseReportView onRefreshData={onRefreshData} />
      )}

      {/* ========================================================================= */}
      {/* TAB 0B-PENDING: RETAIL PAYMENT PENDING (AGING & SETTLEMENT)               */}
      {/* ========================================================================= */}
      {activeSubTab === 'retail-pending' && (
        <RetailPurchaseHubView initialTab="payment-pending" onRefreshData={onRefreshData} />
      )}

      {/* ========================================================================= */}
      {/* TAB 0B-PAYMENTS: RETAIL PURCHASE PAYMENT SETTLEMENT REPORT                */}
      {/* ========================================================================= */}
      {activeSubTab === 'retail-payments' && (
        <RetailPurchaseHubView initialTab="payment-report" onRefreshData={onRefreshData} />
      )}

      {/* ========================================================================= */}
      {/* TAB 0B-SUPPLIERS: RETAIL PHARMA SUPPLIERS DIRECTORY & DUES                */}
      {/* ========================================================================= */}
      {activeSubTab === 'retail-suppliers' && (
        <RetailPurchaseHubView initialTab="supplier-list" onRefreshData={onRefreshData} />
      )}

      {/* ========================================================================= */}
      {/* TAB 0C: STATUTORY SCHEDULE DRUG REPORT (H1, H, X, G, NARCOTIC)           */}
      {/* ========================================================================= */}
      {activeSubTab === 'schedule-drugs' && (
        <ScheduleDrugReportView onRefreshData={onRefreshData} />
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DAILY SALES & TRANSACTION AUDIT REGISTER                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'sales' && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Gross Sales Volume</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">₹{totalSalesGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              <span className="text-[11px] text-teal-700 font-semibold">{filteredTransactions.length} Invoices dispensed</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Cost of Goods Sold (COGS)</span>
              <p className="text-2xl font-extrabold text-slate-800 mt-1">₹{totalCOGS.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              <span className="text-[11px] text-slate-500">Wholesale cost of medicines</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Discounts Conceded</span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">₹{totalDiscountGiven.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              <span className="text-[11px] text-slate-500">Customer savings on MRP</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Output GST Collected</span>
              <p className="text-2xl font-extrabold text-teal-600 mt-1">₹{gstMetrics.outputTaxCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              <span className="text-[11px] text-emerald-700 font-semibold">Ready for GST return filing</span>
            </div>
          </div>

          {/* Daily Revenue Trends Bar Chart (Current Week & Peak Performance) */}
          <DailyRevenueTrendsChart
            transactions={transactions}
            onSelectDate={(selectedDate) => {
              setDateRange('custom');
              setStartDate(selectedDate);
              setEndDate(selectedDate);
            }}
          />

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Sales & Counter Dispensing Audit Register</h3>
                <p className="text-xs text-slate-500">Itemized transactions with customer details, doctor referral, tax breakdown, and print invoice access</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintSales}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Print Sales Report"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-600" />
                  <span>Print</span>
                </button>
                <button
                  onClick={handlePDFSales}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Download Sales Report as PDF"
                >
                  <Download className="w-3.5 h-3.5 text-rose-600" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={handleExcelSales}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Download Sales Report as Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Invoice #</th>
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Prescribing Doctor</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3 text-center">Items</th>
                    <th className="py-3 px-3 text-right">Subtotal</th>
                    <th className="py-3 px-3 text-right">Discount</th>
                    <th className="py-3 px-3 text-right">GST</th>
                    <th className="py-3 px-3 text-right font-bold">Net Total</th>
                    <th className="py-3 px-3 text-center">Print / Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        No transactions recorded for the selected filter ({dateRange}).
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{tx.id}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{tx.patientName || 'Walk-in Customer'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{tx.doctorName || 'Self / OTC Recommendation'}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            tx.paymentMethod === 'Cash' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            tx.paymentMethod === 'UPI' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                            tx.paymentMethod === 'Card' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                            'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">{(tx.items || []).length}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">₹{(tx.subtotal ?? 0).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-600">
                          {tx.totalDiscount > 0 ? `-₹${tx.totalDiscount.toFixed(2)}` : '₹0.00'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">₹{(tx.totalTax ?? 0).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900">
                          ₹{(tx.grandTotal ?? 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setViewingInvoice(tx)}
                              className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors inline-flex items-center gap-1 font-bold cursor-pointer"
                              title="Open Printer-Friendly Tax Bill & Thermal Receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Bill</span>
                            </button>
                            <button
                              onClick={() => {
                                exportThermalReceiptToPDF(tx, undefined, '80mm');
                              }}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1 font-bold cursor-pointer"
                              title="Download continuous 3-inch (80mm) Thermal Receipt PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="text-[10px]">3" PDF</span>
                            </button>
                          </div>
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
      {/* TAB 2: PROFIT & LOSS STATEMENT                                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'pnl' && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Gross Sales Revenue</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">₹{netSalesRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              <span className="text-[11px] text-emerald-700 font-semibold">{filteredTransactions.length} Invoices processed</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Cost of Goods Sold (COGS)</span>
              <p className="text-2xl font-extrabold text-slate-800 mt-1">₹{totalCOGS.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              <span className="text-[11px] text-slate-500">Wholesale cost of medicines sold</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Gross Profit (Margin: {grossMarginPercent}%)</span>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">₹{grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              <span className="text-[11px] text-emerald-700 font-semibold">Revenue minus wholesale purchase costs</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Net Operating Profit</span>
              <p className={`text-2xl font-extrabold mt-1 ${netOperatingProfit >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                ₹{netOperatingProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-500">After all rent, salaries & utility bills</span>
            </div>
          </div>

          {/* Statement Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Comprehensive Income Statement (P&L)</h3>
                <p className="text-xs text-slate-500">City Medical • Melur Taluk, Madurai District, Tamil Nadu</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPnL}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Print P&L Statement"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-600" />
                  <span>Print</span>
                </button>
                <button
                  onClick={handlePDFPnL}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Download P&L as PDF"
                >
                  <Download className="w-3.5 h-3.5 text-rose-600" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={handleExcelPnL}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Download P&L as Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 text-sm">
              {/* Revenue */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">1. Operating Revenue</h4>
                <div className="space-y-1.5 pl-3 border-l-2 border-slate-200">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-700">Retail Medicine Sales (POS)</span>
                    <span className="font-mono font-semibold text-slate-900">₹{(totalSalesGross ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-rose-600">
                    <span>Less: Customer Sales Returns & Refunds</span>
                    <span className="font-mono font-semibold">- ₹{(totalSalesRefunds ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-slate-900 border-t border-slate-100">
                    <span>Net Operating Revenue</span>
                    <span className="font-mono">₹{(netSalesRevenue ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* COGS */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">2. Cost of Sales</h4>
                <div className="space-y-1.5 pl-3 border-l-2 border-slate-200">
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>Cost of Goods Sold (Wholesale Purchase Cost)</span>
                    <span className="font-mono font-semibold text-slate-900">₹{(totalCOGS ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-emerald-800 bg-emerald-50 px-2 rounded-lg border border-emerald-100">
                    <span>Gross Profit (Margin: {grossMarginPercent}%)</span>
                    <span className="font-mono">₹{(grossProfit ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Operating Expenses */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">3. Operating Expenses (OPEX)</h4>
                <div className="space-y-1.5 pl-3 border-l-2 border-slate-200">
                  {filteredExpenses.map(exp => (
                    <div key={exp.id} className="flex justify-between py-1 text-xs">
                      <span className="text-slate-600">{exp.category} ({exp.description})</span>
                      <span className="font-mono text-slate-800">₹{(exp.amount ?? 0).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1.5 font-bold text-slate-800 border-t border-slate-100">
                    <span>Total Operating Expenses</span>
                    <span className="font-mono text-rose-700">- ₹{(totalOperatingExpenses ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Line */}
              <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Net Bottom-Line Profit</span>
                  <p className="text-xs text-slate-300 mt-0.5">Net Margin: {netMarginPercent}%</p>
                </div>
                <span className="text-2xl font-mono font-black text-emerald-400">
                  ₹{(netOperatingProfit ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INVENTORY VALUATION METRICS                                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'valuation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Total Stock On-Hand</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{inventoryMetrics.totalUnits} Units</p>
              <span className="text-[11px] text-slate-500">{medicines.length} Distinct Drug Molecules</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs">
              <span className="text-xs font-semibold text-rose-700">Zero Stock Total</span>
              <p className="text-2xl font-extrabold text-rose-800 mt-1">{inventoryMetrics.zeroStockCount} SKUs</p>
              <span className="text-[11px] text-rose-600 font-semibold">Formulations with 0 units on hand</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Valuation at Cost (FIFO)</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                ₹{inventoryMetrics.totalCostValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-500">Capital invested in inventory</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Valuation at Retail MRP</span>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                ₹{inventoryMetrics.totalRetailValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-emerald-700 font-semibold">
                Potential Gross Margin: {inventoryMetrics.potentialMarginPercent}%
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Stock Near Expiry (60D)</span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">{inventoryMetrics.expiringUnits} Units</p>
              <span className="text-[11px] text-amber-700 font-semibold">
                Valued at ₹{inventoryMetrics.expiringValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Category-Wise Inventory Asset Breakdown</h3>
                <p className="text-xs text-slate-500">Wholesale cost valuation vs retail realizable MRP</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintValuation}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Print Inventory Valuation Report"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-600" />
                  <span>Print</span>
                </button>
                <button
                  onClick={handlePDFValuation}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Download Valuation Report as PDF"
                >
                  <Download className="w-3.5 h-3.5 text-rose-600" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={handleExcelValuation}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Download Valuation Report as Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {medicines.map(m => {
                const totalStock = m.batches.reduce((s, b) => s + b.stock, 0);
                const costVal = m.batches.reduce((s, b) => s + b.stock * b.costPrice, 0);
                const retailVal = m.batches.reduce((s, b) => s + b.stock * b.sellingPrice, 0);
                return (
                  <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 transition-colors">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{m.name}</h4>
                      <p className="text-slate-500">{m.genericName} • {m.category} • Rack: {m.rackLocation || 'A-1'}</p>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <span className="text-slate-400 block">Current Stock</span>
                        <span className="font-mono font-bold text-slate-800">{totalStock} units</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Cost Valuation</span>
                        <span className="font-mono font-bold text-slate-800">₹{(costVal ?? 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Retail Value</span>
                        <span className="font-mono font-bold text-emerald-700">₹{(retailVal ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GST & TAX COMPLIANCE                                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'gst' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Output GST Collected (Sales)</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">₹{(gstMetrics.outputTaxCollected ?? 0).toFixed(2)}</p>
              <span className="text-[11px] text-slate-500">Tax liability from POS invoices</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Input Tax Credit (ITC - Purchases)</span>
              <p className="text-2xl font-extrabold text-teal-700 mt-1">₹{(gstMetrics.inputTaxCredit ?? 0).toFixed(2)}</p>
              <span className="text-[11px] text-teal-700 font-semibold">Eligible credit on supplier POs</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Net GST Payable (Cash Ledger)</span>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">₹{(gstMetrics.netTaxPayable ?? 0).toFixed(2)}</p>
              <span className="text-[11px] text-emerald-700 font-semibold">Output minus Input Credit</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">GST Compliance & Government Filing Breakdown</h3>
                <p className="text-xs text-slate-500">GSTR-1 & GSTR-3B monthly statutory compliance register</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintGST}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Print GST Compliance Report"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-600" />
                  <span>Print</span>
                </button>
                <button
                  onClick={handlePDFGST}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Download GST Report as PDF"
                >
                  <Download className="w-3.5 h-3.5 text-rose-600" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={handleExcelGST}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Download GST Report as Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">CGST (Central GST - 50%)</h4>
                <p className="text-slate-500">Central Government share of collected GST</p>
                <div className="flex justify-between font-mono font-bold text-base text-slate-900 pt-2 border-t border-slate-200">
                  <span>CGST Total:</span>
                  <span>₹{(gstMetrics.cgstSplit ?? 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">SGST (Tamil Nadu State GST - 50%)</h4>
                <p className="text-slate-500">Tamil Nadu Commercial Taxes Department share</p>
                <div className="flex justify-between font-mono font-bold text-base text-slate-900 pt-2 border-t border-slate-200">
                  <span>SGST Total:</span>
                  <span>₹{(gstMetrics.sgstSplit ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>GSTIN: 33AABCC5541Q1Z8 (Tamil Nadu) - GSTR-1 & GSTR-3B Format Verified</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                All medicine sales include mandatory HSN codes (300410, 300490) and batch traceability in compliance with the Drugs & Cosmetics Act and GST rules.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DRUG EXPIRY & BATCH RISK REGISTER                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'expiry' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Drug Expiry & Batch Risk Register (FEFO)</h3>
                <p className="text-xs text-slate-500">Track expiring stock, prioritize rotation, and initiate supplier returns</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintExpiry}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Print Expiry Register"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-600" />
                  <span>Print</span>
                </button>
                <button
                  onClick={handlePDFExpiry}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Download Expiry Register as PDF"
                >
                  <Download className="w-3.5 h-3.5 text-rose-600" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={handleExcelExpiry}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Download Expiry Register as Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Medicine & Generic</th>
                    <th className="py-3 px-3">Batch Number</th>
                    <th className="py-3 px-3">Expiry Date</th>
                    <th className="py-3 px-3 text-center">Days Remaining</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Stock</th>
                    <th className="py-3 px-3 text-right">Cost (₹)</th>
                    <th className="py-3 px-3 text-right font-bold">Value at Risk (₹)</th>
                    <th className="py-3 px-3">Rack Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expiryBatches.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{b.medicineName}</span>
                        <span className="text-slate-400 text-[10px]">{b.genericName}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{b.batchNumber}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{b.expiryDate}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        <span className={b.daysRemaining <= 30 ? 'text-rose-600' : b.daysRemaining <= 60 ? 'text-amber-600' : 'text-slate-600'}>
                          {b.daysRemaining < 0 ? `${Math.abs(b.daysRemaining)}d ago` : `${b.daysRemaining} days`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          b.status === 'Expired' ? 'bg-rose-100 text-rose-800' :
                          b.status === 'Critical' ? 'bg-orange-100 text-orange-800' :
                          b.status === 'Warning' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">{b.stock}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">₹{b.costPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">₹{b.totalCostValue.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{b.rackLocation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: OPERATING EXPENSES                                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Operating Expenses Ledger</h3>
              <p className="text-xs text-slate-500">Rent, staff salaries, chiller maintenance, and utilities</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintExpenses}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Print Operating Expenses"
              >
                <Printer className="w-3.5 h-3.5 text-teal-600" />
                <span>Print</span>
              </button>
              <button
                onClick={handlePDFExpenses}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Download Expenses as PDF"
              >
                <Download className="w-3.5 h-3.5 text-rose-600" />
                <span>PDF</span>
              </button>
              <button
                onClick={handleExcelExpenses}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Download Expenses as Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Expense
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-xs font-mono text-slate-600">{exp.date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">{exp.description}</td>
                    <td className="py-3 px-4 text-xs font-mono font-bold text-right text-slate-900">
                      ₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODALS: ADD EXPENSE & VIEW/PRINT INVOICE                               */}
      {/* ========================================================================= */}

      {/* Modal: Add Expense */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Record Operating Expense</h3>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expense Category *</label>
                <select
                  value={expCategory}
                  onChange={e => setExpCategory(e.target.value as OperatingExpense['category'])}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Rent">Rent</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Utilities & Electricity">Utilities & Electricity</option>
                  <option value="Cold Storage Maintenance">Cold Storage Maintenance</option>
                  <option value="Packaging & Consumables">Packaging & Consumables</option>
                  <option value="Software & Compliance">Software & Compliance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={expAmount}
                    onChange={e => setExpAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={e => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Commercial electricity billing - September"
                  value={expDesc}
                  onChange={e => setExpDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-3 py-2 text-xs text-slate-600 rounded-xl hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Printer-Friendly Invoice Modal */}
      {viewingInvoice && (
        <PrintInvoiceModal
          isOpen={Boolean(viewingInvoice)}
          onClose={() => setViewingInvoice(null)}
          transaction={viewingInvoice}
          invoiceId={viewingInvoice.id}
          paymentMethod={viewingInvoice.paymentMethod}
        />
      )}
    </div>
  );
};
