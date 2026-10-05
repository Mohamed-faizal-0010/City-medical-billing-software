import { ShortLink } from '../types';

export const INITIAL_SHORT_LINKS: ShortLink[] = [
  {
    id: 'sl-1',
    code: 'pentose-40',
    domain: 'cityrx.link',
    shortUrl: 'https://cityrx.link/pentose-40',
    originalUrl: '/medicine/med-gen-1',
    title: 'Pentose 40 Tablet - Composition, Stock & Pricing',
    category: 'medicine',
    metadata: {
      medicineId: 'med-gen-1',
      medicineName: 'Pentose 40',
      genericName: 'Pantoprazole Gastro-resistant 40 mg',
      manufacturer: 'Hetero Healthcare / Generic Division',
      amount: 58.00,
      description: 'Gastric acid reflux & ulcer relief. Available at 40% discount.',
      tags: ['Acidity', 'PPI', 'Hetero', 'Pantoprazole', 'Generic']
    },
    clicks: 142,
    createdAt: '2026-09-01T10:30:00.000Z',
    isActive: true
  },
  {
    id: 'sl-2',
    code: 'rabalkem-dsr',
    domain: 'cityrx.link',
    shortUrl: 'https://cityrx.link/rabalkem-dsr',
    originalUrl: '/medicine/med-gen-3',
    title: 'Rabalkem-DSR Capsule - Alkem Generics',
    category: 'medicine',
    metadata: {
      medicineId: 'med-gen-3',
      medicineName: 'Rabalkem-DSR Capsule',
      genericName: 'Rabeprazole Sodium + Domperidone SR',
      manufacturer: 'Alkem Laboratories / Alkem Generics',
      amount: 125.00,
      description: 'Fast acting dual formula for acid reflux and indigestion.',
      tags: ['Acidity', 'Alkem', 'Rabeprazole', 'Domperidone']
    },
    clicks: 98,
    createdAt: '2026-09-02T11:15:00.000Z',
    isActive: true
  },
  {
    id: 'sl-3',
    code: 'pan-40',
    domain: 'cityrx.link',
    shortUrl: 'https://cityrx.link/pan-40',
    originalUrl: '/medicine/med-10',
    title: 'Pan 40 Tablet & Generic Alternatives',
    category: 'medicine',
    metadata: {
      medicineId: 'med-10',
      medicineName: 'Pan 40',
      genericName: 'Pantoprazole Sodium Gastro-resistant 40 mg',
      manufacturer: 'Alkem Laboratories',
      amount: 155.00,
      description: 'Prescription brand with low-cost generic substitution options.',
      tags: ['Pan 40', 'Alkem', 'Generic Switch', 'Pantoprazole']
    },
    clicks: 215,
    createdAt: '2026-08-28T09:00:00.000Z',
    isActive: true
  },
  {
    id: 'sl-4',
    code: 'inv-2026-001',
    domain: 'cityrx.link',
    shortUrl: 'https://cityrx.link/inv-2026-001',
    originalUrl: '/invoice/INV-2026-001',
    title: 'Digital E-Bill: #INV-2026-001 (Priya Sundaram)',
    category: 'invoice',
    metadata: {
      invoiceId: 'INV-2026-001',
      patientName: 'Priya Sundaram',
      patientPhone: '+91 98421 77210',
      amount: 348.50,
      description: 'Tax Invoice from City Medical, Chokkalingapuram, Melur'
    },
    clicks: 8,
    createdAt: '2026-09-12T14:22:00.000Z',
    isActive: true
  },
  {
    id: 'sl-5',
    code: 'upload-rx',
    domain: 'cityrx.link',
    shortUrl: 'https://cityrx.link/upload-rx',
    originalUrl: '/portal/upload-prescription',
    title: 'Upload Doctor Prescription for Home Delivery in Melur',
    category: 'prescription',
    metadata: {
      description: 'Send prescription photo directly to registered pharmacist on WhatsApp',
      tags: ['Door Delivery', 'WhatsApp Rx', 'Melur Taluk', 'Madurai']
    },
    clicks: 340,
    createdAt: '2026-08-15T08:00:00.000Z',
    isActive: true
  },
  {
    id: 'sl-6',
    code: 'clinic-opd',
    domain: 'cityrx.link',
    shortUrl: 'https://cityrx.link/clinic-opd',
    originalUrl: '/clinic',
    title: 'City Medical OPD Clinic - Doctor Consultation Booking',
    category: 'website',
    metadata: {
      description: 'Daily General Medicine & Pediatric OPD timings and appointments at City Medical',
      tags: ['OPD', 'Doctor', 'Consultation', 'Token']
    },
    clicks: 187,
    createdAt: '2026-08-20T10:00:00.000Z',
    isActive: true
  },
  {
    id: 'sl-7',
    code: 'store-location',
    domain: 'cityrx.link',
    shortUrl: 'https://cityrx.link/store-location',
    originalUrl: 'https://maps.google.com/?q=Melur+Madurai+Tamil+Nadu',
    title: 'City Medical Store Location & Google Maps Directions',
    category: 'website',
    metadata: {
      description: 'Chokkalingapuram, Melur Taluk, Madurai District - 625106',
      tags: ['Location', 'Map', 'Directions', 'Melur']
    },
    clicks: 412,
    createdAt: '2026-08-10T12:00:00.000Z',
    isActive: true
  },
  {
    id: 'sl-8',
    code: 'whatsapp-order',
    domain: 'cityrx.link',
    shortUrl: 'https://cityrx.link/whatsapp-order',
    originalUrl: 'https://wa.me/919842187654?text=Hi%20City%20Medical,%20I%20would%20like%20to%20order%20medicines',
    title: 'Instant WhatsApp Medicine Order & Pharmacist Chat',
    category: 'website',
    metadata: {
      description: 'Chat directly with registered pharmacist on WhatsApp (+91 98421 87654)',
      tags: ['WhatsApp', 'Chat', 'Order', 'Direct']
    },
    clicks: 580,
    createdAt: '2026-08-01T09:00:00.000Z',
    isActive: true
  }
];

export interface SearchEnginePortal {
  id: string;
  name: string;
  category: 'Indian Pharmacy' | 'Clinical Reference' | 'Regulatory & Salts' | 'Store Portal';
  description: string;
  iconName: string;
  badge: string;
  searchUrlTemplate: string; // url with {{QUERY}}
  homepageUrl: string;
}

export const EXTERNAL_SEARCH_ENGINES: SearchEnginePortal[] = [
  {
    id: 'tata-1mg',
    name: 'Tata 1mg Drug Index',
    category: 'Indian Pharmacy',
    description: 'Comprehensive Indian drug prices, salt compositions, side effects & manufacturers',
    iconName: 'Pill',
    badge: 'India #1',
    searchUrlTemplate: 'https://www.1mg.com/search/all?name={{QUERY}}',
    homepageUrl: 'https://www.1mg.com'
  },
  {
    id: 'netmeds',
    name: 'Netmeds Pharmacy Portal',
    category: 'Indian Pharmacy',
    description: 'Search branded & generic medicines, MRP, manufacturer and packaging',
    iconName: 'ShoppingBag',
    badge: 'Pan-India',
    searchUrlTemplate: 'https://www.netmeds.com/catalogsearch/result?q={{QUERY}}',
    homepageUrl: 'https://www.netmeds.com'
  },
  {
    id: 'pharmeasy',
    name: 'PharmEasy Drug Search',
    category: 'Indian Pharmacy',
    description: 'Alternative medicine brand finder and therapeutic dosage catalog',
    iconName: 'Boxes',
    badge: 'Popular',
    searchUrlTemplate: 'https://pharmeasy.in/search/all?name={{QUERY}}',
    homepageUrl: 'https://pharmeasy.in'
  },
  {
    id: 'drugs-com',
    name: 'Drugs.com Global Database',
    category: 'Clinical Reference',
    description: 'International drug information, interaction checker, and active molecule guides',
    iconName: 'BookOpen',
    badge: 'Clinical',
    searchUrlTemplate: 'https://www.drugs.com/search.php?searchterm={{QUERY}}',
    homepageUrl: 'https://www.drugs.com'
  },
  {
    id: 'medscape',
    name: 'Medscape Drug Reference',
    category: 'Clinical Reference',
    description: 'Peer-reviewed clinical monographs, dosing for adult/pediatric, adverse effects',
    iconName: 'Stethoscope',
    badge: 'Physicians',
    searchUrlTemplate: 'https://reference.medscape.com/search?q={{QUERY}}',
    homepageUrl: 'https://reference.medscape.com'
  },
  {
    id: 'cdsco',
    name: 'CDSCO India (SUGAM Portal)',
    category: 'Regulatory & Salts',
    description: 'Central Drugs Standard Control Organisation official approved drug listings & fixed dose combinations',
    iconName: 'ShieldCheck',
    badge: 'Govt. of India',
    searchUrlTemplate: 'https://cdsco.gov.in/opencms/opencms/en/Home/',
    homepageUrl: 'https://cdsco.gov.in'
  }
];
