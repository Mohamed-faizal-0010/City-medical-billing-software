import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { SaleTransaction, PharmacyProfile, PurchaseInvoice } from '../types';
import { StorageService } from '../services/storage';
import { formatQuantityWithUnit } from './packUtils';

export interface PDFReportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  summaryRows?: { label: string; value: string | number }[];
  summaryCards?: { label: string; value: string | number }[];
  orientation?: 'portrait' | 'landscape';
}

export interface PrintReportOptions {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  summaryCards?: { label: string; value: string | number }[];
}

/**
 * Downloads report as an Excel spreadsheet (.xlsx)
 */
export const exportReportToExcel = (
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number)[][],
  metadata?: {
    title: string;
    subtitle?: string;
    summary?: { label: string; value: string | number }[];
  }
) => {
  const profile = StorageService.getPharmacyProfile();
  const wb = XLSX.utils.book_new();

  const sheetData: (string | number)[][] = [];

  // Header rows
  sheetData.push([profile.name || 'City Rx • City Medical']);
  sheetData.push([`${profile.addressLine1}, ${profile.taluk}, ${profile.district}, ${profile.state} - ${profile.pincode}`]);
  sheetData.push([`Phone: ${profile.mobile} | GSTIN: ${profile.gstin} | DL No: ${profile.drugLicenseNo || 'TN-625103-20B'}`]);
  sheetData.push([]);

  if (metadata?.title) {
    sheetData.push([metadata.title.toUpperCase()]);
  }
  if (metadata?.subtitle) {
    sheetData.push([metadata.subtitle]);
  }
  sheetData.push([`Generated On: ${new Date().toLocaleString()}`]);
  sheetData.push([]);

  // Table Headers
  sheetData.push(headers);

  // Table Data
  rows.forEach(row => sheetData.push(row));

  // Summary rows if any
  if (metadata?.summary && metadata.summary.length > 0) {
    sheetData.push([]);
    sheetData.push(['--- SUMMARY TOTALS ---']);
    metadata.summary.forEach(s => {
      sheetData.push([s.label, s.value]);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column auto widths
  const colWidths = headers.map((header, colIndex) => {
    let maxLen = header.length;
    rows.forEach(r => {
      const val = r[colIndex];
      if (val !== undefined && val !== null) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    });
    return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, finalFilename);
};

/**
 * Downloads report as an RFC-4180 compliant CSV document (.csv)
 */
export const exportReportToCSV = (
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  metadata?: {
    title?: string;
    subtitle?: string;
    summary?: { label: string; value: string | number }[];
  }
) => {
  const profile = StorageService.getPharmacyProfile();
  const escapeCsvCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const lines: string[] = [];

  // Metadata headers
  lines.push(escapeCsvCell(profile.name || 'City Rx • City Medical'));
  lines.push(escapeCsvCell(`${profile.addressLine1}, ${profile.taluk}, ${profile.district}, ${profile.state} - ${profile.pincode}`));
  lines.push(escapeCsvCell(`Phone: ${profile.mobile} | GSTIN: ${profile.gstin} | DL No: ${profile.drugLicenseNo || 'TN-625103-20B'}`));
  lines.push('');

  if (metadata?.title) {
    lines.push(escapeCsvCell(metadata.title.toUpperCase()));
  }
  if (metadata?.subtitle) {
    lines.push(escapeCsvCell(metadata.subtitle));
  }
  lines.push(escapeCsvCell(`Generated On: ${new Date().toLocaleString()}`));
  lines.push('');

  // Table Headers
  lines.push(headers.map(escapeCsvCell).join(','));

  // Data Rows
  rows.forEach(r => {
    lines.push(r.map(escapeCsvCell).join(','));
  });

  // Summary Totals if present
  if (metadata?.summary && metadata.summary.length > 0) {
    lines.push('');
    lines.push(escapeCsvCell('--- SUMMARY TOTALS ---'));
    metadata.summary.forEach(s => {
      lines.push(`${escapeCsvCell(s.label)},${escapeCsvCell(s.value)}`);
    });
  }

  const csvContent = '\uFEFF' + lines.join('\r\n'); // Add UTF-8 BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Downloads report as a formatted PDF document
 */
export const exportReportToPDF = (options: PDFReportOptions) => {
  const profile = StorageService.getPharmacyProfile();
  const orientation = options.orientation || (options.headers.length > 6 ? 'landscape' : 'portrait');
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top header banner background
  doc.setFillColor(13, 148, 136); // Teal-600
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Pharmacy Brand
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.name || 'City Rx • City Medical', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${profile.addressLine1}, ${profile.taluk}, ${profile.district}, ${profile.state} - ${profile.pincode} | Ph: ${profile.mobile}`,
    14,
    17
  );
  doc.text(
    `GSTIN: ${profile.gstin} | DL No: ${profile.drugLicenseNo || 'TN-625103-20B/21B'} | Reg. Pharmacist: ${profile.pharmacistName || 'Anusya Begum'}`,
    14,
    22
  );

  // Report Title Box
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title, 14, 38);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  const sub = options.subtitle
    ? `${options.subtitle} • Generated: ${new Date().toLocaleString()}`
    : `Generated On: ${new Date().toLocaleString()}`;
  doc.text(sub, 14, 43);

  // Generate Table using autoTable
  autoTable(doc, {
    head: [options.headers],
    body: options.rows,
    startY: 47,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // Slate-900
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 41, 59], // Slate-800
      overflow: 'linebreak',
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate-50
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = `Page ${doc.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        str,
        pageWidth - 20,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );
      doc.text(
        `City Rx Pharmacy Management System • Authorized Report`,
        14,
        doc.internal.pageSize.getHeight() - 10
      );
    }
  });

  // If summary rows exist, draw them at the end
  const summaries = options.summaryRows || options.summaryCards;
  if (summaries && summaries.length > 0) {
    // @ts-expect-error - lastAutoTable is injected by jspdf-autotable
    const finalY = doc.lastAutoTable?.finalY || 150;
    const pageHeight = doc.internal.pageSize.getHeight();

    // Check if enough room on current page
    let summaryY = finalY + 8;
    if (summaryY + summaries.length * 6 + 15 > pageHeight) {
      doc.addPage();
      summaryY = 20;
    }

    doc.setFillColor(241, 245, 249); // Slate-100
    const boxWidth = Math.min(120, pageWidth - 28);
    const boxHeight = summaries.length * 6 + 6;
    doc.roundedRect(pageWidth - 14 - boxWidth, summaryY, boxWidth, boxHeight, 2, 2, 'F');

    doc.setFontSize(8.5);
    summaries.forEach((s, idx) => {
      const lineY = summaryY + 5 + (idx * 6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(s.label, pageWidth - 14 - boxWidth + 4, lineY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(String(s.value), pageWidth - 18, lineY, { align: 'right' });
    });
  }

  const finalFilename = options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`;
  doc.save(finalFilename);
};

/**
 * Print Report in a clean dedicated printer-friendly window
 */
export const printReportWindow = (options: PrintReportOptions) => {
  const profile = StorageService.getPharmacyProfile();

  const headersHtml = options.headers.map(h => `<th style="padding: 8px 10px; background-color: #0f172a; color: #ffffff; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">${h}</th>`).join('');

  const rowsHtml = options.rows.map((row, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    const cells = row.map(cell => `<td style="padding: 7px 10px; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${cell}</td>`).join('');
    return `<tr style="background-color: ${bg};">${cells}</tr>`;
  }).join('');

  const summaryHtml = options.summaryCards && options.summaryCards.length > 0
    ? `
      <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
        ${options.summaryCards.map(s => `
          <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px;">
            <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">${s.label}</div>
            <div style="font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 2px;">${s.value}</div>
          </div>
        `).join('')}
      </div>
    `
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${options.title} - ${profile.name}</title>
        <style>
          @page { size: auto; margin: 12mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 16px;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            border-bottom: 2px solid #0d9488;
            padding-bottom: 12px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .title { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; }
          .subtitle { font-size: 11px; color: #0d9488; font-weight: bold; margin-top: 2px; }
          .meta { font-size: 10px; color: #475569; margin-top: 4px; line-height: 1.4; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #64748b;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${profile.name}</h1>
            <div class="subtitle">${profile.tagline || 'Trusted Community Healthcare & Retail Pharmacy'}</div>
            <div class="meta">
              ${profile.addressLine1}, ${profile.taluk}, ${profile.district}, ${profile.state} - ${profile.pincode}<br>
              Phone: ${profile.mobile} | Email: ${profile.email}<br>
              GSTIN: <b>${profile.gstin}</b> | DL No: <b>${profile.drugLicenseNo || 'TN-625103-20B/21B'}</b>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 4px 10px; border-radius: 6px; color: #166534; font-size: 11px; font-weight: bold;">
              OFFICIAL REPORT
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 6px;">
              Date: <b>${new Date().toLocaleDateString()}</b><br>
              Time: <b>${new Date().toLocaleTimeString()}</b>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <h2 style="font-size: 16px; font-weight: 800; margin: 0; color: #0f172a;">${options.title}</h2>
          ${options.subtitle ? `<p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">${options.subtitle}</p>` : ''}
        </div>

        ${summaryHtml}

        <table>
          <thead>
            <tr>${headersHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>
            Generated by City Rx POS & ERP System • Pharmacist: ${profile.pharmacistName || 'Anusya Begum'}
          </div>
          <div>
            Authorized Signatory / Registered Pharmacist: _____________________
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (printWindow && !printWindow.closed) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
      return;
    }
  } catch {
    // Continue to iframe fallback
  }

  // Fallback: Invisible iframe printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
      }, 2000);
    }, 400);
  } else {
    window.print();
  }
};

/**
 * Downloads a continuous 3-inch (80mm) or 2-inch (58mm) POS Thermal Receipt as PDF
 */
export const exportThermalReceiptToPDF = async (
  transaction: SaleTransaction,
  profile?: PharmacyProfile,
  paperWidth: '80mm' | '58mm' = '80mm'
): Promise<string> => {
  const p = profile || StorageService.getPharmacyProfile();
  const is58mm = paperWidth === '58mm';
  const width = is58mm ? 58 : 80;
  const margin = is58mm ? 3 : 4;
  const contentWidth = width - (margin * 2);

  // Calculate dynamic continuous receipt height based on item count including QR code
  const itemCount = transaction.items?.length || 0;
  const estimatedHeight = Math.max(160, 115 + (itemCount * 9) + 45);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [width, estimatedHeight]
  });

  let curY = 6;

  // Header - Store Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(is58mm ? 9.5 : 11);
  doc.setTextColor(0, 0, 0);
  doc.text((p.name || 'CITY RX - CITY MEDICAL').toUpperCase(), width / 2, curY, { align: 'center' });
  curY += 4.2;

  // Store Address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(is58mm ? 6.5 : 7);
  doc.setTextColor(50, 50, 50);
  doc.text(`${p.addressLine1 || 'Main Road'}, ${p.taluk || 'Melur'}`, width / 2, curY, { align: 'center' });
  curY += 3.5;
  doc.text(`${p.district || 'Madurai'} - ${p.pincode || '625106'}`, width / 2, curY, { align: 'center' });
  curY += 3.5;
  doc.text(`Phone: +91 ${p.mobile || '8438678498'}`, width / 2, curY, { align: 'center' });
  curY += 3.5;

  // GSTIN & DL
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(is58mm ? 6 : 6.5);
  doc.text(`GSTIN: ${p.gstin || '33AALFC1234F1Z5'}`, width / 2, curY, { align: 'center' });
  curY += 3.2;
  doc.text(`DL No: ${p.drugLicenseNo || 'TN-MDU-20B-18491/21B-18492'}`, width / 2, curY, { align: 'center' });
  curY += 3.5;

  // Dashed divider
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, curY, width - margin, curY);
  curY += 3.5;

  // Receipt Title
  const isWholesale = transaction.saleType === 'wholesale' || Boolean(transaction.buyerBusinessName || transaction.buyerGstin);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(is58mm ? 7 : 8);
  doc.setTextColor(0, 0, 0);
  doc.text(isWholesale ? 'TAX INVOICE (WHOLESALE B2B)' : 'TAX INVOICE / CASH BILL', width / 2, curY, { align: 'center' });
  curY += 4;

  // Invoice Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(is58mm ? 6.5 : 7);
  doc.setTextColor(20, 20, 20);

  // Inv No & Date
  doc.text(`Inv No:`, margin, curY);
  doc.setFont('helvetica', 'bold');
  doc.text(transaction.id, margin + 11, curY);

  const txDate = new Date(transaction.date);
  const dateStr = `${txDate.toLocaleDateString('en-IN')} ${txDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr, width - margin, curY, { align: 'right' });
  curY += 3.5;

  if (isWholesale) {
    const buyerName = transaction.buyerBusinessName || transaction.patientName || 'Wholesale Buyer';
    doc.setFont('helvetica', 'bold');
    doc.text(`Buyer: ${buyerName}`, margin, curY);
    curY += 3.2;
    doc.setFont('helvetica', 'normal');
    if (transaction.buyerGstin) {
      doc.text(`GSTIN: ${transaction.buyerGstin}`, margin, curY);
      curY += 3.2;
    }
    if (transaction.buyerDrugLicense) {
      doc.text(`DL (20B/21B): ${transaction.buyerDrugLicense}`, margin, curY);
      curY += 3.2;
    }
    if (transaction.vehicleNumber) {
      doc.text(`Tr: ${transaction.vehicleNumber} (${transaction.transportMode || 'Road'})`, margin, curY);
      curY += 3.2;
    }
  } else {
    // Customer & Prescriber
    doc.text(`Customer: ${transaction.patientName || 'Walk-in Customer'}`, margin, curY);
    curY += 3.5;
    if (transaction.patientPhone && transaction.patientPhone !== '-') {
      doc.text(`Phone: ${transaction.patientPhone}`, margin, curY);
      curY += 3.5;
    }
    doc.text(`Doctor: ${transaction.doctorName || 'Self / OTC Recommendation'}`, margin, curY);
    curY += 3.5;
  }

  // Dashed divider
  doc.line(margin, curY, width - margin, curY);
  curY += 2;

  // Items Table
  const tableHeaders = ['Item (Batch/Exp)', 'Qty', 'Price', 'Total'];
  const tableRows = (transaction.items || []).map(item => {
    const isLoose = item.unitType === 'loose';
    const nameLine = `${item.medicineName}${isLoose ? ' [Loose]' : ''}`;
    const batchExpLine = item.batchNumber ? `B:${item.batchNumber} E:${item.expiryDate ? item.expiryDate.slice(0, 7) : '-'}` : '';
    const itemCell = batchExpLine ? `${nameLine}\n${batchExpLine}` : nameLine;
    return [
      itemCell,
      formatQuantityWithUnit(item),
      item.unitPrice.toFixed(2),
      item.total.toFixed(2)
    ];
  });

  const colWidths = is58mm
    ? { 0: 25, 1: 7, 2: 9, 3: 11 }
    : { 0: 36, 1: 10, 2: 12, 3: 14 };

  autoTable(doc, {
    head: [tableHeaders],
    body: tableRows,
    startY: curY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    headStyles: {
      textColor: [0, 0, 0],
      fontSize: is58mm ? 6.5 : 7,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 1
    },
    styles: {
      fontSize: is58mm ? 6 : 6.5,
      cellPadding: 1,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: colWidths[0], halign: 'left' },
      1: { cellWidth: colWidths[1], halign: 'center' },
      2: { cellWidth: colWidths[2], halign: 'right' },
      3: { cellWidth: colWidths[3], halign: 'right', fontStyle: 'bold' }
    }
  });

  // @ts-expect-error - injected by autotable
  curY = (doc.lastAutoTable?.finalY || (curY + 30)) + 2;

  // Dashed divider
  doc.line(margin, curY, width - margin, curY);
  curY += 3.5;

  // Financial Summary
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(is58mm ? 6.5 : 7);

  doc.text('Subtotal:', margin, curY);
  doc.text(`Rs. ${(transaction.subtotal || transaction.grandTotal).toFixed(2)}`, width - margin, curY, { align: 'right' });
  curY += 3.5;

  if ((transaction.totalDiscount || 0) > 0) {
    doc.text('Discount:', margin, curY);
    doc.text(`-Rs. ${transaction.totalDiscount.toFixed(2)}`, width - margin, curY, { align: 'right' });
    curY += 3.5;
  }

  doc.text('GST Included:', margin, curY);
  doc.text(`Rs. ${(transaction.totalTax || 0).toFixed(2)}`, width - margin, curY, { align: 'right' });
  curY += 4.5;

  // NET PAID prominent box
  doc.setLineDashPattern([], 0);
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, curY - 3, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(is58mm ? 8.5 : 9.5);
  doc.setTextColor(0, 0, 0);
  doc.text('NET PAID:', margin + 2, curY + 2);
  doc.text(`Rs. ${(transaction.grandTotal || 0).toFixed(2)}`, width - margin - 2, curY + 2, { align: 'right' });
  curY += 8;

  // Payment method
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(is58mm ? 6 : 6.5);
  doc.text(`Method: ${transaction.paymentMethod} • PAID`, width / 2, curY, { align: 'center' });
  curY += 4;

  // Render QR Code in Thermal PDF
  try {
    const isWholesale = transaction.saleType === 'wholesale' || Boolean(transaction.buyerBusinessName || transaction.buyerGstin);
    const upiId = p.upiVpa || p.upiId || '8438678498@upi';
    const qrRef = isWholesale ? `B2B-${transaction.id}` : `Inv-${transaction.id}`;
    const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(p.name || 'City Rx')}&am=${(transaction.grandTotal || 0).toFixed(2)}&cu=INR&tn=${qrRef}`;
    const qrDataUrl = await QRCode.toDataURL(upiString, { width: 160, margin: 1 });
    const qrSize = is58mm ? 20 : 25;
    const qrX = (width - qrSize) / 2;
    doc.addImage(qrDataUrl, 'PNG', qrX, curY, qrSize, qrSize);
    curY += qrSize + 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(is58mm ? 5.5 : 6.5);
    doc.text(`Scan & Pay: ${qrRef}`, width / 2, curY, { align: 'center' });
    curY += 3;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(is58mm ? 5 : 6);
    doc.text(`UPI: ${upiId}`, width / 2, curY, { align: 'center' });
    curY += 3.5;
  } catch (err) {
    console.warn('QR code generation failed in thermal PDF', err);
  }

  // Divider
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, curY, width - margin, curY);
  curY += 3.5;

  // Footer notes & Pharmacist
  doc.setFontSize(is58mm ? 5.5 : 6);
  doc.text('Thank you! Get Well Soon • No Return without Cash Bill', width / 2, curY, { align: 'center' });
  curY += 3;
  doc.text(`Pharmacist: ${p.pharmacistName || 'Anusya Begum'} (Reg: ${p.pharmacistRegNo || 'TN-RPH-78419'})`, width / 2, curY, { align: 'center' });
  curY += 4;

  // Paper cut line
  doc.text('✂ - - - - - - - - - - [Auto Cut] - - - - - - - - - - ✂', width / 2, curY, { align: 'center' });

  // Save the PDF
  const filename = `${transaction.id}_Thermal_${is58mm ? '2inch' : '3inch'}.pdf`;
  doc.save(filename);
  return filename;
};

/**
 * Downloads a continuous 3-inch (80mm) or 2-inch (58mm) POS Thermal Slip as a Text file (.txt)
 * ready for direct COM/USB printer spooling or archiving
 */
export const exportThermalSlipToText = (
  transaction: SaleTransaction,
  profile?: PharmacyProfile,
  paperWidth: '80mm' | '58mm' = '80mm'
): string => {
  const p = profile || StorageService.getPharmacyProfile();
  const widthCols = paperWidth === '58mm' ? 32 : 44;
  const line = '='.repeat(widthCols);
  const dash = '-'.repeat(widthCols);
  const center = (str: string) => {
    const pad = Math.max(0, Math.floor((widthCols - str.length) / 2));
    return ' '.repeat(pad) + str;
  };
  const row = (left: string, right: string) => {
    const space = Math.max(1, widthCols - left.length - right.length);
    return left + ' '.repeat(space) + right;
  };

  const txDate = new Date(transaction.date);
  const dateStr = `${txDate.toLocaleDateString('en-IN')} ${txDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

  const lines: string[] = [
    line,
    center(p.name || 'CITY RX - CITY MEDICAL'),
    center(`${p.addressLine1 || 'Main Road'}, ${p.taluk || 'Melur'}`),
    center(`${p.district || 'Madurai'} - ${p.pincode || '625106'}`),
    center(`Phone: +91 ${p.mobile || '8438678498'}`),
    center(`GSTIN: ${p.gstin || '33AALFC1234F1Z5'}`),
    center(`DL: ${p.drugLicenseNo || 'TN-MDU-20B-18491/21B-18492'}`),
    line,
    center('TAX INVOICE / CASH BILL'),
    dash,
    row(`Inv: ${transaction.id}`, dateStr),
    `Customer: ${transaction.patientName || 'Walk-in Customer'}`,
    ...(transaction.patientPhone && transaction.patientPhone !== '-' ? [`Phone: ${transaction.patientPhone}`] : []),
    `Doctor: ${transaction.doctorName || 'Self / OTC Recommendation'}`,
    dash,
    paperWidth === '58mm' ? 'Item [B/Exp]      Qty  Rate  Amt' : 'Item (Batch/Exp)          Qty   Price   Total',
    dash
  ];

  (transaction.items || []).forEach((item, idx) => {
    const isLoose = item.unitType === 'loose';
    const name = `${idx + 1}. ${item.medicineName}${isLoose ? ' [Loose]' : ''}`;
    const qtyStr = formatQuantityWithUnit(item);
    const priceStr = item.unitPrice.toFixed(2);
    const totalStr = item.total.toFixed(2);

    lines.push(row(name.slice(0, widthCols - 18), `${qtyStr} x ${priceStr}`));
    const batchLine = `  B:${item.batchNumber || '-'} E:${item.expiryDate ? item.expiryDate.slice(0, 7) : '-'}`;
    lines.push(row(batchLine, `Rs. ${totalStr}`));
  });

  lines.push(dash);
  lines.push(row('Subtotal:', `Rs. ${(transaction.subtotal || transaction.grandTotal).toFixed(2)}`));
  if ((transaction.totalDiscount || 0) > 0) {
    lines.push(row('Discount:', `-Rs. ${transaction.totalDiscount.toFixed(2)}`));
  }
  lines.push(row('GST Included:', `Rs. ${(transaction.totalTax || 0).toFixed(2)}`));
  lines.push(line);
  lines.push(row('NET PAID:', `Rs. ${(transaction.grandTotal || 0).toFixed(2)}`));
  lines.push(row('Payment Method:', `${transaction.paymentMethod} • PAID`));
  lines.push(dash);
  lines.push(center('Thank you! Get Well Soon'));
  lines.push(center('No Return without Original Cash Memo'));
  lines.push(center(`Pharmacist: ${p.pharmacistName || 'Anusya Begum'}`));
  lines.push(dash);
  lines.push(center('[ ✂ - - - Auto Cut - - - ✂ ]'));
  lines.push('\n\n\n'); // Feed lines for thermal cutter

  const textContent = lines.join('\n');
  const filename = `${transaction.id}_Thermal_${paperWidth === '58mm' ? '2inch' : '3inch'}.txt`;
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return filename;
};

/**
 * Downloads a single transaction Tax Invoice as PDF (supports 3" Thermal, 2" Thermal, A4, and A5 formats)
 */
export const exportInvoiceToPDF = async (
  transaction: SaleTransaction,
  profile?: PharmacyProfile,
  format: 'a4' | 'a5' | 'thermal' | 'thermal58' = 'a4'
): Promise<string | void> => {
  const p = profile || StorageService.getPharmacyProfile();

  // If thermal format requested, export as continuous 3-inch (80mm) or 2-inch (58mm) PDF
  if (format === 'thermal' || format === 'thermal58') {
    return exportThermalReceiptToPDF(transaction, p, format === 'thermal58' ? '58mm' : '80mm');
  }

  const isA5 = format === 'a5';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isA5 ? 'a5' : 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const bannerHeight = isA5 ? 22 : 28;
  const leftMargin = isA5 ? 10 : 14;
  const rightMargin = isA5 ? 10 : 14;

  // Header banner
  doc.setFillColor(13, 148, 136); // Teal-600
  doc.rect(0, 0, pageWidth, bannerHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(isA5 ? 13 : 16);
  doc.setFont('helvetica', 'bold');
  doc.text(p.name || 'City Rx • City Medical', leftMargin, isA5 ? 8 : 11);

  doc.setFontSize(isA5 ? 7 : 8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${p.addressLine1}, ${p.taluk}, ${p.district}, ${p.state} - ${p.pincode} | Ph: ${p.mobile}`,
    leftMargin,
    isA5 ? 13 : 17
  );
  doc.text(
    `GSTIN: ${p.gstin} | DL: ${p.drugLicenseNo || 'TN-625103-20B/21B'} | Reg. Pharmacist: ${p.pharmacistName || 'Anusya Begum'}`,
    leftMargin,
    isA5 ? 18 : 22
  );

  // Invoice Title & Meta Box
  const metaY = bannerHeight + (isA5 ? 6 : 10);
  const isWholesale = transaction.saleType === 'wholesale' || Boolean(transaction.buyerBusinessName || transaction.buyerGstin);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(isA5 ? 10.5 : 13);
  doc.setFont('helvetica', 'bold');
  doc.text(
    isWholesale
      ? `WHOLESALE TAX INVOICE (B2B - ${isA5 ? 'A5' : 'A4'})`
      : `RETAIL TAX INVOICE (${isA5 ? 'A5' : 'A4'})`,
    leftMargin,
    metaY
  );

  doc.setFontSize(isA5 ? 7.5 : 9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: ${transaction.id}`, leftMargin, metaY + (isA5 ? 4.5 : 6));
  doc.text(`Date & Time: ${new Date(transaction.date).toLocaleString()}`, leftMargin, metaY + (isA5 ? 9 : 11));
  doc.text(
    `Payment: ${transaction.paymentMethod} (${transaction.paymentStatus || 'Paid'})${
      isWholesale && transaction.creditDays ? ` • ${transaction.creditDays}d Credit` : ''
    }`,
    leftMargin,
    metaY + (isA5 ? 13.5 : 16)
  );

  if (isWholesale) {
    const buyerName = transaction.buyerBusinessName || transaction.patientName || 'Wholesale Chemist Buyer';
    doc.setFont('helvetica', 'bold');
    doc.text(`Billed To: ${buyerName}`, pageWidth - rightMargin, metaY + (isA5 ? 4.5 : 6), { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(
      `GSTIN: ${transaction.buyerGstin || 'Unregistered'} | DL: ${transaction.buyerDrugLicense || '20B/21B'}`,
      pageWidth - rightMargin,
      metaY + (isA5 ? 9 : 11),
      { align: 'right' }
    );
    const transportDetails = `${transaction.vehicleNumber ? `Vehicle: ${transaction.vehicleNumber}` : 'Local Delivery'}${transaction.ewayBillNo ? ` | E-Way: ${transaction.ewayBillNo}` : ''}`;
    doc.text(transportDetails, pageWidth - rightMargin, metaY + (isA5 ? 13.5 : 16), { align: 'right' });
  } else {
    // Customer / Patient Info on Right
    doc.text(`Customer: ${transaction.patientName || 'Walk-in Customer'}`, pageWidth - rightMargin, metaY + (isA5 ? 4.5 : 6), { align: 'right' });
    if (transaction.patientPhone) {
      doc.text(`Phone: ${transaction.patientPhone}`, pageWidth - rightMargin, metaY + (isA5 ? 9 : 11), { align: 'right' });
    }
    doc.text(`Prescriber: ${transaction.doctorName || 'Self / OTC'}`, pageWidth - rightMargin, metaY + (isA5 ? 13.5 : 16), { align: 'right' });
  }

  // Items Table
  const tableHeaders = ['#', 'Product / Item', 'Batch', 'Exp', 'Qty', isWholesale ? 'PTR' : 'MRP', 'Disc', 'Tax', 'Amount (₹)'];
  const tableRows = transaction.items.map((item, idx) => {
    const isLoose = item.unitType === 'loose';
    const medTitle = isLoose ? `${item.medicineName} [LOOSE]` : item.medicineName;
    return [
      idx + 1,
      medTitle,
      item.batchNumber || '-',
      item.expiryDate ? item.expiryDate.slice(0, 7) : '-',
      formatQuantityWithUnit(item),
      item.unitPrice.toFixed(2),
      `${item.discountPercent || 0}%`,
      `${item.taxRate || 12}%`,
      item.total.toFixed(2)
    ];
  });

  const tableStartY = metaY + (isA5 ? 18 : 22);
  autoTable(doc, {
    head: [tableHeaders],
    body: tableRows,
    startY: tableStartY,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: isA5 ? 7 : 8.5,
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: {
      fontSize: isA5 ? 6.5 : 8,
      cellPadding: isA5 ? 1.5 : 2.2
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // @ts-expect-error - injected by jspdf-autotable
  const finalY = doc.lastAutoTable?.finalY || (tableStartY + 30);

  // Financial summary
  const summaryBoxWidth = isA5 ? 65 : 85;
  const summaryX = pageWidth - rightMargin - summaryBoxWidth;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(summaryX, finalY + 4, summaryBoxWidth, isA5 ? 26 : 36, 2, 2, 'F');

  // UPI QR Code & Bill Verification Box (Left side opposite summary)
  try {
    const upiId = p.upiVpa || p.upiId || '8438678498@upi';
    const qrRef = isWholesale ? `B2B-${transaction.id}` : `Inv-${transaction.id}`;
    const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(p.name || 'City Rx')}&am=${(transaction.grandTotal || 0).toFixed(2)}&cu=INR&tn=${qrRef}`;
    const qrDataUrl = await QRCode.toDataURL(upiString, { width: 220, margin: 1 });

    const qrBoxX = leftMargin;
    const qrBoxY = finalY + 4;
    const qrBoxWidth = Math.min(summaryX - leftMargin - 4, isA5 ? 65 : 90);
    const qrBoxHeight = isA5 ? 26 : 36;
    const qrImgSize = isA5 ? 20 : 28;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(qrBoxX, qrBoxY, qrBoxWidth, qrBoxHeight, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineDashPattern([], 0);
    doc.roundedRect(qrBoxX, qrBoxY, qrBoxWidth, qrBoxHeight, 2, 2, 'S');

    doc.addImage(qrDataUrl, 'PNG', qrBoxX + 2.5, qrBoxY + (isA5 ? 3 : 4), qrImgSize, qrImgSize);

    const textX = qrBoxX + qrImgSize + (isA5 ? 4.5 : 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isA5 ? 7.5 : 9);
    doc.setTextColor(15, 23, 42);
    doc.text('Scan & Pay via UPI', textX, qrBoxY + (isA5 ? 7 : 10));

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(isA5 ? 6 : 7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`UPI: ${upiId}`, textX, qrBoxY + (isA5 ? 12 : 16));
    doc.text(`Ref: ${qrRef}`, textX, qrBoxY + (isA5 ? 16 : 21));

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 148, 136); // Teal
    doc.text('✓ Verified Tax Invoice', textX, qrBoxY + (isA5 ? 20 : 27));
  } catch (err) {
    console.warn('Could not render QR code in invoice PDF', err);
  }

  doc.setFontSize(isA5 ? 7 : 8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal (Gross):', summaryX + 3, finalY + (isA5 ? 8 : 12));
  doc.text(`₹${(transaction.subtotal || 0).toFixed(2)}`, pageWidth - rightMargin - 3, finalY + (isA5 ? 8 : 12), { align: 'right' });

  if (transaction.totalDiscount > 0) {
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text('Total Discount:', summaryX + 3, finalY + (isA5 ? 13 : 18));
    doc.text(`-₹${transaction.totalDiscount.toFixed(2)}`, pageWidth - rightMargin - 3, finalY + (isA5 ? 13 : 18), { align: 'right' });
  }

  doc.setTextColor(71, 85, 105);
  doc.text('GST (CGST+SGST):', summaryX + 3, finalY + (isA5 ? 18 : 24));
  doc.text(`₹${(transaction.totalTax || 0).toFixed(2)}`, pageWidth - rightMargin - 3, finalY + (isA5 ? 18 : 24), { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(isA5 ? 8 : 10);
  doc.text('NET AMOUNT PAID:', summaryX + 3, finalY + (isA5 ? 25 : 34));
  doc.text(`₹${(transaction.grandTotal || 0).toFixed(2)}`, pageWidth - rightMargin - 3, finalY + (isA5 ? 25 : 34), { align: 'right' });

  // Legal & Pharmacist Stamp
  const footerY = Math.max(finalY + (isA5 ? 35 : 48), doc.internal.pageSize.getHeight() - (isA5 ? 16 : 24));
  doc.setFontSize(isA5 ? 6 : 7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Terms: Medicines once sold can be returned within 48h with original bill (excl. cold-chain).', leftMargin, footerY);
  doc.text('Schedule H/H1 dispensed strictly under Registered Medical Practitioner prescription.', leftMargin, footerY + 3.5);

  doc.text('Reg. Pharmacist Signature', pageWidth - rightMargin, footerY + 3.5, { align: 'right' });

  doc.save(`${transaction.id}_${format.toUpperCase()}.pdf`);
};

/**
 * Downloads a single transaction Tax Invoice as an Excel spreadsheet (.xlsx)
 */
export const exportInvoiceToExcel = (
  transaction: SaleTransaction,
  profile?: PharmacyProfile
) => {
  const p = profile || StorageService.getPharmacyProfile();
  const wb = XLSX.utils.book_new();

  const data: (string | number)[][] = [
    [p.name || 'City Rx • City Medical'],
    [`${p.addressLine1}, ${p.taluk}, ${p.district}, ${p.state} - ${p.pincode}`],
    [`Phone: ${p.mobile} | GSTIN: ${p.gstin} | DL No: ${p.drugLicenseNo || 'TN-625103-20B/21B'}`],
    [],
    ['TAX INVOICE / BILL OF SUPPLY'],
    ['Invoice No:', transaction.id, 'Date:', new Date(transaction.date).toLocaleString()],
    ['Customer:', transaction.patientName || 'Walk-in Customer', 'Phone:', transaction.patientPhone || '-'],
    ['Prescribing Doctor:', transaction.doctorName || 'Self / OTC Recommendation', 'Payment Mode:', transaction.paymentMethod],
    [],
    ['#', 'Medicine / Product', 'Batch No', 'Expiry', 'Quantity', 'Unit Price (₹)', 'Disc %', 'Tax %', 'Total (₹)']
  ];

  transaction.items.forEach((item, idx) => {
    const isLoose = item.unitType === 'loose';
    const medTitle = isLoose ? `${item.medicineName} [LOOSE]` : item.medicineName;
    data.push([
      idx + 1,
      medTitle,
      item.batchNumber || '-',
      item.expiryDate || '-',
      formatQuantityWithUnit(item),
      item.unitPrice,
      item.discountPercent || 0,
      item.taxRate || 12,
      item.total
    ]);
  });

  data.push([]);
  data.push(['Subtotal (Gross):', '', '', '', '', '', '', '', transaction.subtotal || 0]);
  data.push(['Discount:', '', '', '', '', '', '', '', -(transaction.totalDiscount || 0)]);
  data.push(['GST Included:', '', '', '', '', '', '', '', transaction.totalTax || 0]);
  data.push(['Net Amount Paid:', '', '', '', '', '', '', '', transaction.grandTotal || 0]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Tax Invoice');
  XLSX.writeFile(wb, `${transaction.id}.xlsx`);
};

/**
 * Downloads a Purchase Inward Invoice Voucher as a formatted PDF
 */
export const exportPurchaseInvoiceToPDF = (
  invoice: PurchaseInvoice,
  profile?: PharmacyProfile
) => {
  const p = profile || StorageService.getPharmacyProfile();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top header banner (Navy / Slate-900)
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Pharmacy Brand
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(p.name || 'City Rx • City Medical', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${p.addressLine1}, ${p.taluk}, ${p.district}, ${p.state} - ${p.pincode} | Phone: ${p.mobile}`,
    14,
    17
  );
  doc.text(
    `GSTIN: ${p.gstin} | D.L. No: ${p.drugLicenseNo || 'TN-625103-20B/21B'} | Inward Goods Receipt`,
    14,
    22
  );

  // Voucher Title & Header
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('PURCHASE INWARD VOUCHER / GOODS RECEIPT NOTE', 14, 37);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Distributor Invoice No: ${invoice.invoiceNo}`, 14, 43);
  doc.text(`Internal System Ref: ${invoice.id}`, 14, 48);
  doc.text(`Invoice Date: ${invoice.invoiceDate}`, 14, 53);
  doc.text(`Payment Due: ${invoice.paymentDueDate} | Status: ${invoice.paymentStatus}`, 14, 58);

  // Distributor Info Box on Right
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth - 95, 33, 81, 28, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(13, 148, 136); // Teal
  doc.text('SUPPLIER / DISTRIBUTOR', pageWidth - 91, 39);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.distributorName, pageWidth - 91, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  if (invoice.distributorGstin) {
    doc.text(`GSTIN: ${invoice.distributorGstin}`, pageWidth - 91, 49);
  }
  if (invoice.distributorPhone) {
    doc.text(`Phone: ${invoice.distributorPhone}`, pageWidth - 91, 54);
  }
  if (invoice.attachment) {
    doc.text(`Document Attached: ${invoice.attachment.name}`, pageWidth - 91, 59);
  }

  // Items Table
  const headers = ['#', 'Medicine / Formulation', 'HSN', 'Batch', 'Exp', 'Pack', 'Billed', 'Free', 'MRP', 'Rate', 'Disc%', 'GST%', 'Net (₹)'];
  const rows = invoice.items.map((item, idx) => [
    idx + 1,
    item.medicineName,
    item.hsnCode || '300490',
    item.batchNumber,
    item.expiryDate,
    item.pack || '10s',
    item.billedQuantity,
    item.freeQuantity > 0 ? `+${item.freeQuantity}` : '-',
    (item.mrp || 0).toFixed(2),
    (item.purchaseRate || 0).toFixed(2),
    item.discountPercentage > 0 ? `${item.discountPercentage}%` : '-',
    `${item.gstRate}%`,
    (item.netAmount || 0).toFixed(2)
  ]);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 65,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // @ts-expect-error - lastAutoTable injected by jspdf-autotable
  const finalY = doc.lastAutoTable?.finalY || 140;

  // Financial summary box
  const summaryBoxWidth = 85;
  const summaryX = pageWidth - 14 - summaryBoxWidth;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(summaryX, finalY + 6, summaryBoxWidth, 38, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal (Gross Value):', summaryX + 4, finalY + 12);
  doc.text(`₹${(invoice.subtotal || 0).toFixed(2)}`, pageWidth - 18, finalY + 12, { align: 'right' });

  if (invoice.totalScheme > 0) {
    doc.setTextColor(225, 29, 72);
    doc.text('Scheme Deduction:', summaryX + 4, finalY + 17);
    doc.text(`-₹${invoice.totalScheme.toFixed(2)}`, pageWidth - 18, finalY + 17, { align: 'right' });
  }

  if (invoice.totalDiscount > 0) {
    doc.setTextColor(225, 29, 72);
    doc.text('Trade Discount:', summaryX + 4, finalY + 22);
    doc.text(`-₹${invoice.totalDiscount.toFixed(2)}`, pageWidth - 18, finalY + 22, { align: 'right' });
  }

  doc.setTextColor(71, 85, 105);
  doc.text('GST Input Tax Credit (ITC):', summaryX + 4, finalY + 27);
  doc.text(`+₹${(invoice.totalTax || 0).toFixed(2)}`, pageWidth - 18, finalY + 27, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.text('NET PAYABLE GRAND TOTAL:', summaryX + 4, finalY + 36);
  doc.text(`₹${(invoice.grandTotal || 0).toFixed(2)}`, pageWidth - 18, finalY + 36, { align: 'right' });

  // Notes and Verification Stamp
  const footerY = Math.max(finalY + 50, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  if (invoice.notes) {
    doc.text(`Notes: ${invoice.notes}`, 14, footerY);
  }
  doc.text('Goods received, verified against physical stock, and entered into pharmacy ERP inventory.', 14, footerY + 4);
  doc.text('Authorized Goods Inward Receiver: ____________________', pageWidth - 14, footerY + 4, { align: 'right' });

  const safeFilename = `Purchase_${invoice.invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(safeFilename);
};

/**
 * Downloads a single Purchase Inward Invoice as an Excel spreadsheet (.xlsx)
 */
export const exportPurchaseInvoiceToExcel = (
  invoice: PurchaseInvoice,
  profile?: PharmacyProfile
) => {
  const p = profile || StorageService.getPharmacyProfile();
  const wb = XLSX.utils.book_new();

  const data: (string | number)[][] = [
    [p.name || 'City Rx • City Medical'],
    [`${p.addressLine1}, ${p.taluk}, ${p.district}, ${p.state} - ${p.pincode}`],
    [`GSTIN: ${p.gstin} | DL No: ${p.drugLicenseNo || 'TN-625103-20B/21B'}`],
    [],
    ['PURCHASE INWARD VOUCHER / GOODS RECEIPT'],
    ['Invoice No:', invoice.invoiceNo, 'Internal ID:', invoice.id],
    ['Invoice Date:', invoice.invoiceDate, 'Payment Due:', invoice.paymentDueDate],
    ['Distributor:', invoice.distributorName, 'Distributor GSTIN:', invoice.distributorGstin || '-'],
    ['Payment Status:', invoice.paymentStatus, 'Attached Document:', invoice.attachment?.name || 'None'],
    [],
    ['#', 'Medicine Name', 'HSN Code', 'Batch Number', 'Expiry Date', 'Pack', 'Boxes', 'Units/Box', 'Billed Qty', 'Free Qty', 'Total Qty', 'MRP (₹)', 'Purchase Rate (₹)', 'Scheme %', 'Discount %', 'Taxable (₹)', 'GST %', 'GST Amt (₹)', 'Net Amount (₹)']
  ];

  invoice.items.forEach((item, idx) => {
    data.push([
      idx + 1,
      item.medicineName,
      item.hsnCode || '300490',
      item.batchNumber,
      item.expiryDate,
      item.pack || '10s',
      item.boxes || 1,
      item.unitsPerBox || 10,
      item.billedQuantity,
      item.freeQuantity || 0,
      item.totalQuantity || (item.billedQuantity + (item.freeQuantity || 0)),
      item.mrp || 0,
      item.purchaseRate || 0,
      item.schemePercentage || 0,
      item.discountPercentage || 0,
      item.taxableAmount || 0,
      item.gstRate || 12,
      item.gstAmount || 0,
      item.netAmount || 0
    ]);
  });

  data.push([]);
  data.push(['Subtotal (Gross):', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', invoice.subtotal || 0]);
  data.push(['Scheme Deductions:', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', -(invoice.totalScheme || 0)]);
  data.push(['Trade Discount:', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', -(invoice.totalDiscount || 0)]);
  data.push(['Taxable Value:', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', invoice.taxableAmount || 0]);
  data.push(['Total GST (ITC):', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', invoice.totalTax || 0]);
  data.push(['Round Off:', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', invoice.roundOff || 0]);
  data.push(['GRAND TOTAL PAYABLE:', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', invoice.grandTotal || 0]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Purchase Voucher');
  const safeFilename = `Purchase_${invoice.invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
};

/**
 * Exports the entire Purchase Invoices Ledger list to Excel
 */
export const exportPurchaseInvoicesLedgerToExcel = (invoices: PurchaseInvoice[]) => {
  const profile = StorageService.getPharmacyProfile();
  const headers = [
    'Invoice No',
    'Distributor Name',
    'Distributor GSTIN',
    'Invoice Date',
    'Payment Due Date',
    'Items Count',
    'Taxable Base (₹)',
    'CGST (₹)',
    'SGST (₹)',
    'Total GST (₹)',
    'Grand Total (₹)',
    'Payment Status',
    'Attachment Attached',
    'Notes'
  ];

  const rows = invoices.map(inv => [
    inv.invoiceNo,
    inv.distributorName,
    inv.distributorGstin || '',
    inv.invoiceDate,
    inv.paymentDueDate,
    (inv.items || []).length,
    Number((inv.taxableAmount || 0).toFixed(2)),
    Number((inv.cgstAmount || 0).toFixed(2)),
    Number((inv.sgstAmount || 0).toFixed(2)),
    Number((inv.totalTax || 0).toFixed(2)),
    Number((inv.grandTotal || 0).toFixed(2)),
    inv.paymentStatus,
    inv.attachment?.name ? `Yes (${inv.attachment.name})` : 'No',
    inv.notes || ''
  ]);

  const totalTaxable = invoices.reduce((sum, i) => sum + (i.taxableAmount || 0), 0);
  const totalTax = invoices.reduce((sum, i) => sum + (i.totalTax || 0), 0);
  const totalGrand = invoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  exportReportToExcel(
    `Purchase_Invoices_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`,
    'Inward Invoices',
    headers,
    rows,
    {
      title: 'PURCHASE INWARD INVOICES & GST ITC LEDGER',
      subtitle: `${profile.name} • Total ${invoices.length} Bills`,
      summary: [
        { label: 'Total Invoices Count', value: invoices.length },
        { label: 'Total Taxable Value', value: `₹${totalTaxable.toFixed(2)}` },
        { label: 'Total GST Input Tax Credit (ITC)', value: `₹${totalTax.toFixed(2)}` },
        { label: 'Total Purchases Grand Value', value: `₹${totalGrand.toFixed(2)}` }
      ]
    }
  );
};

/**
 * Generates and downloads a standardized sample Excel template for bulk purchase invoice upload
 */
export const generateSamplePurchaseExcelTemplate = () => {
  const wb = XLSX.utils.book_new();

  // Template Data with realistic pharmacy medicines
  const templateRows: (string | number)[][] = [
    // Column Headers
    [
      'Medicine Name',
      'Generic Name',
      'HSN Code',
      'Batch Number',
      'Expiry Date',
      'Pack',
      'Boxes',
      'Units Per Box',
      'Free Qty',
      'MRP',
      'Purchase Rate',
      'Scheme %',
      'Discount %',
      'GST %'
    ],
    // Sample Row 1
    [
      'Dolo 650mg Tablet',
      'Paracetamol 650mg',
      '300490',
      'DL-8821',
      '2028-06',
      '15 Tablets',
      5,
      15,
      5,
      30.50,
      19.20,
      0,
      2,
      12
    ],
    // Sample Row 2
    [
      'Pan-D Capsule',
      'Pantoprazole 40mg + Domperidone 30mg',
      '300490',
      'PND-409',
      '2027-11',
      '10 Capsules',
      10,
      10,
      0,
      145.00,
      92.00,
      5,
      3,
      12
    ],
    // Sample Row 3
    [
      'Augmentin 625 Duo Tablet',
      'Amoxicillin 500mg + Clavulanic Acid 125mg',
      '300410',
      'AUG-912',
      '2028-03',
      '10 Tablets',
      4,
      10,
      0,
      205.00,
      142.50,
      0,
      1.5,
      12
    ],
    // Sample Row 4
    [
      'Azee 500mg Tablet',
      'Azithromycin 500mg',
      '300420',
      'AZ-3304',
      '2027-09',
      '5 Tablets',
      8,
      5,
      2,
      119.50,
      76.00,
      0,
      2.5,
      12
    ],
    // Sample Row 5
    [
      'Montair-LC Tablet',
      'Montelukast 10mg + Levocetirizine 5mg',
      '300490',
      'MLC-551',
      '2028-01',
      '10 Tablets',
      6,
      10,
      0,
      178.00,
      115.00,
      0,
      2,
      12
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateRows);

  // Set column widths for readability
  ws['!cols'] = [
    { wch: 28 }, // Medicine Name
    { wch: 35 }, // Generic Name
    { wch: 12 }, // HSN Code
    { wch: 15 }, // Batch Number
    { wch: 14 }, // Expiry Date (YYYY-MM)
    { wch: 14 }, // Pack
    { wch: 8 },  // Boxes
    { wch: 14 }, // Units Per Box
    { wch: 10 }, // Free Qty
    { wch: 10 }, // MRP
    { wch: 14 }, // Purchase Rate
    { wch: 10 }, // Scheme %
    { wch: 12 }, // Discount %
    { wch: 8 }   // GST %
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Purchase Items');

  // Add an Instructions Sheet
  const instructions: (string | number)[][] = [
    ['CITY MEDICAL / CITY RX - PURCHASE INVOICE EXCEL IMPORT GUIDE'],
    [],
    ['Field Name', 'Required?', 'Format / Example', 'Description'],
    ['Medicine Name', 'YES', 'Dolo 650mg Tablet', 'Brand or trade formulation name'],
    ['Generic Name', 'Optional', 'Paracetamol 650mg', 'Active pharmacological salt/molecule'],
    ['HSN Code', 'Optional', '300490', 'Goods & Services Tax Harmonized Code (e.g. 300490)'],
    ['Batch Number', 'YES', 'DL-8821', 'Manufacturer lot or batch number'],
    ['Expiry Date', 'YES', '2028-06 or 06/2028', 'Expiry in YYYY-MM or MM/YYYY format'],
    ['Pack', 'Optional', '10 Tablets / 100ml', 'Packaging form factor'],
    ['Boxes', 'YES', '5', 'Number of cartons/boxes received'],
    ['Units Per Box', 'YES', '10', 'Number of strips/units per box (Billed Qty = Boxes * Units Per Box)'],
    ['Free Qty', 'Optional', '1', 'Bonus or scheme free units provided'],
    ['MRP', 'YES', '145.00', 'Maximum Retail Price per strip/unit in Rupees'],
    ['Purchase Rate', 'YES', '92.00', 'Basic purchase/cost price per strip/unit'],
    ['Scheme %', 'Optional', '5', 'Special distributor scheme discount percentage'],
    ['Discount %', 'Optional', '2.5', 'Standard trade cash discount percentage'],
    ['GST %', 'YES', '12', 'Applicable GST Tax slab (0, 5, 12, 18, or 28)']
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 22 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  XLSX.writeFile(wb, 'CityRx_Purchase_Invoice_Template.xlsx');
};
