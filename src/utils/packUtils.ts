import { Medicine } from '../types';

export interface PackDetails {
  packSize: number;
  packName: string;
  unitName: string;
  isLooseSellable: boolean;
  packDisplay: string;
}

/**
 * Extracts packaging information and loose-unit selling parameters from a medicine.
 */
export function getPackDetails(medicine: Medicine): PackDetails {
  let packSize = medicine.packSize || 0;
  const form = medicine.form;

  // Determine base unit names
  let unitName = medicine.looseUnitName || '';
  if (!unitName) {
    if (form === 'Tablet') unitName = 'Tab';
    else if (form === 'Capsule') unitName = 'Cap';
    else if (form === 'Syrup' || form === 'Suspension') unitName = 'ml';
    else if (form === 'Injection') unitName = 'Vial';
    else if (form === 'Ointment' || form === 'Gel') unitName = 'Tube';
    else if (form === 'Drops') unitName = 'Bottle';
    else if (form === 'Inhaler') unitName = 'Dose';
    else if (form === 'Powder') unitName = 'Tin';
    else if (form === 'Sachet') unitName = 'Sachet';
    else if (form === 'Device') unitName = 'Piece';
    else unitName = 'Unit';
  }

  let packName = 'Pack';
  if (form === 'Tablet' || form === 'Capsule') packName = 'Strip';
  else if (form === 'Syrup' || form === 'Suspension') packName = 'Bottle';
  else if (form === 'Injection') packName = 'Box';
  else if (form === 'Ointment' || form === 'Gel') packName = 'Tube';
  else if (form === 'Drops') packName = 'Bottle';
  else if (form === 'Inhaler') packName = 'Inhaler';
  else if (form === 'Powder') packName = 'Tin';
  else if (form === 'Sachet') packName = 'Box';
  else if (form === 'Device') packName = 'Pack';

  // If packSize not explicitly declared, parse from medicine.pack string
  if (!packSize && medicine.pack) {
    const raw = medicine.pack.trim();
    // Match "10 Tablets", "15 Capsules", "10s", "15s", "1x10", "1 x 15", "10 Tabs"
    const match1 = raw.match(/(\d+)\s*(?:Tablets?|Tabs?|Capsules?|Caps?|Units?|s\b)/i);
    const match2 = raw.match(/1\s*[xX*]\s*(\d+)/);
    const match3 = raw.match(/^(\d+)$/);

    if (match1) {
      packSize = parseInt(match1[1], 10);
    } else if (match2) {
      packSize = parseInt(match2[1], 10);
    } else if (match3) {
      packSize = parseInt(match3[1], 10);
    }
  }

  // Fallbacks by form
  if (!packSize || packSize <= 0) {
    if (form === 'Tablet') {
      // Common 15-tablet pack check for standard brands
      const n = medicine.name.toLowerCase();
      if (n.includes('dolo') || n.includes('pan 40') || n.includes('pantocid')) {
        packSize = 15;
      } else {
        packSize = 10;
      }
    } else if (form === 'Capsule') {
      packSize = 10;
    } else {
      packSize = 1;
    }
  }

  const isLooseSellable = (form === 'Tablet' || form === 'Capsule' || packSize > 1);
  const packDisplay = medicine.pack || (packSize > 1 ? `1 ${packName} (${packSize} ${unitName}s)` : `1 ${packName}`);

  return {
    packSize,
    packName,
    unitName,
    isLooseSellable,
    packDisplay
  };
}

/**
 * Formats inventory stock into full packs and remaining loose units (e.g. "34 Strips + 6 Tabs").
 */
export function formatStockDisplay(
  stock: number,
  packSize: number,
  packName: string = 'Strip',
  unitName: string = 'Tab'
): string {
  if (stock <= 0) return `0 ${packName}`;

  if (packSize > 1) {
    const fullPacks = Math.floor(stock + 0.0001);
    const fractional = stock - fullPacks;
    const looseUnits = Math.round(fractional * packSize);

    if (fullPacks > 0 && looseUnits > 0) {
      return `${fullPacks} ${packName} + ${looseUnits} ${unitName}`;
    } else if (fullPacks === 0 && looseUnits > 0) {
      return `${looseUnits} ${unitName} (Loose)`;
    } else {
      const totalUnits = fullPacks * packSize;
      return `${fullPacks} ${packName} (${totalUnits} ${unitName}s)`;
    }
  }

  return `${stock} ${packName}`;
}

/**
 * Computes price, discount, net amount, and inventory deduction for a cart item
 * Supports flexible combinations of Box, Strip, and Loose Units.
 */
export function calculateLinePricing(item: {
  unitType?: 'pack' | 'loose';
  quantity: number;
  boxQuantity?: number;
  stripQuantity?: number;
  looseQuantity?: number;
  packSize?: number;
  boxSize?: number;
  customMrp?: number;
  loosePrice?: number;
  sellingPrice: number;
  discountPercent: number;
}) {
  const packSize = item.packSize && item.packSize > 0 ? item.packSize : 10;
  const boxMultiplier = item.boxSize && item.boxSize > 0 ? item.boxSize : 10; // 1 box = 10 strips by default

  // Base pricing resolution:
  // Batch sellingPrice is standard MRP of 1 Strip / Pack
  const stripBasePrice = item.sellingPrice || 0;
  let stripPrice = stripBasePrice;
  let loosePrice = Number((stripBasePrice / packSize).toFixed(2));

  if (typeof item.customMrp === 'number' && item.customMrp > 0) {
    // If customMrp is clearly a per-unit price (i.e. significantly less than sellingPrice, e.g. <= sellingPrice / 2 and unitType is loose)
    if (item.unitType === 'loose' && item.customMrp <= (stripBasePrice / packSize) * 1.5) {
      loosePrice = item.customMrp;
      stripPrice = Number((loosePrice * packSize).toFixed(2));
    } else {
      stripPrice = item.customMrp;
      loosePrice = Number((stripPrice / packSize).toFixed(2));
    }
  }

  if (typeof item.loosePrice === 'number' && item.loosePrice > 0) {
    loosePrice = item.loosePrice;
  }

  const boxPrice = Number((stripPrice * boxMultiplier).toFixed(2));

  // Determine actual quantities of Box, Strip, and Loose
  const hasBoxField = typeof item.boxQuantity === 'number';
  const hasStripField = typeof item.stripQuantity === 'number';
  const hasLooseField = typeof item.looseQuantity === 'number';

  let boxCount = hasBoxField ? Math.max(0, item.boxQuantity!) : 0;
  let stripCount = 0;
  let looseCount = 0;

  if (hasStripField) {
    stripCount = Math.max(0, item.stripQuantity!);
  } else if (item.unitType === 'loose') {
    stripCount = 0;
  } else {
    stripCount = Math.max(0, Math.floor(item.quantity || 0));
  }

  if (hasLooseField) {
    looseCount = Math.max(0, item.looseQuantity!);
  } else if (item.unitType === 'loose') {
    looseCount = Math.max(1, Math.round((item.quantity || 0) * packSize));
  } else {
    looseCount = 0;
  }

  // If no counts were explicitly provided but item.quantity > 0:
  if (boxCount === 0 && stripCount === 0 && looseCount === 0 && item.quantity > 0) {
    if (item.unitType === 'loose') {
      looseCount = Math.max(1, Math.round(item.quantity * packSize));
    } else {
      stripCount = Math.max(1, Math.round(item.quantity));
    }
  }

  const grossAmount = Number(((boxCount * boxPrice) + (stripCount * stripPrice) + (looseCount * loosePrice)).toFixed(2));
  const discountAmount = Number(((grossAmount * (item.discountPercent || 0)) / 100).toFixed(2));
  const netAmount = Number((grossAmount - discountAmount).toFixed(2));

  // Inventory deduction in standard strip/pack units
  const stockDeduction = Number(((boxCount * boxMultiplier) + stripCount + (looseCount / packSize)).toFixed(4));
  const totalLooseUnits = Math.round((boxCount * boxMultiplier * packSize) + (stripCount * packSize) + looseCount);

  // Pure loose check: customer is only buying loose units (e.g. tablets)
  const isPureLoose = (looseCount > 0 && stripCount === 0 && boxCount === 0) || (item.unitType === 'loose' && stripCount === 0 && boxCount === 0);

  return {
    isLoose: isPureLoose,
    unitPrice: isPureLoose ? loosePrice : stripPrice,
    stripPrice,
    loosePrice,
    boxPrice,
    looseQty: totalLooseUnits,
    packQty: stockDeduction,
    grossAmount,
    discountAmount,
    netAmount,
    stockDeduction,
    boxCount,
    stripCount,
    looseCount
  };
}

/**
 * Formats the item's quantity display for bills and invoices
 */
export function formatQuantityWithUnit(item: {
  unitType?: 'pack' | 'loose';
  quantity?: number;
  boxQuantity?: number;
  stripQuantity?: number;
  looseQuantity?: number;
  packSize?: number;
  unitName?: string;
  packName?: string;
}): string {
  const packName = item.packName || 'Strip';
  const unitName = item.unitName || 'Tab';
  const packSize = item.packSize && item.packSize > 0 ? item.packSize : 10;

  const b = Math.max(0, item.boxQuantity || 0);
  const s = item.stripQuantity !== undefined ? Math.max(0, item.stripQuantity) : (item.unitType !== 'loose' ? (item.quantity ? Math.floor(item.quantity) : 0) : 0);
  const l = item.looseQuantity !== undefined ? Math.max(0, item.looseQuantity) : (item.unitType === 'loose' ? (item.quantity ? Math.round(item.quantity * packSize) : 0) : 0);

  const parts: string[] = [];
  if (b > 0) parts.push(`${b} Box${b > 1 ? 'es' : ''}`);
  if (s > 0) parts.push(`${s} ${packName}${s > 1 ? 's' : ''}`);
  if (l > 0) parts.push(`${l} ${unitName}${l > 1 ? 's' : ''}`);

  if (parts.length > 0) return parts.join(' + ');

  if (item.unitType === 'loose') {
    const qty = item.looseQuantity || (item.quantity ? Math.round(item.quantity * packSize) : 1);
    return `${qty} ${unitName} (Loose)`;
  }
  return `${item.quantity || 1} ${packName}`;
}
