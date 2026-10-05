import * as XLSX from 'xlsx';
import { Medicine, Batch, DosageForm, StockAdjustment } from '../types';
import { StorageService } from '../services/storage';
import { normalizeFormName } from './productFormUtils';
import { parseExpiryDate } from './dateUtils';

export interface ParsedInventoryRow {
  id: string; // temporary row key for UI
  originalRowIndex: number;
  name: string;
  genericName: string;
  strength: string;
  form: DosageForm;
  manufacturer: string;
  category: string;
  batchNumber: string;
  expiryDate: string; // Stored as YYYY-MM-DD or MM/YYYY
  manufacturingDate?: string;
  stock: number;
  costPrice: number;
  sellingPrice: number;
  mrp: number;
  taxRate: number;
  hsnCode: string;
  minStockAlert: number;
  rackLocation: string;
  barcode: string;
  prescriptionRequired: boolean;
  scheduleType?: 'H' | 'H1' | 'X' | 'G' | 'Narcotic' | 'OTC';
  pack?: string;
  packSize?: number;
  status: 'valid' | 'warning' | 'error';
  validationIssues: string[];
  isExcluded: boolean;
}

export interface BulkImportResult {
  success: boolean;
  createdMedicinesCount: number;
  updatedMedicinesCount: number;
  totalBatchesAdded: number;
  totalStockAdded: number;
  totalValuationAdded: number;
  error?: string;
}

// Column alias mappings for ultra-flexible CSV & Excel import
const COLUMN_ALIASES: Record<string, string[]> = {
  name: ['medicinename', 'medicine', 'itemname', 'productname', 'product', 'brandname', 'brand', 'name', 'drugname', 'drug'],
  genericName: ['genericname', 'generic', 'molecule', 'salt', 'composition', 'genericsalt', 'activeingredient'],
  strength: ['strength', 'dosage', 'power', 'potency', 'mg', 'dose'],
  form: ['form', 'dosageform', 'type', 'itemtype', 'productform'],
  manufacturer: ['manufacturer', 'mfr', 'company', 'mfgby', 'brandowner', 'pharma'],
  category: ['category', 'therapeuticcategory', 'drugclass', 'group', 'class'],
  batchNumber: ['batchnumber', 'batchno', 'batch', 'lot', 'lotnumber', 'lotno', 'bno'],
  expiryDate: ['expirydate', 'expiry', 'expdate', 'exp', 'validtill', 'useby'],
  manufacturingDate: ['mfgdate', 'mfg', 'manufacturingdate', 'manufacturedate'],
  stock: ['stock', 'initialstock', 'quantity', 'qty', 'units', 'openingstock', 'currentstock'],
  costPrice: ['costprice', 'cost', 'purchaserate', 'purchaseprice', 'buyprice', 'pts', 'rate'],
  sellingPrice: ['sellingprice', 'saleprice', 'retailprice', 'ptr', 'salerate'],
  mrp: ['mrp', 'maxretailprice', 'retailmrp', 'maximumretailprice'],
  taxRate: ['taxrate', 'tax', 'gst', 'gst%', 'gstrate', 'vat', 'tax%'],
  hsnCode: ['hsncode', 'hsn', 'hsn_code', 'sac'],
  minStockAlert: ['minstockalert', 'minstock', 'reorderlevel', 'reorderpoint', 'alertstock', 'minlevel'],
  rackLocation: ['racklocation', 'rack', 'location', 'shelf', 'bin', 'rackno', 'storagebin'],
  barcode: ['barcode', 'ean', 'ean13', 'upc', 'gtin', 'code'],
  prescriptionRequired: ['prescriptionrequired', 'rx', 'prescription', 'rxrequired', 'isrx'],
  scheduleType: ['scheduletype', 'schedule', 'druggroup'],
  pack: ['pack', 'packtype', 'packing', 'packaging'],
  packSize: ['packsize', 'unitsperpack', 'stripcapacity', 'looseunits']
};

/**
 * Identify the standard field name from a raw header string
 */
function normalizeHeaderKey(rawHeader: string): string | null {
  const clean = rawHeader.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [canonicalKey, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (canonicalKey.toLowerCase() === clean) return canonicalKey;
    if (aliases.includes(clean)) return canonicalKey;
  }
  return null;
}

/**
 * Format date value from CSV or Excel (handles Excel serial numbers, MM/YYYY, DD/MM/YYYY, etc.)
 */
function normalizeExpiryDate(rawVal: any): string {
  if (rawVal == null || rawVal === '') {
    // Default to 1 year from now
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-28`;
  }

  // Handle Excel numeric serial dates (e.g. 45678)
  if (typeof rawVal === 'number' && rawVal > 20000 && rawVal < 70000) {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + rawVal * 86400000);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  }

  const str = String(rawVal).trim();
  const parsed = parseExpiryDate(str);
  if (parsed && !isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return str;
}

/**
 * Parse a raw text or buffer into tabular rows of records
 */
export async function parseInventoryCsvOrExcel(
  input: File | string
): Promise<{ rows: ParsedInventoryRow[]; headersDetected: string[]; error?: string }> {
  try {
    let rawRecords: Record<string, any>[] = [];
    let detectedHeaders: string[] = [];

    if (typeof input === 'string') {
      // Direct raw CSV/TSV text string
      const wb = XLSX.read(input, { type: 'string', raw: false });
      const firstSheetName = wb.SheetNames[0];
      const ws = wb.Sheets[firstSheetName];
      rawRecords = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
      detectedHeaders = rawRecords.length > 0 ? Object.keys(rawRecords[0]) : [];
    } else {
      // File object: read as ArrayBuffer
      const buffer = await input.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: false });
      const firstSheetName = wb.SheetNames[0];
      if (!firstSheetName) {
        return { rows: [], headersDetected: [], error: 'Uploaded spreadsheet contains no sheets.' };
      }
      const ws = wb.Sheets[firstSheetName];
      rawRecords = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
      detectedHeaders = rawRecords.length > 0 ? Object.keys(rawRecords[0]) : [];
    }

    if (!rawRecords || rawRecords.length === 0) {
      return { rows: [], headersDetected: detectedHeaders, error: 'File is empty or contains no data rows.' };
    }

    // Map column headers to canonical keys
    const headerMapping: Record<string, string> = {};
    for (const rawCol of detectedHeaders) {
      const canonical = normalizeHeaderKey(rawCol);
      if (canonical) {
        headerMapping[rawCol] = canonical;
      }
    }

    // Process every row
    const rows: ParsedInventoryRow[] = [];
    const seenBatches = new Set<string>();

    rawRecords.forEach((record, index) => {
      const mapped: Record<string, any> = {};
      for (const [colName, val] of Object.entries(record)) {
        const canonicalKey = headerMapping[colName];
        if (canonicalKey) {
          mapped[canonicalKey] = val;
        } else {
          // Check if colName matches directly
          const fallbackKey = normalizeHeaderKey(colName);
          if (fallbackKey) {
            mapped[fallbackKey] = val;
          }
        }
      }

      // Extract and sanitize fields
      const rawName = String(mapped.name || '').trim();
      const rawGeneric = String(mapped.genericName || '').trim() || rawName;
      const rawStrength = String(mapped.strength || '').trim() || 'Standard';
      const rawFormStr = String(mapped.form || '').trim() || 'Tablet';
      const form = normalizeFormName(rawFormStr) as DosageForm;
      const rawManufacturer = String(mapped.manufacturer || '').trim() || 'Standard Healthcare';
      const rawCategory = String(mapped.category || '').trim() || 'General Medicine';

      // Batch & stock
      const rawBatchNo = String(mapped.batchNumber || '').trim().toUpperCase() || `BAT-${String(index + 1).padStart(3, '0')}`;
      const expiryDate = normalizeExpiryDate(mapped.expiryDate);
      const stock = Math.max(0, Number(mapped.stock) || 0);

      // Financials
      const costPrice = Math.max(0, Number(mapped.costPrice) || 0);
      let mrp = Math.max(0, Number(mapped.mrp) || 0);
      let sellingPrice = Math.max(0, Number(mapped.sellingPrice) || 0);

      // Smart pricing defaults
      if (mrp === 0 && sellingPrice > 0) {
        mrp = sellingPrice;
      } else if (mrp === 0 && costPrice > 0) {
        mrp = Math.round(costPrice * 1.35 * 100) / 100;
      }
      if (sellingPrice === 0 && mrp > 0) {
        sellingPrice = mrp;
      } else if (sellingPrice === 0 && costPrice > 0) {
        sellingPrice = Math.round(costPrice * 1.25 * 100) / 100;
      }

      // GST & Compliance
      const taxRate = Number(mapped.taxRate) || (costPrice > 0 ? 12 : 12);
      const hsnCode = String(mapped.hsnCode || '').trim() || '300490';
      const minStockAlert = Math.max(0, Number(mapped.minStockAlert) || 20);
      const rackLocation = String(mapped.rackLocation || '').trim() || 'Rack A-1';
      const barcode = String(mapped.barcode || '').trim();

      // Rx
      const rawRx = String(mapped.prescriptionRequired || '').toLowerCase().trim();
      const prescriptionRequired = ['true', 'yes', '1', 'y', 'rx'].includes(rawRx);

      // Validation
      const validationIssues: string[] = [];
      let status: 'valid' | 'warning' | 'error' = 'valid';

      if (!rawName) {
        status = 'error';
        validationIssues.push('Medicine Name is missing');
      }

      // Expiry validation
      const parsedExp = parseExpiryDate(expiryDate);
      if (!parsedExp || isNaN(parsedExp.getTime())) {
        status = 'warning';
        validationIssues.push('Unrecognized expiry date format');
      } else {
        const now = new Date();
        if (parsedExp < now) {
          status = 'warning';
          validationIssues.push('Batch is already expired');
        }
      }

      if (costPrice > sellingPrice && costPrice > 0 && sellingPrice > 0) {
        if (status !== 'error') status = 'warning';
        validationIssues.push(`Cost Price (₹${costPrice}) is higher than Selling Price (₹${sellingPrice})`);
      }

      const batchKey = `${rawName.toLowerCase()}__${rawBatchNo.toLowerCase()}`;
      if (seenBatches.has(batchKey)) {
        if (status !== 'error') status = 'warning';
        validationIssues.push(`Duplicate batch "${rawBatchNo}" for this drug in file`);
      }
      seenBatches.add(batchKey);

      rows.push({
        id: `row-${index}-${Date.now()}`,
        originalRowIndex: index + 1,
        name: rawName,
        genericName: rawGeneric,
        strength: rawStrength,
        form,
        manufacturer: rawManufacturer,
        category: rawCategory,
        batchNumber: rawBatchNo,
        expiryDate,
        stock,
        costPrice,
        sellingPrice,
        mrp,
        taxRate,
        hsnCode,
        minStockAlert,
        rackLocation,
        barcode,
        prescriptionRequired,
        pack: mapped.pack ? String(mapped.pack).trim() : undefined,
        packSize: mapped.packSize ? Number(mapped.packSize) : undefined,
        status,
        validationIssues,
        isExcluded: status === 'error' // Exclude invalid rows by default
      });
    });

    return {
      rows,
      headersDetected: detectedHeaders
    };
  } catch (err: any) {
    return {
      rows: [],
      headersDetected: [],
      error: err?.message || 'Failed to parse file. Please verify CSV or Excel format.'
    };
  }
}

/**
 * Sample dataset for pre-populated template download
 */
export const SAMPLE_TEMPLATE_ROWS = [
  {
    'Medicine Name': 'Dolo 650',
    'Generic Name': 'Paracetamol / Acetaminophen',
    'Strength': '650 mg',
    'Dosage Form': 'Tablet',
    'Manufacturer': 'Micro Labs Ltd',
    'Category': 'Analgesic',
    'Batch Number': 'DL-881A',
    'Expiry Date': '12/2027',
    'Initial Stock': 100,
    'Cost Price': 21.50,
    'Selling Price': 30.50,
    'MRP': 32.00,
    'Tax Rate (%)': 12,
    'HSN Code': '300490',
    'Min Stock Alert': 30,
    'Rack Location': 'Rack A-01',
    'Barcode': '8901234567890',
    'Prescription Required': 'No'
  },
  {
    'Medicine Name': 'Augmentin 625 Duo',
    'Generic Name': 'Amoxicillin and Potassium Clavulanate',
    'Strength': '625 mg',
    'Dosage Form': 'Tablet',
    'Manufacturer': 'GlaxoSmithKline',
    'Category': 'Antibiotic',
    'Batch Number': 'AUG-490',
    'Expiry Date': '08/2027',
    'Initial Stock': 40,
    'Cost Price': 148.00,
    'Selling Price': 195.00,
    'MRP': 204.00,
    'Tax Rate (%)': 12,
    'HSN Code': '300490',
    'Min Stock Alert': 15,
    'Rack Location': 'Rack B-03',
    'Barcode': '8901234567891',
    'Prescription Required': 'Yes'
  },
  {
    'Medicine Name': 'Pan 40',
    'Generic Name': 'Pantoprazole Sodium',
    'Strength': '40 mg',
    'Dosage Form': 'Tablet',
    'Manufacturer': 'Alkem Laboratories',
    'Category': 'Antacid',
    'Batch Number': 'PN-102K',
    'Expiry Date': '05/2028',
    'Initial Stock': 60,
    'Cost Price': 98.00,
    'Selling Price': 142.00,
    'MRP': 155.00,
    'Tax Rate (%)': 12,
    'HSN Code': '300490',
    'Min Stock Alert': 20,
    'Rack Location': 'Rack A-04',
    'Barcode': '8901234567892',
    'Prescription Required': 'No'
  },
  {
    'Medicine Name': 'Ascoril LS Syrup',
    'Generic Name': 'Levosalbutamol, Ambroxol, Guaiphenesin',
    'Strength': '100 ml',
    'Dosage Form': 'Syrup',
    'Manufacturer': 'Glenmark Pharmaceuticals',
    'Category': 'Respiratory',
    'Batch Number': 'ASC-772',
    'Expiry Date': '09/2027',
    'Initial Stock': 25,
    'Cost Price': 78.50,
    'Selling Price': 112.00,
    'MRP': 118.00,
    'Tax Rate (%)': 12,
    'HSN Code': '300490',
    'Min Stock Alert': 10,
    'Rack Location': 'Syrup Shelf S-1',
    'Barcode': '8901234567893',
    'Prescription Required': 'Yes'
  },
  {
    'Medicine Name': 'Betadine 10% Ointment',
    'Generic Name': 'Povidone Iodine',
    'Strength': '20 g',
    'Dosage Form': 'Ointment',
    'Manufacturer': 'Win-Medicare',
    'Category': 'Antiseptic',
    'Batch Number': 'BTD-319',
    'Expiry Date': '11/2027',
    'Initial Stock': 30,
    'Cost Price': 62.00,
    'Selling Price': 88.00,
    'MRP': 95.00,
    'Tax Rate (%)': 12,
    'HSN Code': '300490',
    'Min Stock Alert': 10,
    'Rack Location': 'Ointment Rack O-2',
    'Barcode': '8901234567894',
    'Prescription Required': 'No'
  },
  {
    'Medicine Name': 'Monocef 1g Injection',
    'Generic Name': 'Ceftriaxone Sodium',
    'Strength': '1 g',
    'Dosage Form': 'Injection',
    'Manufacturer': 'Aristo Pharmaceuticals',
    'Category': 'Antibiotic',
    'Batch Number': 'MN-901B',
    'Expiry Date': '03/2028',
    'Initial Stock': 50,
    'Cost Price': 45.00,
    'Selling Price': 65.00,
    'MRP': 72.00,
    'Tax Rate (%)': 12,
    'HSN Code': '300490',
    'Min Stock Alert': 20,
    'Rack Location': 'Cold Storage / Fridge',
    'Barcode': '8901234567895',
    'Prescription Required': 'Yes'
  }
];

/**
 * Trigger download of standardized CSV template
 */
export function downloadInventoryCsvTemplate(): void {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE_ROWS);
  const csvOutput = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `pharmacy_inventory_import_template_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger download of formatted Excel (.xlsx) template
 */
export function downloadInventoryExcelTemplate(): void {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE_ROWS);
  ws['!cols'] = [
    { wch: 22 }, // Medicine Name
    { wch: 32 }, // Generic Name
    { wch: 12 }, // Strength
    { wch: 14 }, // Dosage Form
    { wch: 24 }, // Manufacturer
    { wch: 18 }, // Category
    { wch: 14 }, // Batch Number
    { wch: 14 }, // Expiry Date
    { wch: 12 }, // Initial Stock
    { wch: 12 }, // Cost Price
    { wch: 14 }, // Selling Price
    { wch: 10 }, // MRP
    { wch: 12 }, // Tax Rate
    { wch: 12 }, // HSN Code
    { wch: 14 }, // Min Stock Alert
    { wch: 18 }, // Rack Location
    { wch: 16 }, // Barcode
    { wch: 20 }  // Rx Required
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory Master Template');
  XLSX.writeFile(wb, `pharmacy_inventory_import_template_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Execute the bulk import into StorageService
 */
export function executeBulkInventoryImport(
  rows: ParsedInventoryRow[],
  options: { mergeExisting: boolean } = { mergeExisting: true }
): BulkImportResult {
  try {
    const validRows = rows.filter(r => !r.isExcluded && r.name.trim().length > 0);
    if (validRows.length === 0) {
      return {
        success: false,
        createdMedicinesCount: 0,
        updatedMedicinesCount: 0,
        totalBatchesAdded: 0,
        totalStockAdded: 0,
        totalValuationAdded: 0,
        error: 'No active valid rows selected for import.'
      };
    }

    const currentMedicines = StorageService.getMedicines();
    let createdCount = 0;
    let updatedCount = 0;
    let batchesAdded = 0;
    let totalStockAdded = 0;
    let totalValuationAdded = 0;

    const affectedMedIds: string[] = [];
    const nowIso = new Date().toISOString();

    validRows.forEach((row, idx) => {
      const cleanName = row.name.trim();
      const normName = cleanName.toLowerCase();
      const normStrength = (row.strength || '').toLowerCase().trim();

      // Look for existing medicine by name & strength (or generic match)
      let existingMed: Medicine | undefined = undefined;
      if (options.mergeExisting) {
        existingMed = currentMedicines.find(m => {
          const mName = m.name.toLowerCase().trim();
          const mStrength = (m.strength || '').toLowerCase().trim();
          return mName === normName && (!normStrength || mStrength === normStrength);
        });
      }

      const newBatch: Batch = {
        batchNumber: row.batchNumber || `BAT-${Date.now().toString().slice(-4)}`,
        expiryDate: row.expiryDate,
        manufacturingDate: row.manufacturingDate || nowIso.split('T')[0],
        stock: row.stock,
        costPrice: row.costPrice,
        sellingPrice: row.sellingPrice,
        mrp: row.mrp,
        location: row.rackLocation || 'Rack A-1',
        barcode: row.barcode || undefined
      };

      totalStockAdded += row.stock;
      totalValuationAdded += row.stock * row.costPrice;

      if (existingMed) {
        // Merge into existing medicine record
        const batchIdx = existingMed.batches.findIndex(
          b => b.batchNumber.toLowerCase() === newBatch.batchNumber.toLowerCase()
        );

        if (batchIdx >= 0) {
          // Update existing batch stock & prices
          existingMed.batches[batchIdx] = {
            ...existingMed.batches[batchIdx],
            stock: existingMed.batches[batchIdx].stock + newBatch.stock,
            costPrice: newBatch.costPrice || existingMed.batches[batchIdx].costPrice,
            sellingPrice: newBatch.sellingPrice || existingMed.batches[batchIdx].sellingPrice,
            mrp: newBatch.mrp || existingMed.batches[batchIdx].mrp,
            expiryDate: newBatch.expiryDate || existingMed.batches[batchIdx].expiryDate,
            location: newBatch.location || existingMed.batches[batchIdx].location
          };
        } else {
          // Add new batch to existing medicine
          existingMed.batches.push(newBatch);
          batchesAdded++;
        }

        // Fill in any blanks
        if (!existingMed.rackLocation && row.rackLocation) {
          existingMed.rackLocation = row.rackLocation;
        }
        if (!existingMed.barcode && row.barcode) {
          existingMed.barcode = row.barcode;
        }

        updatedCount++;
        affectedMedIds.push(existingMed.id);
      } else {
        // Create brand new Medicine master SKU
        const newMedId = `med-imp-${Date.now()}-${idx}`;
        const newMedicine: Medicine = {
          id: newMedId,
          name: cleanName,
          genericName: row.genericName || cleanName,
          strength: row.strength || 'Standard',
          form: row.form,
          manufacturer: row.manufacturer || 'City Pharma',
          category: row.category || 'General Medicine',
          prescriptionRequired: row.prescriptionRequired,
          scheduleType: row.scheduleType || (row.prescriptionRequired ? 'H' : 'OTC'),
          hsnCode: row.hsnCode || '300490',
          taxRate: row.taxRate || 12,
          minStockAlert: row.minStockAlert || 20,
          rackLocation: row.rackLocation || 'Rack A-1',
          barcode: row.barcode || undefined,
          pack: row.pack || `${row.form} Pack`,
          packSize: row.packSize || 10,
          batches: [newBatch]
        };

        currentMedicines.push(newMedicine);
        createdCount++;
        batchesAdded++;
        affectedMedIds.push(newMedId);
      }

      // Record initial onboarding stock adjustment entry
      if (row.stock > 0) {
        const medIdForAudit = existingMed ? existingMed.id : `med-imp-${Date.now()}-${idx}`;
        const adjustment: StockAdjustment = {
          id: `ADJ-CSV-${Date.now().toString().slice(-6)}-${idx}`,
          date: nowIso,
          type: 'ADD',
          medicineId: medIdForAudit,
          medicineName: cleanName,
          batchNumber: newBatch.batchNumber,
          quantity: row.stock,
          previousStock: existingMed ? (existingMed.batches.find(b => b.batchNumber === newBatch.batchNumber)?.stock ?? 0) - row.stock : 0,
          newStock: row.stock,
          reason: 'Initial Bulk Onboarding CSV Import',
          customNotes: `Batch ${newBatch.batchNumber} with initial stock ${row.stock} imported via CSV`,
          adjustedBy: 'Pharmacy Onboarding System'
        };
        StorageService.recordStockAdjustments([adjustment]);
      }
    });

    // Save master updated medicines
    StorageService.saveMedicines(currentMedicines);

    // Notify low stock triggers
    if (affectedMedIds.length > 0) {
      StorageService.notifyLowStockChanges(affectedMedIds);
    }

    return {
      success: true,
      createdMedicinesCount: createdCount,
      updatedMedicinesCount: updatedCount,
      totalBatchesAdded: batchesAdded,
      totalStockAdded,
      totalValuationAdded
    };
  } catch (err: any) {
    return {
      success: false,
      createdMedicinesCount: 0,
      updatedMedicinesCount: 0,
      totalBatchesAdded: 0,
      totalStockAdded: 0,
      totalValuationAdded: 0,
      error: err?.message || 'Error executing bulk import.'
    };
  }
}
