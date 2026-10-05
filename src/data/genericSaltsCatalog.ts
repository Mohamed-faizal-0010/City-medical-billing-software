// Master Pharmaceutical Generic Salts & Compositions Catalog
// Comprehensive dictionary of standard Indian Pharmacopoeia (IP), British Pharmacopoeia (BP),
// and USP pharmaceutical active pharmaceutical ingredients (APIs), salt combinations, and strengths.

import { Medicine } from '../types';

export interface GenericSaltItem {
  id: string;
  saltDescription: string;
  category: string;
  standardHsn: string;
  standardGst: number;
  standardPack: string;
  schedule?: 'OTC' | 'Schedule H' | 'Schedule H1' | 'Schedule X' | 'Schedule G';
  commonStrengths?: string[];
  popularIndications: string;
}

export const MASTER_GENERIC_SALTS_CATALOG: GenericSaltItem[] = [
  // =========================================================================
  // 1. ANALGESICS, ANTIPYRETICS & NSAIDS (PAIN & FEVER)
  // =========================================================================
  {
    id: 'salt-para-650',
    saltDescription: 'Paracetamol 650mg',
    category: 'Analgesics & Antipyretics',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '15 Tablets',
    schedule: 'OTC',
    commonStrengths: ['500mg', '650mg', '1000mg Infusion'],
    popularIndications: 'Fever, mild-to-moderate pain, headache, bodyache'
  },
  {
    id: 'salt-para-500',
    saltDescription: 'Paracetamol 500mg',
    category: 'Analgesics & Antipyretics',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'OTC',
    commonStrengths: ['500mg'],
    popularIndications: 'Fever, bodyache, headache'
  },
  {
    id: 'salt-aceclo-para',
    saltDescription: 'Aceclofenac 100mg + Paracetamol 325mg',
    category: 'NSAIDs & Pain Relief',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['100mg + 325mg'],
    popularIndications: 'Joint pain, osteoarthritis, dental pain, fever'
  },
  {
    id: 'salt-aceclo-para-serra',
    saltDescription: 'Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg',
    category: 'NSAIDs & Anti-inflammatory Enzyme',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['100mg + 325mg + 15mg'],
    popularIndications: 'Severe pain with post-traumatic edema and swelling'
  },
  {
    id: 'salt-ibup-para',
    saltDescription: 'Ibuprofen 400mg + Paracetamol 325mg',
    category: 'NSAIDs & Pain Relief',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '15 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['400mg + 325mg'],
    popularIndications: 'Muscular pain, headache, dental pain, fever'
  },
  {
    id: 'salt-diclo-para',
    saltDescription: 'Diclofenac Potassium 50mg + Paracetamol 325mg',
    category: 'NSAIDs & Fast Relief',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['50mg + 325mg'],
    popularIndications: 'Acute musculoskeletal pain, sprains, post-operative pain'
  },
  {
    id: 'salt-diclo-sodium',
    saltDescription: 'Diclofenac Sodium 50mg Gastro-resistant',
    category: 'NSAIDs & Anti-inflammatory',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['50mg', '75mg SR', '100mg SR'],
    popularIndications: 'Rheumatoid arthritis, ankylosing spondylitis'
  },
  {
    id: 'salt-tramadol-para',
    saltDescription: 'Tramadol Hydrochloride 37.5mg + Paracetamol 325mg',
    category: 'Opioid Analgesic Combination',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H1',
    commonStrengths: ['37.5mg + 325mg', '50mg'],
    popularIndications: 'Moderate-to-severe acute pain under strict prescription'
  },
  {
    id: 'salt-mefenamic-dicyclo',
    saltDescription: 'Mefenamic Acid 250mg + Dicyclomine Hydrochloride 10mg',
    category: 'Antispasmodic & NSAID',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['250mg + 10mg', '500mg + 20mg'],
    popularIndications: 'Spasmodic dysmenorrhea, intestinal colic, abdominal cramps'
  },
  {
    id: 'salt-drotaverine',
    saltDescription: 'Drotaverine Hydrochloride 80mg',
    category: 'Smooth Muscle Antispasmodic',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['40mg', '80mg'],
    popularIndications: 'Renal colic, biliary colic, gastrointestinal spasms'
  },

  // =========================================================================
  // 2. GASTROINTESTINAL & PROTON PUMP INHIBITORS (PPI)
  // =========================================================================
  {
    id: 'salt-panto-40',
    saltDescription: 'Pantoprazole Gastro-resistant 40mg',
    category: 'Gastrointestinal / PPI',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['40mg'],
    popularIndications: 'Peptic ulcer, gastroesophageal reflux (GERD), hyperacidity'
  },
  {
    id: 'salt-panto-dsr',
    saltDescription: 'Pantoprazole 40mg + Domperidone 30mg SR',
    category: 'Gastrointestinal / PPI + Prokinetic',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Capsules',
    schedule: 'Schedule H',
    commonStrengths: ['40mg + 30mg SR'],
    popularIndications: 'Acid reflux, nausea, dyspepsia, erosive esophagitis'
  },
  {
    id: 'salt-rabe-20',
    saltDescription: 'Rabeprazole Sodium 20mg Gastro-resistant',
    category: 'Gastrointestinal / PPI',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['20mg'],
    popularIndications: 'Zollinger-Ellison syndrome, GERD, active duodenal ulcer'
  },
  {
    id: 'salt-rabe-dsr',
    saltDescription: 'Rabeprazole Sodium 20mg + Domperidone 30mg SR',
    category: 'Gastrointestinal / PPI + Prokinetic',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Capsules',
    schedule: 'Schedule H',
    commonStrengths: ['20mg + 30mg SR'],
    popularIndications: 'GERD, reflux with bloating and delayed gastric emptying'
  },
  {
    id: 'salt-omep-20',
    saltDescription: 'Omeprazole Gastro-resistant 20mg',
    category: 'Gastrointestinal / PPI',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '15 Capsules',
    schedule: 'Schedule H',
    commonStrengths: ['20mg', '40mg'],
    popularIndications: 'Gastric ulcer, reflux esophagitis, heartburn'
  },
  {
    id: 'salt-esom-40',
    saltDescription: 'Esomeprazole Magnesium Trihydrate 40mg',
    category: 'Gastrointestinal / PPI',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['20mg', '40mg'],
    popularIndications: 'Erosive reflux esophagitis, NSAID-induced ulcers'
  },
  {
    id: 'salt-ondan-4',
    saltDescription: 'Ondansetron Hydrochloride 4mg Fast Dissolving',
    category: 'Antiemetic / 5-HT3 Antagonist',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['4mg', '8mg', '2mg/5ml Syrup'],
    popularIndications: 'Nausea, vomiting, post-chemotherapy / gastroenteritis'
  },
  {
    id: 'salt-sucral-oxeta',
    saltDescription: 'Sucralfate 1000mg + Oxetacaine 20mg Suspension',
    category: 'Gastric Mucosal Protectant',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '200ml Bottle',
    schedule: 'Schedule H',
    commonStrengths: ['1g + 20mg / 10ml'],
    popularIndications: 'Peptic ulcer, reflux ulceration, esophageal burning pain'
  },
  {
    id: 'salt-magaldrate-simeth',
    saltDescription: 'Magaldrate 400mg + Simethicone 20mg Antacid Gel',
    category: 'Antacid & Anti-flatulent',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '170ml Bottle',
    schedule: 'OTC',
    commonStrengths: ['400mg + 20mg'],
    popularIndications: 'Immediate relief from gas, acidity, bloated stomach'
  },

  // =========================================================================
  // 3. ANTIBIOTICS & ANTI-INFECTIVES
  // =========================================================================
  {
    id: 'salt-amox-clav-625',
    saltDescription: 'Amoxicillin 500mg + Potassium Clavulanate 125mg',
    category: 'Broad Spectrum Antibiotic (Penicillin)',
    standardHsn: '300410',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['375mg', '625mg', '1000mg'],
    popularIndications: 'Bacterial ENT, respiratory, skin and soft tissue infections'
  },
  {
    id: 'salt-azithro-500',
    saltDescription: 'Azithromycin Dihydrate 500mg',
    category: 'Macrolide Antibiotic',
    standardHsn: '300420',
    standardGst: 12,
    standardPack: '5 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['250mg', '500mg', '200mg/5ml Suspension'],
    popularIndications: 'Upper/lower respiratory infections, pharyngitis, sinusitis'
  },
  {
    id: 'salt-cefixime-200',
    saltDescription: 'Cefixime Trihydrate 200mg',
    category: 'Cephalosporin Antibiotic (3rd Gen)',
    standardHsn: '300420',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['100mg', '200mg'],
    popularIndications: 'Typhoid fever, urinary tract infection, bronchitis'
  },
  {
    id: 'salt-cefixime-oflox',
    saltDescription: 'Cefixime 200mg + Ofloxacin 200mg',
    category: 'Combination Antibiotic',
    standardHsn: '300420',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['200mg + 200mg'],
    popularIndications: 'Severe mixed bacterial infections, resistant typhoid'
  },
  {
    id: 'salt-cefpodoxime-200',
    saltDescription: 'Cefpodoxime Proxetil 200mg',
    category: 'Cephalosporin Antibiotic (3rd Gen)',
    standardHsn: '300420',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['50mg', '100mg', '200mg'],
    popularIndications: 'Community-acquired pneumonia, acute otitis media'
  },
  {
    id: 'salt-oflox-ornid',
    saltDescription: 'Ofloxacin 200mg + Ornidazole 500mg',
    category: 'Fluoroquinolone & Nitroimidazole',
    standardHsn: '300420',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['200mg + 500mg'],
    popularIndications: 'Gastroenteritis, amoebic dysentery, dental infections'
  },
  {
    id: 'salt-cipro-500',
    saltDescription: 'Ciprofloxacin Hydrochloride 500mg',
    category: 'Fluoroquinolone Antibiotic',
    standardHsn: '300420',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['250mg', '500mg'],
    popularIndications: 'Urinary tract infections, infectious diarrhea, bone infections'
  },
  {
    id: 'salt-doxycycline-100',
    saltDescription: 'Doxycycline Hydrochloride 100mg',
    category: 'Tetracycline Antibiotic',
    standardHsn: '300420',
    standardGst: 12,
    standardPack: '10 Capsules',
    schedule: 'Schedule H',
    commonStrengths: ['100mg'],
    popularIndications: 'Acne vulgaris, atypical pneumonia, malaria prophylaxis'
  },
  {
    id: 'salt-metronidazole-400',
    saltDescription: 'Metronidazole 400mg',
    category: 'Antiprotozoal & Antibacterial',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '15 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['200mg', '400mg'],
    popularIndications: 'Amebiasis, giardiasis, trichomoniasis, anaerobic infections'
  },

  // =========================================================================
  // 4. RESPIRATORY, ANTI-ALLERGIC & COUGH FORMULATIONS
  // =========================================================================
  {
    id: 'salt-mont-levo',
    saltDescription: 'Montelukast Sodium 10mg + Levocetirizine Hydrochloride 5mg',
    category: 'Antiallergic & Leukotriene Antagonist',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['10mg + 5mg', '4mg + 2.5mg (Kid)'],
    popularIndications: 'Allergic rhinitis, chronic asthma, sneezing and runny nose'
  },
  {
    id: 'salt-levocet-5',
    saltDescription: 'Levocetirizine Dihydrochloride 5mg',
    category: 'Antihistamine (2nd Gen)',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['5mg'],
    popularIndications: 'Hay fever, urticaria, allergy skin rashes'
  },
  {
    id: 'salt-cetirizine-10',
    saltDescription: 'Cetirizine Hydrochloride 10mg',
    category: 'Antihistamine (2nd Gen)',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['10mg'],
    popularIndications: 'Allergic itching, watery eyes, sneezing'
  },
  {
    id: 'salt-ambroxol-levosal-guai',
    saltDescription: 'Ambroxol 30mg + Levosalbutamol 1mg + Guaiphenesin 50mg Syrup',
    category: 'Mucolytic & Bronchodilator Expectorant',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '100ml Bottle',
    schedule: 'Schedule H',
    commonStrengths: ['30mg + 1mg + 50mg / 5ml'],
    popularIndications: 'Productive wet cough with bronchospasm, mucus clearance'
  },
  {
    id: 'salt-dextro-cpm-phen',
    saltDescription: 'Dextromethorphan HBr 10mg + Chlorpheniramine 2mg + Phenylephrine 5mg Syrup',
    category: 'Antitussive & Decongestant (Dry Cough)',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '100ml Bottle',
    schedule: 'Schedule H',
    commonStrengths: ['10mg + 2mg + 5mg / 5ml'],
    popularIndications: 'Non-productive dry irritating cough, throat tickle'
  },

  // =========================================================================
  // 5. ANTI-DIABETIC MEDICATIONS
  // =========================================================================
  {
    id: 'salt-metformin-500',
    saltDescription: 'Metformin Hydrochloride 500mg Prolonged Release',
    category: 'Anti-diabetic / Biguanide',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '20 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['500mg', '850mg', '1000mg SR'],
    popularIndications: 'Type-2 Diabetes Mellitus glycemic control'
  },
  {
    id: 'salt-glim-met-1',
    saltDescription: 'Glimepiride 1mg + Metformin Hydrochloride 500mg SR',
    category: 'Dual Anti-diabetic Combination',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '15 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['1mg + 500mg', '2mg + 500mg'],
    popularIndications: 'Type-2 Diabetes Mellitus with elevated fasting/PP sugars'
  },
  {
    id: 'salt-glim-met-2',
    saltDescription: 'Glimepiride 2mg + Metformin Hydrochloride 500mg SR',
    category: 'Dual Anti-diabetic Combination',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '15 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['2mg + 500mg'],
    popularIndications: 'Type-2 Diabetes Mellitus'
  },
  {
    id: 'salt-teneli-met',
    saltDescription: 'Teneligliptin 20mg + Metformin Hydrochloride 500mg SR',
    category: 'DPP-4 Inhibitor + Biguanide',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '15 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['20mg + 500mg'],
    popularIndications: 'Cardio-safe glycemic management in Type-2 Diabetes'
  },
  {
    id: 'salt-dapa-10',
    saltDescription: 'Dapagliflozin Propanediol 10mg',
    category: 'SGLT2 Inhibitor',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['5mg', '10mg'],
    popularIndications: 'Type-2 diabetes with heart failure and renal protection'
  },
  {
    id: 'salt-vildagliptin-met',
    saltDescription: 'Vildagliptin 50mg + Metformin Hydrochloride 500mg',
    category: 'DPP-4 Inhibitor + Biguanide',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '15 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['50mg + 500mg', '50mg + 850mg'],
    popularIndications: 'Type-2 diabetes dual control without hypoglycemia'
  },

  // =========================================================================
  // 6. CARDIOVASCULAR & ANTI-HYPERTENSIVE
  // =========================================================================
  {
    id: 'salt-telmi-40',
    saltDescription: 'Telmisartan 40mg',
    category: 'Cardiovascular / ARB',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '15 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['20mg', '40mg', '80mg'],
    popularIndications: 'Essential hypertension, stroke and CV risk reduction'
  },
  {
    id: 'salt-telmi-amlo',
    saltDescription: 'Telmisartan 40mg + Amlodipine 5mg',
    category: 'Dual Anti-hypertensive (ARB + CCB)',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '15 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['40mg + 5mg', '80mg + 5mg'],
    popularIndications: 'Moderate to severe uncontrolled blood pressure'
  },
  {
    id: 'salt-telmi-hctz',
    saltDescription: 'Telmisartan 40mg + Hydrochlorothiazide 12.5mg',
    category: 'Anti-hypertensive (ARB + Diuretic)',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '15 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['40mg + 12.5mg', '80mg + 12.5mg'],
    popularIndications: 'Hypertension with fluid retention'
  },
  {
    id: 'salt-amlo-5',
    saltDescription: 'Amlodipine Besylate 5mg',
    category: 'Calcium Channel Blocker (CCB)',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '15 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['2.5mg', '5mg', '10mg'],
    popularIndications: 'High blood pressure, chronic stable angina'
  },
  {
    id: 'salt-atorva-10',
    saltDescription: 'Atorvastatin Calcium 10mg',
    category: 'Lipid Lowering / Statin',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '15 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['10mg', '20mg', '40mg'],
    popularIndications: 'Hypercholesterolemia, dyslipidemia, coronary prevention'
  },
  {
    id: 'salt-atorva-20',
    saltDescription: 'Atorvastatin Calcium 20mg',
    category: 'Lipid Lowering / Statin',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '15 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['20mg'],
    popularIndications: 'High cholesterol, post-MI secondary prevention'
  },
  {
    id: 'salt-rosuva-10',
    saltDescription: 'Rosuvastatin Calcium 10mg',
    category: 'Lipid Lowering / Statin',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '15 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['5mg', '10mg', '20mg'],
    popularIndications: 'High LDL, triglyceride elevation, atherosclerotic CV disease'
  },
  {
    id: 'salt-metoprolol-succ',
    saltDescription: 'Metoprolol Succinate 25mg Extended Release',
    category: 'Beta Blocker (Cardioselective)',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '15 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['25mg', '50mg ER'],
    popularIndications: 'Angina pectoris, tachycardia, hypertension'
  },
  {
    id: 'salt-clopidogrel-75',
    saltDescription: 'Clopidogrel Bisulphate 75mg',
    category: 'Antiplatelet Agent',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '15 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['75mg'],
    popularIndications: 'Prevention of atherothrombotic vascular events'
  },

  // =========================================================================
  // 7. VITAMINS, MINERALS & NUTRACEUTICALS
  // =========================================================================
  {
    id: 'salt-vit-d3-60k',
    saltDescription: 'Cholecalciferol (Vitamin D3) 60,000 IU',
    category: 'Vitamin Supplement / Bone Health',
    standardHsn: '300450',
    standardGst: 12,
    standardPack: '4 Capsules',
    schedule: 'OTC',
    commonStrengths: ['60,000 IU'],
    popularIndications: 'Severe Vitamin D deficiency, osteoporosis, bone fatigue'
  },
  {
    id: 'salt-calcium-d3',
    saltDescription: 'Calcium Carbonate 500mg + Vitamin D3 250 IU',
    category: 'Mineral & Vitamin Supplement',
    standardHsn: '300450',
    standardGst: 12,
    standardPack: '15 Tablets',
    schedule: 'OTC',
    commonStrengths: ['500mg + 250 IU', '1250mg + 500 IU'],
    popularIndications: 'Hypocalcemia, pregnancy calcium support, post-menopausal care'
  },
  {
    id: 'salt-b-complex-zinc',
    saltDescription: 'B-Complex with Vitamin C and Zinc',
    category: 'Multivitamin / Energy & Immunity',
    standardHsn: '300450',
    standardGst: 12,
    standardPack: '20 Capsules',
    schedule: 'OTC',
    commonStrengths: ['Standard Therapeutic Formulation'],
    popularIndications: 'Mouth ulcers, physical convalescence, immune support'
  },
  {
    id: 'salt-ferrous-folic',
    saltDescription: 'Ferrous Ascorbate 100mg + Folic Acid 1.5mg + Zinc 22.5mg',
    category: 'Hematinic / Iron Supplement',
    standardHsn: '300450',
    standardGst: 12,
    standardPack: '10 Tablets',
    schedule: 'Schedule H',
    commonStrengths: ['100mg + 1.5mg'],
    popularIndications: 'Iron deficiency anemia, pregnancy iron requirements'
  },
  {
    id: 'salt-methylcobal-prega',
    saltDescription: 'Pregabalin 75mg + Methylcobalamin 750mcg',
    category: 'Neuropathic Pain / Neurotropic',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '10 Capsules',
    schedule: 'Schedule H',
    commonStrengths: ['75mg + 750mcg'],
    popularIndications: 'Diabetic peripheral neuropathy, sciatica, nerve tingling'
  },

  // =========================================================================
  // 8. DERMATOLOGY, TOPICALS & ANTIFUNGAL
  // =========================================================================
  {
    id: 'salt-fluconazole-150',
    saltDescription: 'Fluconazole 150mg',
    category: 'Antifungal',
    standardHsn: '300420',
    standardGst: 12,
    standardPack: '1 Tablet',
    schedule: 'Schedule H',
    commonStrengths: ['150mg'],
    popularIndications: 'Candidiasis, systemic fungal infections, tinea'
  },
  {
    id: 'salt-itraconazole-100',
    saltDescription: 'Itraconazole Pellets 100mg',
    category: 'Antifungal (Triazole)',
    standardHsn: '300420',
    standardGst: 12,
    standardPack: '10 Capsules',
    schedule: 'Schedule H',
    commonStrengths: ['100mg', '200mg'],
    popularIndications: 'Onychomycosis, fungal skin infections, blastomycosis'
  },
  {
    id: 'salt-clotrimazole-cream',
    saltDescription: 'Clotrimazole 1% w/w Cream',
    category: 'Topical Antifungal',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '20g Tube',
    schedule: 'OTC',
    commonStrengths: ['1% w/w'],
    popularIndications: 'Athlete foot, jock itch, ringworm, sweat rash'
  },
  {
    id: 'salt-silver-sulfadiazine',
    saltDescription: 'Silver Sulfadiazine 1% w/w Cream',
    category: 'Topical Antibacterial / Burns',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '50g Tube',
    schedule: 'OTC',
    commonStrengths: ['1% w/w'],
    popularIndications: 'Topical treatment of 2nd & 3rd degree burns, wound antisepsis'
  },
  {
    id: 'salt-mupirocin-2',
    saltDescription: 'Mupirocin 2% w/w Ointment',
    category: 'Topical Antibiotic',
    standardHsn: '300490',
    standardGst: 12,
    standardPack: '5g Tube',
    schedule: 'Schedule H',
    commonStrengths: ['2% w/w'],
    popularIndications: 'Impetigo, traumatic bacterial skin lesions, folliculitis'
  }
];

export interface MatchedSaltResult {
  salt: GenericSaltItem;
  matchingBrandMedicines: Medicine[];
}

/**
 * Filter generic salts and compositions by entered letters (case-insensitive substring match)
 * Also matches against any unique genericName stored in the pharmacy medicines inventory!
 */
export const searchGenericSaltsAndCompositions = (
  query: string,
  medicinesList: Medicine[] = []
): MatchedSaltResult[] => {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  // 1. Gather all unique generic names from medicines list not already in master catalog
  const existingSaltDescriptions = new Set(
    MASTER_GENERIC_SALTS_CATALOG.map(s => s.saltDescription.toLowerCase())
  );

  const dynamicSalts: GenericSaltItem[] = [];
  medicinesList.forEach(m => {
    if (m.genericName && m.genericName.trim().length > 1) {
      const gLower = m.genericName.trim().toLowerCase();
      if (!existingSaltDescriptions.has(gLower)) {
        existingSaltDescriptions.add(gLower);
        dynamicSalts.push({
          id: `salt-dyn-${m.id}`,
          saltDescription: m.genericName.trim(),
          category: m.category || 'Pharmaceutical Formulation',
          standardHsn: m.hsnCode || '300490',
          standardGst: m.taxRate || 12,
          standardPack: m.pack || '10s',
          schedule: m.scheduleType ? `Schedule ${m.scheduleType}` : ((m as any).schedule || 'Schedule H'),
          popularIndications: m.description || 'Active pharmaceutical generic ingredient'
        });
      }
    }
  });

  const fullLibrary = [...MASTER_GENERIC_SALTS_CATALOG, ...dynamicSalts];

  // 2. Filter salts where description or category matches cleanQ
  const matched = fullLibrary.filter(item => {
    const saltLower = item.saltDescription.toLowerCase();
    const catLower = item.category.toLowerCase();
    return saltLower.includes(cleanQ) || catLower.includes(cleanQ);
  });

  // 3. For each matched salt, find any corresponding brand products in pharmacy inventory
  return matched.slice(0, 15).map(salt => {
    const sLower = salt.saltDescription.toLowerCase();
    const matchingBrands = medicinesList.filter(m => {
      const mgLower = (m.genericName || '').toLowerCase();
      return mgLower === sLower || (sLower.length > 5 && mgLower.includes(sLower.slice(0, 8)));
    });

    return {
      salt,
      matchingBrandMedicines: matchingBrands
    };
  });
};
