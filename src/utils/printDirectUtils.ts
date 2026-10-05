import { SaleTransaction, PharmacyProfile, PrinterSettings } from '../types';
import { StorageService } from '../services/storage';
import { formatDateDMY } from './dateUtils';
import { formatQuantityWithUnit } from './packUtils';
import { generateQrSvgMarkup, generateQrSvgDataUrl } from '../components/QRCode';

/**
 * Renders either the uploaded custom store QR image or a synchronous, zero-latency
 * inline SVG QR code so printed bills NEVER show a blank or broken QR code.
 */
function renderBillQrBlock(
  upiUri: string,
  profile: PharmacyProfile,
  sizePx: number,
  extraStyle = ''
): string {
  const fallbackDataUrl = generateQrSvgDataUrl(upiUri, 1, 'M');
  if (profile.upiQrCodeUrl) {
    return `<img src="${profile.upiQrCodeUrl}" onerror="this.onerror=null;this.src='${fallbackDataUrl}';" alt="UPI QR" style="width:${sizePx}px;height:${sizePx}px;object-fit:contain;${extraStyle}" />`;
  }
  return generateQrSvgMarkup(upiUri, sizePx, 1, 'M', extraStyle);
}

/**
 * Resolves formatted bill date and time strings according to PrinterSettings
 * (Supports 12h AM/PM vs 24h format, show/hide time, optional seconds, and
 * invoice time vs live print time vs custom bill date/time).
 */
export function resolveBillDateTimeStrings(
  txDateInput?: string | Date | number | null,
  settings?: PrinterSettings
): {
  dateStr: string;
  timeStr: string;
  fullDateTimeStr: string;
  showTime: boolean;
  sourceLabel: string;
} {
  const s = settings || StorageService.getPrinterSettings();
  const showTime = s?.showPrintTime !== false;
  const is24h = s?.timeFormat === '24h';
  const showSeconds = Boolean(s?.showSeconds);
  const source = s?.billTimeSource || 'invoice_time';

  let baseDate: Date;
  if (source === 'current_print_time') {
    baseDate = new Date();
  } else if (txDateInput) {
    const parsed = new Date(txDateInput);
    baseDate = isNaN(parsed.getTime()) ? new Date() : parsed;
  } else {
    baseDate = new Date();
  }

  let dateStr = formatDateDMY(baseDate);
  if (source === 'custom_time' && s?.customBillDate) {
    dateStr = formatDateDMY(s.customBillDate);
  }

  let timeDateObj = baseDate;
  if (source === 'custom_time' && s?.customBillTime) {
    const [hh, mm, ss] = s.customBillTime.split(':').map(v => parseInt(v, 10));
    if (!isNaN(hh) && !isNaN(mm)) {
      const customD = new Date(baseDate);
      customD.setHours(hh, mm, !isNaN(ss) ? ss : 0, 0);
      timeDateObj = customD;
    }
  }

  const timeStr = showTime
    ? timeDateObj.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        ...(showSeconds ? { second: '2-digit' } : {}),
        hour12: !is24h
      })
    : '';

  const sourceLabel =
    source === 'current_print_time'
      ? 'Live Print Time'
      : source === 'custom_time'
      ? 'Custom Bill Time'
      : 'Sale Time';

  return {
    dateStr,
    timeStr,
    fullDateTimeStr: showTime && timeStr ? `${dateStr} ${timeStr}` : dateStr,
    showTime,
    sourceLabel
  };
}

/**
 * Cleanly prints formatted HTML directly via hidden iframe
 * without opening popups (which are blocked in iframes) and WITHOUT triggering PDF downloads!
 */
export function printHtmlDirectly(
  htmlContent: string,
  options?: { frameId?: string; delayMs?: number; onAfterPrint?: () => void }
): boolean {
  const frameId = options?.frameId || 'pharmacy-direct-print-frame';
  const triggerDelay = Math.max(20, Math.min(options?.delayMs ?? 60, 2000));
  let afterPrintCalled = false;
  const triggerAfterPrintOnce = () => {
    if (afterPrintCalled) return;
    afterPrintCalled = true;
    if (options?.onAfterPrint) {
      options.onAfterPrint();
    }
  };

  try {
    let iframe = document.getElementById(frameId) as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = frameId;
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      iframe.style.zIndex = '-9999';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc || !iframe.contentWindow) {
      window.print();
      setTimeout(triggerAfterPrintOnce, 120);
      return true;
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Trigger print spooler immediately while preserving user gesture activation
    setTimeout(() => {
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.onafterprint = () => {
            triggerAfterPrintOnce();
          };
        }
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(triggerAfterPrintOnce, 120);
      } catch (err) {
        console.warn('Iframe print failed, falling back to window.print():', err);
        window.print();
        setTimeout(triggerAfterPrintOnce, 120);
      }
    }, triggerDelay);

    return true;
  } catch (err) {
    console.warn('Direct iframe print error:', err);
    try {
      window.print();
      setTimeout(triggerAfterPrintOnce, 120);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Builds standard 3-inch (80mm) ESC/POS Thermal Receipt HTML
 */
export function generateThermalReceiptHtml(
  tx: SaleTransaction,
  profile: PharmacyProfile,
  settings?: PrinterSettings,
  copyLabel?: string
): string {
  const is58mm = settings?.paperWidth === '58mm' || settings?.printerType === 'thermal58';
  const widthMm = is58mm ? '58mm' : '80mm';
  const widthPx = is58mm ? '210px' : '290px';
  const dtInfo = resolveBillDateTimeStrings(tx.date, settings);

  const isWholesale = tx.saleType === 'wholesale' || Boolean(tx.buyerBusinessName || tx.buyerGstin);
  const upiId = profile.upiVpa || profile.upiId || '8438678498@upi';
  const qrRef = isWholesale ? `B2B-${tx.id}` : `Inv-${tx.id}`;
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(profile.name || 'City Rx')}&am=${(tx.grandTotal ?? 0).toFixed(2)}&cu=INR&tn=${encodeURIComponent(qrRef)}`;
  const qrHtml = renderBillQrBlock(upiUri, profile, is58mm ? 96 : 112, 'margin: 0 auto; display: block;');

  const itemsHtml = (tx.items || []).map((item, idx) => `
    <tr>
      <td style="padding: 2.5px 0; text-align: left; vertical-align: top; max-width: 140px; word-break: break-word;">
        <div style="font-weight: bold; font-size: ${is58mm ? '10px' : '11px'};">${idx + 1}. ${item.medicineName}</div>
        <div style="font-size: 8.5px; color: #333;">
          ${item.batchNumber ? `B:${item.batchNumber}` : ''} ${item.expiryDate ? `E:${item.expiryDate.slice(0, 7)}` : ''}
        </div>
      </td>
      <td style="padding: 2.5px 2px; text-align: center; vertical-align: top; font-weight: bold;">${formatQuantityWithUnit(item)}</td>
      <td style="padding: 2.5px 2px; text-align: right; vertical-align: top;">${(item.unitPrice ?? 0).toFixed(2)}</td>
      <td style="padding: 2.5px 0; text-align: right; vertical-align: top; font-weight: bold;">${(item.total ?? (item.quantity * item.unitPrice)).toFixed(2)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Thermal Bill - ${tx.id}</title>
  <style>
    @page {
      size: ${widthMm} auto;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Courier New', Courier, monospace, system-ui;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      width: ${widthPx};
      margin: 0 auto;
      padding: 8px 6px 18px 6px;
      font-size: ${is58mm ? '9.5px' : '10.5px'};
      line-height: 1.25;
      color: #000;
      background: #fff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .bold { font-weight: bold; }
    .title {
      font-size: ${is58mm ? '13px' : '15px'};
      font-weight: 900;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
      text-transform: uppercase;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 4px 0;
    }
    .double-divider {
      border-top: 2px solid #000;
      margin: 4px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
    }
    th {
      border-bottom: 1px dashed #000;
      padding: 2px 0;
      font-size: 9.5px;
    }
    .cut-line {
      border-top: 1px dotted #666;
      margin-top: 12px;
      padding-top: 4px;
      text-align: center;
      font-size: 9px;
      color: #444;
    }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="title">${profile.name || 'CITY RX - CITY MEDICAL'}</div>
    <div>${profile.addressLine1 || 'Main Road, Chokkalingapuram'}</div>
    <div>${profile.taluk || 'Melur'}, ${profile.district || 'Madurai'} - ${profile.pincode || '625106'}</div>
    <div>Phone: +91 ${profile.mobile || '8438678498'}</div>
    <div class="bold" style="margin-top:1px;">GSTIN: ${profile.gstin || '33AALFC1234F1Z5'}</div>
    <div>D.L. No: ${profile.drugLicenseNo || 'TN-MDU-20B-18491/21B-18492'}</div>
  </div>

  <div class="double-divider"></div>
  <div class="text-center bold">TAX INVOICE / CASH BILL</div>
  ${copyLabel ? `<div class="text-center bold" style="border: 1px solid #000; padding: 2px 4px; margin: 3px 0; font-size: 9.5px; letter-spacing: 0.5px;">*** ${copyLabel} ***</div>` : ''}
  <div class="divider"></div>

  <div class="row"><span>Inv No:</span> <span class="bold">${tx.id}</span></div>
  <div class="row"><span>Date${dtInfo.showTime ? '/Time' : ''}:</span> <span>${dtInfo.fullDateTimeStr}</span></div>
  <div class="row"><span>Customer:</span> <span class="bold">${tx.patientName || 'Walk-in Customer'}</span></div>
  ${tx.patientPhone ? `<div class="row"><span>Phone:</span> <span>${tx.patientPhone}</span></div>` : ''}
  ${tx.doctorName ? `<div class="row"><span>Doctor:</span> <span>${tx.doctorName}</span></div>` : ''}

  <div class="divider"></div>

  <table>
    <thead>
      <tr>
        <th class="text-left">Item (Batch/Exp)</th>
        <th class="text-center">Qty</th>
        <th class="text-right">Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="divider"></div>

  <div class="row"><span>Subtotal:</span> <span>Rs. ${(tx.subtotal ?? tx.grandTotal).toFixed(2)}</span></div>
  ${(tx.totalDiscount ?? 0) > 0 ? `<div class="row"><span>Discount:</span> <span>-Rs. ${(tx.totalDiscount ?? 0).toFixed(2)}</span></div>` : ''}
  <div class="row"><span>GST Included:</span> <span>Rs. ${(tx.totalTax ?? 0).toFixed(2)}</span></div>
  <div class="row bold" style="font-size: ${is58mm ? '12px' : '13.5px'}; margin-top: 3px;">
    <span>NET PAID:</span> <span>Rs. ${(tx.grandTotal ?? 0).toFixed(2)}</span>
  </div>
  <div class="row" style="font-size:9.5px; margin-top:2px;">
    <span>Method:</span> <span>${tx.paymentMethod} • PAID</span>
  </div>

  ${(settings?.printQrCode !== false) ? `
  <div class="divider"></div>
  <div class="text-center" style="margin-top:4px;">
    ${qrHtml}
    <div style="font-size:9px; font-weight:bold; margin-top:2px;">Scan &amp; Pay UPI: ${upiId}</div>
    <div style="font-size:8px; color:#333;">Amount: Rs. ${(tx.grandTotal ?? 0).toFixed(2)} (${qrRef})</div>
  </div>` : ''}

  <div class="divider"></div>
  <div class="text-center" style="font-size:8.5px;">
    <div>${settings?.footerCustomNote || 'Thank you! Get Well Soon • No Return without Cash Bill'}</div>
    <div>Pharmacist: ${profile.pharmacistName || 'Anusya Begum'} (Reg: ${profile.pharmacistRegNo || 'TN-RPH-78419'})</div>
  </div>

  <div class="cut-line">
    ${settings?.autoCut !== false ? '✂ --- [Auto Paper Cut] --- ✂' : '✂ --- [Tear Here] --- ✂'}
  </div>
</body>
</html>`;
}

/**
 * Builds standard A4 Full Sheet Pharmacy Tax Invoice HTML for direct printing
 */
export function generateA4InvoiceHtml(
  tx: SaleTransaction,
  profile: PharmacyProfile,
  copyLabel?: string,
  settings?: PrinterSettings
): string {
  const dtInfo = resolveBillDateTimeStrings(tx.date, settings);
  const isWholesale = tx.saleType === 'wholesale' || Boolean(tx.buyerBusinessName || tx.buyerGstin);
  const upiId = profile.upiVpa || profile.upiId || '8438678498@upi';
  const qrRef = isWholesale ? `B2B-${tx.id}` : `Inv-${tx.id}`;
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(profile.name || 'City Rx')}&am=${(tx.grandTotal ?? 0).toFixed(2)}&cu=INR&tn=${encodeURIComponent(qrRef)}`;
  const qrHtml = renderBillQrBlock(upiUri, profile, 84, 'border: 1px solid #cbd5e1; border-radius: 6px; padding: 2px;');

  const itemsRows = (tx.items || []).map((item, idx) => {
    const rate = item.unitPrice ?? 0;
    const qty = item.quantity ?? 1;
    const gross = rate * qty;
    const disc = (gross * (item.discountPercent || 0)) / 100;
    const taxable = gross - disc;
    const taxRate = item.taxRate || 12;
    const taxAmt = (taxable * taxRate) / 100;
    const net = item.total ?? (taxable + taxAmt);

    return `
      <tr>
        <td style="padding: 6px 8px; text-align: center; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: bold; color: #0f172a;">${item.medicineName}</div>
          ${item.genericName ? `<div style="font-size: 10px; color: #64748b;">${item.genericName}</div>` : ''}
        </td>
        <td style="padding: 6px 8px; text-align: center; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${item.batchNumber || 'BAT-01'}</td>
        <td style="padding: 6px 8px; text-align: center; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${item.expiryDate || '12/26'}</td>
        <td style="padding: 6px 8px; text-align: center; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${formatQuantityWithUnit(item)}</td>
        <td style="padding: 6px 8px; text-align: right; border-bottom: 1px solid #e2e8f0; font-family: monospace;">₹${rate.toFixed(2)}</td>
        <td style="padding: 6px 8px; text-align: center; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${item.discountPercent ? `${item.discountPercent}%` : '-'}</td>
        <td style="padding: 6px 8px; text-align: right; border-bottom: 1px solid #e2e8f0; font-family: monospace;">₹${taxable.toFixed(2)}</td>
        <td style="padding: 6px 8px; text-align: center; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${taxRate}%</td>
        <td style="padding: 6px 8px; text-align: right; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #0f172a;">₹${net.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice - ${tx.id}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #fff;
      padding: 10px;
      font-size: 11px;
      line-height: 1.35;
    }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #0d9488;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .pharmacy-title {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      border-radius: 6px;
      font-weight: bold;
      font-size: 10px;
      text-transform: uppercase;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    th {
      background: #0f172a;
      color: #fff;
      font-weight: bold;
      font-size: 10px;
      padding: 6px 8px;
      text-transform: uppercase;
    }
    .totals-area {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 2px solid #0f172a;
    }
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="pharmacy-title">${profile.name || 'CITY RX - CITY MEDICAL'}</div>
      <div style="font-size: 11px; color: #0d9488; font-weight: bold; margin-top: 2px;">
        ${profile.tagline || 'Trusted Community Healthcare & Retail Pharmacy'}
      </div>
      <div style="font-size: 10px; color: #475569; margin-top: 3px;">
        ${profile.addressLine1}, ${profile.taluk}, ${profile.district}, ${profile.state} - ${profile.pincode}<br>
        Phone: <b>${profile.mobile}</b> | Email: ${profile.email || 'support@cityrx.in'}<br>
        GSTIN: <b>${profile.gstin}</b> | DL No: <b>${profile.drugLicenseNo || 'TN-625103-20B/21B'}</b>
      </div>
    </div>
    <div style="text-align: right;">
      <div class="badge">${isWholesale ? 'WHOLESALE TAX INVOICE (B2B - A4)' : 'RETAIL TAX INVOICE (A4)'}</div>
      ${copyLabel ? `<div style="margin-top: 4px;"><span style="display: inline-block; padding: 2px 8px; background: #0f172a; color: #fff; border-radius: 4px; font-weight: 800; font-size: 9.5px; letter-spacing: 0.5px;">${copyLabel}</span></div>` : ''}
      <div style="margin-top: 6px; font-family: monospace; font-weight: bold; font-size: 12px;">
        Invoice: #${tx.id}
      </div>
      <div style="font-size: 10px; color: #64748b;">
        Date: ${dtInfo.dateStr}${dtInfo.showTime && dtInfo.timeStr ? `<br>Time: ${dtInfo.timeStr}` : ''}
      </div>
    </div>
  </div>

  <div class="info-grid">
    <div>
      <div style="font-weight: bold; font-size: 10px; color: #64748b; text-transform: uppercase;">
        ${isWholesale ? 'Billed To (Wholesale Buyer / Chemist)' : 'Customer Details'}
      </div>
      <div style="font-weight: bold; font-size: 13px; color: #0f172a; margin-top: 2px;">
        ${isWholesale ? (tx.buyerBusinessName || tx.patientName || 'Wholesale Buyer') : (tx.patientName || 'Walk-in Customer')}
      </div>
      <div style="font-size: 10.5px; color: #475569;">
        ${isWholesale ? `
          GSTIN: <b>${tx.buyerGstin || 'Unregistered'}</b> | DL: <b>${tx.buyerDrugLicense || '20B/21B'}</b><br>
          ${tx.patientPhone ? `Phone: <b>${tx.patientPhone}</b>` : ''}
          ${tx.vehicleNumber ? ` | Vehicle: <b>${tx.vehicleNumber}</b> (${tx.transportMode || 'Road'})` : ''}
          ${tx.ewayBillNo ? `<br>E-Way Bill: <b>${tx.ewayBillNo}</b>` : ''}
        ` : `
          ${tx.patientPhone ? `Phone: <b>${tx.patientPhone}</b>` : 'Walk-in Cash Sale'}<br>
          ${tx.patientAge ? `Age: ${tx.patientAge} Years` : ''}
        `}
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: bold; font-size: 10px; color: #64748b; text-transform: uppercase;">
        ${isWholesale ? 'B2B Payment & Dispatch Info' : 'Doctor & Dispensing Info'}
      </div>
      <div style="font-weight: bold; font-size: 12px; color: #0f172a; margin-top: 2px;">
        ${isWholesale ? (tx.doctorName ? `Ref: ${tx.doctorName}` : `Dispatch: ${tx.transportMode || 'Standard'}`) : (tx.doctorName || 'Self / Registered Medical Practitioner')}
      </div>
      <div style="font-size: 10.5px; color: #475569;">
        Payment: <b>${tx.paymentMethod}</b> (${tx.paymentStatus || 'Paid'})${isWholesale && tx.creditDays ? ` • <b>${tx.creditDays}d Credit</b>` : ''}<br>
        Pharmacist: <b>${profile.pharmacistName || 'Anusya Begum'}</b> (Reg: ${profile.pharmacistRegNo || 'TN-RPH-78419'})
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align: center; width: 30px;">#</th>
        <th>Medicine / Molecule</th>
        <th style="text-align: center; width: 75px;">Batch</th>
        <th style="text-align: center; width: 65px;">Exp</th>
        <th style="text-align: center; width: 50px;">Qty</th>
        <th style="text-align: right; width: 65px;">Rate (₹)</th>
        <th style="text-align: center; width: 50px;">Disc</th>
        <th style="text-align: right; width: 70px;">Taxable</th>
        <th style="text-align: center; width: 45px;">GST</th>
        <th style="text-align: right; width: 80px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="totals-area">
    <div style="display: flex; gap: 12px; align-items: center;">
      ${qrHtml}
      <div style="font-size: 10px;">
        <div style="font-weight: bold; color: #0f172a;">Instant UPI Payment (₹${(tx.grandTotal ?? 0).toFixed(2)})</div>
        <div style="color: #64748b; font-family: monospace;">${upiId}</div>
        <div style="margin-top: 4px; color: #166534; font-weight: bold;">Verified GST Invoice • ${qrRef}</div>
      </div>
    </div>

    <div style="width: 260px; font-size: 11px;">
      <div style="display: flex; justify-content: space-between; padding: 2px 0;">
        <span>Gross Subtotal:</span>
        <span style="font-family: monospace;">₹${(tx.subtotal ?? tx.grandTotal).toFixed(2)}</span>
      </div>
      ${(tx.totalDiscount ?? 0) > 0 ? `
      <div style="display: flex; justify-content: space-between; padding: 2px 0; color: #166534;">
        <span>Total Discount:</span>
        <span style="font-family: monospace;">-₹${(tx.totalDiscount ?? 0).toFixed(2)}</span>
      </div>` : ''}
      <div style="display: flex; justify-content: space-between; padding: 2px 0; color: #475569;">
        <span>CGST + SGST Included:</span>
        <span style="font-family: monospace;">₹${(tx.totalTax ?? 0).toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 5px 0; border-top: 2px solid #0f172a; font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 4px;">
        <span>NET PAYABLE:</span>
        <span style="font-family: monospace;">₹${(tx.grandTotal ?? 0).toFixed(2)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <div>
      <b>Terms:</b> Medicines once sold cannot be returned without original cash memo.<br>
      Thank you for trusting <b>${profile.name}</b>. Get well soon!
    </div>
    <div style="text-align: right;">
      Authorized Signatory / Pharmacist:<br>
      <span style="font-weight: bold; color: #0f172a;">${profile.pharmacistName || 'Anusya Begum, D.Pharm'}</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Builds standard A5 Clinic Bill / Prescription Invoice HTML for direct printing
 */
export function generateA5InvoiceHtml(
  tx: SaleTransaction,
  profile: PharmacyProfile,
  copyLabel?: string,
  settings?: PrinterSettings
): string {
  const dtInfo = resolveBillDateTimeStrings(tx.date, settings);
  const isWholesale = tx.saleType === 'wholesale' || Boolean(tx.buyerBusinessName || tx.buyerGstin);
  const upiId = profile.upiVpa || profile.upiId || '8438678498@upi';
  const qrRef = isWholesale ? `B2B-${tx.id}` : `Inv-${tx.id}`;
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(profile.name || 'City Rx')}&am=${(tx.grandTotal ?? 0).toFixed(2)}&cu=INR&tn=${encodeURIComponent(qrRef)}`;
  const qrHtml = renderBillQrBlock(upiUri, profile, 56, 'border: 1px solid #cbd5e1; border-radius: 4px; padding: 1px;');

  const itemsRows = (tx.items || []).map((item, idx) => `
    <tr>
      <td style="padding: 4px; text-align: center; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${idx + 1}</td>
      <td style="padding: 4px; border-bottom: 1px solid #e2e8f0;">
        <span style="font-weight: bold;">${item.medicineName}</span>
        ${item.genericName ? `<span style="font-size: 8.5px; color: #64748b; display: block;">${item.genericName}</span>` : ''}
        <span style="font-size: 9px; color: #64748b; font-family: monospace;"> (${item.batchNumber || '-'} Exp: ${item.expiryDate || '-'})</span>
      </td>
      <td style="padding: 4px; text-align: center; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${item.quantity}</td>
      <td style="padding: 4px; text-align: right; border-bottom: 1px solid #e2e8f0; font-family: monospace;">₹${(item.unitPrice ?? 0).toFixed(2)}</td>
      <td style="padding: 4px; text-align: right; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold;">₹${(item.total ?? (item.quantity * item.unitPrice)).toFixed(2)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>A5 Bill - ${tx.id}</title>
  <style>
    @page {
      size: A5 landscape;
      margin: 6mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #fff;
      padding: 8px;
      font-size: 10px;
      line-height: 1.3;
    }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #0d9488;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    th {
      background: #0f172a;
      color: #fff;
      font-weight: bold;
      font-size: 9px;
      padding: 4px;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div style="font-size: 16px; font-weight: 900; color: #0f172a;">${profile.name || 'CITY RX - CITY MEDICAL'}</div>
      <div style="font-size: 9px; color: #475569;">
        ${profile.addressLine1}, ${profile.taluk} | Ph: ${profile.mobile} | GSTIN: ${profile.gstin}
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: bold; font-size: 11px;">${isWholesale ? 'WHOLESALE B2B MEMO' : 'A5 CLINIC CASH MEMO'} • #${tx.id}</div>
      ${copyLabel ? `<div style="margin: 2px 0;"><span style="display: inline-block; padding: 1.5px 6px; background: #0f172a; color: #fff; border-radius: 4px; font-weight: 800; font-size: 8.5px; letter-spacing: 0.5px;">${copyLabel}</span></div>` : ''}
      <div style="font-size: 9px; color: #64748b;">${dtInfo.fullDateTimeStr}</div>
    </div>
  </div>

  <div style="display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; margin-bottom: 8px; font-size: 9.5px;">
    ${isWholesale ? `
      <div>Buyer: <b>${tx.buyerBusinessName || tx.patientName || 'Wholesale Buyer'}</b> | GSTIN: <b>${tx.buyerGstin || 'Unregistered'}</b></div>
      <div>DL: <b>${tx.buyerDrugLicense || '20B/21B'}</b> | Pay: <b>${tx.paymentMethod}</b></div>
    ` : `
      <div>Patient: <b>${tx.patientName || 'Walk-in'}</b> ${tx.patientPhone ? `(${tx.patientPhone})` : ''}</div>
      <div>Doctor: <b>${tx.doctorName || 'General'}</b> | Pay: <b>${tx.paymentMethod}</b></div>
    `}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 25px; text-align: center;">#</th>
        <th style="text-align: left;">Product (Batch / Exp)</th>
        <th style="width: 45px; text-align: center;">Qty</th>
        <th style="width: 60px; text-align: right;">Rate</th>
        <th style="width: 75px; text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 2px solid #0f172a;">
    <div style="display: flex; align-items: center; gap: 8px;">
      ${qrHtml}
      <div style="font-size: 8.5px; color: #475569;">
        <div style="font-weight: bold; color: #0f172a;">Scan &amp; Pay UPI (${qrRef})</div>
        <div>UPI: <b>${upiId}</b></div>
        <div>Pharmacist: <b>${profile.pharmacistName || 'Anusya Begum'}</b></div>
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 10px; color: #475569;">GST Incl: ₹${(tx.totalTax ?? 0).toFixed(2)}</div>
      <div style="font-size: 13px; font-weight: 900; color: #0f172a;">NET PAID: ₹${(tx.grandTotal ?? 0).toFixed(2)}</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Helper to generate formatted HTML for a given copy label
 */
function buildFormattedInvoiceHtml(
  tx: SaleTransaction,
  p: PharmacyProfile,
  format: 'thermal' | 'thermal58' | 'a4' | 'a5',
  s: PrinterSettings,
  copyLabel?: string
): string {
  if (format === 'a4') {
    return generateA4InvoiceHtml(tx, p, copyLabel, s);
  }
  if (format === 'a5') {
    return generateA5InvoiceHtml(tx, p, copyLabel, s);
  }
  return generateThermalReceiptHtml(tx, p, s, copyLabel);
}

/**
 * Universal Direct Printer Spooler
 * Formats directly for 3" Thermal, 2" Thermal, A4, or A5 and spools to printer
 * WITHOUT triggering any PDF file download!
 * Supports "Print Dual Copy" mode — automatically triggering two distinct print commands:
 * (1) CUSTOMER COPY (ORIGINAL) and (2) PHARMACY COPY (OFFICE RECORD).
 */
export function printDirectBill(
  tx: SaleTransaction,
  profile?: PharmacyProfile,
  format: 'thermal' | 'thermal58' | 'a4' | 'a5' = 'thermal',
  settings?: PrinterSettings,
  options?: {
    dualCopy?: boolean;
    copyType?: 'customer' | 'pharmacy';
    onSecondCopyTriggered?: () => void;
  }
): boolean {
  const p = profile || StorageService.getPharmacyProfile();
  const s = settings || StorageService.getPrinterSettings();

  if (options?.copyType) {
    const label =
      options.copyType === 'pharmacy'
        ? 'PHARMACY COPY (OFFICE RECORD)'
        : 'CUSTOMER COPY (ORIGINAL)';
    const singleHtml = buildFormattedInvoiceHtml(tx, p, format, s, label);
    return printHtmlDirectly(singleHtml, {
      frameId: `pharmacy-direct-print-frame-${options.copyType}`
    });
  }

  let savedDualCopyPref = false;
  try {
    savedDualCopyPref = localStorage.getItem('cityrx_print_dual_copy') === 'true';
  } catch {}

  const shouldPrintDualCopy =
    options?.dualCopy !== undefined
      ? options.dualCopy
      : Boolean(s?.printDualCopy || savedDualCopyPref);

  if (shouldPrintDualCopy) {
    const customerHtml = buildFormattedInvoiceHtml(
      tx,
      p,
      format,
      s,
      'CUSTOMER COPY (ORIGINAL)'
    );
    const pharmacyHtml = buildFormattedInvoiceHtml(
      tx,
      p,
      format,
      s,
      'PHARMACY COPY (OFFICE RECORD)'
    );

    const delayMs = s?.printDelayMs ?? 60;
    const intervalMs = Math.max(150, s?.dualCopyIntervalMs ?? 400);

    // 1st Distinct Print Command: CUSTOMER COPY
    return printHtmlDirectly(customerHtml, {
      frameId: 'pharmacy-direct-print-frame-customer',
      delayMs,
      onAfterPrint: () => {
        // 2nd Distinct Print Command: PHARMACY COPY
        setTimeout(() => {
          printHtmlDirectly(pharmacyHtml, {
            frameId: 'pharmacy-direct-print-frame-pharmacy',
            delayMs
          });
          if (options?.onSecondCopyTriggered) {
            options.onSecondCopyTriggered();
          }
        }, intervalMs);
      }
    });
  }

  const html = buildFormattedInvoiceHtml(tx, p, format, s);
  return printHtmlDirectly(html, { delayMs: s?.printDelayMs ?? 60 });
}

/**
 * Directly prints a standalone UPI QR Payment Slip / Bill for counter scanning
 */
export function printQrPaymentSlip(params: {
  amount: number;
  invoiceId: string;
  customerName?: string;
  customerPhone?: string;
  upiId?: string;
  profile?: PharmacyProfile;
}): boolean {
  const p = params.profile || StorageService.getPharmacyProfile();
  const s = StorageService.getPrinterSettings();
  const is58mm = s?.paperWidth === '58mm' || s?.printerType === 'thermal58';
  const widthMm = is58mm ? '58mm' : '80mm';
  const widthPx = is58mm ? '210px' : '290px';
  const upi = params.upiId || p.upiVpa || p.upiId || '8438678498@upi';
  const safeAmt = Math.max(0, Number(params.amount) || 0).toFixed(2);
  const upiUri = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(p.name || 'City Rx')}&am=${safeAmt}&cu=INR&tn=${encodeURIComponent(`Inv-${params.invoiceId}`)}`;
  const qrHtml = renderBillQrBlock(upiUri, p, is58mm ? 140 : 170, 'margin: 6px auto; display: block;');
  const now = new Date();

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>QR Payment Bill - ${params.invoiceId}</title>
  <style>
    @page { size: ${widthMm} auto; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace, system-ui; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { width: ${widthPx}; margin: 0 auto; padding: 8px 6px 18px 6px; font-size: ${is58mm ? '10px' : '11px'}; line-height: 1.3; color: #000; background: #fff; text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 5px 0; }
    .double-divider { border-top: 2px solid #000; margin: 5px 0; }
    .row { display: flex; justify-content: space-between; margin-bottom: 2px; text-align: left; }
  </style>
</head>
<body>
  <div style="font-size: ${is58mm ? '13px' : '15px'}; font-weight: 900; text-transform: uppercase;">${p.name || 'CITY RX - CITY MEDICAL'}</div>
  <div>${p.addressLine1 || 'Main Road, Chokkalingapuram'}, ${p.taluk || 'Melur'}</div>
  <div>Phone: +91 ${p.mobile || '8438678498'}</div>
  <div class="bold">GSTIN: ${p.gstin || '33AALFC1234F1Z5'}</div>
  <div class="double-divider"></div>
  <div class="bold" style="font-size: 12px;">UPI QR PAYMENT BILL SLIP</div>
  <div class="divider"></div>
  <div class="row"><span>Bill Ref:</span> <span class="bold">${params.invoiceId}</span></div>
  <div class="row"><span>Date:</span> <span>${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>
  <div class="row"><span>Customer:</span> <span class="bold">${params.customerName || 'Walk-in Customer'}</span></div>
  ${params.customerPhone ? `<div class="row"><span>Mobile:</span> <span>${params.customerPhone}</span></div>` : ''}
  <div class="divider"></div>
  <div style="font-size: ${is58mm ? '14px' : '16px'}; font-weight: 900; margin: 4px 0;">AMOUNT PAYABLE: Rs. ${safeAmt}</div>
  ${qrHtml}
  <div class="bold" style="font-size: 10px; margin-top: 4px;">Scan with GPay / PhonePe / Paytm / BHIM</div>
  <div style="font-size: 9.5px; margin-top: 2px;">UPI ID: <b>${upi}</b></div>
  <div class="divider"></div>
  <div style="font-size: 8.5px;">Pharmacist: ${p.pharmacistName || 'Anusya Begum'}</div>
  <div style="border-top: 1px dotted #666; margin-top: 10px; padding-top: 4px; font-size: 8.5px;">✂ --- [Tear Here] --- ✂</div>
</body>
</html>`;

  return printHtmlDirectly(html);
}
