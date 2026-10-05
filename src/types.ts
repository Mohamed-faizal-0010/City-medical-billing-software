export type UserRole = 'admin' | 'pharmacist' | 'cashier' | 'doctor';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  email: string;
  phone?: string;
  avatar?: string;
  licenseNumber?: string;
  token?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  lastLogin?: string;
  pin?: string;
}

export interface Batch {
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  manufacturingDate?: string; // YYYY-MM-DD
  stock: number;
  costPrice: number; // Purchase price from supplier
  sellingPrice: number; // Retail / MRP
  mrp: number;
  ptr?: number; // Price to Retailer (Wholesale rate)
  wholesalePrice?: number; // Wholesale selling price per unit/pack
  boxSize?: number; // Units per box for wholesale
  wholesalePackSize?: number; // Packs / strips per box
  location: string; // e.g. "Rack A-3", "Cold Storage 4°C"
  barcode?: string;
  isExpired?: boolean;
}

export type MedicineBatch = Batch;

export type DosageForm =
  | 'Tablet'
  | 'Capsule'
  | 'Syrup'
  | 'Suspension'
  | 'Injection'
  | 'Ointment'
  | 'Gel'
  | 'Drops'
  | 'Inhaler'
  | 'Spray'
  | 'Powder'
  | 'Sachet'
  | 'Soap'
  | 'Shampoo'
  | 'Mouth Wash'
  | 'Oil'
  | 'Food Product'
  | 'Feeding Bottle'
  | 'Machine'
  | 'Candy'
  | 'Chocolate'
  | 'Biscuits'
  | 'Surgical'
  | 'Support'
  | 'Diaper'
  | 'Device'
  | string;

export const PRODUCT_FORMS: readonly string[] = [
  'Injection',
  'Syrup',
  'Tablet',
  'Ointment',
  'Surgical',
  'Capsule',
  'Soap',
  'Shampoo',
  'Mouth Wash',
  'Gel',
  'Food Product',
  'Feeding Bottle',
  'Machine',
  'Candy',
  'Chocolate',
  'Oil',
  'Powder',
  'Drops',
  'Inhaler',
  'Spray',
  'Biscuits',
  'Support',
  'Diaper'
];

export const PRODUCT_CATEGORIES: readonly string[] = [
  'Analgesic & Antipyretic',
  'Antibiotic & Antimicrobial',
  'Antidiabetic',
  'Cardiovascular & Antihypertensive',
  'Gastrointestinal & Antacid',
  'Respiratory & Anti-Allergy',
  'Vitamins & Supplements',
  'Dermatological',
  'Soap',
  'Shampoo',
  'Paste',
  'Biscuits',
  'Candy',
  'Food Products',
  'Baby Care & Feeding',
  'Surgical & Dressings',
  'General Healthcare'
];

export interface Medicine {
  id: string; // Brand name (e.g., Crocin 650)
  name: string;
  genericName: string; // Molecule (e.g., Paracetamol)
  strength: string; // e.g., "650 mg"
  form: DosageForm;
  manufacturer: string;
  category: string; // Analgesic, Antibiotic, Soap, Shampoo, Paste, Biscuits, Candy, Food Products, etc.
  prescriptionRequired: boolean;
  scheduleType?: 'H' | 'H1' | 'X' | 'G' | 'Narcotic' | 'OTC' | 'None'; // Statutory schedule under Drugs & Cosmetics Act
  hsnCode: string; // GST HSN code (e.g., 300490)
  taxRate: number; // e.g. 12 (%)
  minStockAlert: number;
  pack?: string; // e.g. "10 Tablets", "100 ml", "1 Strip"
  packSize?: number; // Number of loose units per pack (e.g. 10 tabs/strip, 15 caps/strip)
  boxSize?: number; // Number of packs/strips per wholesale box (e.g. 10 strips/box)
  caseSize?: number; // Number of boxes per master shipper case (e.g. 10 boxes/case)
  ptr?: number; // Default Price to Retailer (Wholesale rate)
  wholesaleRate?: number; // Standard B2B wholesale selling rate
  looseUnitName?: string; // e.g. "Tablet", "Capsule", "Unit"
  rackLocation?: string; // e.g. "Rack A-01", "Shelf B-3"
  batches: Batch[];
  barcode?: string; // Barcode string (e.g. EAN-13, UPC, Code 128)
  description?: string;
  sideEffects?: string;
  dosageGuidelines?: string;
}

export interface GenericAlternative {
  medicineId: string;
  brandName: string;
  genericName: string;
  manufacturer: string;
  sellingPrice: number;
  stockAvailable: number;
  savingsPercentage: number;
  form: string;
  strength: string;
}

export interface CartItem {
  medicine: Medicine;
  selectedBatch: Batch;
  quantity: number; // For pack/strip: integer count (1, 2) or fractional
  discountPercent: number;
  customMrp?: number;
  // Box, Strip, Loose Unit breakdown
  unitType?: 'pack' | 'loose'; // 'pack' (Full Strip/Bottle) vs 'loose' (Tablet/Capsule)
  packSize?: number; // loose units per pack/strip (e.g. 10 tabs)
  boxSize?: number; // strips per box (e.g. 10 strips/box)
  boxQuantity?: number; // number of full boxes (e.g. 1 box)
  stripQuantity?: number; // number of strips (e.g. 2 strips)
  looseQuantity?: number; // integer count of loose units (e.g. 4 tablets)
  unitName?: string; // e.g. "Tab", "Cap", "Unit"
  packName?: string; // e.g. "Strip", "Bottle", "Box"
  loosePrice?: number; // Per-tablet / per-loose-unit rate
  wholesaleRate?: number; // Price to Retailer (PTR) / Wholesale rate
  isWholesaleRate?: boolean; // Whether line was billed at wholesale rate
  isManualBatch?: boolean; // Flag if batch number is manually entered or overridden
  manualBatchEntered?: string;
}

export interface WholesaleBuyer {
  id: string; // e.g. "WB-101"
  businessName: string; // Chemist / Pharmacy / Hospital / Clinic Trade Name
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  district?: string;
  state: string;
  stateCode: string; // e.g. "33" for Tamil Nadu
  pincode: string;
  gstin: string; // 15-digit GSTIN (e.g. 33AABCM9124Q1Z2)
  drugLicenseNo: string; // Form 20B / 21B (e.g. TN-MDU-2023-W1092)
  creditLimit: number; // e.g. ₹50,000
  creditDays: number; // e.g. 15, 30, 45 days
  outstandingBalance: number;
  notes?: string;
}

export interface SaleTransaction {
  id: string; // Invoice No e.g. INV-2026-1049
  date: string;
  saleType?: 'retail' | 'wholesale'; // Retail walk-in vs Wholesale B2B
  patientId?: string;
  patientName: string;
  patientPhone?: string;
  patientAge?: number;
  patientAddress?: string;
  doctorName?: string;
  doctorId?: string;
  doctorRegNo?: string;
  prescriptionNo?: string;
  // Wholesale B2B Buyer details
  buyerId?: string;
  buyerBusinessName?: string;
  buyerGstin?: string;
  buyerDrugLicense?: string;
  buyerAddress?: string;
  buyerStateCode?: string;
  wholesaleBuyerId?: string;
  wholesaleBuyerName?: string;
  wholesaleBuyerGstin?: string;
  wholesaleBuyerDrugLicense?: string;
  wholesaleBuyerAddress?: string;
  transportMode?: string; // Tempo / Transport / Courier / Hand Delivery
  vehicleNumber?: string;
  ewayBillNo?: string;
  creditDays?: number;
  paymentDueDate?: string;
  isInterState?: boolean;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  items: {
    medicineId: string;
    medicineName: string;
    genericName: string;
    scheduleType?: 'H' | 'H1' | 'X' | 'G' | 'Narcotic' | 'OTC' | string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    taxRate: number;
    total: number;
    // Packaging & loose selling metadata
    unitType?: 'pack' | 'loose';
    stockDeduction?: number;
    packSize?: number;
    boxQuantity?: number;
    stripQuantity?: number;
    looseQuantity?: number;
    unitName?: string;
    packName?: string;
    pack?: string;
    location?: string;
  }[];
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  costOfGoodsSold: number;
  paymentMethod: 'UPI' | 'Cash' | 'Card' | 'Split' | 'Credit';
  splitPayment?: {
    cashAmount: number;
    upiAmount: number;
    cardAmount?: number;
  };
  creditPatientId?: string;
  creditDueDate?: string;
  paidAmount?: number;
  creditBalanceAmount?: number;
  paymentStatus: 'Paid' | 'Pending' | 'Refunded' | 'Partial_Refund';
  upiReferenceId?: string;
  cashierName: string;
}

export interface SalesReturn {
  id: string; // RET-2026-003
  invoiceId: string;
  date: string;
  patientName?: string;
  customerName?: string;
  items: {
    medicineId: string;
    medicineName: string;
    batchNumber: string;
    quantity: number;
    unitPrice?: number;
    refundAmount: number;
    reason: string;
    returnToStock: boolean; // if true, restores batch stock, else quarantined
    unitType?: 'pack' | 'loose';
    packSize?: number;
    looseQuantity?: number;
    unitName?: string;
    packName?: string;
  }[];
  totalRefundAmount?: number;
  refundAmount?: number;
  refundMethod: 'UPI_Refund' | 'Cash' | 'Store_Credit' | 'UPI_Reversal';
  processedBy: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  drugLicenseNo: string;
  paymentTerms: 'Immediate' | 'Net 15' | 'Net 30' | 'Net 45';
  outstandingPayable: number;
  rating?: number;
  image?: string;
  agencyCode?: string;
}

export interface PurchaseOrderItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  orderQuantity: number;
  unitCostPrice: number;
  taxRate?: number;
  totalCost?: number;
  total?: number;
}

export interface PurchaseInvoiceItem {
  id?: string;
  medicineId: string;
  medicineName: string;
  genericName?: string;
  barcode?: string;
  hsnCode: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM or YYYY-MM-DD
  pack: string; // e.g. "10s", "15s", "100ml", "1x10"
  boxes: number; // No of boxes
  unitsPerBox: number; // Units in each box
  billedQuantity: number; // boxes * unitsPerBox
  freeQuantity: number; // Free scheme bonus units
  totalQuantity: number; // billedQuantity + freeQuantity
  mrp: number; // Maximum Retail Price per unit/pack
  purchaseRate: number; // Purchase price per unit/pack
  schemePercentage: number; // Scheme discount %
  schemeAmount: number; // Scheme discount in ₹
  discountPercentage: number; // Trade discount %
  discountAmount: number; // Trade discount in ₹
  taxableAmount: number; // Net taxable base value
  gstRate: number; // Tax slab (0, 5, 12, 18, 28)
  gstAmount: number; // GST tax value
  netAmount: number; // Total payable line amount
}

export interface SupplierPaymentEntry {
  id: string;
  date: string;
  amount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Bank_Transfer' | 'Cheque' | 'Credit' | string;
  referenceNo?: string;
  notes?: string;
  recordedBy?: string;
}

export interface PurchaseInvoice {
  id: string; // PI-2026-001
  invoiceNo: string; // Distributor Tax Invoice Number (e.g. INV-90428)
  invoiceDate: string; // YYYY-MM-DD
  paymentDueDate: string; // YYYY-MM-DD
  distributorId: string;
  distributorName: string;
  distributorGstin?: string;
  distributorPhone?: string;
  distributorImage?: string;
  items: PurchaseInvoiceItem[];
  subtotal: number; // Gross total (sum of basic purchase rate * billed units)
  totalScheme: number; // Total scheme deductions
  totalDiscount: number; // Total trade discount
  taxableAmount: number; // Base taxable value
  cgstAmount: number; // Central GST (50% of tax)
  sgstAmount: number; // State GST (50% of tax)
  igstAmount?: number;
  totalTax: number;
  roundOff: number; // Rounding adjustment
  grandTotal: number; // Final payable amount
  paymentStatus: 'Unpaid' | 'Paid' | 'Partially Paid';
  paymentMethod?: 'Cash' | 'UPI' | 'Bank_Transfer' | 'Cheque' | 'Credit' | string;
  paidAmount?: number;
  balanceAmount?: number;
  paymentReference?: string;
  payments?: SupplierPaymentEntry[];
  notes?: string;
  createdAt: string;
  attachment?: {
    name: string;
    type: 'image' | 'pdf' | 'xls' | 'csv' | 'document';
    dataUrl?: string; // Data URL / base64 or blob URL
    size?: number; // File size in bytes
    uploadedAt?: string;
  };
}

export interface PurchaseOrder {
  id: string; // PO-2026-081
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: 'Draft' | 'Sent' | 'In Transit' | 'Received' | 'Cancelled';
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  notes?: string;
  receivedDate?: string;
}

export interface PurchaseReturn {
  id: string; // PR-2026-015
  debitNoteNumber: string; // DN-2026-089
  supplierId: string;
  supplierName: string;
  date?: string;
  returnDate?: string;
  items: {
    medicineId: string;
    medicineName: string;
    batchNumber: string;
    quantity: number;
    unitCostPrice: number;
    totalDebit?: number;
    totalAmount?: number;
    reason: string;
  }[];
  totalDebitAmount: number;
  status: 'Pending Supplier Approval' | 'Approved & Adjusted' | 'Refund Received' | 'Debit_Note_Issued';
  accountsPayableAdjusted: boolean;
  notes?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  bloodGroup?: string;
  allergies?: string[];
  drugAllergies?: string[];
  chronicConditions: string[]; // e.g. "Type 2 Diabetes", "Hypertension"
  address: string;
  registeredDate?: string;
  lastVisitDate?: string;
  tokenNumber?: number;
  tokenFormatted?: string; // e.g. "#01", "#02", "#15"
  tokenDate?: string; // YYYY-MM-DD
  consultationDoctorId?: string;
  consultationDoctorName?: string;
  consultationTime?: string; // e.g. "10:30 AM"
  consultationStatus?: 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled';
  lastConsultationAlertSent?: string;
  refillReminders: RefillReminder[];
  prescriptions?: any[];
  // Patient Credit Ledger (Udhaar / Khata) & Due Tracking
  creditLimit?: number; // Maximum credit allowed (e.g. ₹5,000)
  outstandingDue?: number; // Current unpaid balance
  creditDays?: number; // Allowed credit duration (e.g. 15 or 30 days)
  creditStatus?: 'Good' | 'Due' | 'Overdue' | 'Blocked';
  lastPaymentDate?: string;
  creditDueDate?: string;
  creditLedger?: PatientCreditEntry[];
}

export interface PatientCreditEntry {
  id: string; // pce-001
  patientId: string;
  date: string;
  type: 'Credit_Sale' | 'Payment_Received' | 'Opening_Balance' | 'Adjustment';
  invoiceId?: string; // Links to POS INV-2026-XXXX
  amount: number;
  balanceAfter: number;
  paymentMethod?: 'Cash' | 'UPI' | 'Card' | 'Bank_Transfer' | string;
  referenceNo?: string;
  notes?: string;
  recordedBy?: string;
}

export interface PatientPaymentReminder {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  outstandingAmount: number;
  dueDate?: string;
  channel: 'WhatsApp' | 'SMS';
  sentAt: string;
  status: 'Sent' | 'Failed';
  upiPayUrl?: string;
  message: string;
}

export interface RefillReminder {
  id: string;
  patientId?: string;
  medicineName: string;
  dosage: string; // e.g. "1 tablet twice daily"
  prescribedDate?: string;
  daysSupply: number;
  nextRefillDue: string; // YYYY-MM-DD
  status: 'Active' | 'Due Soon' | 'Overdue' | 'Refilled' | 'Sent' | 'Scheduled';
  autoNotify?: boolean;
  lastNotificationSent?: string;
}

export interface PatientNotification {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  channel: 'WhatsApp' | 'SMS';
  templateType: 'refill' | 'rx_ready' | 'appointment' | 'health_tip' | 'custom';
  message: string;
  status: 'Sent' | 'Delivered' | 'Failed';
  sentAt: string;
  referenceId?: string;
  language?: 'en' | 'ta';
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  clinicName: string;
  phone: string;
  email: string;
  registrationNumber: string;
  availableDays: string[];
  consultationFee: number;
  commissionPercent?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  time?: string;
  timeSlot?: string; // e.g. "10:30 AM"
  reason: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No Show';
  notes?: string;
}

export interface OperatingExpense {
  id: string;
  date: string;
  category: 'Rent' | 'Salaries' | 'Utilities & Electricity' | 'Cold Storage Maintenance' | 'Packaging & Consumables' | 'Software & Compliance';
  amount: number;
  description: string;
}

export interface EncryptionStatus {
  cipher: string;
  keyDerivation: string;
  integrityHash: string;
  lastAudit: string;
  compliance: string[];
}

export interface PrinterSettings {
  printerType: 'thermal' | 'thermal58' | 'a4' | 'a5';
  connectionType: 'browser' | 'web-usb' | 'web-bluetooth' | 'web-serial' | 'network';
  deviceName?: string;
  deviceAddress?: string;
  paperWidth: '80mm' | '58mm' | 'A4' | 'A5';
  autoCut: boolean;
  openCashDrawer: boolean;
  autoPrintOnComplete: boolean;
  printCopies: number;
  printDualCopy?: boolean;
  printLogo: boolean;
  printQrCode: boolean;
  printPharmacistSign: boolean;
  // Bill Print Time Settings
  showPrintTime?: boolean;
  timeFormat?: '12h' | '24h';
  showSeconds?: boolean;
  billTimeSource?: 'invoice_time' | 'current_print_time' | 'custom_time';
  customBillTime?: string; // HH:MM (24h)
  customBillDate?: string; // YYYY-MM-DD
  printDelayMs?: number; // Spooler delay before triggering print()
  dualCopyIntervalMs?: number; // Delay between Copy 1 and Copy 2
  headerCustomNote?: string;
  footerCustomNote?: string;
  status: 'connected' | 'disconnected' | 'ready';
  lastConnectedAt?: string;
}

export type PharmacyBusinessType = 'retail' | 'wholesale' | 'both';

export interface PharmacyTenant {
  id: string; // e.g. "pharm-001"
  pharmacyCode: string; // e.g. "CP-MDU-101"
  name: string; // e.g. "City Rx - Melur Main"
  businessType: PharmacyBusinessType; // 'retail' | 'wholesale' | 'both'
  retailActive: boolean; // Controls whether retail action button is active
  wholesaleActive: boolean; // Controls whether wholesale action button is active
  tagline?: string;
  mobile: string;
  email: string;
  addressLine1: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  gstin: string;
  drugLicenseNo: string;
  wholesaleLicenseNo?: string;
  retailLicenseNo?: string;
  // Pharmacy Payment Option
  subscriptionPlan: 'Free_Trial' | 'Monthly' | 'Annual' | 'Enterprise' | 'Lifetime';
  paymentStatus: 'Active' | 'Pending' | 'Grace_Period' | 'Suspended';
  paymentMethod?: 'UPI' | 'Bank_NEFT' | 'Card' | 'Cash';
  paymentUpiId?: string;
  renewalDate?: string;
  subscriptionFee?: number;
  // Primary User Credentials
  adminUsername: string;
  adminPassword?: string;
  adminEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface WholesalePaymentCollection {
  id: string; // e.g. "RCP-2026-001"
  date: string;
  buyerId: string;
  buyerName: string;
  invoiceId?: string; // Specific invoice or against overall balance
  amount: number;
  paymentMode: 'Cash' | 'Bank_NEFT' | 'UPI' | 'Cheque';
  referenceNo?: string; // Cheque No / UPI UTR / URN
  bankName?: string;
  notes?: string;
  receivedBy: string;
}

export interface PharmacyProfile {
  name: string;
  pharmacyCode?: string; // Unique Pharmacy Code e.g. CP-MDU-101
  businessType?: PharmacyBusinessType; // 'retail' | 'wholesale' | 'both'
  retailActive?: boolean; // Whether retail action button is active
  wholesaleActive?: boolean; // Whether wholesale action button is active
  tagline?: string;
  logoUrl?: string;
  addressLine1: string;
  taluk: string;
  district: string;
  state: string;
  pincode: string;
  landmark?: string;
  operatingHours?: string;
  latitude?: number;
  longitude?: number;
  mobile: string;
  email: string;
  gstin: string;
  drugLicenseNo: string;
  wholesaleLicenseNo?: string; // Form 20B & 21B Wholesale Drug License
  retailLicenseNo?: string; // Form 20 & 21 Retail Drug License
  wholesaleDefaultMargin?: number; // e.g. 10%
  defaultWholesaleMarginPercent?: number;
  wholesaleCreditDays?: number; // e.g. 30 days
  pharmacyType?: PharmacyBusinessType;
  printLogo?: boolean;
  upiId?: string;
  upiVpa?: string;
  upiQrCodeUrl?: string;
  upiQrUploadedAt?: string;
  upiQrFileName?: string;
  pharmacistName?: string;
  pharmacistRegNo?: string;
  pharmacistQualification?: string;
  printerSettings?: PrinterSettings;
}

export interface ClinicDetails {
  clinicName: string;
  tagline: string;
  address: string;
  taluk: string;
  district: string;
  state: string;
  pincode: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  opdTimingsMorning: string;
  opdTimingsEvening: string;
  consultingRooms: number;
  servicesOffered: string[];
  registeredPharmacist: string;
  pharmacistLicense: string;
}

export interface ClinicConsultation {
  id: string; // CON-2026-001
  date: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorRegNo: string;
  chiefComplaints: string;
  vitals: {
    bloodPressure?: string;
    pulse?: number;
    spo2?: number;
    temperature?: string;
    bloodSugar?: string;
    weight?: number;
  };
  diagnosis: string;
  clinicalNotes: string;
  prescriptions: {
    medicineId: string;
    medicineName: string;
    dosage: string; // e.g. "1-0-1 After Food"
    durationDays: number;
    quantity: number;
    instructions: string;
  }[];
  followUpDate?: string;
  dispensedInPharmacy: boolean;
  posInvoiceId?: string;
}

export interface ShortLink {
  id: string;
  code: string; // e.g. "inv-1002" or "pentose-40"
  domain: string; // e.g. "cityrx.link"
  shortUrl: string; // e.g. "https://cityrx.link/pentose-40"
  originalUrl: string; // internal route or external URL
  title: string;
  category: 'invoice' | 'medicine' | 'website' | 'prescription' | 'custom';
  metadata?: {
    invoiceId?: string;
    medicineId?: string;
    medicineName?: string;
    genericName?: string;
    manufacturer?: string;
    patientName?: string;
    patientPhone?: string;
    amount?: number;
    description?: string;
    tags?: string[];
  };
  clicks: number;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface StockAdjustment {
  id: string; // ADJ-2026-001
  date: string; // ISO date
  type: 'ADD' | 'REMOVE';
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  quantity: number; // positive number adjusted
  previousStock: number;
  newStock: number;
  reason: string;
  customNotes?: string;
  adjustedBy: string;
}

export interface SalesDraft {
  id: string; // e.g. "DRF-SAL-1001" or "HOLD-1001"
  timestamp: string; // Formatted display time
  date: string; // ISO timestamp
  title?: string;
  notes?: string;
  patientName: string;
  patientId?: string;
  patientPhone?: string;
  doctorId?: string;
  doctorName?: string;
  cart: CartItem[];
  itemCount: number;
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  cashierName?: string;
}

export interface PurchaseDraft {
  id: string; // e.g. "DRF-PUR-1001"
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  distributorId: string;
  distributorName: string;
  distributorGstin?: string;
  invoiceNo: string;
  invoiceDate: string;
  paymentDueDate: string;
  notes?: string;
  items: PurchaseInvoiceItem[];
  itemCount: number;
  subtotal: number;
  totalScheme: number;
  totalDiscount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalTax: number;
  grandTotal: number;
  attachment?: PurchaseInvoice['attachment'];
}

export interface CustomerLocation {
  addressLine: string;
  landmark?: string;
  locality: string;
  city: string;
  taluk?: string;
  district?: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  deliveryNotes?: string;
  isGpsDetected?: boolean;
}

export interface CustomerOnlineOrderItem {
  medicineId: string;
  medicineName: string;
  genericName?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  pack?: string;
  dosageForm?: string;
  requiresPrescription?: boolean;
}

export type OnlineOrderStatus =
  | 'Placed'
  | 'Prescription Verified'
  | 'Packed'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type OnlinePaymentMethod = 'UPI' | 'COD' | 'CARD' | 'NET_BANKING';

export type OnlinePaymentStatus = 'Pending' | 'Paid' | 'Cash on Delivery';

export interface CustomerOnlineOrder {
  id: string; // e.g. "ORD-2026-8910"
  orderDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryType: 'home_delivery' | 'store_pickup';
  deliveryAddress: CustomerLocation;
  items: CustomerOnlineOrderItem[];
  prescriptionUrl?: string;
  prescriptionFileName?: string;
  prescriptionRequired?: boolean;
  prescriptionVerified?: boolean;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  paymentMethod: OnlinePaymentMethod;
  paymentStatus: OnlinePaymentStatus;
  upiReference?: string;
  paymentReceiptUrl?: string;
  paymentReceiptFileName?: string;
  orderStatus: OnlineOrderStatus;
  estimatedDeliveryTime?: string;
  notes?: string;
  convertedInvoiceId?: string;
}

export interface CustomerServiceInquiry {
  id: string; // e.g. "INQ-2026-501"
  customerName: string;
  customerPhone: string;
  inquiryType: 'pharmacist_consult' | 'order_tracking' | 'medicine_availability' | 'refill_request' | 'general';
  orderId?: string;
  medicineRequested?: string;
  message: string;
  status: 'Open' | 'Pharmacist Responded' | 'Resolved';
  createdAt: string;
  responseNotes?: string;
}

export interface LowStockAlertItem {
  medicineId: string;
  medicineName: string;
  genericName?: string;
  strength?: string;
  form?: string;
  currentStock: number;
  minStockAlert: number;
  deficit: number;
  suggestedReorderQuantity: number;
  manufacturer?: string;
  rackLocation?: string;
  status: 'critical_zero' | 'low_stock';
  timestamp?: string;
}



