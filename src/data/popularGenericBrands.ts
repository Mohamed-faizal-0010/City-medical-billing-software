import { Medicine } from '../types';

export const POPULAR_GENERIC_BRAND_MEDICINES: Medicine[] = [
  // =========================================================================
  // 1. PROTON PUMP INHIBITORS (PPI) & GASTROINTESTINAL - ACID REFLUX / GERD
  // =========================================================================
  {
    id: 'gen-pant-01',
    name: 'Pentose 40',
    genericName: 'Pantoprazole Gastro-resistant',
    strength: '40 mg',
    form: 'Tablet',
    manufacturer: 'Hetero Healthcare / Generic Division',
    category: 'Gastrointestinal / PPI',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 35,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack G-03',
    description: 'Generic brand Pantoprazole 40mg enteric-coated tablet for acidity, heartburn, and peptic ulcers.',
    sideEffects: 'Mild headache, diarrhea, nausea, stomach discomfort.',
    dosageGuidelines: '1 tablet once daily morning before food (empty stomach).',
    batches: [
      {
        batchNumber: 'PNT-25A12',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-05-01',
        stock: 140,
        costPrice: 28.00,
        sellingPrice: 58.00,
        mrp: 98.00,
        location: 'Rack G-03'
      }
    ]
  },
  {
    id: 'gen-pant-02',
    name: 'Pentose-DSR Capsule',
    genericName: 'Pantoprazole + Domperidone SR',
    strength: '40mg + 30mg SR',
    form: 'Capsule',
    manufacturer: 'Hetero Healthcare / Generic Division',
    category: 'Gastrointestinal / Anti-reflux',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '10 Capsules',
    packSize: 10,
    looseUnitName: 'Capsule',
    rackLocation: 'Rack G-03',
    description: 'Sustained-release generic combination of Pantoprazole with Domperidone for severe reflux, GERD, and nausea.',
    sideEffects: 'Dry mouth, dizziness, transient mild abdominal cramps.',
    dosageGuidelines: '1 capsule once daily in the morning 30 minutes before breakfast.',
    batches: [
      {
        batchNumber: 'PND-25C08',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-04-01',
        stock: 125,
        costPrice: 42.00,
        sellingPrice: 85.00,
        mrp: 135.00,
        location: 'Rack G-03'
      }
    ]
  },
  {
    id: 'gen-rab-01',
    name: 'Rabalkem-DSR Capsule',
    genericName: 'Rabeprazole Sodium + Domperidone SR',
    strength: '20mg + 30mg SR',
    form: 'Capsule',
    manufacturer: 'Alkem Laboratories (Alkem Generics)',
    category: 'Gastrointestinal / Anti-reflux',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 35,
    pack: '10 Capsules',
    packSize: 10,
    looseUnitName: 'Capsule',
    rackLocation: 'Rack G-04',
    description: 'High-efficacy Rabeprazole 20mg enteric coated and Domperidone 30mg sustained release capsule for hyperacidity and dyspepsia.',
    sideEffects: 'Dry mouth, headache, flatulence, drowsiness.',
    dosageGuidelines: '1 capsule once daily early morning on an empty stomach.',
    batches: [
      {
        batchNumber: 'RBD-25E14',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-05-01',
        stock: 150,
        costPrice: 65.00,
        sellingPrice: 125.00,
        mrp: 172.00,
        location: 'Rack G-04'
      }
    ]
  },
  {
    id: 'gen-rab-02',
    name: 'Rabalkem 20 Tablet',
    genericName: 'Rabeprazole Sodium',
    strength: '20 mg',
    form: 'Tablet',
    manufacturer: 'Alkem Laboratories (Alkem Generics)',
    category: 'Gastrointestinal / PPI',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack G-04',
    description: 'Rapid-onset gastric acid suppressant for acute gastritis, GERD, and healing duodenal ulcers.',
    sideEffects: 'Headache, diarrhea, dizziness.',
    dosageGuidelines: '1 tablet daily before breakfast.',
    batches: [
      {
        batchNumber: 'RBK-25D02',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-03-01',
        stock: 90,
        costPrice: 35.00,
        sellingPrice: 68.00,
        mrp: 92.00,
        location: 'Rack G-04'
      }
    ]
  },
  {
    id: 'gen-pant-03',
    name: 'Pantop 40 Tablet',
    genericName: 'Pantoprazole Gastro-resistant',
    strength: '40 mg',
    form: 'Tablet',
    manufacturer: 'Aristo Pharmaceuticals',
    category: 'Gastrointestinal / PPI',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 40,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack G-05',
    description: 'Leading branded generic Pantoprazole for acid-related disorders and ulcer treatment.',
    sideEffects: 'Headache, loose stools, nausea.',
    dosageGuidelines: '1 tablet once daily morning before meals.',
    batches: [
      {
        batchNumber: 'PTP-25G10',
        expiryDate: '2027-12-31',
        manufacturingDate: '2025-06-01',
        stock: 130,
        costPrice: 72.00,
        sellingPrice: 132.00,
        mrp: 152.00,
        location: 'Rack G-05'
      }
    ]
  },
  {
    id: 'gen-pant-04',
    name: 'Pantop-DSR Capsule',
    genericName: 'Pantoprazole + Domperidone SR',
    strength: '40mg + 30mg SR',
    form: 'Capsule',
    manufacturer: 'Aristo Pharmaceuticals',
    category: 'Gastrointestinal / Anti-reflux',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 35,
    pack: '10 Capsules',
    packSize: 10,
    looseUnitName: 'Capsule',
    rackLocation: 'Rack G-05',
    description: 'Proton pump inhibitor and dopamine antagonist prokinetic combination for gastroesophageal reflux.',
    sideEffects: 'Dry mouth, mild fatigue, abdominal cramps.',
    dosageGuidelines: '1 capsule once daily 30 minutes before breakfast.',
    batches: [
      {
        batchNumber: 'PTD-25F05',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-05-01',
        stock: 115,
        costPrice: 85.00,
        sellingPrice: 145.00,
        mrp: 168.00,
        location: 'Rack G-05'
      }
    ]
  },
  {
    id: 'gen-razo-01',
    name: 'Razo 20 Tablet',
    genericName: 'Rabeprazole Sodium',
    strength: '20 mg',
    form: 'Tablet',
    manufacturer: "Dr. Reddy's Laboratories",
    category: 'Gastrointestinal / PPI',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack G-06',
    description: 'Fast acting proton pump inhibitor that blocks final step of gastric acid secretion.',
    sideEffects: 'Headache, loose stools, dizziness.',
    dosageGuidelines: '1 tablet once daily morning before meals.',
    batches: [
      {
        batchNumber: 'RZO-25C19',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-03-01',
        stock: 105,
        costPrice: 88.00,
        sellingPrice: 145.00,
        mrp: 162.00,
        location: 'Rack G-06'
      }
    ]
  },
  {
    id: 'gen-razo-02',
    name: 'Razo-D Capsule',
    genericName: 'Rabeprazole Sodium + Domperidone SR',
    strength: '20mg + 30mg SR',
    form: 'Capsule',
    manufacturer: "Dr. Reddy's Laboratories",
    category: 'Gastrointestinal / Anti-reflux',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '10 Capsules',
    packSize: 10,
    looseUnitName: 'Capsule',
    rackLocation: 'Rack G-06',
    description: 'Potent combination for acid reflux, sour eructation, and indigestion with motility support.',
    sideEffects: 'Dry mouth, headache, abdominal cramps.',
    dosageGuidelines: '1 capsule morning empty stomach with water.',
    batches: [
      {
        batchNumber: 'RZD-25B03',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-02-01',
        stock: 95,
        costPrice: 98.00,
        sellingPrice: 168.00,
        mrp: 189.00,
        location: 'Rack G-06'
      }
    ]
  },
  {
    id: 'gen-omez-01',
    name: 'Omez 20 Capsule',
    genericName: 'Omeprazole',
    strength: '20 mg',
    form: 'Capsule',
    manufacturer: "Dr. Reddy's Laboratories",
    category: 'Gastrointestinal / PPI',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 35,
    pack: '20 Capsules',
    packSize: 20,
    looseUnitName: 'Capsule',
    rackLocation: 'Rack G-07',
    description: 'Time-tested enteric coated Omeprazole pellet capsules for gastric hyperacidity and ulcers.',
    sideEffects: 'Mild headache, abdominal discomfort, flatulence.',
    dosageGuidelines: '1 capsule once daily before breakfast.',
    batches: [
      {
        batchNumber: 'OMZ-25D11',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-04-01',
        stock: 140,
        costPrice: 58.00,
        sellingPrice: 95.00,
        mrp: 110.00,
        location: 'Rack G-07'
      }
    ]
  },
  {
    id: 'gen-omez-02',
    name: 'Omez-D Capsule',
    genericName: 'Omeprazole + Domperidone',
    strength: '20mg + 10mg',
    form: 'Capsule',
    manufacturer: "Dr. Reddy's Laboratories",
    category: 'Gastrointestinal / Anti-reflux',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '15 Capsules',
    packSize: 15,
    looseUnitName: 'Capsule',
    rackLocation: 'Rack G-07',
    description: 'Antacid and antiemetic combination for acid reflux associated with nausea and bloating.',
    sideEffects: 'Dryness in mouth, drowsiness, headache.',
    dosageGuidelines: '1 capsule twice daily before meals.',
    batches: [
      {
        batchNumber: 'OMD-25C05',
        expiryDate: '2027-07-31',
        manufacturingDate: '2025-03-01',
        stock: 85,
        costPrice: 72.00,
        sellingPrice: 118.00,
        mrp: 135.00,
        location: 'Rack G-07'
      }
    ]
  },
  {
    id: 'gen-aciloc-01',
    name: 'Aciloc 150 Tablet',
    genericName: 'Ranitidine HCl',
    strength: '150 mg',
    form: 'Tablet',
    manufacturer: 'Cadila Pharmaceuticals',
    category: 'Gastrointestinal / H2 Blocker',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 40,
    pack: '30 Tablets',
    packSize: 30,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack G-08',
    description: 'H2-receptor antagonist reducing basal and nocturnal gastric acid secretion.',
    sideEffects: 'Mild drowsiness, constipation or diarrhea.',
    dosageGuidelines: '1 tablet twice daily morning and evening.',
    batches: [
      {
        batchNumber: 'ACL-25A20',
        expiryDate: '2027-06-30',
        manufacturingDate: '2025-01-01',
        stock: 160,
        costPrice: 22.00,
        sellingPrice: 38.00,
        mrp: 45.00,
        location: 'Rack G-08'
      }
    ]
  },
  {
    id: 'gen-gelusil-01',
    name: 'Gelusil MPS Liquid (Mint)',
    genericName: 'Aluminium Hydroxide + Magnesium Hydroxide + Simethicone',
    strength: '250mg + 250mg + 50mg / 5ml',
    form: 'Suspension',
    manufacturer: 'Pfizer Ltd',
    category: 'Gastrointestinal / Antacid',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    pack: '200 ml Bottle',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack G-09',
    description: 'Quick relief liquid antacid and antiflatulent syrup with soothing mint flavor.',
    sideEffects: 'Chalky taste, mild laxative or constipating effect if taken in large doses.',
    dosageGuidelines: '1-2 teaspoons (5-10 ml) after meals and at bedtime.',
    batches: [
      {
        batchNumber: 'GEL-25H01',
        expiryDate: '2027-12-31',
        manufacturingDate: '2025-07-01',
        stock: 55,
        costPrice: 85.00,
        sellingPrice: 122.00,
        mrp: 135.00,
        location: 'Rack G-09'
      }
    ]
  },

  // =========================================================================
  // 2. PAIN, FEVER & ANTI-INFLAMMATORY (NSAID / ANALGESIC)
  // =========================================================================
  {
    id: 'gen-zero-01',
    name: 'Zerodol-P Tablet',
    genericName: 'Aceclofenac + Paracetamol',
    strength: '100mg + 325mg',
    form: 'Tablet',
    manufacturer: 'Ipca Laboratories',
    category: 'Analgesic & Antipyretic',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 50,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack P-01',
    description: 'Leading anti-inflammatory analgesic combo for joint pain, body ache, fever, and post-dental pain.',
    sideEffects: 'Gastric irritation, nausea, dizziness.',
    dosageGuidelines: '1 tablet twice daily after meals.',
    batches: [
      {
        batchNumber: 'ZRP-25C15',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-04-01',
        stock: 220,
        costPrice: 42.00,
        sellingPrice: 65.00,
        mrp: 75.00,
        location: 'Rack P-01'
      }
    ]
  },
  {
    id: 'gen-zero-02',
    name: 'Zerodol-SP Tablet',
    genericName: 'Aceclofenac + Paracetamol + Serratiopeptidase',
    strength: '100mg + 325mg + 15mg',
    form: 'Tablet',
    manufacturer: 'Ipca Laboratories',
    category: 'Analgesic / Anti-inflammatory',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 40,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack P-01',
    description: 'Triple combination analgesic with proteolytic enzyme Serratiopeptidase for rapid swelling and edema resolution.',
    sideEffects: 'Nausea, heartburn, loose stools.',
    dosageGuidelines: '1 tablet twice daily strictly after meals.',
    batches: [
      {
        batchNumber: 'ZSP-25D08',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-05-01',
        stock: 180,
        costPrice: 68.00,
        sellingPrice: 105.00,
        mrp: 120.00,
        location: 'Rack P-01'
      }
    ]
  },
  {
    id: 'gen-dolo-plus',
    name: 'Dolokind-Plus Tablet',
    genericName: 'Aceclofenac + Paracetamol',
    strength: '100mg + 325mg',
    form: 'Tablet',
    manufacturer: 'Mankind Pharma',
    category: 'Analgesic & Antipyretic',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 35,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack P-02',
    description: 'Cost-effective generic brand Aceclofenac + Paracetamol formulation for acute orthopedic and muscular pain.',
    sideEffects: 'Dyspepsia, epigastric pain, nausea.',
    dosageGuidelines: '1 tablet twice daily after meals.',
    batches: [
      {
        batchNumber: 'DKP-25B12',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-03-01',
        stock: 140,
        costPrice: 32.00,
        sellingPrice: 52.00,
        mrp: 62.00,
        location: 'Rack P-02'
      }
    ]
  },
  {
    id: 'gen-combiflam',
    name: 'Combiflam Tablet',
    genericName: 'Ibuprofen + Paracetamol',
    strength: '400mg + 325mg',
    form: 'Tablet',
    manufacturer: 'Sanofi India Ltd',
    category: 'Analgesic & Antipyretic',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 40,
    pack: '20 Tablets',
    packSize: 20,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack P-03',
    description: 'Gold-standard dual analgesic and antipyretic for dental ache, headache, fever, and musculoskeletal pain.',
    sideEffects: 'Heartburn, nausea, abdominal discomfort.',
    dosageGuidelines: '1 tablet 2 to 3 times daily after food.',
    batches: [
      {
        batchNumber: 'CMB-25F01',
        expiryDate: '2027-12-31',
        manufacturingDate: '2025-06-01',
        stock: 190,
        costPrice: 32.00,
        sellingPrice: 48.00,
        mrp: 54.00,
        location: 'Rack P-03'
      }
    ]
  },
  {
    id: 'gen-meftal-500',
    name: 'Meftal 500 Tablet',
    genericName: 'Mefenamic Acid',
    strength: '500 mg',
    form: 'Tablet',
    manufacturer: 'Blue Cross Laboratories',
    category: 'Analgesic / Anti-inflammatory',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack P-04',
    description: 'NSAID indicated for relief of primary dysmenorrhea, dental pain, and postoperative pain.',
    sideEffects: 'GI discomfort, nausea, dizziness.',
    dosageGuidelines: '1 tablet up to 3 times daily after food.',
    batches: [
      {
        batchNumber: 'MFT-25C11',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-03-01',
        stock: 95,
        costPrice: 28.00,
        sellingPrice: 45.00,
        mrp: 52.00,
        location: 'Rack P-04'
      }
    ]
  },

  // =========================================================================
  // 3. ANTIBIOTICS & ANTIMICROBIALS
  // =========================================================================
  {
    id: 'gen-mono-01',
    name: 'Monocef-O 200 Tablet',
    genericName: 'Cefpodoxime Proxetil',
    strength: '200 mg',
    form: 'Tablet',
    manufacturer: 'Aristo Pharmaceuticals',
    category: 'Antibiotic / Cephalosporin',
    prescriptionRequired: true,
    hsnCode: '300410',
    taxRate: 12,
    minStockAlert: 35,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack B-17',
    description: 'Broad-spectrum oral 3rd generation cephalosporin for upper/lower respiratory tract infections, sinusitis, and skin infections.',
    sideEffects: 'Mild diarrhea, nausea, abdominal cramps.',
    dosageGuidelines: '1 tablet twice daily with food.',
    batches: [
      {
        batchNumber: 'MCO-25E03',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-05-01',
        stock: 110,
        costPrice: 115.00,
        sellingPrice: 168.00,
        mrp: 188.00,
        location: 'Rack B-17'
      }
    ]
  },
  {
    id: 'gen-mahacef-01',
    name: 'Mahacef 200 Tablet',
    genericName: 'Cefixime',
    strength: '200 mg',
    form: 'Tablet',
    manufacturer: 'Macleods Pharmaceuticals',
    category: 'Antibiotic / Cephalosporin',
    prescriptionRequired: true,
    hsnCode: '300410',
    taxRate: 12,
    minStockAlert: 30,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack B-18',
    description: 'Oral third-generation cephalosporin for typhoid fever, uncomplicated UTI, and bronchitis.',
    sideEffects: 'Loose stools, nausea, dyspepsia.',
    dosageGuidelines: '1 tablet twice daily for 5-7 days.',
    batches: [
      {
        batchNumber: 'MHC-25B09',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-02-01',
        stock: 85,
        costPrice: 68.00,
        sellingPrice: 102.00,
        mrp: 115.00,
        location: 'Rack B-18'
      }
    ]
  },
  {
    id: 'gen-azithral-01',
    name: 'Azithral 500 Tablet',
    genericName: 'Azithromycin',
    strength: '500 mg',
    form: 'Tablet',
    manufacturer: 'Alembic Pharmaceuticals',
    category: 'Antibiotic / Macrolide',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '5 Tablets',
    packSize: 5,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack B-19',
    description: 'Broad-spectrum macrolide antibiotic with convenient 3-day or 5-day therapy for tonsillitis and pneumonia.',
    sideEffects: 'Nausea, abdominal pain, diarrhea.',
    dosageGuidelines: '1 tablet once daily 1 hour before or 2 hours after meals.',
    batches: [
      {
        batchNumber: 'AZT-25D11',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-04-01',
        stock: 90,
        costPrice: 78.00,
        sellingPrice: 115.00,
        mrp: 128.00,
        location: 'Rack B-19'
      }
    ]
  },
  {
    id: 'gen-cifran-01',
    name: 'Cifran 500 Tablet',
    genericName: 'Ciprofloxacin',
    strength: '500 mg',
    form: 'Tablet',
    manufacturer: 'Sun Pharmaceutical Industries',
    category: 'Antibiotic / Fluoroquinolone',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack B-20',
    description: 'Fluoroquinolone antibiotic for urinary tract infections, infectious diarrhea, and bone/joint infections.',
    sideEffects: 'Nausea, headache, dizziness, rare tendon discomfort.',
    dosageGuidelines: '1 tablet twice daily with plenty of water.',
    batches: [
      {
        batchNumber: 'CFR-25A05',
        expiryDate: '2027-07-31',
        manufacturingDate: '2025-01-01',
        stock: 80,
        costPrice: 35.00,
        sellingPrice: 52.00,
        mrp: 60.00,
        location: 'Rack B-20'
      }
    ]
  },
  {
    id: 'gen-zenflox-oz',
    name: 'Zenflox-OZ Tablet',
    genericName: 'Ofloxacin + Ornidazole',
    strength: '200mg + 500mg',
    form: 'Tablet',
    manufacturer: 'Mankind Pharma',
    category: 'Antibacterial & Antiamoebic',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack B-21',
    description: 'Combined broad spectrum fluoroquinolone and nitroimidazole for acute mixed gastroenteritis and amoebic dysentery.',
    sideEffects: 'Metallic taste, nausea, dry mouth, headache.',
    dosageGuidelines: '1 tablet twice daily after meals for 3-5 days.',
    batches: [
      {
        batchNumber: 'ZOZ-25D14',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-04-01',
        stock: 120,
        costPrice: 62.00,
        sellingPrice: 98.00,
        mrp: 112.00,
        location: 'Rack B-21'
      }
    ]
  },

  // =========================================================================
  // 4. RESPIRATORY & COUGH / ALLERGY FORMULATIONS
  // =========================================================================
  {
    id: 'gen-allegra-120',
    name: 'Allegra 120 Tablet',
    genericName: 'Fexofenadine HCl',
    strength: '120 mg',
    form: 'Tablet',
    manufacturer: 'Sanofi India Ltd',
    category: 'Antihistamine / Antiallergic',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack R-05',
    description: 'Second-generation non-sedating antihistamine for seasonal allergic rhinitis and chronic idiopathic urticaria.',
    sideEffects: 'Mild headache, dry throat, dizziness.',
    dosageGuidelines: '1 tablet once daily with water.',
    batches: [
      {
        batchNumber: 'ALG-25C07',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-03-01',
        stock: 95,
        costPrice: 120.00,
        sellingPrice: 185.00,
        mrp: 205.00,
        location: 'Rack R-05'
      }
    ]
  },
  {
    id: 'gen-ascoril-ls',
    name: 'Ascoril-LS Syrup',
    genericName: 'Levosalbutamol + Ambroxol + Guaiphenesin',
    strength: '1mg + 30mg + 50mg / 5ml',
    form: 'Syrup',
    manufacturer: 'Glenmark Pharmaceuticals',
    category: 'Respiratory / Mucolytic Expectorant',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '100 ml Bottle',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack R-06',
    description: 'Triple action expectorant, mucolytic, and bronchodilator for productive cough with bronchospasm.',
    sideEffects: 'Mild tremors, palpitations, nausea.',
    dosageGuidelines: '5-10 ml three times daily after meals.',
    batches: [
      {
        batchNumber: 'ASL-25F18',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-06-01',
        stock: 65,
        costPrice: 75.00,
        sellingPrice: 110.00,
        mrp: 122.00,
        location: 'Rack R-06'
      }
    ]
  },
  {
    id: 'gen-grilinctus',
    name: 'Grilinctus Syrup',
    genericName: 'Dextromethorphan + Chlorpheniramine + Guaiphenesin + Ammonium Chloride',
    strength: 'Combined Expectorant Formula',
    form: 'Syrup',
    manufacturer: 'Franco-Indian Pharmaceuticals',
    category: 'Respiratory / Cough Formula',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '100 ml Bottle',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack R-07',
    description: 'Trusted cough syrup for relief of dry and chesty cough due to colds or pharyngitis.',
    sideEffects: 'Mild sedation, dry mouth.',
    dosageGuidelines: '5 ml to 10 ml 3-4 times a day.',
    batches: [
      {
        batchNumber: 'GRL-25E02',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-05-01',
        stock: 80,
        costPrice: 65.00,
        sellingPrice: 98.00,
        mrp: 110.00,
        location: 'Rack R-07'
      }
    ]
  },

  // =========================================================================
  // 5. CARDIOVASCULAR & HYPERTENSION
  // =========================================================================
  {
    id: 'gen-telma-40',
    name: 'Telma 40 Tablet',
    genericName: 'Telmisartan',
    strength: '40 mg',
    form: 'Tablet',
    manufacturer: 'Glenmark Pharmaceuticals',
    category: 'Cardiovascular / ARB',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 40,
    pack: '30 Tablets',
    packSize: 30,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack C-01',
    description: 'Angiotensin II receptor antagonist for essential hypertension and cardiovascular risk reduction.',
    sideEffects: 'Dizziness, back pain, sinus pain.',
    dosageGuidelines: '1 tablet once daily morning with or without food.',
    batches: [
      {
        batchNumber: 'TLM-25D04',
        expiryDate: '2027-12-31',
        manufacturingDate: '2025-04-01',
        stock: 150,
        costPrice: 145.00,
        sellingPrice: 225.00,
        mrp: 255.00,
        location: 'Rack C-01'
      }
    ]
  },
  {
    id: 'gen-cilacar-10',
    name: 'Cilacar 10 Tablet',
    genericName: 'Cilnidipine',
    strength: '10 mg',
    form: 'Tablet',
    manufacturer: 'J.B. Chemicals & Pharmaceuticals',
    category: 'Cardiovascular / CCB',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack C-02',
    description: 'Dual L- and N-type calcium channel blocker for mild to moderate hypertension with kidney protective benefit.',
    sideEffects: 'Flushing, headache, peripheral edema (less frequent).',
    dosageGuidelines: '1 tablet once daily in morning.',
    batches: [
      {
        batchNumber: 'CLC-25C09',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-03-01',
        stock: 110,
        costPrice: 82.00,
        sellingPrice: 135.00,
        mrp: 150.00,
        location: 'Rack C-02'
      }
    ]
  },
  {
    id: 'gen-ecosprin-75',
    name: 'Ecosprin 75 Tablet',
    genericName: 'Aspirin Gastro-resistant',
    strength: '75 mg',
    form: 'Tablet',
    manufacturer: 'USV Pvt Ltd',
    category: 'Cardiovascular / Antiplatelet',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 50,
    pack: '14 Tablets',
    packSize: 14,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack C-03',
    description: 'Low-dose enteric coated aspirin for secondary prevention of myocardial infarction and ischemic stroke.',
    sideEffects: 'Mild dyspepsia, increased bleeding tendency.',
    dosageGuidelines: '1 tablet daily after food.',
    batches: [
      {
        batchNumber: 'ECO-25A17',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-01-01',
        stock: 210,
        costPrice: 5.50,
        sellingPrice: 9.80,
        mrp: 11.20,
        location: 'Rack C-03'
      }
    ]
  },

  // =========================================================================
  // 6. ANTIDIABETIC FORMULATIONS
  // =========================================================================
  {
    id: 'gen-glycomet-500',
    name: 'Glycomet 500 SR Tablet',
    genericName: 'Metformin HCl Sustained Release',
    strength: '500 mg',
    form: 'Tablet',
    manufacturer: 'USV Pvt Ltd',
    category: 'Antidiabetic / Biguanide',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 50,
    pack: '20 Tablets',
    packSize: 20,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack D-01',
    description: 'First-line biguanide for type 2 diabetes mellitus improving insulin sensitivity and reducing hepatic glucose output.',
    sideEffects: 'Mild gastrointestinal discomfort, diarrhea, metallic taste.',
    dosageGuidelines: '1 tablet once or twice daily with or after meals.',
    batches: [
      {
        batchNumber: 'GLY-25D22',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-04-01',
        stock: 240,
        costPrice: 32.00,
        sellingPrice: 48.00,
        mrp: 54.00,
        location: 'Rack D-01'
      }
    ]
  },
  {
    id: 'gen-glycomet-gp2',
    name: 'Glycomet-GP 2 Tablet',
    genericName: 'Glimepiride + Metformin SR',
    strength: '2mg + 500mg SR',
    form: 'Tablet',
    manufacturer: 'USV Pvt Ltd',
    category: 'Antidiabetic / Combination',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 40,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack D-02',
    description: 'Dual oral hypoglycemic agent for effective glycaemic control in uncontrolled type 2 diabetes.',
    sideEffects: 'Hypoglycemia, nausea, headache.',
    dosageGuidelines: '1 tablet once daily morning with breakfast.',
    batches: [
      {
        batchNumber: 'GGP-25E10',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-05-01',
        stock: 160,
        costPrice: 95.00,
        sellingPrice: 155.00,
        mrp: 175.00,
        location: 'Rack D-02'
      }
    ]
  },
  {
    id: 'gen-forxiga-10',
    name: 'Forxiga 10 Tablet',
    genericName: 'Dapagliflozin',
    strength: '10 mg',
    form: 'Tablet',
    manufacturer: 'AstraZeneca Pharma India',
    category: 'Antidiabetic / SGLT2 Inhibitor',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    pack: '14 Tablets',
    packSize: 14,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack D-03',
    description: 'SGLT2 inhibitor for glycemic control, cardiovascular risk reduction, and chronic kidney disease management.',
    sideEffects: 'Urinary tract infection, increased urination, mild dehydration.',
    dosageGuidelines: '1 tablet once daily with or without food.',
    batches: [
      {
        batchNumber: 'FXG-25C02',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-03-01',
        stock: 65,
        costPrice: 580.00,
        sellingPrice: 780.00,
        mrp: 850.00,
        location: 'Rack D-03'
      }
    ]
  },

  // =========================================================================
  // 7. VITAMINS, MINERALS & NUTRACEUTICALS
  // =========================================================================
  {
    id: 'gen-becosules',
    name: 'Becosules Capsule',
    genericName: 'B-Complex with Vitamin C',
    strength: 'Therapeutic Formula',
    form: 'Capsule',
    manufacturer: 'Pfizer Ltd',
    category: 'Nutritional / Vitamin',
    prescriptionRequired: false,
    hsnCode: '300450',
    taxRate: 12,
    minStockAlert: 40,
    pack: '20 Capsules',
    packSize: 20,
    looseUnitName: 'Capsule',
    rackLocation: 'Rack V-01',
    description: 'Classic high-potency Vitamin B-complex and Vitamin C formula for mouth ulcers, fatigue, and tissue repair.',
    sideEffects: 'Bright yellow urine coloration (harmless), mild nausea if taken without food.',
    dosageGuidelines: '1 capsule daily after a meal.',
    batches: [
      {
        batchNumber: 'BCS-25D18',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-04-01',
        stock: 200,
        costPrice: 32.00,
        sellingPrice: 48.00,
        mrp: 55.00,
        location: 'Rack V-01'
      }
    ]
  },
  {
    id: 'gen-shelcal-500',
    name: 'Shelcal 500 Tablet',
    genericName: 'Calcium Carbonate + Vitamin D3',
    strength: '1250mg eq. 500mg Ca + 250 IU D3',
    form: 'Tablet',
    manufacturer: 'Torrent Pharmaceuticals',
    category: 'Nutritional / Bone Health',
    prescriptionRequired: false,
    hsnCode: '300450',
    taxRate: 12,
    minStockAlert: 40,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack V-02',
    description: 'Essential calcium and vitamin D3 supplement for bone density, osteoporosis prevention, and pregnancy support.',
    sideEffects: 'Constipation, bloating.',
    dosageGuidelines: '1 tablet daily after food.',
    batches: [
      {
        batchNumber: 'SHL-25F11',
        expiryDate: '2027-12-31',
        manufacturingDate: '2025-06-01',
        stock: 175,
        costPrice: 75.00,
        sellingPrice: 118.00,
        mrp: 132.00,
        location: 'Rack V-02'
      }
    ]
  },
  {
    id: 'gen-calcirol-60k',
    name: 'Calcirol 60,000 IU Sachet',
    genericName: 'Cholecalciferol Granules (Vitamin D3)',
    strength: '60,000 IU (1g Granules)',
    form: 'Sachet',
    manufacturer: 'Cadila Pharmaceuticals',
    category: 'Nutritional / Vitamin D3',
    prescriptionRequired: false,
    hsnCode: '300450',
    taxRate: 12,
    minStockAlert: 30,
    pack: '1g Sachet',
    packSize: 1,
    looseUnitName: 'Sachet',
    rackLocation: 'Rack V-03',
    description: 'High-dose Vitamin D3 granules for treatment of hypovitaminosis D and calcium absorption.',
    sideEffects: 'None reported at recommended weekly dosage.',
    dosageGuidelines: '1 sachet dissolved in a glass of warm milk once weekly for 8 weeks or as directed.',
    batches: [
      {
        batchNumber: 'CLR-25C05',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-03-01',
        stock: 130,
        costPrice: 28.00,
        sellingPrice: 48.00,
        mrp: 58.00,
        location: 'Rack V-03'
      }
    ]
  },
  {
    id: 'gen-zincovit-tab',
    name: 'Zincovit Tablet',
    genericName: 'Multivitamins + Multiminerals + Grape Seed Extract',
    strength: 'Nutritional Daily Formula',
    form: 'Tablet',
    manufacturer: 'Apex Laboratories',
    category: 'Nutritional Supplement',
    prescriptionRequired: false,
    hsnCode: '300450',
    taxRate: 12,
    minStockAlert: 35,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack V-04',
    description: 'Top-prescribed immune-boosting multivitamin with elemental Zinc and potent grape seed bioflavonoids.',
    sideEffects: 'Rare mild gastric irritation.',
    dosageGuidelines: '1 tablet daily after food.',
    batches: [
      {
        batchNumber: 'ZNC-25E12',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-05-01',
        stock: 190,
        costPrice: 72.00,
        sellingPrice: 110.00,
        mrp: 125.00,
        location: 'Rack V-04'
      }
    ]
  },

  // =========================================================================
  // 8. LAXATIVES & ANTIMOBILITY / ANTISPASMODIC
  // =========================================================================
  {
    id: 'gen-cremaffin-plus',
    name: 'Cremaffin Plus Emulsion',
    genericName: 'Liquid Paraffin + Milk of Magnesia + Sodium Picosulfate',
    strength: 'Laxative Triple Emulsion',
    form: 'Suspension',
    manufacturer: 'Abbott Healthcare',
    category: 'Gastrointestinal / Laxative',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    pack: '225 ml Bottle',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack G-10',
    description: 'Triple active sugar-free stool softener and osmotic laxative for gentle overnight relief of constipation.',
    sideEffects: 'Mild abdominal cramps, diarrhea if overdosed.',
    dosageGuidelines: '1-2 tablespoons (15-30 ml) at bedtime with a glass of water.',
    batches: [
      {
        batchNumber: 'CRF-25D08',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-04-01',
        stock: 60,
        costPrice: 165.00,
        sellingPrice: 245.00,
        mrp: 275.00,
        location: 'Rack G-10'
      }
    ]
  },
  {
    id: 'gen-dulcolax-5',
    name: 'Dulcolax 5mg Tablet',
    genericName: 'Bisacodyl Gastro-resistant',
    strength: '5 mg',
    form: 'Tablet',
    manufacturer: 'Sanofi India Ltd',
    category: 'Gastrointestinal / Laxative',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack G-11',
    description: 'Stimulant laxative providing predictable morning bowel relief within 6 to 12 hours.',
    sideEffects: 'Abdominal cramps, loose stools.',
    dosageGuidelines: '1-2 tablets at bedtime swallowed whole with water.',
    batches: [
      {
        batchNumber: 'DLC-25B15',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-02-01',
        stock: 110,
        costPrice: 8.00,
        sellingPrice: 13.50,
        mrp: 15.00,
        location: 'Rack G-11'
      }
    ]
  },
  {
    id: 'gen-drotin-m',
    name: 'Drotin-M Tablet',
    genericName: 'Drotaverine HCl + Mefenamic Acid',
    strength: '80mg + 250mg',
    form: 'Tablet',
    manufacturer: 'Walter Bushnell / Martin & Harris',
    category: 'Gastrointestinal / Antispasmodic',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack G-12',
    description: 'Smooth muscle antispasmodic and NSAID combination for severe abdominal colic, biliary spasm, and dysmenorrhea.',
    sideEffects: 'Dizziness, nausea, dry mouth, mild headache.',
    dosageGuidelines: '1 tablet 2-3 times daily after food as needed.',
    batches: [
      {
        batchNumber: 'DRM-25A19',
        expiryDate: '2027-07-31',
        manufacturingDate: '2025-01-01',
        stock: 85,
        costPrice: 92.00,
        sellingPrice: 145.00,
        mrp: 168.00,
        location: 'Rack G-12'
      }
    ]
  }
];
