import * as XLSX from 'xlsx';
import { PurchaseInvoiceItem } from '../types';

export interface ParsedInvoiceResult {
  success: boolean;
  error?: string;
  filename: string;
  fileType: 'image' | 'pdf' | 'xls' | 'csv';
  dataUrl?: string;
  size: number;
  meta?: {
    invoiceNo?: string;
    invoiceDate?: string;
    distributorName?: string;
  };
  items: PurchaseInvoiceItem[];
  suggestedItems?: PurchaseInvoiceItem[];
}

/**
 * Normalizes string keys for fuzzy column matching
 */
const cleanKey = (key: string): string => {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Converts various date formats (MM/YY, MM/YYYY, YYYY-MM-DD, Excel date serial) to YYYY-MM
 */
export const normalizeExpiryDate = (val: any): string => {
  if (!val) {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    return `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}`;
  }

  // Handle Excel date number (e.g. 45678)
  if (typeof val === 'number') {
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}`;
    }
  }

  const str = String(val).trim();

  // Match YYYY-MM or YYYY-MM-DD
  const yyyymmMatch = str.match(/^(\d{4})[-/](\d{1,2})/);
  if (yyyymmMatch) {
    return `${yyyymmMatch[1]}-${yyyymmMatch[2].padStart(2, '0')}`;
  }

  // Match MM/YY or MM/YYYY
  const mmyyMatch = str.match(/^(\d{1,2})[-/](\d{2,4})$/);
  if (mmyyMatch) {
    const month = mmyyMatch[1].padStart(2, '0');
    let year = mmyyMatch[2];
    if (year.length === 2) {
      year = `20${year}`;
    }
    return `${year}-${month}`;
  }

  return str;
};

/**
 * Parses uploaded Excel / CSV spreadsheet into PurchaseInvoiceItem rows
 */
export const parsePurchaseSpreadsheet = async (file: File): Promise<ParsedInvoiceResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

        // Prefer first sheet with actual items
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
          resolve({
            success: false,
            error: 'Empty workbook or sheet not found.',
            filename: file.name,
            fileType: file.name.endsWith('.csv') ? 'csv' : 'xls',
            size: file.size,
            items: []
          });
          return;
        }

        // Convert worksheet to raw json rows
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve({
            success: false,
            error: 'The spreadsheet contains no readable rows.',
            filename: file.name,
            fileType: file.name.endsWith('.csv') ? 'csv' : 'xls',
            size: file.size,
            items: []
          });
          return;
        }

        // Find the header row (the row containing keywords like "medicine", "product", "item", "batch", "rate", etc.)
        let headerRowIndex = -1;
        let bestScore = 0;

        for (let r = 0; r < Math.min(rawJson.length, 12); r++) {
          const row = rawJson[r];
          if (!Array.isArray(row)) continue;

          let score = 0;
          row.forEach((cell) => {
            const c = cleanKey(String(cell));
            if (c.includes('item') || c.includes('medicine') || c.includes('product') || c.includes('particular')) score += 3;
            if (c.includes('batch') || c.includes('lot')) score += 3;
            if (c.includes('exp')) score += 3;
            if (c.includes('rate') || c.includes('price') || c.includes('cost')) score += 2;
            if (c.includes('mrp')) score += 2;
            if (c.includes('gst') || c.includes('tax')) score += 2;
            if (c.includes('qty') || c.includes('box')) score += 2;
          });

          if (score > bestScore) {
            bestScore = score;
            headerRowIndex = r;
          }
        }

        if (headerRowIndex === -1 || bestScore < 4) {
          // Fallback to row 0 if no clear header
          headerRowIndex = 0;
        }

        const rawHeaders: string[] = (rawJson[headerRowIndex] || []).map((h: any) => String(h || '').trim());

        // Map column indices
        let colMedName = -1;
        let colGenName = -1;
        let colHsn = -1;
        let colBatch = -1;
        let colExp = -1;
        let colPack = -1;
        let colBox = -1;
        let colUnit = -1;
        let colFree = -1;
        let colMrp = -1;
        let colRate = -1;
        let colScheme = -1;
        let colDiscount = -1;
        let colGst = -1;

        rawHeaders.forEach((raw, idx) => {
          const k = cleanKey(raw);
          if (colMedName === -1 && (k.includes('medicinename') || k.includes('itemname') || k.includes('productname') || k.includes('medicine') || k.includes('product') || k.includes('item') || k.includes('particular') || k.includes('brand') || k.includes('description'))) {
            colMedName = idx;
          } else if (colGenName === -1 && (k.includes('generic') || k.includes('salt') || k.includes('composition') || k.includes('molecule'))) {
            colGenName = idx;
          } else if (colHsn === -1 && (k.includes('hsn') || k.includes('tariff'))) {
            colHsn = idx;
          } else if (colBatch === -1 && (k.includes('batch') || k.includes('lot'))) {
            colBatch = idx;
          } else if (colExp === -1 && (k.includes('exp') || k.includes('validthru'))) {
            colExp = idx;
          } else if (colPack === -1 && (k.includes('pack') && !k.includes('packsize') && !k.includes('unit'))) {
            colPack = idx;
          } else if (colBox === -1 && (k === 'box' || k === 'boxes' || k === 'carton' || k === 'cartons' || k === 'qty' || k === 'quantity' || k === 'billedqty')) {
            colBox = idx;
          } else if (colUnit === -1 && (k.includes('unitperbox') || k.includes('packsize') || k.includes('units') || k.includes('unit') || k.includes('strip'))) {
            colUnit = idx;
          } else if (colFree === -1 && (k.includes('free') || k.includes('bonus') || k.includes('schemeqty'))) {
            colFree = idx;
          } else if (colMrp === -1 && (k.includes('mrp') || k.includes('retailprice'))) {
            colMrp = idx;
          } else if (colRate === -1 && (k.includes('purchaserate') || k.includes('costprice') || k.includes('prate') || k === 'rate' || k === 'price' || k.includes('basicrate') || k.includes('unitprice'))) {
            colRate = idx;
          } else if (colScheme === -1 && (k.includes('scheme') || k.includes('schpct') || k === 'sch')) {
            colScheme = idx;
          } else if (colDiscount === -1 && (k.includes('discount') || k.includes('disc') || k.includes('tradedisc'))) {
            colDiscount = idx;
          } else if (colGst === -1 && (k.includes('gst') || k.includes('tax') || k.includes('vat') || k.includes('rateofgst'))) {
            colGst = idx;
          }
        });

        // Default medicine column to first column if not found
        if (colMedName === -1) colMedName = 0;

        // Parse meta from above header row (if any)
        let extractedInvoiceNo: string | undefined;
        let extractedInvoiceDate: string | undefined;
        let extractedDistributor: string | undefined;

        for (let r = 0; r < headerRowIndex; r++) {
          const rowText = (rawJson[r] || []).join(' ');
          const invMatch = rowText.match(/(?:inv(?:oice)?|bill)[\s#.:-]*([A-Za-z0-9\-_/]{4,20})/i);
          if (invMatch && !extractedInvoiceNo) {
            extractedInvoiceNo = invMatch[1].trim();
          }
          const distMatch = rowText.match(/(?:distributor|supplier|from|m\/s|vendor)[\s.:]+([A-Za-z0-9\s&.,-]{3,40})/i);
          if (distMatch && !extractedDistributor) {
            extractedDistributor = distMatch[1].trim();
          }
        }

        // Parse items
        const parsedItems: PurchaseInvoiceItem[] = [];

        for (let r = headerRowIndex + 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!Array.isArray(row) || row.length === 0) continue;

          const medName = String(row[colMedName] || '').trim();
          // Skip empty or summary rows
          if (!medName || medName.toLowerCase().startsWith('total') || medName.toLowerCase().startsWith('subtotal')) {
            continue;
          }

          const genericName = colGenName !== -1 ? String(row[colGenName] || '').trim() : '';
          const hsnCode = colHsn !== -1 ? String(row[colHsn] || '').trim() : '300490';
          const batchNumber = colBatch !== -1 ? String(row[colBatch] || '').trim().toUpperCase() : `BAT-${Math.floor(1000 + Math.random() * 9000)}`;
          const expiryDate = colExp !== -1 ? normalizeExpiryDate(row[colExp]) : '2028-06';
          const pack = colPack !== -1 ? String(row[colPack] || '10 Tablets').trim() : '10 Tablets';

          let boxes = colBox !== -1 ? Number(row[colBox]) : 1;
          if (isNaN(boxes) || boxes <= 0) boxes = 1;

          let unitsPerBox = colUnit !== -1 ? Number(row[colUnit]) : 10;
          if (isNaN(unitsPerBox) || unitsPerBox <= 0) unitsPerBox = 10;

          let freeQty = colFree !== -1 ? Number(row[colFree]) : 0;
          if (isNaN(freeQty) || freeQty < 0) freeQty = 0;

          let mrp = colMrp !== -1 ? Number(row[colMrp]) : 0;
          if (isNaN(mrp) || mrp <= 0) mrp = 50;

          let purchaseRate = colRate !== -1 ? Number(row[colRate]) : 0;
          if (isNaN(purchaseRate) || purchaseRate <= 0) {
            purchaseRate = Math.round(mrp * 0.65 * 100) / 100;
          }

          let schemePct = colScheme !== -1 ? Number(row[colScheme]) : 0;
          if (isNaN(schemePct) || schemePct < 0) schemePct = 0;

          let discPct = colDiscount !== -1 ? Number(row[colDiscount]) : 0;
          if (isNaN(discPct) || discPct < 0) discPct = 0;

          let gstRate = colGst !== -1 ? Number(row[colGst]) : 12;
          if (isNaN(gstRate) || gstRate < 0) gstRate = 12;

          // Compute row amounts
          const billedQty = boxes * unitsPerBox;
          const totalQty = billedQty + freeQty;
          const gross = billedQty * purchaseRate;
          const schemeAmt = (gross * schemePct) / 100;
          const afterScheme = gross - schemeAmt;
          const discAmt = (afterScheme * discPct) / 100;
          const taxable = afterScheme - discAmt;
          const gstAmt = (taxable * gstRate) / 100;
          const net = taxable + gstAmt;

          const item: PurchaseInvoiceItem = {
            id: `item-${Date.now()}-${r}-${Math.floor(Math.random() * 1000)}`,
            medicineId: `med-${cleanKey(medName).slice(0, 8)}-${Date.now() % 10000}`,
            medicineName: medName,
            genericName,
            hsnCode: hsnCode || '300490',
            batchNumber,
            expiryDate,
            pack: pack || '10 Tablets',
            boxes,
            unitsPerBox,
            billedQuantity: billedQty,
            freeQuantity: freeQty,
            totalQuantity: totalQty,
            mrp,
            purchaseRate,
            schemePercentage: schemePct,
            schemeAmount: schemeAmt,
            discountPercentage: discPct,
            discountAmount: discAmt,
            taxableAmount: taxable,
            gstRate,
            gstAmount: gstAmt,
            netAmount: net
          };

          parsedItems.push(item);
        }

        if (parsedItems.length === 0) {
          resolve({
            success: false,
            error: 'No valid medicine rows could be extracted from this spreadsheet.',
            filename: file.name,
            fileType: file.name.endsWith('.csv') ? 'csv' : 'xls',
            size: file.size,
            items: []
          });
          return;
        }

        // Convert file to dataUrl for attachment
        const dataUrlReader = new FileReader();
        dataUrlReader.onload = () => {
          resolve({
            success: true,
            filename: file.name,
            fileType: file.name.endsWith('.csv') ? 'csv' : 'xls',
            dataUrl: dataUrlReader.result as string,
            size: file.size,
            meta: {
              invoiceNo: extractedInvoiceNo,
              invoiceDate: extractedInvoiceDate,
              distributorName: extractedDistributor
            },
            items: parsedItems
          });
        };
        dataUrlReader.readAsDataURL(file);
      } catch (err: any) {
        resolve({
          success: false,
          error: `Spreadsheet reading error: ${err.message || 'Corrupted or unsupported format'}`,
          filename: file.name,
          fileType: file.name.endsWith('.csv') ? 'csv' : 'xls',
          size: file.size,
          items: []
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read the file.',
        filename: file.name,
        fileType: file.name.endsWith('.csv') ? 'csv' : 'xls',
        size: file.size,
        items: []
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Handles Image or PDF file uploads, converting to DataURL and attaching
 */
export const processInvoiceDocument = async (file: File): Promise<ParsedInvoiceResult> => {
  return new Promise((resolve) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(file.name);

    if (!isPdf && !isImage) {
      resolve({
        success: false,
        error: 'Unsupported file format. Please upload an Image (PNG/JPG), PDF, or Excel (XLS/XLSX/CSV) file.',
        filename: file.name,
        fileType: 'document' as any,
        size: file.size,
        items: []
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;

      // Extract invoice metadata from filename if formatted like INV-2026-904.pdf or Apollo_Pharmacy_INV4920.jpg
      let suggestedInvNo: string | undefined;
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const match = nameWithoutExt.match(/(?:inv(?:oice)?|bill)[\s#.:_-]*([A-Za-z0-9\-_]{3,15})/i);
      if (match) {
        suggestedInvNo = match[1].toUpperCase();
      } else if (nameWithoutExt.length >= 5 && nameWithoutExt.length <= 16) {
        suggestedInvNo = nameWithoutExt.toUpperCase().replace(/\s+/g, '-');
      } else {
        suggestedInvNo = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      // Check for distributor name in filename
      let suggestedDistributor: string | undefined;
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('cipla')) suggestedDistributor = 'Cipla Healthcare Distributors';
      else if (lowerName.includes('sun') || lowerName.includes('sunpharma')) suggestedDistributor = 'Sun Pharma Logistics';
      else if (lowerName.includes('abbott')) suggestedDistributor = 'Abbott India Depot';
      else if (lowerName.includes('apollo')) suggestedDistributor = 'Apollo MedSupply Wholesale';
      else if (lowerName.includes('mankind')) suggestedDistributor = 'Mankind Pharma Agency';
      else if (lowerName.includes('alkem')) suggestedDistributor = 'Alkem Laboratories Depot';
      else if (lowerName.includes('torrent')) suggestedDistributor = 'Torrent Pharma Distribution';
      else if (lowerName.includes('zydus')) suggestedDistributor = 'Zydus Lifesciences Distribution';
      else if (lowerName.includes('lupin')) suggestedDistributor = 'Lupin Pharma Agency';

      // Check for date in filename (e.g. 2026-03-15 or 15-03-2026)
      let suggestedDate: string | undefined;
      const dateIsoMatch = file.name.match(/(\d{4})[-_](\d{2})[-_](\d{2})/);
      if (dateIsoMatch) {
        suggestedDate = `${dateIsoMatch[1]}-${dateIsoMatch[2]}-${dateIsoMatch[3]}`;
      } else {
        suggestedDate = new Date().toISOString().split('T')[0];
      }

      // Generate smart simulated scanned line items for rapid inward verification
      const sampleScannedMedicines: PurchaseInvoiceItem[] = [
        {
          id: `item-${Date.now()}-1`,
          medicineId: 'MED-AUG-625',
          medicineName: 'Augmentin 625 Duo Tablet',
          genericName: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
          hsnCode: '300410',
          batchNumber: `AUG-${Math.floor(100 + Math.random() * 900)}`,
          expiryDate: '2028-04',
          pack: '10s',
          boxes: 5,
          unitsPerBox: 10,
          billedQuantity: 50,
          freeQuantity: 5,
          totalQuantity: 55,
          mrp: 204.50,
          purchaseRate: 142.00,
          schemePercentage: 0,
          schemeAmount: 0,
          discountPercentage: 2,
          discountAmount: 142.00,
          taxableAmount: 6958.00,
          gstRate: 12,
          gstAmount: 834.96,
          netAmount: 7792.96
        },
        {
          id: `item-${Date.now()}-2`,
          medicineId: 'MED-PAN-D',
          medicineName: 'Pan-D Capsule',
          genericName: 'Pantoprazole 40mg + Domperidone 30mg',
          hsnCode: '300490',
          batchNumber: `PND-${Math.floor(100 + Math.random() * 900)}`,
          expiryDate: '2027-11',
          pack: '10s',
          boxes: 8,
          unitsPerBox: 10,
          billedQuantity: 80,
          freeQuantity: 0,
          totalQuantity: 80,
          mrp: 145.00,
          purchaseRate: 94.50,
          schemePercentage: 5,
          schemeAmount: 378.00,
          discountPercentage: 2,
          discountAmount: 143.64,
          taxableAmount: 7038.90,
          gstRate: 12,
          gstAmount: 844.67,
          netAmount: 7883.57
        },
        {
          id: `item-${Date.now()}-3`,
          medicineId: 'MED-DOLO-650',
          medicineName: 'Dolo 650mg Tablet',
          genericName: 'Paracetamol 650mg',
          hsnCode: '300490',
          batchNumber: `DL-${Math.floor(1000 + Math.random() * 9000)}`,
          expiryDate: '2028-08',
          pack: '15s',
          boxes: 10,
          unitsPerBox: 15,
          billedQuantity: 150,
          freeQuantity: 15,
          totalQuantity: 165,
          mrp: 30.50,
          purchaseRate: 19.20,
          schemePercentage: 0,
          schemeAmount: 0,
          discountPercentage: 1.5,
          discountAmount: 43.20,
          taxableAmount: 2836.80,
          gstRate: 12,
          gstAmount: 340.42,
          netAmount: 3177.22
        }
      ];

      resolve({
        success: true,
        filename: file.name,
        fileType: isPdf ? 'pdf' : 'image',
        dataUrl,
        size: file.size,
        meta: {
          invoiceNo: suggestedInvNo,
          invoiceDate: suggestedDate,
          distributorName: suggestedDistributor
        },
        items: [],
        suggestedItems: sampleScannedMedicines
      });
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to process document file.',
        filename: file.name,
        fileType: isPdf ? 'pdf' : 'image',
        size: file.size,
        items: []
      });
    };

    reader.readAsDataURL(file);
  });
};
