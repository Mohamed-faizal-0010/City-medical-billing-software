import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Printer,
  Receipt,
  FileText,
  Save,
  Boxes,
  Banknote,
  QrCode,
  CreditCard,
  Split,
  User,
  Phone,
  Stethoscope,
  Download,
  FileSpreadsheet,
  MessageCircle,
  Send,
  Zap,
  RotateCcw,
  FileCheck,
  Copy
} from 'lucide-react';
import {
  CartItem,
  Patient,
  Doctor,
  SaleTransaction,
  PrinterSettings,
  PharmacyProfile
} from '../types';
import { StorageService } from '../services/storage';
import { printDirectBill } from '../utils/printDirectUtils';
import {
  exportThermalReceiptToPDF,
  exportInvoiceToPDF,
  exportInvoiceToExcel
} from '../utils/exportUtils';
import { getPackDetails, calculateLinePricing, formatQuantityWithUnit } from '../utils/packUtils';
import { formatDateDMY, formatExpiryDMY } from '../utils/dateUtils';
import { getMedicineScheduleInfo } from '../utils/scheduleDrugUtils';
import { PrintInvoiceModal } from './PrintInvoiceModal';
import { QRCode } from './QRCode';
import {
  shareBillViaWhatsApp,
  shareBillViaSms,
  isValidPhoneNumber
} from '../utils/billShareUtils';

export interface ConfirmRetailSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  selectedPatient: Patient | null;
  selectedDoctor: Doctor | null;
  walkInCustomer: {
    name: string;
    phone: string;
    age: string;
    location: string;
  };
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  cashierName: string;
  invoiceDate?: string;
  consultationId?: string;
  initialPaymentMethod?: 'Cash' | 'UPI' | 'Card' | 'Split' | 'Credit';
  onSaveAsDraft?: () => void;
  onSaleConfirmedAndSaved: (tx: SaleTransaction, printedInstantly: boolean) => void;
}

export const ConfirmRetailSaleModal: React.FC<ConfirmRetailSaleModalProps> = ({
  isOpen,
  onClose,
  cart,
  selectedPatient,
  selectedDoctor,
  walkInCustomer,
  subtotal,
  totalTax,
  totalDiscount,
  grandTotal,
  cashierName,
  invoiceDate,
  consultationId,
  initialPaymentMethod = 'Cash',
  onSaveAsDraft,
  onSaleConfirmedAndSaved
}) => {
  const pharmacyProfile: PharmacyProfile = useMemo(() => StorageService.getPharmacyProfile(), []);
  const printerSettings: PrinterSettings = useMemo(() => StorageService.getPrinterSettings(), []);
  const invoiceId = useMemo(() => StorageService.getNextInvoiceNumber(), [isOpen]);

  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Split' | 'Credit'>(initialPaymentMethod);
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4' | 'a5' | 'thermal58'>('thermal');
  const [printDualCopy, setPrintDualCopy] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cityrx_print_dual_copy');
      if (saved !== null) return saved === 'true';
    } catch {}
    return Boolean(StorageService.getPrinterSettings()?.printDualCopy);
  });
  const [cashTendered, setCashTendered] = useState<string>((grandTotal ?? 0).toFixed(2));
  const [splitCashAmount, setSplitCashAmount] = useState<number>(Math.floor((grandTotal ?? 0) / 2));
  const [hasVerifiedSale, setHasVerifiedSale] = useState<boolean>(true);

  const [customerName, setCustomerName] = useState<string>(
    walkInCustomer.name.trim() || selectedPatient?.name || 'Walk-in Customer'
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    walkInCustomer.phone.trim() || selectedPatient?.phone || ''
  );
  const [doctorName, setDoctorName] = useState<string>(
    selectedDoctor?.name || 'Self / OTC Recommendation'
  );

  // Saved transaction state (Stage 2: Confirmed & Saved)
  const [savedTransaction, setSavedTransaction] = useState<SaleTransaction | null>(null);
  const [instantPrintStatus, setInstantPrintStatus] = useState<string | null>(null);
  const [showFullPrintPreview, setShowFullPrintPreview] = useState<boolean>(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod(initialPaymentMethod);
      setCashTendered((grandTotal ?? 0).toFixed(2));
      setSplitCashAmount(Math.floor((grandTotal ?? 0) / 2));
      setCustomerName(walkInCustomer.name.trim() || selectedPatient?.name || 'Walk-in Customer');
      setCustomerPhone(walkInCustomer.phone.trim() || selectedPatient?.phone || '');
      setDoctorName(selectedDoctor?.name || 'Self / OTC Recommendation');
      setSavedTransaction(null);
      setInstantPrintStatus(null);
    }
  }, [isOpen, initialPaymentMethod, grandTotal, walkInCustomer, selectedPatient, selectedDoctor]);

  if (!isOpen) return null;

  const cashAmount = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, cashAmount - grandTotal);
  const validSplitCash = Math.min(Math.max(0, splitCashAmount || 0), grandTotal);
  const splitUpiAmount = Number((grandTotal - validSplitCash).toFixed(2));

  const buildTransactionObject = (): SaleTransaction => {
    const costOfGoodsSold = cart.reduce((sum, item) => {
      const packInfo = getPackDetails(item.medicine);
      const pricing = calculateLinePricing({
        unitType: item.unitType,
        quantity: item.quantity,
        boxQuantity: item.boxQuantity,
        stripQuantity: item.stripQuantity,
        looseQuantity: item.looseQuantity,
        packSize: item.packSize || packInfo.packSize,
        boxSize: item.boxSize,
        customMrp: item.customMrp,
        sellingPrice: item.selectedBatch.sellingPrice,
        discountPercent: item.discountPercent
      });
      return sum + item.selectedBatch.costPrice * pricing.stockDeduction;
    }, 0);

    return {
      id: invoiceId,
      date: invoiceDate ? new Date(invoiceDate).toISOString() : new Date().toISOString(),
      saleType: 'retail',
      patientId: selectedPatient?.id,
      patientName: customerName.trim() || 'Walk-in Customer',
      patientPhone: customerPhone.trim() || undefined,
      patientAge: walkInCustomer.age ? parseInt(walkInCustomer.age, 10) : selectedPatient?.age,
      patientAddress: walkInCustomer.location.trim() || selectedPatient?.address,
      doctorId: selectedDoctor?.id,
      doctorName: doctorName.trim() || 'Self / OTC Recommendation',
      doctorRegNo: selectedDoctor?.registrationNumber,
      items: cart.map(item => {
        const packInfo = getPackDetails(item.medicine);
        const sched = getMedicineScheduleInfo(item.medicine);
        const pricing = calculateLinePricing({
          unitType: item.unitType,
          quantity: item.quantity,
          boxQuantity: item.boxQuantity,
          stripQuantity: item.stripQuantity,
          looseQuantity: item.looseQuantity,
          packSize: item.packSize || packInfo.packSize,
          boxSize: item.boxSize,
          customMrp: item.customMrp,
          sellingPrice: item.selectedBatch.sellingPrice,
          discountPercent: item.discountPercent
        });
        return {
          medicineId: item.medicine.id,
          medicineName: item.medicine.name,
          genericName: item.medicine.genericName,
          scheduleType: sched.scheduleType,
          batchNumber: item.selectedBatch.batchNumber,
          expiryDate: item.selectedBatch.expiryDate,
          quantity: pricing.isLoose
            ? pricing.looseCount
            : pricing.boxCount > 0
            ? pricing.stockDeduction
            : pricing.stripCount || 1,
          stockDeduction: pricing.stockDeduction,
          unitPrice: pricing.unitPrice,
          discountPercent: item.discountPercent,
          taxRate: item.medicine.taxRate,
          total: pricing.netAmount,
          unitType: pricing.isLoose ? 'loose' : item.unitType || 'pack',
          boxQuantity: pricing.boxCount,
          stripQuantity: pricing.stripCount,
          looseQuantity: pricing.looseCount,
          packSize: packInfo.packSize,
          boxSize: item.boxSize || 10,
          unitName: packInfo.unitName,
          packName: packInfo.packName,
          pack: item.medicine.pack || packInfo.packDisplay,
          location: item.medicine.rackLocation || item.selectedBatch.location || 'Rack A-01'
        };
      }),
      subtotal,
      totalTax,
      totalDiscount,
      grandTotal,
      costOfGoodsSold,
      paymentMethod,
      splitPayment:
        paymentMethod === 'Split'
          ? {
              cashAmount: validSplitCash,
              upiAmount: splitUpiAmount
            }
          : undefined,
      paymentStatus: paymentMethod === 'Credit' ? 'Pending' : 'Paid',
      creditBalanceAmount: paymentMethod === 'Credit' ? grandTotal : undefined,
      upiReferenceId:
        paymentMethod === 'UPI' || paymentMethod === 'Split'
          ? `UPI-${Math.floor(100000000 + Math.random() * 900000000)}`
          : undefined,
      cashierName
    };
  };

  const handleToggleDualCopy = (nextValue?: boolean) => {
    const updatedVal = nextValue !== undefined ? nextValue : !printDualCopy;
    setPrintDualCopy(updatedVal);
    try {
      localStorage.setItem('cityrx_print_dual_copy', String(updatedVal));
    } catch {}
    const currentSettings = StorageService.getPrinterSettings();
    StorageService.savePrinterSettings({
      ...currentSettings,
      printDualCopy: updatedVal,
      printCopies: updatedVal ? 2 : 1
    });
    setInstantPrintStatus(
      updatedVal
        ? 'Print Dual Copy ON: Automatically triggers 2 distinct print commands (1. Customer Copy + 2. Pharmacy Copy).'
        : 'Print Dual Copy OFF: Single copy printing active.'
    );
  };

  // Handler: Confirm the Save (with optional Instant Bill Print)
  const handleConfirmSaveSale = (triggerInstantPrint: boolean) => {
    const newTx = buildTransactionObject();

    // 1. Deduct stock & persist transaction
    StorageService.deductStockForSale(newTx.items);
    StorageService.addTransaction(newTx);
    if (consultationId) {
      StorageService.markConsultationDispensed(consultationId, newTx.id);
    }

    // 2. If Instant Print requested, trigger printDirectBill immediately within user gesture
    if (triggerInstantPrint) {
      printDirectBill(newTx, pharmacyProfile, printFormat, printerSettings, {
        dualCopy: printDualCopy
      });
      const formatLabel =
        printFormat === 'thermal'
          ? '3" (80mm) Thermal Printer'
          : printFormat === 'thermal58'
          ? '2" (58mm) Thermal Printer'
          : printFormat === 'a4'
          ? 'A4 Full Tax Invoice'
          : 'A5 Clinic Bill';
      setInstantPrintStatus(
        printDualCopy
          ? `⚡ Dual Copy Print dispatched (Customer Copy + Pharmacy Copy) to ${formatLabel} for Invoice #${newTx.id}!`
          : `⚡ Instant Bill Print dispatched to ${formatLabel} for Invoice #${newTx.id}!`
      );
    } else {
      setInstantPrintStatus(`✓ Retail Sale #${newTx.id} Confirmed & Saved! Click any button below for Instant Bill Print.`);
    }

    setSavedTransaction(newTx);
    onSaleConfirmedAndSaved(newTx, triggerInstantPrint);
  };

  // Instant Print trigger on Stage 2
  const handleInstantPrintFormat = (fmt: 'thermal' | 'a4' | 'a5' | 'thermal58') => {
    if (!savedTransaction) return;
    setPrintFormat(fmt);
    printDirectBill(savedTransaction, pharmacyProfile, fmt, printerSettings, {
      dualCopy: printDualCopy
    });
    const label =
      fmt === 'thermal'
        ? '3" (80mm) Thermal Receipt'
        : fmt === 'thermal58'
        ? '2" (58mm) Thermal Receipt'
        : fmt === 'a4'
        ? 'A4 Tax Invoice'
        : 'A5 Clinic Bill';
    setInstantPrintStatus(
      printDualCopy
        ? `⚡ Dual Copy Print sent (Customer Copy + Pharmacy Copy) via ${label} for Invoice #${savedTransaction.id}!`
        : `⚡ Instant Bill Print sent (${label}) for Invoice #${savedTransaction.id}!`
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-2">
              <FileCheck className="w-3.5 h-3.5" />
              <span>
                {savedTransaction
                  ? 'Retail Sale Saved & Confirmed • Instant Bill Print Ready'
                  : 'Step 1 of 2: Confirm Retail Sale Save & Instant Bill Print'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>
                {savedTransaction
                  ? `✓ Retail Sale Confirmed & Saved (#${savedTransaction.id})`
                  : `Confirm Save & Print Retail Bill (#${invoiceId})`}
              </span>
            </h2>
            <p className="text-xs text-teal-100/85 mt-1 max-w-2xl">
              {savedTransaction
                ? 'This retail sale has been committed to the sales ledger and inventory stock has been updated. Use Instant Bill Print below to print or reprint the receipt.'
                : 'Verify medicine batches, customer details, and payment mode. Click "Confirm Save & Instant Bill Print" to save and print the bill immediately.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-teal-200 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer relative z-10"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedTransaction ? (
          /* ========================================================================= */
          /* STAGE 2: CONFIRMED & SAVED — INSTANT BILL PRINT SCREEN                    */
          /* ========================================================================= */
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800 text-xs">
            {/* Save Confirmed Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-emerald-950">
                      Retail Sale Saved & Confirmed!
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-200 text-emerald-900">
                      #{savedTransaction.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900">
                      Paid via {savedTransaction.paymentMethod}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                    {instantPrintStatus || 'Stock deducted in real-time and sales register updated.'}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Net Bill Total
                </span>
                <span className="text-2xl font-black font-mono text-emerald-900">
                  ₹{savedTransaction.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* INSTANT BILL PRINT ACTION HUB */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Zap className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <span>Instant Bill Print (1-Click Direct Spooler)</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500 text-slate-950">
                        READY
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Prints directly to your connected printer without downloading a PDF first
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleToggleDualCopy()}
                    role="switch"
                    aria-checked={printDualCopy}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                      printDualCopy
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Automatically triggers two distinct print commands: 1 for Customer Copy, 1 for Pharmacy Copy"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Print Dual Copy</span>
                    <span
                      className={`w-7 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                        printDualCopy ? 'bg-emerald-500 justify-end' : 'bg-slate-600 justify-start'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-white block" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFullPrintPreview(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Full Print Preview & Settings</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleInstantPrintFormat('thermal')}
                  className="py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer transition-all active:scale-98"
                  id="confirm-modal-instant-print-thermal-btn"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Instant Print 3" Thermal</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInstantPrintFormat('a4')}
                  className="py-3.5 px-4 bg-teal-700 hover:bg-teal-600 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer transition-all active:scale-98 border border-teal-500/40"
                  id="confirm-modal-instant-print-a4-btn"
                >
                  <Printer className="w-4 h-4" />
                  <span>Instant Print A4 Bill</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInstantPrintFormat('a5')}
                  className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer transition-all active:scale-98 border border-slate-700"
                  id="confirm-modal-instant-print-a5-btn"
                >
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>Instant Print A5 Bill</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    exportThermalReceiptToPDF(savedTransaction, pharmacyProfile, '80mm');
                    setInstantPrintStatus('Downloaded 3" Thermal PDF!');
                  }}
                  className="py-2 px-3 bg-rose-600/90 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>3" Thermal PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exportInvoiceToPDF(savedTransaction, pharmacyProfile, 'a4');
                    setInstantPrintStatus('Downloaded A4 Tax Invoice PDF!');
                  }}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-rose-400" />
                  <span>A4 PDF Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exportInvoiceToExcel(savedTransaction, pharmacyProfile);
                    setInstantPrintStatus('Downloaded Excel Bill!');
                  }}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!isValidPhoneNumber(customerPhone)) {
                      setShareFeedback('Enter a valid 10-digit mobile number below to send via WhatsApp.');
                      return;
                    }
                    const res = await shareBillViaWhatsApp(customerPhone, savedTransaction, pharmacyProfile);
                    setShareFeedback(res.statusText);
                  }}
                  className="py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Bill</span>
                </button>
              </div>
            </div>

            {shareFeedback && (
              <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 font-bold text-xs text-center">
                {shareFeedback}
              </div>
            )}

            {/* Printable Receipt Summary Preview */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-2">
                <div>
                  <span className="font-black text-sm text-slate-900 uppercase block">{pharmacyProfile.name}</span>
                  <span className="text-[10px] text-slate-500">
                    DL: {pharmacyProfile.drugLicenseNo} | GSTIN: {pharmacyProfile.gstin}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 block">Invoice #{savedTransaction.id}</span>
                  <span className="text-[10px] text-slate-500">{formatDateDMY(savedTransaction.date)}</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-between text-slate-700 gap-2 py-1">
                <span>Customer: <strong>{savedTransaction.patientName}</strong> ({savedTransaction.patientPhone || 'Walk-in'})</span>
                <span>Doctor: <strong>{savedTransaction.doctorName}</strong></span>
                <span>Payment: <strong>{savedTransaction.paymentMethod}</strong></span>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
                {savedTransaction.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span className="truncate max-w-[55%]">
                      {idx + 1}. {item.medicineName} <span className="text-[10px] text-slate-400">({item.batchNumber})</span>
                    </span>
                    <span>{formatQuantityWithUnit(item)}</span>
                    <span className="font-bold">₹{item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-1 font-black text-sm text-slate-900">
                <span>TOTAL PAID ({savedTransaction.items.length} Items):</span>
                <span className="text-emerald-700 text-base">₹{savedTransaction.grandTotal.toFixed(2)}</span>
              </div>

              {/* Scannable UPI Payment QR Code on Saved Bill Preview */}
              <div className="pt-2.5 mt-2 border-t border-dashed border-slate-300 flex items-center justify-center gap-3">
                {pharmacyProfile.upiQrCodeUrl ? (
                  <img
                    src={pharmacyProfile.upiQrCodeUrl}
                    alt="UPI QR"
                    className="w-20 h-20 object-contain bg-white p-1 rounded-lg border border-slate-300"
                  />
                ) : (
                  <QRCode
                    value={`upi://pay?pa=${encodeURIComponent(pharmacyProfile.upiVpa || pharmacyProfile.upiId || '8438678498@upi')}&pn=${encodeURIComponent(pharmacyProfile.name || 'City Rx')}&am=${savedTransaction.grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Inv-${savedTransaction.id}`)}`}
                    size={76}
                  />
                )}
                <div className="text-left text-[10px] space-y-0.5">
                  <div className="font-bold text-slate-900 uppercase">Scan &amp; Pay UPI QR</div>
                  <div className="text-emerald-800 font-bold">₹{savedTransaction.grandTotal.toFixed(2)}</div>
                  <div className="text-slate-600">UPI: {pharmacyProfile.upiVpa || pharmacyProfile.upiId || '8438678498@upi'}</div>
                  <div className="text-[9px] text-slate-500">Embedded in Printed Bill #{savedTransaction.id}</div>
                </div>
              </div>
            </div>

            {/* Modal Footer for Stage 2 */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleInstantPrintFormat(printFormat)}
                className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reprint Bill Now</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md"
                id="confirm-sale-done-new-bill-btn"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Done • Start New Retail Sale</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STAGE 1: CONFIRM THE SAVE & INSTANT BILL PRINT                            */
          /* ========================================================================= */
          <>
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800 text-xs">
              {/* Customer, Doctor & Payment Summary Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Customer / Patient Name
                  </label>
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                    <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full font-bold text-slate-900 text-xs focus:outline-hidden"
                      placeholder="Walk-in Customer"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Customer Mobile
                  </label>
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                    <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full font-mono font-bold text-slate-900 text-xs focus:outline-hidden"
                      placeholder="10-digit Mobile"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Prescribing Doctor
                  </label>
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <input
                      type="text"
                      value={doctorName}
                      onChange={e => setDoctorName(e.target.value)}
                      className="w-full font-bold text-slate-900 text-xs focus:outline-hidden"
                      placeholder="Self / OTC"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Mode & Instant Print Format Bar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Payment Method Selector */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                      1. Select Payment Mode
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      Payable: ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(['Cash', 'UPI', 'Split', 'Card', 'Credit'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMethod(mode)}
                        className={`py-2 px-2 rounded-xl font-bold text-xs flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                          paymentMethod === mode
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {mode === 'Cash' && <Banknote className="w-3.5 h-3.5" />}
                        {mode === 'UPI' && <QrCode className="w-3.5 h-3.5" />}
                        {mode === 'Split' && <Split className="w-3.5 h-3.5" />}
                        {mode === 'Card' && <CreditCard className="w-3.5 h-3.5" />}
                        {mode === 'Credit' && <FileText className="w-3.5 h-3.5" />}
                        <span>{mode}</span>
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'Cash' && (
                    <div className="flex items-center justify-between gap-3 pt-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-semibold">Cash Received: ₹</span>
                        <input
                          type="number"
                          value={cashTendered}
                          onChange={e => setCashTendered(e.target.value)}
                          className="w-24 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 mr-1">Change Due:</span>
                        <span className="font-mono font-black text-emerald-700">₹{changeDue.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Split' && (
                    <div className="space-y-2 pt-1 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-semibold">Cash: ₹</span>
                          <input
                            type="number"
                            value={splitCashAmount}
                            onChange={e => setSplitCashAmount(parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 mr-1">UPI Balance:</span>
                          <span className="font-mono font-black text-teal-700">₹{splitUpiAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      {splitUpiAmount > 0 && (
                        <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center gap-3">
                          <QRCode
                            value={`upi://pay?pa=${encodeURIComponent(pharmacyProfile.upiVpa || pharmacyProfile.upiId || '8438678498@upi')}&pn=${encodeURIComponent(pharmacyProfile.name || 'City Rx')}&am=${splitUpiAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Split-${invoiceId}`)}`}
                            size={68}
                          />
                          <div className="text-[11px]">
                            <div className="font-bold text-teal-950">Scan for UPI Balance: ₹{splitUpiAmount.toFixed(2)}</div>
                            <div className="font-mono text-[10px] text-slate-600">{pharmacyProfile.upiVpa || pharmacyProfile.upiId || '8438678498@upi'}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === 'UPI' && (
                    <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center gap-3 mt-1">
                      {pharmacyProfile.upiQrCodeUrl ? (
                        <img
                          src={pharmacyProfile.upiQrCodeUrl}
                          alt="UPI QR"
                          className="w-16 h-16 object-contain bg-white p-1 rounded-lg border border-emerald-300"
                        />
                      ) : (
                        <QRCode
                          value={`upi://pay?pa=${encodeURIComponent(pharmacyProfile.upiVpa || pharmacyProfile.upiId || '8438678498@upi')}&pn=${encodeURIComponent(pharmacyProfile.name || 'City Rx')}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Inv-${invoiceId}`)}`}
                          size={68}
                        />
                      )}
                      <div className="text-[11px]">
                        <div className="font-bold text-emerald-950">Dynamic UPI Payment QR: ₹{grandTotal.toFixed(2)}</div>
                        <div className="font-mono text-[10px] text-slate-600">UPI: {pharmacyProfile.upiVpa || pharmacyProfile.upiId || '8438678498@upi'}</div>
                        <div className="text-[10px] text-emerald-800 font-semibold">QR code also prints directly on bill</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instant Bill Print Format Selector */}
                <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>2. Instant Bill Print Format</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-950">
                      Direct Print
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: 'thermal', label: '3" Thermal', sub: '80mm Roll' },
                      { id: 'a4', label: 'A4 Invoice', sub: 'Full Sheet' },
                      { id: 'a5', label: 'A5 Bill', sub: 'Half Page' },
                      { id: 'thermal58', label: '2" Thermal', sub: '58mm Roll' }
                    ].map(fmt => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setPrintFormat(fmt.id as any)}
                        className={`py-2 px-2 rounded-xl text-left border transition-all cursor-pointer ${
                          printFormat === fmt.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-black text-xs">{fmt.label}</div>
                        <div className={`text-[10px] ${printFormat === fmt.id ? 'text-teal-300' : 'text-slate-400'}`}>
                          {fmt.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleDualCopy()}
                      role="switch"
                      aria-checked={printDualCopy}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                        printDualCopy
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                      title="Automatically triggers two distinct print commands (Customer Copy + Pharmacy Copy)"
                    >
                      <span className="flex items-center gap-1.5">
                        <Copy className="w-3.5 h-3.5" />
                        <span>Print Dual Copy (Customer + Pharmacy Copy)</span>
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/15">
                        {printDualCopy ? '2x ON' : 'OFF'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-teal-700" />
                    <span>Dispensed Medicines & Batch Summary ({cart.length} Items)</span>
                  </span>
                  <span className="text-[11px] text-emerald-800 font-bold">
                    Real-Time Stock Deduction on Save
                  </span>
                </div>

                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Medicine Name</th>
                        <th className="py-2 px-3">Batch</th>
                        <th className="py-2 px-3">Expiry</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Rate (₹)</th>
                        <th className="py-2 px-3 text-right">Disc %</th>
                        <th className="py-2 px-3 text-right">Net Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cart.map((item, idx) => {
                        const packInfo = getPackDetails(item.medicine);
                        const pricing = calculateLinePricing({
                          unitType: item.unitType,
                          quantity: item.quantity,
                          boxQuantity: item.boxQuantity,
                          stripQuantity: item.stripQuantity,
                          looseQuantity: item.looseQuantity,
                          packSize: item.packSize || packInfo.packSize,
                          boxSize: item.boxSize,
                          customMrp: item.customMrp,
                          sellingPrice: item.selectedBatch.sellingPrice,
                          discountPercent: item.discountPercent
                        });
                        return (
                          <tr key={`${item.medicine.id}-${idx}`} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-mono font-bold text-slate-500">#{idx + 1}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">
                              {item.medicine.name}
                              {pricing.isLoose && (
                                <span className="ml-1.5 px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded text-[10px] font-bold">
                                  Loose
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-800">{item.selectedBatch.batchNumber}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">
                              {formatExpiryDMY(item.selectedBatch.expiryDate)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              {pricing.isLoose ? `${pricing.looseCount} Loose` : `${item.quantity} Pack`}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">₹{pricing.unitPrice.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-700">
                              {item.discountPercent > 0 ? `${item.discountPercent}%` : '—'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                              ₹{pricing.netAmount.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals Bar */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-5 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Subtotal</span>
                    <span className="font-mono font-bold text-slate-800">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Discount</span>
                      <span className="font-mono font-bold text-emerald-700">-₹{totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">GST Included</span>
                    <span className="font-mono font-bold text-teal-800">₹{totalTax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Net Retail Bill Amount
                  </span>
                  <span className="text-2xl font-black font-mono text-emerald-700">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Save Confirmation Checkbox */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="confirm-retail-sale-check"
                  checked={hasVerifiedSale}
                  onChange={e => setHasVerifiedSale(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="confirm-retail-sale-check" className="cursor-pointer">
                  <span className="font-bold text-slate-900 block text-xs">
                    I confirm that this retail sale is complete and verified for saving & billing.
                  </span>
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    Clicking <strong>Confirm Save & Instant Bill Print</strong> will save the invoice, update stock, and immediately print the {printFormat.toUpperCase()} bill.
                  </span>
                </label>
              </div>
            </div>

            {/* Stage 1 Action Footer */}
            <div className="bg-slate-100 p-4 sm:p-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {onSaveAsDraft && (
                  <button
                    type="button"
                    onClick={() => {
                      onSaveAsDraft();
                      onClose();
                    }}
                    className="w-full sm:w-auto px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-amber-700" />
                    <span>Hold in Draft</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Back to Edit Cart
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                {/* Confirm & Save Only */}
                <button
                  type="button"
                  disabled={!hasVerifiedSale}
                  onClick={() => handleConfirmSaveSale(false)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
                  id="confirm-retail-save-only-btn"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>✓ Confirm & Save Bill</span>
                </button>

                {/* Primary CTA: Confirm Save & Instant Bill Print */}
                <button
                  type="button"
                  disabled={!hasVerifiedSale}
                  onClick={() => handleConfirmSaveSale(true)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-400 disabled:to-slate-400 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:cursor-not-allowed active:scale-98"
                  id="confirm-retail-save-and-instant-print-btn"
                >
                  <Zap className="w-4 h-4 fill-current text-amber-300" />
                  <span>⚡ Confirm Save & Instant Bill Print</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Full Print Invoice Preview Modal if opened from Stage 2 */}
      {showFullPrintPreview && savedTransaction && (
        <PrintInvoiceModal
          isOpen={showFullPrintPreview}
          onClose={() => setShowFullPrintPreview(false)}
          transaction={savedTransaction}
          cart={cart}
          patient={selectedPatient}
          doctor={selectedDoctor}
          paymentMethod={savedTransaction.paymentMethod}
          initialFormat={printFormat}
        />
      )}
    </div>
  );
};
