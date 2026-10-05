import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  FileText,
  Receipt,
  Download,
  FileSpreadsheet,
  Check,
  Share2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Stethoscope,
  ShieldCheck,
  Link2,
  Maximize2,
  Minimize2,
  MessageCircle,
  Smartphone,
  Edit2,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Copy,
  Clock
} from 'lucide-react';
import { SaleTransaction, CartItem, Patient, Doctor, PharmacyProfile, PrinterSettings } from '../types';
import { PharmacyLogo } from './PharmacyLogo';
import { StorageService } from '../services/storage';
import { exportInvoiceToPDF, exportInvoiceToExcel, exportThermalReceiptToPDF, exportThermalSlipToText } from '../utils/exportUtils';
import { formatQuantityWithUnit, getPackDetails, calculateLinePricing } from '../utils/packUtils';
import { formatDateDMY, formatExpiryDMY } from '../utils/dateUtils';
import { EditPharmacistModal } from './EditPharmacistModal';
import { SendBillPhoneModal } from './SendBillPhoneModal';
import { ConnectPrinterModal } from './ConnectPrinterModal';
import { EditGstinModal } from './EditGstinModal';
import { EditQrCodeModal } from './EditQrCodeModal';
import { printDirectBill, resolveBillDateTimeStrings } from '../utils/printDirectUtils';
import { generateQrSvgDataUrl } from './QRCode';
import {
  shareBillViaWhatsApp,
  shareBillViaSms,
  printInvoiceSafely,
  isValidPhoneNumber,
  copyToClipboardSafely,
  cleanPhoneNumber
} from '../utils/billShareUtils';

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: SaleTransaction | null;
  // If invoked directly before saving or from checkout
  cart?: CartItem[];
  patient?: Patient | null;
  doctor?: Doctor | null;
  invoiceId?: string;
  paymentMethod?: string;
  initialFormat?: 'a4' | 'a5' | 'thermal' | 'thermal58';
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  isOpen,
  onClose,
  transaction,
  cart,
  patient,
  doctor,
  invoiceId,
  paymentMethod = 'Cash',
  initialFormat
}) => {
  const [printFormat, setPrintFormat] = useState<'a4' | 'a5' | 'thermal' | 'thermal58'>(() => {
    return initialFormat || (localStorage.getItem('cityrx_preferred_print_format') as any) || 'thermal';
  });
  const [printDualCopy, setPrintDualCopy] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cityrx_print_dual_copy');
      if (saved !== null) return saved === 'true';
    } catch {}
    return Boolean(StorageService.getPrinterSettings()?.printDualCopy);
  });
  const [previewCopyType, setPreviewCopyType] = useState<'customer' | 'pharmacy'>('customer');
  const [isCopied, setIsCopied] = useState(false);
  const [isShortLinkCopied, setIsShortLinkCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showEditPharmacistModal, setShowEditPharmacistModal] = useState(false);
  const [showConnectPrinterModal, setShowConnectPrinterModal] = useState(false);
  const [showEditGstinModal, setShowEditGstinModal] = useState(false);
  const [showEditQrCodeModal, setShowEditQrCodeModal] = useState(false);
  const [showPhoneShareModal, setShowPhoneShareModal] = useState(false);
  const [phoneShareChannel, setPhoneShareChannel] = useState<'WhatsApp' | 'SMS'>('WhatsApp');
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [profile, setProfile] = useState<PharmacyProfile>(() => StorageService.getPharmacyProfile());
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(() => StorageService.getPrinterSettings());
  const [showBillTimeSettingBar, setShowBillTimeSettingBar] = useState<boolean>(false);

  const updateBillTimeSettings = (patch: Partial<PrinterSettings>) => {
    const current = StorageService.getPrinterSettings();
    const updated: PrinterSettings = {
      ...current,
      ...printerSettings,
      ...patch
    };
    setPrinterSettings(updated);
    StorageService.savePrinterSettings(updated);
  };

  useEffect(() => {
    const handleProfileUpdated = (e: any) => {
      setProfile(e.detail || StorageService.getPharmacyProfile());
    };
    window.addEventListener('pharmacy:profile-updated', handleProfileUpdated);
    return () => {
      window.removeEventListener('pharmacy:profile-updated', handleProfileUpdated);
    };
  }, []);

  useEffect(() => {
    if (initialFormat) {
      setPrintFormat(initialFormat);
    }
  }, [initialFormat]);

  const handleSelectFormat = (fmt: 'a4' | 'a5' | 'thermal' | 'thermal58') => {
    setPrintFormat(fmt);
    try {
      localStorage.setItem('cityrx_preferred_print_format', fmt);
    } catch {}
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
    setFeedbackToast({
      type: 'info',
      text: updatedVal
        ? 'Print Dual Copy ON: Clicking Print will automatically trigger 2 distinct print commands (1. Customer Copy + 2. Pharmacy Copy).'
        : 'Print Dual Copy OFF: Single copy printing active.'
    });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  useEffect(() => {
    if (isOpen) {
      setProfile(StorageService.getPharmacyProfile());
      setPrinterSettings(StorageService.getPrinterSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Normalize transaction data
  const billId = transaction?.id || invoiceId || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const billDate = transaction?.date ? new Date(transaction.date) : new Date();
  const billDtInfo = resolveBillDateTimeStrings(billDate, printerSettings);
  const customerName = transaction?.patientName || patient?.name || 'Walk-in Customer';
  const customerPhone = transaction?.patientPhone || patient?.phone || '-';
  const customerAge = transaction?.patientAge || patient?.age;
  const customerAddress = transaction?.patientAddress || patient?.address;
  const prescriberName = transaction?.doctorName || doctor?.name || 'Self / OTC Recommendation';
  const method = transaction?.paymentMethod || paymentMethod;

  // Wholesale B2B fields
  const isWholesaleSale = transaction?.saleType === 'wholesale' || Boolean(transaction?.buyerBusinessName || transaction?.buyerGstin);
  const buyerBusinessName = transaction?.buyerBusinessName || transaction?.wholesaleBuyerName || transaction?.patientName || customerName;
  const buyerGstin = transaction?.buyerGstin || transaction?.wholesaleBuyerGstin;
  const buyerDrugLicense = transaction?.buyerDrugLicense || transaction?.wholesaleBuyerDrugLicense;
  const buyerAddress = transaction?.buyerAddress || transaction?.wholesaleBuyerAddress || transaction?.patientAddress || customerAddress;
  const transportMode = transaction?.transportMode || 'Road';
  const vehicleNumber = transaction?.vehicleNumber;
  const ewayBillNo = transaction?.ewayBillNo;
  const creditDays = transaction?.creditDays;
  const paymentDueDate = transaction?.paymentDueDate;

  const rawItems = transaction?.items || (cart ? cart.map(c => {
    const packInfo = getPackDetails(c.medicine);
    const pricing = calculateLinePricing({
      unitType: c.unitType,
      quantity: c.quantity,
      looseQuantity: c.looseQuantity,
      packSize: c.packSize || packInfo.packSize,
      customMrp: c.customMrp,
      sellingPrice: c.selectedBatch.sellingPrice,
      discountPercent: c.discountPercent
    });
    return {
      medicineId: c.medicine.id,
      medicineName: c.medicine.name,
      genericName: c.medicine.genericName,
      batchNumber: c.selectedBatch.batchNumber,
      expiryDate: c.selectedBatch.expiryDate,
      quantity: pricing.stockDeduction,
      unitPrice: pricing.unitPrice,
      discountPercent: c.discountPercent,
      taxRate: c.medicine.taxRate,
      total: pricing.netAmount,
      hsnCode: c.medicine.hsnCode || '300490',
      pack: c.medicine.pack || packInfo.packDisplay,
      location: c.medicine.rackLocation || c.selectedBatch.location || 'Rack A-01',
      unitType: c.unitType || 'pack',
      packSize: packInfo.packSize,
      looseQuantity: c.unitType === 'loose' ? (c.looseQuantity || 1) : undefined,
      unitName: packInfo.unitName,
      packName: packInfo.packName
    };
  }) : []);

  const totalItemsCount = rawItems.length;
  const totalUnitsCount = rawItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const subtotal = transaction?.subtotal ?? rawItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalDiscount = transaction?.totalDiscount ?? rawItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity * item.discountPercent / 100), 0);
  const totalTax = transaction?.totalTax ?? (subtotal - totalDiscount) * 0.12;
  const grandTotal = transaction?.grandTotal ?? (subtotal - totalDiscount);
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;

  const normalizedTransaction: SaleTransaction = transaction || {
    id: billId,
    date: billDate.toISOString(),
    patientName: customerName,
    patientPhone: customerPhone !== '-' ? customerPhone : undefined,
    doctorName: prescriberName,
    items: rawItems.map(item => ({
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      genericName: item.genericName,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent,
      taxRate: item.taxRate,
      total: item.total
    })),
    subtotal,
    totalTax,
    totalDiscount,
    grandTotal,
    paymentMethod: method,
    paymentStatus: 'Paid',
    cashierName: profile.pharmacistName || 'Anusya Begum'
  };

  // Generate crisp, offline-ready UPI & Bill Verification QR Code synchronously
  const upiIdForQr = profile.upiVpa || profile.upiId || '8438678498@upi';
  const payeeNameForQr = profile.name || 'City Medical';
  const amountValForQr = (grandTotal || 0).toFixed(2);
  const upiStringForQr = isWholesaleSale
    ? `upi://pay?pa=${encodeURIComponent(upiIdForQr)}&pn=${encodeURIComponent(payeeNameForQr)}&am=${amountValForQr}&cu=INR&tn=${encodeURIComponent(`B2B-${billId}`)}`
    : `upi://pay?pa=${encodeURIComponent(upiIdForQr)}&pn=${encodeURIComponent(payeeNameForQr)}&am=${amountValForQr}&cu=INR&tn=${encodeURIComponent(`Inv-${billId}`)}`;
  const dynamicQrDataUrl = generateQrSvgDataUrl(upiStringForQr, 1, 'M');
  const qrDataUrl = profile.upiQrCodeUrl || dynamicQrDataUrl;

  const activeCopyBadgeText = printDualCopy
    ? previewCopyType === 'pharmacy'
      ? 'PHARMACY COPY (OFFICE RECORD)'
      : 'CUSTOMER COPY (ORIGINAL)'
    : null;

  const handlePrint = () => {
    const printerSettings = StorageService.getPrinterSettings();
    const formatLabel = printFormat === 'thermal' ? '3" (80mm) Thermal Receipt' : printFormat === 'thermal58' ? '2" (58mm) Thermal Receipt' : printFormat === 'a5' ? 'A5 Clinic Bill' : 'A4 Tax Invoice';

    printDirectBill(normalizedTransaction, profile, printFormat, printerSettings, {
      dualCopy: printDualCopy,
      onSecondCopyTriggered: () => {
        setFeedbackToast({
          type: 'success',
          text: `Dual Copy Complete: Dispatched 2nd print command (Pharmacy Copy) to ${formatLabel}.`
        });
        setTimeout(() => setFeedbackToast(null), 4500);
      }
    });

    if (printDualCopy) {
      setFeedbackToast({
        type: 'success',
        text: `Dual Copy Print: Triggering 2 distinct print commands — (1) Customer Copy & (2) Pharmacy Copy to ${formatLabel}.`
      });
    } else {
      setFeedbackToast({
        type: 'success',
        text: `Printing directly to ${formatLabel} (No PDF download).`
      });
    }
    setTimeout(() => setFeedbackToast(null), 4500);
  };

  const handlePrintSpecificCopy = (copyType: 'customer' | 'pharmacy') => {
    const printerSettings = StorageService.getPrinterSettings();
    const label = copyType === 'pharmacy' ? 'Pharmacy Copy (Office Record)' : 'Customer Copy (Original)';
    printDirectBill(normalizedTransaction, profile, printFormat, printerSettings, {
      copyType
    });
    setFeedbackToast({
      type: 'success',
      text: `Dispatched ${label} to printer.`
    });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleDownloadPDF = async () => {
    if (printFormat === 'thermal' || printFormat === 'thermal58') {
      const is58mm = printFormat === 'thermal58';
      await exportThermalReceiptToPDF(normalizedTransaction, profile, is58mm ? '58mm' : '80mm');
      setFeedbackToast({
        type: 'success',
        text: `${is58mm ? '2" (58mm)' : '3" (80mm)'} Thermal Receipt PDF downloaded successfully (#${billId})`
      });
      setTimeout(() => setFeedbackToast(null), 3000);
      return;
    }

    const pdfFormat = printFormat === 'a5' ? 'a5' : 'a4';
    await exportInvoiceToPDF(normalizedTransaction, profile, pdfFormat);
    setFeedbackToast({
      type: 'success',
      text: `Tax Invoice PDF (${pdfFormat.toUpperCase()}) downloaded successfully (#${billId})`
    });
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleDownloadThermalSlipText = () => {
    const is58mm = printFormat === 'thermal58';
    exportThermalSlipToText(normalizedTransaction, profile, is58mm ? '58mm' : '80mm');
    setFeedbackToast({
      type: 'success',
      text: `${is58mm ? '2" (58mm)' : '3" (80mm)'} Thermal Slip Text (.txt) downloaded (#${billId})`
    });
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleDownloadExcel = () => {
    exportInvoiceToExcel(normalizedTransaction, profile);
    setFeedbackToast({
      type: 'success',
      text: `Excel bill spreadsheet downloaded (#${billId})`
    });
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleCopyText = async () => {
    const text = `*${profile.name} - INVOICE #${billId}*\nDate: ${billDate.toLocaleDateString()}\nCustomer: ${customerName}\nTotal Amount Paid: Rs.${grandTotal.toFixed(2)}\nThank you for choosing City Rx!`;
    const success = await copyToClipboardSafely(text);
    if (success) {
      setIsCopied(true);
      setFeedbackToast({
        type: 'success',
        text: 'Invoice summary copied to clipboard!'
      });
      setTimeout(() => {
        setIsCopied(false);
        setFeedbackToast(null);
      }, 3000);
    }
  };

  const handleSendWhatsAppInvoice = async () => {
    const rawPhone = customerPhone !== '-' ? customerPhone : (patient?.phone || '');
    if (!isValidPhoneNumber(rawPhone)) {
      setPhoneShareChannel('WhatsApp');
      setShowPhoneShareModal(true);
      return;
    }

    const result = await shareBillViaWhatsApp(rawPhone, normalizedTransaction, profile);
    setFeedbackToast({
      type: 'success',
      text: result.statusText
    });
    setTimeout(() => setFeedbackToast(null), 4500);
  };

  const handleSendSMSInvoice = async () => {
    const rawPhone = customerPhone !== '-' ? customerPhone : (patient?.phone || '');
    if (!isValidPhoneNumber(rawPhone)) {
      setPhoneShareChannel('SMS');
      setShowPhoneShareModal(true);
      return;
    }

    const result = await shareBillViaSms(rawPhone, normalizedTransaction, profile);
    setFeedbackToast({
      type: 'success',
      text: result.statusText
    });
    setTimeout(() => setFeedbackToast(null), 4500);
  };

  return (
    <div
      className={`fixed inset-0 z-[70] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center print:p-0 print:bg-white print:static print:inset-auto ${
        isFullScreen ? 'p-0' : 'p-2 sm:p-4 overflow-y-auto'
      }`}
    >
      <div
        className={`bg-white border border-slate-200 flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none transition-all duration-200 ${
          isFullScreen
            ? 'w-full h-full max-w-none rounded-none shadow-none'
            : 'rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh]'
        }`}
      >
        {/* Header - Screen only */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Tax Invoice & Receipt</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                  {billId}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Official GST Retail Drug Dispensing Bill
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle: 3" Thermal, 2" Thermal, A4, A5 */}
            <div className="flex items-center bg-slate-200 p-1 rounded-xl text-xs font-bold flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => handleSelectFormat('thermal')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  printFormat === 'thermal'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Continuous 3-inch 80mm POS Thermal Receipt (Standard)"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>3" Thermal</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectFormat('thermal58')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  printFormat === 'thermal58'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Continuous 2-inch 58mm POS Mini Thermal Receipt"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>2" Thermal</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectFormat('a4')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  printFormat === 'a4'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Standard A4 Full Sheet Bill (210 x 297mm)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectFormat('a5')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  printFormat === 'a5'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Clinic Size A5 Half Sheet Bill (148 x 210mm)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A5</span>
              </button>
            </div>

            {/* Print Dual Copy Toggle (Customer Copy + Pharmacy Copy) */}
            <button
              type="button"
              onClick={() => handleToggleDualCopy()}
              id="pos-print-dual-copy-toggle"
              role="switch"
              aria-checked={printDualCopy}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                printDualCopy
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
              title="Toggle Print Dual Copy: Automatically triggers two distinct print commands (1 for Customer, 1 for Pharmacy)"
            >
              <Copy className={`w-3.5 h-3.5 ${printDualCopy ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Print Dual Copy</span>
              <span
                className={`w-7 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                  printDualCopy ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-white shadow-2xs block" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowBillTimeSettingBar(prev => !prev)}
              id="pos-bill-print-time-setting-btn"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                showBillTimeSettingBar
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Configure Bill Print Time Setting (Show/Hide Time, 12h/24h Format, Live Print Time vs Custom Time, Spooler Speed)"
            >
              <Clock className={`w-3.5 h-3.5 ${showBillTimeSettingBar ? 'text-white' : 'text-teal-600'}`} />
              <span>Bill Print Time Setting</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConnectPrinterModal(true)}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Connect Thermal POS Printer & Configure Paper Width"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              <span>Printer Setup</span>
            </button>

            <button
              onClick={handlePrint}
              id="modal-print-now-btn"
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title={
                printDualCopy
                  ? 'Trigger 2 distinct print commands: Customer Copy + Pharmacy Copy'
                  : printFormat === 'thermal'
                  ? 'Print 3-inch 80mm Thermal Receipt (Ctrl+P)'
                  : 'Print Tax Invoice (Ctrl+P)'
              }
            >
              <Printer className="w-4 h-4" />
              <span>
                {printDualCopy
                  ? `Print Dual Copy (2x)`
                  : printFormat === 'thermal'
                  ? 'Print 3" Thermal'
                  : printFormat === 'thermal58'
                  ? 'Print 2" Thermal'
                  : 'Print Invoice'}
              </span>
            </button>

            <button
              onClick={handleSendWhatsAppInvoice}
              id="modal-header-whatsapp-btn"
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Send itemized bill to customer via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleSendSMSInvoice}
              id="modal-header-sms-btn"
              className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Send bill summary to customer via SMS"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>SMS</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              id="modal-download-pdf-btn"
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title={printFormat === 'thermal' ? 'Download continuous 3" (80mm) Thermal Receipt as PDF' : 'Download Tax Invoice as PDF (.pdf)'}
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
              <span>{printFormat === 'thermal' ? '3" Thermal PDF' : printFormat === 'thermal58' ? '2" Thermal PDF' : 'PDF'}</span>
            </button>

            {(printFormat === 'thermal' || printFormat === 'thermal58') && (
              <button
                onClick={handleDownloadThermalSlipText}
                id="modal-download-txt-btn"
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Download thermal receipt text slip (.txt) for direct printer spooling"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Text Slip</span>
              </button>
            )}

            <button
              onClick={handleDownloadExcel}
              id="modal-download-excel-btn"
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Download Tax Invoice as Excel Spreadsheet (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>

            <button
              onClick={async () => {
                const sl = StorageService.createShortLinkForInvoice(billId, customerName, grandTotal, customerPhone);
                await copyToClipboardSafely(sl.shortUrl);
                setIsShortLinkCopied(true);
                setTimeout(() => setIsShortLinkCopied(false), 2000);
              }}
              id="modal-copy-short-link-btn"
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Copy branded short link for patient WhatsApp (cityrx.link/inv-...)"
            >
              <Link2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isShortLinkCopied ? 'Link Copied!' : 'Short Link'}</span>
            </button>

            {/* Fullscreen Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsFullScreen(prev => !prev)}
              id="modal-fullscreen-toggle-btn"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isFullScreen ? 'Exit Full Screen' : 'View Full Screen'}
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden sm:inline">Exit Full Screen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden sm:inline">Full Screen</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status / Feedback Banner */}
        {feedbackToast && (
          <div
            className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between print:hidden transition-all shadow-2xs ${
              feedbackToast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : feedbackToast.type === 'error'
                ? 'bg-rose-600 text-white'
                : 'bg-teal-700 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackToast.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackToast(null)}
              className="p-1 hover:bg-white/20 rounded-md cursor-pointer transition-colors text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Bill Print Time Setting Control Bar - Screen only */}
        {showBillTimeSettingBar && (
          <div className="px-6 py-3 bg-teal-50/90 border-b border-teal-200 space-y-2.5 text-xs print:hidden animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-teal-950">
                <span className="p-1.5 rounded-lg bg-teal-600 text-white">
                  <Clock className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="font-black uppercase tracking-wider text-[11px] block">
                    Bill Print Time Setting
                  </span>
                  <span className="text-[11px] text-teal-800 font-mono">
                    Active Bill Timestamp: <strong>{billDtInfo.fullDateTimeStr}</strong> ({billDtInfo.sourceLabel})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-1.5 cursor-pointer select-none font-bold text-teal-950 bg-white px-2.5 py-1 rounded-lg border border-teal-300">
                  <input
                    type="checkbox"
                    checked={printerSettings.showPrintTime !== false}
                    onChange={e => updateBillTimeSettings({ showPrintTime: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Show Time on Bill</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer select-none font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-300">
                  <input
                    type="checkbox"
                    checked={Boolean(printerSettings.showSeconds)}
                    onChange={e => updateBillTimeSettings({ showSeconds: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Show Seconds</span>
                </label>

                <div className="flex items-center bg-white border border-teal-300 rounded-lg p-0.5 font-bold text-[11px]">
                  <button
                    type="button"
                    onClick={() => updateBillTimeSettings({ timeFormat: '12h' })}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      (printerSettings.timeFormat || '12h') === '12h'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    12h (AM/PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateBillTimeSettings({ timeFormat: '24h' })}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      printerSettings.timeFormat === '24h'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    24-Hour
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 border-t border-teal-200/70 items-end">
              <div>
                <label className="block text-[10px] font-bold uppercase text-teal-900 mb-0.5">
                  Bill Timestamp Mode
                </label>
                <select
                  value={printerSettings.billTimeSource || 'invoice_time'}
                  onChange={e =>
                    updateBillTimeSettings({
                      billTimeSource: e.target.value as 'invoice_time' | 'current_print_time' | 'custom_time',
                      customBillDate:
                        printerSettings.customBillDate || new Date().toISOString().split('T')[0],
                      customBillTime:
                        printerSettings.customBillTime || new Date().toTimeString().slice(0, 5)
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-xl font-bold text-slate-900 text-xs focus:outline-hidden"
                >
                  <option value="invoice_time">Sale Invoice Time</option>
                  <option value="current_print_time">Live Print Clock Time</option>
                  <option value="custom_time">Custom Bill Date &amp; Time</option>
                </select>
              </div>

              {printerSettings.billTimeSource === 'custom_time' ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-teal-900 mb-0.5">
                      Custom Bill Date
                    </label>
                    <input
                      type="date"
                      value={printerSettings.customBillDate || new Date().toISOString().split('T')[0]}
                      onChange={e => updateBillTimeSettings({ customBillDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-xl font-mono font-bold text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-teal-900 mb-0.5">
                      Custom Bill Time
                    </label>
                    <input
                      type="time"
                      value={printerSettings.customBillTime || new Date().toTimeString().slice(0, 5)}
                      onChange={e => updateBillTimeSettings({ customBillTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-xl font-mono font-bold text-slate-900 text-xs"
                    />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateBillTimeSettings({
                        billTimeSource: 'current_print_time'
                      })
                    }
                    className="px-3 py-1.5 bg-white hover:bg-teal-100 text-teal-900 border border-teal-300 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Use Current Clock Time Now
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateBillTimeSettings({
                        billTimeSource: 'custom_time',
                        customBillDate: new Date().toISOString().split('T')[0],
                        customBillTime: new Date().toTimeString().slice(0, 5)
                      })
                    }
                    className="px-3 py-1.5 bg-white hover:bg-teal-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Set Custom Date &amp; Time
                  </button>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase text-teal-900 mb-0.5">
                  Print Spooler Delay
                </label>
                <select
                  value={printerSettings.printDelayMs ?? 60}
                  onChange={e => updateBillTimeSettings({ printDelayMs: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-xl font-bold text-slate-900 text-xs focus:outline-hidden"
                >
                  <option value={40}>Instant (40ms)</option>
                  <option value={60}>Fast Default (60ms)</option>
                  <option value={150}>Standard (150ms)</option>
                  <option value={300}>Safe Buffer (300ms)</option>
                  <option value={600}>Slow Thermal (600ms)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Dual Copy Mode Bar - Screen only */}
        {printDualCopy && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
            <div className="flex items-center gap-2 text-emerald-950">
              <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider">
                Dual Copy Active (2x)
              </span>
              <span className="font-semibold">
                Automatically dispatches <strong>1. Customer Copy</strong> &amp; <strong>2. Pharmacy Copy</strong> as two separate print commands.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white border border-emerald-300 rounded-lg p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewCopyType('customer')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    previewCopyType === 'customer'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Preview: Customer Copy
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewCopyType('pharmacy')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    previewCopyType === 'pharmacy'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Preview: Pharmacy Copy
                </button>
              </div>

              <button
                type="button"
                onClick={() => handlePrintSpecificCopy('customer')}
                className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg font-bold text-[11px] cursor-pointer"
                title="Print only the Customer Copy"
              >
                Print Customer Only
              </button>
              <button
                type="button"
                onClick={() => handlePrintSpecificCopy('pharmacy')}
                className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg font-bold text-[11px] cursor-pointer"
                title="Print only the Pharmacy Copy"
              >
                Print Pharmacy Only
              </button>
            </div>
          </div>
        )}

        {/* Invoice Printable Document Body */}
        <div id="printable-invoice" data-format={printFormat} className="overflow-y-auto p-4 sm:p-6 lg:p-8 print:p-2 bg-slate-100 print:bg-white flex justify-center">
          {printFormat === 'a4' ? (
            /* ========================================================================= */
            /* STANDARD A4 PHARMACY TAX INVOICE                                          */
            /* ========================================================================= */
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-3xl text-slate-800 print:shadow-none print:border-none print:p-0 print:max-w-none">
              {/* Header with City Rx Logo and Pharmacy Info */}
              <div className="flex items-start justify-between border-b-2 border-teal-600 pb-4">
                <div className="flex items-start gap-4">
                  <PharmacyLogo size="lg" />
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                      {profile.name}
                    </h1>
                    <p className="text-xs font-semibold text-emerald-800">
                      {profile.tagline || 'Trusted Community Healthcare & Retail Pharmacy'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {profile.addressLine1}, {profile.taluk}, {profile.district}, {profile.state} - {profile.pincode}
                    </p>
                    <p className="text-xs text-slate-500">
                      Phone: <span className="font-semibold text-slate-700">{profile.mobile}</span> | Email: {profile.email}
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className={`inline-block px-3 py-1 font-extrabold text-xs rounded-lg border uppercase ${
                    isWholesaleSale
                      ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                      : 'bg-teal-50 text-teal-800 border-teal-200'
                  }`}>
                    {isWholesaleSale ? 'Tax Invoice (Wholesale B2B)' : 'Tax Invoice / Cash Memo'}
                  </span>
                  {activeCopyBadgeText && (
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider">
                        {activeCopyBadgeText}
                      </span>
                    </div>
                  )}
                  <p className="text-xs font-mono font-bold text-slate-900 pt-1">
                    Invoice: {billId}
                  </p>
                  <p className="text-xs text-slate-500">
                    Date: {billDtInfo.dateStr}
                  </p>
                  {billDtInfo.showTime && billDtInfo.timeStr && (
                    <p className="text-xs text-slate-500">
                      Time: {billDtInfo.timeStr}
                    </p>
                  )}
                </div>
              </div>

              {/* Regulatory Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 px-3 bg-slate-50 rounded-xl my-3 text-[11px] font-mono border border-slate-200">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 block text-[10px]">GSTIN Number</span>
                    <button
                      type="button"
                      onClick={() => setShowEditGstinModal(true)}
                      className="print:hidden text-[10px] text-teal-600 hover:text-teal-800 font-bold underline cursor-pointer"
                      title="Edit GST Number"
                    >
                      Edit
                    </button>
                  </div>
                  <span className="font-bold text-slate-800">{profile.gstin}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Wholesale DL (20B/21B)</span>
                  <span className="font-bold text-indigo-900">{profile.wholesaleLicenseNo || 'TN-MDU-2024-W20B/21B-0084'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Retail DL (20/21)</span>
                  <span className="font-bold text-slate-800">{profile.retailLicenseNo || profile.drugLicenseNo || 'TN-MDU-2024-20/21-0042'}</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 block text-[10px]">Reg. Pharmacist</span>
                    <button
                      type="button"
                      onClick={() => setShowEditPharmacistModal(true)}
                      className="print:hidden text-emerald-600 hover:text-emerald-800 p-0.5 rounded cursor-pointer transition-colors"
                      title="Edit Pharmacist Name & Reg No"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <span className="font-bold text-emerald-800">{profile.pharmacistName || 'Anusya Begum, D.Pharm'}</span>
                </div>
              </div>

              {/* Patient / Wholesale Buyer & Logistics Details */}
              {isWholesaleSale ? (
                <div className="grid grid-cols-2 gap-4 py-2.5 border-b border-slate-200 text-xs bg-indigo-50/40 px-3 rounded-xl mb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-indigo-900 tracking-wider">Billed To (Chemist / Hospital Buyer)</p>
                    <p className="font-black text-slate-900 text-sm mt-0.5">{buyerBusinessName}</p>
                    <p className="text-slate-600 font-mono text-[11px] mt-0.5">GSTIN: <span className="font-bold text-indigo-800">{buyerGstin || 'Unregistered / In-Process'}</span></p>
                    <p className="text-slate-600 font-mono text-[11px]">DL (20B/21B): <span className="font-bold text-slate-800">{buyerDrugLicense || '20B/21B'}</span></p>
                    {buyerAddress && <p className="text-slate-600 text-[11px] mt-0.5">Address: {buyerAddress}</p>}
                    {customerPhone !== '-' && <p className="text-slate-600 text-[11px]">Phone: {customerPhone}</p>}
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-bold uppercase text-indigo-900 tracking-wider">Transport & Credit Terms</p>
                    <p className="text-slate-700 text-[11px]">Transport: <span className="font-bold text-slate-900">{vehicleNumber ? `${transportMode} • ${vehicleNumber}` : 'Local Direct Delivery'}</span></p>
                    <p className="text-slate-700 text-[11px]">E-Way Bill: <span className="font-mono font-bold text-slate-900">{ewayBillNo || 'Not Required (< ₹50k)'}</span></p>
                    <p className="text-slate-700 text-[11px]">Payment Terms: <span className="font-bold text-emerald-800">{creditDays ? `${creditDays} Days Credit` : 'Immediate Settlement'}</span></p>
                    {paymentDueDate && <p className="text-slate-600 text-[11px]">Due Date: <span className="font-mono font-semibold">{paymentDueDate}</span></p>}
                    <p className="text-slate-700 text-[11px]">Payment Mode: <span className="font-bold text-indigo-900">{method}</span></p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-200 text-xs">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Patient / Customer</p>
                    <p className="font-bold text-slate-900 text-sm">
                      {customerName}
                      {customerAge ? <span className="text-slate-600 font-normal text-xs"> ({customerAge} yrs)</span> : ''}
                    </p>
                    <p className="text-slate-500">Phone: {customerPhone}</p>
                    {customerAddress && <p className="text-slate-500">Location: {customerAddress}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Prescribed Doctor</p>
                    <p className="font-bold text-slate-900 text-sm">{prescriberName}</p>
                    <p className="text-slate-500">Payment: <span className="font-semibold text-teal-800">{method} (PAID)</span></p>
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-slate-600 uppercase text-[10px] tracking-wider font-extrabold bg-slate-50">
                      <th className="py-2 px-2 text-center w-8">#</th>
                      <th className="py-2 px-2">Description / Molecule</th>
                      <th className="py-2 px-2">Rack</th>
                      <th className="py-2 px-2">Batch</th>
                      <th className="py-2 px-2">Exp</th>
                      <th className="py-2 px-2">Pack</th>
                      <th className="py-2 px-2 text-right">Qty</th>
                      <th className="py-2 px-2 text-right">{isWholesaleSale ? 'PTR (₹)' : 'MRP (₹)'}</th>
                      <th className="py-2 px-2 text-right">Disc%</th>
                      <th className="py-2 px-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rawItems.map((item: any, idx: number) => {
                      const lineAmount = item.total ?? ((item.unitPrice * item.quantity) * (1 - (item.discountPercent || 0) / 100));
                      const isLoose = item.unitType === 'loose';
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-2 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2 px-2">
                            <span className="font-bold text-slate-900">{item.medicineName}</span>
                            {isLoose && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                LOOSE
                              </span>
                            )}
                            {item.genericName && (
                              <span className="block text-[10px] text-slate-500 italic">
                                {item.genericName}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 font-mono text-[11px] text-teal-700 font-semibold">
                            {item.location || 'Rack A-01'}
                          </td>
                          <td className="py-2 px-2 font-mono text-[11px] text-slate-700">{item.batchNumber}</td>
                          <td className="py-2 px-2 font-mono text-[11px] text-slate-600">
                            {formatExpiryDMY(item.expiryDate)}
                          </td>
                          <td className="py-2 px-2 text-slate-600 text-[11px]">{item.pack || (isLoose ? 'Loose Unit' : '10 Tabs')}</td>
                          <td className="py-2 px-2 text-right font-bold text-slate-900 font-mono">
                            {formatQuantityWithUnit(item)}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-slate-700">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="py-2 px-2 text-right font-mono text-emerald-700">
                            {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-slate-900 font-mono">
                            ₹{lineAmount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation & GST Breakdown */}
              <div className="mt-4 pt-3 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Left: GST Summary & Declaration */}
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
                    <span className="font-bold text-slate-700 block mb-1">GST Tax Breakdown</span>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST (6.0%):</span>
                      <span className="font-mono">₹{cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST (6.0%):</span>
                      <span className="font-mono">₹{sgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-200">
                      <span>Total GST Tax Included:</span>
                      <span className="font-mono">₹{totalTax.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* QR Code Print Box for Retail & Wholesale */}
                  <div className="p-3 bg-white border border-slate-300 rounded-xl shadow-2xs flex items-center gap-3.5 print:border-slate-400 print:shadow-none">
                    <div className="w-24 h-24 p-1 bg-white border border-slate-300 rounded-lg flex items-center justify-center shrink-0">
                      {qrDataUrl || profile.upiQrCodeUrl ? (
                        <img
                          src={qrDataUrl || profile.upiQrCodeUrl}
                          alt="UPI Payment QR"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <QrCode className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5 text-teal-700" />
                          <span>{isWholesaleSale ? 'B2B E-INVOICE / UPI QR' : 'SCAN & PAY VIA UPI'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowEditQrCodeModal(true)}
                          className="print:hidden text-[10px] text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
                          title="Upload or Change UPI QR"
                        >
                          Change QR
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-tight">
                        Scan with GPay, PhonePe, Paytm, BHIM, or any UPI App
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-teal-800">
                          ₹{grandTotal.toFixed(2)}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                          INSTANT
                        </span>
                      </div>
                      <p className="text-[9px] font-mono text-slate-600 truncate">
                        UPI: <span className="font-bold">{profile.upiVpa || profile.upiId || '8438678498@upi'}</span>
                      </p>
                      {isWholesaleSale && buyerGstin && (
                        <p className="text-[9px] font-mono text-indigo-800 truncate font-semibold">
                          Buyer GSTIN: {buyerGstin}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 space-y-0.5">
                    <p>• Goods once sold will not be accepted back without original bill.</p>
                    <p>• Schedule H/H1 drugs dispensed under registered pharmacist supervision.</p>
                    <p>• Check batch number & expiry date before accepting medication.</p>
                  </div>
                </div>

                {/* Right: Totals summary */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Items / Total Units:</span>
                    <span className="font-bold text-slate-900 font-mono">{totalItemsCount} items / {totalUnitsCount} units</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Gross MRP Total:</span>
                    <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Total Discount:</span>
                      <span className="font-mono">-₹{totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Value:</span>
                    <span className="font-mono">₹{(grandTotal - totalTax).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-base sm:text-lg text-slate-900 pt-2 border-t-2 border-slate-300">
                    <span>NET AMOUNT PAYABLE:</span>
                    <span className="text-teal-700 font-mono">₹{grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-right font-medium text-slate-500">
                    Payment Mode: {method} • STATUS: PAID
                  </div>
                </div>
              </div>

              {/* Pharmacist Signature & Stamp Footer */}
              <div className="mt-8 pt-4 border-t border-dashed border-slate-300 flex items-end justify-between text-xs text-slate-500">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Computer Generated Tax Invoice</span>
                  </div>
                  <p className="text-[10px]">City Rx • Chokkalingapuram, Melur, Madurai</p>
                </div>

                <div className="text-center group">
                  <div className="w-48 border-b border-slate-400 mb-1" />
                  <div className="flex items-center justify-center gap-1">
                    <p className="font-bold text-slate-800 text-[11px]">
                      {profile.pharmacistName || 'Anusya Begum, D.Pharm'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowEditPharmacistModal(true)}
                      className="print:hidden text-slate-400 hover:text-emerald-700 p-0.5 rounded cursor-pointer transition-colors"
                      title="Edit Pharmacist Name"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400">Registered Pharmacist (Seal & Signature)</p>
                </div>
              </div>
            </div>
          ) : printFormat === 'a5' ? (
            /* ========================================================================= */
            /* CLINIC SIZE A5 PHARMACY TAX INVOICE (148mm x 210mm - HALF A4 FORMAT)      */
            /* ========================================================================= */
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 w-full max-w-xl text-slate-800 print:shadow-none print:border-none print:p-0 print:max-w-none text-xs">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-teal-600 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <PharmacyLogo size="md" />
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase leading-tight">
                      {profile.name}
                    </h1>
                    <p className="text-[10px] text-slate-600">
                      {profile.addressLine1}, {profile.taluk}, {profile.district} - {profile.pincode}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Ph: {profile.mobile} | DL: {isWholesaleSale ? (profile.wholesaleLicenseNo || profile.drugLicenseNo) : (profile.retailLicenseNo || profile.drugLicenseNo)} | GST: {profile.gstin}
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-0.5 shrink-0">
                  <span className={`inline-block px-2 py-0.5 font-extrabold text-[10px] rounded border uppercase ${
                    isWholesaleSale ? 'bg-indigo-50 text-indigo-900 border-indigo-200' : 'bg-teal-50 text-teal-800 border-teal-200'
                  }`}>
                    {isWholesaleSale ? 'A5 B2B Wholesale' : 'A5 Tax Bill'}
                  </span>
                  {activeCopyBadgeText && (
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-900 text-white font-black text-[9px] uppercase tracking-wider">
                        {activeCopyBadgeText}
                      </span>
                    </div>
                  )}
                  <p className="text-[11px] font-mono font-bold text-slate-900">
                    #{billId}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {billDtInfo.fullDateTimeStr}
                  </p>
                </div>
              </div>

              {/* Patient / Wholesale Buyer */}
              {isWholesaleSale ? (
                <div className="grid grid-cols-2 gap-2 py-2 border-b border-slate-200 text-[11px] bg-indigo-50/50 p-2 rounded-lg mb-2">
                  <div>
                    <span className="text-indigo-900 text-[9px] uppercase font-bold block">Buyer (Chemist / Hospital)</span>
                    <span className="font-bold text-slate-900">{buyerBusinessName}</span>
                    <span className="text-slate-600 block text-[10px] font-mono">GST: {buyerGstin || 'Unregistered'} • DL: {buyerDrugLicense || '20B/21B'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-indigo-900 text-[9px] uppercase font-bold block">Logistics & Terms</span>
                    <span className="font-bold text-slate-900">{vehicleNumber ? `${transportMode} • ${vehicleNumber}` : 'Local Delivery'}</span>
                    <span className="text-emerald-800 font-semibold block text-[10px]">{creditDays ? `${creditDays}d Credit` : 'Direct'} • {method}</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 py-2 border-b border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase font-bold block">Patient / Customer</span>
                    <span className="font-bold text-slate-900">{customerName}</span>
                    {customerPhone !== '-' && <span className="text-slate-500 block text-[10px]">Ph: {customerPhone}</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[9px] uppercase font-bold block">Doctor / Rx</span>
                    <span className="font-bold text-slate-900">{prescriberName}</span>
                    <span className="text-teal-700 font-semibold block text-[10px]">{method} (PAID)</span>
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="mt-2.5 overflow-x-auto">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-600 uppercase text-[9px] font-extrabold bg-slate-50">
                      <th className="py-1 px-1.5 text-center w-6">#</th>
                      <th className="py-1 px-1.5">Description</th>
                      <th className="py-1 px-1.5">Batch</th>
                      <th className="py-1 px-1.5">Exp</th>
                      <th className="py-1 px-1.5 text-right">Qty</th>
                      <th className="py-1 px-1.5 text-right">{isWholesaleSale ? 'PTR' : 'MRP'}</th>
                      <th className="py-1 px-1.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {rawItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-1.5 px-1.5 text-center text-slate-400 text-[10px]">{idx + 1}</td>
                        <td className="py-1.5 px-1.5 font-sans font-bold text-slate-800 text-[11px]">
                          {item.medicineName}
                        </td>
                        <td className="py-1.5 px-1.5 text-slate-700 text-[10px]">{item.batchNumber || '-'}</td>
                        <td className="py-1.5 px-1.5 text-slate-600 text-[10px]">
                          {item.expiryDate ? formatExpiryDMY(item.expiryDate) : '-'}
                        </td>
                        <td className="py-1.5 px-1.5 text-right font-bold text-slate-900 text-[11px]">
                          {item.quantity}
                        </td>
                        <td className="py-1.5 px-1.5 text-right text-slate-700 text-[10px]">
                          ₹{item.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-1.5 text-right font-bold text-slate-900 text-[11px]">
                          ₹{item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total & Summary Box */}
              <div className="mt-3 pt-2 border-t-2 border-slate-200 flex justify-between items-start gap-3">
                <div className="text-[9px] text-slate-500 max-w-xs space-y-1">
                  <p>• Goods once sold cannot be returned without original bill.</p>
                  <p>• Reg. Pharmacist: <span className="font-semibold text-slate-700">{profile.pharmacistName || 'Anusya Begum'}</span></p>
                  <p className="text-[8px] text-slate-400">Computer Generated Tax Invoice</p>
                </div>

                {/* Compact QR Code for A5 */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl print:border-slate-400">
                  <div className="w-16 h-16 p-0.5 bg-white border border-slate-300 rounded-lg flex items-center justify-center shrink-0">
                    {qrDataUrl || profile.upiQrCodeUrl ? (
                      <img src={qrDataUrl || profile.upiQrCodeUrl} alt="UPI QR" className="w-full h-full object-contain" />
                    ) : (
                      <QrCode className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="text-[8.5px] leading-tight min-w-0">
                    <span className="font-black text-slate-900 block uppercase tracking-wider">
                      {isWholesaleSale ? 'B2B UPI QR' : 'Scan & Pay UPI'}
                    </span>
                    <span className="font-mono text-teal-800 font-bold block text-[10px]">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                    <span className="text-slate-500 truncate block font-mono text-[7.5px] max-w-[90px]">
                      {profile.upiVpa || profile.upiId || '8438678498@upi'}
                    </span>
                  </div>
                </div>

                <div className="w-48 space-y-1 font-mono text-[11px] shrink-0">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount:</span>
                      <span>-₹{totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>GST (12% incl):</span>
                    <span>₹{totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-1 text-sm font-black text-slate-900 font-sans">
                    <span>NET PAID:</span>
                    <span className="text-teal-700">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* CONTINUOUS THERMAL RECEIPT FORMAT (80mm 3" / 58mm 2")                     */
            /* ========================================================================= */
            <div className="flex flex-col items-center w-full">
              {/* Quick 3" Thermal Receipt Actions Banner */}
              <div className="w-full max-w-[80mm] mb-3 bg-teal-50 border border-teal-200 rounded-2xl p-2.5 shadow-2xs print:hidden space-y-2">
                <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-teal-950">
                  <div className="flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-teal-700" />
                    <span>{printFormat === 'thermal58' ? '2" (58mm) Mini Thermal' : '3" (80mm) POS Thermal Roll'}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-teal-200/80 text-teal-900">
                    ESC/POS Ready
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="py-1.5 px-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-98"
                    title="Direct ESC/POS print to 3-inch thermal printer without PDF download"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-98"
                    title="Download continuous 3-inch 80mm thermal receipt as PDF file"
                  >
                    <Download className="w-3.5 h-3.5 text-rose-600" />
                    <span>3" PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadThermalSlipText}
                    className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-98"
                    title="Download thermal receipt text slip (.txt) for direct printer spooling"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>.TXT Slip</span>
                  </button>
                </div>
              </div>

              <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${printFormat === 'thermal58' ? 'w-64 max-w-[58mm] p-3 text-[10px]' : 'w-80 max-w-[80mm] p-5 text-xs'} font-mono text-slate-800 print:shadow-none print:border-none print:w-full print:p-0`}>
              <div className="text-center border-b border-dashed border-slate-400 pb-3 space-y-1">
                <p className="font-black text-base uppercase">{profile.name}</p>
                <p className="text-[10px] text-slate-600">
                  {profile.addressLine1}, {profile.taluk}
                </p>
                <p className="text-[10px] text-slate-600">
                  {profile.district} - {profile.pincode}
                </p>
                <p className="text-[10px] font-bold text-slate-800">
                  Phone: {profile.mobile}
                </p>
                <div className="flex items-center justify-center gap-1 text-[9px] text-slate-500">
                  <span>GST: {profile.gstin}</span>
                  <button
                    type="button"
                    onClick={() => setShowEditGstinModal(true)}
                    className="print:hidden text-[9px] text-teal-600 hover:text-teal-800 font-bold underline cursor-pointer"
                    title="Edit GST Number"
                  >
                    Edit
                  </button>
                  <span>| DL: {isWholesaleSale ? (profile.wholesaleLicenseNo || profile.drugLicenseNo) : (profile.retailLicenseNo || profile.drugLicenseNo)}</span>
                </div>
                <p className={`text-[10px] font-bold py-0.5 mt-1 rounded uppercase tracking-wider ${
                  isWholesaleSale ? 'bg-indigo-100 text-indigo-950' : 'bg-slate-100 text-slate-900'
                }`}>
                  {isWholesaleSale ? 'TAX INVOICE (WHOLESALE B2B)' : 'CASH / TAX RECEIPT'}
                </p>
                {activeCopyBadgeText && (
                  <p className="text-[9.5px] font-black py-0.5 px-1.5 mt-1 border border-slate-900 rounded uppercase tracking-wider text-slate-950">
                    *** {activeCopyBadgeText} ***
                  </p>
                )}
              </div>

              {isWholesaleSale ? (
                <div className="py-2 border-b border-dashed border-slate-300 space-y-0.5 text-[10px] bg-slate-50/70 p-1.5 rounded my-1">
                  <div className="flex justify-between font-bold">
                    <span>Inv: #{billId}</span>
                    <span>{billDtInfo.fullDateTimeStr}</span>
                  </div>
                  <div className="font-bold text-indigo-950">Buyer: {buyerBusinessName}</div>
                  {buyerGstin && <div>GST: {buyerGstin}</div>}
                  {buyerDrugLicense && <div>DL (20B/21B): {buyerDrugLicense}</div>}
                  {buyerAddress && <div className="truncate">Loc: {buyerAddress}</div>}
                  {customerPhone !== '-' && <div>Phone: {customerPhone}</div>}
                  <div className="flex justify-between text-[9px] pt-0.5 text-slate-600 border-t border-dashed border-slate-200">
                    <span>Tr: {vehicleNumber || 'Direct'}</span>
                    <span>Terms: {creditDays ? `${creditDays}d Credit` : 'Immediate'}</span>
                  </div>
                </div>
              ) : (
                <div className="py-2 border-b border-dashed border-slate-300 space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>Inv: #{billId}</span>
                    <span>{billDtInfo.fullDateTimeStr}</span>
                  </div>
                  <div>Customer: {customerName}{customerAge ? ` (${customerAge}y)` : ''}</div>
                  {customerPhone !== '-' && <div>Phone: {customerPhone}</div>}
                  {customerAddress && <div>Loc: {customerAddress}</div>}
                  <div>Doctor: {prescriberName}</div>
                </div>
              )}

              <div className="py-2 border-b border-dashed border-slate-300 space-y-1">
                <div className="flex justify-between font-bold text-[10px] text-slate-700 border-b pb-0.5">
                  <span className="w-1/2">Item [Batch]</span>
                  <span className="w-1/6 text-right">Qty</span>
                  <span className="w-1/3 text-right">Amt</span>
                </div>
                {rawItems.map((item: any, idx: number) => {
                  const lineAmount = item.total ?? ((item.unitPrice * item.quantity) * (1 - (item.discountPercent || 0)/100));
                  const isLoose = item.unitType === 'loose';
                  return (
                    <div key={idx} className="flex justify-between text-[10px]">
                      <span className="w-1/2 truncate">
                        {item.medicineName} {isLoose && <span className="font-bold text-amber-800">[Loose]</span>}
                        <span className="block text-[9px] text-slate-400">
                          {item.batchNumber} (Exp {formatExpiryDMY(item.expiryDate)})
                        </span>
                      </span>
                      <span className="w-1/6 text-right font-medium">
                        {formatQuantityWithUnit(item)}
                      </span>
                      <span className="w-1/3 text-right font-semibold font-mono">
                        ₹{lineAmount.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Gross Total:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-₹{totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST Included:</span>
                  <span>₹{totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-400">
                  <span>NET PAID:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
                <div className="text-[10px] text-center text-slate-500 pt-0.5">
                  Method: {method} • PAID
                </div>

                {/* Instant UPI Payment QR Code */}
                <div className="pt-2 text-center flex flex-col items-center">
                  <span className="text-[9px] font-black uppercase text-slate-900 tracking-wider mb-1">
                    {isWholesaleSale ? 'B2B UPI / E-Invoice QR' : 'Scan & Pay via UPI'}
                  </span>
                  <div className="w-24 h-24 p-1 bg-white border border-slate-300 rounded-lg flex items-center justify-center shadow-2xs print:border-black print:w-24 print:h-24">
                    <img
                      src={qrDataUrl}
                      alt="UPI QR"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mt-1 text-[9px] font-mono text-slate-700">
                    <span>UPI: {profile.upiVpa || profile.upiId || '8438678498@upi'}</span>
                    <button
                      type="button"
                      onClick={() => setShowEditQrCodeModal(true)}
                      className="print:hidden text-[9px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                      title="Upload or Change UPI QR Code"
                    >
                      Change QR
                    </button>
                  </div>
                  {isWholesaleSale && buyerGstin && (
                    <div className="text-[8px] font-mono text-slate-600 mt-0.5">
                      B2B Buyer GSTIN: {buyerGstin}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center pt-3 space-y-1 text-[9px] text-slate-500">
                <div className="flex items-center justify-center gap-1">
                  <p>Reg. Pharmacist: {profile.pharmacistName || 'Anusya Begum'}</p>
                  <button
                    type="button"
                    onClick={() => setShowEditPharmacistModal(true)}
                    className="print:hidden text-slate-400 hover:text-emerald-700 p-0.5 rounded cursor-pointer"
                    title="Edit Pharmacist Name"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                </div>
                <p>Get Well Soon! Thank you for choosing City Rx.</p>
              </div>
            </div>
            </div>
          )}
        </div>

        {/* Footer Actions - Screen only */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSendWhatsAppInvoice}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Send bill summary & digital receipt to patient on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Bill</span>
            </button>

            <button
              type="button"
              onClick={handleSendSMSInvoice}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Send bill confirmation via SMS"
            >
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>SMS Bill</span>
            </button>

            {(printFormat === 'thermal' || printFormat === 'thermal58') && (
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Download 3-inch 80mm continuous thermal receipt as PDF"
              >
                <Download className="w-4 h-4 text-rose-600" />
                <span>Download {printFormat === 'thermal58' ? '2"' : '3"'} PDF</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-700" /> : <Share2 className="w-4 h-4" />}
              <span>{isCopied ? 'Copied' : 'Share Text'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="footer-print-dual-copy-checkbox"
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer select-none hover:bg-slate-100"
              title="Automatically trigger 2 distinct print commands: Customer Copy + Pharmacy Copy"
            >
              <input
                id="footer-print-dual-copy-checkbox"
                type="checkbox"
                checked={printDualCopy}
                onChange={e => handleToggleDualCopy(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Print Dual Copy (Customer + Pharmacy)</span>
            </label>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-xs transition-colors flex items-center gap-2 shadow-sm cursor-pointer active:scale-98"
              title={
                printDualCopy
                  ? 'Trigger 2 distinct print commands: Customer Copy & Pharmacy Copy'
                  : printFormat === 'thermal'
                  ? 'Print 3-inch continuous thermal POS receipt'
                  : 'Print Tax Invoice'
              }
            >
              <Printer className="w-4 h-4" />
              <span>
                {printDualCopy
                  ? 'Print Dual Copy (2x)'
                  : printFormat === 'thermal'
                  ? 'Print 3" Thermal'
                  : printFormat === 'thermal58'
                  ? 'Print 2" Thermal'
                  : 'Print Invoice'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Registered Pharmacist Modal */}
      <EditPharmacistModal
        isOpen={showEditPharmacistModal}
        onClose={() => setShowEditPharmacistModal(false)}
        onSaved={(updatedProfile) => {
          setProfile(updatedProfile);
        }}
      />

      {/* Send Bill via WhatsApp & SMS Phone Dialog Modal */}
      <SendBillPhoneModal
        isOpen={showPhoneShareModal}
        onClose={() => setShowPhoneShareModal(false)}
        transaction={normalizedTransaction}
        profile={profile}
        initialChannel={phoneShareChannel}
        initialPhone={customerPhone !== '-' ? customerPhone : ''}
        onSuccessStatus={msg => {
          setFeedbackToast({ type: 'success', text: msg });
          setTimeout(() => setFeedbackToast(null), 4000);
        }}
      />

      {/* Connect Thermal Printer Hardware Modal */}
      <ConnectPrinterModal
        isOpen={showConnectPrinterModal}
        onClose={() => setShowConnectPrinterModal(false)}
        onPrinterConnected={newSettings => {
          setPrintFormat(newSettings.printerType);
        }}
      />

      {/* Quick Edit GST Number Modal */}
      <EditGstinModal
        isOpen={showEditGstinModal}
        onClose={() => setShowEditGstinModal(false)}
        onGstinUpdated={() => {
          setProfile(StorageService.getPharmacyProfile());
        }}
      />

      {/* QR Code Upload, Change & Edit Modal */}
      <EditQrCodeModal
        isOpen={showEditQrCodeModal}
        onClose={() => setShowEditQrCodeModal(false)}
        onQrUpdated={updated => {
          setProfile(updated);
        }}
      />
    </div>
  );
};
