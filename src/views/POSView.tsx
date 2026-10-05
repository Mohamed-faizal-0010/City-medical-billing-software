import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  Stethoscope,
  AlertTriangle,
  Sparkles,
  Tag,
  CreditCard,
  QrCode,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Pill,
  Maximize2,
  Minimize2,
  Printer,
  FileText,
  Clock,
  Archive,
  Save,
  RotateCcw,
  Smartphone,
  ShieldCheck,
  Check,
  MapPin,
  HelpCircle,
  Split,
  Send,
  MessageCircle,
  Receipt,
  Download,
  Phone,
  Banknote,
  UserPlus,
  PhoneCall,
  Boxes,
  X,
  Scan,
  Barcode,
  Volume2,
  VolumeX,
  Edit2,
  Monitor,
  RefreshCw,
  Store,
  Building2,
  Truck,
  Briefcase,
  ShieldAlert,
  Zap,
  FileCheck
} from 'lucide-react';
import { Medicine, Batch, CartItem, Patient, Doctor, SaleTransaction, User as UserType, SalesDraft, WholesaleBuyer, PharmacyBusinessType } from '../types';
import { StorageService } from '../services/storage';
import { exportThermalReceiptToPDF, exportThermalSlipToText } from '../utils/exportUtils';
import { printDirectBill } from '../utils/printDirectUtils';
import { POSCheckoutModal } from '../components/POSCheckoutModal';
import { ConfirmRetailSaleModal } from '../components/ConfirmRetailSaleModal';
import { DynamicUpiQrGenerator } from '../components/DynamicUpiQrGenerator';
import { NewWalkInCustomerModal } from '../components/NewWalkInCustomerModal';
import { AddWholesaleBuyerModal } from '../components/AddWholesaleBuyerModal';
import { PrintInvoiceModal } from '../components/PrintInvoiceModal';
import { MobileAppDownloadModal } from '../components/MobileAppDownloadModal';
import { DesktopDownloadModal } from '../components/DesktopDownloadModal';
import { LowStockNotificationBanner } from '../components/LowStockNotificationBanner';
import { SalesDraftsModal } from '../components/SalesDraftsModal';
import { ConnectPrinterModal } from '../components/ConnectPrinterModal';
import { EditGstinModal } from '../components/EditGstinModal';
import { EditQrCodeModal } from '../components/EditQrCodeModal';
import { PharmacyLogo } from '../components/PharmacyLogo';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { SpeechService } from '../services/voiceService';
import { BarcodeScannerGuideModal } from '../components/BarcodeScannerGuideModal';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { ScannerAudio } from '../utils/scannerAudio';
import { DateMonthYearPicker } from '../components/DateMonthYearPicker';
import { TotalDiscountEditModal } from '../components/TotalDiscountEditModal';
import { formatDateDMY, formatExpiryDMY } from '../utils/dateUtils';
import { copyToClipboardSafely } from '../utils/billShareUtils';
import { getMedicineScheduleInfo } from '../utils/scheduleDrugUtils';
import {
  getPackDetails,
  formatStockDisplay,
  calculateLinePricing,
  formatQuantityWithUnit
} from '../utils/packUtils';

interface POSViewProps {
  medicines: Medicine[];
  patients: Patient[];
  doctors: Doctor[];
  onTransactionComplete: (tx: SaleTransaction) => void;
  onOpenGenericsModal: (medicine: Medicine) => void;
  initialPatientId?: string;
  initialDoctorId?: string;
  initialCart?: CartItem[];
  consultationId?: string;
  currentUser?: UserType | null;
  onNavigateToPurchases?: (medicineId?: string, qty?: number) => void;
  onNavigateToInventory?: () => void;
}

export const POSView: React.FC<POSViewProps> = ({
  medicines,
  patients,
  doctors,
  onTransactionComplete,
  onOpenGenericsModal,
  initialPatientId,
  initialDoctorId,
  initialCart,
  consultationId,
  currentUser,
  onNavigateToPurchases,
  onNavigateToInventory
}) => {
  // Core Sale Cart & Customer state
  const [cart, setCart] = useState<CartItem[]>(initialCart || []);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId || '');
  const [patientList, setPatientList] = useState<Patient[]>(patients);

  useEffect(() => {
    setPatientList(patients);
  }, [patients]);

  // Fast Product Search Input State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedSearchIdx, setSelectedSearchIdx] = useState(0);

  // Fullscreen mode state
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Modals & Payment Method
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showConfirmRetailSaleModal, setShowConfirmRetailSaleModal] = useState(false);
  const [showDynamicUpiModal, setShowDynamicUpiModal] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<'Cash' | 'Split' | 'UPI' | 'Card'>('Cash');
  const [walkInName, setWalkInName] = useState('Walk-in Customer');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInAge, setWalkInAge] = useState('');
  const [walkInLocation, setWalkInLocation] = useState('');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showConnectPrinterModal, setShowConnectPrinterModal] = useState(false);
  const [showEditGstinModal, setShowEditGstinModal] = useState(false);
  const [showEditQrCodeModal, setShowEditQrCodeModal] = useState(false);
  const [pharmacyProfile, setPharmacyProfile] = useState(() => StorageService.getPharmacyProfile());
  const [printerSettings, setPrinterSettings] = useState(() => StorageService.getPrinterSettings());

  useEffect(() => {
    const handleProfileUpdated = (e: any) => {
      setPharmacyProfile(e.detail || StorageService.getPharmacyProfile());
    };
    const handlePrinterUpdated = (e: any) => {
      setPrinterSettings(e.detail || StorageService.getPrinterSettings());
    };
    window.addEventListener('pharmacy:profile-updated', handleProfileUpdated);
    window.addEventListener('pharmacy:printer-updated', handlePrinterUpdated);
    return () => {
      window.removeEventListener('pharmacy:profile-updated', handleProfileUpdated);
      window.removeEventListener('pharmacy:printer-updated', handlePrinterUpdated);
    };
  }, []);
  const [lastTransactionForPrint, setLastTransactionForPrint] = useState<SaleTransaction | null>(null);
  const [showMobileAppModal, setShowMobileAppModal] = useState(false);
  const [showDesktopAppModal, setShowDesktopAppModal] = useState(false);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [activeGenericMed, setActiveGenericMed] = useState<Medicine | null>(null);

  // Business Operating Mode (Retail vs Wholesale)
  const [posMode, setPosMode] = useState<'retail' | 'wholesale'>(() => StorageService.getActivePOSMode());
  const [wholesaleBuyers, setWholesaleBuyers] = useState<WholesaleBuyer[]>(() => StorageService.getWholesaleBuyers());
  const [selectedWholesaleBuyerId, setSelectedWholesaleBuyerId] = useState<string>(() => {
    const list = StorageService.getWholesaleBuyers();
    return list.length > 0 ? list[0].id : '';
  });
  const [showAddWholesaleBuyerModal, setShowAddWholesaleBuyerModal] = useState(false);
  const [wholesaleTransportMode, setWholesaleTransportMode] = useState('Local Delivery / Direct');
  const [wholesaleVehicleNo, setWholesaleVehicleNo] = useState('TN-59-AX-4820');
  const [wholesaleEwayBill, setWholesaleEwayBill] = useState('');

  const selectedWholesaleBuyer = useMemo(() => {
    return wholesaleBuyers.find(b => b.id === selectedWholesaleBuyerId) || wholesaleBuyers[0] || null;
  }, [wholesaleBuyers, selectedWholesaleBuyerId]);

  useEffect(() => {
    const handleModeChanged = (e: any) => {
      if (e.detail && (e.detail === 'retail' || e.detail === 'wholesale')) {
        setPosMode(e.detail);
      }
    };
    const handleBuyersUpdated = (e: any) => {
      if (e.detail) setWholesaleBuyers(e.detail);
    };
    window.addEventListener('pharmacy:pos-mode-changed', handleModeChanged);
    window.addEventListener('pharmacy:wholesale-buyers-updated', handleBuyersUpdated);
    return () => {
      window.removeEventListener('pharmacy:pos-mode-changed', handleModeChanged);
      window.removeEventListener('pharmacy:wholesale-buyers-updated', handleBuyersUpdated);
    };
  }, []);

  const handleTogglePosMode = (newMode: 'retail' | 'wholesale') => {
    setPosMode(newMode);
    StorageService.setActivePOSMode(newMode);

    // Update cart pricing to match mode
    setCart(prev => prev.map(item => {
      if (newMode === 'wholesale') {
        const ptrPrice = item.selectedBatch.ptr || item.selectedBatch.wholesalePrice || item.medicine.ptr || item.medicine.wholesaleRate || Number((item.selectedBatch.costPrice * (1 + (pharmacyProfile.wholesaleDefaultMargin || 12) / 100)).toFixed(2));
        return {
          ...item,
          customMrp: ptrPrice,
          wholesaleRate: ptrPrice,
          isWholesaleRate: true
        };
      } else {
        return {
          ...item,
          customMrp: item.selectedBatch.sellingPrice,
          isWholesaleRate: false
        };
      }
    }));
  };

  const nextInvoiceNo = useMemo(() => StorageService.getNextInvoiceNumber(), [cart.length, lastTransactionForPrint]);

  // Barcode Scanner Listener & Feedback State
  const [showScannerGuideModal, setShowScannerGuideModal] = useState(false);
  const [scannerSoundEnabled, setScannerSoundEnabled] = useState(true);
  const [scanFeedback, setScanFeedback] = useState<{
    type: 'success' | 'increment' | 'warning' | 'error';
    message: string;
    subtext?: string;
    barcode: string;
    timestamp: number;
  } | null>(null);

  // Loose Quantity Dispensing modal & state
  const [showLooseModal, setShowLooseModal] = useState(false);
  const [looseModalMedicine, setLooseModalMedicine] = useState<Medicine | null>(null);
  const [looseModalBatch, setLooseModalBatch] = useState<Batch | null>(null);
  const [looseModalQty, setLooseModalQty] = useState<number>(4);
  const [looseModalDiscount, setLooseModalDiscount] = useState<number>(0);

  // Sales Drafts system
  const [salesDrafts, setSalesDrafts] = useState<SalesDraft[]>(() => {
    return StorageService.getSalesDrafts();
  });

  const refreshSalesDrafts = () => {
    setSalesDrafts(StorageService.getSalesDrafts());
  };

  // Fast search input ref
  const searchInputRef = useRef<HTMLInputElement>(null);
  const patientSelectRef = useRef<HTMLSelectElement>(null);
  const doctorSelectRef = useRef<HTMLSelectElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Customer Phone input ref & auto-lookup dropdown state
  const customerPhoneInputRef = useRef<HTMLInputElement>(null);
  const phoneDropdownRef = useRef<HTMLDivElement>(null);
  const [isPhoneDropdownOpen, setIsPhoneDropdownOpen] = useState(false);

  // Invoice / Bill Date (Date/Month/Year model)
  const [invoiceDate, setInvoiceDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Total Discount editing & bill-level discount state
  const [extraBillDiscount, setExtraBillDiscount] = useState<number>(0);
  const [showTotalDiscountModal, setShowTotalDiscountModal] = useState<boolean>(false);

  // Sales Product Entry Box (Box • Strip • Loose Unit in Same Window - No separate window needed)
  const [productEntryMode, setProductEntryMode] = useState<'pick' | 'manual'>('pick');
  const [activeEntryMedId, setActiveEntryMedId] = useState<string>('');
  const [activeEntryBatchNo, setActiveEntryBatchNo] = useState<string>('');
  const [entryBoxQty, setEntryBoxQty] = useState<string>('');
  const [entryStripQty, setEntryStripQty] = useState<string>('');
  const [entryLooseQty, setEntryLooseQty] = useState<string>('');

  // Manual Product Entry fields
  const [manualProdName, setManualProdName] = useState<string>('');
  const [manualGenericName, setManualGenericName] = useState<string>('');
  const [manualBatchNo, setManualBatchNo] = useState<string>('');
  const [manualExpiry, setManualExpiry] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split('T')[0];
  });
  const [manualMrp, setManualMrp] = useState<string>('');
  const [manualPackSize, setManualPackSize] = useState<string>('10');
  const [manualRack, setManualRack] = useState<string>('Rack A-01');
  const [manualDiscount, setManualDiscount] = useState<string>('0');
  const [manualSuggestions, setManualSuggestions] = useState<Medicine[]>([]);
  const [showManualSuggestions, setShowManualSuggestions] = useState<boolean>(false);

  // Pick mode custom batch toggle & search filter
  const [isPickCustomBatch, setIsPickCustomBatch] = useState<boolean>(false);
  const [pickCustomBatchNo, setPickCustomBatchNo] = useState<string>('');
  const [pickCustomExpiry, setPickCustomExpiry] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split('T')[0];
  });
  const [pickCustomMrp, setPickCustomMrp] = useState<string>('');
  const [pickFilterQuery, setPickFilterQuery] = useState<string>('');

  // Default active entry medicine to first available medicine
  useEffect(() => {
    if (!activeEntryMedId && medicines.length > 0) {
      setActiveEntryMedId(medicines[0].id);
      if (medicines[0].batches && medicines[0].batches[0]) {
        setActiveEntryBatchNo(medicines[0].batches[0].batchNumber);
      }
    }
  }, [medicines, activeEntryMedId]);

  const currentEntryMedicine = useMemo(() => {
    return medicines.find(m => m.id === activeEntryMedId) || medicines[0] || null;
  }, [medicines, activeEntryMedId]);

  const currentEntryPackInfo = useMemo(() => {
    return currentEntryMedicine ? getPackDetails(currentEntryMedicine) : null;
  }, [currentEntryMedicine]);

  const pickFilteredMedicines = useMemo(() => {
    if (!pickFilterQuery.trim()) return medicines;
    const q = pickFilterQuery.toLowerCase().trim();
    return medicines.filter(
      m => m.name.toLowerCase().includes(q) ||
           m.genericName.toLowerCase().includes(q) ||
           (m.rackLocation || '').toLowerCase().includes(q)
    );
  }, [medicines, pickFilterQuery]);

  useEffect(() => {
    if (initialPatientId) setSelectedPatientId(initialPatientId);
    if (initialDoctorId) setSelectedDoctorId(initialDoctorId);
    if (initialCart && initialCart.length > 0) setCart(initialCart);
  }, [initialPatientId, initialDoctorId, initialCart]);

  // Sync selected patient info into walk-in customer fields
  useEffect(() => {
    if (selectedPatientId) {
      const cur = patientList.find(p => p.id === selectedPatientId);
      if (cur) {
        setWalkInName(cur.name);
        setWalkInPhone(cur.phone || '');
        setWalkInAge(cur.age ? String(cur.age) : '');
        setWalkInLocation(cur.address || '');
      }
    }
  }, [selectedPatientId, patientList]);

  // Close phone dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        phoneDropdownRef.current &&
        !phoneDropdownRef.current.contains(event.target as Node) &&
        customerPhoneInputRef.current &&
        !customerPhoneInputRef.current.contains(event.target as Node)
      ) {
        setIsPhoneDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedPatient = useMemo(() => {
    return patientList.find(p => p.id === selectedPatientId) || null;
  }, [patientList, selectedPatientId]);

  const selectedDoctor = useMemo(() => {
    return doctors.find(d => d.id === selectedDoctorId) || null;
  }, [doctors, selectedDoctorId]);

  // Autocomplete matching medicines for fast entry
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return medicines
      .filter(med => {
        const matchesName = med.name.toLowerCase().includes(q);
        const matchesGen = med.genericName.toLowerCase().includes(q);
        const matchesMfr = med.manufacturer.toLowerCase().includes(q);
        const matchesCategory = med.category.toLowerCase().includes(q);
        const matchesRack = (med.rackLocation || '').toLowerCase().includes(q);
        const matchesBatch = med.batches.some(b => b.batchNumber.toLowerCase().includes(q));
        const matchesBarcode = (med.barcode && med.barcode.toLowerCase().includes(q)) ||
          med.id.toLowerCase().includes(q) ||
          med.batches.some(b => b.barcode && b.barcode.toLowerCase().includes(q));
        return matchesName || matchesGen || matchesMfr || matchesCategory || matchesRack || matchesBatch || matchesBarcode;
      })
      .slice(0, 10);
  }, [medicines, searchQuery]);

  // Reset selected search index on query change
  useEffect(() => {
    setSelectedSearchIdx(0);
  }, [searchQuery]);

  // Check for patient drug allergies in real-time
  const patientAllergyWarnings = useMemo(() => {
    const allergies = Array.isArray(selectedPatient?.allergies) 
      ? selectedPatient.allergies 
      : (Array.isArray(selectedPatient?.drugAllergies) ? selectedPatient.drugAllergies : []);
    if (!selectedPatient || allergies.length === 0) return [];
    const warnings: string[] = [];

    cart.forEach(item => {
      const medName = item.medicine.name.toLowerCase();
      const generic = item.medicine.genericName.toLowerCase();

      allergies.forEach(allergy => {
        const aLower = allergy.toLowerCase();
        if (
          (aLower.includes('penicillin') && (medName.includes('augmentin') || generic.includes('amoxicillin'))) ||
          (aLower.includes('aspirin') && (generic.includes('aspirin') || generic.includes('nsaid'))) ||
          (aLower.includes('sulfa') && (generic.includes('sulf') || generic.includes('bactrim')))
        ) {
          warnings.push(`Warning: ${selectedPatient.name} is allergic to "${allergy}". ${item.medicine.name} (${item.medicine.genericName}) is in active cart!`);
        }
      });
    });

    return warnings;
  }, [selectedPatient, cart]);

  // Mandatory Schedule H1 Compliance: Identify items in cart subject to Rule 65(9) Prescription requirement
  const scheduleH1CartItems = useMemo(() => {
    return cart.filter(item => {
      const info = getMedicineScheduleInfo(item.medicine);
      return info.scheduleType === 'H1';
    });
  }, [cart]);

  // Cart financial totals (with exact box/strip/loose arithmetic)
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const packInfo = getPackDetails(item.medicine);
      const pricing = calculateLinePricing({
        unitType: item.unitType,
        quantity: item.quantity,
        boxQuantity: item.boxQuantity,
        stripQuantity: item.stripQuantity,
        looseQuantity: item.looseQuantity,
        packSize: item.packSize || packInfo.packSize,
        boxSize: item.boxSize,
        customMrp: item.customMrp,
        sellingPrice: item.selectedBatch.sellingPrice,
        discountPercent: item.discountPercent
      });
      return sum + pricing.grossAmount;
    }, 0);
  }, [cart]);

  const lineItemDiscount = useMemo(() => {
    return cart.reduce((sum, item) => {
      const packInfo = getPackDetails(item.medicine);
      const pricing = calculateLinePricing({
        unitType: item.unitType,
        quantity: item.quantity,
        boxQuantity: item.boxQuantity,
        stripQuantity: item.stripQuantity,
        looseQuantity: item.looseQuantity,
        packSize: item.packSize || packInfo.packSize,
        boxSize: item.boxSize,
        customMrp: item.customMrp,
        sellingPrice: item.selectedBatch.sellingPrice,
        discountPercent: item.discountPercent
      });
      return sum + pricing.discountAmount;
    }, 0);
  }, [cart]);

  // Total Discount: Sum of all item-level discounts plus any extra bill-level cash discount
  const totalDiscount = lineItemDiscount + extraBillDiscount;

  const netAfterDiscount = Math.max(0, subtotal - totalDiscount);

  // Handle Total Discount Edit Application
  const handleApplyTotalDiscount = ({
    mode,
    value,
    distribution
  }: {
    mode: 'percent' | 'amount';
    value: number;
    distribution: 'proportional' | 'bill_level';
  }) => {
    if (cart.length === 0) {
      alert('Cart is empty. Add medicines first to apply discount.');
      return;
    }

    if (distribution === 'bill_level') {
      const calculatedAmt = mode === 'percent' ? (subtotal * value) / 100 : value;
      setExtraBillDiscount(Math.min(subtotal, Math.max(0, calculatedAmt)));
    } else {
      setExtraBillDiscount(0);
      const targetPercent =
        mode === 'percent' ? value : subtotal > 0 ? (value / subtotal) * 100 : 0;
      setCart(prev =>
        prev.map(item => ({
          ...item,
          discountPercent: Math.min(100, Math.max(0, parseFloat(targetPercent.toFixed(2))))
        }))
      );
    }
  };

  const totalTax = useMemo(() => {
    return cart.reduce((sum, item) => {
      const packInfo = getPackDetails(item.medicine);
      const pricing = calculateLinePricing({
        unitType: item.unitType,
        quantity: item.quantity,
        boxQuantity: item.boxQuantity,
        stripQuantity: item.stripQuantity,
        looseQuantity: item.looseQuantity,
        packSize: item.packSize || packInfo.packSize,
        boxSize: item.boxSize,
        customMrp: item.customMrp,
        sellingPrice: item.selectedBatch.sellingPrice,
        discountPercent: item.discountPercent
      });
      return sum + (pricing.netAmount * item.medicine.taxRate) / (100 + item.medicine.taxRate);
    }, 0);
  }, [cart]);

  const grandTotal = netAfterDiscount;
  const totalUnits = useMemo(() => {
    return cart.reduce((sum, item) => {
      if (item.unitType === 'loose') {
        return sum + (item.looseQuantity || 1);
      }
      return sum + item.quantity;
    }, 0);
  }, [cart]);

  // Add Loose Unit directly in the same window (no separate modal window needed)
  const handleOpenLooseModal = (medicine: Medicine, customBatch?: Batch) => {
    const packInfo = getPackDetails(medicine);
    const availableBatches = [...medicine.batches]
      .filter(b => b.stock > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    const batchToUse = customBatch || availableBatches[0] || medicine.batches[0];
    handleAddToCart(medicine, batchToUse, 'loose', 1);
    setScanFeedback({
      type: 'success',
      message: `Added 1 Loose ${packInfo.unitName} of ${medicine.name} in same window`
    });
    setTimeout(() => setScanFeedback(null), 3000);
  };

  const handleConfirmLooseModal = () => {
    if (!looseModalMedicine || !looseModalBatch) return;
    const packInfo = getPackDetails(looseModalMedicine);
    const maxTabs = Math.round(looseModalBatch.stock * packInfo.packSize);
    if (looseModalQty > maxTabs) {
      alert(`Only ${maxTabs} ${packInfo.unitName}s available in batch ${looseModalBatch.batchNumber}`);
      return;
    }
    handleAddToCart(looseModalMedicine, looseModalBatch, 'loose', looseModalQty, looseModalDiscount);
    setShowLooseModal(false);
  };

  // Add medicine to line with FEFO default batch and support for pack vs loose selling
  const handleAddToCart = (
    medicine: Medicine,
    customBatch?: Batch,
    unitType: 'pack' | 'loose' = 'pack',
    initialLooseQty?: number,
    initialDiscount?: number
  ) => {
    const packInfo = getPackDetails(medicine);
    const availableBatches = [...medicine.batches]
      .filter(b => b.stock > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    if (availableBatches.length === 0) {
      alert(`No active stock currently available for ${medicine.name}`);
      return;
    }

    const batchToUse = customBatch || availableBatches[0];
    const effectiveUnitType = (unitType === 'loose' && packInfo.isLooseSellable) ? 'loose' : 'pack';
    const looseQty = initialLooseQty && initialLooseQty > 0 ? initialLooseQty : (effectiveUnitType === 'loose' ? 1 : undefined);

    setCart(prev => {
      const existingIdx = prev.findIndex(
        item => item.medicine.id === medicine.id &&
                item.selectedBatch.batchNumber === batchToUse.batchNumber &&
                (item.unitType || 'pack') === effectiveUnitType
      );

      if (existingIdx >= 0) {
        const item = prev[existingIdx];
        if (effectiveUnitType === 'loose') {
          const currentLoose = item.looseQuantity || 1;
          const maxLoose = Math.round(batchToUse.stock * packInfo.packSize);
          const addQty = initialLooseQty || 1;
          if (currentLoose + addQty > maxLoose) {
            alert(`Max available loose stock in batch ${batchToUse.batchNumber} is ${maxLoose} ${packInfo.unitName}s`);
            return prev;
          }
          const updated = [...prev];
          const newLoose = currentLoose + addQty;
          updated[existingIdx] = {
            ...item,
            boxQuantity: 0,
            stripQuantity: 0,
            looseQuantity: newLoose,
            quantity: Number((newLoose / packInfo.packSize).toFixed(4)),
            discountPercent: initialDiscount !== undefined ? initialDiscount : item.discountPercent
          };
          return updated;
        } else {
          if (item.quantity >= batchToUse.stock) {
            alert(`Max available stock in batch ${batchToUse.batchNumber} is ${batchToUse.stock} ${packInfo.packName}s`);
            return prev;
          }
          const updated = [...prev];
          const nextStrip = (item.stripQuantity !== undefined ? item.stripQuantity : Math.floor(item.quantity || 1)) + 1;
          updated[existingIdx] = {
            ...item,
            stripQuantity: nextStrip,
            quantity: nextStrip
          };
          return updated;
        }
      } else {
        const isWholesale = posMode === 'wholesale';
        const ptrPrice = batchToUse.ptr || batchToUse.wholesalePrice || medicine.ptr || medicine.wholesaleRate || Number((batchToUse.costPrice * (1 + (pharmacyProfile.wholesaleDefaultMargin || 12) / 100)).toFixed(2));
        const newItem: CartItem = {
          medicine,
          selectedBatch: batchToUse,
          quantity: effectiveUnitType === 'loose' ? Number(((looseQty || 1) / packInfo.packSize).toFixed(4)) : 1,
          discountPercent: initialDiscount !== undefined ? initialDiscount : 0,
          customMrp: isWholesale ? ptrPrice : batchToUse.sellingPrice,
          wholesaleRate: ptrPrice,
          isWholesaleRate: isWholesale,
          unitType: effectiveUnitType,
          packSize: packInfo.packSize,
          boxSize: medicine.boxSize || 10,
          boxQuantity: isWholesale ? 1 : 0,
          stripQuantity: isWholesale ? 0 : (effectiveUnitType === 'loose' ? 0 : 1),
          looseQuantity: effectiveUnitType === 'loose' ? (looseQty || 1) : 0,
          unitName: packInfo.unitName,
          packName: packInfo.packName,
          loosePrice: Number((batchToUse.sellingPrice / packInfo.packSize).toFixed(2))
        };
        return [...prev, newItem];
      }
    });

    setSearchQuery('');
    setIsSearchFocused(false);
  };

  // Directly add or update product with Box, Strip, and Loose Units all in the SAME window
  const handleAddProductWithBoxStripLoose = (
    medicine: Medicine,
    customBatch?: Batch,
    boxes: number = 0,
    strips: number = 0,
    looseUnits: number = 0,
    initialDiscountPercent: number = 0
  ) => {
    const packInfo = getPackDetails(medicine);
    const availableBatches = [...medicine.batches]
      .filter(b => b.stock > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    if (!customBatch && availableBatches.length === 0) {
      alert(`No active stock currently available for ${medicine.name}`);
      return;
    }

    const batchToUse = customBatch || availableBatches[0];
    const boxMultiplier = 10;
    const effBoxes = Math.max(0, boxes);
    const effStrips = Math.max(0, strips);
    const effLoose = Math.max(0, looseUnits);

    if (effBoxes === 0 && effStrips === 0 && effLoose === 0) {
      handleAddToCart(medicine, batchToUse, 'pack');
      return;
    }

    const totalPacksDeduction = (effBoxes * boxMultiplier) + effStrips + (effLoose / packInfo.packSize);
    if (batchToUse.stock !== undefined && totalPacksDeduction > batchToUse.stock) {
      alert(`Maximum stock in batch ${batchToUse.batchNumber} is ${batchToUse.stock} ${packInfo.packName}s. Requested quantity is ${totalPacksDeduction.toFixed(2)} ${packInfo.packName}s.`);
      return;
    }

    setCart(prev => {
      const existingIdx = prev.findIndex(
        item => item.medicine.id === medicine.id && item.selectedBatch.batchNumber === batchToUse.batchNumber
      );

      if (existingIdx >= 0) {
        const item = prev[existingIdx];
        const newBox = (item.boxQuantity || 0) + effBoxes;
        const newStrip = (item.stripQuantity !== undefined ? item.stripQuantity : (item.unitType !== 'loose' ? Math.floor(item.quantity || 1) : 0)) + effStrips;
        const newLoose = (item.looseQuantity || 0) + effLoose;
        const totalPacks = (newBox * boxMultiplier) + newStrip + (newLoose / packInfo.packSize);

        if (batchToUse.stock !== undefined && totalPacks > batchToUse.stock) {
          alert(`Cannot add: total exceeds available stock (${batchToUse.stock} ${packInfo.packName}s)`);
          return prev;
        }

        const updated = [...prev];
        updated[existingIdx] = {
          ...item,
          boxQuantity: newBox,
          stripQuantity: newStrip,
          looseQuantity: newLoose,
          quantity: Math.max(0.0001, totalPacks),
          unitType: (newLoose > 0 && newStrip === 0 && newBox === 0) ? 'loose' : 'pack',
          ...(initialDiscountPercent > 0 ? { discountPercent: initialDiscountPercent } : {})
        };
        return updated;
      } else {
        const newItem: CartItem = {
          medicine,
          selectedBatch: batchToUse,
          quantity: Math.max(0.0001, totalPacksDeduction),
          discountPercent: initialDiscountPercent || 0,
          customMrp: batchToUse.sellingPrice,
          unitType: (effLoose > 0 && effStrips === 0 && effBoxes === 0) ? 'loose' : 'pack',
          boxQuantity: effBoxes,
          stripQuantity: effStrips,
          looseQuantity: effLoose,
          packSize: packInfo.packSize,
          boxSize: boxMultiplier,
          unitName: packInfo.unitName,
          packName: packInfo.packName,
          loosePrice: Number((batchToUse.sellingPrice / packInfo.packSize).toFixed(2))
        };
        return [...prev, newItem];
      }
    });

    setSearchQuery('');
    setIsSearchFocused(false);
    setScanFeedback({
      type: 'success',
      message: `Added ${medicine.name} (${effBoxes > 0 ? `${effBoxes} Box ` : ''}${effStrips > 0 ? `${effStrips} Strip ` : ''}${effLoose > 0 ? `${effLoose} Loose` : ''}) directly to bill`
    });
    setTimeout(() => setScanFeedback(null), 3500);
  };

  const handleManualNameChange = (val: string) => {
    setManualProdName(val);
    if (!val.trim()) {
      setManualSuggestions([]);
      setShowManualSuggestions(false);
      return;
    }
    const q = val.toLowerCase().trim();
    const matches = medicines.filter(
      m => m.name.toLowerCase().includes(q) || m.genericName.toLowerCase().includes(q)
    ).slice(0, 6);
    setManualSuggestions(matches);
    setShowManualSuggestions(matches.length > 0);
  };

  const handleSelectManualSuggestion = (med: Medicine) => {
    setManualProdName(med.name);
    setManualGenericName(med.genericName);
    setManualRack(med.rackLocation || 'Rack A-01');
    setManualPackSize(String(med.packSize || 10));
    if (med.batches && med.batches.length > 0) {
      const b = med.batches[0];
      setManualBatchNo(b.batchNumber);
      setManualExpiry(b.expiryDate);
      setManualMrp(String(b.sellingPrice));
    }
    setShowManualSuggestions(false);
  };

  const handleCommitManualProductEntry = () => {
    const prodName = manualProdName.trim();
    if (!prodName) {
      alert('Please enter a product name for manual entry');
      return;
    }

    const bQty = parseInt(entryBoxQty) || 0;
    const lQty = parseInt(entryLooseQty) || 0;
    const sQty = entryStripQty !== '' ? (parseInt(entryStripQty) || 0) : (bQty === 0 && lQty === 0 ? 1 : 0);

    if (bQty === 0 && sQty === 0 && lQty === 0) {
      alert('Please enter at least 1 Box, Strip, or Loose Unit');
      return;
    }

    const pSize = Math.max(1, parseInt(manualPackSize) || 10);
    const parsedMrp = Math.max(0.01, parseFloat(manualMrp) || (currentEntryMedicine?.batches[0]?.sellingPrice || 50));
    const batchNum = manualBatchNo.trim().toUpperCase() || `BAT-${new Date().getFullYear().toString().slice(2)}${Math.floor(100 + Math.random() * 900)}`;
    const expDate = manualExpiry || '2028-12-31';
    const discPercent = Math.min(100, Math.max(0, parseFloat(manualDiscount) || 0));

    // Check if matches an existing medicine by name
    const existingMed = medicines.find(
      m => m.name.toLowerCase() === prodName.toLowerCase()
    );

    const medToUse: Medicine = existingMed ? {
      ...existingMed,
      name: prodName,
      genericName: manualGenericName.trim() || existingMed.genericName,
      rackLocation: manualRack.trim() || existingMed.rackLocation || 'Rack A-01',
      packSize: pSize
    } : {
      id: `MED-MANUAL-${Date.now()}`,
      name: prodName,
      genericName: manualGenericName.trim() || 'General Medical Item',
      strength: '',
      form: pSize > 1 ? 'Tablet' : 'Device',
      manufacturer: 'OTC / Standard',
      category: 'General',
      prescriptionRequired: false,
      hsnCode: '300490',
      taxRate: 12,
      minStockAlert: 5,
      pack: `${pSize} Units`,
      packSize: pSize,
      looseUnitName: pSize > 1 ? 'Tab' : 'Unit',
      rackLocation: manualRack.trim() || 'Rack A-01',
      batches: []
    };

    const batchToUse: Batch = {
      batchNumber: batchNum,
      expiryDate: expDate,
      manufacturingDate: new Date().toISOString().split('T')[0],
      costPrice: Number((parsedMrp * 0.7).toFixed(2)),
      sellingPrice: parsedMrp,
      mrp: parsedMrp,
      stock: 9999, // Non-blocking stock for manual entries
      location: manualRack.trim() || 'Rack A-01'
    };

    handleAddProductWithBoxStripLoose(medToUse, batchToUse, bQty, sQty, lQty, discPercent);

    // Reset fields
    setManualProdName('');
    setManualGenericName('');
    setManualBatchNo('');
    setManualMrp('');
    setManualDiscount('0');
    setEntryBoxQty('');
    setEntryStripQty('');
    setEntryLooseQty('');
    setShowManualSuggestions(false);
  };

  const handleCommitProductEntryBox = () => {
    if (productEntryMode === 'manual') {
      handleCommitManualProductEntry();
      return;
    }

    if (!currentEntryMedicine) return;

    let b: Batch;
    if (isPickCustomBatch) {
      const customBatchNum = pickCustomBatchNo.trim().toUpperCase() || `BAT-CUSTOM`;
      const customExp = pickCustomExpiry || '2028-12-31';
      const customMrpVal = parseFloat(pickCustomMrp) || (currentEntryMedicine.batches[0]?.sellingPrice || 50);
      b = {
        batchNumber: customBatchNum,
        expiryDate: customExp,
        manufacturingDate: new Date().toISOString().split('T')[0],
        costPrice: Number((customMrpVal * 0.7).toFixed(2)),
        sellingPrice: customMrpVal,
        mrp: customMrpVal,
        stock: 9999,
        location: currentEntryMedicine.rackLocation || 'Rack A-01'
      };
    } else {
      b = (currentEntryMedicine.batches || []).find(batch => batch.batchNumber === activeEntryBatchNo) || currentEntryMedicine.batches[0];
    }

    const bQty = parseInt(entryBoxQty) || 0;
    const lQty = parseInt(entryLooseQty) || 0;
    const sQty = entryStripQty !== '' ? (parseInt(entryStripQty) || 0) : (bQty === 0 && lQty === 0 ? 1 : 0);

    if (bQty === 0 && sQty === 0 && lQty === 0) {
      alert('Please enter at least 1 Box, Strip, or Loose Unit');
      return;
    }

    handleAddProductWithBoxStripLoose(currentEntryMedicine, b, bQty, sQty, lQty);
    setEntryBoxQty('');
    setEntryStripQty('');
    setEntryLooseQty('');
    if (isPickCustomBatch) {
      setPickCustomBatchNo('');
      setPickCustomMrp('');
      setIsPickCustomBatch(false);
    }
  };

  // Barcode Scanner handler: parses barcode, matches medicine/batch, and adds to cart
  const handleBarcodeScanned = useCallback((rawBarcode: string) => {
    const code = rawBarcode.trim();
    if (!code) return;

    const lowerCode = code.toLowerCase();

    // 1. Look for matching medicine and/or specific batch
    let matchedMed: Medicine | null = null;
    let matchedBatch: Batch | null = null;

    // A. Check if barcode matches a specific batch number or batch barcode
    for (const med of medicines) {
      for (const batch of med.batches) {
        if (
          batch.batchNumber.toLowerCase() === lowerCode ||
          (batch.barcode && batch.barcode.toLowerCase() === lowerCode)
        ) {
          matchedMed = med;
          matchedBatch = batch;
          break;
        }
      }
      if (matchedMed) break;
    }

    // B. Check if barcode matches medicine barcode, ID, or product SKU
    if (!matchedMed) {
      matchedMed = medicines.find(
        m => (m.barcode && m.barcode.toLowerCase() === lowerCode) ||
             m.id.toLowerCase() === lowerCode
      ) || null;
    }

    // C. Check exact medicine name or molecule/generic match
    if (!matchedMed) {
      matchedMed = medicines.find(
        m => m.name.toLowerCase() === lowerCode ||
             m.genericName.toLowerCase() === lowerCode
      ) || null;
    }

    // D. Check GS1 / DataMatrix substring match (e.g. batch number embedded in 2D barcode)
    if (!matchedMed && code.length > 5) {
      for (const med of medicines) {
        if (code.includes(med.id)) {
          matchedMed = med;
          break;
        }
        for (const b of med.batches) {
          if (code.includes(b.batchNumber)) {
            matchedMed = med;
            matchedBatch = b;
            break;
          }
        }
        if (matchedMed) break;
      }
    }

    // E. Fallback: match by HSN code or starting characters if length >= 3
    if (!matchedMed && code.length >= 3) {
      matchedMed = medicines.find(m =>
        m.name.toLowerCase().startsWith(lowerCode) ||
        m.genericName.toLowerCase().startsWith(lowerCode) ||
        m.hsnCode === code
      ) || null;
    }

    // Process matched medicine
    if (matchedMed) {
      const availableBatches = [...matchedMed.batches]
        .filter(b => b.stock > 0)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

      const targetBatch = matchedBatch && matchedBatch.stock > 0
        ? matchedBatch
        : (availableBatches[0] || matchedBatch || matchedMed.batches[0]);

      if (!targetBatch || targetBatch.stock <= 0) {
        ScannerAudio.playErrorBuzz();
        setScanFeedback({
          type: 'warning',
          message: `Out of Stock: ${matchedMed.name}`,
          subtext: `Batch ${targetBatch?.batchNumber || 'N/A'} has 0 available units in inventory.`,
          barcode: code,
          timestamp: Date.now()
        });
        return;
      }

      // Check if medicine with this batch is already in the cart
      const existingItem = cart.find(
        item => item.medicine.id === matchedMed!.id &&
                item.selectedBatch.batchNumber === targetBatch.batchNumber &&
                (item.unitType || 'pack') === 'pack'
      );

      // Add to cart
      handleAddToCart(matchedMed, targetBatch, 'pack');

      // Audible & visual feedback
      if (existingItem) {
        ScannerAudio.playIncrementBeep();
        const nextQty = existingItem.quantity + 1;
        setScanFeedback({
          type: 'increment',
          message: `Quantity: ${matchedMed.name} × ${nextQty}`,
          subtext: `Batch: ${targetBatch.batchNumber} • Rack: ${matchedMed.rackLocation || targetBatch.location || 'Rack A-01'}`,
          barcode: code,
          timestamp: Date.now()
        });
      } else {
        ScannerAudio.playSuccessBeep();
        setScanFeedback({
          type: 'success',
          message: `Scanned & Added: ${matchedMed.name}`,
          subtext: `Batch: ${targetBatch.batchNumber} • Exp: ${targetBatch.expiryDate.slice(2, 7)} • MRP: ₹${targetBatch.sellingPrice.toFixed(2)}`,
          barcode: code,
          timestamp: Date.now()
        });
      }

      SpeechService.speak(`Added ${matchedMed.name}`);
      setSearchQuery('');
      setIsSearchFocused(false);
    } else {
      // Barcode not recognized
      ScannerAudio.playErrorBuzz();
      setScanFeedback({
        type: 'error',
        message: `Barcode Not Recognized: "${code}"`,
        subtext: 'No medicine or batch found with this barcode. Placed in search bar.',
        barcode: code,
        timestamp: Date.now()
      });
      setSearchQuery(code);
      setIsSearchFocused(true);
    }
  }, [medicines, cart]);

  // Hardware barcode scanning listener
  const {
    lastScannedBarcode,
    scanCount,
    simulateScan
  } = useBarcodeScanner({
    onScan: handleBarcodeScanned,
    enabled: !showCheckoutModal && !showPrintModal && !showMobileAppModal && !showDynamicUpiModal
  });

  // Auto-dismiss scanner feedback toast after 3.8s
  useEffect(() => {
    if (!scanFeedback) return;
    const timer = setTimeout(() => {
      setScanFeedback(null);
    }, 3800);
    return () => clearTimeout(timer);
  }, [scanFeedback]);

  const handleToggleUnitType = (index: number, newType: 'pack' | 'loose') => {
    const item = cart[index];
    const packInfo = getPackDetails(item.medicine);
    if (newType === 'loose' && !packInfo.isLooseSellable) {
      alert(`${item.medicine.name} is not packaged for loose dispensing.`);
      return;
    }

    setCart(prev => {
      const updated = [...prev];
      if (newType === 'loose') {
        const looseQty = item.looseQuantity || Math.min(packInfo.packSize, 4);
        updated[index] = {
          ...item,
          unitType: 'loose',
          packSize: packInfo.packSize,
          unitName: packInfo.unitName,
          packName: packInfo.packName,
          boxQuantity: 0,
          stripQuantity: 0,
          looseQuantity: looseQty,
          quantity: Number((looseQty / packInfo.packSize).toFixed(4)),
          customMrp: item.selectedBatch.sellingPrice,
          loosePrice: Number((item.selectedBatch.sellingPrice / packInfo.packSize).toFixed(2))
        };
      } else {
        const packQty = Math.max(1, Math.ceil(item.quantity || 1));
        updated[index] = {
          ...item,
          unitType: 'pack',
          boxQuantity: 0,
          stripQuantity: Math.min(packQty, item.selectedBatch.stock),
          looseQuantity: 0,
          quantity: Math.min(packQty, item.selectedBatch.stock),
          customMrp: item.selectedBatch.sellingPrice
        };
      }
      return updated;
    });
  };

  const handleUpdateLooseQuantity = (index: number, newLooseQty: number) => {
    if (newLooseQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const item = cart[index];
    const packInfo = getPackDetails(item.medicine);
    const maxLoose = Math.round(item.selectedBatch.stock * packInfo.packSize);
    if (newLooseQty > maxLoose) {
      alert(`Maximum loose stock available in batch ${item.selectedBatch.batchNumber} is ${maxLoose} ${packInfo.unitName}s`);
      return;
    }
    setCart(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        looseQuantity: newLooseQty,
        quantity: Number((newLooseQty / packInfo.packSize).toFixed(4))
      };
      return updated;
    });
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const item = cart[index];
    if (newQty > item.selectedBatch.stock) {
      alert(`Maximum stock available in batch ${item.selectedBatch.batchNumber} is ${item.selectedBatch.stock}`);
      return;
    }
    setCart(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: newQty, stripQuantity: newQty };
      return updated;
    });
  };

  const handleUpdateBoxStripLoose = (
    index: number,
    field: 'box' | 'strip' | 'loose',
    value: number
  ) => {
    const item = cart[index];
    if (!item) return;
    const packInfo = getPackDetails(item.medicine);
    const boxMultiplier = item.boxSize || 10;
    const currentBox = item.boxQuantity || 0;
    const currentStrip = item.stripQuantity !== undefined ? item.stripQuantity : (item.unitType !== 'loose' ? Math.floor(item.quantity || 1) : 0);
    const currentLoose = item.looseQuantity !== undefined ? item.looseQuantity : (item.unitType === 'loose' ? Math.round((item.quantity || 0) * packInfo.packSize) : 0);

    let newBox = currentBox;
    let newStrip = currentStrip;
    let newLoose = currentLoose;

    if (field === 'box') newBox = Math.max(0, value);
    if (field === 'strip') newStrip = Math.max(0, value);
    if (field === 'loose') newLoose = Math.max(0, value);

    const totalPacksDeduction = (newBox * boxMultiplier) + newStrip + (newLoose / packInfo.packSize);
    if (totalPacksDeduction > item.selectedBatch.stock) {
      alert(`Maximum available stock in batch ${item.selectedBatch.batchNumber} is ${item.selectedBatch.stock} ${packInfo.packName}s`);
      return;
    }

    setCart(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        boxQuantity: newBox,
        stripQuantity: newStrip,
        looseQuantity: newLoose,
        quantity: Math.max(0, totalPacksDeduction),
        unitType: (newLoose > 0 && newStrip === 0 && newBox === 0) ? 'loose' : 'pack'
      };
      return updated;
    });
  };

  // Live matching patients for phone auto-suggest
  const matchingPatients = useMemo(() => {
    const q = (walkInPhone || '').trim();
    if (!q || q.length < 2) return [];
    const cleanDigits = q.replace(/\D/g, '');
    const lowerQ = q.toLowerCase();
    return patientList.filter(p => {
      const pDigits = (p.phone || '').replace(/\D/g, '');
      const phoneMatch = cleanDigits.length >= 2 && pDigits.includes(cleanDigits);
      const nameMatch = (p.name || '').toLowerCase().includes(lowerQ);
      return phoneMatch || nameMatch;
    }).slice(0, 6);
  }, [patientList, walkInPhone]);

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setWalkInPhone(raw);
    setIsPhoneDropdownOpen(true);

    const clean = raw.replace(/\D/g, '');
    if (clean.length === 10) {
      const found = patientList.find(p => (p.phone || '').replace(/\D/g, '').endsWith(clean));
      if (found) {
        setSelectedPatientId(found.id);
        setWalkInName(found.name);
        setWalkInAge(found.age ? String(found.age) : '');
        setWalkInLocation(found.address || '');
        setIsPhoneDropdownOpen(false);
        return;
      }
    }
    if (selectedPatientId) {
      const cur = patientList.find(p => p.id === selectedPatientId);
      if (cur && (cur.phone || '').replace(/\D/g, '') !== clean) {
        setSelectedPatientId('');
      }
    }
  };

  const handleSelectMatchingPatient = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setWalkInName(patient.name);
    setWalkInPhone(patient.phone || '');
    setWalkInAge(patient.age ? String(patient.age) : '');
    setWalkInLocation(patient.address || '');
    setIsPhoneDropdownOpen(false);
  };

  const handleResetCustomer = () => {
    setSelectedPatientId('');
    setWalkInName('Walk-in Customer');
    setWalkInPhone('');
    setWalkInAge('');
    setWalkInLocation('');
    setIsPhoneDropdownOpen(false);
    if (customerPhoneInputRef.current) {
      customerPhoneInputRef.current.focus();
    }
  };

  const handleCallCustomer = () => {
    const rawDigits = (walkInPhone || selectedPatient?.phone || '').replace(/\D/g, '');
    if (!rawDigits) {
      setScanFeedback({
        type: 'warning',
        title: 'Customer Phone Needed',
        message: 'Please enter a customer mobile number to place a call.'
      });
      customerPhoneInputRef.current?.focus();
      return;
    }
    const telUri = `tel:${rawDigits.length === 10 ? '+91' + rawDigits : rawDigits}`;
    try {
      const anchor = document.createElement('a');
      anchor.href = telUri;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (e) {
      console.warn('Call trigger error', e);
    }
  };

  const handleQuickWhatsApp = async () => {
    const rawDigits = (walkInPhone || selectedPatient?.phone || '').replace(/\D/g, '');
    if (!rawDigits || rawDigits.length < 10) {
      setScanFeedback({
        type: 'warning',
        title: 'Customer Mobile Required',
        message: 'Please enter a 10-digit customer mobile number for WhatsApp.'
      });
      customerPhoneInputRef.current?.focus();
      return;
    }
    const cleanPhone = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;
    const itemsText = cart.map(i => `${i.medicine.name} (${formatQuantityWithUnit(i)})`).join(', ');
    const pharmacyProfile = StorageService.getPharmacyProfile();
    const text = `Hello from ${pharmacyProfile.name || 'City Medical Hall'}! ${
      cart.length > 0
        ? `Your bill estimation: Net Rs.${grandTotal.toFixed(2)} (${itemsText}).`
        : 'How can we help you today with your pharmacy needs?'
    }`;

    await copyToClipboardSafely(text);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    try {
      const anchor = document.createElement('a');
      anchor.href = waUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (e) {
      console.warn('WhatsApp launch error', e);
    }

    setScanFeedback({
      type: 'success',
      title: 'WhatsApp Launched',
      message: 'Bill estimation copied to clipboard and WhatsApp opened!'
    });
  };

  const handleQuickSMS = async () => {
    const rawDigits = (walkInPhone || selectedPatient?.phone || '').replace(/\D/g, '');
    if (!rawDigits || rawDigits.length < 10) {
      setScanFeedback({
        type: 'warning',
        title: 'Customer Mobile Required',
        message: 'Please enter a 10-digit customer mobile number for SMS.'
      });
      customerPhoneInputRef.current?.focus();
      return;
    }
    const cleanPhone = rawDigits.length === 10 ? `+91${rawDigits}` : `+${rawDigits}`;
    const pharmacyProfile = StorageService.getPharmacyProfile();
    const text = `${pharmacyProfile.name || 'City Medical Hall'}: Net Rs.${grandTotal.toFixed(2)} estimation. Ph: ${pharmacyProfile.mobile || '8438678498'}`;

    await copyToClipboardSafely(text);
    const smsUri = `sms:${cleanPhone}?body=${encodeURIComponent(text)}`;
    try {
      const anchor = document.createElement('a');
      anchor.href = smsUri;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (e) {
      console.warn('SMS dispatch error', e);
    }

    setScanFeedback({
      type: 'success',
      title: 'SMS Sent',
      message: 'SMS message copied to clipboard and composer opened!'
    });
  };

  const handleQuickSavePatient = () => {
    const rawDigits = (walkInPhone || '').replace(/\D/g, '');
    if (!rawDigits || rawDigits.length < 10) {
      setScanFeedback({
        type: 'warning',
        title: 'Valid Mobile Required',
        message: 'Please enter a valid 10-digit mobile number to register customer as patient.'
      });
      customerPhoneInputRef.current?.focus();
      return;
    }
    const cleanPhone = rawDigits.length === 10 ? `+91 ${rawDigits.slice(0, 5)} ${rawDigits.slice(5)}` : walkInPhone.trim();
    const customerName = (walkInName.trim() && walkInName !== 'Walk-in Customer')
      ? walkInName.trim()
      : `Customer ${rawDigits.slice(-4)}`;

    const newPatient = StorageService.addPatient({
      name: customerName,
      phone: cleanPhone,
      age: walkInAge ? parseInt(walkInAge, 10) : 30,
      address: walkInLocation.trim() || undefined,
      gender: 'Other',
      chronicConditions: [],
      allergies: []
    });

    const updatedPatients = StorageService.getPatients();
    setPatientList(updatedPatients);
    setSelectedPatientId(newPatient.id);
    setWalkInName(newPatient.name);
    setWalkInPhone(newPatient.phone);
    setWalkInAge(newPatient.age ? String(newPatient.age) : '');
    setWalkInLocation(newPatient.address || '');
    setIsPhoneDropdownOpen(false);
  };

  const handleUpdateDiscount = (index: number, discount: number) => {
    setCart(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], discountPercent: Math.min(100, Math.max(0, discount)) };
      return updated;
    });
  };

  const handleUpdateBatch = (index: number, newBatchNumber: string) => {
    const item = cart[index];
    const newBatch = (item.medicine.batches || []).find(b => b.batchNumber === newBatchNumber);
    if (!newBatch) return;
    const packInfo = getPackDetails(item.medicine);

    setCart(prev => {
      const updated = [...prev];
      if (item.unitType === 'loose') {
        const looseRate = Number((newBatch.sellingPrice / packInfo.packSize).toFixed(2));
        updated[index] = {
          ...updated[index],
          selectedBatch: newBatch,
          customMrp: newBatch.sellingPrice,
          loosePrice: looseRate,
          isManualBatch: false
        };
      } else {
        updated[index] = {
          ...updated[index],
          selectedBatch: newBatch,
          quantity: Math.min(item.quantity, newBatch.stock || item.quantity),
          customMrp: newBatch.sellingPrice,
          isManualBatch: false
        };
      }
      return updated;
    });
  };

  const handleManualBatchInput = (index: number, rawBatchNumber: string) => {
    const batchUpper = rawBatchNumber.toUpperCase();
    setCart(prev => {
      const updated = [...prev];
      const item = updated[index];
      if (!item) return prev;
      const currentBatch = item.selectedBatch || {
        batchNumber: '',
        expiryDate: '2028-12-31',
        costPrice: 0,
        sellingPrice: item.customMrp || 0,
        stock: 9999
      };
      updated[index] = {
        ...item,
        isManualBatch: true,
        selectedBatch: {
          ...currentBatch,
          batchNumber: batchUpper
        }
      };
      return updated;
    });
  };

  const handleToggleManualBatch = (index: number) => {
    setCart(prev => {
      const updated = [...prev];
      const item = updated[index];
      if (!item) return prev;
      const nextManual = !item.isManualBatch;
      updated[index] = {
        ...item,
        isManualBatch: nextManual
      };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear all items from current sale bill?')) {
      setCart([]);
      setExtraBillDiscount(0);
    }
  };

  // Save or Hold current bill as Sales Draft
  const handleHoldBill = (note?: string, title?: string) => {
    if (cart.length === 0) {
      alert('Cannot save an empty sale as draft. Add items first.');
      return;
    }

    const newDraft: SalesDraft = {
      id: `DRF-SAL-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: invoiceDate ? new Date(invoiceDate).toISOString() : new Date().toISOString(),
      title: title?.trim() || selectedPatient?.name || 'Counter Sale Draft',
      notes: note?.trim() || undefined,
      patientName: selectedPatient?.name || 'Walk-in Customer',
      patientId: selectedPatientId,
      patientPhone: selectedPatient?.phone,
      doctorId: selectedDoctorId,
      doctorName: selectedDoctor?.name,
      cart: [...cart],
      itemCount: cart.length,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal
    };

    StorageService.saveSalesDraft(newDraft);
    refreshSalesDrafts();
    setCart([]);
    setExtraBillDiscount(0);
    SpeechService.speak(`Sale draft ${newDraft.id} saved`);
    alert(`Sale draft saved successfully (${newDraft.id}). It will remain saved until manually loaded or deleted.`);
  };

  // Resume sales draft
  const handleResumeDraft = (draft: SalesDraft) => {
    if (cart.length > 0) {
      if (!window.confirm(`Current cart has ${cart.length} item(s). Replace with saved draft "${draft.id}" (${draft.patientName})?`)) {
        return;
      }
    }
    setCart([...draft.cart]);
    if (draft.patientId) setSelectedPatientId(draft.patientId);
    if (draft.doctorId) setSelectedDoctorId(draft.doctorId);
    refreshSalesDrafts();
    SpeechService.speak(`Loaded draft ${draft.id}`);
  };

  // Toggle Full Screen Terminal
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullScreen(false);
    }
  };

  // Listen for native fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Quick Cash Bill & Print Invoice (F10 / Ctrl+Enter)
  const handleQuickCashSale = () => {
    if (cart.length === 0) {
      alert('Cart is empty. Add medicines to proceed.');
      return;
    }

    const isWholesale = posMode === 'wholesale';
    const newTx: SaleTransaction = {
      id: nextInvoiceNo,
      date: invoiceDate ? new Date(invoiceDate).toISOString() : new Date().toISOString(),
      saleType: isWholesale ? 'wholesale' : 'retail',
      patientId: !isWholesale ? (selectedPatientId || undefined) : undefined,
      patientName: isWholesale
        ? (selectedWholesaleBuyer?.businessName || 'Wholesale Chemist Buyer')
        : (walkInName.trim() || selectedPatient?.name || 'Walk-in Customer'),
      patientPhone: isWholesale
        ? (selectedWholesaleBuyer?.phone || '')
        : (walkInPhone.trim() || selectedPatient?.phone),
      patientAge: !isWholesale && walkInAge ? parseInt(walkInAge, 10) : selectedPatient?.age,
      patientAddress: isWholesale
        ? (selectedWholesaleBuyer?.address || '')
        : (walkInLocation.trim() || selectedPatient?.address),
      buyerId: isWholesale ? selectedWholesaleBuyer?.id : undefined,
      buyerBusinessName: isWholesale ? selectedWholesaleBuyer?.businessName : undefined,
      buyerGstin: isWholesale ? selectedWholesaleBuyer?.gstin : undefined,
      buyerDrugLicense: isWholesale ? selectedWholesaleBuyer?.drugLicenseNo : undefined,
      buyerAddress: isWholesale ? `${selectedWholesaleBuyer?.address || ''}, ${selectedWholesaleBuyer?.city || ''}` : undefined,
      buyerStateCode: isWholesale ? (selectedWholesaleBuyer?.stateCode || '33') : undefined,
      transportMode: isWholesale ? wholesaleTransportMode : undefined,
      vehicleNumber: isWholesale ? wholesaleVehicleNo : undefined,
      ewayBillNo: isWholesale ? wholesaleEwayBill : undefined,
      creditDays: isWholesale ? (selectedWholesaleBuyer?.creditDays || 30) : undefined,
      paymentDueDate: isWholesale ? new Date(Date.now() + (selectedWholesaleBuyer?.creditDays || 30) * 86400000).toISOString().split('T')[0] : undefined,
      doctorId: !isWholesale ? (selectedDoctorId || undefined) : undefined,
      doctorName: !isWholesale ? (selectedDoctor?.name || 'Self / OTC Recommendation') : undefined,
      items: cart.map(item => {
        const packInfo = getPackDetails(item.medicine);
        const pricing = calculateLinePricing({
          unitType: item.unitType,
          quantity: item.quantity,
          boxQuantity: item.boxQuantity,
          stripQuantity: item.stripQuantity,
          looseQuantity: item.looseQuantity,
          packSize: item.packSize || packInfo.packSize,
          boxSize: item.boxSize,
          customMrp: item.customMrp,
          sellingPrice: item.selectedBatch.sellingPrice,
          discountPercent: item.discountPercent
        });
        return {
          medicineId: item.medicine.id,
          medicineName: item.medicine.name,
          genericName: item.medicine.genericName,
          batchNumber: item.selectedBatch.batchNumber,
          expiryDate: item.selectedBatch.expiryDate,
          quantity: pricing.isLoose ? pricing.looseCount : (pricing.boxCount > 0 ? pricing.stockDeduction : (pricing.stripCount || 1)),
          stockDeduction: pricing.stockDeduction,
          unitPrice: pricing.unitPrice,
          discountPercent: item.discountPercent,
          taxRate: item.medicine.taxRate,
          total: pricing.netAmount,
          unitType: pricing.isLoose ? 'loose' : (item.unitType || 'pack'),
          boxQuantity: pricing.boxCount,
          stripQuantity: pricing.stripCount,
          looseQuantity: pricing.looseCount,
          packSize: packInfo.packSize,
          boxSize: item.boxSize || 10,
          unitName: packInfo.unitName,
          packName: packInfo.packName,
          pack: item.medicine.pack || packInfo.packDisplay,
          location: item.medicine.rackLocation || item.selectedBatch.location || 'Rack A-01'
        };
      }),
      subtotal,
      totalTax,
      totalDiscount,
      grandTotal,
      costOfGoodsSold: cart.reduce((sum, item) => {
        const packInfo = getPackDetails(item.medicine);
        const pricing = calculateLinePricing({
          unitType: item.unitType,
          quantity: item.quantity,
          boxQuantity: item.boxQuantity,
          stripQuantity: item.stripQuantity,
          looseQuantity: item.looseQuantity,
          packSize: item.packSize || packInfo.packSize,
          boxSize: item.boxSize,
          customMrp: item.customMrp,
          sellingPrice: item.selectedBatch.sellingPrice,
          discountPercent: item.discountPercent
        });
        return sum + item.selectedBatch.costPrice * pricing.stockDeduction;
      }, 0),
      paymentMethod: 'Cash',
      paymentStatus: 'Paid',
      cashierName: 'Senior Pharmacist'
    };

    // Save transaction and adjust batch stock
    StorageService.deductStockForSale(newTx.items);
    StorageService.addTransaction(newTx);
    if (consultationId) {
      StorageService.markConsultationDispensed(consultationId, newTx.id);
    }
    printDirectBill(newTx, pharmacyProfile, (printerSettings?.printerType as any) || 'thermal', printerSettings);
    setLastTransactionForPrint(newTx);
    onTransactionComplete(newTx);
    setCart([]);
    setExtraBillDiscount(0);
    setShowPrintModal(true);
  };

  // Quick UPI Sale after customer scans Dynamic UPI QR
  const handleQuickUpiSale = (paymentDetails?: { upiId: string; reference: string }) => {
    if (cart.length === 0) {
      alert('Cart is empty. Add medicines to proceed.');
      return;
    }

    const newTx: SaleTransaction = {
      id: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: invoiceDate ? new Date(invoiceDate).toISOString() : new Date().toISOString(),
      patientId: selectedPatientId || undefined,
      patientName: walkInName.trim() || selectedPatient?.name || 'Walk-in Customer',
      patientPhone: walkInPhone.trim() || selectedPatient?.phone,
      patientAge: walkInAge ? parseInt(walkInAge, 10) : selectedPatient?.age,
      patientAddress: walkInLocation.trim() || selectedPatient?.address,
      doctorId: selectedDoctorId || undefined,
      doctorName: selectedDoctor?.name || 'Self / OTC Recommendation',
      items: cart.map(item => {
        const packInfo = getPackDetails(item.medicine);
        const pricing = calculateLinePricing({
          unitType: item.unitType,
          quantity: item.quantity,
          boxQuantity: item.boxQuantity,
          stripQuantity: item.stripQuantity,
          looseQuantity: item.looseQuantity,
          packSize: item.packSize || packInfo.packSize,
          boxSize: item.boxSize,
          customMrp: item.customMrp,
          sellingPrice: item.selectedBatch.sellingPrice,
          discountPercent: item.discountPercent
        });
        return {
          medicineId: item.medicine.id,
          medicineName: item.medicine.name,
          genericName: item.medicine.genericName,
          batchNumber: item.selectedBatch.batchNumber,
          expiryDate: item.selectedBatch.expiryDate,
          quantity: pricing.isLoose ? pricing.looseCount : (pricing.boxCount > 0 ? pricing.stockDeduction : (pricing.stripCount || 1)),
          stockDeduction: pricing.stockDeduction,
          unitPrice: pricing.unitPrice,
          discountPercent: item.discountPercent,
          taxRate: item.medicine.taxRate,
          total: pricing.netAmount,
          unitType: pricing.isLoose ? 'loose' : (item.unitType || 'pack'),
          boxQuantity: pricing.boxCount,
          stripQuantity: pricing.stripCount,
          looseQuantity: pricing.looseCount,
          packSize: packInfo.packSize,
          boxSize: item.boxSize || 10,
          unitName: packInfo.unitName,
          packName: packInfo.packName,
          pack: item.medicine.pack || packInfo.packDisplay,
          location: item.medicine.rackLocation || item.selectedBatch.location || 'Rack A-01'
        };
      }),
      subtotal,
      totalTax,
      totalDiscount,
      grandTotal,
      costOfGoodsSold: cart.reduce((sum, item) => {
        const packInfo = getPackDetails(item.medicine);
        const pricing = calculateLinePricing({
          unitType: item.unitType,
          quantity: item.quantity,
          boxQuantity: item.boxQuantity,
          stripQuantity: item.stripQuantity,
          looseQuantity: item.looseQuantity,
          packSize: item.packSize || packInfo.packSize,
          boxSize: item.boxSize,
          customMrp: item.customMrp,
          sellingPrice: item.selectedBatch.sellingPrice,
          discountPercent: item.discountPercent
        });
        return sum + item.selectedBatch.costPrice * pricing.stockDeduction;
      }, 0),
      paymentMethod: 'UPI',
      paymentStatus: 'Paid',
      cashierName: currentUser?.name || currentUser?.username || 'Senior Pharmacist',
      upiReferenceId: paymentDetails?.reference || 'UPI-VERIFIED'
    };

    // Save transaction, adjust batch stock, and trigger instant bill print with QR code
    StorageService.deductStockForSale(newTx.items);
    StorageService.addTransaction(newTx);
    if (consultationId) {
      StorageService.markConsultationDispensed(consultationId, newTx.id);
    }
    printDirectBill(newTx, pharmacyProfile, (printerSettings?.printerType as any) || 'thermal', printerSettings);
    setLastTransactionForPrint(newTx);
    onTransactionComplete(newTx);
    setCart([]);
    setExtraBillDiscount(0);
    setShowDynamicUpiModal(false);
    setShowPrintModal(true);
  };

  // Keyboard Navigation & Shortcuts for fast desktop billing
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside a modal other than POS
      if (showCheckoutModal || showPrintModal || showMobileAppModal || showDynamicUpiModal) return;

      // F1: Focus Search Bar
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        setIsSearchFocused(true);
      }
      // F2: Focus and Activate Customer Phone Number
      else if (e.key === 'F2') {
        e.preventDefault();
        customerPhoneInputRef.current?.focus();
        customerPhoneInputRef.current?.select();
        setIsPhoneDropdownOpen(true);
      }
      // F3: Focus Doctor Selector
      else if (e.key === 'F3') {
        e.preventDefault();
        doctorSelectRef.current?.focus();
      }
      // F4: Full Cash Checkout
      else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          setCheckoutMethod('Cash');
          setShowCheckoutModal(true);
        }
      }
      // F5: Split / Part Cash & UPI
      else if (e.key === 'F5') {
        e.preventDefault();
        if (cart.length > 0) {
          setCheckoutMethod('Split');
          setShowCheckoutModal(true);
        }
      }
      // F4 or Ctrl+D: Edit Total Discount
      else if (e.key === 'F4' || ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D'))) {
        e.preventDefault();
        setShowTotalDiscountModal(true);
      }
      // F6: Quick Loose Quantity Dispensing
      else if (e.key === 'F6') {
        e.preventDefault();
        if (searchResults.length > 0) {
          handleOpenLooseModal(searchResults[selectedSearchIdx]);
        } else if (cart.length > 0) {
          handleOpenLooseModal(cart[cart.length - 1].medicine, cart[cart.length - 1].selectedBatch);
        } else if (medicines.length > 0) {
          handleOpenLooseModal(medicines[0]);
        }
      }
      // F7: Open Generic Substitute Search
      else if (e.key === 'F7') {
        e.preventDefault();
        if (cart.length > 0) {
          setActiveGenericMed(cart[cart.length - 1].medicine);
        } else if (medicines.length > 0) {
          setActiveGenericMed(medicines[0]);
        }
      }
      // F8: Save / View Sales Drafts
      else if (e.key === 'F8') {
        e.preventDefault();
        setShowDraftsModal(true);
      }
      // F9: Clear / New Bill
      else if (e.key === 'F9') {
        e.preventDefault();
        handleClearCart();
      }
      // F10 or Ctrl+Enter: Quick Cash Bill & Print
      else if (e.key === 'F10' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
        e.preventDefault();
        handleQuickCashSale();
      }
      // F11: Fullscreen mode
      else if (e.key === 'F11') {
        e.preventDefault();
        toggleFullScreen();
      }
      // F12 or Alt+U: Dynamic UPI Payment QR Code
      else if (e.key === 'F12' || (e.altKey && (e.key === 'u' || e.key === 'U'))) {
        e.preventDefault();
        if (cart.length > 0) {
          setShowDynamicUpiModal(true);
        }
      }
      // Alt+B: Open Barcode Scanner Guide & Simulator
      else if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setShowScannerGuideModal(true);
      }
      // Escape: Close dropdowns and guide modals
      else if (e.key === 'Escape') {
        setIsSearchFocused(false);
        setActiveGenericMed(null);
        setShowDraftsModal(false);
        setShowKeyboardHelp(false);
        setShowDynamicUpiModal(false);
        setShowScannerGuideModal(false);
        setShowTotalDiscountModal(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [cart, showCheckoutModal, showDynamicUpiModal, showPrintModal, showMobileAppModal, showTotalDiscountModal, medicines, selectedPatient, selectedDoctor, subtotal, totalDiscount, totalTax, grandTotal, consultationId]);

  // Handle Search Input specific keys (Arrow Down/Up, Enter)
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      if (searchResults.length === 0) return;
      e.preventDefault();
      setSelectedSearchIdx(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      if (searchResults.length === 0) return;
      e.preventDefault();
      setSelectedSearchIdx(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = searchQuery.trim();
      if (!trimmed && searchResults.length === 0) return;

      // Check if the query is a barcode or batch number or exact match
      const hasBarcodeOrBatch = medicines.some(m =>
        (m.barcode && m.barcode.toLowerCase() === trimmed.toLowerCase()) ||
        m.id.toLowerCase() === trimmed.toLowerCase() ||
        m.batches.some(b => b.batchNumber.toLowerCase() === trimmed.toLowerCase() || (b.barcode && b.barcode.toLowerCase() === trimmed.toLowerCase()))
      );

      if (hasBarcodeOrBatch) {
        handleBarcodeScanned(trimmed);
        return;
      }

      if (searchResults[selectedSearchIdx]) {
        handleAddToCart(searchResults[selectedSearchIdx]);
      } else if (trimmed) {
        handleBarcodeScanned(trimmed);
      }
    }
  };

  return (
    <div
      className={`w-full transition-all duration-200 ${
        isFullScreen
          ? 'fixed inset-0 z-50 bg-slate-100 overflow-y-auto p-2 sm:p-4'
          : 'w-full max-w-[1920px] mx-auto p-2 sm:p-4 space-y-4'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER STRIP: BRANDING, CUSTOMER/DOCTOR LEDGER, QUICK ACTIONS     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Left: City Rx Logo & Bill Metadata */}
        <div className="flex items-center gap-3 shrink-0">
          <PharmacyLogo size="md" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                City Rx
              </h1>
              {/* Sales Desk Mode Toggle */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleTogglePosMode('retail')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    posMode === 'retail'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  id="pos-mode-retail-btn"
                  title="Retail Patient Counter Sale (MRP & Prescription)"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Retail</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePosMode('wholesale')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    posMode === 'wholesale'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  id="pos-mode-wholesale-btn"
                  title="Wholesale Pharma B2B (PTR & Tax Invoice)"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Wholesale B2B</span>
                </button>
              </div>

              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                posMode === 'wholesale'
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  : 'bg-teal-50 text-teal-800 border-teal-200'
              }`}>
                {posMode === 'wholesale' ? 'Wholesale Desk' : 'Retail POS'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                INV-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}
              </span>
              <DateMonthYearPicker
                value={invoiceDate}
                onChange={setInvoiceDate}
                label="Bill Date"
                size="sm"
                id="pos-header-invoice-date"
              />
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] flex-wrap">
              <span className="text-slate-500 font-medium">Melur, Madurai •</span>
              <button
                type="button"
                onClick={() => setShowEditGstinModal(true)}
                className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 hover:text-teal-800 bg-slate-100 hover:bg-teal-50 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                title="Click to Edit GST Number"
              >
                <FileText className="w-3 h-3 text-teal-600" />
                <span>GST: {pharmacyProfile.gstin || '33AALFC1234F1Z5'}</span>
                <span className="text-[10px] text-teal-600 font-sans font-bold underline">Edit</span>
              </button>
              <button
                type="button"
                onClick={() => setShowEditQrCodeModal(true)}
                className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                title="Upload or Change UPI Payment QR Code"
              >
                <QrCode className="w-3 h-3 text-emerald-600" />
                <span>QR: {pharmacyProfile.upiQrCodeUrl ? 'Custom Standee' : (pharmacyProfile.upiVpa || pharmacyProfile.upiId || '8438678498@upi')}</span>
                <span className="text-[10px] text-emerald-600 font-sans font-bold underline">Change</span>
              </button>
              <button
                type="button"
                onClick={() => setShowConnectPrinterModal(true)}
                className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-teal-800 bg-slate-100 hover:bg-teal-50 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                title="Connect Thermal Printer & Change Roll Settings"
              >
                <Printer className="w-3 h-3 text-teal-600" />
                <span>Printer: {printerSettings.paperWidth} ({printerSettings.connectionType.replace('web-', '')})</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-teal-600 font-sans font-bold underline">Connect</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center: Wholesale Chemist / Hospital Terminal (Wholesale Mode) OR Customer & Doctor Terminal (Retail Mode) */}
        {posMode === 'wholesale' ? (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 flex-1 max-w-2xl bg-indigo-50/60 p-2.5 rounded-2xl border border-indigo-200 shadow-2xs">
            <div className="sm:col-span-8">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Wholesale Chemist / Hospital Buyer</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddWholesaleBuyerModal(true)}
                  className="text-[10px] font-bold text-indigo-700 hover:text-indigo-950 bg-white hover:bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-300 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  id="pos-add-wholesale-chemist-btn"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add Chemist</span>
                </button>
              </div>
              <select
                value={selectedWholesaleBuyerId}
                onChange={e => setSelectedWholesaleBuyerId(e.target.value)}
                className="w-full text-xs font-bold py-1.5 px-2.5 bg-white border border-indigo-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {wholesaleBuyers.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.businessName} • {b.city} (GST: {b.gstin || 'None'})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-950 block mb-1">
                Vehicle / Transport No.
              </label>
              <input
                type="text"
                value={wholesaleVehicleNo}
                onChange={e => setWholesaleVehicleNo(e.target.value)}
                placeholder="e.g. TN-59-AX-4820"
                className="w-full text-xs font-mono font-bold py-1.5 px-2 bg-white border border-indigo-300 rounded-xl text-slate-800"
              />
            </div>

            {selectedWholesaleBuyer && (
              <div className="sm:col-span-12 flex flex-wrap items-center gap-2 pt-1 border-t border-indigo-100 text-[10px]">
                <span className="font-bold text-slate-600">GSTIN: <span className="font-mono text-indigo-700 font-bold">{selectedWholesaleBuyer.gstin || 'Unregistered'}</span></span>
                <span>•</span>
                <span className="font-bold text-slate-600">DL: <span className="font-mono text-slate-800">{selectedWholesaleBuyer.drugLicenseNo || '20B/21B'}</span></span>
                <span>•</span>
                <span className="font-bold text-slate-600">Terms: <span className="text-emerald-700 font-bold">{selectedWholesaleBuyer.creditDays}d Credit</span></span>
                <span>•</span>
                <span className="font-bold text-slate-600">Balance: <span className="font-mono text-amber-700">₹{(selectedWholesaleBuyer.outstandingBalance || 0).toLocaleString('en-IN')}</span></span>
              </div>
            )}
          </div>
        ) : (
          /* Center: Customer Mobile Phone [F2] & Prescribing Doctor [F3] Selectors */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 max-w-2xl">
            {/* Customer Mobile Phone & Identity Terminal */}
            <div className="relative" ref={phoneDropdownRef}>
              <div className="flex items-center justify-between mb-0.5">
                <label htmlFor="pos-customer-phone-input" className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-teal-600" />
                  <span>Customer Mobile [F2]</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerModal(true)}
                    className="text-[10px] font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-1.5 py-0.5 rounded border border-teal-200 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Add Walking New Customer with Mobile, Age and Location"
                    id="pos-add-walkin-customer-btn"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ Walking Customer</span>
                  </button>
                  {walkInPhone.trim() ? (
                    <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Guest</span>
                  )}
                </div>
              </div>

              <div className="relative flex items-center">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${walkInPhone.trim() ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-slate-300'}`} />
                </div>
                <input
                  ref={customerPhoneInputRef}
                  type="text"
                  id="pos-customer-phone-input"
                  value={walkInPhone}
                  onChange={handlePhoneInputChange}
                  onFocus={() => setIsPhoneDropdownOpen(true)}
                  placeholder="Type 10-digit Mobile No [F2]..."
                  className="w-full text-xs font-mono font-bold py-2 pl-6 pr-14 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-hidden text-slate-800 placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal transition-all"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {walkInPhone ? (
                    <button
                      type="button"
                      onClick={handleResetCustomer}
                      className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                      title="Clear Customer & Reset to Guest"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <kbd className="px-1.5 py-0.5 bg-slate-200/80 text-slate-600 font-mono font-bold text-[9px] rounded border border-slate-300 pointer-events-none">
                      F2
                    </kbd>
                  )}
                </div>
              </div>

              {/* Live Predictive Patient Lookup Dropdown */}
              {isPhoneDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden text-xs max-h-64 overflow-y-auto">
                  <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-teal-600" />
                      <span>Customer & Patient Suggestions</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPhoneDropdownOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {matchingPatients.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {matchingPatients.map(pat => (
                        <div
                          key={pat.id}
                          onClick={() => handleSelectMatchingPatient(pat)}
                          className={`p-2.5 hover:bg-teal-50/80 cursor-pointer transition-colors flex items-center justify-between gap-2 ${selectedPatientId === pat.id ? 'bg-teal-50' : ''}`}
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span className="truncate">{pat.name}</span>
                              <span className="font-mono text-[11px] text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                {pat.phone}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                              <span>{pat.age} yrs • {pat.gender}</span>
                              {pat.address && (
                                <span className="text-slate-600 truncate flex items-center gap-0.5 max-w-[140px]">
                                  <MapPin className="w-2.5 h-2.5 text-teal-600 shrink-0 inline" />
                                  {pat.address}
                                </span>
                              )}
                              {pat.chronicConditions && pat.chronicConditions.length > 0 && (
                                <span className="text-amber-700 truncate font-medium">
                                  • {pat.chronicConditions.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="px-2.5 py-1 bg-teal-600 text-white font-bold text-[10px] rounded-lg hover:bg-teal-700 shrink-0"
                          >
                            Activate
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-slate-500 space-y-2">
                      <p className="text-xs">No registered patient matches "{walkInPhone}"</p>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setIsPhoneDropdownOpen(false);
                            setShowNewCustomerModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>+ Add Walking New Customer (Age, Location)</span>
                        </button>
                        {walkInPhone.replace(/\D/g, '').length >= 10 && (
                          <button
                            type="button"
                            onClick={handleQuickSavePatient}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Register</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Select from All Registered Patients / Guest Option */}
                  <div className="p-2 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={handleResetCustomer}
                      className="text-slate-600 hover:text-slate-900 font-medium"
                    >
                      Reset to Guest Walk-in
                    </button>
                    <select
                      value={selectedPatientId}
                      onChange={e => {
                        const id = e.target.value;
                        setSelectedPatientId(id);
                        if (id) {
                          const p = patientList.find(pat => pat.id === id);
                          if (p) {
                            setWalkInName(p.name);
                            setWalkInPhone(p.phone || '');
                          }
                        } else {
                          setWalkInName('Walk-in Customer');
                          setWalkInPhone('');
                        }
                        setIsPhoneDropdownOpen(false);
                      }}
                      className="text-[11px] font-medium bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-700 max-w-[150px]"
                    >
                      <option value="">All Patients...</option>
                      {patientList.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Doctor Selector */}
            <div className="relative">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between mb-0.5">
                <span className="flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  <span>Prescribing Doctor [F3]</span>
                </span>
                <span className="text-[10px] text-slate-400">Rx Auth</span>
              </label>
              <select
                ref={doctorSelectRef}
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(e.target.value)}
                className="w-full text-xs font-semibold py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                id="pos-doctor-select"
              >
                <option value="">Self / Over-the-Counter Recommendation</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5 self-end xl:self-center flex-wrap">
          {/* Barcode Scanner Listener Indicator & Simulator Button */}
          <button
            onClick={() => setShowScannerGuideModal(true)}
            className="px-3 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 text-teal-900 border border-teal-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer group"
            title="Barcode Scanner Listener Active (Auto-detects USB/Bluetooth scanners) [Alt+B]"
            id="pos-barcode-scanner-btn"
          >
            <div className="relative">
              <Scan className="w-3.5 h-3.5 text-teal-700" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5 animate-ping" />
            </div>
            <span className="hidden sm:inline">Scanner Active</span>
            <span className="px-1.5 py-0.2 rounded-md bg-teal-200/80 text-teal-950 font-mono text-[10px]">
              {scanCount > 0 ? `${scanCount}` : 'HID'}
            </span>
          </button>

          {/* Sales Drafts Badge Button */}
          <button
            onClick={() => setShowDraftsModal(true)}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs relative cursor-pointer"
            title="View & Manage Sales Drafts (Drafts remain saved until manually deleted)"
            id="pos-sales-drafts-btn"
          >
            <Archive className="w-3.5 h-3.5 text-amber-700" />
            <span>Sales Drafts ({salesDrafts.length})</span>
          </button>

          {/* Quick Save Draft Button */}
          <button
            onClick={() => {
              if (cart.length === 0) {
                alert('Cart is empty. Add medicines first to save as a draft.');
                return;
              }
              setShowDraftsModal(true);
            }}
            className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Manually save current cart as a draft [F8]"
            id="pos-save-draft-btn"
          >
            <Save className="w-3.5 h-3.5 text-teal-700" />
            <span>Save Draft [F8]</span>
          </button>

          {/* Clear / New Bill Button */}
          <button
            onClick={handleClearCart}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            title="Clear Cart / Start Fresh Bill [F9]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">New Bill</span>
          </button>

          {/* Edit Total Discount Button [F4] */}
          <button
            type="button"
            onClick={() => setShowTotalDiscountModal(true)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
              totalDiscount > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
            }`}
            title="Edit Total Discount (F4 or Ctrl+D)"
            id="pos-header-total-disc-btn"
          >
            <Tag className="w-3.5 h-3.5 text-current" />
            <span>
              {totalDiscount > 0 ? `Total Disc: -₹${totalDiscount.toFixed(2)}` : 'Total Disc [F4]'}
            </span>
          </button>

          {/* Loose Quantity Dispensing Button */}
          <button
            onClick={() => {
              if (cart.length > 0) {
                handleOpenLooseModal(cart[cart.length - 1].medicine, cart[cart.length - 1].selectedBatch);
              } else if (medicines.length > 0) {
                handleOpenLooseModal(medicines[0]);
              }
            }}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            title="Dispense Loose Quantity (Tablets / Capsules / Pieces) [F6]"
            id="pos-loose-sale-btn"
          >
            <Pill className="w-3.5 h-3.5 text-amber-600" />
            <span>Loose Sale [F6]</span>
          </button>

          {/* Connect Thermal Printer Button */}
          <button
            onClick={() => setShowConnectPrinterModal(true)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Connect Thermal POS Printer (80mm/58mm, Bluetooth, USB, Serial, auto-cut)"
            id="pos-connect-printer-btn"
          >
            <Printer className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Connect Printer</span>
            <span className={`w-1.5 h-1.5 rounded-full ${printerSettings.status === 'connected' ? 'bg-emerald-400' : 'bg-teal-400'} animate-pulse`} />
          </button>

          {/* 3" Thermal Receipt (Direct ESC/POS Print & 3" PDF Download) */}
          <div className="flex items-center bg-teal-50 border border-teal-200 rounded-xl p-0.5 shadow-2xs">
            <button
              onClick={() => {
                const allTxs = StorageService.getTransactions();
                const txToUse = lastTransactionForPrint || allTxs[0];
                if (txToUse) {
                  printDirectBill(txToUse, pharmacyProfile, 'thermal', printerSettings);
                  setScanFeedback({
                    type: 'success',
                    title: 'Thermal Print Sent',
                    message: `3" Thermal Receipt sent to printer for invoice #${txToUse.id}`
                  });
                } else if (cart.length > 0) {
                  setLastTransactionForPrint(null);
                  setShowPrintModal(true);
                } else {
                  setScanFeedback({
                    type: 'warning',
                    title: 'No Transaction',
                    message: 'No recent invoice to print.'
                  });
                }
              }}
              className="px-2.5 py-1.5 hover:bg-teal-100 text-teal-900 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Direct ESC/POS print 3-inch (80mm) thermal receipt for recent bill"
              id="pos-quick-print-thermal-btn"
            >
              <Receipt className="w-3.5 h-3.5 text-teal-700" />
              <span>3" Thermal</span>
            </button>
            <button
              onClick={() => {
                const allTxs = StorageService.getTransactions();
                const txToUse = lastTransactionForPrint || allTxs[0];
                if (txToUse) {
                  exportThermalReceiptToPDF(txToUse, pharmacyProfile, '80mm');
                  setScanFeedback({
                    type: 'success',
                    title: '3" Thermal PDF Downloaded',
                    message: `Downloaded 3" thermal receipt PDF for invoice #${txToUse.id}`
                  });
                } else {
                  setScanFeedback({
                    type: 'warning',
                    title: 'No Transaction',
                    message: 'No recent invoice to download.'
                  });
                }
              }}
              className="px-2 py-1.5 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Download 3-inch 80mm continuous thermal receipt as PDF file"
              id="pos-quick-download-thermal-btn"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden md:inline">3" PDF</span>
            </button>
          </div>

          {/* Print Invoice / Reprint Recent Bill Button */}
          <button
            onClick={() => {
              const allTxs = StorageService.getTransactions();
              if (allTxs.length > 0) {
                setLastTransactionForPrint(lastTransactionForPrint || allTxs[0]);
                setShowPrintModal(true);
              } else if (cart.length > 0) {
                setLastTransactionForPrint(null);
                setShowPrintModal(true);
              } else {
                setScanFeedback({
                  type: 'warning',
                  title: 'No Invoices to Print',
                  message: 'No transactions recorded yet. Complete a checkout or add medicines to cart to print an invoice.'
                });
              }
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Open printer-friendly version of recent transaction bill (A4 / A5 / Thermal)"
            id="pos-reprint-bill-btn"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">All Formats</span>
          </button>

          {/* Mobile App Download Button */}
          <button
            onClick={() => setShowMobileAppModal(true)}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            title="Download City Rx Mobile App / PWA"
            id="pos-mobile-app-btn"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Mobile App</span>
          </button>

          {/* Direct Download Computer / Desktop App */}
          <button
            onClick={() => setShowDesktopAppModal(true)}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Direct Download Computer City Rx Desktop App (.bat launcher & shortcut)"
            id="pos-desktop-app-btn"
          >
            <Monitor className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">PC App</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullScreen}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Toggle Fullscreen Mode [F11]"
            id="pos-fullscreen-toggle"
          >
            {isFullScreen ? (
              <Minimize2 className="w-4 h-4 text-slate-700" />
            ) : (
              <Maximize2 className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="View Desktop Keyboard Access Map"
          >
            <HelpCircle className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Automated Low Stock Alert Banner (Real-time stock threshold notifications) */}
      <LowStockNotificationBanner
        viewMode="banner"
        onNavigateToPurchases={onNavigateToPurchases}
        onFilterLowStockInInventory={onNavigateToInventory}
        className="animate-in fade-in"
      />

      {/* Allergy Alert Warning (if detected) */}
      {patientAllergyWarnings.length > 0 && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-3 text-rose-900 shadow-xs animate-shake">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="text-xs">
            <span className="font-extrabold uppercase">Drug Allergy Conflict: </span>
            {patientAllergyWarnings.join(' | ')}
          </div>
        </div>
      )}

      {/* Active Customer Mobile Status & Instant Action Bar */}
      <div className={`rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs border transition-all ${
        selectedPatient
          ? 'bg-emerald-50/90 border-emerald-300/80 text-emerald-950'
          : walkInPhone.trim()
          ? 'bg-sky-50/90 border-sky-300/80 text-sky-950'
          : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 shrink-0">
            {selectedPatient ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            ) : walkInPhone.trim() ? (
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            )}
            <span className="text-xs font-black uppercase tracking-wider">
              {selectedPatient ? 'Active Customer:' : walkInPhone.trim() ? 'Active Mobile:' : 'Customer Phone:'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-2xl flex-wrap">
            <input
              type="text"
              value={walkInName}
              onChange={e => setWalkInName(e.target.value)}
              placeholder="Customer Name"
              className="text-xs font-bold py-1.5 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden min-w-[120px] flex-1"
              id="pos-walkin-name-input"
            />
            <div className="relative flex-1 min-w-[125px]">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={walkInPhone}
                onChange={handlePhoneInputChange}
                onFocus={() => setIsPhoneDropdownOpen(true)}
                placeholder="Mobile No [F2]"
                className="w-full text-xs font-mono font-bold py-1.5 pl-8 pr-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                id="pos-walkin-phone-input"
              />
            </div>
            <div className="relative w-20">
              <input
                type="number"
                min="0"
                max="125"
                value={walkInAge}
                onChange={e => setWalkInAge(e.target.value)}
                placeholder="Age"
                className="w-full text-xs font-bold py-1.5 px-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                id="pos-walkin-age-input"
                title="Customer Age (Years)"
              />
            </div>
            <div className="relative flex-1 min-w-[125px]">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={walkInLocation}
                onChange={e => setWalkInLocation(e.target.value)}
                placeholder="Location / Area"
                className="w-full text-xs font-medium py-1.5 pl-8 pr-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                id="pos-walkin-location-input"
                title="Customer Location / Address"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowNewCustomerModal(true)}
              className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold border border-teal-200 rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
              title="Add Walking New Customer (Name, Mobile, Age, Location)"
              id="pos-open-new-customer-modal-bar-btn"
            >
              <UserPlus className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">+ New Customer</span>
            </button>
          </div>

          {selectedPatient && (
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
              <span className="px-2 py-0.5 bg-white rounded-md border border-emerald-200 font-bold">
                {selectedPatient.gender}, {selectedPatient.age} yrs
              </span>
              {(selectedPatient.chronicConditions || []).slice(0, 2).map((c, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-emerald-100/80 rounded text-[10px] font-semibold">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* WhatsApp One-tap bill sharing */}
          <button
            type="button"
            onClick={handleQuickWhatsApp}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
            title="Open WhatsApp chat with bill estimation to customer phone"
            id="pos-walkin-whatsapp-btn"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span>WhatsApp</span>
          </button>

          {/* SMS One-tap estimation */}
          <button
            type="button"
            onClick={handleQuickSMS}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
            title="Send SMS to customer phone"
            id="pos-walkin-sms-btn"
          >
            <Send className="w-3.5 h-3.5" />
            <span>SMS</span>
          </button>

          {/* Direct Phone Call */}
          {walkInPhone.trim() && (
            <button
              type="button"
              onClick={handleCallCustomer}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer border border-slate-200"
              title="Call Customer Phone"
              id="pos-walkin-call-btn"
            >
              <PhoneCall className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">Call</span>
            </button>
          )}

          {/* Register as regular Patient if not yet in database */}
          {walkInPhone.trim() && !selectedPatientId && (
            <button
              type="button"
              onClick={handleQuickSavePatient}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Save customer as regular Patient in directory"
              id="pos-walkin-save-patient-btn"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Patient</span>
            </button>
          )}

          {/* Clear / Switch Customer */}
          {(walkInPhone.trim() || selectedPatientId) && (
            <button
              type="button"
              onClick={handleResetCustomer}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-lg transition-colors cursor-pointer"
              title="Reset Customer to Guest Counter Sale"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FAST PRODUCT ENTRY TERMINAL (SEARCH BAR WITH AUTOCOMPLETE & RACK INFO) */}
      {/* ========================================================================= */}
      <div className="relative bg-white rounded-2xl border-2 border-teal-500/80 shadow-sm p-2 sm:p-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Type Product Name, Molecule / Generic, Batch No, Rack Location, or Barcode [Press F1 to Focus]..."
            className="flex-1 bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
            id="pos-main-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-xs"
            >
              Clear
            </button>
          )}

          {/* Voice Search & Speech Commands */}
          <VoiceInputButton
            onTranscript={(text) => {
              const lower = text.toLowerCase().trim();
              if (lower.includes('hold bill')) {
                handleHoldBill();
                SpeechService.speak('Current bill put on hold');
              } else if (lower.includes('clear cart') || lower.includes('clear bill') || lower.includes('new bill')) {
                handleClearCart();
                SpeechService.speak('Cart cleared');
              } else if (lower.includes('quick cash') || lower.includes('cash sale')) {
                handleQuickCashSale();
              } else {
                setSearchQuery(text);
                setIsSearchFocused(true);
                SpeechService.speak(`Searching ${text}`);
              }
            }}
            size="md"
            title="Speak drug name or command (e.g., 'Paracetamol', 'Hold bill', 'Clear bill')"
          />

          <span className="hidden sm:inline-block px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg font-mono">
            Press Enter ↵ to Add
          </span>

          {/* Barcode Scanner Quick Status Badge */}
          <button
            type="button"
            onClick={() => setShowScannerGuideModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            title="Hardware Barcode Scanner Listener Active (Click to open Scanner Guide & Test Simulator)"
            id="pos-search-barcode-btn"
          >
            <Barcode className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-[11px] font-bold">Barcode Active</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>

        {/* Autocomplete Dropdown showing Product Name, Location/Racks, Batch, Expiry, Pack, MRP, Stock */}
        {isSearchFocused && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-96 overflow-y-auto">
            <div className="px-4 py-2 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Select medicine using ↑ ↓ arrow keys, press Enter to add</span>
              <span>{searchResults.length} matches found</span>
            </div>
            {searchResults.map((med, idx) => {
              const packInfo = getPackDetails(med);
              const totalStock = med.batches.reduce((sum, b) => sum + b.stock, 0);
              const sortedBatches = [...med.batches].sort(
                (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
              );
              const activeBatch = sortedBatches.find(b => b.stock > 0) || sortedBatches[0];
              const rack = med.rackLocation || activeBatch?.location || 'Rack A-01';
              const stockFormatted = formatStockDisplay(totalStock, packInfo.packSize, packInfo.packName, packInfo.unitName);
              const looseRate = activeBatch ? Number((activeBatch.sellingPrice / packInfo.packSize).toFixed(2)) : 0;

              return (
                <div
                  key={med.id}
                  className={`p-3 flex items-center justify-between gap-4 transition-colors ${
                    selectedSearchIdx === idx ? 'bg-teal-50/80 border-l-4 border-teal-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => handleAddToCart(med, activeBatch, 'pack')}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm">{med.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                        {rack}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {packInfo.packDisplay}
                      </span>
                      {packInfo.isLooseSellable && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold border border-amber-300">
                          Loose: ₹{looseRate.toFixed(2)}/{packInfo.unitName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-700 font-medium truncate mt-0.5">
                      {med.genericName} • {med.strength} ({med.manufacturer})
                    </p>
                  </div>

                  {activeBatch && (
                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] block font-mono">
                          Batch {activeBatch.batchNumber} (Exp: {activeBatch.expiryDate.slice(2, 7)})
                        </span>
                        <span className="text-[11px] font-bold text-slate-700 block">
                          Stock: {stockFormatted}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sm text-slate-900 font-mono block">
                          ₹{activeBatch.sellingPrice.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          MRP: ₹{activeBatch.mrp.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveEntryMedId(med.id);
                            if (activeBatch) setActiveEntryBatchNo(activeBatch.batchNumber);
                            setProductEntryMode('pick');
                            setIsSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Load this medicine into Sales Product Entry Box to enter custom box, strip, or loose units"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                          <span className="hidden md:inline">In Box</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddProductWithBoxStripLoose(med, activeBatch, 1, 0, 0);
                          }}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg font-extrabold text-xs shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                          title="Add 1 Full Box (10 Strips) directly in same window"
                        >
                          <Boxes className="w-3.5 h-3.5 text-indigo-700" />
                          <span>+ 1 Box</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddProductWithBoxStripLoose(med, activeBatch, 0, 1, 0);
                          }}
                          className="px-2.5 py-1.5 bg-teal-600 text-white rounded-lg font-bold text-xs shadow-2xs hover:bg-teal-700 transition-colors flex items-center gap-1 cursor-pointer"
                          title={`Add 1 Full ${packInfo.packName} / Strip directly in same window`}
                        >
                          <span>+ 1 Strip</span>
                        </button>

                        {packInfo.isLooseSellable && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddProductWithBoxStripLoose(med, activeBatch, 0, 0, 1);
                            }}
                            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            title={`Add 1 Loose ${packInfo.unitName} directly in same window (no separate window needed)`}
                          >
                            <Pill className="w-3.5 h-3.5" />
                            <span>+ 1 Loose</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real-time Barcode Scan Feedback Toast */}
      {scanFeedback && (
        <div
          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200 shadow-md ${
            scanFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : scanFeedback.type === 'increment'
              ? 'bg-sky-50 border-sky-300 text-sky-950'
              : scanFeedback.type === 'warning'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                scanFeedback.type === 'success' || scanFeedback.type === 'increment'
                  ? 'bg-emerald-600 text-white'
                  : scanFeedback.type === 'warning'
                  ? 'bg-amber-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {scanFeedback.type === 'error' ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Scan className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm tracking-tight">{scanFeedback.message}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/90 border border-current/20 font-bold shrink-0">
                  Barcode: {scanFeedback.barcode}
                </span>
              </div>
              {scanFeedback.subtext && (
                <p className="text-[11px] opacity-85 truncate mt-0.5">{scanFeedback.subtext}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowScannerGuideModal(true)}
              className="text-[11px] font-bold underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Scanner Details
            </button>
            <button
              type="button"
              onClick={() => setScanFeedback(null)}
              className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2B. SALES PRODUCT ENTRY BOX (BOX • STRIP • LOOSE UNIT — SAME WINDOW)     */}
      {/* Supports Catalog Pick and Manual Product Entry (No separate window needed) */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 border-2 border-teal-500/40 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-slate-200/80 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              productEntryMode === 'manual' ? 'bg-amber-600 text-white' : 'bg-teal-600 text-white'
            }`}>
              {productEntryMode === 'manual' ? <Edit2 className="w-4 h-4" /> : <Boxes className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  Sales Product Entry Box
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-900 border border-teal-300">
                  Same Window
                </span>
                {productEntryMode === 'manual' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                    Manual Custom Entry Mode
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    Catalog Pick Mode
                  </span>
                )}
              </div>
              <p className="text-[11px] text-teal-800 font-medium">
                Enter Box, Strip, and Loose Units directly here — no separate window or modal required!
              </p>
            </div>
          </div>

          {/* Mode Switcher: Catalog Pick vs Manual Entry */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl shrink-0 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setProductEntryMode('pick')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                productEntryMode === 'pick'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="pos-entry-mode-pick-btn"
            >
              <Boxes className="w-3.5 h-3.5 text-teal-700" />
              <span>Catalog Pick</span>
            </button>
            <button
              type="button"
              onClick={() => setProductEntryMode('manual')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                productEntryMode === 'manual'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="pos-entry-mode-manual-btn"
              title="Manual Product Entry: Type custom drug name, batch, MRP, and quantities"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Manual Entry</span>
            </button>
          </div>
        </div>

        {/* ================= MODE A: CATALOG PICK ENTRY ================= */}
        {productEntryMode === 'pick' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
              {/* Product selector with live search filter */}
              <div className="lg:col-span-4 relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Select Product ({medicines.length})
                  </label>
                  {pickFilterQuery && (
                    <button
                      type="button"
                      onClick={() => setPickFilterQuery('')}
                      className="text-[10px] text-teal-700 hover:underline font-bold flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" /> Clear filter
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <input
                    type="text"
                    value={pickFilterQuery}
                    onChange={e => setPickFilterQuery(e.target.value)}
                    placeholder="Quick filter catalog items..."
                    className="w-full px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:ring-1 focus:ring-teal-500 focus:outline-hidden mb-1"
                  />
                  <select
                    value={activeEntryMedId}
                    onChange={e => {
                      setActiveEntryMedId(e.target.value);
                      const m = medicines.find(med => med.id === e.target.value);
                      if (m && m.batches && m.batches[0]) {
                        setActiveEntryBatchNo(m.batches[0].batchNumber);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    {pickFilteredMedicines.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.genericName} (Rack: {m.rackLocation || 'A-01'}, {m.packSize || 10}s)
                      </option>
                    ))}
                    {pickFilteredMedicines.length === 0 && (
                      <option disabled value="">No matching items found</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Batch Selector */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Batch & Stock
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPickCustomBatch(!isPickCustomBatch)}
                    className="text-[10px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                    title="Toggle custom batch & MRP override"
                  >
                    {isPickCustomBatch ? 'Use Batch' : '+ Custom Batch'}
                  </button>
                </div>

                {!isPickCustomBatch ? (
                  <select
                    value={activeEntryBatchNo}
                    onChange={e => setActiveEntryBatchNo(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    {(currentEntryMedicine?.batches || []).map(b => (
                      <option key={b.batchNumber} value={b.batchNumber}>
                        {b.batchNumber} (Stk: {b.stock} packs • Exp: {b.expiryDate.slice(2, 7)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={pickCustomBatchNo}
                    onChange={e => setPickCustomBatchNo(e.target.value)}
                    placeholder="Custom Batch No"
                    className="w-full px-2.5 py-2 bg-amber-50 border border-amber-300 rounded-xl text-xs font-mono font-bold text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                )}
              </div>

              {/* BOX Input (Visible ~1 inch) */}
              <div className="lg:col-span-1 min-w-[65px]">
                <label className="block text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider mb-1 text-center">
                  Box (10s)
                </label>
                <input
                  id="pos-entry-box-qty"
                  type="number"
                  min="0"
                  value={entryBoxQty}
                  onChange={e => setEntryBoxQty(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('pos-entry-strip-qty')?.focus();
                    }
                  }}
                  placeholder="0"
                  onFocus={e => e.target.select()}
                  className="w-full px-2 py-2 bg-white border-2 border-indigo-200 rounded-xl text-xs font-mono font-bold text-indigo-950 text-center focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  title="Full Boxes (1 Box = 10 Strips) - Press Enter to move to Strip"
                />
              </div>

              {/* STRIP Input (Visible ~1 inch) */}
              <div className="lg:col-span-1 min-w-[65px]">
                <label className="block text-[10px] font-extrabold text-teal-700 uppercase tracking-wider mb-1 text-center">
                  Strip
                </label>
                <input
                  id="pos-entry-strip-qty"
                  type="number"
                  min="0"
                  value={entryStripQty}
                  onChange={e => setEntryStripQty(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (currentEntryPackInfo?.isLooseSellable) {
                        document.getElementById('pos-entry-loose-qty')?.focus();
                      } else {
                        handleCommitProductEntryBox();
                      }
                    }
                  }}
                  placeholder="1"
                  onFocus={e => e.target.select()}
                  className="w-full px-2 py-2 bg-white border-2 border-teal-300 rounded-xl text-xs font-mono font-bold text-teal-950 text-center focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  title="Full Strips / Packs - Press Enter to move to Loose"
                />
              </div>

              {/* LOOSE UNIT Input (Visible ~1 inch) */}
              <div className="lg:col-span-2 min-w-[90px]">
                <label className="block text-[10px] font-extrabold text-amber-700 uppercase tracking-wider mb-1 text-center">
                  Loose ({currentEntryPackInfo?.unitName || 'Tab'})
                </label>
                <input
                  id="pos-entry-loose-qty"
                  type="number"
                  min="0"
                  value={entryLooseQty}
                  onChange={e => setEntryLooseQty(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCommitProductEntryBox();
                    }
                  }}
                  placeholder="0"
                  onFocus={e => e.target.select()}
                  disabled={!currentEntryPackInfo?.isLooseSellable}
                  className={`w-full px-2 py-2 text-xs font-mono font-bold text-center rounded-xl focus:outline-hidden ${
                    currentEntryPackInfo?.isLooseSellable
                      ? 'bg-white border-2 border-amber-400 text-amber-950 focus:ring-2 focus:ring-amber-500'
                      : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title={currentEntryPackInfo?.isLooseSellable ? `Loose ${currentEntryPackInfo.unitName}s - Press Enter to add to bill` : 'Loose sales not applicable'}
                />
              </div>

              {/* Add to Bill Button */}
              <div className="lg:col-span-2">
                <button
                  type="button"
                  onClick={handleCommitProductEntryBox}
                  className="w-full px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  title="Add Box, Strip, and Loose Units to Bill in Same Window (Enter)"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Bill</span>
                </button>
              </div>
            </div>

            {/* Price Preview bar for Selected Catalog Item */}
            {currentEntryMedicine && (
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{currentEntryMedicine.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                    Pack: {currentEntryPackInfo?.packDisplay}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 font-mono text-[10px] font-bold">
                    Rack: {currentEntryMedicine.rackLocation || 'A-01'}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono font-bold">
                  {currentEntryMedicine.batches[0] && (
                    <>
                      <span className="text-teal-900">
                        MRP: ₹{currentEntryMedicine.batches[0].sellingPrice.toFixed(2)}/{currentEntryPackInfo?.packName || 'strip'}
                      </span>
                      {currentEntryPackInfo?.isLooseSellable && (
                        <span className="text-amber-800">
                          Loose: ₹{(currentEntryMedicine.batches[0].sellingPrice / currentEntryPackInfo.packSize).toFixed(2)}/{currentEntryPackInfo.unitName}
                        </span>
                      )}
                    </>
                  )}
                  <span className="text-indigo-700 font-sans text-[10px] font-bold">
                    Press Enter in any qty box to add
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= MODE B: MANUAL PRODUCT ENTRY ================= */}
        {productEntryMode === 'manual' && (
          <div className="space-y-3 bg-amber-50/40 p-3 sm:p-4 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                Manual Product Entry (Non-Catalog / Custom MRP Item)
              </span>
              <span className="text-[11px] text-slate-500">
                Type item details, set Box / Strip / Loose units, and press Add
              </span>
            </div>

            {/* Row 1: Product Name with autocomplete, Generic Name, Rack Location, Pack Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
              <div className="lg:col-span-4 relative">
                <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  id="pos-manual-prod-name"
                  type="text"
                  value={manualProdName}
                  onChange={e => handleManualNameChange(e.target.value)}
                  onFocus={() => {
                    if (manualProdName.trim() && manualSuggestions.length > 0) {
                      setShowManualSuggestions(true);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setShowManualSuggestions(false);
                      document.getElementById('pos-manual-generic')?.focus();
                    }
                  }}
                  placeholder="e.g. Paracetamol 650mg, Dettol Soap, Ensure Drink"
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />

                {/* Autocomplete suggestion popup for fast drug lookup */}
                {showManualSuggestions && manualSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-amber-300 rounded-xl shadow-lg overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    <div className="px-3 py-1 bg-amber-100 text-[10px] font-bold text-amber-900 flex justify-between">
                      <span>Existing Catalog Matches (Click to auto-fill)</span>
                      <button
                        type="button"
                        onClick={() => setShowManualSuggestions(false)}
                        className="text-amber-800 hover:text-black font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    {manualSuggestions.map(med => (
                      <div
                        key={med.id}
                        onClick={() => handleSelectManualSuggestion(med)}
                        className="p-2 text-xs hover:bg-amber-50 cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{med.name}</span>
                          <span className="text-[10px] text-slate-500 block">{med.genericName}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {med.rackLocation || 'Rack A-01'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-3">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Generic / Composition
                </label>
                <input
                  id="pos-manual-generic"
                  type="text"
                  value={manualGenericName}
                  onChange={e => setManualGenericName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('pos-manual-rack')?.focus();
                    }
                  }}
                  placeholder="e.g. Paracetamol IP"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Rack / Shelf
                </label>
                <input
                  id="pos-manual-rack"
                  type="text"
                  value={manualRack}
                  onChange={e => setManualRack(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('pos-manual-pack-size')?.focus();
                    }
                  }}
                  placeholder="Rack A-01"
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Pack Size (Units/Strip)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="pos-manual-pack-size"
                    type="number"
                    min="1"
                    value={manualPackSize}
                    onChange={e => setManualPackSize(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('pos-manual-batch-no')?.focus();
                      }
                    }}
                    placeholder="10"
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 text-center focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setManualPackSize('10')}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                      title="10 Tablets per Strip"
                    >
                      10s
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualPackSize('1')}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                      title="1 Unit (Syrup, Device, Cream)"
                    >
                      1s
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Batch, Expiry, MRP, Box, Strip, Loose, Discount, and Commit Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Batch No
                </label>
                <input
                  id="pos-manual-batch-no"
                  type="text"
                  value={manualBatchNo}
                  onChange={e => setManualBatchNo(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('pos-manual-expiry')?.focus();
                    }
                  }}
                  placeholder="Auto (e.g. BAT-2601)"
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Expiry Date
                </label>
                <input
                  id="pos-manual-expiry"
                  type="date"
                  value={manualExpiry}
                  onChange={e => setManualExpiry(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('pos-manual-mrp')?.focus();
                    }
                  }}
                  className="w-full px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  MRP / Strip (₹) *
                </label>
                <input
                  id="pos-manual-mrp"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={manualMrp}
                  onChange={e => setManualMrp(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('pos-manual-box-qty')?.focus();
                    }
                  }}
                  placeholder="e.g. 50.00"
                  className="w-full px-2.5 py-2 bg-white border-2 border-emerald-400 rounded-xl text-xs font-mono font-extrabold text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* BOX Input (Visible ~1 inch) */}
              <div className="lg:col-span-1 min-w-[65px]">
                <label className="block text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider mb-1 text-center">
                  Box (10s)
                </label>
                <input
                  id="pos-manual-box-qty"
                  type="number"
                  min="0"
                  value={entryBoxQty}
                  onChange={e => setEntryBoxQty(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('pos-manual-strip-qty')?.focus();
                    }
                  }}
                  placeholder="0"
                  onFocus={e => e.target.select()}
                  className="w-full px-2 py-2 bg-white border-2 border-indigo-200 rounded-xl text-xs font-mono font-bold text-indigo-950 text-center focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  title="Full Boxes (1 Box = 10 Strips)"
                />
              </div>

              {/* STRIP Input (Visible ~1 inch) */}
              <div className="lg:col-span-1 min-w-[65px]">
                <label className="block text-[10px] font-extrabold text-teal-700 uppercase tracking-wider mb-1 text-center">
                  Strip
                </label>
                <input
                  id="pos-manual-strip-qty"
                  type="number"
                  min="0"
                  value={entryStripQty}
                  onChange={e => setEntryStripQty(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('pos-manual-loose-qty')?.focus();
                    }
                  }}
                  placeholder="1"
                  onFocus={e => e.target.select()}
                  className="w-full px-2 py-2 bg-white border-2 border-teal-300 rounded-xl text-xs font-mono font-bold text-teal-950 text-center focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  title="Full Strips / Packs"
                />
              </div>

              {/* LOOSE UNIT Input (Visible ~1 inch) */}
              <div className="lg:col-span-1 min-w-[70px]">
                <label className="block text-[10px] font-extrabold text-amber-700 uppercase tracking-wider mb-1 text-center">
                  Loose Tab
                </label>
                <input
                  id="pos-manual-loose-qty"
                  type="number"
                  min="0"
                  value={entryLooseQty}
                  onChange={e => setEntryLooseQty(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('pos-manual-disc')?.focus();
                    }
                  }}
                  placeholder="0"
                  onFocus={e => e.target.select()}
                  className="w-full px-2 py-2 bg-white border-2 border-amber-400 text-amber-950 font-bold font-mono text-center rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  title="Loose Tablets/Units"
                />
              </div>

              {/* Line Discount % */}
              <div className="lg:col-span-1 min-w-[65px]">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1 text-center">
                  Disc %
                </label>
                <input
                  id="pos-manual-disc"
                  type="number"
                  min="0"
                  max="100"
                  value={manualDiscount}
                  onChange={e => setManualDiscount(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCommitProductEntryBox();
                    }
                  }}
                  placeholder="0"
                  className="w-full px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 text-center focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Add Manual Item Button */}
              <div className="lg:col-span-2">
                <button
                  type="button"
                  onClick={handleCommitProductEntryBox}
                  className="w-full px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  title="Add Manual Product to Bill (Enter)"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Bill</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. WIDE LINE-BY-LINE SALE BILLING TABLE                                    */}
      {/* Exact requested columns:                                                 */}
      {/* Product Name | Location/Racks | Batch | Expiry | Pack | Unit | MRP |     */}
      {/* Discount | Amount                                                         */}
      {/* ========================================================================= */}

      {/* Schedule H1 Statutory Compliance Warning Banner */}
      {scheduleH1CartItems.length > 0 && (
        <div className="p-3.5 bg-rose-50 border-2 border-rose-400 rounded-2xl flex items-start justify-between gap-3 text-xs shadow-xs animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-rose-950 text-xs uppercase tracking-wide">
                  ⚠️ STATUTORY COMPLIANCE: SCHEDULE H1 MEDICINE IN CART
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 font-extrabold text-[10px] uppercase">
                  Rule 65(9) Prescription Mandatory
                </span>
              </div>
              <p className="text-rose-800 text-[11px] mt-1">
                Cart contains Schedule H1 drug: <strong className="font-extrabold text-rose-950">{scheduleH1CartItems.map(i => i.medicine.name).join(', ')}</strong>.
                A valid Registered Medical Practitioner (Doctor) prescription & registration details are <strong className="underline">MANDATORY</strong> by statutory law before dispensing.
              </p>
            </div>
          </div>
          <span className="shrink-0 px-2.5 py-1 bg-rose-600 text-white font-bold text-[11px] rounded-xl">
            Rx Required
          </span>
        </div>
      )}

      <div
        ref={tableContainerRef}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 uppercase text-[11px] tracking-wider font-extrabold">
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-3 min-w-[200px]">Product Name & Molecule</th>
                <th className="py-3 px-3 min-w-[110px]">Location / Racks</th>
                <th className="py-3 px-3 min-w-[110px]">Batch</th>
                <th className="py-3 px-3 min-w-[90px]">Expiry</th>
                <th className="py-3 px-3 min-w-[95px]">Pack Specs</th>
                <th className="py-3 px-1 w-[72px] min-w-[68px] text-center font-extrabold text-indigo-950 bg-indigo-50/80 border-x border-slate-200">
                  BOX
                </th>
                <th className="py-3 px-1 w-[72px] min-w-[68px] text-center font-extrabold text-teal-950 bg-teal-50/80 border-r border-slate-200">
                  STRIP
                </th>
                <th className="py-3 px-1 w-[72px] min-w-[68px] text-center font-extrabold text-amber-950 bg-amber-50/80 border-r border-slate-200">
                  UNIT (LOOSE)
                </th>
                <th className="py-3 px-2 w-[85px] min-w-[80px] text-right font-extrabold text-slate-900 bg-amber-50/50">
                  MRP (₹)
                </th>
                <th className="py-3 px-2 w-[72px] min-w-[68px] text-center">Disc (%)</th>
                <th className="py-3 px-3 min-w-[110px] text-right">Amount (₹)</th>
                <th className="py-3 px-3 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cart.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                      <p className="font-extrabold text-slate-700 text-sm">
                        No Medicines Added to Current Sale Bill
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Type in the top search bar above or press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-600">F1</kbd> to add medicines line-by-line.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                cart.map((item, idx) => {
                  const packInfo = getPackDetails(item.medicine);
                  const isLoose = item.unitType === 'loose';
                  const pricing = calculateLinePricing({
                    unitType: item.unitType,
                    quantity: item.quantity,
                    boxQuantity: item.boxQuantity,
                    stripQuantity: item.stripQuantity,
                    looseQuantity: item.looseQuantity,
                    packSize: item.packSize || packInfo.packSize,
                    boxSize: item.boxSize,
                    customMrp: item.customMrp,
                    sellingPrice: item.selectedBatch.sellingPrice,
                    discountPercent: item.discountPercent
                  });
                  const rack = item.medicine.rackLocation || item.selectedBatch.location || 'Rack A-01';
                  const isNearExpiry = new Date(item.selectedBatch.expiryDate) < new Date(Date.now() + 60 * 86400000);
                  const maxLooseAvailable = Math.round(item.selectedBatch.stock * packInfo.packSize);

                  return (
                    <tr
                      key={`${item.medicine.id}-${item.selectedBatch.batchNumber}-${item.unitType || 'pack'}-${idx}`}
                      className={`transition-colors group ${isLoose ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-teal-50/30'}`}
                      tabIndex={0}
                    >
                      {/* # S.No */}
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono font-bold text-xs">
                        {idx + 1}
                      </td>

                      {/* Product Name */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {item.medicine.name}
                          </span>
                          {(item.medicine.scheduleType === 'H1' || getMedicineScheduleInfo(item.medicine).scheduleType === 'H1') && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300 shrink-0 uppercase tracking-tight" title="Schedule H1 Drug - Doctor Prescription Mandatory">
                              H1 Rx
                            </span>
                          )}
                          {isLoose ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                              <Pill className="w-2.5 h-2.5 text-amber-700" />
                              Loose {item.unitName || packInfo.unitName}
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium shrink-0">
                              Full {packInfo.packName}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                          <span>{item.medicine.genericName}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-400">{item.medicine.strength}</span>
                        </div>
                      </td>

                      {/* Location / Racks */}
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                          <MapPin className="w-3 h-3 text-teal-600" />
                          <span>{rack}</span>
                        </span>
                      </td>

                      {/* Batch */}
                      <td className="py-2.5 px-3">
                        {item.isManualBatch || !item.selectedBatch?.batchNumber || (item.medicine.batches || []).length === 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={item.selectedBatch?.batchNumber || ''}
                                onChange={e => handleManualBatchInput(idx, e.target.value)}
                                placeholder="Enter Batch #"
                                className={`w-28 px-2 py-1 bg-white border text-xs font-mono font-bold rounded-lg focus:outline-hidden uppercase placeholder:normal-case placeholder:text-slate-400 ${
                                  !item.selectedBatch?.batchNumber?.trim()
                                    ? 'border-amber-400 bg-amber-50/40 text-amber-900 focus:ring-1 focus:ring-amber-500 ring-1 ring-amber-300'
                                    : 'border-teal-500 text-teal-900 focus:ring-1 focus:ring-teal-500'
                                }`}
                                title="Type manual batch number from physical packaging"
                              />
                              {(item.medicine.batches || []).length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleManualBatch(idx)}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded bg-slate-100 hover:bg-slate-200 cursor-pointer"
                                  title="Switch to select existing batch"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {!item.selectedBatch?.batchNumber?.trim() && (
                              <span className="text-[10px] text-amber-700 font-bold block">
                                Enter batch no.
                              </span>
                            )}
                          </div>
                        ) : (item.medicine.batches || []).length > 1 ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={item.selectedBatch.batchNumber}
                              onChange={e => {
                                if (e.target.value === '__custom__') {
                                  handleToggleManualBatch(idx);
                                } else {
                                  handleUpdateBatch(idx, e.target.value);
                                }
                              }}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-teal-500"
                            >
                              {(item.medicine.batches || []).map(b => (
                                <option key={b.batchNumber} value={b.batchNumber}>
                                  {b.batchNumber} (Stk: {formatStockDisplay(b.stock, packInfo.packSize, packInfo.packName, packInfo.unitName)})
                                </option>
                              ))}
                              <option value="__custom__">+ Manual Custom Batch</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleToggleManualBatch(idx)}
                              className="p-1 text-slate-400 hover:text-teal-700 rounded hover:bg-slate-100 cursor-pointer"
                              title="Type batch manually"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-bold text-slate-800 text-xs">
                              {item.selectedBatch.batchNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleManualBatch(idx)}
                              className="p-1 text-slate-400 hover:text-teal-700 rounded hover:bg-slate-100 cursor-pointer"
                              title="Edit / Manual Batch Entry"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Expiry */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded-md font-semibold ${
                            isNearExpiry
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'text-slate-700 bg-slate-100/60'
                          }`}
                          title={`Expiry Date: ${formatExpiryDMY(item.selectedBatch.expiryDate)} (Date/Month/Year Model)`}
                        >
                          {formatExpiryDMY(item.selectedBatch.expiryDate)}
                        </span>
                      </td>

                      {/* Pack Specifications */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800 text-xs">
                          {packInfo.packDisplay}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          1 Box = {item.boxSize || 10} {packInfo.packName}s
                        </div>
                        {packInfo.isLooseSellable && (
                          <div className="text-[10px] text-teal-700 font-medium">
                            1 {packInfo.packName} = {packInfo.packSize} {packInfo.unitName}s
                          </div>
                        )}
                      </td>

                      {/* 1. BOX (1-inch column: ~72px) */}
                      <td className="py-2 px-1 text-center bg-indigo-50/20 border-x border-slate-100">
                        <input
                          type="number"
                          min="0"
                          value={item.boxQuantity && item.boxQuantity > 0 ? item.boxQuantity : ''}
                          placeholder="0"
                          onFocus={e => e.target.select()}
                          onChange={e => handleUpdateBoxStripLoose(idx, 'box', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              document.getElementById(`cart-strip-${idx}`)?.focus();
                            }
                          }}
                          className="w-12 h-9 text-center font-mono font-bold text-xs bg-white border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-indigo-950 shadow-2xs mx-auto block"
                          title="Number of Full Boxes (1 Box = 10 Strips) - Press Enter to move to Strip"
                          id={`cart-box-${idx}`}
                        />
                      </td>

                      {/* 2. STRIP (1-inch column: ~72px) */}
                      <td className="py-2 px-1 text-center bg-teal-50/20 border-r border-slate-100">
                        <input
                          type="number"
                          min="0"
                          value={
                            item.stripQuantity !== undefined
                              ? (item.stripQuantity > 0 ? item.stripQuantity : (item.looseQuantity || item.boxQuantity ? '' : '0'))
                              : item.unitType !== 'loose' && item.quantity > 0
                              ? Math.floor(item.quantity)
                              : ''
                          }
                          placeholder="0"
                          onFocus={e => e.target.select()}
                          onChange={e => handleUpdateBoxStripLoose(idx, 'strip', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (packInfo.isLooseSellable) {
                                document.getElementById(`cart-unit-${idx}`)?.focus();
                              } else {
                                document.getElementById(`cart-disc-${idx}`)?.focus();
                              }
                            }
                          }}
                          className="w-12 h-9 text-center font-mono font-bold text-xs bg-white border-2 border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-teal-950 shadow-2xs mx-auto block"
                          title={`Number of ${packInfo.packName}s / Full Packs - Press Enter to move to Loose / Discount`}
                          id={`cart-strip-${idx}`}
                        />
                      </td>

                      {/* 3. UNIT (1-inch column: ~72px) */}
                      <td className="py-2 px-1 text-center bg-amber-50/20 border-r border-slate-100">
                        <input
                          type="number"
                          min="0"
                          value={item.looseQuantity && item.looseQuantity > 0 ? item.looseQuantity : ''}
                          placeholder="0"
                          onFocus={e => e.target.select()}
                          onChange={e => handleUpdateBoxStripLoose(idx, 'loose', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              document.getElementById(`cart-disc-${idx}`)?.focus();
                            }
                          }}
                          disabled={!packInfo.isLooseSellable}
                          className={`w-12 h-9 text-center font-mono font-bold text-xs rounded-lg shadow-2xs mx-auto block ${
                            packInfo.isLooseSellable
                              ? 'bg-white border-2 border-amber-300 focus:ring-2 focus:ring-amber-500 text-amber-950'
                              : 'bg-slate-100 border border-slate-200 text-slate-300 cursor-not-allowed'
                          }`}
                          title={packInfo.isLooseSellable ? `Loose ${packInfo.unitName}s - Press Enter to move to Discount` : 'Loose sales not applicable'}
                          id={`cart-unit-${idx}`}
                        />
                      </td>

                      {/* MRP (1-inch column: ~85px) */}
                      <td className="py-2.5 px-2 text-right bg-amber-50/15">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          ₹{pricing.unitPrice.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {pricing.isLoose ? `per ${item.unitName || packInfo.unitName}` : `per ${packInfo.packName}`}
                        </div>
                        {packInfo.isLooseSellable && !pricing.isLoose && (
                          <div className="text-[9px] text-amber-700 font-mono">
                            (₹{pricing.loosePrice.toFixed(2)}/{item.unitName || packInfo.unitName})
                          </div>
                        )}
                      </td>

                      {/* Discount (%) */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="inline-flex items-center justify-center">
                          <input
                            id={`cart-disc-${idx}`}
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={item.discountPercent ? item.discountPercent : ''}
                            placeholder=""
                            onFocus={e => e.target.select()}
                            onChange={e => handleUpdateDiscount(idx, e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const nextRow = document.getElementById(`cart-box-${idx + 1}`);
                                if (nextRow) {
                                  nextRow.focus();
                                } else {
                                  searchInputRef.current?.focus();
                                }
                              }
                            }}
                            className="w-12 py-1 text-center font-mono text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500 font-bold text-emerald-700 mx-auto block"
                            title="Item Discount % - Press Enter to move to next item row or product search"
                          />
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="font-mono font-extrabold text-slate-900 text-sm">
                          ₹{pricing.netAmount.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {formatQuantityWithUnit(item)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveGenericMed(item.medicine)}
                            className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Generic Alternative Substitutes"
                          >
                            <Sparkles className="w-4 h-4 text-teal-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ========================================================================= */}
        {/* 4. BOTTOM FULL-WIDTH TOTALS & FINANCIALS LEDGER                            */}
        {/* Total | Net Amount | Total Discount | Checkout Controls                   */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 border-t border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Left: Financial Ledger Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 flex-1">
            {/* Total Items & Units */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Items & Units
              </span>
              <div className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
                {cart.length} Lines • {totalUnits} Units
              </div>
            </div>

            {/* Total (Gross MRP) */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Gross MRP
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-200 mt-0.5">
                ₹{subtotal.toFixed(2)}
              </div>
            </div>

            {/* Total Discount */}
            <div className="relative group">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Total Discount
                </span>
                <button
                  type="button"
                  onClick={() => setShowTotalDiscountModal(true)}
                  className="text-[10px] font-bold text-emerald-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 px-1.5 py-0.5 rounded transition-colors flex items-center gap-0.5 cursor-pointer"
                  title="Click to edit total discount (F4 or Ctrl+D)"
                  id="pos-footer-edit-total-disc-btn"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                  <span>Edit [F4]</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowTotalDiscountModal(true)}
                className="text-left cursor-pointer group-hover:opacity-85 transition-opacity block"
                title="Click to edit total discount"
              >
                <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  <span>-₹{totalDiscount.toFixed(2)}</span>
                  {subtotal > 0 && totalDiscount > 0 && (
                    <span className="text-xs text-emerald-300/80 font-normal">
                      ({((totalDiscount / subtotal) * 100).toFixed(1)}%)
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* GST Tax Included */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                GST Tax Included
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-300 mt-0.5">
                ₹{totalTax.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Right: Net Amount Display & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 pt-3 lg:pt-0 lg:pl-6">
            {/* Big Net Amount Banner */}
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400 block">
                NET AMOUNT
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                ₹{grandTotal.toFixed(2)}
              </div>
            </div>

            {/* Save as Draft Button (F8) */}
            <button
              type="button"
              onClick={() => {
                if (cart.length === 0) {
                  alert('Cannot save an empty sale as draft. Add items first.');
                  return;
                }
                setShowDraftsModal(true);
              }}
              disabled={cart.length === 0}
              className="px-3 py-2.5 bg-amber-950/50 hover:bg-amber-900/70 disabled:bg-slate-800/40 text-amber-300 border border-amber-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer disabled:cursor-not-allowed"
              title="Save this sale as draft [F8] (remains saved until manually deleted)"
              id="pos-bottom-draft-btn"
            >
              <Archive className="w-4 h-4 text-amber-400" />
              <span>Draft [F8]</span>
            </button>

            {/* Quick Cash & Print Button (F10) */}
            <button
              onClick={handleQuickCashSale}
              disabled={cart.length === 0}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/40 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all active:scale-98"
              title="Cash & Print Invoice [F10 / Ctrl+Enter]"
              id="pos-cash-print-btn"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              <span>Cash & Print [F10]</span>
            </button>

            {/* 3" Thermal Quick Action Button */}
            <button
              onClick={() => {
                if (cart.length > 0) {
                  handleQuickCashSale();
                } else {
                  const allTxs = StorageService.getTransactions();
                  const txToUse = lastTransactionForPrint || allTxs[0];
                  if (txToUse) {
                    printDirectBill(txToUse, pharmacyProfile, 'thermal', printerSettings);
                    setScanFeedback({
                      type: 'success',
                      title: '3" Thermal Receipt Dispatched',
                      message: `Printed invoice #${txToUse.id}`
                    });
                  }
                }
              }}
              className="px-3 py-2.5 bg-teal-950/70 hover:bg-teal-900 text-teal-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-teal-700/60 transition-all active:scale-98 cursor-pointer"
              title="Print 3-inch ESC/POS thermal receipt directly"
              id="pos-3inch-thermal-btn"
            >
              <Receipt className="w-4 h-4 text-teal-400" />
              <span className="hidden lg:inline">3" Thermal</span>
            </button>

            {/* Confirm Save & Instant Bill Print Button */}
            <button
              onClick={() => setShowConfirmRetailSaleModal(true)}
              disabled={cart.length === 0}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-98 cursor-pointer"
              title="Confirm Retail Sale Save & Instant Bill Print"
              id="pos-confirm-save-instant-print-btn"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Save &amp; Print Bill</span>
            </button>

            {/* Full Cash Payment Button (F4) */}
            <button
              onClick={() => {
                setCheckoutMethod('Cash');
                setShowCheckoutModal(true);
              }}
              disabled={cart.length === 0}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-98 cursor-pointer"
              title="Full Cash Payment [F4]"
              id="pos-full-cash-btn"
            >
              <Banknote className="w-4 h-4 text-emerald-200" />
              <span>Full Cash [F4]</span>
            </button>

            {/* Dynamic UPI Payment QR Code Button (F12) */}
            <button
              onClick={() => setShowDynamicUpiModal(true)}
              disabled={cart.length === 0}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/25 transition-all active:scale-98 cursor-pointer ring-2 ring-emerald-400/40"
              title="Generate Dynamic UPI Payment QR for this exact bill total [F12 / Alt+U]"
              id="pos-dynamic-upi-qr-btn"
            >
              <QrCode className="w-4 h-4 text-slate-950" />
              <span>UPI QR [F12]</span>
            </button>

            {/* Part Cash / UPI Split Button (F5) */}
            <button
              onClick={() => {
                setCheckoutMethod('Split');
                setShowCheckoutModal(true);
              }}
              disabled={cart.length === 0}
              className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 transition-all active:scale-98 cursor-pointer"
              title="Split Payment: Partial Cash + Partial UPI [F5]"
              id="pos-part-cash-upi-btn"
            >
              <Split className="w-4 h-4 text-slate-900" />
              <span>Part Cash / UPI [F5]</span>
            </button>

            {/* All Checkout Modes Button */}
            <button
              onClick={() => {
                setCheckoutMethod('UPI');
                setShowCheckoutModal(true);
              }}
              disabled={cart.length === 0}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all active:scale-98 cursor-pointer"
              title="View UPI, Card, and All Payment Methods"
              id="pos-proceed-payment-btn"
            >
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span>All Pay Options</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. DESKTOP KEYBOARD ACCESS SHORTCUTS MAP BAR                               */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-600 flex items-center justify-between overflow-x-auto gap-4 scrollbar-none font-medium">
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-bold text-slate-900 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Hotkeys:</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px] text-slate-800">F1</kbd> Search
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px] text-slate-800">F2</kbd> Customer
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px] text-slate-800">F3</kbd> Doctor
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px] text-slate-800">F4</kbd> Checkout
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px] text-slate-800">F7</kbd> Generics
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px] text-slate-800">F8</kbd> Hold
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px] text-slate-800">F9</kbd> New
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px] text-slate-800">F10</kbd> Print
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px] text-slate-800">F11</kbd> Full Screen
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-teal-100 border border-teal-300 rounded font-mono font-bold text-[10px] text-teal-800">F12</kbd> UPI QR
          </span>
        </div>

        <div className="shrink-0 text-slate-400 text-[10px]">
          City Rx Melur Terminal • Ready
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. MODALS: CHECKOUT, PRINT INVOICE, HELD BILLS, MOBILE APP, GENERICS      */}
      {/* ========================================================================= */}

      {/* Payment & Checkout Modal */}
      {showCheckoutModal && (
        <POSCheckoutModal
          cart={cart}
          selectedPatient={selectedPatient}
          selectedDoctor={selectedDoctor}
          walkInCustomer={{
            name: walkInName,
            phone: walkInPhone,
            age: walkInAge,
            location: walkInLocation
          }}
          initialMethod={checkoutMethod}
          subtotal={subtotal}
          totalTax={totalTax}
          totalDiscount={totalDiscount}
          grandTotal={grandTotal}
          cashierName={currentUser?.name || currentUser?.username || 'Staff Pharmacist'}
          invoiceDate={invoiceDate}
          saleType={posMode}
          wholesaleBuyer={posMode === 'wholesale' ? selectedWholesaleBuyer : undefined}
          transportMode={wholesaleTransportMode}
          vehicleNumber={wholesaleVehicleNo}
          ewayBillNo={wholesaleEwayBill}
          creditDays={selectedWholesaleBuyer?.creditDays || 30}
          onEditDiscount={() => setShowTotalDiscountModal(true)}
          onClose={() => setShowCheckoutModal(false)}
          onPaymentSuccess={tx => {
            if (consultationId) {
              StorageService.markConsultationDispensed(consultationId, tx.id);
            }
            setLastTransactionForPrint(tx);
            onTransactionComplete(tx);
            setCart([]);
            setExtraBillDiscount(0);
          }}
        />
      )}

      {/* Total Discount Edit Modal [F4 / Ctrl+D] */}
      <TotalDiscountEditModal
        isOpen={showTotalDiscountModal}
        onClose={() => setShowTotalDiscountModal(false)}
        subtotal={subtotal}
        currentDiscount={totalDiscount}
        onApplyDiscount={handleApplyTotalDiscount}
      />

      {/* Dynamic UPI Payment QR Code Generator Modal [F12] */}
      {showDynamicUpiModal && (
        <DynamicUpiQrGenerator
          amount={grandTotal}
          customerName={walkInName.trim() || selectedPatient?.name || 'Walk-in Customer'}
          customerPhone={walkInPhone.trim() || selectedPatient?.phone || ''}
          cartItemCount={cart.length}
          isOpen={showDynamicUpiModal}
          onClose={() => setShowDynamicUpiModal(false)}
          onPaymentConfirmed={paymentDetails => {
            handleQuickUpiSale(paymentDetails);
          }}
        />
      )}

      {/* Confirm Retail Sale Save & Instant Bill Print Modal */}
      {showConfirmRetailSaleModal && (
        <ConfirmRetailSaleModal
          isOpen={showConfirmRetailSaleModal}
          onClose={() => setShowConfirmRetailSaleModal(false)}
          cart={cart}
          selectedPatient={selectedPatient}
          selectedDoctor={selectedDoctor}
          walkInCustomer={{
            name: walkInName,
            phone: walkInPhone,
            age: walkInAge,
            location: walkInLocation
          }}
          subtotal={subtotal}
          totalTax={totalTax}
          totalDiscount={totalDiscount}
          grandTotal={grandTotal}
          cashierName={currentUser?.name || currentUser?.username || 'Staff Pharmacist'}
          invoiceDate={invoiceDate}
          consultationId={consultationId}
          initialPaymentMethod={checkoutMethod === 'Split' ? 'Split' : checkoutMethod === 'UPI' ? 'UPI' : checkoutMethod === 'Card' ? 'Card' : 'Cash'}
          onSaveAsDraft={() => setShowDraftsModal(true)}
          onSaleConfirmedAndSaved={tx => {
            setLastTransactionForPrint(tx);
            onTransactionComplete(tx);
            setCart([]);
            setExtraBillDiscount(0);
          }}
        />
      )}

      {/* Printer-Friendly Tax Invoice Modal */}
      {showPrintModal && (
        <PrintInvoiceModal
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            if (cart.length > 0) setCart([]);
          }}
          transaction={lastTransactionForPrint}
          cart={cart}
          patient={selectedPatient}
          doctor={selectedDoctor}
          paymentMethod={lastTransactionForPrint?.paymentMethod || 'Cash'}
        />
      )}

      {/* Mobile App Download Modal */}
      {showMobileAppModal && (
        <MobileAppDownloadModal
          isOpen={showMobileAppModal}
          onClose={() => setShowMobileAppModal(false)}
        />
      )}

      {/* Sales Drafts Manager Modal */}
      <SalesDraftsModal
        isOpen={showDraftsModal}
        onClose={() => setShowDraftsModal(false)}
        currentCart={cart}
        currentPatientId={selectedPatientId}
        currentPatientName={selectedPatient?.name}
        currentPatientPhone={selectedPatient?.phone}
        currentDoctorId={selectedDoctorId}
        currentDoctorName={selectedDoctor?.name}
        currentGrandTotal={grandTotal}
        currentSubtotal={subtotal}
        currentTotalDiscount={totalDiscount}
        currentTotalTax={totalTax}
        onSaveCurrentAsDraft={(note, title) => {
          refreshSalesDrafts();
          setCart([]);
        }}
        onResumeDraft={handleResumeDraft}
        onDraftsUpdated={refreshSalesDrafts}
      />

      {/* Generic Molecule Substitution Quick Modal */}
      {activeGenericMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Generic Substitutes for {activeGenericMed.name}
                  </h3>
                  <p className="text-xs text-emerald-700 font-medium">
                    Molecule: {activeGenericMed.genericName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveGenericMed(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {StorageService.findGenericAlternatives(activeGenericMed).length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">
                  No bio-equivalent alternatives configured for this molecule.
                </p>
              ) : (
                StorageService.findGenericAlternatives(activeGenericMed).map(alt => (
                  <div
                    key={alt.medicineId}
                    className="p-3 bg-slate-50 hover:bg-teal-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-extrabold text-slate-900">{alt.brandName}</p>
                      <p className="text-[10px] text-slate-500">
                        {alt.manufacturer} • {alt.strength}
                      </p>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="font-mono font-bold text-slate-900 block text-sm">
                          ₹{alt.sellingPrice.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Save {alt.savingsPercentage}%
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const medMatch = medicines.find(m => m.id === alt.medicineId);
                          if (medMatch) {
                            handleAddToCart(medMatch);
                            setActiveGenericMed(null);
                          }
                        }}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-2xs"
                      >
                        Substitute
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveGenericMed(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Keyboard Map Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                Desktop Billing Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600">Focus Product Search & Barcode:</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">F1</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600">Select Customer / Patient:</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">F2</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600">Select Prescribing Doctor:</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">F3</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600">Open Checkout & Payment Modal:</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">F4</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600">Quick Loose Quantity Dispensing:</span>
                <kbd className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 rounded font-mono font-bold">F6</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600">Generic Substitute Alternatives:</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">F7</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600">Hold Current Bill:</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">F8</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600">Clear / New Bill:</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">F9</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600">Quick Cash & Print Invoice:</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">F10 / Ctrl+Enter</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600">Toggle Full Screen Mode:</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">F11</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600">Hardware Barcode Scanner:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1 font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Always Active (Auto-Adds)
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600">Barcode Guide & Simulator:</span>
                <kbd className="px-2 py-0.5 bg-teal-50 border border-teal-300 text-teal-800 rounded font-mono font-bold">Alt+B</kbd>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK LOOSE QUANTITY DISPENSING MODAL [F6]                                */}
      {/* ========================================================================= */}
      {showLooseModal && looseModalMedicine && looseModalBatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                  <Pill className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-base">Loose Quantity Dispensing</h3>
                  <p className="text-xs text-amber-100">Sell individual tablets, capsules, or units</p>
                </div>
              </div>
              <button
                onClick={() => setShowLooseModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Medicine & Batch info */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="font-extrabold text-slate-900 text-sm">
                  {looseModalMedicine.name}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {looseModalMedicine.genericName} • {looseModalMedicine.strength}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-xs font-mono">
                  <span className="text-slate-600">
                    Batch: <strong className="text-slate-800">{looseModalBatch.batchNumber}</strong> (Exp: {looseModalBatch.expiryDate.slice(2, 7)})
                  </span>
                  <span className="text-emerald-700 font-bold">
                    Stock: {looseModalBatch.stock} Strips ({Math.round(looseModalBatch.stock * (getPackDetails(looseModalMedicine).packSize))} Tabs)
                  </span>
                </div>
              </div>

              {/* Pricing breakdown */}
              {(() => {
                const packInfo = getPackDetails(looseModalMedicine);
                const packSize = packInfo.packSize;
                const tabRate = Number((looseModalBatch.sellingPrice / packSize).toFixed(2));
                const totalGross = tabRate * looseModalQty;
                const totalDisc = (totalGross * looseModalDiscount) / 100;
                const totalNet = totalGross - totalDisc;
                const stripDeduction = Number((looseModalQty / packSize).toFixed(3));

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
                        <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">Full Strip MRP</span>
                        <span className="text-base font-black text-slate-800 font-mono">₹{looseModalBatch.sellingPrice.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500 block">1 Strip = {packSize} {packInfo.unitName}s</span>
                      </div>
                      <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
                        <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">Loose Tablet Rate</span>
                        <span className="text-base font-black text-emerald-700 font-mono">₹{tabRate.toFixed(2)}</span>
                        <span className="text-[10px] text-emerald-600 block">per {packInfo.unitName}</span>
                      </div>
                    </div>

                    {/* Quantity Presets */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Prescription Duration Quick Presets:
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { label: '1 Day', tabs: 2 },
                          { label: '2 Days', tabs: 4 },
                          { label: '3 Days', tabs: 6 },
                          { label: '5 Days', tabs: 10 },
                          { label: '7 Days', tabs: 14 }
                        ].map(p => (
                          <button
                            key={p.tabs}
                            type="button"
                            onClick={() => setLooseModalQty(p.tabs)}
                            className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all border ${
                              looseModalQty === p.tabs
                                ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                                : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <div className="text-[10px] font-medium opacity-80">{p.label}</div>
                            <div className="font-mono font-black">{p.tabs} {packInfo.unitName}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Quantity Stepper */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Custom Loose Quantity ({packInfo.unitName}s):
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLooseModalQty(Math.max(1, looseModalQty - 1))}
                          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-lg"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={Math.round(looseModalBatch.stock * packSize)}
                          value={looseModalQty}
                          onChange={e => setLooseModalQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="flex-1 py-2 text-center font-mono font-black text-lg bg-slate-50 border-2 border-amber-400 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setLooseModalQty(looseModalQty + 1)}
                          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-lg"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1 font-mono">
                        <span>Inventory deducted: <strong>{stripDeduction} {packInfo.packName}</strong></span>
                        <span>Remaining: <strong>{Math.max(0, Math.round(looseModalBatch.stock * packSize) - looseModalQty)} {packInfo.unitName}s</strong></span>
                      </div>
                    </div>

                    {/* Total & Confirmation */}
                    <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 uppercase font-semibold block">Total for {looseModalQty} {packInfo.unitName}s</span>
                        <span className="text-2xl font-black font-mono text-amber-400">₹{totalNet.toFixed(2)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleConfirmLooseModal}
                        className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
                        id="confirm-loose-add-btn"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Bill</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {/* New Walk-In Customer Modal (Mobile, Age, Location, Chronic Conditions) */}
      {showNewCustomerModal && (
        <NewWalkInCustomerModal
          isOpen={showNewCustomerModal}
          initialName={walkInName !== 'Walk-in Customer' ? walkInName : ''}
          initialPhone={walkInPhone}
          initialAge={walkInAge}
          initialLocation={walkInLocation}
          onClose={() => setShowNewCustomerModal(false)}
          onCustomerCreated={customer => {
            setWalkInName(customer.name);
            setWalkInPhone(customer.phone);
            setWalkInAge(customer.age ? String(customer.age) : '');
            setWalkInLocation(customer.location || '');
            if (customer.patientId) {
              setSelectedPatientId(customer.patientId);
              setPatientList(StorageService.getPatients());
            } else {
              setSelectedPatientId('');
            }
            setShowNewCustomerModal(false);
          }}
        />
      )}

      {/* Barcode Scanner Guide & Interactive Testing Modal */}
      {showScannerGuideModal && (
        <BarcodeScannerGuideModal
          isOpen={showScannerGuideModal}
          onClose={() => setShowScannerGuideModal(false)}
          medicines={medicines}
          onSimulateScan={handleBarcodeScanned}
          lastScannedBarcode={lastScannedBarcode}
          scanCount={scanCount}
          soundEnabled={scannerSoundEnabled}
          onToggleSound={setScannerSoundEnabled}
        />
      )}

      {/* Desktop Download Modal (City Rx) */}
      {showDesktopAppModal && (
        <DesktopDownloadModal
          isOpen={showDesktopAppModal}
          onClose={() => setShowDesktopAppModal(false)}
          pharmacyName="City Rx"
        />
      )}

      {/* Connect Thermal Printer Hardware Modal */}
      <ConnectPrinterModal
        isOpen={showConnectPrinterModal}
        onClose={() => setShowConnectPrinterModal(false)}
        onPrinterConnected={newSettings => {
          setPrinterSettings(newSettings);
        }}
      />

      {/* Quick Edit GST Number Modal */}
      <EditGstinModal
        isOpen={showEditGstinModal}
        onClose={() => setShowEditGstinModal(false)}
        onGstinUpdated={() => {
          setPharmacyProfile(StorageService.getPharmacyProfile());
        }}
      />

      {/* QR Code Upload, Change & Edit Modal */}
      <EditQrCodeModal
        isOpen={showEditQrCodeModal}
        onClose={() => setShowEditQrCodeModal(false)}
        onQrUpdated={updated => {
          setPharmacyProfile(updated);
        }}
      />

      {/* Add Wholesale Chemist / Hospital Buyer Modal */}
      {showAddWholesaleBuyerModal && (
        <AddWholesaleBuyerModal
          isOpen={showAddWholesaleBuyerModal}
          onClose={() => setShowAddWholesaleBuyerModal(false)}
          onSave={newBuyer => {
            StorageService.addWholesaleBuyer(newBuyer);
            setWholesaleBuyers(StorageService.getWholesaleBuyers());
            setSelectedWholesaleBuyerId(newBuyer.id);
            setShowAddWholesaleBuyerModal(false);
          }}
        />
      )}
    </div>
  );
};
