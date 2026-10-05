import { Medicine, Supplier, Doctor, Patient, SaleTransaction, SalesReturn, PurchaseOrder, PurchaseReturn, OperatingExpense, User, PharmacyProfile, PurchaseInvoice, WholesaleBuyer, PharmacyTenant, WholesalePaymentCollection } from './types';
import { EXPANDED_MANUFACTURER_MEDICINES } from './data/expandedMedicines';
import { POPULAR_GENERIC_BRAND_MEDICINES } from './data/popularGenericBrands';
import { PRODUCT_FORM_CATALOG_ITEMS } from './data/productFormCatalog';

export const CITY_MEDICAL_PROFILE: PharmacyProfile = {
  name: 'City Rx - City Medical',
  pharmacyCode: 'CP-MDU-101',
  businessType: 'both', // 'retail' | 'wholesale' | 'both'
  retailActive: true,
  wholesaleActive: true,
  tagline: 'Trusted Community Healthcare & Wholesale Pharma Distributor',
  logoUrl: '/src/assets/images/city_rx_logo_1789366499425.jpg',
  addressLine1: 'Chokkalingapuram',
  taluk: 'Melur Taluk',
  district: 'Madurai District',
  state: 'Tamil Nadu',
  pincode: '625103',
  landmark: 'Near Melur Bus Stand, Chokkalingapuram',
  operatingHours: 'Mon - Sat: 8:00 AM - 10:30 PM | Sun: 9:00 AM - 9:00 PM',
  latitude: 10.0336,
  longitude: 78.3361,
  mobile: '8438678498',
  email: 'citymedical.melur@gmail.com',
  gstin: '33AABCC5541Q1Z8',
  drugLicenseNo: 'TN-MDU-2024-004928 (Form 20, 21, 20B & 21B)',
  retailLicenseNo: 'TN-MDU-2024-R20/21-004928',
  wholesaleLicenseNo: 'TN-MDU-2024-W20B/21B-0084',
  wholesaleDefaultMargin: 12, // 12% margin over cost
  wholesaleCreditDays: 30, // 30-day payment term
  upiId: '8438678498@upi',
  pharmacistName: 'Anusya Begum',
};

export const INITIAL_PHARMACY_TENANTS: PharmacyTenant[] = [
  {
    id: 'pharm-001',
    pharmacyCode: 'CP-MDU-101',
    name: 'City Rx - City Medical (Melur Main)',
    businessType: 'both',
    retailActive: true,
    wholesaleActive: true,
    tagline: 'Trusted Community Healthcare & Wholesale Pharma Distributor',
    mobile: '8438678498',
    email: 'citymedical.melur@gmail.com',
    addressLine1: 'Chokkalingapuram',
    city: 'Melur',
    district: 'Madurai District',
    state: 'Tamil Nadu',
    pincode: '625103',
    gstin: '33AABCC5541Q1Z8',
    drugLicenseNo: 'TN-MDU-2024-004928',
    retailLicenseNo: 'TN-MDU-2024-R20/21-004928',
    wholesaleLicenseNo: 'TN-MDU-2024-W20B/21B-0084',
    subscriptionPlan: 'Enterprise',
    paymentStatus: 'Active',
    paymentMethod: 'UPI',
    paymentUpiId: '8438678498@upi',
    renewalDate: '2027-12-31',
    subscriptionFee: 14999,
    adminUsername: 'admin',
    adminPassword: 'admin123',
    adminEmail: 'citymedical.melur@gmail.com',
    createdAt: '2025-01-01',
    updatedAt: '2026-09-29'
  },
  {
    id: 'pharm-002',
    pharmacyCode: 'CRX-MDU-02',
    name: 'City Rx - Madurai Central Branch',
    businessType: 'retail',
    retailActive: true,
    wholesaleActive: false,
    tagline: '24/7 Emergency & Inpatient Hospital Pharmacy',
    mobile: '9842145678',
    email: 'madurai.central@cityrx.com',
    addressLine1: '45 Palace Road, Near Meenakshi Amman Temple',
    city: 'Madurai',
    district: 'Madurai District',
    state: 'Tamil Nadu',
    pincode: '625001',
    gstin: '33AABCC5541Q2Z7',
    drugLicenseNo: 'TN-MDU-2023-R20/21-8192',
    retailLicenseNo: 'TN-MDU-2023-R20/21-8192',
    wholesaleLicenseNo: '',
    subscriptionPlan: 'Annual',
    paymentStatus: 'Active',
    paymentMethod: 'Bank_NEFT',
    paymentUpiId: 'maduraicentral@upi',
    renewalDate: '2027-06-30',
    subscriptionFee: 9999,
    adminUsername: 'madurai_admin',
    adminPassword: 'pass123',
    adminEmail: 'madurai.central@cityrx.com',
    createdAt: '2025-06-15',
    updatedAt: '2026-09-15'
  },
  {
    id: 'pharm-003',
    pharmacyCode: 'CP-OTK-03',
    name: 'City Pharma Wholesale Depo - Othakadai',
    businessType: 'wholesale',
    retailActive: false,
    wholesaleActive: true,
    tagline: 'Pharma Wholesale Supply to Clinics & Chemists',
    mobile: '9789123490',
    email: 'othakadai.depo@citypharma.com',
    addressLine1: 'Warehouse Complex, Trichy Highway',
    city: 'Othakadai',
    district: 'Madurai District',
    state: 'Tamil Nadu',
    pincode: '625107',
    gstin: '33AABCC5541Q3Z6',
    drugLicenseNo: 'TN-MDU-2024-W20B/21B-9021',
    retailLicenseNo: '',
    wholesaleLicenseNo: 'TN-MDU-2024-W20B/21B-9021',
    subscriptionPlan: 'Annual',
    paymentStatus: 'Active',
    paymentMethod: 'UPI',
    paymentUpiId: '8438678498@upi',
    renewalDate: '2027-09-01',
    subscriptionFee: 11999,
    adminUsername: 'depo_admin',
    adminPassword: 'depo123',
    adminEmail: 'othakadai.depo@citypharma.com',
    createdAt: '2025-09-01',
    updatedAt: '2026-09-20'
  }
];

export const INITIAL_WHOLESALE_PAYMENTS: WholesalePaymentCollection[] = [
  {
    id: 'RCP-2026-001',
    date: '2026-09-28',
    buyerId: 'wb-001',
    buyerName: 'Al-Ameen Medicals & Surgical',
    amount: 15000,
    paymentMode: 'Bank_NEFT',
    referenceNo: 'NEFT-SBIN20260928014',
    bankName: 'State Bank of India',
    notes: 'Payment received against Invoice INV-2026-4821',
    receivedBy: 'Chief Accountant'
  },
  {
    id: 'RCP-2026-002',
    date: '2026-09-27',
    buyerId: 'wb-002',
    buyerName: 'Kaveri Multi-Specialty Clinic & Pharmacy',
    amount: 25000,
    paymentMode: 'Cheque',
    referenceNo: 'CHQ-890124',
    bankName: 'HDFC Bank Melur',
    notes: 'Part clearance of outstanding credit',
    receivedBy: 'Fakrudeen Ajmal'
  }
];

export const INITIAL_WHOLESALE_BUYERS: WholesaleBuyer[] = [
  {
    id: 'wb-001',
    businessName: 'Meenakshi Medicals & General Store',
    contactPerson: 'S. Ramanathan, D.Pharm',
    phone: '9842109841',
    email: 'meenakshi.medicals.melur@gmail.com',
    address: '42 Main Bazaar Street, Near Roundana',
    city: 'Melur',
    district: 'Madurai',
    state: 'Tamil Nadu',
    stateCode: '33',
    pincode: '625106',
    gstin: '33AABCM8921R1ZC',
    drugLicenseNo: 'TN-MDU-2021-R20/21-4192',
    creditLimit: 75000,
    creditDays: 30,
    outstandingBalance: 14200,
    notes: 'Leading retail chemist in Melur market. Regular weekly purchaser.'
  },
  {
    id: 'wb-002',
    businessName: 'Kaveri Multi-Specialty Clinic & Pharmacy',
    contactPerson: 'Dr. K. Sundararajan, MD',
    phone: '9443187210',
    email: 'kaveri.clinic.mdu@gmail.com',
    address: '18 Trichy Main Road, Alagarkoil Junction',
    city: 'Melur',
    district: 'Madurai',
    state: 'Tamil Nadu',
    stateCode: '33',
    pincode: '625103',
    gstin: '33AAECK4012Q1Z9',
    drugLicenseNo: 'TN-MDU-2022-R20/21-5082',
    creditLimit: 120000,
    creditDays: 45,
    outstandingBalance: 32500,
    notes: 'Regular buyer for IV fluids, antibiotic injectables, and surgical items.'
  },
  {
    id: 'wb-003',
    businessName: 'Madurai Life Care Chemist',
    contactPerson: 'M. Selvam',
    phone: '9789123456',
    email: 'lifecare.madurai@gmail.com',
    address: '105 Mattuthavani Bus Stand Road',
    city: 'Madurai',
    district: 'Madurai',
    state: 'Tamil Nadu',
    stateCode: '33',
    pincode: '625007',
    gstin: '33AABCL7190K1Z5',
    drugLicenseNo: 'TN-MDU-2020-W20B/21B-3100',
    creditLimit: 150000,
    creditDays: 30,
    outstandingBalance: 48900,
    notes: 'Stockist & retail chemist in Mattuthavani. Bulk box orders.'
  },
  {
    id: 'wb-004',
    businessName: 'Al-Ameen Medicals & Surgicals',
    contactPerson: 'H. Mohamed Farooq',
    phone: '8056123987',
    email: 'alameenmedicals@gmail.com',
    address: '28 Melur Main Road, Othakadai',
    city: 'Madurai',
    district: 'Madurai',
    state: 'Tamil Nadu',
    stateCode: '33',
    pincode: '625107',
    gstin: '33AAGCA5612P1ZA',
    drugLicenseNo: 'TN-MDU-2023-R20/21-6194',
    creditLimit: 50000,
    creditDays: 15,
    outstandingBalance: 8400,
    notes: 'Prompt payment within 15 days.'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    username: 'admin',
    password: 'admin123',
    name: 'Dr. Fakrudeen Ajmal, B.Pharm / M.Pharm',
    role: 'admin',
    email: 'citymedical.melur@gmail.com',
    phone: '8438678498',
    licenseNumber: 'TN-RPH-61942',
    status: 'active',
    createdAt: '2025-01-01',
    lastLogin: '2026-09-14 08:30 AM',
    pin: '1234',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'usr-2',
    username: 'pharmacist',
    password: 'pharm123',
    name: 'Anusya Begum, D.Pharm (Registered Pharmacist)',
    role: 'pharmacist',
    email: 'anusya.citymed@gmail.com',
    phone: '9842154321',
    licenseNumber: 'TN-RPH-78419',
    status: 'active',
    createdAt: '2025-01-05',
    lastLogin: '2026-09-14 09:15 AM',
    pin: '5678',
    avatar: 'https://images.unsplash.com/photo-1594824813583-125c13e51493?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'usr-3',
    username: 'cashier',
    password: 'cash123',
    name: 'M. Meenakshi (Billing POS)',
    role: 'cashier',
    email: 'pos.citymed@gmail.com',
    phone: '9443217890',
    status: 'active',
    createdAt: '2025-02-10',
    lastLogin: '2026-09-13 04:45 PM',
    pin: '9999',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'usr-4',
    username: 'doctor',
    password: 'doc123',
    name: 'Dr. R. Sundaresan, MD (Consultant Physician)',
    role: 'doctor',
    email: 'dr.sundaresan.melur@gmail.com',
    phone: '9842199887',
    licenseNumber: 'TNMC-44910',
    status: 'active',
    createdAt: '2025-01-15',
    lastLogin: '2026-09-14 07:50 AM',
    pin: '4321',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200',
  }
];

const BASE_INITIAL_MEDICINES: Medicine[] = [
  // ================= RETAIL OTC / FMCG CATEGORIES =================
  {
    id: 'med-fmcg-01',
    name: 'Dettol Original Antiseptic Bath Soap 75g',
    genericName: 'Chloroxylenol + Pine Oil',
    strength: '75g Bar',
    form: 'Soap',
    manufacturer: 'Reckitt Benckiser',
    category: 'Soap',
    prescriptionRequired: false,
    scheduleType: 'OTC',
    hsnCode: '340111',
    taxRate: 18,
    minStockAlert: 20,
    pack: '1 Soap Bar',
    packSize: 1,
    rackLocation: 'Rack OTC-01',
    description: 'Trusted antiseptic protection soap bar for hygiene and body wash.',
    batches: [
      {
        batchNumber: 'DTL-S26',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-10-01',
        stock: 65,
        costPrice: 32.00,
        sellingPrice: 42.00,
        mrp: 45.00,
        location: 'Rack OTC-01'
      }
    ]
  },
  {
    id: 'med-fmcg-02',
    name: 'Head & Shoulders Anti-Dandruff Shampoo 180ml',
    genericName: 'Zinc Pyrithione Scalp Formula',
    strength: '180 ml',
    form: 'Shampoo',
    manufacturer: 'Procter & Gamble (P&G)',
    category: 'Shampoo',
    prescriptionRequired: false,
    scheduleType: 'OTC',
    hsnCode: '330510',
    taxRate: 18,
    minStockAlert: 15,
    pack: '180ml Bottle',
    packSize: 1,
    rackLocation: 'Rack OTC-02',
    description: 'Clinically proven daily anti-dandruff hair cleanser and scalp care.',
    batches: [
      {
        batchNumber: 'HNS-884',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-08-01',
        stock: 38,
        costPrice: 135.00,
        sellingPrice: 175.00,
        mrp: 185.00,
        location: 'Rack OTC-02'
      }
    ]
  },
  {
    id: 'med-fmcg-03',
    name: 'Colgate Total Antibacterial Toothpaste 120g',
    genericName: 'Sodium Monofluorophosphate + Zinc',
    strength: '120g Tube',
    form: 'Paste',
    manufacturer: 'Colgate-Palmolive',
    category: 'Paste',
    prescriptionRequired: false,
    scheduleType: 'OTC',
    hsnCode: '330610',
    taxRate: 18,
    minStockAlert: 20,
    pack: '120g Tube',
    packSize: 1,
    rackLocation: 'Rack OTC-03',
    description: '12-hour antibacterial whole-mouth cavity and plaque protection paste.',
    batches: [
      {
        batchNumber: 'CLG-701A',
        expiryDate: '2027-06-30',
        manufacturingDate: '2025-06-01',
        stock: 45,
        costPrice: 68.00,
        sellingPrice: 90.00,
        mrp: 95.00,
        location: 'Rack OTC-03'
      }
    ]
  },
  {
    id: 'med-fmcg-04',
    name: 'Horlicks Nutri-Wheat Digestive Biscuits 200g',
    genericName: 'Fortified Malt Whole Wheat Biscuits',
    strength: '200g Pack',
    form: 'Biscuits',
    manufacturer: 'Hindustan Unilever (HUL)',
    category: 'Biscuits',
    prescriptionRequired: false,
    scheduleType: 'OTC',
    hsnCode: '190531',
    taxRate: 18,
    minStockAlert: 25,
    pack: '200g Pack',
    packSize: 1,
    rackLocation: 'Rack FOOD-01',
    description: 'High-fibre malted digestive dietary biscuits for adult energy.',
    batches: [
      {
        batchNumber: 'HLK-B91',
        expiryDate: '2027-04-30',
        manufacturingDate: '2026-01-01',
        stock: 50,
        costPrice: 36.00,
        sellingPrice: 48.00,
        mrp: 50.00,
        location: 'Rack FOOD-01'
      }
    ]
  },
  {
    id: 'med-fmcg-05',
    name: 'Halls Mentho-Lyptus Lozenges Candy Jar (100s)',
    genericName: 'Menthol + Eucalyptus Lozenges',
    strength: 'Jar 100 Candies',
    form: 'Candy',
    manufacturer: 'Mondelez India',
    category: 'Candy',
    prescriptionRequired: false,
    scheduleType: 'OTC',
    hsnCode: '170490',
    taxRate: 12,
    minStockAlert: 10,
    pack: 'Jar of 100',
    packSize: 100,
    rackLocation: 'Rack CANDY-01',
    description: 'Refreshing vapor action throat cooling mentholated candies.',
    batches: [
      {
        batchNumber: 'HLL-C10',
        expiryDate: '2027-12-31',
        manufacturingDate: '2025-11-01',
        stock: 30,
        costPrice: 70.00,
        sellingPrice: 95.00,
        mrp: 100.00,
        location: 'Rack CANDY-01'
      }
    ]
  },
  {
    id: 'med-fmcg-06',
    name: 'Ensure Complete Nutrition Drink Vanilla 400g',
    genericName: 'Balanced Protein + 32 Nutrients Food Drink',
    strength: '400g Tin',
    form: 'Food Product',
    manufacturer: 'Abbott Healthcare',
    category: 'Food Products',
    prescriptionRequired: false,
    scheduleType: 'OTC',
    hsnCode: '210690',
    taxRate: 18,
    minStockAlert: 12,
    pack: '400g Tin',
    packSize: 1,
    rackLocation: 'Rack FOOD-02',
    description: 'Scientific adult balanced nutritional supplement for strength and vitality.',
    batches: [
      {
        batchNumber: 'ENS-V402',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-09-15',
        stock: 22,
        costPrice: 510.00,
        sellingPrice: 650.00,
        mrp: 680.00,
        location: 'Rack FOOD-02'
      }
    ]
  },

  // ================= SCHEDULE H1 RESTRICTED MEDICINES (PRESCRIPTION MANDATORY) =================
  {
    id: 'med-sched-h1-01',
    name: 'Restyl 0.5 (Alprazolam 0.5mg)',
    genericName: 'Alprazolam',
    strength: '0.5 mg',
    form: 'Tablet',
    manufacturer: 'Cipla Ltd',
    category: 'Analgesic & Antipyretic',
    prescriptionRequired: true,
    scheduleType: 'H1',
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    pack: '15 Tablets',
    packSize: 15,
    rackLocation: 'Vault Schedule H1',
    description: 'Schedule H1 psychotropic. Mandatory Doctor Prescription & Register Entry Rule 65(9).',
    batches: [
      {
        batchNumber: 'RST-9021',
        expiryDate: '2027-05-31',
        manufacturingDate: '2025-05-01',
        stock: 60,
        costPrice: 38.00,
        sellingPrice: 55.00,
        mrp: 58.00,
        location: 'Vault Schedule H1'
      }
    ]
  },
  {
    id: 'med-sched-h1-02',
    name: 'Taxim-O 200 (Cefixime 200mg)',
    genericName: 'Cefixime',
    strength: '200 mg',
    form: 'Tablet',
    manufacturer: 'Alkem Laboratories',
    category: 'Antibiotic & Antimicrobial',
    prescriptionRequired: true,
    scheduleType: 'H1',
    hsnCode: '300420',
    taxRate: 12,
    minStockAlert: 25,
    pack: '10 Tablets',
    packSize: 10,
    rackLocation: 'Vault Schedule H1',
    description: 'Third generation cephalosporin antibiotic under Schedule H1 restriction.',
    batches: [
      {
        batchNumber: 'TXM-441B',
        expiryDate: '2027-07-31',
        manufacturingDate: '2025-07-01',
        stock: 45,
        costPrice: 78.00,
        sellingPrice: 112.00,
        mrp: 120.00,
        location: 'Vault Schedule H1'
      }
    ]
  },
  {
    id: 'med-sched-h1-03',
    name: 'Nitrest 10 (Zolpidem 10mg)',
    genericName: 'Zolpidem Tartrate',
    strength: '10 mg',
    form: 'Tablet',
    manufacturer: 'Sun Pharma',
    category: 'Analgesic & Antipyretic',
    prescriptionRequired: true,
    scheduleType: 'H1',
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 15,
    pack: '10 Tablets',
    packSize: 10,
    rackLocation: 'Vault Schedule H1',
    description: 'Schedule H1 non-benzodiazepine hypnotic. Doctor Rx mandatory.',
    batches: [
      {
        batchNumber: 'NTR-209',
        expiryDate: '2027-03-31',
        manufacturingDate: '2025-03-01',
        stock: 35,
        costPrice: 62.00,
        sellingPrice: 92.00,
        mrp: 98.00,
        location: 'Vault Schedule H1'
      }
    ]
  },

  {
    id: 'med-01',
    name: 'Augmentin 625 Duo',
    genericName: 'Amoxicillin + Clavulanic Acid',
    strength: '500mg + 125mg',
    form: 'Tablet',
    manufacturer: 'GlaxoSmithKline (GSK)',
    category: 'Antibiotic',
    prescriptionRequired: true,
    hsnCode: '300410',
    taxRate: 12,
    minStockAlert: 20,
    description: 'Broad spectrum penicillin antibiotic indicated for bacterial infections.',
    sideEffects: 'Mild nausea, loose stools, skin rash.',
    dosageGuidelines: '1 tablet every 12 hours after meals.',
    batches: [
      {
        batchNumber: 'AUG-24B09',
        expiryDate: '2026-11-30',
        manufacturingDate: '2024-11-01',
        stock: 35,
        costPrice: 142.50,
        sellingPrice: 204.00,
        mrp: 215.00,
        location: 'Rack B-14',
      },
      {
        batchNumber: 'AUG-25A02',
        expiryDate: '2027-04-15',
        manufacturingDate: '2025-04-01',
        stock: 60,
        costPrice: 144.00,
        sellingPrice: 204.00,
        mrp: 215.00,
        location: 'Rack B-14',
      }
    ]
  },
  {
    id: 'med-02',
    name: 'Moxikind-CV 625',
    genericName: 'Amoxicillin + Clavulanic Acid',
    strength: '500mg + 125mg',
    form: 'Tablet',
    manufacturer: 'Mankind Pharma',
    category: 'Antibiotic',
    prescriptionRequired: true,
    hsnCode: '300410',
    taxRate: 12,
    minStockAlert: 25,
    description: 'Affordable generic bio-equivalent for Augmentin 625 Duo.',
    sideEffects: 'Mild gastrointestinal discomfort.',
    dosageGuidelines: '1 tablet twice daily with water.',
    batches: [
      {
        batchNumber: 'MXK-8812',
        expiryDate: '2026-12-15',
        manufacturingDate: '2024-12-01',
        stock: 48,
        costPrice: 88.00,
        sellingPrice: 135.00,
        mrp: 145.00,
        location: 'Rack B-15',
      }
    ]
  },
  {
    id: 'med-03',
    name: 'Dolo 650',
    genericName: 'Paracetamol / Acetaminophen',
    strength: '650 mg',
    form: 'Tablet',
    manufacturer: 'Micro Labs',
    category: 'Analgesic & Antipyretic',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 40,
    description: 'Rapid acting fever reducer and pain reliever.',
    sideEffects: 'Rare allergic reactions. Do not exceed 4g/day.',
    dosageGuidelines: '1 tablet every 6 to 8 hours as needed for fever.',
    batches: [
      {
        batchNumber: 'DL-993A',
        expiryDate: '2026-10-20', // Expiring relatively soon
        manufacturingDate: '2024-10-01',
        stock: 18, // Below minStockAlert!
        costPrice: 19.50,
        sellingPrice: 32.00,
        mrp: 34.00,
        location: 'Rack A-01',
      },
      {
        batchNumber: 'DL-994B',
        expiryDate: '2027-08-30',
        manufacturingDate: '2025-08-01',
        stock: 90,
        costPrice: 20.00,
        sellingPrice: 32.00,
        mrp: 34.00,
        location: 'Rack A-01',
      }
    ]
  },
  {
    id: 'med-04',
    name: 'Calpol 650',
    genericName: 'Paracetamol / Acetaminophen',
    strength: '650 mg',
    form: 'Tablet',
    manufacturer: 'GSK Pharma',
    category: 'Analgesic & Antipyretic',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    description: 'Trusted paracetamol formulation with rapid absorption profile.',
    sideEffects: 'Well tolerated.',
    dosageGuidelines: '1 tablet post meals up to 3 times a day.',
    batches: [
      {
        batchNumber: 'CAL-338',
        expiryDate: '2027-01-15',
        manufacturingDate: '2025-01-10',
        stock: 55,
        costPrice: 18.00,
        sellingPrice: 30.00,
        mrp: 32.50,
        location: 'Rack A-02',
      }
    ]
  },
  {
    id: 'med-05',
    name: 'Crocin Advance 500',
    genericName: 'Paracetamol / Acetaminophen',
    strength: '500 mg',
    form: 'Tablet',
    manufacturer: 'Haleon / GSK',
    category: 'Analgesic & Antipyretic',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    description: 'Optizorb technology paracetamol for fast pain relief.',
    sideEffects: 'Minimal side effects at normal dosages.',
    dosageGuidelines: '1-2 tablets every 4 to 6 hours as required.',
    batches: [
      {
        batchNumber: 'CRC-104',
        expiryDate: '2026-11-10',
        manufacturingDate: '2024-11-01',
        stock: 12, // Low stock alert!
        costPrice: 14.00,
        sellingPrice: 22.00,
        mrp: 24.00,
        location: 'Rack A-03',
      }
    ]
  },
  {
    id: 'med-06',
    name: 'Glycomet-GP 1',
    genericName: 'Glimepiride + Metformin',
    strength: '1mg + 500mg SR',
    form: 'Tablet',
    manufacturer: 'USV Pvt Ltd',
    category: 'Antidiabetic',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 35,
    description: 'Dual combination for glycemic control in adult Type 2 Diabetes.',
    sideEffects: 'Hypoglycemia risk, metallic taste.',
    dosageGuidelines: '1 tablet once daily before first main meal.',
    batches: [
      {
        batchNumber: 'GLY-772C',
        expiryDate: '2026-10-05', // near expiry
        manufacturingDate: '2024-09-15',
        stock: 14,
        costPrice: 78.00,
        sellingPrice: 118.00,
        mrp: 125.00,
        location: 'Rack C-08',
      },
      {
        batchNumber: 'GLY-801D',
        expiryDate: '2027-06-20',
        manufacturingDate: '2025-06-01',
        stock: 75,
        costPrice: 80.00,
        sellingPrice: 118.00,
        mrp: 125.00,
        location: 'Rack C-08',
      }
    ]
  },
  {
    id: 'med-07',
    name: 'Glimisave M1',
    genericName: 'Glimepiride + Metformin',
    strength: '1mg + 500mg SR',
    form: 'Tablet',
    manufacturer: 'Eris Lifesciences',
    category: 'Antidiabetic',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    description: 'Bio-equivalent anti-diabetic alternative providing 30% cost savings.',
    sideEffects: 'Mild stomach upset.',
    dosageGuidelines: '1 tablet once daily with breakfast.',
    batches: [
      {
        batchNumber: 'GLM-404',
        expiryDate: '2027-03-30',
        manufacturingDate: '2025-03-15',
        stock: 45,
        costPrice: 52.00,
        sellingPrice: 82.00,
        mrp: 90.00,
        location: 'Rack C-09',
      }
    ]
  },
  {
    id: 'med-08',
    name: 'Atorva 10',
    genericName: 'Atorvastatin',
    strength: '10 mg',
    form: 'Tablet',
    manufacturer: 'Zydus Cadila',
    category: 'Cardiovascular / Statin',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    description: 'HMG-CoA reductase inhibitor for reducing LDL cholesterol.',
    sideEffects: 'Muscle aches, headache.',
    dosageGuidelines: '1 tablet daily at bedtime.',
    batches: [
      {
        batchNumber: 'ATV-211',
        expiryDate: '2027-02-28',
        manufacturingDate: '2025-02-01',
        stock: 62,
        costPrice: 65.00,
        sellingPrice: 102.00,
        mrp: 110.00,
        location: 'Rack D-04',
      }
    ]
  },
  {
    id: 'med-09',
    name: 'Lipitor 10',
    genericName: 'Atorvastatin',
    strength: '10 mg',
    form: 'Tablet',
    manufacturer: 'Pfizer',
    category: 'Cardiovascular / Statin',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 15,
    description: 'Original innovator brand for Atorvastatin calcium.',
    sideEffects: 'Occasional mild myalgia.',
    dosageGuidelines: '1 tablet once daily at night.',
    batches: [
      {
        batchNumber: 'LPT-990',
        expiryDate: '2026-12-31',
        manufacturingDate: '2024-12-10',
        stock: 8, // Low stock
        costPrice: 160.00,
        sellingPrice: 245.00,
        mrp: 260.00,
        location: 'Rack D-04',
      }
    ]
  },
  {
    id: 'med-10',
    name: 'Pantocid 40',
    genericName: 'Pantoprazole',
    strength: '40 mg',
    form: 'Tablet',
    manufacturer: 'Sun Pharma',
    category: 'Gastrointestinal / PPI',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    description: 'Proton-pump inhibitor for GERD, gastric ulcers and acid reflux.',
    sideEffects: 'Abdominal pain, flatulence.',
    dosageGuidelines: '1 tablet empty stomach in the morning 30 mins before breakfast.',
    batches: [
      {
        batchNumber: 'PAN-881A',
        expiryDate: '2027-05-15',
        manufacturingDate: '2025-05-01',
        stock: 80,
        costPrice: 92.00,
        sellingPrice: 145.00,
        mrp: 155.00,
        location: 'Rack E-02',
      }
    ]
  },
  {
    id: 'med-11',
    name: 'Pan 40',
    genericName: 'Pantoprazole',
    strength: '40 mg',
    form: 'Tablet',
    manufacturer: 'Alkem Laboratories',
    category: 'Gastrointestinal / PPI',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    description: 'Popular high-compliance pantoprazole formulation.',
    sideEffects: 'Mild headache or nausea.',
    dosageGuidelines: '1 tablet on empty stomach in the morning.',
    batches: [
      {
        batchNumber: 'PN-440',
        expiryDate: '2027-04-10',
        manufacturingDate: '2025-04-01',
        stock: 50,
        costPrice: 85.00,
        sellingPrice: 130.00,
        mrp: 140.00,
        location: 'Rack E-02',
      }
    ]
  },
  {
    id: 'med-12',
    name: 'Montair-LC',
    genericName: 'Montelukast + Levocetirizine',
    strength: '10mg + 5mg',
    form: 'Tablet',
    manufacturer: 'Cipla Ltd',
    category: 'Respiratory & Antiallergic',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    description: 'Leukotriene receptor antagonist + antihistamine for allergic rhinitis and asthma.',
    sideEffects: 'Drowsiness, dry mouth.',
    dosageGuidelines: '1 tablet in the evening before sleep.',
    batches: [
      {
        batchNumber: 'MNT-192',
        expiryDate: '2027-03-20',
        manufacturingDate: '2025-03-01',
        stock: 38,
        costPrice: 135.00,
        sellingPrice: 210.00,
        mrp: 225.00,
        location: 'Rack F-06',
      }
    ]
  },
  {
    id: 'med-13',
    name: 'Azithral 500',
    genericName: 'Azithromycin',
    strength: '500 mg',
    form: 'Tablet',
    manufacturer: 'Alembic Pharmaceuticals',
    category: 'Antibiotic / Macrolide',
    prescriptionRequired: true,
    hsnCode: '300420',
    taxRate: 12,
    minStockAlert: 20,
    description: 'Broad spectrum macrolide antibiotic for upper and lower respiratory infections.',
    sideEffects: 'Diarrhea, stomach cramps.',
    dosageGuidelines: '1 tablet once daily for 3 to 5 days as prescribed.',
    batches: [
      {
        batchNumber: 'AZT-701',
        expiryDate: '2026-10-31', // Expiring soon!
        manufacturingDate: '2024-10-15',
        stock: 22,
        costPrice: 72.00,
        sellingPrice: 119.00,
        mrp: 128.00,
        location: 'Rack B-03',
      }
    ]
  },
  {
    id: 'med-14',
    name: 'Telma 40',
    genericName: 'Telmisartan',
    strength: '40 mg',
    form: 'Tablet',
    manufacturer: 'Glenmark Pharmaceuticals',
    category: 'Cardiovascular / Antihypertensive',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    description: 'Angiotensin II receptor blocker (ARB) for essential hypertension.',
    sideEffects: 'Dizziness, sinus pain, back pain.',
    dosageGuidelines: '1 tablet once daily in the morning.',
    batches: [
      {
        batchNumber: 'TLM-552',
        expiryDate: '2027-09-15',
        manufacturingDate: '2025-09-01',
        stock: 65,
        costPrice: 125.00,
        sellingPrice: 195.00,
        mrp: 210.00,
        location: 'Rack D-11',
      }
    ]
  },
  {
    id: 'med-15',
    name: 'Asthalin Inhaler 100mcg',
    genericName: 'Salbutamol / Albuterol',
    strength: '100 mcg (200 MD)',
    form: 'Inhaler',
    manufacturer: 'Cipla Ltd',
    category: 'Respiratory / Bronchodilator',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 15,
    description: 'Fast-acting bronchodilator for acute asthma bronchospasm relief.',
    sideEffects: 'Tremor, palpitation, mild throat irritation.',
    dosageGuidelines: '1-2 puffs as required during wheezing or breathlessness.',
    batches: [
      {
        batchNumber: 'AST-803',
        expiryDate: '2027-07-25',
        manufacturingDate: '2025-07-01',
        stock: 28,
        costPrice: 110.00,
        sellingPrice: 168.00,
        mrp: 178.00,
        location: 'Cold/Ambient Cabinet 2',
      }
    ]
  }
];

const ALL_CATALOG_MEDICINES: Medicine[] = [
  ...BASE_INITIAL_MEDICINES,
  ...EXPANDED_MANUFACTURER_MEDICINES.filter(
    exp => !BASE_INITIAL_MEDICINES.some(base => base.id === exp.id || base.name.toLowerCase() === exp.name.toLowerCase())
  )
];

export const INITIAL_MEDICINES: Medicine[] = [
  ...ALL_CATALOG_MEDICINES,
  ...POPULAR_GENERIC_BRAND_MEDICINES.filter(
    gen => !ALL_CATALOG_MEDICINES.some(cat => cat.id === gen.id || cat.name.toLowerCase() === gen.name.toLowerCase())
  ),
  ...PRODUCT_FORM_CATALOG_ITEMS.filter(
    item => !ALL_CATALOG_MEDICINES.some(cat => cat.id === item.id || cat.name.toLowerCase() === item.name.toLowerCase())
  )
].map(med => ({
  ...med,
  batches: (med.batches || []).map(b => ({
    ...b,
    stock: 0
  }))
}));

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Apex MedPharma Distributors Pvt Ltd',
    contactPerson: 'Vikas Malhotra',
    phone: '+91 98201 44521',
    email: 'orders@apexmedpharma.com',
    address: 'Warehouse 4B, MIDC Industrial Area, Mumbai, MH 400093',
    gstin: '27AABCA1234F1Z5',
    drugLicenseNo: 'MH-MZ4-192847',
    paymentTerms: 'Net 30',
    outstandingPayable: 42500.00,
    rating: 4.8,
    agencyCode: 'APEX-MH-01',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'sup-2',
    name: 'MediGlobe Healthcare Logistics',
    contactPerson: 'Anjali Deshmukh',
    phone: '+91 97654 22109',
    email: 'supply@mediglobe.in',
    address: 'Plot 78, Phase II Electronic City, Bengaluru, KA 560100',
    gstin: '29AAACM5678P1ZW',
    drugLicenseNo: 'KA-BLR-847291',
    paymentTerms: 'Net 15',
    outstandingPayable: 18200.00,
    rating: 4.6,
    agencyCode: 'MGH-KA-02',
    image: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'sup-3',
    name: 'Zenith BioLife Wholesale Hub',
    contactPerson: 'Rajiv Singhania',
    phone: '+91 98110 88234',
    email: 'orders@zenithbiolife.co',
    address: 'Okhla Industrial Phase III, New Delhi, DL 110020',
    gstin: '07AAACZ9901M1ZQ',
    drugLicenseNo: 'DL-NDL-334190',
    paymentTerms: 'Net 30',
    outstandingPayable: 31450.00,
    rating: 4.9,
    agencyCode: 'ZBL-DL-03',
    image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=200&auto=format&fit=crop&q=80',
  }
];

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Robert Chen, MD',
    specialization: 'Cardiology & Hypertension',
    clinicName: 'Metro Heart Institute',
    phone: '+91 98211 40590',
    email: 'dr.chen@metroheart.org',
    registrationNumber: 'MCI-2012-44910',
    availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
    consultationFee: 750,
  },
  {
    id: 'doc-2',
    name: 'Dr. Ananya Iyer, MD',
    specialization: 'Endocrinology & Diabetology',
    clinicName: 'Nightingale Endocrine Centre',
    phone: '+91 98330 91823',
    email: 'ananya.iyer@endocrinehealth.org',
    registrationNumber: 'KMC-2015-89102',
    availableDays: ['Tue', 'Thu', 'Sat'],
    consultationFee: 800,
  },
  {
    id: 'doc-3',
    name: 'Dr. Amitav Banerjee, MBBS, MD',
    specialization: 'Pulmonology & Chest Specialist',
    clinicName: 'City Chest & Allergy Clinic',
    phone: '+91 98401 77215',
    email: 'amitav.b@citychest.med',
    registrationNumber: 'WB-2009-32014',
    availableDays: ['Mon', 'Tue', 'Thu', 'Fri'],
    consultationFee: 700,
  },
  {
    id: 'doc-4',
    name: 'Dr. Neha Kulkarni, MBBS, DNB',
    specialization: 'General Medicine & Family Physician',
    clinicName: 'Arogya Community Clinic',
    phone: '+91 98220 54109',
    email: 'drneha@arogyaclinic.com',
    registrationNumber: 'MMC-2018-09124',
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    consultationFee: 500,
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-101',
    name: 'Kavita Sundaram',
    age: 58,
    gender: 'Female',
    phone: '+91 98450 12345',
    email: 'kavita.s@example.com',
    bloodGroup: 'B+',
    allergies: ['Penicillin', 'Sulfa drugs'],
    chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
    address: 'A-402, Green Glen Layout, Bellandur, Bengaluru',
    registeredDate: '2024-03-12',
    lastVisitDate: '2026-08-28',
    creditLimit: 5000,
    outstandingDue: 1450,
    creditDays: 30,
    creditStatus: 'Due',
    creditDueDate: '2026-09-28',
    lastPaymentDate: '2026-08-10',
    creditLedger: [
      {
        id: 'pce-101-1',
        patientId: 'pat-101',
        date: '2026-08-10',
        type: 'Credit_Sale',
        invoiceId: 'INV-2026-1042',
        amount: 2450,
        balanceAfter: 2450,
        notes: 'Monthly chronic prescription (Glycomet + Telma)',
        recordedBy: 'Pharmacist Anusya'
      },
      {
        id: 'pce-101-2',
        patientId: 'pat-101',
        date: '2026-08-25',
        type: 'Payment_Received',
        amount: 1000,
        balanceAfter: 1450,
        paymentMethod: 'UPI',
        referenceNo: 'UPI-982144129',
        notes: 'Partial payment received via PhonePe',
        recordedBy: 'Chief Pharmacist'
      }
    ],
    refillReminders: [
      {
        id: 'ref-01',
        patientId: 'pat-101',
        medicineName: 'Glycomet-GP 1 (Glimepiride + Metformin 1mg/500mg)',
        dosage: '1 tablet once daily with breakfast',
        prescribedDate: '2026-08-20',
        daysSupply: 30,
        nextRefillDue: '2026-09-18', // Due in 6 days!
        status: 'Due Soon',
      },
      {
        id: 'ref-02',
        patientId: 'pat-101',
        medicineName: 'Telma 40 (Telmisartan 40mg)',
        dosage: '1 tablet once daily morning',
        prescribedDate: '2026-08-15',
        daysSupply: 30,
        nextRefillDue: '2026-09-14', // Overdue/Critical!
        status: 'Due Soon',
      }
    ]
  },
  {
    id: 'pat-102',
    name: 'Arjun Ramesh Menon',
    age: 64,
    gender: 'Male',
    phone: '+91 98200 98765',
    email: 'arjun.menon@example.com',
    bloodGroup: 'O+',
    allergies: ['Aspirin / NSAIDs (Asthma trigger)'],
    chronicConditions: ['Coronary Artery Disease', 'Dyslipidemia', 'Mild Asthma'],
    address: '12-B, Sagar Tarang Apartments, Worli Sea Face, Mumbai',
    registeredDate: '2024-05-18',
    lastVisitDate: '2026-09-02',
    creditLimit: 7500,
    outstandingDue: 2850,
    creditDays: 15,
    creditStatus: 'Overdue',
    creditDueDate: '2026-09-01',
    lastPaymentDate: '2026-07-25',
    creditLedger: [
      {
        id: 'pce-102-1',
        patientId: 'pat-102',
        date: '2026-08-15',
        type: 'Credit_Sale',
        invoiceId: 'INV-2026-1180',
        amount: 2850,
        balanceAfter: 2850,
        notes: 'Cardiac medicines + Inhaler pack',
        recordedBy: 'Pharmacist'
      }
    ],
    refillReminders: [
      {
        id: 'ref-03',
        patientId: 'pat-102',
        medicineName: 'Atorva 10 (Atorvastatin 10mg)',
        dosage: '1 tablet daily at night',
        prescribedDate: '2026-08-10',
        daysSupply: 30,
        nextRefillDue: '2026-09-09',
        status: 'Overdue',
      },
      {
        id: 'ref-04',
        patientId: 'pat-102',
        medicineName: 'Asthalin Inhaler 100mcg',
        dosage: '2 puffs PRN wheezing',
        prescribedDate: '2026-07-20',
        daysSupply: 60,
        nextRefillDue: '2026-09-20',
        status: 'Active',
      }
    ]
  },
  {
    id: 'pat-103',
    name: 'Meera Rajesh Nair',
    age: 34,
    gender: 'Female',
    phone: '+91 97110 33445',
    email: 'meera.nair@example.com',
    bloodGroup: 'A+',
    allergies: ['None reported'],
    chronicConditions: ['Allergic Bronchitis', 'GERD'],
    address: 'Flat 104, Sunrise Residency, Indiranagar, Bengaluru',
    registeredDate: '2025-01-10',
    lastVisitDate: '2026-09-10',
    creditLimit: 3000,
    outstandingDue: 0,
    creditDays: 15,
    creditStatus: 'Good',
    lastPaymentDate: '2026-09-10',
    creditLedger: [],
    refillReminders: [
      {
        id: 'ref-05',
        patientId: 'pat-103',
        medicineName: 'Montair-LC (Montelukast + Levocetirizine)',
        dosage: '1 tablet nightly',
        prescribedDate: '2026-08-25',
        daysSupply: 30,
        nextRefillDue: '2026-09-24',
        status: 'Active',
      }
    ]
  },
  {
    id: 'pat-104',
    name: 'S. Muthu Krishnan',
    age: 52,
    gender: 'Male',
    phone: '9443187210',
    email: 'muthu.melur@gmail.com',
    bloodGroup: 'O+',
    allergies: ['None'],
    chronicConditions: ['Hypertension', 'Arthritis'],
    address: '42 Bazaar Street, Melur, Madurai',
    registeredDate: '2024-01-15',
    lastVisitDate: '2026-09-12',
    creditLimit: 6000,
    outstandingDue: 1820,
    creditDays: 30,
    creditStatus: 'Due',
    creditDueDate: '2026-09-26',
    lastPaymentDate: '2026-08-12',
    creditLedger: [
      {
        id: 'pce-104-1',
        patientId: 'pat-104',
        date: '2026-08-26',
        type: 'Credit_Sale',
        invoiceId: 'INV-2026-1290',
        amount: 1820,
        balanceAfter: 1820,
        notes: 'Monthly pain management & anti-hypertensives',
        recordedBy: 'Anusya Begum'
      }
    ],
    refillReminders: []
  }
];

export const INITIAL_TRANSACTIONS: SaleTransaction[] = [];

export const INITIAL_SALES_RETURNS: SalesReturn[] = [];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-2026-081',
    supplierId: 'sup-1',
    supplierName: 'Apex MedPharma Distributors Pvt Ltd',
    orderDate: '2026-09-08',
    expectedDeliveryDate: '2026-09-14',
    status: 'In Transit',
    items: [
      {
        medicineId: 'med-03',
        medicineName: 'Dolo 650',
        genericName: 'Paracetamol / Acetaminophen',
        orderQuantity: 100,
        unitCostPrice: 19.50,
        taxRate: 12,
        total: 2184.00,
      },
      {
        medicineId: 'med-05',
        medicineName: 'Crocin Advance 500',
        genericName: 'Paracetamol / Acetaminophen',
        orderQuantity: 80,
        unitCostPrice: 14.00,
        taxRate: 12,
        total: 1254.40,
      },
      {
        medicineId: 'med-01',
        medicineName: 'Augmentin 625 Duo',
        genericName: 'Amoxicillin + Clavulanic Acid',
        orderQuantity: 50,
        unitCostPrice: 142.50,
        taxRate: 12,
        total: 7980.00,
      }
    ],
    subtotal: 10195.00,
    taxAmount: 1223.40,
    grandTotal: 11418.40,
    notes: 'Urgent restocking for seasonal viral demand. Dispatched via BlueDart express courier.',
  },
  {
    id: 'PO-2026-079',
    supplierId: 'sup-2',
    supplierName: 'MediGlobe Healthcare Logistics',
    orderDate: '2026-09-01',
    expectedDeliveryDate: '2026-09-05',
    status: 'Received',
    receivedDate: '2026-09-05',
    items: [
      {
        medicineId: 'med-10',
        medicineName: 'Pantocid 40',
        genericName: 'Pantoprazole',
        orderQuantity: 100,
        unitCostPrice: 92.00,
        taxRate: 12,
        total: 10304.00,
      }
    ],
    subtotal: 9200.00,
    taxAmount: 1104.00,
    grandTotal: 10304.00,
    notes: 'Delivered and checked in into inventory.',
  }
];

export const INITIAL_PURCHASE_RETURNS: PurchaseReturn[] = [
  {
    id: 'PR-2026-015',
    debitNoteNumber: 'DN-2026-089',
    supplierId: 'sup-1',
    supplierName: 'Apex MedPharma Distributors Pvt Ltd',
    date: '2026-09-07',
    items: [
      {
        medicineId: 'med-06',
        medicineName: 'Glycomet-GP 1',
        batchNumber: 'GLY-772C',
        quantity: 20,
        unitCostPrice: 78.00,
        totalDebit: 1560.00,
        reason: 'Near Expiry',
      }
    ],
    totalDebitAmount: 1560.00,
    status: 'Approved & Adjusted',
    accountsPayableAdjusted: true,
    notes: 'Debit Note issued against Invoice INV-APEX-881. Adjusted against outstanding payable ledger balance.',
  }
];

export const INITIAL_APPOINTMENTS = [
  {
    id: 'apt-01',
    patientId: 'pat-101',
    patientName: 'Kavita Sundaram',
    patientPhone: '+91 98450 12345',
    doctorId: 'doc-2',
    doctorName: 'Dr. Ananya Iyer, MD',
    date: '2026-09-15',
    timeSlot: '11:00 AM',
    reason: 'Quarterly HbA1c review & dosage adjustment',
    status: 'Scheduled' as const,
    notes: 'Check for fasting blood glucose logs and peripheral neuropathy screening.',
  },
  {
    id: 'apt-02',
    patientId: 'pat-102',
    patientName: 'Arjun Ramesh Menon',
    patientPhone: '+91 98200 98765',
    doctorId: 'doc-1',
    doctorName: 'Dr. Robert Chen, MD',
    date: '2026-09-16',
    timeSlot: '04:30 PM',
    reason: 'Lipid profile review and BP monitoring',
    status: 'Scheduled' as const,
    notes: 'Review ECG test conducted last week.',
  },
  {
    id: 'apt-03',
    patientId: 'pat-103',
    patientName: 'Meera Rajesh Nair',
    patientPhone: '+91 97110 33445',
    doctorId: 'doc-3',
    doctorName: 'Dr. Amitav Banerjee, MBBS, MD',
    date: '2026-09-12',
    timeSlot: '02:00 PM',
    reason: 'Seasonal asthma flare-up consultation',
    status: 'Completed' as const,
    notes: 'Prescribed Montair-LC and regular Asthalin PRN.',
  }
];

export const INITIAL_EXPENSES: OperatingExpense[] = [
  {
    id: 'exp-1',
    date: '2026-09-01',
    category: 'Rent',
    amount: 32000,
    description: 'Commercial Pharmacy premise rental - September 2026',
  },
  {
    id: 'exp-2',
    date: '2026-09-05',
    category: 'Salaries',
    amount: 68000,
    description: 'Pharmacist & auxiliary staff compensation',
  },
  {
    id: 'exp-3',
    date: '2026-09-08',
    category: 'Cold Storage Maintenance',
    amount: 3500,
    description: 'Quarterly chiller compressor servicing and calibration',
  },
  {
    id: 'exp-4',
    date: '2026-09-10',
    category: 'Utilities & Electricity',
    amount: 8200,
    description: 'Commercial 24/7 power backup and AC billing',
  }
];

export const CITY_MEDICAL_CLINIC_DETAILS = {
  clinicName: 'City Medical Clinic & Polyclinic',
  tagline: 'Outpatient Care, Specialist Consultations & Attached Pharmacy',
  address: 'Chokkalingapuram, Near Bus Stop, Melur Main Road',
  taluk: 'Melur Taluk',
  district: 'Madurai District',
  state: 'Tamil Nadu',
  pincode: '625103',
  phone: '8438678498',
  emergencyPhone: '9443128498',
  email: 'clinic.citymed.melur@gmail.com',
  opdTimingsMorning: '09:00 AM - 01:00 PM',
  opdTimingsEvening: '04:30 PM - 09:00 PM',
  consultingRooms: 3,
  servicesOffered: [
    'General Outpatient Consultation (OPD)',
    'Diabetes & Hypertension Specialty Clinic',
    'Pediatric & Geriatric Health Checkups',
    'Emergency First Aid & Wound Dressing',
    'Digital ECG & Vitals Monitoring',
    'Nebulization & Inhalation Therapy',
    'Attached Pharmacy Dispensing Counter'
  ],
  registeredPharmacist: 'Anusya Begum, D.Pharm',
  pharmacistLicense: 'TN-RPH-78419'
};

export const INITIAL_CONSULTATIONS = [
  {
    id: 'CON-2026-001',
    date: '2026-09-12T10:30:00.000Z',
    appointmentId: 'apt-01',
    patientId: 'pat-101',
    patientName: 'Kavita Sundaram',
    patientAge: 52,
    patientGender: 'Female',
    patientPhone: '+91 98450 12345',
    doctorId: 'doc-2',
    doctorName: 'Dr. Ananya Iyer, MD',
    doctorSpecialization: 'Endocrinology & Diabetology',
    doctorRegNo: 'KMC-2015-89102',
    chiefComplaints: 'Fatigue, mild polyuria, fasting glucose fluctuating between 160-180 mg/dL.',
    vitals: {
      bloodPressure: '130/84 mmHg',
      pulse: 76,
      spo2: 98,
      temperature: '98.4 °F',
      bloodSugar: '172 mg/dL (Post Prandial)',
      weight: 64
    },
    diagnosis: 'Type 2 Diabetes Mellitus - Moderate control, Mild Peripheral Neuropathy',
    clinicalNotes: 'Patient advised 30 mins brisk walking daily. Continue diabetic diet strictly with low glycemic index meals. Re-check HbA1c in 90 days.',
    prescriptions: [
      {
        medicineId: 'med-06',
        medicineName: 'Glycomet-GP 1 (Glimepiride 1mg + Metformin 500mg)',
        dosage: '1 tablet once daily before breakfast',
        durationDays: 30,
        quantity: 30,
        instructions: 'Take 15 minutes before breakfast with a glass of water.'
      },
      {
        medicineId: 'med-10',
        medicineName: 'Pantocid 40 (Pantoprazole 40mg)',
        dosage: '1 tablet once daily early morning empty stomach',
        durationDays: 15,
        quantity: 15,
        instructions: 'Take 30 mins prior to tea/breakfast for gastric protection.'
      }
    ],
    followUpDate: '2026-10-12',
    dispensedInPharmacy: true,
    posInvoiceId: 'INV-2026-1048'
  },
  {
    id: 'CON-2026-002',
    date: '2026-09-12T11:15:00.000Z',
    appointmentId: 'apt-02',
    patientId: 'pat-102',
    patientName: 'Arjun Ramesh Menon',
    patientAge: 64,
    patientGender: 'Male',
    patientPhone: '+91 98200 98765',
    doctorId: 'doc-1',
    doctorName: 'Dr. Robert Chen, MD',
    doctorSpecialization: 'Cardiology & Hypertension',
    doctorRegNo: 'MCI-2012-44910',
    chiefComplaints: 'Occasional chest tightness on exertion, mild shortness of breath on stairs.',
    vitals: {
      bloodPressure: '142/90 mmHg',
      pulse: 82,
      spo2: 97,
      temperature: '98.6 °F',
      bloodSugar: '124 mg/dL',
      weight: 78
    },
    diagnosis: 'Stage 1 Essential Hypertension, Dyslipidemia',
    clinicalNotes: 'ECG within normal limits. Regular BP monitoring recommended. Low sodium DASH diet advised.',
    prescriptions: [
      {
        medicineId: 'med-08',
        medicineName: 'Atorva 10 (Atorvastatin 10mg)',
        dosage: '1 tablet once daily at bedtime',
        durationDays: 30,
        quantity: 30,
        instructions: 'Take at night after dinner.'
      }
    ],
    followUpDate: '2026-09-26',
    dispensedInPharmacy: false
  }
];

// Helper function for relative sample invoice dates
const getPastDateIso = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const getFutureDateIso = (daysAhead: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

export const INITIAL_PURCHASE_INVOICES: PurchaseInvoice[] = [
  {
    id: 'pi-2026-001',
    invoiceNo: 'INV-APEX-9921',
    invoiceDate: getPastDateIso(35),
    paymentDueDate: getPastDateIso(5), // 5 days OVERDUE
    distributorId: 'sup-1',
    distributorName: 'Apex MedPharma Distributors Pvt Ltd',
    distributorGstin: '27AABCA1234F1Z5',
    distributorPhone: '+91 98201 44521',
    distributorImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=80',
    subtotal: 40000.00,
    totalScheme: 500.00,
    totalDiscount: 1500.00,
    taxableAmount: 38000.00,
    cgstAmount: 2280.00,
    sgstAmount: 2280.00,
    totalTax: 4560.00,
    roundOff: 0.00,
    grandTotal: 42560.00,
    paidAmount: 20000.00,
    balanceAmount: 22560.00, // Remaining Payment: ₹22,560 (OVERDUE)
    paymentStatus: 'Partially Paid',
    paymentMethod: 'Bank_Transfer',
    paymentReference: 'NEFT-AXIS-88319',
    payments: [
      {
        id: 'sp-001',
        date: getPastDateIso(20),
        amount: 20000.00,
        paymentMethod: 'Bank_Transfer',
        referenceNo: 'NEFT-AXIS-88319',
        notes: 'Initial advance paid via corporate netbanking',
        recordedBy: 'Accounts Pharmacist'
      }
    ],
    items: [
      {
        medicineId: 'med-01',
        medicineName: 'Augmentin 625 Duo Tablet',
        genericName: 'Amoxicillin + Clavulanic Acid',
        hsnCode: '300490',
        batchNumber: 'AUG-882A',
        expiryDate: '2027-11-30',
        pack: '10 Tablets',
        boxes: 20,
        unitsPerBox: 10,
        billedQuantity: 200,
        freeQuantity: 20,
        totalQuantity: 220,
        mrp: 220.00,
        purchaseRate: 155.00,
        schemePercentage: 0,
        schemeAmount: 0,
        discountPercentage: 5,
        discountAmount: 1550.00,
        taxableAmount: 29450.00,
        gstRate: 12,
        gstAmount: 3534.00,
        netAmount: 32984.00
      },
      {
        medicineId: 'med-02',
        medicineName: 'Pan 40 Tablet',
        genericName: 'Pantoprazole Gastro-resistant',
        hsnCode: '300490',
        batchNumber: 'PAN-771B',
        expiryDate: '2028-02-28',
        pack: '15 Tablets',
        boxes: 10,
        unitsPerBox: 10,
        billedQuantity: 100,
        freeQuantity: 10,
        totalQuantity: 110,
        mrp: 155.00,
        purchaseRate: 95.00,
        schemePercentage: 0,
        schemeAmount: 0,
        discountPercentage: 0,
        discountAmount: 0,
        taxableAmount: 9500.00,
        gstRate: 12,
        gstAmount: 1140.00,
        netAmount: 10640.00
      }
    ],
    createdAt: getPastDateIso(35),
    notes: 'Direct bulk consignment under monthly distributor contract.'
  },
  {
    id: 'pi-2026-002',
    invoiceNo: 'INV-MGH-4412',
    invoiceDate: getPastDateIso(28),
    paymentDueDate: getPastDateIso(13), // 13 days OVERDUE
    distributorId: 'sup-2',
    distributorName: 'MediGlobe Healthcare Logistics',
    distributorGstin: '29AAACM5678P1ZW',
    distributorPhone: '+91 97654 22109',
    distributorImage: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=200&auto=format&fit=crop&q=80',
    subtotal: 16500.00,
    totalScheme: 0.00,
    totalDiscount: 825.00,
    taxableAmount: 15675.00,
    cgstAmount: 940.50,
    sgstAmount: 940.50,
    totalTax: 1881.00,
    roundOff: 0.00,
    grandTotal: 17556.00,
    paidAmount: 0.00,
    balanceAmount: 17556.00, // Remaining Payment: ₹17,556 (OVERDUE)
    paymentStatus: 'Unpaid',
    payments: [],
    items: [
      {
        medicineId: 'med-05',
        medicineName: 'Azithral 500 Tablet',
        genericName: 'Azithromycin 500mg',
        hsnCode: '300490',
        batchNumber: 'AZI-992K',
        expiryDate: '2027-08-31',
        pack: '5 Tablets',
        boxes: 25,
        unitsPerBox: 5,
        billedQuantity: 125,
        freeQuantity: 0,
        totalQuantity: 125,
        mrp: 132.00,
        purchaseRate: 98.00,
        schemePercentage: 0,
        schemeAmount: 0,
        discountPercentage: 5,
        discountAmount: 612.50,
        taxableAmount: 11637.50,
        gstRate: 12,
        gstAmount: 1396.50,
        netAmount: 13034.00
      }
    ],
    createdAt: getPastDateIso(28),
    notes: 'Urgent antibiotics replenishment stock.'
  },
  {
    id: 'pi-2026-003',
    invoiceNo: 'INV-ZBL-8804',
    invoiceDate: getPastDateIso(10),
    paymentDueDate: getFutureDateIso(20), // Due in 20 days (PAYMENDING - DUE SOON)
    distributorId: 'sup-3',
    distributorName: 'Zenith BioLife Wholesale Hub',
    distributorGstin: '07AAACZ9901M1ZQ',
    distributorPhone: '+91 98110 88234',
    distributorImage: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=200&auto=format&fit=crop&q=80',
    subtotal: 28000.00,
    totalScheme: 0.00,
    totalDiscount: 1400.00,
    taxableAmount: 26600.00,
    cgstAmount: 1596.00,
    sgstAmount: 1596.00,
    totalTax: 3192.00,
    roundOff: 0.00,
    grandTotal: 29792.00,
    paidAmount: 10000.00,
    balanceAmount: 19792.00, // Remaining Payment: ₹19,792 (Due in 20 days)
    paymentStatus: 'Partially Paid',
    paymentMethod: 'UPI',
    paymentReference: 'UPI-HDFC-99120',
    payments: [
      {
        id: 'sp-002',
        date: getPastDateIso(8),
        amount: 10000.00,
        paymentMethod: 'UPI',
        referenceNo: 'UPI-HDFC-99120',
        notes: 'Token UPI payment to vendor',
        recordedBy: 'Accounts Pharmacist'
      }
    ],
    items: [
      {
        medicineId: 'med-06',
        medicineName: 'Glycomet-GP 2 Tablet',
        genericName: 'Glimepiride 2mg + Metformin 500mg',
        hsnCode: '300490',
        batchNumber: 'GLY-443D',
        expiryDate: '2028-06-30',
        pack: '15 Tablets',
        boxes: 30,
        unitsPerBox: 10,
        billedQuantity: 300,
        freeQuantity: 30,
        totalQuantity: 330,
        mrp: 140.00,
        purchaseRate: 88.00,
        schemePercentage: 0,
        schemeAmount: 0,
        discountPercentage: 5,
        discountAmount: 1320.00,
        taxableAmount: 25080.00,
        gstRate: 12,
        gstAmount: 3009.60,
        netAmount: 28089.60
      }
    ],
    createdAt: getPastDateIso(10),
    notes: 'Diabetic maintenance medicine supply with Net 30 payment terms.'
  },
  {
    id: 'pi-2026-004',
    invoiceNo: 'INV-APEX-9850',
    invoiceDate: getPastDateIso(45),
    paymentDueDate: getPastDateIso(15),
    distributorId: 'sup-1',
    distributorName: 'Apex MedPharma Distributors Pvt Ltd',
    distributorGstin: '27AABCA1234F1Z5',
    distributorPhone: '+91 98201 44521',
    distributorImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=80',
    subtotal: 24000.00,
    totalScheme: 0.00,
    totalDiscount: 1200.00,
    taxableAmount: 22800.00,
    cgstAmount: 1368.00,
    sgstAmount: 1368.00,
    totalTax: 2736.00,
    roundOff: 0.00,
    grandTotal: 25536.00,
    paidAmount: 25536.00,
    balanceAmount: 0.00, // Fully Paid!
    paymentStatus: 'Paid',
    paymentMethod: 'Bank_Transfer',
    paymentReference: 'RTGS-SBI-109283',
    payments: [
      {
        id: 'sp-003',
        date: getPastDateIso(18),
        amount: 25536.00,
        paymentMethod: 'Bank_Transfer',
        referenceNo: 'RTGS-SBI-109283',
        notes: 'Full invoice settlement',
        recordedBy: 'Chief Pharmacist'
      }
    ],
    items: [
      {
        medicineId: 'med-07',
        medicineName: 'Telma 40 Tablet',
        genericName: 'Telmisartan 40mg',
        hsnCode: '300490',
        batchNumber: 'TEL-881J',
        expiryDate: '2028-04-30',
        pack: '15 Tablets',
        boxes: 20,
        unitsPerBox: 10,
        billedQuantity: 200,
        freeQuantity: 20,
        totalQuantity: 220,
        mrp: 145.00,
        purchaseRate: 98.00,
        schemePercentage: 0,
        schemeAmount: 0,
        discountPercentage: 5,
        discountAmount: 980.00,
        taxableAmount: 18620.00,
        gstRate: 12,
        gstAmount: 2234.40,
        netAmount: 20854.40
      }
    ],
    createdAt: getPastDateIso(45),
    notes: 'Fully settled supplier bill.'
  },
  {
    id: 'pi-2026-005',
    invoiceNo: 'INV-MGH-4498',
    invoiceDate: getPastDateIso(12),
    paymentDueDate: getFutureDateIso(3), // Due in 3 days (PAYMENDING)
    distributorId: 'sup-2',
    distributorName: 'MediGlobe Healthcare Logistics',
    distributorGstin: '29AAACM5678P1ZW',
    distributorPhone: '+91 97654 22109',
    distributorImage: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=200&auto=format&fit=crop&q=80',
    subtotal: 18000.00,
    totalScheme: 0.00,
    totalDiscount: 900.00,
    taxableAmount: 17100.00,
    cgstAmount: 1026.00,
    sgstAmount: 1026.00,
    totalTax: 2052.00,
    roundOff: 0.00,
    grandTotal: 19152.00,
    paidAmount: 5000.00,
    balanceAmount: 14152.00, // Remaining Payment: ₹14,152 (Due in 3 days)
    paymentStatus: 'Partially Paid',
    paymentMethod: 'Cash',
    payments: [
      {
        id: 'sp-004',
        date: getPastDateIso(6),
        amount: 5000.00,
        paymentMethod: 'Cash',
        referenceNo: 'CASH-REC-109',
        notes: 'Part payment in cash to delivery agent',
        recordedBy: 'Store In-Charge'
      }
    ],
    items: [
      {
        medicineId: 'med-08',
        medicineName: 'Atorva 10 (Atorvastatin 10mg)',
        genericName: 'Atorvastatin 10mg',
        hsnCode: '300490',
        batchNumber: 'ATO-990P',
        expiryDate: '2028-09-30',
        pack: '15 Tablets',
        boxes: 20,
        unitsPerBox: 10,
        billedQuantity: 200,
        freeQuantity: 10,
        totalQuantity: 210,
        mrp: 125.00,
        purchaseRate: 75.00,
        schemePercentage: 0,
        schemeAmount: 0,
        discountPercentage: 5,
        discountAmount: 750.00,
        taxableAmount: 14250.00,
        gstRate: 12,
        gstAmount: 1710.00,
        netAmount: 15960.00
      }
    ],
    createdAt: getPastDateIso(12),
    notes: 'Cardiology statin stock replenishment.'
  }
];



