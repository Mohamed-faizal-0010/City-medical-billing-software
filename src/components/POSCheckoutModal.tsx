import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  QrCode,
  CreditCard,
  Banknote,
  CheckCircle2,
  Printer,
  Copy,
  Check,
  Smartphone,
  Download,
  FileSpreadsheet,
  MessageCircle,
  Send,
  User,
  Phone,
  MapPin,
  Calendar,
  Split,
  Percent,
  Upload,
  Image as ImageIcon,
  Receipt,
  FileText,
  SlidersHorizontal,
  RotateCcw,
  Building2,
  Truck,
  Briefcase,
  ShieldAlert,
  Stethoscope,
  Zap
} from 'lucide-react';
import { CartItem, Patient, Doctor, SaleTransaction, PrinterSettings, WholesaleBuyer, PharmacyProfile } from '../types';
import { QRCode } from './QRCode';
import { StorageService } from '../services/storage';
import { PrintInvoiceModal } from './PrintInvoiceModal';
import { SendBillPhoneModal } from './SendBillPhoneModal';
import { exportInvoiceToPDF, exportInvoiceToExcel, exportThermalReceiptToPDF, exportThermalSlipToText } from '../utils/exportUtils';
import { printThermalBillViaBrowser } from '../utils/escPosUtils';
import { printDirectBill } from '../utils/printDirectUtils';
import { getPackDetails, calculateLinePricing, formatQuantityWithUnit } from '../utils/packUtils';
import { formatDateDMY, formatExpiryDMY } from '../utils/dateUtils';
import { DateMonthYearPicker } from './DateMonthYearPicker';
import { getMedicineScheduleInfo } from '../utils/scheduleDrugUtils';
import {
  shareBillViaWhatsApp,
  shareBillViaSms,
  isValidPhoneNumber,
  generateWhatsAppBillMessage,
  generateSmsBillMessage,
  copyToClipboardSafely
} from '../utils/billShareUtils';

interface POSCheckoutModalProps {
  cart: CartItem[];
  selectedPatient: Patient | null;
  selectedDoctor: Doctor | null;
  walkInCustomer?: { name?: string; phone?: string; age?: number | string; location?: string };
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  cashierName: string;
  initialMethod?: 'Cash' | 'Split' | 'UPI' | 'Card' | 'Credit';
  invoiceDate?: string;
  saleType?: 'retail' | 'wholesale';
  wholesaleBuyer?: WholesaleBuyer | null;
  transportMode?: string;
  vehicleNumber?: string;
  ewayBillNo?: string;
  creditDays?: number;
  onEditDiscount?: () => void;
  onClose: () => void;
  onPaymentSuccess: (transaction: SaleTransaction) => void;
}

export const POSCheckoutModal: React.FC<POSCheckoutModalProps> = ({
  cart,
  selectedPatient,
  selectedDoctor,
  walkInCustomer,
  subtotal,
  totalTax,
  totalDiscount,
  grandTotal,
  cashierName,
  initialMethod = 'Cash',
  invoiceDate,
  saleType = 'retail',
  wholesaleBuyer,
  transportMode,
  vehicleNumber,
  ewayBillNo,
  creditDays,
  onEditDiscount,
  onClose,
  onPaymentSuccess,
}) => {
  const isWholesale = saleType === 'wholesale';
  const [internalInvoiceDate, setInternalInvoiceDate] = useState<string>(
    invoiceDate || new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Split' | 'UPI' | 'Card' | 'Credit'>(initialMethod);
  const [cashTendered, setCashTendered] = useState<string>((grandTotal ?? 0).toFixed(2));
  
  // Split payment state
  const defaultSplitCash = Math.floor((grandTotal ?? 0) / 2);
  const [splitCashAmount, setSplitCashAmount] = useState<number>(defaultSplitCash);

  // Patient Credit (Khata / Due) state
  const [creditDownPayment, setCreditDownPayment] = useState<string>('0');
  const [creditDueDateVal, setCreditDueDateVal] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + (selectedPatient?.creditDays || creditDays || 15));
    return d.toISOString().split('T')[0];
  });
  const [creditRemarks, setCreditRemarks] = useState<string>('Counter Patient Credit (Khata)');
  
  // Customer details for WhatsApp / SMS & Invoicing
  const [customerName, setCustomerName] = useState<string>(
    isWholesale
      ? (wholesaleBuyer?.businessName || 'Wholesale Chemist Buyer')
      : (selectedPatient?.name || walkInCustomer?.name || 'Walk-in Customer')
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    isWholesale
      ? (wholesaleBuyer?.phone || '')
      : (selectedPatient?.phone || walkInCustomer?.phone || '')
  );
  const [customerAge, setCustomerAge] = useState<string>(
    isWholesale
      ? ''
      : (selectedPatient?.age ? String(selectedPatient.age) : (walkInCustomer?.age ? String(walkInCustomer.age) : ''))
  );
  const [customerLocation, setCustomerLocation] = useState<string>(
    isWholesale
      ? (`${wholesaleBuyer?.address || ''}, ${wholesaleBuyer?.city || ''}`)
      : (selectedPatient?.address || walkInCustomer?.location || '')
  );
  const [sentStatus, setSentStatus] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showPhoneShareModal, setShowPhoneShareModal] = useState(false);
  const [phoneShareChannel, setPhoneShareChannel] = useState<'WhatsApp' | 'SMS'>('WhatsApp');

  // Schedule H1 Prescription Mandatory verification state
  const scheduleH1CartItems = useMemo(() => {
    return cart.filter(c => {
      const info = getMedicineScheduleInfo(c.medicine);
      return info.scheduleType === 'H1';
    });
  }, [cart]);
  const hasScheduleH1 = scheduleH1CartItems.length > 0;

  const [doctorCustomName, setDoctorCustomName] = useState<string>(selectedDoctor?.name || '');
  const [doctorCustomRegNo, setDoctorCustomRegNo] = useState<string>(selectedDoctor?.registrationNumber || '');
  const [doctorCustomClinic, setDoctorCustomClinic] = useState<string>(selectedDoctor?.hospitalAffiliation || selectedDoctor?.clinicName || '');
  const [rxNumber, setRxNumber] = useState<string>(`RX-${Math.floor(1000 + Math.random() * 9000)}`);

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingSaveConfirmMethod, setPendingSaveConfirmMethod] = useState<'Cash' | 'Split' | 'UPI' | 'Card' | 'Credit' | null>(null);
  const [completedTransaction, setCompletedTransaction] = useState<SaleTransaction | null>(null);
  const [showPrintInvoiceModal, setShowPrintInvoiceModal] = useState(false);
  const [checkoutPrintFormat, setCheckoutPrintFormat] = useState<'thermal' | 'a4' | 'a5' | 'thermal58'>('thermal');
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(() => StorageService.getPrinterSettings());
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(() => {
    const s = StorageService.getPrinterSettings();
    return s.autoPrintOnComplete !== false;
  });
  const [printDualCopy, setPrintDualCopy] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cityrx_print_dual_copy');
      if (saved !== null) return saved === 'true';
    } catch {}
    return Boolean(StorageService.getPrinterSettings()?.printDualCopy);
  });
  const [autoPrintStatus, setAutoPrintStatus] = useState<string | null>(null);

  const handleToggleDualCopy = (nextValue?: boolean) => {
    const updatedVal = nextValue !== undefined ? nextValue : !printDualCopy;
    setPrintDualCopy(updatedVal);
    try {
      localStorage.setItem('cityrx_print_dual_copy', String(updatedVal));
    } catch {}
    const updatedSettings = {
      ...printerSettings,
      printDualCopy: updatedVal,
      printCopies: updatedVal ? 2 : 1
    };
    setPrinterSettings(updatedSettings);
    StorageService.savePrinterSettings(updatedSettings);
    setAutoPrintStatus(
      updatedVal
        ? 'Print Dual Copy ON: Automatically triggers 2 print commands (1. Customer Copy + 2. Pharmacy Copy).'
        : 'Print Dual Copy OFF: Single copy printing active.'
    );
  };

  const pharmacyProfile = StorageService.getPharmacyProfile();
  const invoiceId = useMemo(() => StorageService.getNextInvoiceNumber(), []);
  const upiId = pharmacyProfile.upiId || '8438678498@upi';

  // Store uploaded QR code state
  const [storeQrImage, setStoreQrImage] = useState<string | undefined>(pharmacyProfile.upiQrCodeUrl);
  const [upiMode, setUpiMode] = useState<'dynamic' | 'standee'>('dynamic');
  const posQrInputRef = useRef<HTMLInputElement>(null);

  const handlePosQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSentStatus('Please select an image file (PNG/JPG)');
      setTimeout(() => setSentStatus(null), 3000);
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;
      const updated = {
        ...pharmacyProfile,
        upiQrCodeUrl: dataUrl,
        upiQrUploadedAt: new Date().toISOString(),
        upiQrFileName: file.name
      };
      StorageService.savePharmacyProfile(updated);
      setStoreQrImage(dataUrl);
      setUpiMode('standee');
    };
    reader.readAsDataURL(file);
  };

  // Calculations for payments
  const cashAmount = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, cashAmount - grandTotal);

  // Split calculations
  const validSplitCash = Math.min(Math.max(0, splitCashAmount || 0), grandTotal);
  const splitUpiAmount = Number((grandTotal - validSplitCash).toFixed(2));

  // Dynamic UPI URIs
  const fullUpiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    pharmacyProfile.name
  )}&am=${(grandTotal ?? 0).toFixed(2)}&cu=INR&tn=Invoice+${invoiceId}`;

  const splitUpiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    pharmacyProfile.name
  )}&am=${splitUpiAmount.toFixed(2)}&cu=INR&tn=Invoice+${invoiceId}+PartUPI`;

  const activeUpiUri = paymentMethod === 'Split' ? splitUpiUri : fullUpiUri;

  const handleCopyUpiUri = async () => {
    await copyToClipboardSafely(activeUpiUri);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Helper to generate formatted bill message for WhatsApp & SMS
  const generateBillSummaryText = (tx: SaleTransaction) => {
    const itemsList = tx.items
      .map(
        it =>
          `• ${it.medicineName}: ${it.quantity} @ Rs.${it.unitPrice.toFixed(2)} = Rs.${it.total.toFixed(2)}`
      )
      .join('\n');

    let paymentDetails = `Paid via: ${tx.paymentMethod}`;
    if (tx.paymentMethod === 'Split' && tx.splitPayment) {
      paymentDetails = `Paid via: Split (Cash Rs.${tx.splitPayment.cashAmount.toFixed(2)} + UPI Rs.${tx.splitPayment.upiAmount.toFixed(2)})`;
    } else if (tx.paymentMethod === 'Credit') {
      const paid = tx.paidAmount || 0;
      const due = tx.creditBalanceAmount || tx.grandTotal;
      paymentDetails = `Payment: Patient Khata (Credit)\n• Down Payment Paid: Rs.${paid.toFixed(2)}\n• Outstanding Balance Due: Rs.${due.toFixed(2)}\n• Due Date: ${tx.creditDueDate || 'Within 15 days'}\nPay via UPI: upi://pay?pa=${pharmacyProfile.upiId}&pn=${encodeURIComponent(pharmacyProfile.name)}&am=${due.toFixed(2)}&cu=INR`;
    }

    return (
      `*${pharmacyProfile.name.toUpperCase()}*\n` +
      `${pharmacyProfile.addressLine1}, ${pharmacyProfile.district} - ${pharmacyProfile.pincode}\n` +
      `Phone: ${pharmacyProfile.mobile} | DL: ${pharmacyProfile.drugLicenseNo}\n` +
      `--------------------------------\n` +
      `*Tax Invoice:* #${tx.id}\n` +
      `*Date:* ${new Date(tx.date).toLocaleDateString()} ${new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
      `*Customer:* ${tx.patientName}${tx.patientAge ? ` (${tx.patientAge} yrs)` : ''} (${tx.patientPhone || 'Walk-in'})\n` +
      (tx.patientAddress ? `*Location:* ${tx.patientAddress}\n` : '') +
      `*Doctor / Rx:* ${tx.doctorName || 'Self'}\n` +
      `--------------------------------\n` +
      `*Prescription Items:*\n${itemsList}\n` +
      `--------------------------------\n` +
      `Subtotal: Rs.${tx.subtotal.toFixed(2)}\n` +
      (tx.totalDiscount > 0 ? `Discount: -Rs.${tx.totalDiscount.toFixed(2)}\n` : '') +
      `GST Tax Included: Rs.${tx.totalTax.toFixed(2)}\n` +
      `*NET AMOUNT: Rs.${tx.grandTotal.toFixed(2)}*\n` +
      `${paymentDetails}\n` +
      `--------------------------------\n` +
      `Thank you for trusting ${pharmacyProfile.name}! Get well soon.`
    );
  };

  const handleSendWhatsApp = async (tx: SaleTransaction, overridePhone?: string) => {
    const targetPhone = overridePhone || customerPhone || '';
    if (!isValidPhoneNumber(targetPhone)) {
      setPhoneError('Please enter a valid 10-digit customer mobile number for WhatsApp.');
      setPhoneShareChannel('WhatsApp');
      setShowPhoneShareModal(true);
      return;
    }
    setPhoneError(null);
    const result = await shareBillViaWhatsApp(targetPhone, tx, pharmacyProfile);
    setSentStatus(result.statusText);
    setTimeout(() => setSentStatus(null), 4500);
  };

  const handleSendSMS = async (tx: SaleTransaction, overridePhone?: string) => {
    const targetPhone = overridePhone || customerPhone || '';
    if (!isValidPhoneNumber(targetPhone)) {
      setPhoneError('Please enter a valid 10-digit customer mobile number for SMS.');
      setPhoneShareChannel('SMS');
      setShowPhoneShareModal(true);
      return;
    }
    setPhoneError(null);
    const result = await shareBillViaSms(targetPhone, tx, pharmacyProfile);
    setSentStatus(result.statusText);
    setTimeout(() => setSentStatus(null), 4500);
  };

  const handleCompletePayment = (
    forcedMethod?: 'Cash' | 'Split' | 'UPI' | 'Card' | 'Credit',
    forceInstantPrint?: boolean
  ) => {
    setIsProcessing(true);
    const methodToUse = forcedMethod || paymentMethod;

    // STATUTORY RULE 65(9) ENFORCEMENT: Schedule H1 Drugs MUST Have Doctor's Prescription
    if (hasScheduleH1 && !isWholesale) {
      const effectiveDoc = doctorCustomName.trim() || selectedDoctor?.name;
      const effectiveReg = doctorCustomRegNo.trim() || selectedDoctor?.registrationNumber;
      if (!effectiveDoc || effectiveDoc === 'Self / OTC Referral') {
        alert(
          `⚠️ STATUTORY COMPLIANCE REQUIRED (Drugs & Cosmetics Act Rule 65(9)):\n\n` +
          `Your cart contains Schedule H1 medicine (${scheduleH1CartItems.map(i => i.medicine.name).join(', ')}).\n` +
          `A Registered Doctor's Prescription is strictly MANDATORY by law.\n\n` +
          `Please enter the Prescribing Doctor's Name before proceeding.`
        );
        setIsProcessing(false);
        return;
      }
      if (!effectiveReg) {
        alert(
          `⚠️ STATUTORY COMPLIANCE REQUIRED:\n\n` +
          `Prescribing Doctor's Medical Council Registration Number (Reg. No.) is MANDATORY by law to dispense Schedule H1 medicines.\n\n` +
          `Please provide the Doctor's Reg. No.`
        );
        setIsProcessing(false);
        return;
      }
      if (!customerName.trim() || customerName === 'Walk-in Customer') {
        alert(
          `⚠️ STATUTORY COMPLIANCE REQUIRED:\n\n` +
          `Patient's full name is required for statutory Schedule H1 Register logging.`
        );
        setIsProcessing(false);
        return;
      }
    }

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

    const tx: SaleTransaction = {
      id: invoiceId,
      date: internalInvoiceDate ? new Date(internalInvoiceDate).toISOString() : new Date().toISOString(),
      saleType: isWholesale ? 'wholesale' : 'retail',
      patientId: !isWholesale ? selectedPatient?.id : undefined,
      patientName: isWholesale
        ? (wholesaleBuyer?.businessName || customerName.trim() || 'Wholesale Chemist Buyer')
        : (customerName.trim() || selectedPatient?.name || 'Walk-in Customer'),
      patientPhone: customerPhone.trim() || (isWholesale ? wholesaleBuyer?.phone : selectedPatient?.phone),
      patientAge: !isWholesale && customerAge ? parseInt(customerAge, 10) : selectedPatient?.age,
      patientAddress: customerLocation.trim() || (isWholesale ? wholesaleBuyer?.address : selectedPatient?.address),
      buyerId: isWholesale ? wholesaleBuyer?.id : undefined,
      buyerBusinessName: isWholesale ? (wholesaleBuyer?.businessName || customerName.trim()) : undefined,
      buyerGstin: isWholesale ? wholesaleBuyer?.gstin : undefined,
      buyerDrugLicense: isWholesale ? wholesaleBuyer?.drugLicenseNo : undefined,
      buyerAddress: isWholesale ? (wholesaleBuyer?.address || customerLocation) : undefined,
      buyerStateCode: isWholesale ? (wholesaleBuyer?.stateCode || '33') : undefined,
      transportMode: isWholesale ? transportMode : undefined,
      vehicleNumber: isWholesale ? vehicleNumber : undefined,
      ewayBillNo: isWholesale ? ewayBillNo : undefined,
      creditDays: isWholesale ? (creditDays || wholesaleBuyer?.creditDays || 30) : undefined,
      paymentDueDate: isWholesale ? new Date(Date.now() + (creditDays || wholesaleBuyer?.creditDays || 30) * 86400000).toISOString().split('T')[0] : undefined,
      doctorId: !isWholesale ? selectedDoctor?.id : undefined,
      doctorName: !isWholesale ? (doctorCustomName.trim() || selectedDoctor?.name || 'Self / OTC Referral') : undefined,
      doctorRegNo: !isWholesale ? (doctorCustomRegNo.trim() || selectedDoctor?.registrationNumber) : undefined,
      prescriptionNo: !isWholesale ? rxNumber : undefined,
      items: cart.map(c => {
        const packInfo = getPackDetails(c.medicine);
        const sched = getMedicineScheduleInfo(c.medicine);
        const pricing = calculateLinePricing({
          unitType: c.unitType,
          quantity: c.quantity,
          boxQuantity: c.boxQuantity,
          stripQuantity: c.stripQuantity,
          looseQuantity: c.looseQuantity,
          packSize: c.packSize || packInfo.packSize,
          boxSize: c.boxSize,
          customMrp: c.customMrp,
          sellingPrice: c.selectedBatch.sellingPrice,
          discountPercent: c.discountPercent
        });
        return {
          medicineId: c.medicine.id,
          medicineName: c.medicine.name,
          genericName: c.medicine.genericName,
          scheduleType: sched.scheduleType,
          batchNumber: c.selectedBatch.batchNumber,
          expiryDate: c.selectedBatch.expiryDate,
          quantity: pricing.isLoose ? pricing.looseCount : (pricing.boxCount > 0 ? pricing.stockDeduction : (pricing.stripCount || 1)),
          stockDeduction: pricing.stockDeduction,
          unitPrice: pricing.unitPrice,
          discountPercent: c.discountPercent,
          taxRate: c.medicine.taxRate,
          total: pricing.netAmount,
          unitType: pricing.isLoose ? 'loose' : (c.unitType || 'pack'),
          packSize: packInfo.packSize,
          boxQuantity: pricing.boxCount,
          stripQuantity: pricing.stripCount,
          looseQuantity: pricing.looseCount,
          unitName: packInfo.unitName,
          packName: packInfo.packName,
          pack: c.medicine.pack || packInfo.packDisplay,
          location: c.medicine.rackLocation || c.selectedBatch.location || 'Rack A-01'
        };
      }),
      subtotal,
      totalTax,
      totalDiscount,
      grandTotal,
      costOfGoodsSold,
      paymentMethod: methodToUse,
      paidAmount: methodToUse === 'Credit' ? Math.max(0, parseFloat(creditDownPayment) || 0) : undefined,
      creditBalanceAmount:
        methodToUse === 'Credit'
          ? Math.max(0, grandTotal - (parseFloat(creditDownPayment) || 0))
          : undefined,
      creditPatientId: methodToUse === 'Credit' ? selectedPatient?.id : undefined,
      creditDueDate: methodToUse === 'Credit' ? creditDueDateVal : undefined,
      splitPayment:
        methodToUse === 'Split'
          ? {
              cashAmount: validSplitCash,
              upiAmount: splitUpiAmount
            }
          : undefined,
      paymentStatus:
        methodToUse === 'Credit' && Math.max(0, grandTotal - (parseFloat(creditDownPayment) || 0)) > 0
          ? 'Pending'
          : 'Paid',
      upiReferenceId:
        methodToUse === 'UPI' || methodToUse === 'Split'
          ? `UPI-${Math.floor(100000000 + Math.random() * 900000000)}`
          : undefined,
      cashierName,
    };

    // Real-time Stock Deduction & Persistence
    StorageService.deductStockForSale(tx.items);
    StorageService.addTransaction(tx);

    setIsProcessing(false);
    setPendingSaveConfirmMethod(null);
    setCompletedTransaction(tx);
    onPaymentSuccess(tx);

    // Instant Bill Print on Save Confirmation
    const shouldPrintNow = forceInstantPrint !== undefined ? forceInstantPrint : autoPrintEnabled;
    if (shouldPrintNow) {
      try {
        printDirectBill(tx, pharmacyProfile, checkoutPrintFormat, printerSettings, {
          dualCopy: printDualCopy
        });
        const fmtLabel =
          checkoutPrintFormat === 'a4'
            ? 'A4 Tax Invoice'
            : checkoutPrintFormat === 'a5'
            ? 'A5 Clinic Bill'
            : `${printerSettings.paperWidth || '3"'} Thermal Printer`;
        setAutoPrintStatus(
          printDualCopy
            ? `⚡ Dual Copy Print dispatched (Customer Copy + Pharmacy Copy) to ${fmtLabel} (#${tx.id})!`
            : `⚡ Instant Bill Print dispatched to ${fmtLabel} (#${tx.id})!`
        );
      } catch (err) {
        console.warn('Instant bill print error:', err);
        setAutoPrintStatus('Sale Saved! Click Instant Bill Print below to print.');
      }
    } else {
      setAutoPrintStatus(`✓ Sale #${tx.id} Confirmed & Saved! Click Instant Bill Print below.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden transition-all my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {completedTransaction
                ? '✓ Retail Sale Saved & Confirmed — Instant Bill Print'
                : 'Process Counter Payment & Save Sale'}
            </h2>
            <p className="text-xs text-slate-500 font-mono">Invoice #{invoiceId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {completedTransaction ? (
          /* Receipt / Confirmation Screen */
          <div className="p-6 space-y-5">
            <div className={`text-center py-4 rounded-2xl border ${
              completedTransaction.paymentMethod === 'Credit'
                ? 'bg-amber-50 border-amber-200 text-amber-950'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <CheckCircle2 className={`w-12 h-12 mx-auto mb-2 animate-bounce ${
                completedTransaction.paymentMethod === 'Credit' ? 'text-amber-600' : 'text-emerald-600'
              }`} />
              <h3 className="text-lg font-black">
                {completedTransaction.paymentMethod === 'Credit'
                  ? '✓ Credit Sale Confirmed & Saved!'
                  : '✓ Retail Sale Confirmed & Saved!'}
              </h3>
              <p className={`text-xs ${completedTransaction.paymentMethod === 'Credit' ? 'text-amber-800' : 'text-emerald-700'}`}>
                Stock automatically deducted in real-time. Invoice #{completedTransaction.id} committed to ledger.
              </p>
              <div className="mt-2 flex items-center justify-center gap-2 flex-wrap text-xs font-semibold">
                {completedTransaction.paymentMethod === 'Credit' ? (
                  <>
                    <span className="px-2.5 py-1 rounded-full bg-amber-200/80 text-amber-950 font-mono font-bold">
                      Credit / Khata Sale
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-mono font-bold">
                      Balance Due: ₹{(completedTransaction.creditBalanceAmount || 0).toFixed(2)}
                    </span>
                    {completedTransaction.creditDueDate && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-mono text-[11px]">
                        Due: {completedTransaction.creditDueDate}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                      {completedTransaction.paymentMethod === 'Split'
                        ? `Split: Cash ₹${completedTransaction.splitPayment?.cashAmount.toFixed(2)} + UPI ₹${completedTransaction.splitPayment?.upiAmount.toFixed(2)}`
                        : `Paid via ${completedTransaction.paymentMethod}`}
                    </span>
                    {completedTransaction.upiReferenceId && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px]">
                        Ref: {completedTransaction.upiReferenceId}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* TOP INSTANT BILL PRINT HUB (1-CLICK DIRECT PRINT) */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <div className="text-xs font-black flex items-center gap-1.5 text-white">
                      <span>Instant Bill Print (Direct Spooler)</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-[11px] text-teal-300 font-mono">
                      {autoPrintStatus || `Ready for Instant Bill Print (#${completedTransaction.id})`}
                    </p>
                  </div>
                </div>

                {/* Big Action: Select Other Printer Manually */}
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutPrintFormat('a4');
                    setShowPrintInvoiceModal(true);
                  }}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  title="Manually choose other printer, A4 Full Sheet, A5 Clinic Bill, or system driver"
                  id="checkout-select-other-printer-btn"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Full Print Preview</span>
                </button>
              </div>

              {/* 1-Click Instant Print Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    printDirectBill(completedTransaction, pharmacyProfile, 'thermal', printerSettings, {
                      dualCopy: printDualCopy
                    });
                    setAutoPrintStatus(
                      printDualCopy
                        ? `⚡ Dual Copy (Customer + Pharmacy Copy) sent to ${printerSettings.paperWidth || '3"'} Thermal Printer!`
                        : `⚡ Instant Bill Print sent to ${printerSettings.paperWidth || '3"'} Thermal Printer!`
                    );
                  }}
                  className="py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-98"
                  id="instant-print-thermal-top-btn"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>{printDualCopy ? 'Print 3" Thermal (Dual 2x)' : 'Instant Print 3" Thermal'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    printDirectBill(completedTransaction, pharmacyProfile, 'a4', printerSettings, {
                      dualCopy: printDualCopy
                    });
                    setAutoPrintStatus(
                      printDualCopy
                        ? '⚡ Dual Copy (Customer + Pharmacy Copy) sent to A4 Tax Invoice Printer!'
                        : '⚡ Instant Bill Print sent to A4 Tax Invoice Printer!'
                    );
                  }}
                  className="py-2.5 px-3 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-98"
                  id="instant-print-a4-top-btn"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{printDualCopy ? 'Print A4 Bill (Dual 2x)' : 'Instant Print A4 Bill'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    printDirectBill(completedTransaction, pharmacyProfile, 'a5', printerSettings, {
                      dualCopy: printDualCopy
                    });
                    setAutoPrintStatus(
                      printDualCopy
                        ? '⚡ Dual Copy (Customer + Pharmacy Copy) sent to A5 Clinic Bill Printer!'
                        : '⚡ Instant Bill Print sent to A5 Clinic Bill Printer!'
                    );
                  }}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-all active:scale-98"
                  id="instant-print-a5-top-btn"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  <span>{printDualCopy ? 'Print A5 Bill (Dual 2x)' : 'Instant Print A5 Bill'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-300 flex-wrap gap-2">
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoPrintEnabled}
                      onChange={e => {
                        const val = e.target.checked;
                        setAutoPrintEnabled(val);
                        const updated = { ...printerSettings, autoPrintOnComplete: val };
                        setPrinterSettings(updated);
                        StorageService.savePrinterSettings(updated);
                      }}
                      className="rounded text-teal-500 focus:ring-teal-400 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Auto instant-print on save</span>
                  </label>

                  <label
                    className="flex items-center gap-2 cursor-pointer select-none px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-emerald-300 font-bold"
                    title="Automatically triggers two distinct print commands: 1. Customer Copy + 2. Pharmacy Copy"
                  >
                    <input
                      type="checkbox"
                      checked={printDualCopy}
                      onChange={e => handleToggleDualCopy(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-emerald-400 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Print Dual Copy (Pharmacy + Customer)</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (completedTransaction) {
                        printDirectBill(completedTransaction, pharmacyProfile, 'thermal', printerSettings, {
                          dualCopy: printDualCopy
                        });
                        setAutoPrintStatus(
                          printDualCopy
                            ? `Reprinted Dual Copy (Customer + Pharmacy) to ${printerSettings.paperWidth} Thermal Printer!`
                            : `Reprinted to ${printerSettings.paperWidth} Thermal Printer!`
                        );
                      }
                    }}
                    className="text-teal-400 hover:text-teal-300 font-bold underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reprint Thermal</span>
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPrintInvoiceModal(true);
                    }}
                    className="text-slate-300 hover:text-white font-semibold underline cursor-pointer"
                  >
                    More Formats (A4/A5)
                  </button>
                </div>
              </div>
            </div>

            {/* Quick WhatsApp & SMS Instant Share Section */}
            <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Send Bill to Customer Phone (WhatsApp / SMS)</span>
                </span>
                {sentStatus && (
                  <span className="text-[11px] font-bold text-emerald-700 animate-pulse">
                    {sentStatus}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => {
                      setCustomerPhone(e.target.value);
                      if (phoneError) setPhoneError(null);
                    }}
                    placeholder="Enter 10-digit Mobile Number"
                    className={`w-full pl-8 pr-3 py-2 text-xs font-mono font-bold bg-white border rounded-xl focus:ring-2 focus:outline-hidden text-slate-800 ${
                      phoneError ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30' : 'border-slate-200 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(completedTransaction)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                  title="Send Itemized Bill via WhatsApp"
                  id="checkout-send-whatsapp-btn"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendSMS(completedTransaction)}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                  title="Send Bill Summary via SMS"
                  id="checkout-send-sms-btn"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>SMS</span>
                </button>
              </div>
              {phoneError && (
                <p className="text-[11px] font-semibold text-rose-600 mt-1">
                  {phoneError}
                </p>
              )}
            </div>

            {/* Printable Receipt Preview Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-mono space-y-2">
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <p className="font-bold text-sm text-slate-800 uppercase">{pharmacyProfile.name}</p>
                <p className="text-[10px] text-slate-600">
                  {pharmacyProfile.addressLine1}, {pharmacyProfile.taluk}, {pharmacyProfile.district} - {pharmacyProfile.pincode}
                </p>
                <p className="text-[10px] text-slate-500">
                  DL: {pharmacyProfile.drugLicenseNo} | GSTIN: {pharmacyProfile.gstin}
                </p>
                <p className="text-[10px] font-semibold text-emerald-800">
                  Phone: {pharmacyProfile.mobile} | UPI: {pharmacyProfile.upiId}
                </p>
              </div>

              <div className="flex justify-between text-slate-600 pt-1">
                <span>Date: {formatDateDMY(completedTransaction.date)}</span>
                <span>Inv: {completedTransaction.id}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>
                  Customer: {completedTransaction.patientName}
                  {completedTransaction.patientAge ? ` (${completedTransaction.patientAge} yrs)` : ''}
                </span>
                <span>Phone: {completedTransaction.patientPhone || 'Walk-in'}</span>
              </div>
              {completedTransaction.patientAddress && (
                <div className="text-slate-500 text-[10px]">
                  <span>Loc: {completedTransaction.patientAddress}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Doctor: {completedTransaction.doctorName}</span>
                <span>Cashier: {completedTransaction.cashierName}</span>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
                <div className="flex justify-between font-bold text-slate-700">
                  <span className="w-1/2">Item (Batch / Exp)</span>
                  <span className="w-1/6 text-right">Qty</span>
                  <span className="w-1/3 text-right">Total</span>
                </div>
                {completedTransaction.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600">
                    <span className="w-1/2 truncate">
                      {item.medicineName} {item.unitType === 'loose' && <span className="text-amber-700 font-bold">[Loose]</span>}<br />
                      <span className="text-[10px] text-slate-400">
                        {item.batchNumber} (Exp: {formatExpiryDMY(item.expiryDate)})
                      </span>
                    </span>
                    <span className="w-1/6 text-right font-medium">
                      {formatQuantityWithUnit(item)}
                    </span>
                    <span className="w-1/3 text-right font-medium">₹{(item.total ?? 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1 text-slate-700">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{(completedTransaction.subtotal ?? 0).toFixed(2)}</span>
                </div>
                {completedTransaction.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-₹{(completedTransaction.totalDiscount ?? 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST Included:</span>
                  <span>₹{(completedTransaction.totalTax ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-300">
                  <span>NET PAID:</span>
                  <span>₹{(completedTransaction.grandTotal ?? 0).toFixed(2)}</span>
                </div>
                {completedTransaction.paymentMethod === 'Split' && completedTransaction.splitPayment && (
                  <div className="flex justify-between text-[11px] text-teal-700 font-semibold pt-0.5">
                    <span>Payment Split:</span>
                    <span>Cash: ₹{completedTransaction.splitPayment.cashAmount.toFixed(2)} • UPI: ₹{completedTransaction.splitPayment.upiAmount.toFixed(2)}</span>
                  </div>
                )}

                {/* Bill QR Payment & Verification Code */}
                <div className="pt-2.5 mt-2 border-t border-dashed border-slate-300 flex items-center justify-center gap-3">
                  {storeQrImage ? (
                    <img
                      src={storeQrImage}
                      alt="UPI QR"
                      className="w-20 h-20 object-contain bg-white p-1 rounded-lg border border-slate-300"
                    />
                  ) : (
                    <QRCode
                      value={`upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(pharmacyProfile.name || 'City Rx')}&am=${(completedTransaction.grandTotal ?? 0).toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Inv-${completedTransaction.id}`)}`}
                      size={76}
                    />
                  )}
                  <div className="text-left text-[10px] space-y-0.5">
                    <div className="font-bold text-slate-900 uppercase">Scan &amp; Pay UPI QR</div>
                    <div className="text-emerald-800 font-bold">₹{(completedTransaction.grandTotal ?? 0).toFixed(2)}</div>
                    <div className="text-slate-600">UPI: {upiId}</div>
                    <div className="text-[9px] text-slate-500">Printed on Bill #{completedTransaction.id}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons: Print Thermal, Other Printer Manual Select, Download PDF/XL, and New Sale */}
            <div className="space-y-2.5">
              {/* Primary 3-inch Thermal Actions: Print & Download */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (completedTransaction) {
                      printDirectBill(completedTransaction, pharmacyProfile, 'thermal', printerSettings, {
                        dualCopy: printDualCopy
                      });
                      setAutoPrintStatus(
                        printDualCopy
                          ? `Printed Dual Copy (Customer + Pharmacy) to ${printerSettings.paperWidth} Thermal Printer!`
                          : `Printed to ${printerSettings.paperWidth} Thermal Printer!`
                      );
                    } else {
                      setCheckoutPrintFormat('thermal');
                      setShowPrintInvoiceModal(true);
                    }
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-2xl shadow-md shadow-teal-600/25 transition-all text-xs transform active:scale-98 cursor-pointer"
                  id="print-thermal-invoice-btn"
                  title="Print directly to continuous 3-inch 80mm POS thermal receipt printer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>
                    {printDualCopy
                      ? `Print ${printerSettings.paperWidth || '3"'} Thermal (Dual 2x)`
                      : `Print ${printerSettings.paperWidth || '3"'} Thermal`}
                  </span>
                  <span className="text-[10px] font-bold bg-teal-800/60 px-1.5 py-0.5 rounded border border-teal-400/30">
                    ESC/POS
                  </span>
                </button>

                <button
                  onClick={() => {
                    if (completedTransaction) {
                      exportThermalReceiptToPDF(completedTransaction, pharmacyProfile, '80mm');
                      setAutoPrintStatus('3" Thermal Receipt PDF downloaded successfully!');
                    }
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold rounded-2xl shadow-md shadow-rose-600/20 transition-all text-xs transform active:scale-98 cursor-pointer"
                  id="download-thermal-3inch-pdf-btn"
                  title="Download continuous 3-inch 80mm thermal receipt invoice as PDF (.pdf)"
                >
                  <Download className="w-4 h-4" />
                  <span>Download 3" Thermal PDF</span>
                  <span className="text-[10px] font-bold bg-rose-900/60 px-1.5 py-0.5 rounded border border-rose-300/30">
                    80mm
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setCheckoutPrintFormat('thermal');
                    setShowPrintInvoiceModal(true);
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-all text-xs cursor-pointer"
                  id="print-select-other-printer-btn"
                  title={'View invoice preview and select format (3" Thermal, 2" Thermal, A4, A5)'}
                >
                  <Printer className="w-3.5 h-3.5 text-teal-400" />
                  <span>Other Printer / Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (completedTransaction) {
                      exportThermalSlipToText(completedTransaction, pharmacyProfile, '80mm');
                      setAutoPrintStatus('3" Thermal Slip (.txt) downloaded!');
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 rounded-xl text-xs transition-colors shadow-2xs cursor-pointer"
                  id="download-thermal-txt-btn"
                  title="Download thermal receipt text slip (.txt) for direct COM/USB spooling"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download .TXT Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportInvoiceToExcel(completedTransaction, pharmacyProfile)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 rounded-xl text-xs transition-colors shadow-2xs cursor-pointer"
                  id="download-invoice-xl-btn"
                  title="Download invoice as Excel spreadsheet file (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download Excel</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (completedTransaction) {
                      printDirectBill(completedTransaction, pharmacyProfile, 'a4');
                      setAutoPrintStatus('Direct printing to A4 Printer started (No PDF download)...');
                    } else {
                      setCheckoutPrintFormat('a4');
                      setShowPrintInvoiceModal(true);
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-900 font-semibold border border-slate-200 rounded-xl text-xs transition-colors shadow-2xs cursor-pointer"
                  id="print-a4-btn"
                  title="Direct print A4 Full Sheet tax bill to printer (No PDF download)"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print A4 Full Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (completedTransaction) {
                      printDirectBill(completedTransaction, pharmacyProfile, 'a5');
                      setAutoPrintStatus('Direct printing to A5 Printer started (No PDF download)...');
                    } else {
                      setCheckoutPrintFormat('a5');
                      setShowPrintInvoiceModal(true);
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-900 font-semibold border border-slate-200 rounded-xl text-xs transition-colors shadow-2xs cursor-pointer"
                  id="print-a5-btn"
                  title="Direct print A5 clinic prescription bill to printer (No PDF download)"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print A5 Clinic Bill</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl transition-colors text-xs text-center cursor-pointer"
                id="done-checkout-btn"
              >
                Done • Start New Sale
              </button>
            </div>
          </div>
        ) : (
          /* Payment Selection Screen */
          <div className="p-6 space-y-5">
            {/* Customer Details Bar (Walk-in / Contact / Age / Location) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              {isWholesale ? (
                <div className="sm:col-span-12 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1 bg-indigo-600 text-white rounded-md">
                        <Building2 className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <span className="font-black text-slate-900 text-xs">
                          {wholesaleBuyer?.businessName || customerName}
                        </span>
                        <span className="ml-2 text-[10px] text-indigo-700 font-semibold">Wholesale Chemist / Hospital</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-900 border border-indigo-300">
                      B2B Wholesale Tax Invoice
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-indigo-100 text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Buyer GSTIN:</span>
                      <span className="font-mono font-bold text-slate-800">{wholesaleBuyer?.gstin || 'Unregistered'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Drug License:</span>
                      <span className="font-mono font-bold text-slate-800">{wholesaleBuyer?.drugLicenseNo || 'Form 20/21'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Credit Terms:</span>
                      <span className="font-bold text-indigo-900">{creditDays || wholesaleBuyer?.creditDays || 30} Days Net</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Transport / Vehicle:</span>
                      <span className="font-mono font-bold text-slate-800">{vehicleNumber || transportMode || 'Local Delivery'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Customer / Patient
                    </label>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <input
                        type="text"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="Customer Name"
                        className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Mobile (WhatsApp/SMS)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="10-digit Mobile"
                        className="w-full text-xs font-mono font-bold text-slate-800 bg-transparent focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Age (Yrs)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <input
                        type="number"
                        min="1"
                        max="125"
                        value={customerAge}
                        onChange={e => setCustomerAge(e.target.value)}
                        placeholder="Age"
                        className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Location / Area
                    </label>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <input
                        type="text"
                        value={customerLocation}
                        onChange={e => setCustomerLocation(e.target.value)}
                        placeholder="Area / Town"
                        className="w-full text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Schedule H1 Statutory Compliance Box */}
              {hasScheduleH1 && (
                <div className="sm:col-span-12 p-3.5 bg-rose-50/95 border-2 border-rose-400 rounded-2xl space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-extrabold text-xs text-rose-950 uppercase tracking-wide">
                        Mandatory Schedule H1 Prescription Details (Rule 65(9))
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900 border border-rose-300">
                      Prescription Mandatory
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-800">
                    Cart contains Schedule H1 drug: <strong className="font-extrabold">{scheduleH1CartItems.map(i => i.medicine.name).join(', ')}</strong>. Under Indian statutory law, doctor registration details are required for the Schedule H1 Register.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="text-[10px] font-extrabold text-rose-900 uppercase tracking-wider block mb-1">
                        Doctor Name *
                      </label>
                      <input
                        type="text"
                        value={doctorCustomName}
                        onChange={e => setDoctorCustomName(e.target.value)}
                        placeholder="Dr. Full Name"
                        className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-rose-900 uppercase tracking-wider block mb-1">
                        Doctor Reg. No. (Medical Council) *
                      </label>
                      <input
                        type="text"
                        value={doctorCustomRegNo}
                        onChange={e => setDoctorCustomRegNo(e.target.value)}
                        placeholder="e.g. TNMC-88219"
                        className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-rose-900 uppercase tracking-wider block mb-1">
                        Hospital / Clinic &amp; Rx No.
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={doctorCustomClinic}
                          onChange={e => setDoctorCustomClinic(e.target.value)}
                          placeholder="Clinic Name"
                          className="w-2/3 px-2 py-1.5 bg-white border border-rose-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                        />
                        <input
                          type="text"
                          value={rxNumber}
                          onChange={e => setRxNumber(e.target.value)}
                          placeholder="Rx#"
                          className="w-1/3 px-1.5 py-1.5 bg-white border border-rose-300 rounded-xl text-xs font-mono text-slate-900 text-center focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bill Date (Date/Month/Year Model) and Total Discount Summary Row */}
              <div className="sm:col-span-12 pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Bill Date:
                  </span>
                  <DateMonthYearPicker
                    value={internalInvoiceDate}
                    onChange={setInternalInvoiceDate}
                    size="sm"
                    id="checkout-bill-date-picker"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    Total Disc: {totalDiscount > 0 ? `-₹${totalDiscount.toFixed(2)}` : '₹0.00'}
                  </span>
                  {onEditDiscount && (
                    <button
                      type="button"
                      onClick={onEditDiscount}
                      className="text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      id="checkout-edit-discount-btn"
                    >
                      Edit Discount
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Grand Total Summary Banner */}
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl shadow-inner">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Amount Payable
                </p>
                <p className="text-3xl font-black tracking-tight text-white">
                  ₹{(grandTotal ?? 0).toFixed(2)}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] text-slate-400">
                    Includes {cart.length} items & ₹{(totalTax ?? 0).toFixed(2)} GST
                  </p>
                  {totalDiscount > 0 && (
                    <span className="text-[11px] font-bold text-emerald-400">
                      • Saved ₹{totalDiscount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-lg font-mono">
                  {customerName || 'Walk-in'}
                </span>
                {selectedDoctor && (
                  <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[140px]">
                    Rx: {selectedDoctor.name}
                  </p>
                )}
              </div>
            </div>

            {/* Payment Method Tabs: Full Cash, Part Cash/UPI, UPI, Card, Credit */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
              <button
                onClick={() => setPaymentMethod('Cash')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'Cash'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                id="pay-method-cash"
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Full Cash</span>
              </button>

              <button
                onClick={() => setPaymentMethod('Split')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'Split'
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                id="pay-method-split"
              >
                <Split className="w-4 h-4 text-teal-600" />
                <span>Part Cash/UPI</span>
              </button>

              <button
                onClick={() => setPaymentMethod('UPI')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'UPI'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                id="pay-method-upi"
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>UPI QR</span>
              </button>

              <button
                onClick={() => setPaymentMethod('Card')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'Card'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                id="pay-method-card"
              >
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Card</span>
              </button>

              <button
                onClick={() => setPaymentMethod('Credit')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                  paymentMethod === 'Credit'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 bg-amber-50/70 border border-amber-200'
                }`}
                id="pay-method-credit"
                title="Patient Credit / Khata (Due / Balance)"
              >
                <FileText className="w-4 h-4 text-amber-300" />
                <span>Credit / Khata</span>
              </button>
            </div>

            {/* ========================================================================= */}
            {/* PAYMENT METHOD 1: FULL CASH PAYMENT                                       */}
            {/* ========================================================================= */}
            {paymentMethod === 'Cash' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Cash Received from Customer</label>
                    <span className="text-xs font-mono text-slate-500">Bill: ₹{(grandTotal ?? 0).toFixed(2)}</span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="1"
                      value={cashTendered}
                      onChange={e => setCashTendered(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      placeholder="Enter cash tendered"
                      id="cash-tendered-input"
                    />
                  </div>

                  {/* Quick currency denomination chips */}
                  <div className="flex gap-2 flex-wrap items-center">
                    <span className="text-[11px] text-slate-400 font-medium">Exact / Note:</span>
                    <button
                      type="button"
                      onClick={() => setCashTendered(grandTotal.toFixed(2))}
                      className="px-2.5 py-1 text-xs font-mono font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                    >
                      Exact ₹{grandTotal.toFixed(2)}
                    </button>
                    {[
                      Math.ceil(grandTotal),
                      Math.ceil(grandTotal / 50) * 50,
                      Math.ceil(grandTotal / 100) * 100,
                      500,
                      1000
                    ]
                      .filter((val, idx, arr) => val > grandTotal && arr.indexOf(val) === idx)
                      .slice(0, 3)
                      .map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCashTendered(val.toString())}
                          className="px-2.5 py-1 text-xs font-mono font-semibold bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
                        >
                          ₹{val}
                        </button>
                      ))}
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">Change to Return</span>
                    <span className="text-lg font-black font-mono text-emerald-700">
                      ₹{(changeDue ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Save & Confirm + Instant Bill Print Buttons for Cash */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPendingSaveConfirmMethod('Cash')}
                    disabled={cashAmount < grandTotal || isProcessing}
                    className="py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                    id="save-and-confirm-cash-btn"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Save & Confirm Sale (₹{(grandTotal ?? 0).toFixed(2)})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCompletePayment('Cash', true)}
                    disabled={cashAmount < grandTotal || isProcessing}
                    className="py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                    id="confirm-full-cash-payment-btn"
                  >
                    <Zap className="w-4 h-4 fill-current text-amber-300" />
                    <span>
                      {isProcessing ? 'Saving & Printing...' : 'Confirm Save & Instant Bill Print'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PAYMENT METHOD 2: PART CASH + UPI (SPLIT PAYMENT)                         */}
            {/* ========================================================================= */}
            {paymentMethod === 'Split' && (
              <div className="space-y-4">
                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                      <Split className="w-4 h-4 text-teal-700" />
                      <span>Split Payment: Cash Portion + Balance in UPI</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-teal-800">Total: ₹{grandTotal.toFixed(2)}</span>
                  </div>

                  {/* Cash Portion Input */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                        1. Cash Paid by Customer (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={grandTotal}
                          step="1"
                          value={splitCashAmount}
                          onChange={e => setSplitCashAmount(parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-2 bg-white border border-teal-300 rounded-xl text-sm font-bold font-mono text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                          id="split-cash-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                        2. Remaining UPI Balance (₹)
                      </label>
                      <div className="py-2 px-3 bg-teal-100/70 border border-teal-300 rounded-xl text-sm font-black font-mono text-teal-950 flex items-center justify-between">
                        <span>₹{splitUpiAmount.toFixed(2)}</span>
                        <span className="text-[10px] text-teal-700 font-semibold">To Scan via QR</span>
                      </div>
                    </div>
                  </div>

                  {/* Split presets */}
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <span className="text-[10px] text-teal-700 font-semibold">Quick Split:</span>
                    <button
                      type="button"
                      onClick={() => setSplitCashAmount(Math.round(grandTotal * 0.5))}
                      className="px-2 py-0.5 text-[11px] font-bold bg-white text-teal-800 border border-teal-200 rounded-lg hover:bg-teal-100 cursor-pointer"
                    >
                      50% Cash (₹{Math.round(grandTotal * 0.5)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitCashAmount(100)}
                      className="px-2 py-0.5 text-[11px] font-bold bg-white text-teal-800 border border-teal-200 rounded-lg hover:bg-teal-100 cursor-pointer"
                    >
                      ₹100 Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitCashAmount(200)}
                      className="px-2 py-0.5 text-[11px] font-bold bg-white text-teal-800 border border-teal-200 rounded-lg hover:bg-teal-100 cursor-pointer"
                    >
                      ₹200 Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitCashAmount(500)}
                      className="px-2 py-0.5 text-[11px] font-bold bg-white text-teal-800 border border-teal-200 rounded-lg hover:bg-teal-100 cursor-pointer"
                    >
                      ₹500 Cash
                    </button>
                  </div>

                  {/* Dynamic QR Code for Split UPI Balance */}
                  {splitUpiAmount > 0 && (
                    <div className="p-3 bg-white border border-teal-200 rounded-xl flex items-center gap-4 mt-2">
                      <div className="shrink-0 flex flex-col items-center">
                        <QRCode value={splitUpiUri} size={110} />
                        <span className="text-[9px] font-bold text-teal-700 mt-1">Scan to pay ₹{splitUpiAmount.toFixed(2)}</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <p className="font-bold text-slate-800 text-xs">
                          Dynamic QR generated for exact balance: <span className="text-teal-700 font-mono">₹{splitUpiAmount.toFixed(2)}</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Customer scans using GPay, PhonePe, or Paytm for the remaining amount.
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {upiId}
                          </code>
                          <button
                            onClick={handleCopyUpiUri}
                            className="p-1 text-slate-500 hover:text-teal-700 rounded border border-slate-200 transition-colors cursor-pointer"
                            title="Copy UPI link"
                          >
                            {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPendingSaveConfirmMethod('Split')}
                    disabled={isProcessing}
                    className="py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Save & Confirm Split Sale</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCompletePayment('Split', true)}
                    disabled={isProcessing}
                    className="py-3.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                    id="confirm-split-payment-btn"
                  >
                    <Zap className="w-4 h-4 fill-current text-amber-300" />
                    <span>Confirm Save & Instant Bill Print</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PAYMENT METHOD 3: FULL UPI GATEWAY                                        */}
            {/* ========================================================================= */}
            {paymentMethod === 'UPI' && (
              <div className="space-y-4">
                {/* QR Code Mode Switcher & Direct Upload */}
                <input
                  type="file"
                  ref={posQrInputRef}
                  onChange={handlePosQrUpload}
                  accept="image/*"
                  className="hidden"
                  id="pos-checkout-qr-upload"
                />

                <div className="flex items-center justify-between gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <div className="flex items-center gap-1 flex-1">
                    <button
                      type="button"
                      onClick={() => setUpiMode('dynamic')}
                      className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                        upiMode === 'dynamic'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Dynamic Bill QR (₹{(grandTotal ?? 0).toFixed(2)})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!storeQrImage) {
                          posQrInputRef.current?.click();
                        } else {
                          setUpiMode('standee');
                        }
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                        upiMode === 'standee'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Official Store QR
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => posQrInputRef.current?.click()}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1 shrink-0 border border-emerald-200 cursor-pointer"
                    title="Upload or change official counter QR standee"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{storeQrImage ? 'Change QR' : 'Upload Store QR'}</span>
                  </button>
                </div>

                <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                  {/* Dynamic Real QR Code or Uploaded Standee */}
                  <div className="shrink-0 flex flex-col items-center">
                    {upiMode === 'dynamic' || !storeQrImage ? (
                      <>
                        <QRCode value={fullUpiUri} size={140} />
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-800 mt-1.5">
                          <Smartphone className="w-3 h-3 text-emerald-600" />
                          <span>Exact Amount Locked: ₹{(grandTotal ?? 0).toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <img
                          src={storeQrImage}
                          alt="Official Store UPI Standee"
                          className="w-36 h-36 object-contain rounded-xl border border-emerald-300 bg-white p-1 shadow-xs"
                        />
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-800 mt-1.5">
                          <span>Official Counter Standee</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* UPI Details & Intent Buttons */}
                  <div className="flex-1 space-y-2.5 text-center sm:text-left">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Virtual Payment Address (VPA)
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 justify-center sm:justify-start">
                        <code className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-1 rounded-lg border border-slate-200">
                          {upiId}
                        </code>
                        <button
                          onClick={handleCopyUpiUri}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-md border border-slate-200 transition-colors cursor-pointer"
                          title="Copy UPI Deep Link"
                        >
                          {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 leading-relaxed">
                      Instant verification upon scan. Total amount is locked to ₹{(grandTotal ?? 0).toFixed(2)}.
                    </div>

                    <div className="pt-1 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingSaveConfirmMethod('UPI')}
                        disabled={isProcessing}
                        className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Save & Confirm Sale</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCompletePayment('UPI', true)}
                        disabled={isProcessing}
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        id="confirm-upi-payment-btn"
                      >
                        {isProcessing ? (
                          <span>Verifying UPI...</span>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 fill-current text-amber-300" />
                            <span>Confirm Save & Instant Bill Print</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PAYMENT METHOD 4: CARD PAYMENT                                            */}
            {/* ========================================================================= */}
            {paymentMethod === 'Card' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">POS Card Machine (Swipe / Tap / Chip)</p>
                      <p className="text-[11px] text-slate-500">Supports Visa, MasterCard, RuPay</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                    <span className="text-slate-600">Terminal Authorization:</span>
                    <span className="font-mono font-bold text-emerald-700">READY (ID: EDC-4902)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPendingSaveConfirmMethod('Card')}
                    disabled={isProcessing}
                    className="py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Save & Confirm Card Sale</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCompletePayment('Card', true)}
                    disabled={isProcessing}
                    className="py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-black rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                    id="confirm-card-payment-btn"
                  >
                    <Zap className="w-4 h-4 fill-current text-amber-300" />
                    <span>{isProcessing ? 'Authorizing...' : 'Confirm Save & Instant Bill Print'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PAYMENT METHOD 5: PATIENT CREDIT (UDHAAR / KHATA)                          */}
            {/* ========================================================================= */}
            {paymentMethod === 'Credit' && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>Patient Credit Ledger (Khata / Due Account)</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-950">
                      Bill Total: ₹{(grandTotal ?? 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Patient status banner */}
                  {selectedPatient ? (
                    <div className="p-3 bg-white rounded-xl border border-amber-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Patient</span>
                        <span className="font-bold text-slate-900 truncate block">{selectedPatient.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">{selectedPatient.phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Credit Limit</span>
                        <span className="font-mono font-bold text-indigo-700">₹{(selectedPatient.creditLimit || 5000).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Existing Due</span>
                        <span className="font-mono font-bold text-rose-700">₹{(selectedPatient.outstandingDue || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Available Credit</span>
                        <span className="font-mono font-bold text-emerald-700">
                          ₹{Math.max(0, (selectedPatient.creditLimit || 5000) - (selectedPatient.outstandingDue || 0)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">Assign to Customer Khata:</span>
                        <span className="text-[11px] text-slate-500">Walk-in Customer</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Customer Name *</label>
                          <input
                            type="text"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            placeholder="Patient Full Name"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Mobile Number *</label>
                          <input
                            type="tel"
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                            placeholder="10-digit mobile"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Down Payment & Due Calculation */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Amount Paid Now (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={grandTotal ?? 0}
                        step="1"
                        value={creditDownPayment}
                        onChange={e => setCreditDownPayment(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-500">e.g. Cash / UPI advance</span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block mb-1">
                        Net Balance Due (₹)
                      </label>
                      <div className="w-full px-3 py-2 bg-amber-100 border border-amber-300 rounded-xl text-xs font-mono font-black text-amber-950">
                        ₹{Math.max(0, (grandTotal ?? 0) - (parseFloat(creditDownPayment) || 0)).toFixed(2)}
                      </div>
                      <span className="text-[10px] text-amber-800 font-medium">Added to Khata balance</span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Payment Due Date
                      </label>
                      <input
                        type="date"
                        value={creditDueDateVal}
                        onChange={e => setCreditDueDateVal(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-500">Reminders scheduled</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Khata Remarks / Memo
                    </label>
                    <input
                      type="text"
                      value={creditRemarks}
                      onChange={e => setCreditRemarks(e.target.value)}
                      placeholder="e.g. Monthly diabetes medicines - promises payment on 1st of month"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPendingSaveConfirmMethod('Credit')}
                    disabled={isProcessing}
                    className="py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Save & Confirm Credit Sale</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCompletePayment('Credit', true)}
                    disabled={isProcessing}
                    className="py-3.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                    id="confirm-credit-payment-btn"
                  >
                    <Zap className="w-4 h-4 fill-current text-amber-200" />
                    <span>
                      {isProcessing
                        ? 'Recording Khata...'
                        : 'Confirm Save & Instant Bill Print'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* INLINE CONFIRM THE SAVE & INSTANT BILL PRINT STEP */}
            {pendingSaveConfirmMethod && (
              <div className="p-4 rounded-2xl bg-emerald-950 text-white border-2 border-emerald-400 shadow-xl space-y-3 animate-fadeIn">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Confirm the Save & Print Bill</span>
                    </span>
                    <h4 className="text-sm font-black text-white">
                      Confirm saving this {isWholesale ? 'Wholesale' : 'Retail'} Sale (#{invoiceId})?
                    </h4>
                    <p className="text-[11px] text-emerald-200/90 mt-0.5">
                      Customer: <strong>{customerName || 'Walk-in'}</strong> • {cart.length} item(s) • Payment: <strong>{pendingSaveConfirmMethod}</strong> • Total: <strong>₹{(grandTotal ?? 0).toFixed(2)}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingSaveConfirmMethod(null)}
                    className="text-emerald-300 hover:text-white p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Format Selection for Instant Print */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-emerald-800/60 flex-wrap">
                  <span className="text-[11px] font-bold text-emerald-200">Instant Print Format:</span>
                  <div className="flex items-center gap-1.5">
                    {(['thermal', 'a4', 'a5'] as const).map(fmt => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setCheckoutPrintFormat(fmt)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                          checkoutPrintFormat === fmt
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-emerald-900/70 text-emerald-200 hover:bg-emerald-800'
                        }`}
                      >
                        {fmt === 'thermal' ? '3" Thermal' : fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCompletePayment(pendingSaveConfirmMethod, false)}
                    className="py-2.5 px-3 bg-emerald-900 hover:bg-emerald-800 text-emerald-100 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-emerald-700 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>✓ Confirm Save Only</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCompletePayment(pendingSaveConfirmMethod, true)}
                    className="py-2.5 px-4 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>⚡ Confirm Save & Instant Bill Print</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Printer-Friendly Tax Invoice Modal */}
      {showPrintInvoiceModal && (
        <PrintInvoiceModal
          isOpen={showPrintInvoiceModal}
          onClose={() => setShowPrintInvoiceModal(false)}
          transaction={completedTransaction}
          cart={cart}
          patient={selectedPatient}
          doctor={selectedDoctor}
          paymentMethod={completedTransaction?.paymentMethod || paymentMethod}
          initialFormat={checkoutPrintFormat}
        />
      )}

      {/* Send Bill WhatsApp/SMS Phone Prompt Modal */}
      {completedTransaction && (
        <SendBillPhoneModal
          isOpen={showPhoneShareModal}
          onClose={() => setShowPhoneShareModal(false)}
          transaction={completedTransaction}
          profile={pharmacyProfile}
          initialChannel={phoneShareChannel}
          initialPhone={customerPhone}
          onSuccessStatus={msg => {
            setSentStatus(msg);
            setTimeout(() => setSentStatus(null), 4000);
          }}
        />
      )}
    </div>
  );
};
