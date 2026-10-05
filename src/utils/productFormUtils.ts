import React from 'react';
import {
  Pill,
  FlaskConical,
  Sparkles,
  Package,
  Activity,
  Heart,
  Droplet,
  Wind,
  Shield,
  Coffee,
  Candy,
  Flame,
  FileCheck,
  Stethoscope,
  Syringe,
  LucideIcon
} from 'lucide-react';

export interface FormConfig {
  name: string;
  key: string;
  icon: LucideIcon;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconColor: string;
  defaultUnit: string;
  typicalHsn: string;
  defaultGst: number;
  description: string;
}

export const TARGET_PRODUCT_FORMS = [
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
] as const;

export type TargetProductForm = typeof TARGET_PRODUCT_FORMS[number];

export const PRODUCT_FORM_CONFIGS: Record<string, FormConfig> = {
  Injection: {
    name: 'Injection',
    key: 'injection',
    icon: Syringe,
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
    iconColor: 'text-indigo-600',
    defaultUnit: 'Vial / Ampoule',
    typicalHsn: '300420',
    defaultGst: 12,
    description: 'Parenteral sterile injectables, IV infusions, ampoules & vials'
  },
  Syrup: {
    name: 'Syrup',
    key: 'syrup',
    icon: FlaskConical,
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    iconColor: 'text-amber-600',
    defaultUnit: 'Bottle',
    typicalHsn: '300490',
    defaultGst: 12,
    description: 'Liquid oral suspension, cough formulation, & tonics'
  },
  Tablet: {
    name: 'Tablet',
    key: 'tablet',
    icon: Pill,
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',
    iconColor: 'text-blue-600',
    defaultUnit: 'Strip / Tab',
    typicalHsn: '300490',
    defaultGst: 12,
    description: 'Compressed oral solid tablets, chewables & dispersibles'
  },
  Ointment: {
    name: 'Ointment',
    key: 'ointment',
    icon: Sparkles,
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-200',
    iconColor: 'text-purple-600',
    defaultUnit: 'Tube',
    typicalHsn: '300432',
    defaultGst: 12,
    description: 'Semisolid lipid-base topical healing ointment'
  },
  Surgical: {
    name: 'Surgical',
    key: 'surgical',
    icon: Shield,
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    defaultUnit: 'Box / Roll',
    typicalHsn: '300590',
    defaultGst: 12,
    description: 'Dressings, antiseptics, gloves, bandages, and clinical prep'
  },
  Capsule: {
    name: 'Capsule',
    key: 'capsule',
    icon: Pill,
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
    iconColor: 'text-indigo-600',
    defaultUnit: 'Strip / Cap',
    typicalHsn: '300490',
    defaultGst: 12,
    description: 'Hard and soft gelatin encapsulation formulations'
  },
  Soap: {
    name: 'Soap',
    key: 'soap',
    icon: Sparkles,
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-800',
    badgeBorder: 'border-teal-200',
    iconColor: 'text-teal-600',
    defaultUnit: 'Bar',
    typicalHsn: '340111',
    defaultGst: 18,
    description: 'Dermatological syndet bars, baby soap & herbal cleansers'
  },
  Shampoo: {
    name: 'Shampoo',
    key: 'shampoo',
    icon: Droplet,
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-200',
    iconColor: 'text-cyan-600',
    defaultUnit: 'Bottle',
    typicalHsn: '330510',
    defaultGst: 18,
    description: 'Medicated antidandruff, antifungal & hair washes'
  },
  'Mouth Wash': {
    name: 'Mouth Wash',
    key: 'mouth wash',
    icon: Droplet,
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-800',
    badgeBorder: 'border-sky-200',
    iconColor: 'text-sky-600',
    defaultUnit: 'Bottle',
    typicalHsn: '330610',
    defaultGst: 18,
    description: 'Antiseptic oral gargles, rinses & dental breath care'
  },
  Gel: {
    name: 'Gel',
    key: 'gel',
    icon: Droplet,
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-800',
    badgeBorder: 'border-violet-200',
    iconColor: 'text-violet-600',
    defaultUnit: 'Tube',
    typicalHsn: '300490',
    defaultGst: 12,
    description: 'Hydro-alcoholic topical pain and mouth ulcer gels'
  },
  'Food Product': {
    name: 'Food Product',
    key: 'food product',
    icon: Coffee,
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-800',
    badgeBorder: 'border-orange-200',
    iconColor: 'text-orange-600',
    defaultUnit: 'Tin / Pack',
    typicalHsn: '210690',
    defaultGst: 18,
    description: 'Specialized clinical nutrition, health drinks, & diabetes care'
  },
  'Feeding Bottle': {
    name: 'Feeding Bottle',
    key: 'feeding bottle',
    icon: Package,
    badgeBg: 'bg-pink-50',
    badgeText: 'text-pink-800',
    badgeBorder: 'border-pink-200',
    iconColor: 'text-pink-600',
    defaultUnit: 'Piece',
    typicalHsn: '392410',
    defaultGst: 12,
    description: 'Anti-colic infant nursing bottles, teats & glass bottles'
  },
  Machine: {
    name: 'Machine',
    key: 'machine',
    icon: Activity,
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-300',
    iconColor: 'text-slate-700',
    defaultUnit: 'Device / Kit',
    typicalHsn: '901890',
    defaultGst: 18,
    description: 'BP monitors, glucometers, nebulizers & diagnostic machines'
  },
  Candy: {
    name: 'Candy',
    key: 'candy',
    icon: Candy,
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-200',
    iconColor: 'text-rose-600',
    defaultUnit: 'Pack / Jar',
    typicalHsn: '300490',
    defaultGst: 12,
    description: 'Throat lozenges, herbal drops & sore throat candies'
  },
  Chocolate: {
    name: 'Chocolate',
    key: 'chocolate',
    icon: Heart,
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    iconColor: 'text-amber-800',
    defaultUnit: 'Chunk / Box',
    typicalHsn: '300450',
    defaultGst: 12,
    description: 'Nutraceutical Vitamin D3 & probiotic chocolate formulations'
  },
  Oil: {
    name: 'Oil',
    key: 'oil',
    icon: Flame,
    badgeBg: 'bg-yellow-50',
    badgeText: 'text-yellow-800',
    badgeBorder: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    defaultUnit: 'Bottle / Tin',
    typicalHsn: '150910',
    defaultGst: 5,
    description: 'Baby massage olive oil, pure castor oil & badam oil'
  },
  Powder: {
    name: 'Powder',
    key: 'powder',
    icon: Wind,
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    defaultUnit: 'Sachet / Tin',
    typicalHsn: '300490',
    defaultGst: 12,
    description: 'WHO ORS rehydration powder, dusting powder & protein'
  },
  Drops: {
    name: 'Drops',
    key: 'drops',
    icon: Droplet,
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',
    iconColor: 'text-blue-600',
    defaultUnit: 'Dropper',
    typicalHsn: '300490',
    defaultGst: 12,
    description: 'Eye, ear, and nasal decongestant sterile drops'
  },
  Inhaler: {
    name: 'Inhaler',
    key: 'inhaler',
    icon: Wind,
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-800',
    badgeBorder: 'border-teal-200',
    iconColor: 'text-teal-600',
    defaultUnit: 'Canister (MDI)',
    typicalHsn: '300490',
    defaultGst: 12,
    description: 'Metered dose inhalers & rotacaps for asthma and COPD'
  },
  Spray: {
    name: 'Spray',
    key: 'spray',
    icon: Wind,
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-200',
    iconColor: 'text-rose-600',
    defaultUnit: 'Canister',
    typicalHsn: '300490',
    defaultGst: 12,
    description: 'Rapid aerosol pain relief & metered nasal sprays'
  },
  Biscuits: {
    name: 'Biscuits',
    key: 'biscuits',
    icon: Coffee,
    badgeBg: 'bg-stone-50',
    badgeText: 'text-stone-800',
    badgeBorder: 'border-stone-300',
    iconColor: 'text-stone-600',
    defaultUnit: 'Pack / Box',
    typicalHsn: '190531',
    defaultGst: 18,
    description: 'High-fiber oats digestive biscuits & diabetic nutrition'
  },
  Support: {
    name: 'Support',
    key: 'support',
    icon: Shield,
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-300',
    iconColor: 'text-slate-600',
    defaultUnit: 'Belt / Brace',
    typicalHsn: '902110',
    defaultGst: 12,
    description: 'Orthopedic belts, knee braces, cervical collars & binders'
  },
  Diaper: {
    name: 'Diaper',
    key: 'diaper',
    icon: Package,
    badgeBg: 'bg-fuchsia-50',
    badgeText: 'text-fuchsia-800',
    badgeBorder: 'border-fuchsia-200',
    iconColor: 'text-fuchsia-600',
    defaultUnit: 'Pack / Bag',
    typicalHsn: '961900',
    defaultGst: 12,
    description: 'Baby pant diapers, adult incontinence briefs & underpads'
  }
};

/**
 * Normalizes any form string to match the closest standard target form
 */
export const normalizeFormName = (rawForm?: string): string => {
  if (!rawForm) return 'Tablet';
  const clean = rawForm.trim().toLowerCase();

  for (const standard of TARGET_PRODUCT_FORMS) {
    if (standard.toLowerCase() === clean) return standard;
  }

  // Substring or variant matching
  if (clean.includes('inj') || clean.includes('vial') || clean.includes('ampoule') || clean.includes('infus')) return 'Injection';
  if (clean.includes('syrup') || clean.includes('suspension')) return 'Syrup';
  if (clean.includes('tab')) return 'Tablet';
  if (clean.includes('oint') || clean.includes('cream')) return 'Ointment';
  if (clean.includes('surg') || clean.includes('gauze') || clean.includes('bandage') || clean.includes('glove')) return 'Surgical';
  if (clean.includes('cap')) return 'Capsule';
  if (clean.includes('soap') || clean.includes('bar')) return 'Soap';
  if (clean.includes('shamp')) return 'Shampoo';
  if (clean.includes('mouth') || clean.includes('rinse') || clean.includes('gargle')) return 'Mouth Wash';
  if (clean.includes('gel')) return 'Gel';
  if (clean.includes('food') || clean.includes('nutri') || clean.includes('drink') || clean.includes('ensure') || clean.includes('horlicks')) return 'Food Product';
  if (clean.includes('bottle') || clean.includes('teat') || clean.includes('nipple')) return 'Feeding Bottle';
  if (clean.includes('mach') || clean.includes('monitor') || clean.includes('meter') || clean.includes('device') || clean.includes('nebulizer')) return 'Machine';
  if (clean.includes('cand') || clean.includes('lozenge')) return 'Candy';
  if (clean.includes('choc')) return 'Chocolate';
  if (clean.includes('oil') || clean.includes('thailam')) return 'Oil';
  if (clean.includes('powd') || clean.includes('ors') || clean.includes('sachet')) return 'Powder';
  if (clean.includes('drop')) return 'Drops';
  if (clean.includes('inh') || clean.includes('puff')) return 'Inhaler';
  if (clean.includes('spray')) return 'Spray';
  if (clean.includes('bisc') || clean.includes('diskette')) return 'Biscuits';
  if (clean.includes('supp') || clean.includes('belt') || clean.includes('brace') || clean.includes('collar')) return 'Support';
  if (clean.includes('diap') || clean.includes('pant') || clean.includes('underpad') || clean.includes('pad')) return 'Diaper';

  return rawForm;
};

/**
 * Returns configuration styling and metadata for any form
 */
export const getFormConfig = (formName?: string): FormConfig => {
  const norm = normalizeFormName(formName);
  if (PRODUCT_FORM_CONFIGS[norm]) {
    return PRODUCT_FORM_CONFIGS[norm];
  }
  return {
    name: norm || 'General',
    key: (norm || 'general').toLowerCase(),
    icon: Pill,
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-200',
    iconColor: 'text-slate-600',
    defaultUnit: 'Unit',
    typicalHsn: '300490',
    defaultGst: 12,
    description: 'Pharmaceutical & Healthcare inventory'
  };
};
