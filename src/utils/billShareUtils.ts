import { SaleTransaction, PharmacyProfile } from '../types';
import { StorageService } from '../services/storage';
import { exportInvoiceToPDF } from './exportUtils';
import { formatQuantityWithUnit } from './packUtils';

/**
 * Normalizes an Indian phone number to 10 digits or 91-prefixed digits
 */
export const cleanPhoneNumber = (phone?: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
};

/**
 * Checks if a phone number has at least 10 valid digits
 */
export const isValidPhoneNumber = (phone?: string): boolean => {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10;
};

/**
 * Generates an itemized, professional tax invoice message formatted for WhatsApp
 */
export const generateWhatsAppBillMessage = (
  tx: SaleTransaction,
  profile: PharmacyProfile
): string => {
  const invoiceDate = new Date(tx.date);
  const formattedDate = !isNaN(invoiceDate.getTime())
    ? `${invoiceDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ${invoiceDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : new Date().toLocaleDateString();

  const itemsList = tx.items
    .map((item, idx) => {
      const batchStr = item.batchNumber ? ` [B:${item.batchNumber}]` : '';
      const expStr = item.expiryDate ? ` (Exp: ${item.expiryDate})` : '';
      const qtyStr = formatQuantityWithUnit(item);
      return `${idx + 1}. *${item.medicineName}*${batchStr}\n   ${qtyStr} x Rs.${item.unitPrice.toFixed(2)} = *Rs.${item.total.toFixed(2)}*${expStr}`;
    })
    .join('\n');

  let paymentDetails = `*Payment Mode:* ${tx.paymentMethod} (Status: Paid)`;
  if (tx.paymentMethod === 'Split' && tx.splitPayment) {
    paymentDetails += `\n- Cash: Rs.${tx.splitPayment.cashAmount.toFixed(2)}\n- UPI: Rs.${tx.splitPayment.upiAmount.toFixed(2)}`;
  }

  const helpline = profile.mobile || '8438678498';
  const pharmacyName = profile.name || 'CITY MEDICAL & CITY RX';

  return (
    `*TAX INVOICE & CASH RECEIPT*\n` +
    `*${pharmacyName.toUpperCase()}*\n` +
    `${profile.addressLine1}, ${profile.district} - ${profile.pincode}\n` +
    `Ph: ${profile.mobile} | DL: ${profile.drugLicenseNo} | GST: ${profile.gstin}\n` +
    `================================\n` +
    `*Invoice No:* #${tx.id}\n` +
    `*Date & Time:* ${formattedDate}\n` +
    `*Customer:* ${tx.patientName}${tx.patientAge ? ` (${tx.patientAge} yrs)` : ''}\n` +
    (tx.patientPhone ? `*Mobile:* ${tx.patientPhone}\n` : '') +
    (tx.doctorName && tx.doctorName !== 'Self' ? `*Doctor / Prescriber:* ${tx.doctorName}\n` : '') +
    `================================\n` +
    `*DISPENSED MEDICINES:*\n` +
    `${itemsList}\n` +
    `================================\n` +
    `Subtotal: Rs.${tx.subtotal.toFixed(2)}\n` +
    (tx.totalDiscount > 0 ? `Discount: -Rs.${tx.totalDiscount.toFixed(2)}\n` : '') +
    `GST Included (CGST+SGST): Rs.${tx.totalTax.toFixed(2)}\n` +
    `*GRAND TOTAL PAID: Rs.${tx.grandTotal.toFixed(2)}*\n` +
    `${paymentDetails}\n` +
    `================================\n` +
    `Thank you for trusting ${pharmacyName}!\n` +
    `For refills or home delivery, call or WhatsApp: ${helpline}.\n` +
    `Get well soon!`
  );
};

/**
 * Generates a concise carrier-friendly SMS bill message
 */
export const generateSmsBillMessage = (
  tx: SaleTransaction,
  profile: PharmacyProfile
): string => {
  const pharmacyName = profile.name || 'City Medical';
  const topItems = tx.items.map(i => `${i.medicineName} (${formatQuantityWithUnit(i)})`).slice(0, 3).join(', ');
  const moreText = tx.items.length > 3 ? ` +${tx.items.length - 3} more` : '';
  const helpline = profile.mobile || '8438678498';

  return `${pharmacyName}: Invoice #${tx.id} for ${tx.patientName || 'Customer'} paid Rs.${tx.grandTotal.toFixed(2)}. Items: ${topItems}${moreText}. Helpline: ${helpline}. Get well soon!`;
};

/**
 * Copies text to clipboard safely
 */
export const copyToClipboardSafely = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard API failed, attempting fallback', err);
  }

  // Fallback using textarea
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed', err);
    return false;
  }
};

export interface ShareResult {
  success: boolean;
  message: string;
  waUrl?: string;
  webWaUrl?: string;
  smsUri?: string;
  isCopied: boolean;
  statusText: string;
}

/**
 * Opens WhatsApp safely with automatic clipboard backup and notification logging
 */
export const shareBillViaWhatsApp = async (
  phone: string,
  tx: SaleTransaction,
  profile: PharmacyProfile
): Promise<ShareResult> => {
  const cleanPhone = cleanPhoneNumber(phone);
  const message = generateWhatsAppBillMessage(tx, profile);

  // 1. Copy to clipboard for guaranteed availability
  const isCopied = await copyToClipboardSafely(message);

  const encodedText = encodeURIComponent(message);
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
  const webWaUrl = cleanPhone
    ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://web.whatsapp.com/send?text=${encodedText}`;

  // 2. Record notification in audit log
  try {
    StorageService.addPatientNotification({
      id: `notif-wa-${Date.now().toString().slice(-6)}`,
      patientId: 'guest',
      patientName: tx.patientName || 'Customer',
      patientPhone: cleanPhone || phone,
      channel: 'WhatsApp',
      templateType: 'rx_ready',
      message,
      status: 'Sent',
      sentAt: new Date().toISOString(),
      referenceId: tx.id,
      language: 'en'
    });
  } catch (err) {
    console.warn('Failed to log notification', err);
  }

  // 3. Try to open WhatsApp via anchor click
  let opened = false;
  try {
    const anchor = document.createElement('a');
    anchor.href = waUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    opened = true;
  } catch (err) {
    console.warn('Could not launch WhatsApp URL automatically', err);
  }

  return {
    success: true,
    message,
    waUrl,
    webWaUrl,
    isCopied,
    statusText: opened
      ? 'WhatsApp opened & bill copied to clipboard!'
      : 'Bill copied to clipboard! Click to open WhatsApp.'
  };
};

/**
 * Dispatches SMS safely without navigating the window
 */
export const shareBillViaSms = async (
  phone: string,
  tx: SaleTransaction,
  profile: PharmacyProfile
): Promise<ShareResult> => {
  const rawDigits = phone.replace(/\D/g, '');
  const targetPhone = rawDigits.length === 10 ? `+91${rawDigits}` : `+${rawDigits}`;
  const message = generateSmsBillMessage(tx, profile);

  // Copy to clipboard
  const isCopied = await copyToClipboardSafely(message);

  const smsUri = `sms:${targetPhone}?body=${encodeURIComponent(message)}`;

  // Record in audit log
  try {
    StorageService.addPatientNotification({
      id: `notif-sms-${Date.now().toString().slice(-6)}`,
      patientId: 'guest',
      patientName: tx.patientName || 'Customer',
      patientPhone: targetPhone,
      channel: 'SMS',
      templateType: 'rx_ready',
      message,
      status: 'Sent',
      sentAt: new Date().toISOString(),
      referenceId: tx.id,
      language: 'en'
    });
  } catch (err) {
    console.warn('Failed to log SMS notification', err);
  }

  // Try to launch SMS composer via safe anchor click
  let launched = false;
  try {
    const anchor = document.createElement('a');
    anchor.href = smsUri;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    launched = true;
  } catch (err) {
    console.warn('Could not trigger SMS scheme automatically', err);
  }

  return {
    success: true,
    message,
    smsUri,
    isCopied,
    statusText: launched
      ? 'SMS app launched & text copied to clipboard!'
      : 'SMS text copied to clipboard!'
  };
};

import { printDirectBill } from './printDirectUtils';

/**
 * Safely prints the invoice directly to the printer without PDF file download.
 * PDF is only generated when explicitly requested by user via View/Download PDF.
 */
export const printInvoiceSafely = (
  tx?: SaleTransaction,
  profile?: PharmacyProfile,
  format: 'thermal' | 'thermal58' | 'a4' | 'a5' = 'thermal'
): { success: boolean; method: 'print'; error?: string } => {
  if (tx) {
    const prof = profile || StorageService.getPharmacyProfile();
    const settings = StorageService.getPrinterSettings();
    const ok = printDirectBill(tx, prof, format, settings);
    return { success: ok, method: 'print' };
  }
  try {
    window.print();
    return { success: true, method: 'print' };
  } catch (err) {
    return { success: false, method: 'print', error: String(err) };
  }
};

