import { Medicine } from '../types';

export const EXPANDED_MANUFACTURER_MEDICINES: Medicine[] = [
  // ==========================================
  // 1. CIPLA (Cipla Ltd)
  // ==========================================
  {
    id: 'med-cip-01',
    name: 'Asthalin 100mcg Inhaler',
    genericName: 'Salbutamol / Albuterol',
    strength: '100 mcg (200 MDI)',
    form: 'Inhaler',
    manufacturer: 'Cipla Ltd',
    category: 'Respiratory / Bronchodilator',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 15,
    pack: '1 Inhaler (200 Puffs)',
    packSize: 1,
    looseUnitName: 'Puff',
    rackLocation: 'Cabinet A-02',
    description: 'Fast-acting bronchodilator aerosol for acute bronchospasm and asthma relief.',
    sideEffects: 'Fine tremors, restlessness, mild headache.',
    dosageGuidelines: '1-2 puffs by inhalation as needed.',
    batches: [
      {
        batchNumber: 'AST-25B01',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-08-01',
        stock: 45,
        costPrice: 112.00,
        sellingPrice: 168.00,
        mrp: 178.50,
        location: 'Cabinet A-02'
      }
    ]
  },
  {
    id: 'med-cip-02',
    name: 'Montair-LC Tablet',
    genericName: 'Montelukast + Levocetirizine',
    strength: '10mg + 5mg',
    form: 'Tablet',
    manufacturer: 'Cipla Ltd',
    category: 'Respiratory & Antiallergic',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack B-03',
    description: 'Dual anti-leukotriene and antihistamine for allergic rhinitis and asthma.',
    sideEffects: 'Mild drowsiness, dry mouth, headache.',
    dosageGuidelines: '1 tablet once daily at bedtime.',
    batches: [
      {
        batchNumber: 'MLC-24K09',
        expiryDate: '2027-05-31',
        manufacturingDate: '2024-11-01',
        stock: 80,
        costPrice: 152.00,
        sellingPrice: 215.00,
        mrp: 232.00,
        location: 'Rack B-03'
      }
    ]
  },
  {
    id: 'med-cip-03',
    name: 'Ciplox 500',
    genericName: 'Ciprofloxacin HCl',
    strength: '500 mg',
    form: 'Tablet',
    manufacturer: 'Cipla Ltd',
    category: 'Antibiotic / Fluoroquinolone',
    prescriptionRequired: true,
    hsnCode: '300410',
    taxRate: 12,
    minStockAlert: 30,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack B-04',
    description: 'Broad spectrum fluoroquinolone antibiotic for bacterial infections.',
    sideEffects: 'Nausea, abdominal cramping, dizziness.',
    dosageGuidelines: '1 tablet every 12 hours after food.',
    batches: [
      {
        batchNumber: 'CPX-25A14',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-01-01',
        stock: 90,
        costPrice: 32.00,
        sellingPrice: 48.50,
        mrp: 54.00,
        location: 'Rack B-04'
      }
    ]
  },
  {
    id: 'med-cip-04',
    name: 'Cipcal 500',
    genericName: 'Calcium Carbonate + Vitamin D3 (Cholecalciferol)',
    strength: '500mg + 250 IU',
    form: 'Tablet',
    manufacturer: 'Cipla Ltd',
    category: 'Nutritional & Calcium Supplement',
    prescriptionRequired: false,
    hsnCode: '300450',
    taxRate: 12,
    minStockAlert: 20,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack N-01',
    description: 'Daily bone health supplement replenishing elemental calcium and vitamin D3.',
    sideEffects: 'Mild constipation, bloating.',
    dosageGuidelines: '1 tablet daily after principal meal.',
    batches: [
      {
        batchNumber: 'CPC-24H21',
        expiryDate: '2027-04-30',
        manufacturingDate: '2024-08-01',
        stock: 75,
        costPrice: 62.00,
        sellingPrice: 89.00,
        mrp: 96.50,
        location: 'Rack N-01'
      }
    ]
  },
  {
    id: 'med-cip-05',
    name: 'Azee 500',
    genericName: 'Azithromycin',
    strength: '500 mg',
    form: 'Tablet',
    manufacturer: 'Cipla Ltd',
    category: 'Antibiotic / Macrolide',
    prescriptionRequired: true,
    hsnCode: '300410',
    taxRate: 12,
    minStockAlert: 20,
    pack: '5 Tablets',
    packSize: 5,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack B-05',
    description: 'Macrolide antibiotic with convenient once-daily dosing for respiratory infections.',
    sideEffects: 'Mild loose stools, stomach cramps.',
    dosageGuidelines: '1 tablet once daily 1 hour before or 2 hours after meals for 3-5 days.',
    batches: [
      {
        batchNumber: 'AZE-25C03',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-03-01',
        stock: 60,
        costPrice: 85.00,
        sellingPrice: 122.00,
        mrp: 134.00,
        location: 'Rack B-05'
      }
    ]
  },

  // ==========================================
  // 2. ALKEM (Alkem Laboratories)
  // ==========================================
  {
    id: 'med-alk-01',
    name: 'Pan 40',
    genericName: 'Pantoprazole',
    strength: '40 mg',
    form: 'Tablet',
    manufacturer: 'Alkem Laboratories',
    category: 'Gastrointestinal / PPI',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 40,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack G-01',
    description: 'Potent proton pump inhibitor that suppresses gastric acid secretion.',
    sideEffects: 'Headache, diarrhea, nausea.',
    dosageGuidelines: '1 tablet once daily in the morning 30 minutes before breakfast.',
    batches: [
      {
        batchNumber: 'PAN-25F11',
        expiryDate: '2027-12-31',
        manufacturingDate: '2025-06-01',
        stock: 120,
        costPrice: 92.00,
        sellingPrice: 135.00,
        mrp: 148.00,
        location: 'Rack G-01'
      }
    ]
  },
  {
    id: 'med-alk-02',
    name: 'Pan-D Capsule',
    genericName: 'Pantoprazole + Domperidone SR',
    strength: '40mg + 30mg SR',
    form: 'Capsule',
    manufacturer: 'Alkem Laboratories',
    category: 'Gastrointestinal / Anti-reflux',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 35,
    pack: '15 Capsules',
    packSize: 15,
    looseUnitName: 'Capsule',
    rackLocation: 'Rack G-02',
    description: 'Prokinetic & proton pump inhibitor combo for GERD, reflux and nausea.',
    sideEffects: 'Dry mouth, dizziness, transient abdominal cramps.',
    dosageGuidelines: '1 capsule empty stomach in morning.',
    batches: [
      {
        batchNumber: 'PND-25D08',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-04-01',
        stock: 110,
        costPrice: 132.00,
        sellingPrice: 188.00,
        mrp: 205.00,
        location: 'Rack G-02'
      }
    ]
  },
  {
    id: 'med-alk-03',
    name: 'Clavam 625',
    genericName: 'Amoxicillin + Clavulanic Acid',
    strength: '500mg + 125mg',
    form: 'Tablet',
    manufacturer: 'Alkem Laboratories',
    category: 'Antibiotic / Penicillin',
    prescriptionRequired: true,
    hsnCode: '300410',
    taxRate: 12,
    minStockAlert: 30,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack B-15',
    description: 'Beta-lactamase inhibitor combo antibiotic for resistant bacterial infections.',
    sideEffects: 'Mild diarrhea, nausea, skin rash.',
    dosageGuidelines: '1 tablet twice daily with meals.',
    batches: [
      {
        batchNumber: 'CLM-25B19',
        expiryDate: '2027-06-30',
        manufacturingDate: '2025-02-01',
        stock: 70,
        costPrice: 118.00,
        sellingPrice: 165.00,
        mrp: 178.00,
        location: 'Rack B-15'
      }
    ]
  },
  {
    id: 'med-alk-04',
    name: 'A-Z Multivitamin Tablet',
    genericName: 'Multivitamins + Multiminerals + Zinc',
    strength: 'Standard Formula',
    form: 'Tablet',
    manufacturer: 'Alkem Laboratories',
    category: 'Nutritional Supplement',
    prescriptionRequired: false,
    hsnCode: '300450',
    taxRate: 12,
    minStockAlert: 20,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack N-02',
    description: 'Comprehensive daily multivitamin and antioxidant mineral supplement.',
    sideEffects: 'Occasional mild gastric upset.',
    dosageGuidelines: '1 tablet once daily with food.',
    batches: [
      {
        batchNumber: 'AZT-24M02',
        expiryDate: '2027-01-31',
        manufacturingDate: '2024-07-01',
        stock: 65,
        costPrice: 85.00,
        sellingPrice: 120.00,
        mrp: 135.00,
        location: 'Rack N-02'
      }
    ]
  },
  {
    id: 'med-alk-05',
    name: 'Taxim-O 200',
    genericName: 'Cefixime',
    strength: '200 mg',
    form: 'Tablet',
    manufacturer: 'Alkem Laboratories',
    category: 'Antibiotic / Cephalosporin',
    prescriptionRequired: true,
    hsnCode: '300410',
    taxRate: 12,
    minStockAlert: 25,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack B-16',
    description: 'Third-generation cephalosporin for typhoid, UTI, and respiratory infections.',
    sideEffects: 'Loose stools, mild dyspepsia.',
    dosageGuidelines: '1 tablet twice daily after meals.',
    batches: [
      {
        batchNumber: 'TXM-25E09',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-05-01',
        stock: 55,
        costPrice: 72.00,
        sellingPrice: 105.00,
        mrp: 116.00,
        location: 'Rack B-16'
      }
    ]
  },

  // ==========================================
  // 3. SUN (Sun Pharma / Sun Pharmaceutical Industries)
  // ==========================================
  {
    id: 'med-sun-01',
    name: 'Pantocid 40',
    genericName: 'Pantoprazole',
    strength: '40 mg',
    form: 'Tablet',
    manufacturer: 'Sun Pharma',
    category: 'Gastrointestinal / PPI',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 35,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack G-03',
    description: 'Premium formulation pantoprazole for hyperacidity, peptic ulcer, and GERD.',
    sideEffects: 'Transient headache, flatulence.',
    dosageGuidelines: '1 tablet in morning before breakfast.',
    batches: [
      {
        batchNumber: 'PNT-25C17',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-03-01',
        stock: 85,
        costPrice: 104.00,
        sellingPrice: 148.00,
        mrp: 160.00,
        location: 'Rack G-03'
      }
    ]
  },
  {
    id: 'med-sun-02',
    name: 'Pantocid-DSR Capsule',
    genericName: 'Pantoprazole + Domperidone SR',
    strength: '40mg + 30mg SR',
    form: 'Capsule',
    manufacturer: 'Sun Pharma',
    category: 'Gastrointestinal / Anti-reflux',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '15 Capsules',
    packSize: 15,
    looseUnitName: 'Capsule',
    rackLocation: 'Rack G-04',
    description: 'Sustained release domperidone with pantoprazole for persistent acid reflux.',
    sideEffects: 'Dry mouth, mild drowsiness.',
    dosageGuidelines: '1 capsule empty stomach once daily.',
    batches: [
      {
        batchNumber: 'PSD-25A22',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-01-01',
        stock: 75,
        costPrice: 142.00,
        sellingPrice: 202.00,
        mrp: 220.00,
        location: 'Rack G-04'
      }
    ]
  },
  {
    id: 'med-sun-03',
    name: 'Volini Pain Relief Gel (30g)',
    genericName: 'Diclofenac Diethylamine + Linseed Oil + Methyl Salicylate + Menthol',
    strength: '1.16% + 3% + 10% + 5%',
    form: 'Ointment',
    manufacturer: 'Sun Pharma',
    category: 'Topical Analgesic & Anti-inflammatory',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    pack: '1 Tube (30g)',
    packSize: 1,
    looseUnitName: 'Tube',
    rackLocation: 'Rack O-01',
    description: 'Deep penetrating fast action topical pain relief gel for sprains and joint pain.',
    sideEffects: 'Mild local skin warming or redness.',
    dosageGuidelines: 'Apply gently to affected area 3-4 times daily.',
    batches: [
      {
        batchNumber: 'VOL-25B06',
        expiryDate: '2027-07-31',
        manufacturingDate: '2025-02-01',
        stock: 50,
        costPrice: 88.00,
        sellingPrice: 125.00,
        mrp: 135.00,
        location: 'Rack O-01'
      }
    ]
  },
  {
    id: 'med-sun-04',
    name: 'Storvas 10',
    genericName: 'Atorvastatin Calcium',
    strength: '10 mg',
    form: 'Tablet',
    manufacturer: 'Sun Pharma',
    category: 'Cardiovascular / Statin',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack C-02',
    description: 'HMG-CoA reductase inhibitor for reducing LDL cholesterol and cardiovascular risk.',
    sideEffects: 'Muscle aches, mild liver enzyme changes.',
    dosageGuidelines: '1 tablet once daily at bedtime.',
    batches: [
      {
        batchNumber: 'STV-25C19',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-03-01',
        stock: 95,
        costPrice: 82.00,
        sellingPrice: 118.00,
        mrp: 128.00,
        location: 'Rack C-02'
      }
    ]
  },
  {
    id: 'med-sun-05',
    name: 'Rosuvas 10',
    genericName: 'Rosuvastatin Calcium',
    strength: '10 mg',
    form: 'Tablet',
    manufacturer: 'Sun Pharma',
    category: 'Cardiovascular / Statin',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack C-03',
    description: 'Potent statin for aggressive cholesterol lowering and atherosclerosis management.',
    sideEffects: 'Myalgia, headache, abdominal discomfort.',
    dosageGuidelines: '1 tablet once daily at night.',
    batches: [
      {
        batchNumber: 'RSV-25D11',
        expiryDate: '2027-12-31',
        manufacturingDate: '2025-04-01',
        stock: 80,
        costPrice: 135.00,
        sellingPrice: 195.00,
        mrp: 215.00,
        location: 'Rack C-03'
      }
    ]
  },

  // ==========================================
  // 4. HIMALAYA (The Himalaya Drug Company / Himalaya Wellness)
  // ==========================================
  {
    id: 'med-him-01',
    name: 'Liv.52 DS Tablet',
    genericName: 'Herbal Hepatoprotective (Capparis spinosa + Cichorium intybus)',
    strength: 'Double Strength',
    form: 'Tablet',
    manufacturer: 'Himalaya Wellness',
    category: 'Ayurvedic / Hepatic Care',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 40,
    pack: '60 Tablets',
    packSize: 60,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack H-01',
    description: 'Ayurvedic hepatoprotective formula supporting liver health and appetite.',
    sideEffects: 'None reported at recommended dosages.',
    dosageGuidelines: '1-2 tablets twice daily before meals.',
    batches: [
      {
        batchNumber: 'LDS-25A05',
        expiryDate: '2028-01-31',
        manufacturingDate: '2025-01-01',
        stock: 90,
        costPrice: 155.00,
        sellingPrice: 210.00,
        mrp: 225.00,
        location: 'Rack H-01'
      }
    ]
  },
  {
    id: 'med-him-02',
    name: 'Cystone Tablet',
    genericName: 'Herbal Lithotriptic & Diuretic (Didymocarpus pedicellata + Saxifraga ligulata)',
    strength: 'Standard Ayurvedic',
    form: 'Tablet',
    manufacturer: 'Himalaya Wellness',
    category: 'Ayurvedic / Renal & Urinary Care',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '60 Tablets',
    packSize: 60,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack H-02',
    description: 'Natural urinary tract antiseptic and stone dissolving herbal formulation.',
    sideEffects: 'None known.',
    dosageGuidelines: '2 tablets twice daily with water.',
    batches: [
      {
        batchNumber: 'CYS-25B12',
        expiryDate: '2028-02-28',
        manufacturingDate: '2025-02-01',
        stock: 70,
        costPrice: 130.00,
        sellingPrice: 180.00,
        mrp: 195.00,
        location: 'Rack H-02'
      }
    ]
  },
  {
    id: 'med-him-03',
    name: 'Septilin Tablet',
    genericName: 'Herbal Immunomodulator & Anti-infective (Guggulu + Tinospora cordifolia)',
    strength: 'Standard Formula',
    form: 'Tablet',
    manufacturer: 'Himalaya Wellness',
    category: 'Ayurvedic / Immunity',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '60 Tablets',
    packSize: 60,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack H-03',
    description: 'Natural immunity booster building resistance against recurrent respiratory infections.',
    sideEffects: 'None known.',
    dosageGuidelines: '2 tablets twice daily after meals.',
    batches: [
      {
        batchNumber: 'SEP-24L18',
        expiryDate: '2027-11-30',
        manufacturingDate: '2024-12-01',
        stock: 55,
        costPrice: 120.00,
        sellingPrice: 165.00,
        mrp: 175.00,
        location: 'Rack H-03'
      }
    ]
  },
  {
    id: 'med-him-04',
    name: 'Gasex Tablet',
    genericName: 'Herbal Carminative & Antiflatulent (Prativisha + Sunthi + Vidanga)',
    strength: 'Standard Formula',
    form: 'Tablet',
    manufacturer: 'Himalaya Wellness',
    category: 'Ayurvedic / Digestive Care',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    pack: '100 Tablets',
    packSize: 100,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack H-04',
    description: 'Natural digestive aid relieving gas, indigestion, and abdominal fullness.',
    sideEffects: 'None.',
    dosageGuidelines: '2 tablets chewable or swallowed after meals.',
    batches: [
      {
        batchNumber: 'GSX-25C08',
        expiryDate: '2028-03-31',
        manufacturingDate: '2025-03-01',
        stock: 65,
        costPrice: 105.00,
        sellingPrice: 145.00,
        mrp: 160.00,
        location: 'Rack H-04'
      }
    ]
  },
  {
    id: 'med-him-05',
    name: 'Bonnisan Drops (30ml)',
    genericName: 'Pediatric Digestive & Carminative Tonic (Dill Oil + Cardamom)',
    strength: 'Pediatric Formula',
    form: 'Drops',
    manufacturer: 'Himalaya Wellness',
    category: 'Ayurvedic / Pediatric Care',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    pack: '1 Bottle (30ml)',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack H-05',
    description: 'Gentle Ayurvedic digestive drops for infant colic, griping, and healthy growth.',
    sideEffects: 'Safe for infants.',
    dosageGuidelines: '5-10 drops 2-3 times daily before feed.',
    batches: [
      {
        batchNumber: 'BON-25A19',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-01-01',
        stock: 40,
        costPrice: 48.00,
        sellingPrice: 70.00,
        mrp: 75.00,
        location: 'Rack H-05'
      }
    ]
  },

  // ==========================================
  // 5. ANGLO-INDIAN / ANGLO-FRENCH (Anglo-French Drugs & Industries Ltd)
  // ==========================================
  {
    id: 'med-af-01',
    name: 'Beplex Forte Tablet',
    genericName: 'High Potency Vitamin B-Complex with Vitamin C & Zinc',
    strength: 'High Potency',
    form: 'Tablet',
    manufacturer: 'Anglo-French Drugs',
    category: 'Nutritional & Vitamin Supplement',
    prescriptionRequired: false,
    hsnCode: '300450',
    taxRate: 12,
    minStockAlert: 35,
    pack: '20 Tablets',
    packSize: 20,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack AF-01',
    description: 'Gold-standard therapeutic B-Complex formulation for mouth ulcers and neuropathy.',
    sideEffects: 'Harmless bright yellow coloration of urine.',
    dosageGuidelines: '1 tablet daily after principal meal.',
    batches: [
      {
        batchNumber: 'BPF-25A09',
        expiryDate: '2027-06-30',
        manufacturingDate: '2025-01-01',
        stock: 85,
        costPrice: 42.00,
        sellingPrice: 62.00,
        mrp: 68.00,
        location: 'Rack AF-01'
      }
    ]
  },
  {
    id: 'med-af-02',
    name: 'B-Plex Elixir (200ml)',
    genericName: 'Vitamin B-Complex with L-Lysine Syrup',
    strength: 'Nutritional Elixir',
    form: 'Syrup',
    manufacturer: 'Anglo-French Drugs',
    category: 'Nutritional & Appetite Stimulant',
    prescriptionRequired: false,
    hsnCode: '300450',
    taxRate: 12,
    minStockAlert: 20,
    pack: '1 Bottle (200ml)',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack AF-02',
    description: 'Appetite restoring B-complex elixir enriched with essential amino acid L-Lysine.',
    sideEffects: 'None known.',
    dosageGuidelines: '10ml twice daily before meals.',
    batches: [
      {
        batchNumber: 'BPX-25B03',
        expiryDate: '2027-04-30',
        manufacturingDate: '2025-02-01',
        stock: 45,
        costPrice: 88.00,
        sellingPrice: 125.00,
        mrp: 138.00,
        location: 'Rack AF-02'
      }
    ]
  },
  {
    id: 'med-af-03',
    name: 'Pep-Cept Syrup (200ml)',
    genericName: 'Fungal Diastase + Pepsin Digestive Enzymes',
    strength: '50mg + 10mg / 5ml',
    form: 'Syrup',
    manufacturer: 'Anglo-French Drugs',
    category: 'Gastrointestinal / Digestive Enzyme',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    pack: '1 Bottle (200ml)',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack AF-03',
    description: 'Dual enzyme digestive syrup accelerating breakdown of carbohydrates and proteins.',
    sideEffects: 'Occasional mild abdominal rumbling.',
    dosageGuidelines: '5-10ml immediately after main meals.',
    batches: [
      {
        batchNumber: 'PCP-24K12',
        expiryDate: '2026-12-31',
        manufacturingDate: '2024-11-01',
        stock: 35,
        costPrice: 92.00,
        sellingPrice: 132.00,
        mrp: 145.00,
        location: 'Rack AF-03'
      }
    ]
  },
  {
    id: 'med-af-04',
    name: 'Kof-Nil Cough Syrup (100ml)',
    genericName: 'Diphenhydramine HCl + Ammonium Chloride + Menthol',
    strength: '14.08mg + 138mg + 1.14mg / 5ml',
    form: 'Syrup',
    manufacturer: 'Anglo-French Drugs',
    category: 'Respiratory / Antitussive & Expectorant',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '1 Bottle (100ml)',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack AF-04',
    description: 'Time-tested cough relief syrup loosening stubborn phlegm and soothing throat.',
    sideEffects: 'Mild drowsiness.',
    dosageGuidelines: '10ml every 4-6 hours.',
    batches: [
      {
        batchNumber: 'KFN-25C07',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-03-01',
        stock: 50,
        costPrice: 65.00,
        sellingPrice: 95.00,
        mrp: 104.00,
        location: 'Rack AF-04'
      }
    ]
  },

  // ==========================================
  // 6. MANKIND (Mankind Pharma)
  // ==========================================
  {
    id: 'med-mk-01',
    name: 'Moxikind-CV 625',
    genericName: 'Amoxicillin + Clavulanic Acid',
    strength: '500mg + 125mg',
    form: 'Tablet',
    manufacturer: 'Mankind Pharma',
    category: 'Antibiotic / Penicillin',
    prescriptionRequired: true,
    hsnCode: '300410',
    taxRate: 12,
    minStockAlert: 35,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack M-01',
    description: 'Affordable high-potency antibiotic for ENT, dental, and chest infections.',
    sideEffects: 'Mild nausea or loose stools.',
    dosageGuidelines: '1 tablet twice daily after meals.',
    batches: [
      {
        batchNumber: 'MXK-25B15',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-02-01',
        stock: 120,
        costPrice: 98.00,
        sellingPrice: 142.00,
        mrp: 155.00,
        location: 'Rack M-01'
      }
    ]
  },
  {
    id: 'med-mk-02',
    name: 'Candiforce 200',
    genericName: 'Itraconazole',
    strength: '200 mg',
    form: 'Capsule',
    manufacturer: 'Mankind Pharma',
    category: 'Antifungal',
    prescriptionRequired: true,
    hsnCode: '300420',
    taxRate: 12,
    minStockAlert: 25,
    pack: '10 Capsules',
    packSize: 10,
    looseUnitName: 'Capsule',
    rackLocation: 'Rack M-02',
    description: 'Systemic broad-spectrum antifungal for persistent dermatophyte fungal infections.',
    sideEffects: 'Headache, upset stomach, mild rash.',
    dosageGuidelines: '1 capsule once daily with a fatty meal.',
    batches: [
      {
        batchNumber: 'CDF-25A07',
        expiryDate: '2027-05-31',
        manufacturingDate: '2025-01-01',
        stock: 65,
        costPrice: 145.00,
        sellingPrice: 215.00,
        mrp: 235.00,
        location: 'Rack M-02'
      }
    ]
  },
  {
    id: 'med-mk-03',
    name: 'Glimestar-M1',
    genericName: 'Glimepiride + Metformin SR',
    strength: '1mg + 500mg SR',
    form: 'Tablet',
    manufacturer: 'Mankind Pharma',
    category: 'Antidiabetic',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 40,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack M-03',
    description: 'Combination oral hypoglycemic managing fasting and post-prandial glycemia.',
    sideEffects: 'Hypoglycemia risk if meal missed, mild metallic taste.',
    dosageGuidelines: '1 tablet once daily with first main meal.',
    batches: [
      {
        batchNumber: 'GLM-25C21',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-03-01',
        stock: 140,
        costPrice: 58.00,
        sellingPrice: 84.00,
        mrp: 92.00,
        location: 'Rack M-03'
      }
    ]
  },
  {
    id: 'med-mk-04',
    name: 'Zenflox-OZ',
    genericName: 'Ofloxacin + Ornidazole',
    strength: '200mg + 500mg',
    form: 'Tablet',
    manufacturer: 'Mankind Pharma',
    category: 'Antibiotic / Gastrointestinal Infection',
    prescriptionRequired: true,
    hsnCode: '300410',
    taxRate: 12,
    minStockAlert: 30,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack M-04',
    description: 'Dual antibacterial and antiprotozoal for acute diarrhea and mixed bowel infections.',
    sideEffects: 'Metallic taste, mild nausea, dizziness.',
    dosageGuidelines: '1 tablet twice daily for 5 days.',
    batches: [
      {
        batchNumber: 'ZFX-25B04',
        expiryDate: '2027-07-31',
        manufacturingDate: '2025-02-01',
        stock: 80,
        costPrice: 75.00,
        sellingPrice: 110.00,
        mrp: 120.00,
        location: 'Rack M-04'
      }
    ]
  },
  {
    id: 'med-mk-05',
    name: 'Prega News hCG Test Card',
    genericName: 'Rapid One-Step hCG Urine Pregnancy Detection Kit',
    strength: '1 Diagnostic Cassette',
    form: 'Device',
    manufacturer: 'Mankind Pharma',
    category: 'Diagnostic / Rapid Test Kit',
    prescriptionRequired: false,
    hsnCode: '382200',
    taxRate: 12,
    minStockAlert: 30,
    pack: '1 Card',
    packSize: 1,
    looseUnitName: 'Card',
    rackLocation: 'Rack M-05',
    description: 'One-step rapid urine hCG immunoassay test card for home and clinic pregnancy detection.',
    sideEffects: 'None.',
    dosageGuidelines: 'Add 3 drops morning urine into sample well. Read within 5 minutes.',
    batches: [
      {
        batchNumber: 'PGN-25D02',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-04-01',
        stock: 150,
        costPrice: 32.00,
        sellingPrice: 50.00,
        mrp: 55.00,
        location: 'Rack M-05'
      }
    ]
  },

  // ==========================================
  // 7. MACRO / MACLEODS (Macleods Pharmaceuticals)
  // ==========================================
  {
    id: 'med-mac-01',
    name: 'Macfast 650',
    genericName: 'Paracetamol / Acetaminophen',
    strength: '650 mg',
    form: 'Tablet',
    manufacturer: 'Macleods Pharmaceuticals',
    category: 'Analgesic & Antipyretic',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 50,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack MC-01',
    description: 'Fast-dissolving paracetamol 650mg for high fever, body ache, and headache.',
    sideEffects: 'Safe when used within 4g/day limit.',
    dosageGuidelines: '1 tablet every 6 hours as needed.',
    batches: [
      {
        batchNumber: 'MCF-25A18',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-01-01',
        stock: 160,
        costPrice: 18.00,
        sellingPrice: 28.00,
        mrp: 32.00,
        location: 'Rack MC-01'
      }
    ]
  },
  {
    id: 'med-mac-02',
    name: 'Mahacef 200',
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
    rackLocation: 'Rack MC-02',
    description: 'Third-generation cephalosporin for enteric fever, bronchitis, and urinary tract infections.',
    sideEffects: 'Diarrhea, stomach discomfort.',
    dosageGuidelines: '1 tablet twice daily after meals.',
    batches: [
      {
        batchNumber: 'MHC-25B09',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-02-01',
        stock: 75,
        costPrice: 68.00,
        sellingPrice: 98.00,
        mrp: 108.00,
        location: 'Rack MC-02'
      }
    ]
  },
  {
    id: 'med-mac-03',
    name: 'Rabemac 20',
    genericName: 'Rabeprazole Sodium',
    strength: '20 mg',
    form: 'Tablet',
    manufacturer: 'Macleods Pharmaceuticals',
    category: 'Gastrointestinal / PPI',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack MC-03',
    description: 'Rapid onset proton pump inhibitor for severe heartburn, acid reflux, and ulcers.',
    sideEffects: 'Headache, flatulence, dry mouth.',
    dosageGuidelines: '1 tablet once daily morning before meals.',
    batches: [
      {
        batchNumber: 'RBM-25C14',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-03-01',
        stock: 85,
        costPrice: 68.00,
        sellingPrice: 98.00,
        mrp: 106.00,
        location: 'Rack MC-03'
      }
    ]
  },
  {
    id: 'med-mac-04',
    name: 'Macbery-DX Syrup (100ml)',
    genericName: 'Dextromethorphan HBr + Chlorpheniramine + Phenylephrine',
    strength: '10mg + 2mg + 5mg / 5ml',
    form: 'Syrup',
    manufacturer: 'Macleods Pharmaceuticals',
    category: 'Respiratory / Dry Cough Relief',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    pack: '1 Bottle (100ml)',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack MC-04',
    description: 'Non-drowsy formulation dry cough syrup suppressing tickling cough and clearing nasal passages.',
    sideEffects: 'Mild dizziness, dry mouth.',
    dosageGuidelines: '5-10ml 3 times daily.',
    batches: [
      {
        batchNumber: 'MBD-25D05',
        expiryDate: '2027-06-30',
        manufacturingDate: '2025-04-01',
        stock: 45,
        costPrice: 72.00,
        sellingPrice: 105.00,
        mrp: 115.00,
        location: 'Rack MC-04'
      }
    ]
  },

  // ==========================================
  // 8. MICRO (Micro Labs Ltd)
  // ==========================================
  {
    id: 'med-mic-01',
    name: 'Dolo 650',
    genericName: 'Paracetamol / Acetaminophen',
    strength: '650 mg',
    form: 'Tablet',
    manufacturer: 'Micro Labs',
    category: 'Analgesic & Antipyretic',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 50,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack ML-01',
    description: 'India\'s standard fever and pain management paracetamol brand.',
    sideEffects: 'Extremely safe within recommended dosage.',
    dosageGuidelines: '1 tablet 3-4 times daily as required with water.',
    batches: [
      {
        batchNumber: 'DOL-25A01',
        expiryDate: '2027-12-31',
        manufacturingDate: '2025-01-01',
        stock: 220,
        costPrice: 22.00,
        sellingPrice: 32.00,
        mrp: 34.00,
        location: 'Rack ML-01'
      }
    ]
  },
  {
    id: 'med-mic-02',
    name: 'Amlong 5',
    genericName: 'Amlodipine Besylate',
    strength: '5 mg',
    form: 'Tablet',
    manufacturer: 'Micro Labs',
    category: 'Cardiovascular / Antihypertensive',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 35,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack ML-02',
    description: 'Calcium channel blocker for essential hypertension and chronic stable angina.',
    sideEffects: 'Ankle swelling (peripheral edema), flushing.',
    dosageGuidelines: '1 tablet once daily morning.',
    batches: [
      {
        batchNumber: 'AML-25B11',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-02-01',
        stock: 90,
        costPrice: 42.00,
        sellingPrice: 62.00,
        mrp: 68.00,
        location: 'Rack ML-02'
      }
    ]
  },
  {
    id: 'med-mic-03',
    name: 'Tenepride 20',
    genericName: 'Teneligliptin',
    strength: '20 mg',
    form: 'Tablet',
    manufacturer: 'Micro Labs',
    category: 'Antidiabetic / DPP-4 Inhibitor',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack ML-03',
    description: 'DPP-4 inhibitor regulating post-prandial insulin secretion with minimal hypoglycemia.',
    sideEffects: 'Hypoglycemia when combined with sulfonylureas, nasopharyngitis.',
    dosageGuidelines: '1 tablet once daily before or after breakfast.',
    batches: [
      {
        batchNumber: 'TNP-25C08',
        expiryDate: '2027-07-31',
        manufacturingDate: '2025-03-01',
        stock: 70,
        costPrice: 110.00,
        sellingPrice: 160.00,
        mrp: 175.00,
        location: 'Rack ML-03'
      }
    ]
  },
  {
    id: 'med-mic-04',
    name: 'Pulmoclear Tablet',
    genericName: 'Acebrophylline + Acetylcysteine',
    strength: '100mg + 600mg',
    form: 'Tablet',
    manufacturer: 'Micro Labs',
    category: 'Respiratory / Mucolytic & Bronchodilator',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack ML-04',
    description: 'Mucolytic antioxidant combo clearing thick bronchial mucus in COPD and bronchitis.',
    sideEffects: 'Mild heartburn, nausea.',
    dosageGuidelines: '1 tablet once or twice daily after meals.',
    batches: [
      {
        batchNumber: 'PLC-25D14',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-04-01',
        stock: 50,
        costPrice: 135.00,
        sellingPrice: 195.00,
        mrp: 215.00,
        location: 'Rack ML-04'
      }
    ]
  },

  // ==========================================
  // 9. BLUE CROSS (Blue Cross Laboratories)
  // ==========================================
  {
    id: 'med-bc-01',
    name: 'Meftal-Spas',
    genericName: 'Mefenamic Acid + Dicyclomine HCl',
    strength: '250mg + 10mg',
    form: 'Tablet',
    manufacturer: 'Blue Cross Laboratories',
    category: 'Analgesic & Antispasmodic',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 40,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack BC-01',
    description: 'Targeted antispasmodic relief for menstrual colic, intestinal spasm, and biliary cramps.',
    sideEffects: 'Dry mouth, blurred vision, dizziness.',
    dosageGuidelines: '1 tablet during acute cramp, max 3 tablets daily after meals.',
    batches: [
      {
        batchNumber: 'MFS-25B02',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-02-01',
        stock: 110,
        costPrice: 34.00,
        sellingPrice: 48.00,
        mrp: 53.00,
        location: 'Rack BC-01'
      }
    ]
  },
  {
    id: 'med-bc-02',
    name: 'Meftal 500',
    genericName: 'Mefenamic Acid',
    strength: '500 mg',
    form: 'Tablet',
    manufacturer: 'Blue Cross Laboratories',
    category: 'NSAID / Analgesic & Antipyretic',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack BC-02',
    description: 'Non-steroidal anti-inflammatory drug providing rapid relief from severe inflammatory pain.',
    sideEffects: 'Mild heartburn, stomach discomfort.',
    dosageGuidelines: '1 tablet after meals.',
    batches: [
      {
        batchNumber: 'MFT-25A15',
        expiryDate: '2027-06-30',
        manufacturingDate: '2025-01-01',
        stock: 80,
        costPrice: 28.00,
        sellingPrice: 42.00,
        mrp: 46.50,
        location: 'Rack BC-02'
      }
    ]
  },
  {
    id: 'med-bc-03',
    name: 'TusQ-DX Cough Syrup (100ml)',
    genericName: 'Dextromethorphan HBr + Chlorpheniramine + Phenylephrine',
    strength: '10mg + 2mg + 5mg / 5ml',
    form: 'Syrup',
    manufacturer: 'Blue Cross Laboratories',
    category: 'Respiratory / Antitussive',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '1 Bottle (100ml)',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack BC-03',
    description: 'Quick-acting soothing dry cough formula relieving allergic throat tickle.',
    sideEffects: 'Drowsiness, dry mouth.',
    dosageGuidelines: '10ml 3 times daily.',
    batches: [
      {
        batchNumber: 'TSQ-25C04',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-03-01',
        stock: 60,
        costPrice: 70.00,
        sellingPrice: 102.00,
        mrp: 112.00,
        location: 'Rack BC-03'
      }
    ]
  },
  {
    id: 'med-bc-04',
    name: 'Blumox-CA 625',
    genericName: 'Amoxicillin + Clavulanic Acid',
    strength: '500mg + 125mg',
    form: 'Tablet',
    manufacturer: 'Blue Cross Laboratories',
    category: 'Antibiotic / Penicillin',
    prescriptionRequired: true,
    hsnCode: '300410',
    taxRate: 12,
    minStockAlert: 25,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack BC-04',
    description: 'Affordable co-amoxiclav formulation manufactured under rigorous GMP compliance.',
    sideEffects: 'Loose stools, mild nausea.',
    dosageGuidelines: '1 tablet twice daily with food.',
    batches: [
      {
        batchNumber: 'BMX-25A19',
        expiryDate: '2027-05-31',
        manufacturingDate: '2025-01-01',
        stock: 55,
        costPrice: 90.00,
        sellingPrice: 130.00,
        mrp: 142.00,
        location: 'Rack BC-04'
      }
    ]
  },

  // ==========================================
  // 10. UNIVERSAL (Universal Healthcare / Generics)
  // ==========================================
  {
    id: 'med-uni-01',
    name: 'Unienzyme with Activated Charcoal',
    genericName: 'Fungal Diastase + Papain + Activated Charcoal',
    strength: '100mg + 60mg + 75mg',
    form: 'Tablet',
    manufacturer: 'Universal Healthcare',
    category: 'Gastrointestinal / Digestive Enzyme',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 35,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack U-01',
    description: 'Time-tested triple enzyme and adsorbent formula neutralizing intestinal gas and bloating.',
    sideEffects: 'Dark stool due to activated charcoal.',
    dosageGuidelines: '1-2 tablets immediately after principal meals.',
    batches: [
      {
        batchNumber: 'UEN-25B07',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-02-01',
        stock: 120,
        costPrice: 45.00,
        sellingPrice: 65.00,
        mrp: 72.00,
        location: 'Rack U-01'
      }
    ]
  },
  {
    id: 'med-uni-02',
    name: 'Universal Gripe Water (120ml)',
    genericName: 'Dill Seed Oil + Sodium Bicarbonate Carminative',
    strength: 'Pediatric Formula',
    form: 'Syrup',
    manufacturer: 'Universal Healthcare',
    category: 'Pediatric & Infant Colic Relief',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    pack: '1 Bottle (120ml)',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack U-02',
    description: 'Alcohol-free soothing gripe water relieving infant teething troubles and wind pain.',
    sideEffects: 'Gentle on infant tummy.',
    dosageGuidelines: '5ml after feeds or during colic episodes.',
    batches: [
      {
        batchNumber: 'UGW-25A11',
        expiryDate: '2027-06-30',
        manufacturingDate: '2025-01-01',
        stock: 50,
        costPrice: 38.00,
        sellingPrice: 56.00,
        mrp: 62.00,
        location: 'Rack U-02'
      }
    ]
  },
  {
    id: 'med-uni-03',
    name: 'Universal C-Vit 500 Chewable',
    genericName: 'Vitamin C (Ascorbic Acid + Sodium Ascorbate)',
    strength: '500 mg',
    form: 'Tablet',
    manufacturer: 'Universal Healthcare',
    category: 'Nutritional & Antioxidant',
    prescriptionRequired: false,
    hsnCode: '300450',
    taxRate: 12,
    minStockAlert: 40,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack U-03',
    description: 'Pleasant orange flavored chewable vitamin C supporting tissue repair and immunity.',
    sideEffects: 'Safe water-soluble vitamin.',
    dosageGuidelines: '1 tablet chewed daily.',
    batches: [
      {
        batchNumber: 'UCV-25C01',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-03-01',
        stock: 90,
        costPrice: 24.00,
        sellingPrice: 38.00,
        mrp: 42.00,
        location: 'Rack U-03'
      }
    ]
  },

  // ==========================================
  // 11. GLAXOSMITHKLINE (GSK / GlaxoSmithKline)
  // ==========================================
  {
    id: 'med-gsk-01',
    name: 'Augmentin 625 Duo',
    genericName: 'Amoxicillin + Clavulanic Acid',
    strength: '500mg + 125mg',
    form: 'Tablet',
    manufacturer: 'GlaxoSmithKline (GSK)',
    category: 'Antibiotic / Penicillin',
    prescriptionRequired: true,
    hsnCode: '300410',
    taxRate: 12,
    minStockAlert: 35,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack GSK-01',
    description: 'Gold standard innovator co-amoxiclav antibiotic for respiratory, dental and skin infections.',
    sideEffects: 'Mild diarrhea, nausea, skin rash.',
    dosageGuidelines: '1 tablet twice daily with food.',
    batches: [
      {
        batchNumber: 'AUG-25A09',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-01-01',
        stock: 95,
        costPrice: 142.50,
        sellingPrice: 204.00,
        mrp: 215.00,
        location: 'Rack GSK-01'
      }
    ]
  },
  {
    id: 'med-gsk-02',
    name: 'Calpol 650',
    genericName: 'Paracetamol / Acetaminophen',
    strength: '650 mg',
    form: 'Tablet',
    manufacturer: 'GlaxoSmithKline (GSK)',
    category: 'Analgesic & Antipyretic',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 50,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack GSK-02',
    description: 'Trusted paracetamol brand for prompt relief from high temperature, body ache and headache.',
    sideEffects: 'Safe within therapeutic limits.',
    dosageGuidelines: '1 tablet 3 times daily as needed.',
    batches: [
      {
        batchNumber: 'CLP-25B04',
        expiryDate: '2027-12-31',
        manufacturingDate: '2025-02-01',
        stock: 180,
        costPrice: 21.00,
        sellingPrice: 30.00,
        mrp: 32.50,
        location: 'Rack GSK-02'
      }
    ]
  },
  {
    id: 'med-gsk-03',
    name: 'Betnovate-N Cream (20g)',
    genericName: 'Betamethasone Valerate + Neomycin Sulfate',
    strength: '0.1% + 0.5% w/w',
    form: 'Ointment',
    manufacturer: 'GlaxoSmithKline (GSK)',
    category: 'Dermatological / Topical Corticosteroid & Antibacterial',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '1 Tube (20g)',
    packSize: 1,
    looseUnitName: 'Tube',
    rackLocation: 'Rack GSK-03',
    description: 'Topical anti-inflammatory corticosteroid and antibiotic for eczema and dermatosis.',
    sideEffects: 'Local skin thinning if overused.',
    dosageGuidelines: 'Apply sparingly to affected area 1-2 times daily.',
    batches: [
      {
        batchNumber: 'BTN-25C11',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-03-01',
        stock: 65,
        costPrice: 38.00,
        sellingPrice: 55.00,
        mrp: 60.00,
        location: 'Rack GSK-03'
      }
    ]
  },
  {
    id: 'med-gsk-04',
    name: 'Ceftum 500',
    genericName: 'Cefuroxime Axetil',
    strength: '500 mg',
    form: 'Tablet',
    manufacturer: 'GlaxoSmithKline (GSK)',
    category: 'Antibiotic / 2nd Gen Cephalosporin',
    prescriptionRequired: true,
    hsnCode: '300410',
    taxRate: 12,
    minStockAlert: 20,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack GSK-04',
    description: 'Second-generation cephalosporin for severe respiratory, urinary and soft tissue infections.',
    sideEffects: 'Transient gastrointestinal disturbance.',
    dosageGuidelines: '1 tablet twice daily after food.',
    batches: [
      {
        batchNumber: 'CFT-25D02',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-04-01',
        stock: 45,
        costPrice: 320.00,
        sellingPrice: 460.00,
        mrp: 495.00,
        location: 'Rack GSK-04'
      }
    ]
  },
  {
    id: 'med-gsk-05',
    name: 'Eltroxin 50mcg',
    genericName: 'Thyroxine Sodium / Levothyroxine',
    strength: '50 mcg',
    form: 'Tablet',
    manufacturer: 'GlaxoSmithKline (GSK)',
    category: 'Endocrine / Thyroid Hormone',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 40,
    pack: '120 Tablets',
    packSize: 120,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack GSK-05',
    description: 'Levothyroxine replacement for primary hypothyroidism and thyroid hormone deficiency.',
    sideEffects: 'Palpitations if dosed in excess.',
    dosageGuidelines: '1 tablet once daily morning fasting 30 mins before tea/breakfast.',
    batches: [
      {
        batchNumber: 'ELT-25A22',
        expiryDate: '2028-01-31',
        manufacturingDate: '2025-01-01',
        stock: 90,
        costPrice: 130.00,
        sellingPrice: 185.00,
        mrp: 198.00,
        location: 'Rack GSK-05'
      }
    ]
  },

  // ==========================================
  // 12. LEDFORD / LEEFORD (Leeford Healthcare Ltd)
  // ==========================================
  {
    id: 'med-lee-01',
    name: 'Lee-Rab 20',
    genericName: 'Rabeprazole Sodium',
    strength: '20 mg',
    form: 'Tablet',
    manufacturer: 'Leeford Healthcare',
    category: 'Gastrointestinal / PPI',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 35,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack LF-01',
    description: 'Fast and sustained acid suppressor providing relief from heartburn and gastritis.',
    sideEffects: 'Mild headache, diarrhea.',
    dosageGuidelines: '1 tablet in morning before breakfast.',
    batches: [
      {
        batchNumber: 'LRB-25B06',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-02-01',
        stock: 100,
        costPrice: 52.00,
        sellingPrice: 76.00,
        mrp: 85.00,
        location: 'Rack LF-01'
      }
    ]
  },
  {
    id: 'med-lee-02',
    name: 'Lee-P 650',
    genericName: 'Paracetamol / Acetaminophen',
    strength: '650 mg',
    form: 'Tablet',
    manufacturer: 'Leeford Healthcare',
    category: 'Analgesic & Antipyretic',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 40,
    pack: '15 Tablets',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack LF-02',
    description: 'Cost-effective generic paracetamol for broad antipyretic and analgesic action.',
    sideEffects: 'Extremely well tolerated.',
    dosageGuidelines: '1 tablet 3 times daily as required.',
    batches: [
      {
        batchNumber: 'LFP-25A14',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-01-01',
        stock: 130,
        costPrice: 15.00,
        sellingPrice: 23.00,
        mrp: 26.00,
        location: 'Rack LF-02'
      }
    ]
  },
  {
    id: 'med-lee-03',
    name: 'Meganeuron OD Plus',
    genericName: 'Methylcobalamin + Alpha Lipoic Acid + Pyridoxine + Folic Acid',
    strength: '1500mcg + 100mg + 3mg + 1.5mg',
    form: 'Capsule',
    manufacturer: 'Leeford Healthcare',
    category: 'Nutritional / Neuropathy Care',
    prescriptionRequired: false,
    hsnCode: '300450',
    taxRate: 12,
    minStockAlert: 25,
    pack: '10 Capsules',
    packSize: 10,
    looseUnitName: 'Capsule',
    rackLocation: 'Rack LF-03',
    description: 'Neurotrophic antioxidant nerve rejuvenating formula for diabetic neuropathy and tingling.',
    sideEffects: 'Mild nausea.',
    dosageGuidelines: '1 capsule daily after food.',
    batches: [
      {
        batchNumber: 'MGN-25C09',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-03-01',
        stock: 75,
        costPrice: 115.00,
        sellingPrice: 168.00,
        mrp: 185.00,
        location: 'Rack LF-03'
      }
    ]
  },
  {
    id: 'med-lee-04',
    name: 'Lee-Mont LC',
    genericName: 'Montelukast + Levocetirizine',
    strength: '10mg + 5mg',
    form: 'Tablet',
    manufacturer: 'Leeford Healthcare',
    category: 'Respiratory & Antiallergic',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack LF-04',
    description: 'Affordable generic substitute for Montair-LC relieving sneezing, runny nose and itching.',
    sideEffects: 'Mild drowsiness.',
    dosageGuidelines: '1 tablet at bedtime.',
    batches: [
      {
        batchNumber: 'LML-25B18',
        expiryDate: '2027-07-31',
        manufacturingDate: '2025-02-01',
        stock: 90,
        costPrice: 95.00,
        sellingPrice: 138.00,
        mrp: 152.00,
        location: 'Rack LF-04'
      }
    ]
  },

  // ==========================================
  // 13. WOCKHARDT (Wockhardt Ltd)
  // ==========================================
  {
    id: 'med-wock-01',
    name: 'Spasmo-Proxyvon Plus',
    genericName: 'Tramadol HCl + Paracetamol + Dicyclomine HCl',
    strength: '37.5mg + 325mg + 20mg',
    form: 'Capsule',
    manufacturer: 'Wockhardt Ltd',
    category: 'Analgesic & Antispasmodic (Schedule H1)',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    pack: '24 Capsules',
    packSize: 24,
    looseUnitName: 'Capsule',
    rackLocation: 'Locked Safe H1',
    description: 'Controlled opioid & antispasmodic formulation strictly dispensed on doctor prescription.',
    sideEffects: 'Drowsiness, nausea, dizziness.',
    dosageGuidelines: '1 capsule as prescribed. Do not exceed authorized limit.',
    batches: [
      {
        batchNumber: 'SPP-25A03',
        expiryDate: '2027-05-31',
        manufacturingDate: '2025-01-01',
        stock: 45,
        costPrice: 110.00,
        sellingPrice: 155.00,
        mrp: 168.00,
        location: 'Locked Safe H1'
      }
    ]
  },
  {
    id: 'med-wock-02',
    name: 'Zedex Cough Syrup (100ml)',
    genericName: 'Bromhexine HCl + Dextromethorphan HBr + Chlorpheniramine',
    strength: '4mg + 10mg + 2mg / 5ml',
    form: 'Syrup',
    manufacturer: 'Wockhardt Ltd',
    category: 'Respiratory / Cough Expectorant',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '1 Bottle (100ml)',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack WK-02',
    description: 'Triple active syrup dissolving tough bronchial secretions and soothing cough spasms.',
    sideEffects: 'Mild drowsiness.',
    dosageGuidelines: '5-10ml 3 times daily.',
    batches: [
      {
        batchNumber: 'ZDX-25C15',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-03-01',
        stock: 65,
        costPrice: 72.00,
        sellingPrice: 104.00,
        mrp: 114.00,
        location: 'Rack WK-02'
      }
    ]
  },
  {
    id: 'med-wock-03',
    name: 'Wockadine 10% Solution (100ml)',
    genericName: 'Povidone Iodine (10% w/v Antiseptic)',
    strength: '10% w/v',
    form: 'Syrup',
    manufacturer: 'Wockhardt Ltd',
    category: 'Topical Antiseptic & Disinfectant',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    pack: '1 Bottle (100ml)',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack WK-03',
    description: 'Microbicidal antiseptic solution for wound dressing, burn care and preoperative skin prep.',
    sideEffects: 'Rare iodine sensitivity.',
    dosageGuidelines: 'Apply full strength directly to wound using sterile cotton.',
    batches: [
      {
        batchNumber: 'WKD-25B08',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-02-01',
        stock: 50,
        costPrice: 85.00,
        sellingPrice: 120.00,
        mrp: 132.00,
        location: 'Rack WK-03'
      }
    ]
  },
  {
    id: 'med-wock-04',
    name: 'Methycobal 500mcg',
    genericName: 'Mecobalamin / Methylcobalamin',
    strength: '500 mcg',
    form: 'Tablet',
    manufacturer: 'Wockhardt Ltd',
    category: 'Neurological & Vitamin B12',
    prescriptionRequired: false,
    hsnCode: '300450',
    taxRate: 12,
    minStockAlert: 30,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack WK-04',
    description: 'Pure co-enzyme active Vitamin B12 promoting nerve sheath synthesis and RBC maturation.',
    sideEffects: 'None.',
    dosageGuidelines: '1 tablet 3 times daily or 1 tablet daily post meals.',
    batches: [
      {
        batchNumber: 'MCB-25A19',
        expiryDate: '2027-12-31',
        manufacturingDate: '2025-01-01',
        stock: 80,
        costPrice: 98.00,
        sellingPrice: 145.00,
        mrp: 158.00,
        location: 'Rack WK-04'
      }
    ]
  },

  // ==========================================
  // 14. NESTLE (Nestlé Health Science / Nutrition)
  // ==========================================
  {
    id: 'med-nst-01',
    name: 'Nestlé Resource High Protein (400g)',
    genericName: 'Whey Protein Concentrate + 28 Essential Vitamins & Minerals',
    strength: '45g Protein / 100g',
    form: 'Powder',
    manufacturer: 'Nestlé Health Science',
    category: 'Nutritional Supplement & Protein Powder',
    prescriptionRequired: false,
    hsnCode: '210690',
    taxRate: 18,
    minStockAlert: 15,
    pack: '1 Tin (400g)',
    packSize: 1,
    looseUnitName: 'Tin',
    rackLocation: 'Rack NS-01',
    description: 'High biological value whey protein for post-surgical recovery and muscle wasting.',
    sideEffects: 'None known.',
    dosageGuidelines: 'Mix 2 scoops in 200ml lukewarm milk or water twice daily.',
    batches: [
      {
        batchNumber: 'NRH-25C02',
        expiryDate: '2027-03-31',
        manufacturingDate: '2025-03-01',
        stock: 35,
        costPrice: 620.00,
        sellingPrice: 840.00,
        mrp: 895.00,
        location: 'Rack NS-01'
      }
    ]
  },
  {
    id: 'med-nst-02',
    name: 'Nestlé Nan Pro 1 Infant Formula (400g)',
    genericName: 'Infant Milk Formula with Optipro, DHA, ARA & Probiotics (B. lactis)',
    strength: 'Stage 1 (0 to 6 Months)',
    form: 'Powder',
    manufacturer: 'Nestlé Nutrition',
    category: 'Infant Care & Nutrition (Stage 1)',
    prescriptionRequired: false,
    hsnCode: '190110',
    taxRate: 18,
    minStockAlert: 20,
    pack: '1 Tin (400g)',
    packSize: 1,
    looseUnitName: 'Tin',
    rackLocation: 'Rack NS-02',
    description: 'Spray dried infant formula containing essential long-chain fatty acids for infants from birth.',
    sideEffects: 'Prepare strictly according to feeding instructions.',
    dosageGuidelines: 'Feed as directed by pediatrician based on infant weight.',
    batches: [
      {
        batchNumber: 'NNP-25B10',
        expiryDate: '2026-10-31',
        manufacturingDate: '2025-02-01',
        stock: 50,
        costPrice: 540.00,
        sellingPrice: 720.00,
        mrp: 765.00,
        location: 'Rack NS-02'
      }
    ]
  },
  {
    id: 'med-nst-03',
    name: 'Nestlé Nan Pro 2 Follow-Up Formula (400g)',
    genericName: 'Follow-Up Formula with DHA, ARA & Iron (6 to 12 Months)',
    strength: 'Stage 2 (6 to 12 Months)',
    form: 'Powder',
    manufacturer: 'Nestlé Nutrition',
    category: 'Infant Care & Nutrition (Stage 2)',
    prescriptionRequired: false,
    hsnCode: '190110',
    taxRate: 18,
    minStockAlert: 20,
    pack: '1 Tin (400g)',
    packSize: 1,
    looseUnitName: 'Tin',
    rackLocation: 'Rack NS-03',
    description: 'Follow-up formula enriched with iron, zinc and probiotics supporting weaning stage infants.',
    sideEffects: 'None.',
    dosageGuidelines: 'Prepare using boiled lukewarm water.',
    batches: [
      {
        batchNumber: 'NN2-25C14',
        expiryDate: '2026-11-30',
        manufacturingDate: '2025-03-01',
        stock: 45,
        costPrice: 530.00,
        sellingPrice: 710.00,
        mrp: 755.00,
        location: 'Rack NS-03'
      }
    ]
  },
  {
    id: 'med-nst-04',
    name: 'Nestlé Cerelac Wheat Apple (300g)',
    genericName: 'Fortified Baby Cereal with Milk, Iron, Zinc & Vitamin C',
    strength: 'From 6 Months',
    form: 'Powder',
    manufacturer: 'Nestlé Nutrition',
    category: 'Baby Food & Complementary Nutrition',
    prescriptionRequired: false,
    hsnCode: '190110',
    taxRate: 18,
    minStockAlert: 25,
    pack: '1 Box (300g)',
    packSize: 1,
    looseUnitName: 'Box',
    rackLocation: 'Rack NS-04',
    description: 'Nutritious complementary food for babies from 6 months with real fruit and milk.',
    sideEffects: 'None.',
    dosageGuidelines: 'Mix 3-4 level scoops in boiled water as spoon feeding.',
    batches: [
      {
        batchNumber: 'CRL-25A20',
        expiryDate: '2026-09-30',
        manufacturingDate: '2025-01-01',
        stock: 60,
        costPrice: 215.00,
        sellingPrice: 285.00,
        mrp: 300.00,
        location: 'Rack NS-04'
      }
    ]
  },
  {
    id: 'med-nst-05',
    name: 'Nestlé Resource Dialysis (400g)',
    genericName: 'Specialized High Protein & Low Electrolyte Renal Enteral Nutrition',
    strength: 'Renal Nutrition Formula',
    form: 'Powder',
    manufacturer: 'Nestlé Health Science',
    category: 'Clinical Nutrition / Renal Care',
    prescriptionRequired: true,
    hsnCode: '210690',
    taxRate: 18,
    minStockAlert: 10,
    pack: '1 Tin (400g)',
    packSize: 1,
    looseUnitName: 'Tin',
    rackLocation: 'Rack NS-05',
    description: 'Calorie-dense, low potassium and sodium enteral powder for patients on maintenance dialysis.',
    sideEffects: 'Strict dietary monitoring recommended.',
    dosageGuidelines: 'As advised by nephrologist or clinical dietitian.',
    batches: [
      {
        batchNumber: 'NRD-25B01',
        expiryDate: '2027-02-28',
        manufacturingDate: '2025-02-01',
        stock: 25,
        costPrice: 920.00,
        sellingPrice: 1250.00,
        mrp: 1350.00,
        location: 'Rack NS-05'
      }
    ]
  },

  // ==========================================
  // 15. P&G / GENERALS (Procter & Gamble Health / P&G Healthcare / Generals OTC)
  // ==========================================
  {
    id: 'med-png-01',
    name: 'Neurobion Forte Tablet',
    genericName: 'Vitamin B-Complex (B1 + B2 + B3 + B5 + B6 + B12)',
    strength: 'B1 10mg + B2 10mg + B3 45mg + B5 50mg + B6 3mg + B12 15mcg',
    form: 'Tablet',
    manufacturer: 'Procter & Gamble Health (P&G)',
    category: 'Nutritional & Vitamin Supplement',
    prescriptionRequired: false,
    hsnCode: '300450',
    taxRate: 12,
    minStockAlert: 50,
    pack: '30 Tablets',
    packSize: 30,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack PG-01',
    description: 'India\'s #1 recommended vitamin B formulation for nerve damage, numbness and immune vitality.',
    sideEffects: 'Harmless yellow discoloration of urine.',
    dosageGuidelines: '1 tablet daily after lunch.',
    batches: [
      {
        batchNumber: 'NBF-25B12',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-02-01',
        stock: 200,
        costPrice: 28.00,
        sellingPrice: 40.00,
        mrp: 44.50,
        location: 'Rack PG-01'
      }
    ]
  },
  {
    id: 'med-png-02',
    name: 'Evion 400 Capsule',
    genericName: 'Vitamin E (Tocopheryl Acetate)',
    strength: '400 mg',
    form: 'Capsule',
    manufacturer: 'Procter & Gamble Health (P&G)',
    category: 'Nutritional & Antioxidant',
    prescriptionRequired: false,
    hsnCode: '300450',
    taxRate: 12,
    minStockAlert: 45,
    pack: '10 Capsules',
    packSize: 10,
    looseUnitName: 'Capsule',
    rackLocation: 'Rack PG-02',
    description: 'Fat-soluble antioxidant protecting cellular membranes, skin health and hair integrity.',
    sideEffects: 'Extremely well tolerated.',
    dosageGuidelines: '1 capsule daily after a fat-containing meal.',
    batches: [
      {
        batchNumber: 'EVN-25A18',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-01-01',
        stock: 170,
        costPrice: 24.00,
        sellingPrice: 35.00,
        mrp: 38.50,
        location: 'Rack PG-02'
      }
    ]
  },
  {
    id: 'med-png-03',
    name: 'Vicks VapoRub Balm (50g)',
    genericName: 'Menthol + Camphor + Eucalyptus Oil Vaporizing Ointment',
    strength: '2.82% + 5.26% + 1.33%',
    form: 'Ointment',
    manufacturer: 'Procter & Gamble (P&G Healthcare)',
    category: 'OTC Cold & Congestion Relief',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '1 Tub (50g)',
    packSize: 1,
    looseUnitName: 'Tub',
    rackLocation: 'Rack PG-03',
    description: 'Multi-symptom topical cold vaporizing ointment for chest and throat cold relief.',
    sideEffects: 'Mild temporary skin warming.',
    dosageGuidelines: 'Rub gently on chest, neck and back. Can also be used for steam inhalation.',
    batches: [
      {
        batchNumber: 'VVR-25C05',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-03-01',
        stock: 85,
        costPrice: 110.00,
        sellingPrice: 155.00,
        mrp: 165.00,
        location: 'Rack PG-03'
      }
    ]
  },
  {
    id: 'med-png-04',
    name: 'Vicks Inhaler (0.5ml)',
    genericName: 'Menthol + Camphor + Wintergreen Oil Inhalation Rod',
    strength: 'Standard Inhalation Pocket Stick',
    form: 'Device',
    manufacturer: 'Procter & Gamble (P&G Healthcare)',
    category: 'OTC Nasal Decongestant',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 35,
    pack: '1 Inhaler Keyring',
    packSize: 1,
    looseUnitName: 'Piece',
    rackLocation: 'Rack PG-04',
    description: 'Pocket-sized nasal inhalation stick opening blocked nostrils within seconds.',
    sideEffects: 'None.',
    dosageGuidelines: 'Inhale vapors deeply through each nostril as needed.',
    batches: [
      {
        batchNumber: 'VIN-25B02',
        expiryDate: '2028-01-31',
        manufacturingDate: '2025-02-01',
        stock: 110,
        costPrice: 46.00,
        sellingPrice: 65.00,
        mrp: 70.00,
        location: 'Rack PG-04'
      }
    ]
  },
  {
    id: 'med-png-05',
    name: 'Vicks Action 500 Extra',
    genericName: 'Paracetamol + Phenylephrine HCl + Caffeine',
    strength: '500mg + 10mg + 30mg',
    form: 'Tablet',
    manufacturer: 'Procter & Gamble (P&G Healthcare)',
    category: 'OTC Cold, Headache & Flu Relief',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 40,
    pack: '10 Tablets',
    packSize: 10,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack PG-05',
    description: 'Fast acting cold relief tablet tackling headache, blocked nose, body pain, and fever.',
    sideEffects: 'Mild jitteriness from caffeine in sensitive persons.',
    dosageGuidelines: '1 tablet 3 times daily with water.',
    batches: [
      {
        batchNumber: 'VA5-25D09',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-04-01',
        stock: 140,
        costPrice: 38.00,
        sellingPrice: 54.00,
        mrp: 58.00,
        location: 'Rack PG-05'
      }
    ]
  },
  {
    id: 'med-png-06',
    name: 'Seven Seas Original Cod Liver Oil (100 Capsules)',
    genericName: 'Pure Ocean Cod Liver Oil with Omega-3 Fatty Acids + Vitamin A & D',
    strength: '300 mg',
    form: 'Capsule',
    manufacturer: 'Procter & Gamble Health (P&G)',
    category: 'Nutritional & Omega-3 Supplement',
    prescriptionRequired: false,
    hsnCode: '150410',
    taxRate: 12,
    minStockAlert: 20,
    pack: '1 Bottle (100 Capsules)',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack PG-06',
    description: 'Natural source of pure Omega-3 fatty acids EPA & DHA with essential vitamins for heart, brain and vision.',
    sideEffects: 'Fishy burps in some individuals.',
    dosageGuidelines: '1-2 capsules daily with water after meals.',
    batches: [
      {
        batchNumber: 'SSC-25A11',
        expiryDate: '2027-07-31',
        manufacturingDate: '2025-01-01',
        stock: 55,
        costPrice: 240.00,
        sellingPrice: 330.00,
        mrp: 360.00,
        location: 'Rack PG-06'
      }
    ]
  },
  {
    id: 'med-png-07',
    name: 'Iliadin Adult Decongestant Spray (10ml)',
    genericName: 'Oxymetazoline HCl',
    strength: '0.05% w/v',
    form: 'Drops',
    manufacturer: 'Procter & Gamble Health (P&G)',
    category: 'ENT / Topical Nasal Decongestant',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '1 Bottle (10ml)',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack PG-07',
    description: 'Direct acting vasoconstrictor spray relieving nasal congestion for up to 12 hours.',
    sideEffects: 'Mild local stinging. Limit use to 5 consecutive days.',
    dosageGuidelines: '1-2 sprays into each nostril 2 times daily.',
    batches: [
      {
        batchNumber: 'ILD-25C08',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-03-01',
        stock: 60,
        costPrice: 75.00,
        sellingPrice: 105.00,
        mrp: 115.00,
        location: 'Rack PG-07'
      }
    ]
  }
];
