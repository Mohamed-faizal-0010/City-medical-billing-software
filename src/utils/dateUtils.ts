/**
 * Date / Month / Year (DD/MM/YYYY) Model Utilities
 * Standardizes date formatting, parsing, and input handling across the pharmacy suite.
 */

/**
 * Format any Date or ISO string into DD/MM/YYYY
 * e.g., "2026-09-22" -> "22/09/2026"
 */
export function formatDateDMY(dateInput?: string | Date | number | null): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format Date into DD-MM-YYYY
 */
export function formatDateDMYHyphen(dateInput?: string | Date | number | null): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Format Medicine Batch Expiry Date into Date/Month/Year or Month/Year model
 * Handles:
 * - "2027-12-31" -> "31/12/2027" or "12/2027"
 * - "2027-12" -> "12/2027"
 * - "12/27" -> "12/2027"
 */
export function formatExpiryDMY(expiryDate?: string | null): string {
  if (!expiryDate) return '-';

  // If already in MM/YYYY format
  if (/^\d{2}\/\d{4}$/.test(expiryDate)) return expiryDate;
  // If in MM/YY format
  if (/^\d{2}\/\d{2}$/.test(expiryDate)) {
    const [m, y] = expiryDate.split('/');
    return `${m}/20${y}`;
  }

  // If standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(expiryDate)) {
    const parts = expiryDate.split('-');
    const year = parts[0];
    const month = parts[1];
    const day = parts[2].slice(0, 2);
    // Pharmacy convention often uses MM/YYYY for shelf strips, or DD/MM/YYYY if day is specific
    return `${day}/${month}/${year}`;
  }

  // If YYYY-MM
  if (/^\d{4}-\d{2}$/.test(expiryDate)) {
    const [year, month] = expiryDate.split('-');
    return `${month}/${year}`;
  }

  // Fallback to Date object parsing
  const d = new Date(expiryDate);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return expiryDate;
}

/**
 * Format Date with Time in Indian format
 * e.g. "22/09/2026, 02:30 PM"
 */
export function formatDateWithTimeDMY(dateInput?: string | Date | number | null): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const dmy = formatDateDMY(d);
  const time = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return `${dmy}, ${time}`;
}

/**
 * Convert standard Date object or string to YYYY-MM-DD for <input type="date">
 */
export function toInputDateValue(dateInput?: Date | string | null): string {
  if (!dateInput) return new Date().toISOString().split('T')[0];
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parse a DD/MM/YYYY or DD-MM-YYYY string into standard YYYY-MM-DD
 */
export function parseDMYToISO(dmy: string): string {
  if (!dmy) return new Date().toISOString().split('T')[0];
  const parts = dmy.includes('/') ? dmy.split('/') : dmy.split('-');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${month}-${day}`;
  }
  return toInputDateValue(dmy);
}

/**
 * Extract individual Date, Month, Year numbers from a date
 */
export function getDateParts(dateInput?: Date | string | null): {
  day: number;
  month: number;
  year: number;
  formattedDMY: string;
} {
  const d = dateInput ? new Date(dateInput) : new Date();
  const valid = !isNaN(d.getTime()) ? d : new Date();
  const day = valid.getDate();
  const month = valid.getMonth() + 1; // 1-12
  const year = valid.getFullYear();
  return {
    day,
    month,
    year,
    formattedDMY: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
  };
}

/**
 * Parse an expiry date string (MM/YYYY, MM/YY, YYYY-MM, YYYY-MM-DD, DD/MM/YYYY) into a Date object
 * Medicine expiry is traditionally effective until the final day of the stated month.
 */
export function parseExpiryDate(expiryDate?: string | null): Date | null {
  if (!expiryDate) return null;
  const str = String(expiryDate).trim();
  if (!str) return null;

  // MM/YYYY
  if (/^\d{1,2}\/\d{4}$/.test(str)) {
    const [m, y] = str.split('/').map(Number);
    if (m >= 1 && m <= 12) {
      return new Date(y, m, 0, 23, 59, 59, 999);
    }
  }

  // MM/YY
  if (/^\d{1,2}\/\d{2}$/.test(str)) {
    const [m, y] = str.split('/').map(Number);
    if (m >= 1 && m <= 12) {
      return new Date(2000 + y, m, 0, 23, 59, 59, 999);
    }
  }

  // YYYY-MM
  if (/^\d{4}-\d{1,2}$/.test(str)) {
    const [y, m] = str.split('-').map(Number);
    if (m >= 1 && m <= 12) {
      return new Date(y, m, 0, 23, 59, 59, 999);
    }
  }

  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/').map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999);
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999);
  }

  // General fallback
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Calculate the number of days remaining until expiry
 * Positive = valid days remaining
 * Negative = expired
 */
export function getDaysUntilExpiry(expiryDate?: string | null): number {
  if (!expiryDate) return 999;
  const expDate = parseExpiryDate(expiryDate);
  if (!expDate) return 999;

  const now = new Date();
  const diffMs = expDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get standardized expiry status badge details
 */
export function getExpiryStatus(expiryDate?: string | null): {
  status: 'expired' | 'critical' | 'warning' | 'safe';
  label: string;
  daysRemaining: number;
} {
  const daysRemaining = getDaysUntilExpiry(expiryDate);

  if (daysRemaining < 0) {
    return { status: 'expired', label: `Expired (${Math.abs(daysRemaining)}d ago)`, daysRemaining };
  }
  if (daysRemaining <= 30) {
    return { status: 'critical', label: `Critical (${daysRemaining}d)`, daysRemaining };
  }
  if (daysRemaining <= 90) {
    return { status: 'warning', label: `Near Expiry (${daysRemaining}d)`, daysRemaining };
  }
  return { status: 'safe', label: `Valid (${daysRemaining}d)`, daysRemaining };
}

