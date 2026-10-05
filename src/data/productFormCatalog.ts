import { Medicine } from '../types';

export const PRODUCT_FORM_CATALOG_ITEMS: Medicine[] = [
  // ==========================================
  // 1. SYRUP
  // ==========================================
  {
    id: 'med-form-syrup-01',
    name: 'Benadryl Cough Formula Syrup 100ml',
    genericName: 'Diphenhydramine + Ammonium Chloride + Sodium Citrate',
    strength: '14.08mg + 138mg + 57.03mg / 5ml',
    form: 'Syrup',
    manufacturer: 'Johnson & Johnson Ltd',
    category: 'Cough & Cold',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    pack: '100 ml Bottle',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack S-01 (Syrups)',
    description: 'Triple-action soothing cough syrup for dry cough, throat tickle, and chest congestion.',
    dosageGuidelines: '5-10 ml every 4-6 hours after meals.',
    batches: [
      {
        batchNumber: 'BND-25C01',
        expiryDate: '2027-08-15',
        manufacturingDate: '2025-08-01',
        stock: 45,
        costPrice: 88.00,
        sellingPrice: 129.00,
        mrp: 135.00,
        location: 'Rack S-01'
      }
    ]
  },
  {
    id: 'med-form-syrup-02',
    name: 'Ascoril-D Plus Cough Syrup 100ml',
    genericName: 'Dextromethorphan + Phenylephrine + Chlorpheniramine',
    strength: '10mg + 5mg + 2mg / 5ml',
    form: 'Syrup',
    manufacturer: 'Glenmark Pharmaceuticals',
    category: 'Respiratory / Antitussive',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '100 ml Bottle',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack S-02 (Syrups)',
    description: 'Non-narcotic cough suppressant and nasal decongestant syrup.',
    dosageGuidelines: '5 ml thrice daily as prescribed.',
    batches: [
      {
        batchNumber: 'ASC-24K12',
        expiryDate: '2027-04-30',
        manufacturingDate: '2025-04-10',
        stock: 36,
        costPrice: 84.00,
        sellingPrice: 122.00,
        mrp: 128.00,
        location: 'Rack S-02'
      }
    ]
  },
  {
    id: 'med-form-syrup-03',
    name: 'Zincovit Multivitamin Syrup 200ml',
    genericName: 'Multivitamins + Multiminerals + Zinc Syrup',
    strength: 'Syrup 200ml',
    form: 'Syrup',
    manufacturer: 'Apex Laboratories Pvt Ltd',
    category: 'Nutritional / Immunity',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '200 ml Bottle',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Rack S-03 (Nutra)',
    description: 'Immunity booster pediatric & adult tonic with zinc and essential micronutrients.',
    dosageGuidelines: '5 ml once daily after food.',
    batches: [
      {
        batchNumber: 'ZNC-25E08',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-05-15',
        stock: 58,
        costPrice: 110.00,
        sellingPrice: 165.00,
        mrp: 175.00,
        location: 'Rack S-03'
      }
    ]
  },

  // ==========================================
  // 2. TABLET
  // ==========================================
  {
    id: 'med-form-tab-01',
    name: 'Dolo 650 Tablet',
    genericName: 'Paracetamol / Acetaminophen',
    strength: '650 mg',
    form: 'Tablet',
    manufacturer: 'Micro Labs Ltd',
    category: 'Analgesic & Antipyretic',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 50,
    pack: '15 Tablets Strip',
    packSize: 15,
    looseUnitName: 'Tablet',
    rackLocation: 'Rack T-01 (Oral Solids)',
    description: 'Standard analgesic and antipyretic for high fever, body pain, and headache.',
    dosageGuidelines: '1 tablet every 6-8 hours as needed. Maximum 4g daily.',
    batches: [
      {
        batchNumber: 'DL-25M01',
        expiryDate: '2028-02-28',
        manufacturingDate: '2025-02-15',
        stock: 180,
        costPrice: 21.00,
        sellingPrice: 31.00,
        mrp: 33.60,
        location: 'Rack T-01'
      }
    ]
  },

  // ==========================================
  // 3. OINTMENT
  // ==========================================
  {
    id: 'med-form-oint-01',
    name: 'Betnovate-N Skin Ointment 20g',
    genericName: 'Betamethasone Valerate + Neomycin Sulphate',
    strength: '0.1% w/w + 0.5% w/w',
    form: 'Ointment',
    manufacturer: 'GlaxoSmithKline (GSK)',
    category: 'Dermatology / Topical',
    prescriptionRequired: true,
    hsnCode: '300432',
    taxRate: 12,
    minStockAlert: 20,
    pack: '20g Tube',
    packSize: 1,
    looseUnitName: 'Tube',
    rackLocation: 'Rack O-01 (Ointments)',
    description: 'Corticosteroid and aminoglycoside antibiotic topical ointment for inflammatory dermatoses.',
    dosageGuidelines: 'Apply thinly to affected area 2 to 3 times daily.',
    batches: [
      {
        batchNumber: 'BTN-25G14',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-09-01',
        stock: 42,
        costPrice: 42.00,
        sellingPrice: 62.00,
        mrp: 66.50,
        location: 'Rack O-01'
      }
    ]
  },
  {
    id: 'med-form-oint-02',
    name: 'Soframycin Skin Ointment 30g',
    genericName: 'Framycetin Sulphate 1% w/w',
    strength: '1% w/w (30g)',
    form: 'Ointment',
    manufacturer: 'Sanofi India Ltd',
    category: 'Dermatology / Antibacterial',
    prescriptionRequired: false,
    hsnCode: '300420',
    taxRate: 12,
    minStockAlert: 25,
    pack: '30g Tube',
    packSize: 1,
    looseUnitName: 'Tube',
    rackLocation: 'Rack O-02 (Ointments)',
    description: 'Topical antibacterial for minor cuts, wounds, burns, and impetigo skin infections.',
    dosageGuidelines: 'Apply gently over cleaned wound once or twice daily.',
    batches: [
      {
        batchNumber: 'SFM-24J09',
        expiryDate: '2027-06-30',
        manufacturingDate: '2025-06-01',
        stock: 35,
        costPrice: 52.00,
        sellingPrice: 76.00,
        mrp: 81.20,
        location: 'Rack O-02'
      }
    ]
  },
  {
    id: 'med-form-oint-03',
    name: 'Silverex Ionic Antimicrobial Ointment 20g',
    genericName: 'Silver Nitrate + Chlorhexidine Gluconate',
    strength: '0.2% w/w + 0.2% w/w',
    form: 'Ointment',
    manufacturer: 'Sun Pharma',
    category: 'Burn Care & Wound Healing',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 15,
    pack: '20g Tube',
    packSize: 1,
    looseUnitName: 'Tube',
    rackLocation: 'Rack O-03 (Burn Care)',
    description: 'Ionic silver antimicrobial burn wound dressing ointment preventing secondary bacterial sepsis.',
    dosageGuidelines: 'Apply sterile layer over superficial burns and minor scalds.',
    batches: [
      {
        batchNumber: 'SLV-25A11',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-10-01',
        stock: 22,
        costPrice: 85.00,
        sellingPrice: 124.00,
        mrp: 132.00,
        location: 'Rack O-03'
      }
    ]
  },

  // ==========================================
  // 4. SURGICAL
  // ==========================================
  {
    id: 'med-form-surg-01',
    name: 'Dettol Antiseptic Liquid 250ml',
    genericName: 'Chloroxylenol (4.8% w/v)',
    strength: '4.8% w/v (250ml)',
    form: 'Surgical',
    manufacturer: 'Reckitt Benckiser',
    category: 'Surgical & Antiseptic',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 18,
    minStockAlert: 20,
    pack: '250 ml Bottle',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Surgical Section S-1',
    description: 'Hospital grade antiseptic liquid disinfectant for wound cleansing, surgical prep, and first aid.',
    dosageGuidelines: 'Dilute 1:20 with clean water for wound washing.',
    batches: [
      {
        batchNumber: 'DTL-25D02',
        expiryDate: '2028-04-30',
        manufacturingDate: '2025-04-01',
        stock: 48,
        costPrice: 118.00,
        sellingPrice: 168.00,
        mrp: 175.00,
        location: 'Surgical S-1'
      }
    ]
  },
  {
    id: 'med-form-surg-02',
    name: 'Sterile Cotton Gauze Swabs 10cm x 10cm',
    genericName: '100% Bleached Absorbent Cotton Gauze (12 Ply)',
    strength: '10cm x 10cm (Pack of 100)',
    form: 'Surgical',
    manufacturer: 'Dyna Surgical Supplies',
    category: 'Surgical Consumables',
    prescriptionRequired: false,
    hsnCode: '300590',
    taxRate: 12,
    minStockAlert: 15,
    pack: 'Box of 100 Pcs',
    packSize: 100,
    looseUnitName: 'Swab',
    rackLocation: 'Surgical Section S-2',
    description: 'Sterile EO-treated absorbent cotton gauze swabs for clinic dressings, wound padding, and blood absorption.',
    dosageGuidelines: 'Single patient sterile use only.',
    batches: [
      {
        batchNumber: 'GZ-25H05',
        expiryDate: '2030-08-31',
        manufacturingDate: '2025-08-01',
        stock: 32,
        costPrice: 140.00,
        sellingPrice: 220.00,
        mrp: 240.00,
        location: 'Surgical S-2'
      }
    ]
  },
  {
    id: 'med-form-surg-03',
    name: 'Hansaplast Adhesive Plaster Bandages 100s',
    genericName: 'Medicated Dressing with Antiseptic Pad',
    strength: 'Standard Strips (Box of 100)',
    form: 'Surgical',
    manufacturer: 'Beiersdorf India Ltd',
    category: 'Surgical First Aid',
    prescriptionRequired: false,
    hsnCode: '300510',
    taxRate: 12,
    minStockAlert: 20,
    pack: 'Box of 100 Strips',
    packSize: 100,
    looseUnitName: 'Bandage',
    rackLocation: 'Front Display Counter & S-3',
    description: 'Breathable waterproof wound plaster with antiseptic pad for fast skin cut healing.',
    dosageGuidelines: 'Apply over dry, clean minor skin cut.',
    batches: [
      {
        batchNumber: 'HNS-25K01',
        expiryDate: '2028-11-30',
        manufacturingDate: '2025-11-01',
        stock: 65,
        costPrice: 145.00,
        sellingPrice: 215.00,
        mrp: 230.00,
        location: 'Front Counter'
      }
    ]
  },
  {
    id: 'med-form-surg-04',
    name: 'Disposable Latex Surgical Gloves 7.5 (Box of 50)',
    genericName: 'Pre-powdered Sterile Surgical Gloves',
    strength: 'Size 7.5 (50 Pairs)',
    form: 'Surgical',
    manufacturer: 'Sutures India / Healthium',
    category: 'Surgical Infection Control',
    prescriptionRequired: false,
    hsnCode: '401511',
    taxRate: 12,
    minStockAlert: 10,
    pack: 'Box of 50 Pairs',
    packSize: 50,
    looseUnitName: 'Pair',
    rackLocation: 'Surgical Store Room B-1',
    description: 'High tensile strength textured anatomical latex surgical gloves for operating room and clinical inspection.',
    dosageGuidelines: 'Single procedure use.',
    batches: [
      {
        batchNumber: 'GLV-25F19',
        expiryDate: '2029-06-30',
        manufacturingDate: '2025-06-01',
        stock: 24,
        costPrice: 480.00,
        sellingPrice: 690.00,
        mrp: 750.00,
        location: 'Surgical B-1'
      }
    ]
  },
  {
    id: 'med-form-surg-05',
    name: 'Crepe Bandage B.P. 10cm x 4m',
    genericName: 'Elastic Cotton Crepe Compression Bandage',
    strength: '10cm x 4m',
    form: 'Surgical',
    manufacturer: 'Dyna Surgicals',
    category: 'Surgical Ortho Dressing',
    prescriptionRequired: false,
    hsnCode: '300590',
    taxRate: 12,
    minStockAlert: 25,
    pack: '1 Roll with Fasteners',
    packSize: 1,
    looseUnitName: 'Roll',
    rackLocation: 'Surgical Section S-4',
    description: 'Non-fraying woven cotton flesh-colored crepe bandage for joint sprain support and varicose vein pressure.',
    dosageGuidelines: 'Wrap firmly without cutting off peripheral circulation.',
    batches: [
      {
        batchNumber: 'CRP-25B10',
        expiryDate: '2030-02-28',
        manufacturingDate: '2025-02-01',
        stock: 52,
        costPrice: 68.00,
        sellingPrice: 110.00,
        mrp: 120.00,
        location: 'Surgical S-4'
      }
    ]
  },

  // ==========================================
  // 5. CAPSULE
  // ==========================================
  {
    id: 'med-form-cap-01',
    name: 'Becosules Performance Capsule',
    genericName: 'B-Complex Vitamins + Vitamin C + Zinc',
    strength: 'Multivitamin Complex (30 Caps)',
    form: 'Capsule',
    manufacturer: 'Pfizer India Ltd',
    category: 'Nutritional / Multivitamin',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 40,
    pack: '30 Capsules Strip',
    packSize: 30,
    looseUnitName: 'Capsule',
    rackLocation: 'Rack C-01 (Vitamins)',
    description: 'Essential Vitamin B complex with zinc for energy, mouth ulcers, hair health, and active vitality.',
    dosageGuidelines: '1 capsule daily after breakfast.',
    batches: [
      {
        batchNumber: 'BCS-25H03',
        expiryDate: '2027-12-31',
        manufacturingDate: '2025-06-01',
        stock: 90,
        costPrice: 42.00,
        sellingPrice: 62.00,
        mrp: 67.50,
        location: 'Rack C-01'
      }
    ]
  },
  {
    id: 'med-form-cap-02',
    name: 'Omez 20mg Capsule',
    genericName: 'Omeprazole',
    strength: '20 mg',
    form: 'Capsule',
    manufacturer: 'Dr. Reddy\'s Laboratories',
    category: 'Gastrointestinal / PPI',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 35,
    pack: '15 Capsules Strip',
    packSize: 15,
    looseUnitName: 'Capsule',
    rackLocation: 'Rack C-02 (GI Antacid)',
    description: 'Proton pump inhibitor reducing stomach acid secretion for heartburn and peptic ulcers.',
    dosageGuidelines: '1 capsule morning empty stomach with water.',
    batches: [
      {
        batchNumber: 'OMZ-25D18',
        expiryDate: '2027-07-31',
        manufacturingDate: '2025-07-01',
        stock: 75,
        costPrice: 48.00,
        sellingPrice: 72.00,
        mrp: 78.50,
        location: 'Rack C-02'
      }
    ]
  },
  {
    id: 'med-form-cap-03',
    name: 'Evion 400mg Vitamin E Capsule',
    genericName: 'Tocopheryl Acetate (Vitamin E)',
    strength: '400 mg',
    form: 'Capsule',
    manufacturer: 'Procter & Gamble Health',
    category: 'Vitamins & Antioxidants',
    prescriptionRequired: false,
    hsnCode: '300450',
    taxRate: 12,
    minStockAlert: 30,
    pack: '10 Capsules Strip',
    packSize: 10,
    looseUnitName: 'Capsule',
    rackLocation: 'Rack C-03 (Nutra)',
    description: 'Fat-soluble antioxidant protecting cells from oxidative stress and nourishing skin & hair.',
    dosageGuidelines: '1 capsule daily after a full meal.',
    batches: [
      {
        batchNumber: 'EVN-25J04',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-10-01',
        stock: 85,
        costPrice: 32.00,
        sellingPrice: 48.00,
        mrp: 52.00,
        location: 'Rack C-03'
      }
    ]
  },

  // ==========================================
  // 6. SOAP
  // ==========================================
  {
    id: 'med-form-soap-01',
    name: 'Sebamed Cleansing Bar pH 5.5 (100g)',
    genericName: 'Soap-Free Syndet Dermatological Bar',
    strength: '100g Bar (pH 5.5)',
    form: 'Soap',
    manufacturer: 'Sebapharma GmbH & Co.',
    category: 'Dermatological Skincare',
    prescriptionRequired: false,
    hsnCode: '340111',
    taxRate: 18,
    minStockAlert: 15,
    pack: '100g Box',
    packSize: 1,
    looseUnitName: 'Bar',
    rackLocation: 'Dermo Aisle Shelf 1',
    description: 'Soap-free and alkali-free cleansing bar maintaining natural protective acid mantle at pH 5.5 for sensitive and acne-prone skin.',
    dosageGuidelines: 'Lather gently with warm water, rinse thoroughly.',
    batches: [
      {
        batchNumber: 'SBM-25A08',
        expiryDate: '2028-03-31',
        manufacturingDate: '2025-03-01',
        stock: 28,
        costPrice: 165.00,
        sellingPrice: 245.00,
        mrp: 260.00,
        location: 'Dermo Shelf 1'
      }
    ]
  },
  {
    id: 'med-form-soap-02',
    name: 'Tedibar Baby Cleansing Bar 75g',
    genericName: 'Gentle Soap-Free Syndet Bar for Newborns',
    strength: '75g Bar (pH 5.5)',
    form: 'Soap',
    manufacturer: 'Curatio Healthcare / Torrent',
    category: 'Pediatric & Baby Care',
    prescriptionRequired: false,
    hsnCode: '340111',
    taxRate: 18,
    minStockAlert: 20,
    pack: '75g Box with Soap Tray',
    packSize: 1,
    looseUnitName: 'Bar',
    rackLocation: 'Baby Care Aisle B-1',
    description: '#1 Pediatrician recommended baby bath bar; prevents diaper irritation, dryness, and preserves infant skin lipid barrier.',
    dosageGuidelines: 'Use during daily baby bath.',
    batches: [
      {
        batchNumber: 'TDB-25F14',
        expiryDate: '2027-12-31',
        manufacturingDate: '2025-06-01',
        stock: 34,
        costPrice: 125.00,
        sellingPrice: 185.00,
        mrp: 195.00,
        location: 'Baby Care B-1'
      }
    ]
  },
  {
    id: 'med-form-soap-03',
    name: 'Medimix 18 Herbs Ayurvedic Bath Soap 125g',
    genericName: '18 Herbs Ayurvedic Skin Purifying Soap',
    strength: '125g Bar',
    form: 'Soap',
    manufacturer: 'Cholayil Pvt Ltd',
    category: 'Ayurvedic & Herbal',
    prescriptionRequired: false,
    hsnCode: '340111',
    taxRate: 18,
    minStockAlert: 30,
    pack: '125g Bar',
    packSize: 1,
    looseUnitName: 'Bar',
    rackLocation: 'Herbal Shelf H-1',
    description: 'Time-tested Ayurvedic medicated formulation with 18 botanical extracts protecting against boils, prickly heat, and odor.',
    dosageGuidelines: 'Daily bathing bar.',
    batches: [
      {
        batchNumber: 'MDM-25G22',
        expiryDate: '2028-06-30',
        manufacturingDate: '2025-06-01',
        stock: 55,
        costPrice: 38.00,
        sellingPrice: 55.00,
        mrp: 58.00,
        location: 'Herbal Shelf H-1'
      }
    ]
  },

  // ==========================================
  // 7. SHAMPOO
  // ==========================================
  {
    id: 'med-form-shamp-01',
    name: 'Scalpe Plus Anti-Dandruff Shampoo 100ml',
    genericName: 'Ketoconazole 2% + Zinc Pyrithione (ZPTO) 1%',
    strength: '2% + 1% w/v (100ml)',
    form: 'Shampoo',
    manufacturer: 'Glenmark Pharmaceuticals',
    category: 'Dermatology / Hair & Scalp',
    prescriptionRequired: false,
    hsnCode: '330510',
    taxRate: 18,
    minStockAlert: 20,
    pack: '100 ml Bottle',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Hair Care Rack H-2',
    description: 'Therapeutic anti-fungal dual active shampoo targeting Malassezia yeast, itching, flaking, and severe dandruff.',
    dosageGuidelines: 'Massage on wet scalp, leave for 3-5 minutes, rinse thoroughly. Use twice weekly.',
    batches: [
      {
        batchNumber: 'SCP-25D11',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-04-01',
        stock: 38,
        costPrice: 195.00,
        sellingPrice: 285.00,
        mrp: 305.00,
        location: 'Hair Care H-2'
      }
    ]
  },
  {
    id: 'med-form-shamp-02',
    name: 'Nizral 2% Ketoconazole Shampoo 50ml',
    genericName: 'Ketoconazole 2% w/v',
    strength: '2% w/v (50ml)',
    form: 'Shampoo',
    manufacturer: 'Johnson & Johnson Ltd',
    category: 'Antifungal Scalp Treatment',
    prescriptionRequired: true,
    hsnCode: '330510',
    taxRate: 18,
    minStockAlert: 15,
    pack: '50 ml Bottle',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Hair Care Rack H-2',
    description: 'Clinically proven antifungal shampoo treating seborrheic dermatitis and stubborn dandruff scaling.',
    dosageGuidelines: 'Apply to wet hair, lather for 3 mins, rinse. Use 2 times weekly for 4 weeks.',
    batches: [
      {
        batchNumber: 'NZR-25B03',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-02-01',
        stock: 26,
        costPrice: 180.00,
        sellingPrice: 265.00,
        mrp: 280.00,
        location: 'Hair Care H-2'
      }
    ]
  },

  // ==========================================
  // 8. MOUTH WASH
  // ==========================================
  {
    id: 'med-form-mouth-01',
    name: 'Listerine Cool Mint Antiseptic Mouthwash 250ml',
    genericName: 'Eucalyptol + Menthol + Methyl Salicylate + Thymol',
    strength: 'Multi-Essential Oils Rinse (250ml)',
    form: 'Mouth Wash',
    manufacturer: 'Johnson & Johnson Ltd',
    category: 'Oral Hygiene & Dental',
    prescriptionRequired: false,
    hsnCode: '330610',
    taxRate: 18,
    minStockAlert: 20,
    pack: '250 ml Bottle',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Dental Care D-1',
    description: 'Kills 99.9% of germs causing plaque, bad breath, and gum bleeding.',
    dosageGuidelines: 'Rinse full strength 20ml for 30 seconds morning and night.',
    batches: [
      {
        batchNumber: 'LST-25E09',
        expiryDate: '2028-05-31',
        manufacturingDate: '2025-05-01',
        stock: 42,
        costPrice: 95.00,
        sellingPrice: 145.00,
        mrp: 155.00,
        location: 'Dental Care D-1'
      }
    ]
  },
  {
    id: 'med-form-mouth-02',
    name: 'Clohex 0.2% Chlorhexidine Mouthwash 150ml',
    genericName: 'Chlorhexidine Gluconate Solution 0.2% w/v',
    strength: '0.2% w/v (150ml)',
    form: 'Mouth Wash',
    manufacturer: 'Dr. Reddy\'s Laboratories',
    category: 'Dental Antiseptic & Gingivitis',
    prescriptionRequired: false,
    hsnCode: '330610',
    taxRate: 18,
    minStockAlert: 15,
    pack: '150 ml Bottle',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Dental Care D-2',
    description: 'Therapeutic gold standard antiseptic oral rinse for post-dental surgery, gingivitis, and aphthous ulcers.',
    dosageGuidelines: 'Swish 10ml undiluted for 1 minute twice daily after brushing.',
    batches: [
      {
        batchNumber: 'CLH-25C15',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-03-01',
        stock: 31,
        costPrice: 75.00,
        sellingPrice: 115.00,
        mrp: 125.00,
        location: 'Dental Care D-2'
      }
    ]
  },
  {
    id: 'med-form-mouth-03',
    name: 'Betadine 2% Mint Gargle & Mouthwash 100ml',
    genericName: 'Povidone-Iodine 2% w/v Germicide Gargle',
    strength: '2% w/v (100ml)',
    form: 'Mouth Wash',
    manufacturer: 'Win-Medicare Pvt Ltd',
    category: 'Throat Care & Oral Antisepsis',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    pack: '100 ml Bottle with Measuring Cup',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Dental Care D-3',
    description: 'Rapid germicidal broad-spectrum gargle relieving sore throat, pharyngitis, and mouth infections.',
    dosageGuidelines: 'Dilute with equal volume of warm water and gargle for 30 seconds 3 times daily.',
    batches: [
      {
        batchNumber: 'BTD-25J01',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-11-01',
        stock: 36,
        costPrice: 110.00,
        sellingPrice: 160.00,
        mrp: 172.00,
        location: 'Dental Care D-3'
      }
    ]
  },

  // ==========================================
  // 9. GEL
  // ==========================================
  {
    id: 'med-form-gel-01',
    name: 'Volini Pain Relief Gel 30g',
    genericName: 'Diclofenac Diethylamine + Virgin Linseed Oil + Methyl Salicylate + Menthol',
    strength: '1.16% + 3% + 10% + 5% w/w',
    form: 'Gel',
    manufacturer: 'Sun Pharmaceutical Industries Ltd',
    category: 'Analgesic / Musculoskeletal',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '30g Tube',
    packSize: 1,
    looseUnitName: 'Tube',
    rackLocation: 'Pain Relief Rack P-1',
    description: 'Micro-gel fast absorption technology for rapid relief from backache, neck pain, joint stiffness, and sprains.',
    dosageGuidelines: 'Apply gently 3-4 times daily over painful joint; do not rub vigorously.',
    batches: [
      {
        batchNumber: 'VLN-25H02',
        expiryDate: '2028-02-28',
        manufacturingDate: '2025-08-01',
        stock: 62,
        costPrice: 85.00,
        sellingPrice: 128.00,
        mrp: 135.00,
        location: 'Pain Relief P-1'
      }
    ]
  },
  {
    id: 'med-form-gel-02',
    name: 'Omnigel Fast Pain Relief Gel 50g',
    genericName: 'Diclofenac + Virgin Linseed Oil + Methyl Salicylate + Menthol',
    strength: '50g Tube',
    form: 'Gel',
    manufacturer: 'Cipla Ltd',
    category: 'Analgesic / Anti-inflammatory',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '50g Tube',
    packSize: 1,
    looseUnitName: 'Tube',
    rackLocation: 'Pain Relief Rack P-2',
    description: 'Trusted anti-inflammatory topical gel deep penetrating muscle fibers for arthritis and muscular sprain relief.',
    dosageGuidelines: 'Apply locally over affected muscles 3 times a day.',
    batches: [
      {
        batchNumber: 'OMG-25F18',
        expiryDate: '2027-12-31',
        manufacturingDate: '2025-06-01',
        stock: 44,
        costPrice: 110.00,
        sellingPrice: 165.00,
        mrp: 175.00,
        location: 'Pain Relief P-2'
      }
    ]
  },
  {
    id: 'med-form-gel-03',
    name: 'Dologel CT Mouth Ulcer Gel 10g',
    genericName: 'Choline Salicylate + Lidocaine Hydrochloride',
    strength: '8.7% w/w + 2.0% w/w',
    form: 'Gel',
    manufacturer: 'Dr. Reddy\'s Laboratories',
    category: 'Oral Gel / Analgesic',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    pack: '10g Tube',
    packSize: 1,
    looseUnitName: 'Tube',
    rackLocation: 'Dental Counter D-4',
    description: 'Rapid numbing and anti-inflammatory buccal gel relieving painful aphthous mouth ulcers and denture irritation.',
    dosageGuidelines: 'Apply small pea-sized amount directly onto ulcer before meals.',
    batches: [
      {
        batchNumber: 'DLG-25C09',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-03-01',
        stock: 35,
        costPrice: 58.00,
        sellingPrice: 88.00,
        mrp: 95.00,
        location: 'Dental Counter D-4'
      }
    ]
  },

  // ==========================================
  // 10. FOOD PRODUCT
  // ==========================================
  {
    id: 'med-form-food-01',
    name: 'Ensure Diabetes Care Vanilla 400g Tin',
    genericName: 'Specialized Nutrition for Diabetes with Low GI',
    strength: '400g Powder (Vanilla)',
    form: 'Food Product',
    manufacturer: 'Abbott Healthcare Pvt Ltd',
    category: 'Clinical Nutrition & Diabetes',
    prescriptionRequired: false,
    hsnCode: '210690',
    taxRate: 18,
    minStockAlert: 15,
    pack: '400g Tin',
    packSize: 1,
    looseUnitName: 'Tin',
    rackLocation: 'Nutrition Aisle N-1',
    description: 'Scientifically designed complete balanced nutrition with high-quality protein, dual fibers, and low glycemic index helping manage blood sugar spikes.',
    dosageGuidelines: 'Mix 6 scoops in 200ml lukewarm water or skimmed milk.',
    batches: [
      {
        batchNumber: 'ENS-25K04',
        expiryDate: '2027-05-31',
        manufacturingDate: '2025-05-01',
        stock: 22,
        costPrice: 620.00,
        sellingPrice: 845.00,
        mrp: 890.00,
        location: 'Nutrition N-1'
      }
    ]
  },
  {
    id: 'med-form-food-02',
    name: 'Horlicks Health Drink Classic Malt 500g',
    genericName: 'Malted Barley & Wheat Nutritional Beverage',
    strength: '500g Refill Pack',
    form: 'Food Product',
    manufacturer: 'Hindustan Unilever Ltd (HUL)',
    category: 'Daily Family Nutrition',
    prescriptionRequired: false,
    hsnCode: '190190',
    taxRate: 18,
    minStockAlert: 20,
    pack: '500g Pack',
    packSize: 1,
    looseUnitName: 'Pack',
    rackLocation: 'Nutrition Aisle N-2',
    description: 'Clinically proven malted drink supporting immunity, bone density, and muscle strength with 23 vital nutrients.',
    dosageGuidelines: 'Add 2-3 heaped spoonfuls to hot or cold milk.',
    batches: [
      {
        batchNumber: 'HRL-25M10',
        expiryDate: '2027-03-31',
        manufacturingDate: '2025-09-01',
        stock: 35,
        costPrice: 195.00,
        sellingPrice: 265.00,
        mrp: 280.00,
        location: 'Nutrition N-2'
      }
    ]
  },
  {
    id: 'med-form-food-03',
    name: 'PediaSure Complete Nutrition Powder 400g',
    genericName: 'Balanced Child Growth Nutrition with Prebiotics & DHA',
    strength: '400g Tin (Vanilla)',
    form: 'Food Product',
    manufacturer: 'Abbott Healthcare Pvt Ltd',
    category: 'Pediatric Clinical Nutrition',
    prescriptionRequired: false,
    hsnCode: '210690',
    taxRate: 18,
    minStockAlert: 15,
    pack: '400g Tin',
    packSize: 1,
    looseUnitName: 'Tin',
    rackLocation: 'Nutrition Aisle N-3',
    description: 'Complete nutritional formula supporting visible height gain, immunity, and brain development in fussy eater children aged 2+.',
    dosageGuidelines: '5 scoops in 190ml water twice daily.',
    batches: [
      {
        batchNumber: 'PDS-25H12',
        expiryDate: '2027-06-30',
        manufacturingDate: '2025-06-01',
        stock: 18,
        costPrice: 580.00,
        sellingPrice: 775.00,
        mrp: 810.00,
        location: 'Nutrition N-3'
      }
    ]
  },

  // ==========================================
  // 11. FEEDING BOTTLE
  // ==========================================
  {
    id: 'med-form-bottle-01',
    name: 'Pigeon Peristaltic Nursing Feeding Bottle 240ml',
    genericName: 'BPA-Free Polypropylene Nursing Bottle with Silicone Nipple',
    strength: '240ml (Size M Teat)',
    form: 'Feeding Bottle',
    manufacturer: 'Pigeon Corporation',
    category: 'Baby Feeding & Nursery',
    prescriptionRequired: false,
    hsnCode: '392410',
    taxRate: 12,
    minStockAlert: 10,
    pack: 'Single Bottle Box',
    packSize: 1,
    looseUnitName: 'Piece',
    rackLocation: 'Baby Care Shelf B-3',
    description: 'Encourages natural tongue movement resembling breastfeeding with super soft anti-colic silicone peristaltic nipple.',
    dosageGuidelines: 'Sterilize in boiling water for 5 minutes before every feeding.',
    batches: [
      {
        batchNumber: 'PGN-25E01',
        expiryDate: '2030-12-31',
        manufacturingDate: '2025-05-01',
        stock: 20,
        costPrice: 220.00,
        sellingPrice: 320.00,
        mrp: 345.00,
        location: 'Baby Care B-3'
      }
    ]
  },
  {
    id: 'med-form-bottle-02',
    name: 'Chicco NaturalFeeling Glass Feeding Bottle 150ml',
    genericName: 'Thermal Shock Resistant Borosilicate Glass Bottle',
    strength: '150ml (0m+ Inclined Teat)',
    form: 'Feeding Bottle',
    manufacturer: 'Artsana S.p.A. (Chicco)',
    category: 'Premium Baby Nursery',
    prescriptionRequired: false,
    hsnCode: '701349',
    taxRate: 18,
    minStockAlert: 8,
    pack: 'Single Glass Bottle Box',
    packSize: 1,
    looseUnitName: 'Piece',
    rackLocation: 'Baby Care Shelf B-3',
    description: 'Hygienic pure borosilicate glass feeding bottle with angled teat ensuring intuitive latch and anti-colic air venting.',
    dosageGuidelines: 'Wash and steam sterilize.',
    batches: [
      {
        batchNumber: 'CHC-25B15',
        expiryDate: '2032-01-01',
        manufacturingDate: '2025-02-01',
        stock: 14,
        costPrice: 510.00,
        sellingPrice: 720.00,
        mrp: 780.00,
        location: 'Baby Care B-3'
      }
    ]
  },

  // ==========================================
  // 12. MACHINE
  // ==========================================
  {
    id: 'med-form-mach-01',
    name: 'Omron HEM-7120 Digital BP Monitor',
    genericName: 'Automatic Oscillometric Upper Arm Blood Pressure Monitor',
    strength: 'Standard Arm Cuff (22-32 cm)',
    form: 'Machine',
    manufacturer: 'Omron Healthcare Co. Ltd',
    category: 'Diagnostic Medical Devices',
    prescriptionRequired: false,
    hsnCode: '901890',
    taxRate: 18,
    minStockAlert: 6,
    pack: 'Box with Device, Cuff, 4 AA Batteries & 3Y Warranty',
    packSize: 1,
    looseUnitName: 'Device',
    rackLocation: 'Medical Equipment Cabinet E-1',
    description: 'Gold standard Intellisense technology for comfortable, accurate systolic/diastolic blood pressure and pulse rate reading with hypertension indicator.',
    dosageGuidelines: 'Sit quietly for 5 minutes; measure at heart level.',
    batches: [
      {
        batchNumber: 'OMR-25J19',
        expiryDate: '2035-12-31',
        manufacturingDate: '2025-07-01',
        stock: 12,
        costPrice: 1750.00,
        sellingPrice: 2280.00,
        mrp: 2540.00,
        location: 'Equipment Cabinet E-1'
      }
    ]
  },
  {
    id: 'med-form-mach-02',
    name: 'Accu-Chek Active Blood Glucose Monitor Kit',
    genericName: 'Blood Glucose Meter with 10 Strips & Softclix Lancing Pen',
    strength: 'Starter Meter Kit',
    form: 'Machine',
    manufacturer: 'Roche Diabetes Care India',
    category: 'Home Diagnostic Equipment',
    prescriptionRequired: false,
    hsnCode: '902780',
    taxRate: 12,
    minStockAlert: 8,
    pack: 'Box with Meter, 10 Strips, 10 Lancets & Case',
    packSize: 1,
    looseUnitName: 'Kit',
    rackLocation: 'Medical Equipment Cabinet E-2',
    description: 'Accurate 5-second blood glucose meter with no-coding required, 500 test memory, and visual double check window.',
    dosageGuidelines: 'Fasting and 2-hour post prandial blood sugar testing.',
    batches: [
      {
        batchNumber: 'ACH-25K02',
        expiryDate: '2028-12-31',
        manufacturingDate: '2025-04-01',
        stock: 16,
        costPrice: 950.00,
        sellingPrice: 1350.00,
        mrp: 1499.00,
        location: 'Equipment Cabinet E-2'
      }
    ]
  },
  {
    id: 'med-form-mach-03',
    name: 'Dr. Morepen CN-06 Compressor Nebulizer',
    genericName: 'Piston Compressor Drug Delivery Nebulizer Machine',
    strength: 'Aerosol Respirator with Adult & Child Masks',
    form: 'Machine',
    manufacturer: 'Dr. Morepen Laboratories Ltd',
    category: 'Respiratory Medical Equipment',
    prescriptionRequired: false,
    hsnCode: '901920',
    taxRate: 12,
    minStockAlert: 6,
    pack: 'Complete Box with Compressor, Masks, Tubing & 5 Filters',
    packSize: 1,
    looseUnitName: 'Machine',
    rackLocation: 'Medical Equipment Cabinet E-3',
    description: 'Heavy duty, low noise compressor converting medication into 0.5-5 micron particles for effective bronchodilation in bronchitis and asthma.',
    dosageGuidelines: 'Administer respules (e.g. Budecort / Duolin) as prescribed by physician.',
    batches: [
      {
        batchNumber: 'MRP-25D08',
        expiryDate: '2035-01-01',
        manufacturingDate: '2025-04-01',
        stock: 10,
        costPrice: 1150.00,
        sellingPrice: 1680.00,
        mrp: 1890.00,
        location: 'Equipment Cabinet E-3'
      }
    ]
  },

  // ==========================================
  // 13. CANDY
  // ==========================================
  {
    id: 'med-form-candy-01',
    name: 'Strepsils Honey & Lemon Lozenges (Pack of 8)',
    genericName: 'Dichlorobenzyl Alcohol + Amylmetacresol',
    strength: '1.2mg + 0.6mg',
    form: 'Candy',
    manufacturer: 'Reckitt Benckiser',
    category: 'Throat Lozenges & Medicated Candy',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 40,
    pack: 'Strip of 8 Lozenges',
    packSize: 8,
    looseUnitName: 'Lozenge',
    rackLocation: 'Front OTC Billing Counter',
    description: 'Antibacterial throat lozenges providing warm honey-lemon soothing relief for dry scratchy throat and hoarseness.',
    dosageGuidelines: 'Dissolve 1 lozenge slowly in mouth every 2-3 hours.',
    batches: [
      {
        batchNumber: 'STP-25H21',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-08-01',
        stock: 140,
        costPrice: 26.00,
        sellingPrice: 38.00,
        mrp: 40.00,
        location: 'Front Counter'
      }
    ]
  },
  {
    id: 'med-form-candy-02',
    name: 'Vicks Ginger Cough Lozenges (Jar of 100)',
    genericName: 'Ayurvedic Menthol & Ginger Herbal Drops',
    strength: 'Jar of 100 Candies',
    form: 'Candy',
    manufacturer: 'Procter & Gamble (P&G)',
    category: 'Ayurvedic Cough Candy',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 10,
    pack: 'Jar of 100 Candies',
    packSize: 100,
    looseUnitName: 'Candy',
    rackLocation: 'Front OTC Billing Counter',
    description: 'Natural ginger warmth soothing throat dryness and early tickling cough.',
    dosageGuidelines: 'Suck 1 candy as needed.',
    batches: [
      {
        batchNumber: 'VCK-25J02',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-06-01',
        stock: 25,
        costPrice: 135.00,
        sellingPrice: 190.00,
        mrp: 200.00,
        location: 'Front Counter'
      }
    ]
  },

  // ==========================================
  // 14. CHOCOLATE
  // ==========================================
  {
    id: 'med-form-choc-01',
    name: 'Calcirol D3 Chewable Chocolate Chunks 60,000 IU',
    genericName: 'Cholecalciferol (Vitamin D3) In Milk Chocolate Base',
    strength: '60,000 IU (Box of 4 Chunks)',
    form: 'Chocolate',
    manufacturer: 'Cadila Pharmaceuticals',
    category: 'Vitamins / Bone Health',
    prescriptionRequired: true,
    hsnCode: '300450',
    taxRate: 12,
    minStockAlert: 20,
    pack: 'Box of 4 Chunks',
    packSize: 4,
    looseUnitName: 'Chunk',
    rackLocation: 'Rack C-05 (Vitamins)',
    description: 'Delicious chocolate chunk formulation for high-dose weekly Vitamin D3 therapy in osteopenia and deficiency.',
    dosageGuidelines: 'Chew 1 chunk once weekly with milk after meals.',
    batches: [
      {
        batchNumber: 'CLC-25F11',
        expiryDate: '2027-04-30',
        manufacturingDate: '2025-04-01',
        stock: 45,
        costPrice: 140.00,
        sellingPrice: 205.00,
        mrp: 218.00,
        location: 'Rack C-05'
      }
    ]
  },
  {
    id: 'med-form-choc-02',
    name: 'Pre-Probiotic Kids Choco Bites (Pack of 30)',
    genericName: 'Bacillus coagulans + FOS In Dark Chocolate',
    strength: '1 Billion CFU (30 Bites)',
    form: 'Chocolate',
    manufacturer: 'NutriBite Wellness Ltd',
    category: 'Gut Health & Probiotic',
    prescriptionRequired: false,
    hsnCode: '210690',
    taxRate: 18,
    minStockAlert: 15,
    pack: 'Box of 30 Bites',
    packSize: 30,
    looseUnitName: 'Bite',
    rackLocation: 'Nutra Shelf N-4',
    description: 'Delicious gut-friendly probiotic chocolates supporting digestion and immunity in children and adults.',
    dosageGuidelines: '1 choco bite daily after lunch.',
    batches: [
      {
        batchNumber: 'PBT-25G08',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-08-01',
        stock: 30,
        costPrice: 240.00,
        sellingPrice: 345.00,
        mrp: 375.00,
        location: 'Nutra Shelf N-4'
      }
    ]
  },

  // ==========================================
  // 15. OIL
  // ==========================================
  {
    id: 'med-form-oil-01',
    name: 'Figaro Pure Olive Oil 200ml Tin',
    genericName: '100% Pure Chemical-Free Olive Oil',
    strength: '200 ml Tin',
    form: 'Oil',
    manufacturer: 'Deoleo India Pvt Ltd',
    category: 'Baby Care & Healthy Lipids',
    prescriptionRequired: false,
    hsnCode: '150910',
    taxRate: 5,
    minStockAlert: 20,
    pack: '200 ml Tin',
    packSize: 1,
    looseUnitName: 'Tin',
    rackLocation: 'Baby Care & Oils Aisle B-4',
    description: 'Rich in Vitamin E and oleic acid; pediatrician trusted natural infant body massage oil strengthening baby bones and skin.',
    dosageGuidelines: 'Warm gently and massage baby skin before morning bath.',
    batches: [
      {
        batchNumber: 'FGR-25E17',
        expiryDate: '2028-05-31',
        manufacturingDate: '2025-05-01',
        stock: 38,
        costPrice: 260.00,
        sellingPrice: 345.00,
        mrp: 365.00,
        location: 'Baby Care B-4'
      }
    ]
  },
  {
    id: 'med-form-oil-02',
    name: 'Castor Oil IP (Eranda Thailam) 100ml',
    genericName: 'Pure Cold Pressed Ricinus Communis Seed Oil IP',
    strength: '100 ml Bottle',
    form: 'Oil',
    manufacturer: 'Apex Pharmacopoeia Labs',
    category: 'Laxative & Hair Care',
    prescriptionRequired: false,
    hsnCode: '151530',
    taxRate: 5,
    minStockAlert: 25,
    pack: '100 ml Bottle',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Traditional Oils O-1',
    description: 'Pharmaceutical grade pure castor oil for occasional acute constipation relief and natural eyebrow/hair thickening.',
    dosageGuidelines: '5-10 ml at bedtime with warm milk as directed by physician.',
    batches: [
      {
        batchNumber: 'CST-25D03',
        expiryDate: '2028-10-31',
        manufacturingDate: '2025-04-01',
        stock: 50,
        costPrice: 42.00,
        sellingPrice: 65.00,
        mrp: 70.00,
        location: 'Traditional Oils O-1'
      }
    ]
  },
  {
    id: 'med-form-oil-03',
    name: 'Dabur Badam Tail 100% Pure Almond Oil 50ml',
    genericName: 'Sweet Almond Oil (Prunus Amygdalus)',
    strength: '50 ml Glass Bottle',
    form: 'Oil',
    manufacturer: 'Dabur India Ltd',
    category: 'Ayurvedic Brain & Skin Tonic',
    prescriptionRequired: false,
    hsnCode: '151590',
    taxRate: 5,
    minStockAlert: 15,
    pack: '50 ml Bottle',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Traditional Oils O-2',
    description: '100% pure edible sweet almond oil rich in Vitamin E; nourishes nervous system, memory, and soft infant skin.',
    dosageGuidelines: '1 teaspoon in warm milk or external gentle massage.',
    batches: [
      {
        batchNumber: 'DBR-25H09',
        expiryDate: '2028-08-31',
        manufacturingDate: '2025-08-01',
        stock: 28,
        costPrice: 145.00,
        sellingPrice: 198.00,
        mrp: 210.00,
        location: 'Traditional Oils O-2'
      }
    ]
  },

  // ==========================================
  // 16. POWDER
  // ==========================================
  {
    id: 'med-form-pow-01',
    name: 'Electral ORS Powder 21.8g Sachet',
    genericName: 'WHO Recommended Oral Rehydration Salts Formulation',
    strength: '21.8g Sachet (For 1 Litre Water)',
    form: 'Powder',
    manufacturer: 'FDC Ltd',
    category: 'Electrolytes & Rehydration',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 60,
    pack: '21.8g Sachet',
    packSize: 1,
    looseUnitName: 'Sachet',
    rackLocation: 'Rack P-01 (ORS)',
    description: 'WHO formula isotonic electrolyte replenishment powder for dehydration during diarrhea, vomiting, and heat exhaustion.',
    dosageGuidelines: 'Dissolve entire contents of 1 sachet in 1000ml boiled and cooled drinking water.',
    batches: [
      {
        batchNumber: 'ELC-25J05',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-09-01',
        stock: 220,
        costPrice: 14.50,
        sellingPrice: 21.50,
        mrp: 23.20,
        location: 'Rack P-01'
      }
    ]
  },
  {
    id: 'med-form-pow-02',
    name: 'Candid 1% Dusting Powder 100g',
    genericName: 'Clotrimazole 1% w/w',
    strength: '1% w/w (100g Dispenser)',
    form: 'Powder',
    manufacturer: 'Glenmark Pharmaceuticals',
    category: 'Antifungal Topical',
    prescriptionRequired: false,
    hsnCode: '300420',
    taxRate: 12,
    minStockAlert: 30,
    pack: '100g Dispenser Bottle',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Dermo Aisle Shelf 2',
    description: 'Antifungal medicated dusting powder preventing and relieving prickly heat, athlete\'s foot, and skin fold friction.',
    dosageGuidelines: 'Dust liberally over clean dry skin folds 2-3 times daily.',
    batches: [
      {
        batchNumber: 'CND-25K08',
        expiryDate: '2028-04-30',
        manufacturingDate: '2025-04-01',
        stock: 55,
        costPrice: 98.00,
        sellingPrice: 145.00,
        mrp: 155.00,
        location: 'Dermo Shelf 2'
      }
    ]
  },
  {
    id: 'med-form-pow-03',
    name: 'Protinex High Protein Nutrition Powder 400g',
    genericName: 'Hydrolyzed Peanut Protein + 25 Immuno-Nutrients',
    strength: '400g Tin (Creamy Vanilla)',
    form: 'Powder',
    manufacturer: 'Danone India',
    category: 'Clinical Protein Supplement',
    prescriptionRequired: false,
    hsnCode: '210690',
    taxRate: 18,
    minStockAlert: 20,
    pack: '400g Tin',
    packSize: 1,
    looseUnitName: 'Tin',
    rackLocation: 'Nutrition Aisle N-1',
    description: 'High-quality hydrolyzed protein supplement supporting lean muscle maintenance, stamina, and convalescence recovery.',
    dosageGuidelines: '2-3 tablespoons in a glass of warm milk.',
    batches: [
      {
        batchNumber: 'PTX-25F16',
        expiryDate: '2027-06-30',
        manufacturingDate: '2025-06-01',
        stock: 32,
        costPrice: 420.00,
        sellingPrice: 590.00,
        mrp: 630.00,
        location: 'Nutrition N-1'
      }
    ]
  },

  // ==========================================
  // 17. DROPS
  // ==========================================
  {
    id: 'med-form-drop-01',
    name: 'Nasivion Adult 0.05% Nasal Drops 10ml',
    genericName: 'Oxymetazoline Hydrochloride 0.05% w/v',
    strength: '0.05% w/v (10ml Dropper)',
    form: 'Drops',
    manufacturer: 'Procter & Gamble Health',
    category: 'Respiratory / Nasal Decongestant',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '10 ml Dropper Bottle',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'ENT Drops Shelf D-1',
    description: 'Fast 25-second action nasal decongestant relieving stuffy blocked nose for up to 12 hours in sinusitis and colds.',
    dosageGuidelines: '1-2 drops into each nostril 2-3 times daily. Do not use for >7 consecutive days.',
    batches: [
      {
        batchNumber: 'NSV-25B08',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-05-01',
        stock: 58,
        costPrice: 62.00,
        sellingPrice: 94.00,
        mrp: 99.50,
        location: 'ENT Drops D-1'
      }
    ]
  },
  {
    id: 'med-form-drop-02',
    name: 'Ciplox 0.3% Eye/Ear Drops 10ml',
    genericName: 'Ciprofloxacin 0.3% w/v',
    strength: '0.3% w/v (10ml)',
    form: 'Drops',
    manufacturer: 'Cipla Ltd',
    category: 'Ophthalmic & Otic Antibiotic',
    prescriptionRequired: true,
    hsnCode: '300420',
    taxRate: 12,
    minStockAlert: 30,
    pack: '10 ml Sterile Dropper',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'Ophthalmic Shelf E-1',
    description: 'Broad-spectrum fluoroquinolone antibiotic sterile drops treating conjunctivitis, corneal ulcers, and otitis externa.',
    dosageGuidelines: '1-2 drops into affected eye/ear every 4 hours.',
    batches: [
      {
        batchNumber: 'CPX-25A19',
        expiryDate: '2027-08-31',
        manufacturingDate: '2025-02-01',
        stock: 64,
        costPrice: 12.50,
        sellingPrice: 19.50,
        mrp: 21.00,
        location: 'Ophthalmic Shelf E-1'
      }
    ]
  },

  // ==========================================
  // 18. INHALER
  // ==========================================
  {
    id: 'med-form-inh-01',
    name: 'Budecort 200 Inhaler (200 Metered Doses)',
    genericName: 'Budesonide (200mcg/puff)',
    strength: '200 mcg (200 MDI)',
    form: 'Inhaler',
    manufacturer: 'Cipla Ltd',
    category: 'Respiratory / Corticosteroid',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 15,
    pack: '1 Inhaler (200 Doses)',
    packSize: 1,
    looseUnitName: 'Canister',
    rackLocation: 'Cabinet A-02 (Respiratory)',
    description: 'Inhaled corticosteroid controller reducing airway inflammation and preventing asthma exacerbations.',
    dosageGuidelines: '1-2 puffs twice daily; rinse mouth with water after use.',
    batches: [
      {
        batchNumber: 'BDC-25H04',
        expiryDate: '2027-07-31',
        manufacturingDate: '2025-07-01',
        stock: 35,
        costPrice: 240.00,
        sellingPrice: 345.00,
        mrp: 368.00,
        location: 'Cabinet A-02'
      }
    ]
  },
  {
    id: 'med-form-inh-02',
    name: 'Foracort 200 Inhaler (200 Metered Doses)',
    genericName: 'Formoterol Fumarate + Budesonide',
    strength: '6mcg + 200mcg (200 MDI)',
    form: 'Inhaler',
    manufacturer: 'Cipla Ltd',
    category: 'Respiratory / LABA + ICS',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 15,
    pack: '1 Inhaler (200 Doses)',
    packSize: 1,
    looseUnitName: 'Canister',
    rackLocation: 'Cabinet A-02 (Respiratory)',
    description: 'Combination long-acting beta2 agonist with steroid providing 12-hour bronchodilation in asthma and COPD.',
    dosageGuidelines: '1-2 inhalations twice daily morning and night.',
    batches: [
      {
        batchNumber: 'FRC-25D14',
        expiryDate: '2027-10-31',
        manufacturingDate: '2025-04-01',
        stock: 28,
        costPrice: 310.00,
        sellingPrice: 440.00,
        mrp: 468.00,
        location: 'Cabinet A-02'
      }
    ]
  },

  // ==========================================
  // 19. SPRAY
  // ==========================================
  {
    id: 'med-form-spray-01',
    name: 'Volini Rapid Action Pain Relief Spray 55g',
    genericName: 'Diclofenac Diethylamine + Virgin Linseed Oil + Methyl Salicylate + Menthol Aerosol',
    strength: '55g Aerosol Canister',
    form: 'Spray',
    manufacturer: 'Sun Pharmaceutical Industries Ltd',
    category: 'Topical Pain Spray',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    pack: '55g Spray Can',
    packSize: 1,
    looseUnitName: 'Can',
    rackLocation: 'Pain Relief Spray Rack P-3',
    description: 'Targeted 360-degree pain spray delivering micro-particles straight to inflammation site without direct hand touch.',
    dosageGuidelines: 'Spray from 5cm distance on affected area 3-4 times daily.',
    batches: [
      {
        batchNumber: 'VSP-25K01',
        expiryDate: '2028-03-31',
        manufacturingDate: '2025-03-01',
        stock: 45,
        costPrice: 155.00,
        sellingPrice: 228.00,
        mrp: 245.00,
        location: 'Spray Rack P-3'
      }
    ]
  },
  {
    id: 'med-form-spray-02',
    name: 'Otrivin Oxy Fast Relief Adult Nasal Spray 10ml',
    genericName: 'Oxymetazoline Hydrochloride 0.05% w/v Metered Spray',
    strength: '0.05% w/v (10ml Metered Spray)',
    form: 'Spray',
    manufacturer: 'GlaxoSmithKline (GSK)',
    category: 'Respiratory / Nasal Metered Spray',
    prescriptionRequired: false,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '10 ml Spray Bottle',
    packSize: 1,
    looseUnitName: 'Bottle',
    rackLocation: 'ENT Drops & Sprays D-1',
    description: 'Precision metered fine mist nasal spray unclogging congested sinuses in 25 seconds for 12 hours.',
    dosageGuidelines: '1 spray into each nostril 2-3 times daily.',
    batches: [
      {
        batchNumber: 'OTR-25G10',
        expiryDate: '2027-12-31',
        manufacturingDate: '2025-06-01',
        stock: 52,
        costPrice: 78.00,
        sellingPrice: 115.00,
        mrp: 122.00,
        location: 'ENT D-1'
      }
    ]
  },

  // ==========================================
  // 20. BISCUITS
  // ==========================================
  {
    id: 'med-form-bisc-01',
    name: 'Sunfeast Farmlite Oats & Almonds Digestive Biscuits 150g',
    genericName: 'High Dietary Fiber Oats with California Almonds',
    strength: '150g Pack (Zero Maida)',
    form: 'Biscuits',
    manufacturer: 'ITC Limited',
    category: 'Dietary & Wellness Biscuits',
    prescriptionRequired: false,
    hsnCode: '190531',
    taxRate: 18,
    minStockAlert: 20,
    pack: '150g Pack',
    packSize: 1,
    looseUnitName: 'Pack',
    rackLocation: 'Healthy Nutrition Shelf N-5',
    description: '100% whole wheat and whole oats digestive biscuits with zero trans fats, high soluble fiber, and almonds for diabetic tea-time snacking.',
    dosageGuidelines: 'Healthy snack with green tea or diabetic nutrition.',
    batches: [
      {
        batchNumber: 'SFT-25H03',
        expiryDate: '2026-12-31',
        manufacturingDate: '2025-06-01',
        stock: 40,
        costPrice: 38.00,
        sellingPrice: 52.00,
        mrp: 55.00,
        location: 'Nutrition N-5'
      }
    ]
  },
  {
    id: 'med-form-bisc-02',
    name: 'Britannia NutriChoice Diabetic Friendly Oats Biscuits 200g',
    genericName: 'Zero Added Sugar Complex Carb Biscuits',
    strength: '200g Box',
    form: 'Biscuits',
    manufacturer: 'Britannia Industries Ltd',
    category: 'Diabetic Snacking & Nutrition',
    prescriptionRequired: false,
    hsnCode: '190531',
    taxRate: 18,
    minStockAlert: 20,
    pack: '200g Box',
    packSize: 1,
    looseUnitName: 'Box',
    rackLocation: 'Healthy Nutrition Shelf N-5',
    description: 'Endorsed for diabetic dietary management; baked with high dietary fiber, low glycemic ingredients, and no artificial sweeteners.',
    dosageGuidelines: '2 biscuits per serving as healthy tea-time accompaniment.',
    batches: [
      {
        batchNumber: 'BRT-25J14',
        expiryDate: '2026-11-30',
        manufacturingDate: '2025-05-01',
        stock: 36,
        costPrice: 52.00,
        sellingPrice: 72.00,
        mrp: 75.00,
        location: 'Nutrition N-5'
      }
    ]
  },
  {
    id: 'med-form-bisc-03',
    name: 'Threptin High Protein Diskettes 275g Tin',
    genericName: 'Casein High Biological Value Protein Diskettes',
    strength: '275g Sealed Tin (Vanilla)',
    form: 'Biscuits',
    manufacturer: 'Raptakos Brett & Co. Ltd',
    category: 'Therapeutic Protein Supplement',
    prescriptionRequired: false,
    hsnCode: '190531',
    taxRate: 18,
    minStockAlert: 15,
    pack: '275g Tin',
    packSize: 1,
    looseUnitName: 'Tin',
    rackLocation: 'Therapeutic Nutrition N-6',
    description: 'Physician trusted solid protein diskettes providing pure casein protein for post-surgery convalescence, cardiac, and diabetic patients.',
    dosageGuidelines: '3-5 diskettes between meals twice daily.',
    batches: [
      {
        batchNumber: 'TRP-25E09',
        expiryDate: '2027-04-30',
        manufacturingDate: '2025-04-01',
        stock: 24,
        costPrice: 380.00,
        sellingPrice: 510.00,
        mrp: 540.00,
        location: 'Therapeutic N-6'
      }
    ]
  },

  // ==========================================
  // 21. SUPPORT
  // ==========================================
  {
    id: 'med-form-supp-01',
    name: 'Flamingo Lumbar Sacro Support Belt (Size L)',
    genericName: 'Orthopedic Lumbar Sacral Spinal Immobilization Belt',
    strength: 'Size Large (36-40 inches / 90-100 cm)',
    form: 'Support',
    manufacturer: 'Ascent Meditech Ltd (Flamingo)',
    category: 'Orthopedic Rehabilitation',
    prescriptionRequired: false,
    hsnCode: '902110',
    taxRate: 12,
    minStockAlert: 8,
    pack: 'Single Belt Box',
    packSize: 1,
    looseUnitName: 'Belt',
    rackLocation: 'Ortho Support Rack OS-1',
    description: 'Double elastic pull with 4 contoured anatomical stays relieving chronic low back pain, disc herniation, and postural fatigue.',
    dosageGuidelines: 'Wrap around lower lumbar spine snugly during daytime sitting or walking.',
    batches: [
      {
        batchNumber: 'FLM-25A03',
        expiryDate: '2035-12-31',
        manufacturingDate: '2025-01-01',
        stock: 15,
        costPrice: 580.00,
        sellingPrice: 840.00,
        mrp: 910.00,
        location: 'Ortho OS-1'
      }
    ]
  },
  {
    id: 'med-form-supp-02',
    name: 'Tynor Knee Support Brace with Hinge (Size M)',
    genericName: 'Controlled Motion Hinged Knee Immobilizer',
    strength: 'Size Medium (17-19.6 inches)',
    form: 'Support',
    manufacturer: 'Tynor Orthotics Pvt Ltd',
    category: 'Orthopedic Knee Brace',
    prescriptionRequired: false,
    hsnCode: '902110',
    taxRate: 12,
    minStockAlert: 8,
    pack: 'Single Knee Brace Box',
    packSize: 1,
    looseUnitName: 'Brace',
    rackLocation: 'Ortho Support Rack OS-2',
    description: 'Bi-axial heavy-duty aluminum hinges mimicking natural knee joint movement for ligament injury, meniscus strain, and osteoarthritis.',
    dosageGuidelines: 'Fasten velcro straps starting from calf up to thigh.',
    batches: [
      {
        batchNumber: 'TYN-25G12',
        expiryDate: '2035-12-31',
        manufacturingDate: '2025-07-01',
        stock: 12,
        costPrice: 650.00,
        sellingPrice: 940.00,
        mrp: 990.00,
        location: 'Ortho OS-2'
      }
    ]
  },
  {
    id: 'med-form-supp-03',
    name: 'Flamingo Cervical Collar Soft (Size L)',
    genericName: 'Soft Polyurethane Foam Neck Immobilizer with Eyelets',
    strength: 'Size Large (3.5 inch height)',
    form: 'Support',
    manufacturer: 'Ascent Meditech Ltd (Flamingo)',
    category: 'Orthopedic Cervical Care',
    prescriptionRequired: false,
    hsnCode: '902110',
    taxRate: 12,
    minStockAlert: 10,
    pack: 'Single Collar Box',
    packSize: 1,
    looseUnitName: 'Collar',
    rackLocation: 'Ortho Support Rack OS-3',
    description: 'High density contoured foam supporting jaw and cervical spine during cervical spondylosis, whiplash, and neck stiffness.',
    dosageGuidelines: 'Fasten with hook-loop closure around neck as advised by orthopedic surgeon.',
    batches: [
      {
        batchNumber: 'FLM-25J19',
        expiryDate: '2035-12-31',
        manufacturingDate: '2025-05-01',
        stock: 18,
        costPrice: 190.00,
        sellingPrice: 285.00,
        mrp: 310.00,
        location: 'Ortho OS-3'
      }
    ]
  },

  // ==========================================
  // 22. DIAPER
  // ==========================================
  {
    id: 'med-form-diap-01',
    name: 'MamyPoko Pants Extra Absorb Baby Diaper Large 34s',
    genericName: 'Deep Absorbent Core Pant Style Baby Diaper (9-14 kg)',
    strength: 'Size L (Pack of 34 Pants)',
    form: 'Diaper',
    manufacturer: 'Unicharm India Pvt Ltd',
    category: 'Baby Hygiene & Care',
    prescriptionRequired: false,
    hsnCode: '961900',
    taxRate: 12,
    minStockAlert: 15,
    pack: 'Bag of 34 Diapers',
    packSize: 34,
    looseUnitName: 'Diaper',
    rackLocation: 'Diaper & Hygiene Bay D-1',
    description: 'Criss-cross absorbent sheet absorbing up to 7 glasses of urine with 12-hour leak-lock protection preventing diaper rash.',
    dosageGuidelines: 'Wear like regular pants; tear sides to remove.',
    batches: [
      {
        batchNumber: 'MPK-25H01',
        expiryDate: '2028-08-31',
        manufacturingDate: '2025-08-01',
        stock: 28,
        costPrice: 480.00,
        sellingPrice: 650.00,
        mrp: 699.00,
        location: 'Hygiene Bay D-1'
      }
    ]
  },
  {
    id: 'med-form-diap-02',
    name: 'Friends Classic Adult Diaper Pants Medium 10s',
    genericName: 'Incontinence Absorption Briefs (28-44 inches / 71-112 cm)',
    strength: 'Size M (Pack of 10 Pull-Up Pants)',
    form: 'Diaper',
    manufacturer: 'Nobel Hygiene Pvt Ltd',
    category: 'Geriatric & Incontinence Care',
    prescriptionRequired: false,
    hsnCode: '961900',
    taxRate: 12,
    minStockAlert: 15,
    pack: 'Bag of 10 Diapers',
    packSize: 10,
    looseUnitName: 'Diaper',
    rackLocation: 'Diaper & Hygiene Bay D-2',
    description: 'Antibacterial SAP core with odor-lock technology and wetness indicator for active and bedridden seniors.',
    dosageGuidelines: 'Change every 8 hours or immediately when wetness indicator turns blue.',
    batches: [
      {
        batchNumber: 'FRD-25G18',
        expiryDate: '2028-07-31',
        manufacturingDate: '2025-07-01',
        stock: 32,
        costPrice: 340.00,
        sellingPrice: 470.00,
        mrp: 499.00,
        location: 'Hygiene Bay D-2'
      }
    ]
  },
  {
    id: 'med-form-diap-03',
    name: 'Dignity Mattey Disposable Underpads 10s (60x90 cm)',
    genericName: 'Bed Incontinence & Post-Operative Protection Sheet',
    strength: '60cm x 90cm (Pack of 10 Sheets)',
    form: 'Diaper',
    manufacturer: 'Romsons Group',
    category: 'Medical Bedding Protection',
    prescriptionRequired: false,
    hsnCode: '961900',
    taxRate: 12,
    minStockAlert: 15,
    pack: 'Pack of 10 Mats',
    packSize: 10,
    looseUnitName: 'Sheet',
    rackLocation: 'Diaper & Hygiene Bay D-3',
    description: 'Diamond embossed pattern with super absorbent polymer and waterproof PE back sheet protecting hospital and home mattresses.',
    dosageGuidelines: 'Spread over bed sheet under patient.',
    batches: [
      {
        batchNumber: 'DGN-25K09',
        expiryDate: '2028-11-30',
        manufacturingDate: '2025-05-01',
        stock: 25,
        costPrice: 280.00,
        sellingPrice: 395.00,
        mrp: 420.00,
        location: 'Hygiene Bay D-3'
      }
    ]
  },
  // ==========================================
  // 23. INJECTION (Parenteral, IV, IM, SC)
  // ==========================================
  {
    id: 'med-form-inj-01',
    name: 'Monocef 1g Injection',
    genericName: 'Ceftriaxone Sodium Sterile Powder for Injection',
    strength: '1000 mg (1 g) + Sterile Water for Injection',
    form: 'Injection',
    manufacturer: 'Aristo Pharmaceuticals',
    category: 'Antibiotic / Cephalosporin',
    prescriptionRequired: true,
    hsnCode: '300420',
    taxRate: 12,
    minStockAlert: 20,
    pack: '1 Vial + 10ml SWFI',
    packSize: 1,
    looseUnitName: 'Vial',
    rackLocation: 'Cold Storage / Inj Bay INJ-01',
    description: 'Broad-spectrum third-generation cephalosporin antibiotic injection for severe systemic infections.',
    dosageGuidelines: '1g to 2g once daily IV/IM as directed by physician.',
    batches: [
      {
        batchNumber: 'MNF-25J14',
        expiryDate: '2027-11-30',
        manufacturingDate: '2025-06-01',
        stock: 65,
        costPrice: 42.50,
        sellingPrice: 65.00,
        mrp: 68.50,
        location: 'Inj Bay INJ-01'
      },
      {
        batchNumber: 'MNF-24L08',
        expiryDate: '2026-10-31',
        manufacturingDate: '2024-10-15',
        stock: 18,
        costPrice: 39.80,
        sellingPrice: 65.00,
        mrp: 68.50,
        location: 'Inj Bay INJ-01'
      }
    ]
  },
  {
    id: 'med-form-inj-02',
    name: 'Dynapar AQ 1ml Injection',
    genericName: 'Diclofenac Sodium 75mg/ml Aqueous',
    strength: '75 mg / 1 ml',
    form: 'Injection',
    manufacturer: 'Troikaa Pharmaceuticals',
    category: 'Analgesic / Anti-inflammatory',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    pack: '5 Ampoules Pack (1ml each)',
    packSize: 5,
    looseUnitName: 'Ampoule',
    rackLocation: 'Inj Bay INJ-02',
    description: 'Patented painless aqueous diclofenac sodium injection for acute muscular, post-op, and renal colic pain.',
    dosageGuidelines: '75mg deep IM or slow IV infusion.',
    batches: [
      {
        batchNumber: 'DNP-25E03',
        expiryDate: '2027-09-30',
        manufacturingDate: '2025-05-10',
        stock: 90,
        costPrice: 18.50,
        sellingPrice: 28.00,
        mrp: 30.50,
        location: 'Inj Bay INJ-02'
      }
    ]
  },
  {
    id: 'med-form-inj-03',
    name: 'Pantocid 40mg IV Injection',
    genericName: 'Pantoprazole Sodium for Injection',
    strength: '40 mg Lyophilized Powder',
    form: 'Injection',
    manufacturer: 'Sun Pharma Laboratories',
    category: 'Gastrointestinal / PPI',
    prescriptionRequired: true,
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    pack: '1 Vial with Solvent',
    packSize: 1,
    looseUnitName: 'Vial',
    rackLocation: 'Inj Bay INJ-03',
    description: 'Proton pump inhibitor injection for acute GERD, bleeding peptic ulcers, and stress ulcer prophylaxis.',
    dosageGuidelines: '40mg IV push over 2 minutes or infusion.',
    batches: [
      {
        batchNumber: 'PAN-25H21',
        expiryDate: '2027-12-31',
        manufacturingDate: '2025-07-01',
        stock: 55,
        costPrice: 34.00,
        sellingPrice: 52.00,
        mrp: 56.00,
        location: 'Inj Bay INJ-03'
      }
    ]
  },
  {
    id: 'med-form-inj-04',
    name: 'Lantus Solostar 100 IU/ml Insulin Glargine Pen',
    genericName: 'Insulin Glargine (rDNA origin)',
    strength: '100 IU / ml (3 ml Prefilled Pen)',
    form: 'Injection',
    manufacturer: 'Sanofi India Ltd',
    category: 'Antidiabetic / Long-Acting Insulin',
    prescriptionRequired: true,
    hsnCode: '300431',
    taxRate: 5,
    minStockAlert: 10,
    pack: '1 Disposable Pen (3ml / 300 units)',
    packSize: 1,
    looseUnitName: 'Pen',
    rackLocation: 'Cold Storage (2°C - 8°C) CS-01',
    description: 'Once-daily long-acting basal insulin analog for diabetes mellitus glycemic control.',
    dosageGuidelines: 'Subcutaneous injection once daily at the same time.',
    batches: [
      {
        batchNumber: 'LAN-25D11',
        expiryDate: '2027-04-30',
        manufacturingDate: '2025-03-01',
        stock: 22,
        costPrice: 510.00,
        sellingPrice: 685.00,
        mrp: 720.00,
        location: 'Cold Storage CS-01'
      }
    ]
  }
];
