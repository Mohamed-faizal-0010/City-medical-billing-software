import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SaleTransaction, Medicine, Patient, Doctor } from '../types';
import { StorageService } from '../services/storage';

export type ScheduleClassification = 'H1' | 'H' | 'X' | 'G' | 'Narcotic' | 'OTC';

export interface ScheduleDrugItem {
  id: string; // unique item row key
  transactionId: string;
  date: string; // ISO string
  patientId?: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number | string;
  patientAddress?: string;
  patientGender?: string;
  doctorId?: string;
  doctorName: string;
  doctorRegNo?: string;
  doctorClinic?: string;
  prescriptionNo?: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  scheduleType: ScheduleClassification;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitType?: string;
  unitPrice: number;
  total: number;
  cashierName: string;
}

// Key molecules under Indian Schedule H1
const SCHEDULE_H1_MOLECULES = [
  'cefixime',
  'cefpodoxime',
  'cefuroxime',
  'ceftriaxone',
  'cefotaxime',
  'cefepime',
  'cefpirome',
  'cefditoren',
  'meropenem',
  'imipenem',
  'ertapenem',
  'doripenem',
  'faropenem',
  'colistin',
  'polymyxin',
  'fosfomycin',
  'linezolid',
  'vancomycin',
  'teicoplanin',
  'moxifloxacin',
  'levofloxacin',
  'ciprofloxacin',
  'ofloxacin',
  'balofloxacin',
  'gemifloxacin',
  'sparfloxacin',
  'amikacin',
  'tobramycin',
  'rifampicin',
  'isoniazid',
  'pyrazinamide',
  'ethambutol',
  'bedaquiline',
  'delamanid',
  'clofazimine',
  'alprazolam',
  'diazepam',
  'chlordiazepoxide',
  'clonazepam',
  'lorazepam',
  'nitrazepam',
  'midazolam',
  'zolpidem',
  'zopiclone',
  'tramadol',
  'codeine',
  'pentazocine',
  'buprenorphine',
  'tapentadol',
  'clobazam'
];

// Key molecules under Schedule X (Controlled psychotropics)
const SCHEDULE_X_MOLECULES = [
  'ketamine',
  'methylphenidate',
  'secobarbital',
  'amobarbital',
  'phenobarbital',
  'phenobarbitone',
  'amphetamine',
  'dexamphetamine',
  'methaqualone',
  'glutethimide'
];

// Key molecules under Schedule G (Medical supervision required)
const SCHEDULE_G_MOLECULES = [
  'metformin',
  'glimepiride',
  'gliclazide',
  'glipizide',
  'insulin',
  'hydroxyurea',
  'carbutamide',
  'chlorpropamide',
  'phenformin'
];

// Key molecules under Narcotics / NDPS
const NARCOTIC_MOLECULES = [
  'morphine',
  'fentanyl',
  'pethidine',
  'methadone'
];

/**
 * Evaluates whether a drug belongs to Schedule H1, Schedule X, Schedule G, Schedule H, or OTC
 */
export function getMedicineScheduleInfo(med: {
  name?: string;
  genericName?: string;
  category?: string;
  scheduleType?: string;
  prescriptionRequired?: boolean;
}): {
  scheduleType: ScheduleClassification;
  isScheduled: boolean;
  label: string;
  badgeClass: string;
  badgeBg: string;
  badgeText: string;
  statutoryRule: string;
  warningText: string;
} {
  // If explicitly tagged
  if (med.scheduleType) {
    const s = med.scheduleType.toUpperCase();
    if (s === 'H1') {
      return {
        scheduleType: 'H1',
        isScheduled: true,
        label: 'Schedule H1',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        badgeBg: '#ffe4e6',
        badgeText: '#9f1239',
        statutoryRule: 'Rule 65(9) - Mandatory Register with Patient & Doctor details; 3-year record retention',
        warningText: 'High-alert Antibiotic / Habit-forming Drug. Requires Rx and separate H1 Register entry.'
      };
    }
    if (s === 'X') {
      return {
        scheduleType: 'X',
        isScheduled: true,
        label: 'Schedule X',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
        badgeBg: '#f3e8ff',
        badgeText: '#6b21a8',
        statutoryRule: 'Special Schedule X Vault Storage; Duplicate Rx required; 2-year retention',
        warningText: 'Strictly controlled psychotropic substance. Verification mandatory.'
      };
    }
    if (s === 'G') {
      return {
        scheduleType: 'G',
        isScheduled: true,
        label: 'Schedule G',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
        badgeBg: '#dbeafe',
        badgeText: '#1e40af',
        statutoryRule: 'Caution: To be taken under medical supervision only',
        warningText: 'Hormonal / Glycemic agent under regular medical supervision.'
      };
    }
    if (s === 'NARCOTIC') {
      return {
        scheduleType: 'Narcotic',
        isScheduled: true,
        label: 'Narcotic (NDPS)',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-400',
        badgeBg: '#fef3c7',
        badgeText: '#78350f',
        statutoryRule: 'NDPS Act - Controlled Narcotic Register',
        warningText: 'Statutory narcotic dispensing rules apply.'
      };
    }
    if (s === 'H') {
      return {
        scheduleType: 'H',
        isScheduled: true,
        label: 'Schedule H',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        badgeBg: '#fef3c7',
        badgeText: '#92400e',
        statutoryRule: 'Rule 65 - Warning: To be sold by retail on the prescription of a Registered Medical Practitioner only',
        warningText: 'Prescription-only drug.'
      };
    }
  }

  const combined = `${med.name || ''} ${med.genericName || ''} ${med.category || ''}`.toLowerCase();

  // Check Schedule X
  for (const mol of SCHEDULE_X_MOLECULES) {
    if (combined.includes(mol)) {
      return {
        scheduleType: 'X',
        isScheduled: true,
        label: 'Schedule X',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
        badgeBg: '#f3e8ff',
        badgeText: '#6b21a8',
        statutoryRule: 'Special Schedule X Vault Storage; Duplicate Rx required; 2-year retention',
        warningText: 'Strictly controlled psychotropic substance.'
      };
    }
  }

  // Check Schedule H1
  for (const mol of SCHEDULE_H1_MOLECULES) {
    if (combined.includes(mol)) {
      return {
        scheduleType: 'H1',
        isScheduled: true,
        label: 'Schedule H1',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        badgeBg: '#ffe4e6',
        badgeText: '#9f1239',
        statutoryRule: 'Rule 65(9) - Mandatory Register with Patient & Doctor details; 3-year record retention',
        warningText: 'High-alert Antibiotic / Habit-forming Drug. Requires Rx and separate H1 Register entry.'
      };
    }
  }

  // Check Narcotics
  for (const mol of NARCOTIC_MOLECULES) {
    if (combined.includes(mol)) {
      return {
        scheduleType: 'Narcotic',
        isScheduled: true,
        label: 'Narcotic (NDPS)',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-400',
        badgeBg: '#fef3c7',
        badgeText: '#78350f',
        statutoryRule: 'NDPS Act - Controlled Narcotic Register',
        warningText: 'Statutory narcotic dispensing rules apply.'
      };
    }
  }

  // Check Schedule G
  for (const mol of SCHEDULE_G_MOLECULES) {
    if (combined.includes(mol)) {
      return {
        scheduleType: 'G',
        isScheduled: true,
        label: 'Schedule G',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
        badgeBg: '#dbeafe',
        badgeText: '#1e40af',
        statutoryRule: 'Caution: To be taken under medical supervision only',
        warningText: 'Hormonal / Glycemic agent under regular medical supervision.'
      };
    }
  }

  // If prescriptionRequired is true, classify as Schedule H
  if (med.prescriptionRequired) {
    return {
      scheduleType: 'H',
      isScheduled: true,
      label: 'Schedule H',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      badgeBg: '#fef3c7',
      badgeText: '#92400e',
      statutoryRule: 'Rule 65 - Warning: To be sold by retail on the prescription of a Registered Medical Practitioner only',
      warningText: 'Prescription-only drug.'
    };
  }

  // Default: OTC
  return {
    scheduleType: 'OTC',
    isScheduled: false,
    label: 'OTC / Non-Scheduled',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    badgeBg: '#f1f5f9',
    badgeText: '#334155',
    statutoryRule: 'General Sales - Over The Counter',
    warningText: ''
  };
}

/**
 * Extracts and normalizes all scheduled drug dispensation entries from transactions
 */
export function extractScheduledDrugItems(
  transactions: SaleTransaction[],
  patients: Patient[] = [],
  doctors: Doctor[] = [],
  medicines: Medicine[] = []
): ScheduleDrugItem[] {
  const patientMap = new Map<string, Patient>();
  patients.forEach(p => patientMap.set(p.id, p));

  const doctorMap = new Map<string, Doctor>();
  doctors.forEach(d => doctorMap.set(d.id, d));

  const medicineMap = new Map<string, Medicine>();
  medicines.forEach(m => medicineMap.set(m.id, m));

  const items: ScheduleDrugItem[] = [];

  transactions.forEach(tx => {
    const pat = tx.patientId ? patientMap.get(tx.patientId) : undefined;
    const doc = tx.doctorId ? doctorMap.get(tx.doctorId) : undefined;

    const patientAge = tx.patientAge !== undefined ? tx.patientAge : pat?.age;
    const patientAddress = tx.patientAddress || pat?.address || 'Melur, Madurai';
    const patientGender = pat?.gender || 'Unspecified';
    const patientPhone = tx.patientPhone || pat?.phone || 'Guest Walk-in';

    const doctorName = tx.doctorName || doc?.name || 'Dr. Registered Medical Practitioner';
    const doctorRegNo = tx.doctorRegNo || doc?.registrationNumber || (doc?.specialization ? `Reg. RMP (${doc.specialization})` : 'Reg. RMP-TN-2041');
    const doctorClinic = doc?.clinicName || 'City Medical Clinic, Melur';
    const prescriptionNo = tx.prescriptionNo;

    (tx.items || []).forEach((item, index) => {
      const med = medicineMap.get(item.medicineId);
      const schedInfo = getMedicineScheduleInfo({
        name: item.medicineName,
        genericName: item.genericName || med?.genericName,
        category: med?.category,
        scheduleType: item.scheduleType || med?.scheduleType,
        prescriptionRequired: med?.prescriptionRequired ?? true
      });

      // We include all scheduled drugs (H1, H, X, G, Narcotic)
      if (schedInfo.isScheduled) {
        items.push({
          id: `${tx.id}-${item.medicineId}-${index}`,
          transactionId: tx.id,
          date: tx.date,
          patientId: tx.patientId,
          patientName: tx.patientName || 'Walk-in Customer',
          patientPhone,
          patientAge,
          patientAddress,
          patientGender,
          doctorId: tx.doctorId,
          doctorName,
          doctorRegNo,
          doctorClinic,
          prescriptionNo,
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          genericName: item.genericName || med?.genericName || item.medicineName,
          scheduleType: schedInfo.scheduleType,
          batchNumber: item.batchNumber || 'BAT-DEF',
          expiryDate: item.expiryDate || '2027-12-31',
          quantity: item.quantity,
          unitType: item.unitType || 'Pack',
          unitPrice: item.unitPrice,
          total: item.total,
          cashierName: tx.cashierName || 'Registered Pharmacist'
        });
      }
    });
  });

  // Sort descending by date
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Filter scheduled drug items by date mode (daily, monthly, custom)
 */
export function filterScheduleDrugItems(
  items: ScheduleDrugItem[],
  mode: 'daily' | 'monthly' | 'custom' | 'all',
  options: {
    selectedDate?: string; // YYYY-MM-DD
    selectedMonth?: string; // YYYY-MM
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    scheduleFilter?: 'all' | 'H1' | 'H' | 'X' | 'G' | 'Narcotic';
    searchQuery?: string;
  }
): ScheduleDrugItem[] {
  return items.filter(item => {
    const itemDate = new Date(item.date);
    const itemDateStr = item.date.slice(0, 10); // YYYY-MM-DD
    const itemMonthStr = item.date.slice(0, 7); // YYYY-MM

    // Period filter
    if (mode === 'daily') {
      const targetDate = options.selectedDate || new Date().toISOString().slice(0, 10);
      if (itemDateStr !== targetDate) return false;
    } else if (mode === 'monthly') {
      const targetMonth = options.selectedMonth || new Date().toISOString().slice(0, 7);
      if (itemMonthStr !== targetMonth) return false;
    } else if (mode === 'custom') {
      if (options.startDate && itemDateStr < options.startDate) return false;
      if (options.endDate && itemDateStr > options.endDate) return false;
    }

    // Schedule type filter
    if (options.scheduleFilter && options.scheduleFilter !== 'all') {
      if (item.scheduleType !== options.scheduleFilter) return false;
    }

    // Search query filter
    if (options.searchQuery && options.searchQuery.trim()) {
      const q = options.searchQuery.toLowerCase().trim();
      const match =
        item.medicineName.toLowerCase().includes(q) ||
        item.genericName.toLowerCase().includes(q) ||
        item.patientName.toLowerCase().includes(q) ||
        item.patientPhone.toLowerCase().includes(q) ||
        (item.patientAddress || '').toLowerCase().includes(q) ||
        item.doctorName.toLowerCase().includes(q) ||
        item.transactionId.toLowerCase().includes(q) ||
        item.batchNumber.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}

/**
 * Downloads Schedule Drug Register as Excel (.xlsx)
 */
export function exportScheduleDrugXLS(
  items: ScheduleDrugItem[],
  reportTitle: string,
  periodSubtitle: string,
  filename: string
) {
  const profile = StorageService.getPharmacyProfile();
  const wb = XLSX.utils.book_new();
  const sheetData: (string | number)[][] = [];

  // Official Pharmacy Header
  sheetData.push([profile.name || 'CITY RX • CITY MEDICAL']);
  sheetData.push([`${profile.addressLine1}, ${profile.taluk}, ${profile.district}, ${profile.state} - ${profile.pincode}`]);
  sheetData.push([`Phone: ${profile.mobile} | Email: ${profile.email || 'citymedical.melur@gmail.com'}`]);
  sheetData.push([`Drug License No: ${profile.drugLicenseNo || 'TN-MDU-2024-004928 (Form 20B & 21B)'} | GSTIN: ${profile.gstin || '33AABCC5541Q1Z8'}`]);
  sheetData.push([`Supervising Pharmacist: Anusya Begum, D.Pharm (Reg No: TN-RPH-78419)`]);
  sheetData.push([]);
  sheetData.push([reportTitle.toUpperCase()]);
  sheetData.push([`Report Period: ${periodSubtitle}`]);
  sheetData.push([`Generated On: ${new Date().toLocaleString('en-IN')}`]);
  sheetData.push(['Statutory Authority: Rule 65 of the Drugs and Cosmetics Rules, 1945 (Form 35/H1 Compliance)']);
  sheetData.push([]);

  // Column Headers
  const headers = [
    'S.No',
    'Date & Time',
    'Invoice / Bill No',
    'Patient Name',
    'Age',
    'Gender',
    'Patient Address / Location',
    'Patient Mobile',
    'Prescribing Doctor',
    'Doctor Reg / Specialty',
    'Hospital / Clinic',
    'Medicine Name',
    'Molecule / Generic Name',
    'Schedule',
    'Batch No',
    'Expiry Date',
    'Qty Dispensed',
    'Unit Rate (Rs)',
    'Total Amount (Rs)',
    'Dispensing Pharmacist'
  ];
  sheetData.push(headers);

  let totalQty = 0;
  let totalVal = 0;
  let h1Count = 0;
  let hCount = 0;
  let xCount = 0;

  items.forEach((item, idx) => {
    totalQty += item.quantity;
    totalVal += item.total;
    if (item.scheduleType === 'H1') h1Count++;
    if (item.scheduleType === 'H') hCount++;
    if (item.scheduleType === 'X') xCount++;

    sheetData.push([
      idx + 1,
      new Date(item.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      item.transactionId,
      item.patientName,
      item.patientAge ? `${item.patientAge} yrs` : 'N/A',
      item.patientGender || 'Unspecified',
      item.patientAddress || 'Melur',
      item.patientPhone || 'N/A',
      item.doctorName,
      item.doctorRegNo || 'Reg. RMP',
      item.doctorClinic || 'Melur',
      item.medicineName,
      item.genericName,
      `Schedule ${item.scheduleType}`,
      item.batchNumber,
      item.expiryDate,
      item.quantity,
      item.unitPrice.toFixed(2),
      item.total.toFixed(2),
      item.cashierName
    ]);
  });

  // Summary Totals
  sheetData.push([]);
  sheetData.push(['--- STATUTORY REGISTER AUDIT SUMMARY ---']);
  sheetData.push(['Total Scheduled Transactions Dispensed:', items.length]);
  sheetData.push(['Total Schedule H1 Entries:', h1Count]);
  sheetData.push(['Total Schedule H Entries:', hCount]);
  sheetData.push(['Total Schedule X / Narcotics Entries:', xCount]);
  sheetData.push(['Total Scheduled Units Dispensed:', totalQty]);
  sheetData.push(['Total Value of Scheduled Medicines (Rs):', totalVal.toFixed(2)]);
  sheetData.push([]);
  sheetData.push(['CERTIFICATION: I hereby certify that the above entries of Schedule H/H1/X drugs were dispensed against genuine registered medical prescriptions.']);
  sheetData.push(['Registered Pharmacist Signature & Stamp: ___________________________']);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Column auto-sizing
  const colWidths = headers.map((header, colIndex) => {
    let maxLen = header.length;
    sheetData.forEach(r => {
      const val = r[colIndex];
      if (val !== undefined && val !== null) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    });
    return { wch: Math.min(Math.max(maxLen + 2, 10), 38) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Schedule Drug Register');
  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, cleanFilename);
}

/**
 * Downloads Schedule Drug Register as PDF
 */
export function exportScheduleDrugPDF(
  items: ScheduleDrugItem[],
  reportTitle: string,
  periodSubtitle: string,
  filename: string
) {
  const profile = StorageService.getPharmacyProfile();
  // Landscape orientation for multi-column statutory register
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top header banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 68, 'F');

  // Title text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.name || 'CITY RX • CITY MEDICAL', 40, 26);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    `${profile.addressLine1}, ${profile.taluk}, ${profile.district} - ${profile.pincode} | DL: ${profile.drugLicenseNo || 'TN-MDU-2024-004928'} | GSTIN: ${profile.gstin || '33AABCC5541Q1Z8'}`,
    40,
    42
  );
  doc.text(
    `Supervising Registered Pharmacist: Anusya Begum, D.Pharm (TN-RPH-78419) | Ph: ${profile.mobile}`,
    40,
    56
  );

  // Sub-header bar
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(0, 68, pageWidth, 34, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle.toUpperCase(), 40, 89);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Period: ${periodSubtitle} | Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 40, 89, { align: 'right' });

  // Summary Metrics Banner
  let totalQty = 0;
  let totalVal = 0;
  let h1Count = 0;
  let hCount = 0;
  let xCount = 0;

  items.forEach(i => {
    totalQty += i.quantity;
    totalVal += i.total;
    if (i.scheduleType === 'H1') h1Count++;
    if (i.scheduleType === 'H') hCount++;
    if (i.scheduleType === 'X') xCount++;
  });

  const tableHeaders = [
    'S.No',
    'Date',
    'Bill No',
    'Patient Name & Age',
    'Address / Location',
    'Mobile',
    'Prescribing Doctor',
    'Medicine & Generic Molecule',
    'Schedule',
    'Batch No',
    'Expiry',
    'Qty',
    'Amount (Rs)'
  ];

  const tableRows = items.map((item, idx) => [
    idx + 1,
    new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    item.transactionId,
    `${item.patientName}${item.patientAge ? ` (${item.patientAge}y)` : ''}`,
    item.patientAddress || 'Melur',
    item.patientPhone || '-',
    `${item.doctorName}\n${item.doctorRegNo || ''}`,
    `${item.medicineName}\n${item.genericName}`,
    `Sched ${item.scheduleType}`,
    item.batchNumber,
    item.expiryDate.slice(0, 7),
    item.quantity,
    item.total.toFixed(2)
  ]);

  autoTable(doc, {
    startY: 110,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 4,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' },
      1: { cellWidth: 50, halign: 'center' },
      2: { cellWidth: 70 },
      3: { cellWidth: 95 },
      4: { cellWidth: 85 },
      5: { cellWidth: 70 },
      6: { cellWidth: 95 },
      7: { cellWidth: 120 },
      8: { cellWidth: 55, halign: 'center' },
      9: { cellWidth: 55, halign: 'center' },
      10: { cellWidth: 45, halign: 'center' },
      11: { cellWidth: 32, halign: 'center' },
      12: { cellWidth: 55, halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didDrawPage: (data) => {
      // Footer page numbering
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Statutory Register under Rule 65 Drugs & Cosmetics Rules, 1945 | Page ${data.pageNumber}`,
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
      );
    }
  });

  // Get final Y position for signature block
  const finalY = (doc as any).lastAutoTable?.finalY || 450;
  
  if (finalY + 90 < pageHeight) {
    drawVerificationFooter(doc, finalY + 15, pageWidth, items.length, h1Count, hCount, totalQty, totalVal);
  } else {
    doc.addPage();
    drawVerificationFooter(doc, 40, pageWidth, items.length, h1Count, hCount, totalQty, totalVal);
  }

  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  doc.save(cleanFilename);
}

function drawVerificationFooter(
  doc: jsPDF,
  y: number,
  pageWidth: number,
  totalItems: number,
  h1Count: number,
  hCount: number,
  totalQty: number,
  totalVal: number
) {
  // Summary box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(40, y, pageWidth - 80, 75, 4, 4, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('STATUTORY AUDIT VERIFICATION SUMMARY:', 50, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`• Total Scheduled Records: ${totalItems}`, 50, y + 32);
  doc.text(`• Schedule H1 Drugs Dispensed: ${h1Count}`, 50, y + 46);
  doc.text(`• Schedule H Drugs Dispensed: ${hCount}`, 50, y + 60);

  doc.text(`• Total Units Dispensed: ${totalQty} units`, 260, y + 32);
  doc.text(`• Total Value of Dispensed Scheduled Drugs: Rs. ${totalVal.toFixed(2)}`, 260, y + 46);
  doc.text(`• Rule Compliance: Drugs & Cosmetics Rules 1945, Rule 65(9)`, 260, y + 60);

  // Pharmacist Signature Box
  doc.text('Certified by Pharmacist-in-Charge:', pageWidth - 260, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.text('Anusya Begum, D.Pharm', pageWidth - 260, y + 46);
  doc.setFont('helvetica', 'normal');
  doc.text('Reg No: TN-RPH-78419 | Stamp & Date', pageWidth - 260, y + 60);
  doc.line(pageWidth - 260, y + 42, pageWidth - 60, y + 42);
}

/**
 * Triggers native browser print for the Scheduled Drug Register
 */
export function printScheduleDrugReportWindow(
  items: ScheduleDrugItem[],
  reportTitle: string,
  periodSubtitle: string
) {
  const profile = StorageService.getPharmacyProfile();

  let totalQty = 0;
  let totalVal = 0;
  let h1Count = 0;
  let hCount = 0;
  let xCount = 0;

  items.forEach(i => {
    totalQty += i.quantity;
    totalVal += i.total;
    if (i.scheduleType === 'H1') h1Count++;
    if (i.scheduleType === 'H') hCount++;
    if (i.scheduleType === 'X') xCount++;
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up blocked. Please allow pop-ups for this site to print the report.');
    return;
  }

  const rowsHtml = items
    .map(
      (item, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>${new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}<br><small style="color: #64748b;">${new Date(item.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</small></td>
        <td style="font-weight: 700; font-family: monospace;">${item.transactionId}</td>
        <td><strong>${item.patientName}</strong>${item.patientAge ? `<br><small>${item.patientAge} yrs • ${item.patientGender || ''}</small>` : ''}</td>
        <td>${item.patientAddress || 'Melur, Madurai'}</td>
        <td style="font-family: monospace;">${item.patientPhone || '-'}</td>
        <td><strong>${item.doctorName}</strong><br><small style="color: #475569;">${item.doctorRegNo || 'RMP'}</small></td>
        <td><strong>${item.medicineName}</strong><br><small style="color: #047857;">${item.genericName}</small></td>
        <td style="text-align: center;"><span class="badge badge-${item.scheduleType.toLowerCase()}">Schedule ${item.scheduleType}</span></td>
        <td style="font-family: monospace; text-align: center;">${item.batchNumber}</td>
        <td style="text-align: center;">${item.expiryDate.slice(0, 7)}</td>
        <td style="text-align: center; font-weight: bold;">${item.quantity}</td>
        <td style="text-align: right; font-family: monospace;">₹${item.total.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${reportTitle} - ${profile.name}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            margin: 0;
            padding: 16px;
            color: #0f172a;
            font-size: 11px;
            line-height: 1.3;
          }
          .header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .pharmacy-name {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .sub-meta {
            font-size: 10px;
            color: #475569;
            margin-top: 3px;
          }
          .report-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f1f5f9;
            padding: 8px 12px;
            border-radius: 4px;
            margin-bottom: 12px;
          }
          .report-title {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
          }
          .report-period {
            font-size: 11px;
            font-weight: 600;
            color: #334155;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          th {
            background-color: #0f172a;
            color: white;
            padding: 6px 4px;
            text-align: left;
            font-weight: 700;
            border: 1px solid #334155;
            font-size: 9px;
            text-transform: uppercase;
          }
          td {
            padding: 5px 4px;
            border: 1px solid #cbd5e1;
            vertical-align: top;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .badge {
            display: inline-block;
            padding: 2px 5px;
            border-radius: 3px;
            font-weight: 700;
            font-size: 8px;
            text-transform: uppercase;
          }
          .badge-h1 { background: #ffe4e6; color: #9f1239; border: 1px solid #f43f5e; }
          .badge-h { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
          .badge-x { background: #f3e8ff; color: #6b21a8; border: 1px solid #a855f7; }
          .badge-g { background: #dbeafe; color: #1e40af; border: 1px solid #3b82f6; }
          .summary-box {
            margin-top: 14px;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            padding: 10px 14px;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .summary-metrics {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px 16px;
            font-size: 10px;
          }
          .sign-box {
            text-align: right;
            min-width: 220px;
          }
          .sign-line {
            border-bottom: 1px solid #0f172a;
            height: 35px;
            margin-bottom: 4px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="pharmacy-name">${profile.name || 'CITY RX • CITY MEDICAL'}</div>
          <div class="sub-meta">${profile.addressLine1}, ${profile.taluk}, ${profile.district}, ${profile.state} - ${profile.pincode} | Ph: ${profile.mobile}</div>
          <div class="sub-meta">Drug License No: <strong>${profile.drugLicenseNo || 'TN-MDU-2024-004928 (Form 20B & 21B)'}</strong> | GSTIN: <strong>${profile.gstin || '33AABCC5541Q1Z8'}</strong> | Registered Pharmacist: <strong>Anusya Begum, D.Pharm (TN-RPH-78419)</strong></div>
        </div>

        <div class="report-bar">
          <div class="report-title">${reportTitle}</div>
          <div class="report-period">Period: ${periodSubtitle} | Generated: ${new Date().toLocaleDateString('en-IN')}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">S.No</th>
              <th style="width: 60px;">Date & Time</th>
              <th style="width: 70px;">Bill No</th>
              <th style="width: 105px;">Patient Details</th>
              <th style="width: 85px;">Address / Location</th>
              <th style="width: 75px;">Mobile</th>
              <th style="width: 100px;">Prescribing Doctor</th>
              <th>Medicine & Salt</th>
              <th style="width: 65px; text-align: center;">Schedule</th>
              <th style="width: 60px; text-align: center;">Batch</th>
              <th style="width: 50px; text-align: center;">Expiry</th>
              <th style="width: 35px; text-align: center;">Qty</th>
              <th style="width: 60px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="summary-box">
          <div class="summary-metrics">
            <div><strong>Total Scheduled Bills:</strong> ${items.length}</div>
            <div><strong>Schedule H1 Entries:</strong> ${h1Count}</div>
            <div><strong>Schedule H Entries:</strong> ${hCount}</div>
            <div><strong>Schedule X / Narcotics:</strong> ${xCount}</div>
            <div><strong>Total Units Dispensed:</strong> ${totalQty} units</div>
            <div><strong>Total Dispensed Value:</strong> ₹${totalVal.toFixed(2)}</div>
            <div style="grid-column: span 3; font-style: italic; color: #475569; margin-top: 4px;">
              Statutory Declaration: Maintained under Rule 65(9) of the Drugs & Cosmetics Rules, 1945. All entries strictly verified against authentic Medical Practitioner Prescriptions.
            </div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div style="font-weight: 700;">Anusya Begum, D.Pharm</div>
            <div style="font-size: 9px; color: #475569;">Registered Pharmacist (TN-RPH-78419)</div>
            <div style="font-size: 8px; color: #64748b;">Seal & Date</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
