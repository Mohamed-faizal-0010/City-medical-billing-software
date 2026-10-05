import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  X,
  Printer,
  ChevronRight,
  Boxes,
  ArrowUpRight,
  Barcode,
  Receipt,
  Trash2,
  Keyboard,
  Sparkles,
  DollarSign,
  PackagePlus,
  Layers,
  ArrowDownRight,
  Info,
  BadgePercent,
  Maximize2,
  Minimize2,
  Smartphone,
  Monitor,
  Download,
  FileSpreadsheet,
  Edit3,
  Paperclip,
  Eye,
  FileUp,
  Save,
  FileEdit,
  Archive,
  Play,
  Bookmark,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  FlaskConical
} from 'lucide-react';
import {
  PurchaseOrder,
  PurchaseInvoice,
  PurchaseInvoiceItem,
  Supplier,
  Medicine,
  PurchaseDraft
} from '../types';
import { StorageService } from '../services/storage';
import { PurchaseInvoiceVoucherModal } from '../components/PurchaseInvoiceVoucherModal';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { PurchaseInvoiceUpdateModal } from '../components/PurchaseInvoiceUpdateModal';
import { PharmacyLogo } from '../components/PharmacyLogo';
import { MobileAppDownloadModal } from '../components/MobileAppDownloadModal';
import { DesktopDownloadModal } from '../components/DesktopDownloadModal';
import { PurchaseInvoiceUploader } from '../components/PurchaseInvoiceUploader';
import { AddSupplierModal } from '../components/AddSupplierModal';
import { QuickAddProductModal } from '../components/QuickAddProductModal';
import { PurchaseReportView } from '../components/PurchaseReportView';
import { RetailPurchaseHubView } from '../components/RetailPurchaseHubView';
import { DateMonthYearPicker } from '../components/DateMonthYearPicker';
import { TotalDiscountEditModal } from '../components/TotalDiscountEditModal';
import { formatDateDMY, formatExpiryDMY } from '../utils/dateUtils';
import { EditPurchaseItemModal } from '../components/EditPurchaseItemModal';
import { SelectPurchaseInvoiceModal } from '../components/SelectPurchaseInvoiceModal';
import { ConfirmPurchaseEntryModal } from '../components/ConfirmPurchaseEntryModal';
import { SupplierPaymentModal } from '../components/SupplierPaymentModal';
import { ExpiryMonthYearInput } from '../components/ExpiryMonthYearInput';
import {
  exportPurchaseInvoiceToPDF,
  exportPurchaseInvoiceToExcel,
  exportPurchaseInvoicesLedgerToExcel
} from '../utils/exportUtils';
import { onEnterMoveTo } from '../utils/keyboardNavUtils';

// Master pharmaceutical generic compositions & salts dictionary
const MASTER_SALTS: string[] = [
  'Paracetamol (Acetaminophen)',
  'Paracetamol 500mg',
  'Paracetamol 650mg',
  'Paracetamol 500mg + Caffeine 30mg',
  'Amoxicillin 500mg',
  'Amoxicillin + Potassium Clavulanate (625mg)',
  'Amoxicillin + Potassium Clavulanate (375mg)',
  'Amoxicillin + Cloxacillin',
  'Pantoprazole 40mg',
  'Pantoprazole 40mg + Domperidone 30mg SR',
  'Pantoprazole 40mg + Domperidone 10mg',
  'Pantoprazole 40mg + Levosulpiride 75mg SR',
  'Omeprazole 20mg',
  'Omeprazole 20mg + Domperidone 10mg',
  'Rabeprazole Sodium 20mg',
  'Rabeprazole 20mg + Domperidone 30mg SR',
  'Rabeprazole 20mg + Levosulpiride 75mg SR',
  'Esomeprazole 40mg',
  'Esomeprazole 40mg + Domperidone 30mg SR',
  'Azithromycin 250mg',
  'Azithromycin 500mg',
  'Cefixime 100mg',
  'Cefixime 200mg',
  'Cefixime 200mg + Ofloxacin 200mg',
  'Cefpodoxime Proxetil 100mg',
  'Cefpodoxime Proxetil 200mg',
  'Cefuroxime Axetil 250mg',
  'Cefuroxime Axetil 500mg',
  'Ciprofloxacin 500mg',
  'Ofloxacin 200mg',
  'Ofloxacin 200mg + Ornidazole 500mg',
  'Levofloxacin 500mg',
  'Metronidazole 400mg',
  'Doxycycline 100mg',
  'Metformin HCl 500mg',
  'Metformin HCl 1000mg',
  'Metformin HCl 500mg SR + Glimepiride 1mg',
  'Metformin HCl 500mg SR + Glimepiride 2mg',
  'Metformin 500mg + Glimepiride 2mg + Voglibose 0.2mg',
  'Metformin 500mg + Teneligliptin 20mg',
  'Metformin 500mg + Vildagliptin 50mg',
  'Glimepiride 1mg',
  'Glimepiride 2mg',
  'Vildagliptin 50mg',
  'Teneligliptin 20mg',
  'Dapagliflozin 10mg',
  'Dapagliflozin 10mg + Metformin 500mg',
  'Empagliflozin 10mg',
  'Telmisartan 40mg',
  'Telmisartan 80mg',
  'Telmisartan 40mg + Amlodipine 5mg',
  'Telmisartan 40mg + Hydrochlorothiazide 12.5mg',
  'Telmisartan 40mg + Chlorthalidone 12.5mg',
  'Amlodipine 5mg',
  'Amlodipine 5mg + Atenolol 50mg',
  'Atenolol 50mg',
  'Losartan Potassium 50mg',
  'Losartan 50mg + Hydrochlorothiazide 12.5mg',
  'Atorvastatin 10mg',
  'Atorvastatin 20mg',
  'Atorvastatin 40mg',
  'Atorvastatin 10mg + Clopidogrel 75mg',
  'Rosuvastatin 10mg',
  'Rosuvastatin 20mg',
  'Rosuvastatin 10mg + Aspirin 75mg',
  'Clopidogrel 75mg',
  'Clopidogrel 75mg + Aspirin 75mg',
  'Aspirin 75mg Gastro-resistant',
  'Aspirin 150mg Gastro-resistant',
  'Montelukast 10mg + Levocetirizine 5mg',
  'Levocetirizine 5mg',
  'Cetirizine HCl 10mg',
  'Fexofenadine HCl 120mg',
  'Fexofenadine HCl 180mg',
  'Fexofenadine 120mg + Montelukast 10mg',
  'Bilasatine 20mg',
  'Aceclofenac 100mg + Paracetamol 325mg',
  'Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg',
  'Aceclofenac 100mg + Paracetamol 325mg + Chlorzoxazone 250mg',
  'Diclofenac Sodium 50mg + Paracetamol 325mg',
  'Diclofenac Potassium 50mg + Paracetamol 325mg',
  'Ibuprofen 400mg + Paracetamol 325mg',
  'Tramadol HCl 37.5mg + Paracetamol 325mg',
  'Etoricoxib 90mg',
  'Etoricoxib 60mg + Thiocolchicoside 4mg',
  'Thiocolchicoside 4mg + Aceclofenac 100mg',
  'Dextromethorphan HBr + Chlorpheniramine Maleate',
  'Dextromethorphan + Phenylephrine + Chlorpheniramine',
  'Ambroxol + Terbutaline Sulphate + Guaiphenesin',
  'Levosalbutamol + Ambroxol + Guaiphenesin',
  'Bromhexine + Terbutaline + Guaiphenesin',
  'Ondansetron 4mg',
  'Domperidone 10mg',
  'Ranitidine 150mg',
  'Sucralfate 1000mg + Oxetacaine 20mg',
  'Magaldrate 480mg + Simethicone 20mg',
  'Fluconazole 150mg',
  'Itraconazole 100mg',
  'Itraconazole 200mg',
  'Terbinafine 250mg',
  'Albendazole 400mg',
  'Ivermectin 12mg',
  'Pregabalin 75mg + Methylcobalamin 750mcg',
  'Gabapentin 300mg + Methylcobalamin 500mcg',
  'Methylcobalamin 1500mcg + Alpha Lipoic Acid + Benfotiamine',
  'Calcium Carbonate 500mg + Vitamin D3 250IU',
  'Calcium Citrate Malate + Vitamin D3 + Folic Acid',
  'Ferrous Ascorbate + Folic Acid + Zinc',
  'Vitamin C (Ascorbic Acid) 500mg + Zinc 5mg',
  'Vitamin D3 60,000 IU (Cholecalciferol)',
  'Multivitamins + Multiminerals + Antioxidants',
  'Deflazacort 6mg',
  'Prednisolone 5mg',
  'Methylprednisolone 4mg',
  'Methylprednisolone 8mg'
];

interface PurchasesViewProps {
  onRefreshData?: () => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({ onRefreshData }) => {
  // Main view navigation: 'entry', 'drafts', 'invoices', 'report', 'orders', 'payment-pending', 'payment-report', 'suppliers'
  const [activeTab, setActiveTab] = useState<'entry' | 'invoices' | 'orders' | 'report' | 'drafts' | 'payment-pending' | 'payment-report' | 'suppliers'>('entry');

  // Master State
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(() =>
    StorageService.getPurchaseInvoices()
  );
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() =>
    StorageService.getPurchaseOrders()
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => StorageService.getSuppliers());
  const [medicines, setMedicines] = useState<Medicine[]>(() => StorageService.getMedicines());
  const [purchaseDrafts, setPurchaseDrafts] = useState<PurchaseDraft[]>(() =>
    StorageService.getPurchaseDrafts()
  );
  const [purchaseDraftSearch, setPurchaseDraftSearch] = useState<string>('');
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);

  // Modals & Notifications
  const [viewingInvoice, setViewingInvoice] = useState<PurchaseInvoice | null>(null);
  const [updatingInvoice, setUpdatingInvoice] = useState<PurchaseInvoice | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showCreatePOModal, setShowCreatePOModal] = useState(false);
  const [showMobileAppModal, setShowMobileAppModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showQuickAddProductModal, setShowQuickAddProductModal] = useState(false);
  const [initialProductQuery, setInitialProductQuery] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Line item editing & Invoice selector modal states
  const [editingItemForModal, setEditingItemForModal] = useState<PurchaseInvoiceItem | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showSelectInvoiceModal, setShowSelectInvoiceModal] = useState<boolean>(false);
  const [showTotalDiscountModal, setShowTotalDiscountModal] = useState<boolean>(false);

  // Purchase entry confirmation modal & draft workflow states
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [draftToConfirm, setDraftToConfirm] = useState<PurchaseDraft | null>(null);

  // Supplier & Product addition callbacks
  const handleSupplierAdded = (newSupplier: Supplier) => {
    const updatedSuppliers = StorageService.getSuppliers();
    setSuppliers(updatedSuppliers);
    setDistributorId(newSupplier.id);
    if (onRefreshData) onRefreshData();
    setSuccessBanner(`Supplier / Sublayer "${newSupplier.name}" registered and selected for purchase entry.`);
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  const handleProductAdded = (
    newMed: Medicine,
    initialBatchDetails?: {
      batch: string;
      expiry: string;
      costPrice: number;
      mrp: number;
      pack: string;
    }
  ) => {
    const updatedMeds = StorageService.getMedicines();
    setMedicines(updatedMeds);
    if (onRefreshData) onRefreshData();

    // Prefill the product entry row
    setSelectedMedicine(newMed);
    setProductQuery(newMed.name);
    setHsnNo(newMed.hsnCode || '300490');
    setGst(newMed.taxRate || 12);
    if (initialBatchDetails) {
      setBatch(initialBatchDetails.batch);
      setExpiry(initialBatchDetails.expiry);
      setPurchaseRate(initialBatchDetails.costPrice);
      setMrp(initialBatchDetails.mrp);
      setPack(initialBatchDetails.pack);
    }
    setSuccessBanner(`Product "${newMed.name}" added to catalog and loaded into bill entry row.`);
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  // Fullscreen toggle helper
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

  useEffect(() => {
    const handleFs = () => setIsFullScreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  // ----------------------------------------------------
  // ADD NEW PURCHASE (INWARD BILL) STATE
  // ----------------------------------------------------
  const defaultSupplier = suppliers[0] || null;
  const [distributorId, setDistributorId] = useState<string>(defaultSupplier?.id || '');
  const [invoiceNo, setInvoiceNo] = useState<string>(() => `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [invoiceDate, setInvoiceDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30); // Net 30 default
    return d.toISOString().split('T')[0];
  });
  const [invoiceNotes, setInvoiceNotes] = useState<string>('Physical goods received and verified with invoice.');
  const [autoUpdateInventory, setAutoUpdateInventory] = useState<boolean>(true);

  // Current Line Item being edited/entered in Product Entry Row
  const [productQuery, setProductQuery] = useState<string>('');
  const [showProductDropdown, setShowProductDropdown] = useState<boolean>(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

  // Generic Composition / Salt Description State
  const [genericComposition, setGenericComposition] = useState<string>('');
  const [showGenericDropdown, setShowGenericDropdown] = useState<boolean>(false);
  const genericInputRef = useRef<HTMLInputElement>(null);

  const [hsnNo, setHsnNo] = useState<string>('300490');
  const [batch, setBatch] = useState<string>('');
  const [expiry, setExpiry] = useState<string>('');
  const [pack, setPack] = useState<string>('10 Tablets');
  const [box, setBox] = useState<string | number>('');
  const [unit, setUnit] = useState<string | number>('');
  const [free, setFree] = useState<string | number>('');
  const [mrp, setMrp] = useState<string | number>('');
  const [purchaseRate, setPurchaseRate] = useState<string | number>('');
  const [scheme, setScheme] = useState<string | number>(''); // scheme %
  const [discount, setDiscount] = useState<string | number>(''); // discount %
  const [gst, setGst] = useState<number>(12); // gst %
  const [showDesktopAppModal, setShowDesktopAppModal] = useState<boolean>(false);

  // Added Products List in Current Bill
  const [invoiceItems, setInvoiceItems] = useState<PurchaseInvoiceItem[]>([]);

  // 1-Hour Standby & Disconnection Protection State
  const ACTIVE_PURCHASE_DRAFT_KEY = 'PHARMACY_ACTIVE_PURCHASE_ENTRY_1HR';
  const [restoredDraftInfo, setRestoredDraftInfo] = useState<{
    invoiceNo: string;
    itemCount: number;
    savedAgoMin: number;
    remainingMin: number;
  } | null>(null);

  const [isSystemOffline, setIsSystemOffline] = useState<boolean>(!navigator.onLine);
  const [networkNotice, setNetworkNotice] = useState<string | null>(null);
  const [standbyRemainingMinutes, setStandbyRemainingMinutes] = useState<number>(60);
  const [tableSearchFilter, setTableSearchFilter] = useState<string>('');

  // Attached document (Image, PDF, XLS/CSV) for current purchase bill
  const [invoiceAttachment, setInvoiceAttachment] = useState<PurchaseInvoice['attachment'] | null>(null);

  // Edit / Update mode state
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [highlightedProductIdx, setHighlightedProductIdx] = useState<number>(0);

  // Supplier Payment Options for Inward Bill Entry
  const [supplierPaymentMethod, setSupplierPaymentMethod] = useState<'Credit' | 'Cash' | 'UPI' | 'Bank_Transfer' | 'Cheque'>('Credit');
  const [supplierPaidAmount, setSupplierPaidAmount] = useState<string>('0');
  const [supplierPaymentRef, setSupplierPaymentRef] = useState<string>('');

  // Supplier Payment Settlement Modal State
  const [payingInvoiceForModal, setPayingInvoiceForModal] = useState<PurchaseInvoice | null>(null);
  const [payingTypeForModal, setPayingTypeForModal] = useState<'FULL' | 'PART'>('FULL');

  // Fast keyboard focus advancement helper
  const focusField = (id: string) => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
    if (el) {
      el.focus();
      if ('select' in el && typeof (el as HTMLInputElement).select === 'function') {
        (el as HTMLInputElement).select();
      }
    }
  };

  // Form reset handler
  const resetInvoiceForm = () => {
    try {
      localStorage.removeItem(ACTIVE_PURCHASE_DRAFT_KEY);
    } catch {}
    setRestoredDraftInfo(null);
    setEditingInvoiceId(null);
    setActiveDraftId(null);
    setDraftToConfirm(null);
    setEditingItemId(null);
    setInvoiceNo(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setPaymentDate(d.toISOString().split('T')[0]);
    setInvoiceNotes('Physical goods received and verified with invoice.');
    setInvoiceItems([]);
    setInvoiceAttachment(null);
    setProductQuery('');
    setSelectedMedicine(null);
    setBatch('');
    setExpiry('');
    setBox('');
    setUnit('');
    setFree('');
    setMrp('');
    setPurchaseRate('');
    setScheme('');
    setDiscount('');
    setSupplierPaymentMethod('Credit');
    setSupplierPaidAmount('0');
    setSupplierPaymentRef('');
  };

  // Initiate edit on an existing invoice
  const startEditingInvoice = (inv: PurchaseInvoice) => {
    setActiveTab('entry');
    setEditingInvoiceId(inv.id);
    setEditingItemId(null);
    setDistributorId(inv.distributorId);
    setInvoiceNo(inv.invoiceNo);
    setInvoiceDate(inv.invoiceDate);
    setPaymentDate(inv.paymentDueDate);
    setInvoiceNotes(inv.notes || '');
    setInvoiceItems(inv.items || []);
    setInvoiceAttachment(inv.attachment || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditingInvoice = () => {
    resetInvoiceForm();
  };

  // Permanently delete a purchase entry & revert stock and supplier balances
  const handleDeleteInvoice = (inv: PurchaseInvoice) => {
    const formattedAmount = (inv.grandTotal || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    if (
      window.confirm(
        `Are you sure you want to permanently delete purchase invoice #${inv.invoiceNo} from ${inv.distributorName}?\n\nTotal: ₹${formattedAmount} (${inv.items?.length || 0} products)\n\nThis will remove the entry from the inward ledger, revert batch inventory stock, and adjust the distributor's balance.`
      )
    ) {
      StorageService.deletePurchaseInvoice(inv.id, true);
      reloadData();
      if (viewingInvoice?.id === inv.id) {
        setViewingInvoice(null);
      }
      if (editingInvoiceId === inv.id) {
        resetInvoiceForm();
      }
      setSuccessBanner(
        `Purchase entry #${inv.invoiceNo} deleted successfully. Stock and distributor balances were reverted.`
      );
      setTimeout(() => setSuccessBanner(null), 8000);
    }
  };

  // Load an existing invoice line item into the entry row editor
  const handleLoadItemIntoEditor = (item: PurchaseInvoiceItem) => {
    setEditingItemId(item.id);
    setProductQuery(item.medicineName);
    const med = medicines.find(
      m => m.id === item.medicineId || m.name.toLowerCase() === item.medicineName.toLowerCase()
    );
    setSelectedMedicine(med || null);
    setGenericComposition(item.genericName || med?.genericName || '');
    setHsnNo(item.hsnCode || '300490');
    setBatch(item.batchNumber);
    setExpiry(item.expiryDate);
    setPack(item.pack || '10s');
    setBox(item.boxes || '');
    setUnit(item.unitsPerBox || '');
    setFree(item.freeQuantity ? item.freeQuantity : '');
    setMrp(item.mrp ? item.mrp : '');
    setPurchaseRate(item.purchaseRate ? item.purchaseRate : '');
    setScheme(item.schemePercentage ? item.schemePercentage : '');
    setDiscount(item.discountPercentage ? item.discountPercentage : '');
    setGst(item.gstRate || 12);

    const el = document.getElementById('section-product-entry-row');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    productInputRef.current?.focus();
  };

  // Cancel line item editing in the entry row editor
  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setProductQuery('');
    setSelectedMedicine(null);
    setGenericComposition('');
    setShowGenericDropdown(false);
    setBatch('');
    setExpiry('');
    setBox('');
    setUnit('');
    setFree('');
    setMrp('');
    setPurchaseRate('');
    setScheme('');
    setDiscount('');
  };

  // Save changes from the popup EditPurchaseItemModal
  const handleSaveModalItem = (updatedItem: PurchaseInvoiceItem) => {
    setInvoiceItems(prev => prev.map(it => (it.id === updatedItem.id ? updatedItem : it)));
    if (editingItemId === updatedItem.id) {
      handleCancelEditItem();
    }
    setSuccessBanner(`Updated line item "${updatedItem.medicineName}" (Batch: ${updatedItem.batchNumber}).`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  // ----------------------------------------------------
  // 1-HOUR STANDBY & DISCONNECTION RECOVERY ENGINE
  // ----------------------------------------------------
  // 1. Initial Load & Standby Check (1 hour TTL)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_PURCHASE_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      const now = Date.now();
      const ageMs = now - (draft.savedAt || 0);
      const oneHourMs = 60 * 60 * 1000;

      if (ageMs < oneHourMs && ((draft.items && draft.items.length > 0) || draft.currentRow?.productQuery)) {
        if (draft.distributorId) setDistributorId(draft.distributorId);
        if (draft.invoiceNo) setInvoiceNo(draft.invoiceNo);
        if (draft.invoiceDate) setInvoiceDate(draft.invoiceDate);
        if (draft.paymentDate) setPaymentDate(draft.paymentDate);
        if (draft.invoiceNotes) setInvoiceNotes(draft.invoiceNotes);
        if (draft.autoUpdateInventory !== undefined) setAutoUpdateInventory(draft.autoUpdateInventory);
        if (draft.supplierPaymentMethod) setSupplierPaymentMethod(draft.supplierPaymentMethod);
        if (draft.supplierPaidAmount) setSupplierPaidAmount(draft.supplierPaidAmount);
        if (draft.supplierPaymentRef) setSupplierPaymentRef(draft.supplierPaymentRef);
        if (Array.isArray(draft.items) && draft.items.length > 0) {
          setInvoiceItems(draft.items);
        }

        // Restore active in-progress product entry row so user can "continue with same, next product"
        if (draft.currentRow) {
          if (draft.currentRow.productQuery) setProductQuery(draft.currentRow.productQuery);
          if (draft.currentRow.genericComposition) setGenericComposition(draft.currentRow.genericComposition);
          if (draft.currentRow.hsnNo) setHsnNo(draft.currentRow.hsnNo);
          if (draft.currentRow.batch) setBatch(draft.currentRow.batch);
          if (draft.currentRow.expiry) setExpiry(draft.currentRow.expiry);
          if (draft.currentRow.pack) setPack(draft.currentRow.pack);
          if (draft.currentRow.box !== undefined) setBox(draft.currentRow.box);
          if (draft.currentRow.unit !== undefined) setUnit(draft.currentRow.unit);
          if (draft.currentRow.free !== undefined) setFree(draft.currentRow.free);
          if (draft.currentRow.mrp !== undefined) setMrp(draft.currentRow.mrp);
          if (draft.currentRow.purchaseRate !== undefined) setPurchaseRate(draft.currentRow.purchaseRate);
          if (draft.currentRow.scheme !== undefined) setScheme(draft.currentRow.scheme);
          if (draft.currentRow.discount !== undefined) setDiscount(draft.currentRow.discount);
          if (draft.currentRow.gst !== undefined) setGst(draft.currentRow.gst);

          if (draft.currentRow.selectedMedicineId) {
            const m = StorageService.getMedicines().find(med => med.id === draft.currentRow.selectedMedicineId);
            if (m) setSelectedMedicine(m);
          }
        }

        const elapsedMin = Math.floor(ageMs / 60000);
        const remMin = Math.max(1, 60 - elapsedMin);
        setStandbyRemainingMinutes(remMin);
        setRestoredDraftInfo({
          invoiceNo: draft.invoiceNo || 'INV-RESTORED',
          itemCount: draft.items?.length || 0,
          savedAgoMin: elapsedMin,
          remainingMin: remMin
        });
      } else if (ageMs >= oneHourMs) {
        localStorage.removeItem(ACTIVE_PURCHASE_DRAFT_KEY);
      }
    } catch (e) {
      console.warn('Error reading active purchase draft from localStorage', e);
    }
  }, []);

  // 2. Continuous 1-Hour Standby Auto-save & Local Storage Sync
  useEffect(() => {
    if (invoiceItems.length === 0 && !productQuery.trim()) {
      return;
    }

    const sessionData = {
      distributorId,
      invoiceNo,
      invoiceDate,
      paymentDate,
      invoiceNotes,
      autoUpdateInventory,
      supplierPaymentMethod,
      supplierPaidAmount,
      supplierPaymentRef,
      items: invoiceItems,
      currentRow: {
        productQuery,
        genericComposition,
        selectedMedicineId: selectedMedicine?.id || null,
        hsnNo,
        batch,
        expiry,
        pack,
        box,
        unit,
        free,
        mrp,
        purchaseRate,
        scheme,
        discount,
        gst
      },
      savedAt: Date.now(),
      expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour standby per invoice
    };

    try {
      localStorage.setItem(ACTIVE_PURCHASE_DRAFT_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('Failed to auto-save purchase draft to localStorage', e);
    }
  }, [
    invoiceItems,
    distributorId,
    invoiceNo,
    invoiceDate,
    paymentDate,
    invoiceNotes,
    autoUpdateInventory,
    supplierPaymentMethod,
    supplierPaidAmount,
    supplierPaymentRef,
    productQuery,
    selectedMedicine,
    hsnNo,
    batch,
    expiry,
    pack,
    box,
    unit,
    free,
    mrp,
    purchaseRate,
    scheme,
    discount,
    gst
  ]);

  // 3. Offline / Disconnection Detection & Live Network Listener
  useEffect(() => {
    const handleOffline = () => {
      setIsSystemOffline(true);
      setNetworkNotice('⚡ System Disconnected: Network offline! Auto-recovery active — all purchase products and serial items are protected locally. Continue entering products seamlessly.');
    };
    const handleOnline = () => {
      setIsSystemOffline(false);
      setNetworkNotice('✅ System Reconnected: Network connection restored! Your purchase entry was preserved safely.');
      setTimeout(() => setNetworkNotice(null), 6000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // 4. Standby Timer (ticks every minute)
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        const raw = localStorage.getItem(ACTIVE_PURCHASE_DRAFT_KEY);
        if (!raw) return;
        const draft = JSON.parse(raw);
        const remaining = Math.max(0, Math.floor((draft.expiresAt - Date.now()) / 60000));
        setStandbyRemainingMinutes(remaining);
        if (remaining <= 0) {
          localStorage.removeItem(ACTIVE_PURCHASE_DRAFT_KEY);
          setRestoredDraftInfo(null);
        }
      } catch {}
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Preview current active purchase entry voucher (even before saving)
  const handlePreviewCurrentEntry = () => {
    if (invoiceItems.length === 0 && !invoiceAttachment) {
      alert('Please add at least one medicine item or attach an invoice file to view the purchase entry voucher.');
      return;
    }
    const previewInv: PurchaseInvoice = {
      id: editingInvoiceId || `PREVIEW-${Date.now()}`,
      invoiceNo: invoiceNo.trim().toUpperCase() || `INV-${new Date().getFullYear()}-DRAFT`,
      invoiceDate,
      paymentDueDate: paymentDate,
      distributorId: activeDistributor?.id || 'DIST-1',
      distributorName: activeDistributor?.name || 'Selected Distributor',
      distributorGstin: activeDistributor?.gstin || '27AABCU9603R1ZM',
      distributorPhone: activeDistributor?.phone,
      items: invoiceItems,
      subtotal: billSummary.subtotal,
      totalScheme: billSummary.totalScheme,
      totalDiscount: billSummary.totalDiscount,
      taxableAmount: billSummary.taxableAmount,
      cgstAmount: billSummary.cgstAmount,
      sgstAmount: billSummary.sgstAmount,
      totalTax: billSummary.totalTax,
      roundOff: billSummary.roundOff,
      grandTotal: billSummary.grandTotal,
      paymentStatus: 'Unpaid',
      notes: invoiceNotes,
      createdAt: new Date().toISOString(),
      attachment: invoiceAttachment || undefined
    };
    setViewingInvoice(previewInv);
  };

  // Handler for Excel/CSV parsed items
  const handleSpreadsheetParsed = (
    parsedItems: PurchaseInvoiceItem[],
    meta?: { invoiceNo?: string; invoiceDate?: string; distributorName?: string },
    mode: 'replace' | 'append' = 'replace'
  ) => {
    if (mode === 'replace') {
      setInvoiceItems(parsedItems);
    } else {
      setInvoiceItems(prev => [...prev, ...parsedItems]);
    }

    if (meta?.invoiceNo) {
      setInvoiceNo(meta.invoiceNo);
    }
    if (meta?.invoiceDate) {
      setInvoiceDate(meta.invoiceDate);
    }
    if (meta?.distributorName) {
      const match = suppliers.find(
        s => s.name.toLowerCase().includes(meta.distributorName!.toLowerCase()) ||
             meta.distributorName!.toLowerCase().includes(s.name.toLowerCase())
      );
      if (match) {
        setDistributorId(match.id);
      }
    }
  };

  // Barcode / Product focus input ref
  const productInputRef = useRef<HTMLInputElement>(null);

  // Invoices Ledger Filter & Search
  const [invoiceSearch, setInvoiceSearch] = useState<string>('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'All' | 'Paid' | 'Unpaid'>('All');

  // PO View Search & Status Filter
  const [poSearchQuery, setPoSearchQuery] = useState<string>('');
  const [poStatusFilter, setPoStatusFilter] = useState<'All' | 'Draft' | 'Sent' | 'Received'>('All');

  // New PO Modal State
  const [newPOSupplierId, setNewPOSupplierId] = useState(suppliers[0]?.id || '');
  const [newPoItems, setNewPoItems] = useState<{ medicineId: string; quantity: number; unitCost: number; taxRate: number }[]>([]);
  const [selectedMedToAdd, setSelectedMedToAdd] = useState(medicines[0]?.id || '');
  const [poItemQuantity, setPoItemQuantity] = useState(50);
  const [poItemCostPrice, setPoItemCostPrice] = useState(medicines[0]?.batches[0]?.costPrice || 20);

  // Reload data from storage
  const reloadData = () => {
    setPurchaseInvoices(StorageService.getPurchaseInvoices());
    setPurchaseOrders(StorageService.getPurchaseOrders());
    setMedicines(StorageService.getMedicines());
    setSuppliers(StorageService.getSuppliers());
    setPurchaseDrafts(StorageService.getPurchaseDrafts());
    if (onRefreshData) onRefreshData();
  };

  // ----------------------------------------------------
  // PURCHASE DRAFTS HANDLERS (SAVE, RESUME, DELETE, CONFIRM)
  // ----------------------------------------------------
  const handleSaveAsPurchaseDraft = () => {
    if (invoiceItems.length === 0 && !invoiceAttachment) {
      alert('Please add at least one line item or attach an invoice file to save as a draft.');
      return;
    }

    const draftId = activeDraftId || `DRF-PUR-${Math.floor(1000 + Math.random() * 9000)}`;
    const newDraft: PurchaseDraft = {
      id: draftId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      distributorId: activeDistributor?.id || 'DIST-1',
      distributorName: activeDistributor?.name || 'Selected Distributor',
      distributorGstin: activeDistributor?.gstin,
      invoiceNo: invoiceNo.trim().toUpperCase() || `INV-DRAFT-${Date.now().toString().slice(-4)}`,
      invoiceDate,
      paymentDueDate: paymentDate,
      notes: invoiceNotes,
      items: [...invoiceItems],
      itemCount: invoiceItems.length,
      subtotal: billSummary.subtotal,
      totalScheme: billSummary.totalScheme,
      totalDiscount: billSummary.totalDiscount,
      taxableAmount: billSummary.taxableAmount,
      cgstAmount: billSummary.cgstAmount,
      sgstAmount: billSummary.sgstAmount,
      totalTax: billSummary.totalTax,
      grandTotal: billSummary.grandTotal,
      attachment: invoiceAttachment || undefined
    };

    StorageService.savePurchaseDraft(newDraft);
    setActiveDraftId(draftId);
    setPurchaseDrafts(StorageService.getPurchaseDrafts());
    setSuccessBanner(`Purchase entry saved in Drafts (Draft ID: "${newDraft.id}", Inv #${newDraft.invoiceNo})! It will remain safely stored until you confirm & complete it.`);
    setTimeout(() => setSuccessBanner(null), 7000);
  };

  const handleResumePurchaseDraft = (draft: PurchaseDraft) => {
    if (invoiceItems.length > 0) {
      if (!window.confirm(`Current purchase entry has ${invoiceItems.length} item(s). Replace with draft "${draft.id}" (${draft.invoiceNo})?`)) {
        return;
      }
    }

    if (draft.distributorId) {
      setDistributorId(draft.distributorId);
    }
    setInvoiceNo(draft.invoiceNo);
    setInvoiceDate(draft.invoiceDate);
    setPaymentDate(draft.paymentDueDate);
    setInvoiceNotes(draft.notes || '');
    setInvoiceItems([...draft.items]);
    setInvoiceAttachment(draft.attachment || null);
    setEditingInvoiceId(null);
    setActiveDraftId(draft.id);
    setActiveTab('entry');

    setSuccessBanner(`Draft "${draft.id}" loaded into Purchase Entry! Review the items and click "Confirm & Complete" to verify and commit to live stock.`);
    setTimeout(() => setSuccessBanner(null), 7000);
  };

  const handleDeletePurchaseDraft = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete purchase draft "${id}"? This action cannot be undone.`)) {
      StorageService.deletePurchaseDraft(id);
      if (activeDraftId === id) {
        setActiveDraftId(null);
      }
      setPurchaseDrafts(StorageService.getPurchaseDrafts());
    }
  };

  const handleClearAllPurchaseDrafts = () => {
    if (purchaseDrafts.length === 0) return;
    if (window.confirm(`Permanently delete all ${purchaseDrafts.length} saved purchase drafts?`)) {
      StorageService.clearAllPurchaseDrafts();
      setActiveDraftId(null);
      setPurchaseDrafts([]);
    }
  };

  // Selected distributor object
  const activeDistributor = useMemo(() => {
    return suppliers.find(s => s.id === distributorId) || suppliers[0] || null;
  }, [suppliers, distributorId]);

  // Filtered medicines for Product/Barcode Autocomplete
  const matchingMedicines = useMemo(() => {
    if (!productQuery.trim()) return medicines.slice(0, 8);
    const q = productQuery.toLowerCase();
    return medicines.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        (m.hsnCode && m.hsnCode.includes(q)) ||
        m.batches.some(b => b.batchNumber.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [medicines, productQuery]);

  // Master list of all unique Generic Compositions & Salts (Master list + distinct from inventory)
  const allGenericSalts = useMemo(() => {
    const set = new Set<string>();
    MASTER_SALTS.forEach(s => {
      if (s.trim()) set.add(s.trim());
    });
    medicines.forEach(m => {
      if (m.genericName && m.genericName.trim() && m.genericName.trim().length > 2) {
        set.add(m.genericName.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [medicines]);

  // Filtered salts when entering letters in Generic Composition / Salt Description
  const matchingSalts = useMemo(() => {
    if (!genericComposition.trim()) return allGenericSalts.slice(0, 10);
    const q = genericComposition.toLowerCase().trim();
    const words = q.split(/\s+/).filter(Boolean);
    return allGenericSalts.filter(salt => {
      const lower = salt.toLowerCase();
      return words.every(w => lower.includes(w));
    }).slice(0, 12);
  }, [allGenericSalts, genericComposition]);

  const getMedicinesForSalt = (saltName: string) => {
    const target = saltName.toLowerCase().trim();
    return medicines.filter(
      m => m.genericName && (m.genericName.toLowerCase().includes(target) || target.includes(m.genericName.toLowerCase()))
    );
  };

  const handleSelectSalt = (salt: string) => {
    setGenericComposition(salt);
    setShowGenericDropdown(false);

    // If no medicine selected yet, check if there are medicines with this exact or matching salt
    if (!selectedMedicine) {
      const relatedMeds = getMedicinesForSalt(salt);
      if (relatedMeds.length === 1) {
        handleSelectMedicine(relatedMeds[0]);
      }
    }
  };

  // Filtered Purchase Drafts for the Drafts tab
  const filteredPurchaseDrafts = useMemo(() => {
    if (!purchaseDraftSearch.trim()) return purchaseDrafts;
    const q = purchaseDraftSearch.toLowerCase();
    return purchaseDrafts.filter(d =>
      d.id.toLowerCase().includes(q) ||
      d.invoiceNo.toLowerCase().includes(q) ||
      d.distributorName.toLowerCase().includes(q) ||
      (d.notes && d.notes.toLowerCase().includes(q)) ||
      d.items.some(item => item.medicineName.toLowerCase().includes(q) || item.batch.toLowerCase().includes(q))
    );
  }, [purchaseDrafts, purchaseDraftSearch]);

  // When a medicine is chosen from dropdown or barcode scanned
  const handleSelectMedicine = (med: Medicine) => {
    setSelectedMedicine(med);
    setProductQuery(med.name);
    setShowProductDropdown(false);

    if (med.genericName) {
      setGenericComposition(med.genericName);
    }

    if (med.hsnCode) setHsnNo(med.hsnCode);
    if (med.taxRate != null) setGst(med.taxRate);

    // Pick latest batch price if present or leave blank
    const medBatches = Array.isArray(med.batches) ? med.batches : [];
    const latestBatch = medBatches.length > 0 ? medBatches[medBatches.length - 1] : undefined;
    if (latestBatch) {
      setMrp(latestBatch.mrp || latestBatch.sellingPrice || '');
      setPurchaseRate(latestBatch.costPrice || '');
      // Suggest next batch or expiry
      setExpiry(latestBatch.expiryDate || '');
      setBatch(`${latestBatch.batchNumber.slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`);
    } else {
      setBatch(`BAT-${Math.floor(1000 + Math.random() * 9000)}`);
    }

    if (med.form) {
      setPack(`10 ${med.form}s`);
    }

    // Keep entry numeric columns blank so user types fresh values
    setBox('');
    setUnit('');
    setFree('');
    setScheme('');
    setDiscount('');

    setTimeout(() => {
      focusField('purchase-input-batch');
    }, 50);
  };

  // Calculate live amount for the current line item
  const currentLineCalc = useMemo(() => {
    const numBox = Number(box) || 0;
    const numUnit = Number(unit) || 0;
    const numFree = Number(free) || 0;
    const numMrp = Number(mrp) || 0;
    let numRate = Number(purchaseRate) || 0;
    if (numRate <= 0 && numMrp > 0) {
      numRate = Math.round(numMrp * 0.75 * 100) / 100;
    }
    const numScheme = Number(scheme) || 0;
    const numDiscount = Number(discount) || 0;
    const numGst = Number(gst) || 0;

    let billedQty = 0;
    if (numBox > 0 && numUnit > 0) {
      billedQty = numBox * numUnit;
    } else if (numBox > 0) {
      billedQty = numBox;
    } else if (numUnit > 0) {
      billedQty = numUnit;
    }

    const gross = billedQty * numRate;
    const schemeAmt = (gross * numScheme) / 100;
    const afterScheme = gross - schemeAmt;
    const discAmt = (afterScheme * numDiscount) / 100;
    const taxable = afterScheme - discAmt;
    const gstAmt = (taxable * numGst) / 100;
    const net = taxable + gstAmt;

    return {
      billedQuantity: billedQty,
      totalQuantity: billedQty + numFree,
      gross,
      schemeAmount: schemeAmt,
      discountAmount: discAmt,
      taxableAmount: taxable,
      gstAmount: gstAmt,
      netAmount: net,
      effectiveRate: numRate
    };
  }, [box, unit, purchaseRate, mrp, scheme, discount, gst, free]);

  // Old Entry Price details for currently active/selected product (automatic price lookup)
  const oldEntryDetails = useMemo(() => {
    const med = selectedMedicine || (productQuery.trim() ? medicines.find(m => m.name.toLowerCase() === productQuery.trim().toLowerCase()) : null);
    if (!med) return null;
    const batches = Array.isArray(med.batches) ? med.batches : [];
    if (batches.length === 0) return null;
    const lastBatch = batches[batches.length - 1];
    return {
      medicineName: med.name,
      lastRate: lastBatch.costPrice,
      lastMrp: lastBatch.mrp || lastBatch.sellingPrice,
      batchNo: lastBatch.batchNumber,
      expiry: lastBatch.expiryDate,
      totalBatches: batches.length
    };
  }, [selectedMedicine, productQuery, medicines]);

  const numCurrentRate = Number(purchaseRate) || 0;
  const numCurrentMrp = Number(mrp) || 0;
  const isPurchaseRateInvalid = numCurrentMrp > 0 && numCurrentRate >= numCurrentMrp;

  // Add line item to bill
  const handleAddProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!productQuery.trim()) {
      alert('Please enter or select a Product / Barcode');
      productInputRef.current?.focus();
      return;
    }

    const effectiveBatch = batch.trim() || `BAT-${Date.now().toString().slice(-6)}`;
    const effectiveExpiry = expiry.trim() || `${new Date().getFullYear() + 2}-12`;

    const numBox = Number(box) || 0;
    const numUnit = Number(unit) || 0;
    const numFree = Number(free) || 0;
    const numMrp = Number(mrp) || 0;
    let numRate = Number(purchaseRate) || 0;
    if (numRate <= 0 && numMrp > 0) {
      numRate = Math.round(numMrp * 0.75 * 100) / 100;
    }

    if (currentLineCalc.billedQuantity <= 0 && numFree <= 0) {
      alert('Please specify Box or Unit quantity');
      focusField('purchase-input-box');
      return;
    }

    if (numRate <= 0) {
      alert('Please enter Purchase Rate (₹) or MRP (₹)');
      focusField('purchase-input-rate');
      return;
    }

    // Strict validation: Purchase rate must be strictly less than MRP
    if (numMrp > 0 && numRate >= numMrp) {
      alert(`⚠️ Purchase Rate (₹${numRate}) must be strictly less than MRP (₹${numMrp})! You cannot purchase goods at or above the Maximum Retail Price.`);
      focusField('purchase-input-rate');
      return;
    }

    const effectiveBoxes = numBox > 0 ? numBox : 1;
    const effectiveUnitsPerBox = numUnit > 0 ? numUnit : (numBox > 0 ? Math.round(currentLineCalc.billedQuantity / numBox) : currentLineCalc.billedQuantity);
    const effectiveGenericName = genericComposition.trim() || selectedMedicine?.genericName || '';

    const newItem: PurchaseInvoiceItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      medicineId: selectedMedicine?.id || `med-${Date.now()}`,
      medicineName: selectedMedicine?.name || productQuery.trim(),
      genericName: effectiveGenericName,
      barcode: selectedMedicine?.id,
      hsnCode: hsnNo || '300490',
      batchNumber: effectiveBatch.toUpperCase(),
      expiryDate: effectiveExpiry,
      pack: pack || '10s',
      boxes: effectiveBoxes,
      unitsPerBox: effectiveUnitsPerBox,
      billedQuantity: currentLineCalc.billedQuantity,
      freeQuantity: numFree,
      totalQuantity: currentLineCalc.totalQuantity,
      mrp: numMrp,
      purchaseRate: numRate,
      schemePercentage: Number(scheme) || 0,
      schemeAmount: currentLineCalc.schemeAmount,
      discountPercentage: Number(discount) || 0,
      discountAmount: currentLineCalc.discountAmount,
      taxableAmount: currentLineCalc.taxableAmount,
      gstRate: Number(gst) || 12,
      gstAmount: currentLineCalc.gstAmount,
      netAmount: currentLineCalc.netAmount
    };

    if (editingItemId) {
      setInvoiceItems(prev =>
        prev.map(item => {
          if (item.id === editingItemId) {
            return {
              ...item,
              medicineName: selectedMedicine?.name || productQuery.trim(),
              genericName: effectiveGenericName || item.genericName,
              barcode: selectedMedicine?.id || item.barcode,
              hsnCode: hsnNo || item.hsnCode || '300490',
              batchNumber: effectiveBatch.toUpperCase(),
              expiryDate: effectiveExpiry,
              pack: pack || item.pack || '10s',
              boxes: effectiveBoxes,
              unitsPerBox: effectiveUnitsPerBox,
              billedQuantity: currentLineCalc.billedQuantity,
              freeQuantity: numFree,
              totalQuantity: currentLineCalc.totalQuantity,
              mrp: numMrp,
              purchaseRate: numRate,
              schemePercentage: Number(scheme) || 0,
              schemeAmount: currentLineCalc.schemeAmount,
              discountPercentage: Number(discount) || 0,
              discountAmount: currentLineCalc.discountAmount,
              taxableAmount: currentLineCalc.taxableAmount,
              gstRate: Number(gst) || 12,
              gstAmount: currentLineCalc.gstAmount,
              netAmount: currentLineCalc.netAmount
            };
          }
          return item;
        })
      );
      setEditingItemId(null);
      setSuccessBanner(`Updated line item "${productQuery.trim()}" (Batch: ${effectiveBatch.toUpperCase()}).`);
      setTimeout(() => setSuccessBanner(null), 5000);
    } else {
      setInvoiceItems(prev => [...prev, newItem]);
    }

    // Reset product input fields for next entry - all numeric fields reset to empty string (no zeros)
    setProductQuery('');
    setSelectedMedicine(null);
    setGenericComposition('');
    setShowGenericDropdown(false);
    setBatch('');
    setExpiry('');
    setBox('');
    setUnit('');
    setFree('');
    setMrp('');
    setPurchaseRate('');
    setScheme('');
    setDiscount('');
    productInputRef.current?.focus();
  };

  // Remove a line item
  const handleRemoveInvoiceItem = (id: string) => {
    if (editingItemId === id) {
      handleCancelEditItem();
    }
    setInvoiceItems(prev => prev.filter(i => i.id !== id));
  };

  // Bill Totals Calculation
  const billSummary = useMemo(() => {
    let subtotal = 0;
    let totalScheme = 0;
    let totalDiscount = 0;
    let taxableAmount = 0;
    let totalTax = 0;
    let totalItems = invoiceItems.length;
    let totalBilledUnits = 0;
    let totalFreeUnits = 0;

    invoiceItems.forEach(item => {
      const gross = (item.billedQuantity || 0) * (item.purchaseRate || 0);
      subtotal += gross;
      totalScheme += item.schemeAmount || 0;
      totalDiscount += item.discountAmount || 0;
      taxableAmount += item.taxableAmount || 0;
      totalTax += item.gstAmount || 0;
      totalBilledUnits += item.billedQuantity || 0;
      totalFreeUnits += item.freeQuantity || 0;
    });

    const unroundedGrand = taxableAmount + totalTax;
    const roundedGrand = Math.round(unroundedGrand);
    const roundOff = Number((roundedGrand - unroundedGrand).toFixed(2));
    const cgstAmount = totalTax / 2;
    const sgstAmount = totalTax / 2;

    return {
      totalItems,
      totalBilledUnits,
      totalFreeUnits,
      subtotal,
      totalScheme,
      totalDiscount,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      totalTax,
      roundOff,
      grandTotal: roundedGrand
    };
  }, [invoiceItems]);

  // Apply Total Discount across Purchase Invoice items
  const handleApplyPurchaseDiscount = ({
    mode,
    value
  }: {
    mode: 'percent' | 'amount';
    value: number;
    distribution: 'proportional' | 'bill_level';
  }) => {
    if (invoiceItems.length === 0) {
      alert('Invoice items list is empty. Add medicine items first.');
      return;
    }
    const subtotal = billSummary.subtotal;
    const targetPercent =
      mode === 'percent' ? value : subtotal > 0 ? (value / subtotal) * 100 : 0;
    setInvoiceItems(prev =>
      prev.map(it => {
        const itemGross = (it.billedQuantity || 0) * (it.purchaseRate || 0);
        const discPercent = Math.min(100, Math.max(0, parseFloat(targetPercent.toFixed(2))));
        const discAmount = (itemGross * discPercent) / 100;
        const schemeAmount = it.schemeAmount || ((itemGross * (it.schemePercentage || 0)) / 100);
        const taxable = Math.max(0, itemGross - schemeAmount - discAmount);
        const taxAmount = (taxable * (it.gstRate || 0)) / 100;
        const net = taxable + taxAmount;
        return {
          ...it,
          discountPercentage: discPercent,
          discountAmount: parseFloat(discAmount.toFixed(2)),
          taxableAmount: parseFloat(taxable.toFixed(2)),
          gstAmount: parseFloat(taxAmount.toFixed(2)),
          netAmount: parseFloat(net.toFixed(2))
        };
      })
    );
  };

  // Prepare invoice data for confirmation dialog (either active draft or current entry)
  const confirmModalInvoiceData = useMemo(() => {
    if (draftToConfirm) {
      return {
        distributorName: draftToConfirm.distributorName,
        distributorGstin: draftToConfirm.distributorGstin,
        invoiceNo: draftToConfirm.invoiceNo,
        invoiceDate: draftToConfirm.invoiceDate,
        paymentDueDate: draftToConfirm.paymentDueDate,
        notes: draftToConfirm.notes,
        items: draftToConfirm.items,
        subtotal: draftToConfirm.subtotal,
        totalScheme: draftToConfirm.totalScheme,
        totalDiscount: draftToConfirm.totalDiscount,
        taxableAmount: draftToConfirm.taxableAmount,
        cgstAmount: draftToConfirm.cgstAmount,
        sgstAmount: draftToConfirm.sgstAmount,
        totalTax: draftToConfirm.totalTax,
        roundOff: 0,
        grandTotal: draftToConfirm.grandTotal,
        draftId: draftToConfirm.id
      };
    }

    return {
      distributorName: activeDistributor?.name || 'Selected Distributor',
      distributorGstin: activeDistributor?.gstin,
      distributorPhone: activeDistributor?.phone,
      invoiceNo: invoiceNo.trim().toUpperCase() || 'INV-NEW',
      invoiceDate,
      paymentDueDate: paymentDate,
      notes: invoiceNotes,
      items: invoiceItems,
      subtotal: billSummary.subtotal,
      totalScheme: billSummary.totalScheme,
      totalDiscount: billSummary.totalDiscount,
      taxableAmount: billSummary.taxableAmount,
      cgstAmount: billSummary.cgstAmount,
      sgstAmount: billSummary.sgstAmount,
      totalTax: billSummary.totalTax,
      roundOff: billSummary.roundOff,
      grandTotal: billSummary.grandTotal,
      draftId: activeDraftId
    };
  }, [
    draftToConfirm,
    activeDistributor,
    invoiceNo,
    invoiceDate,
    paymentDate,
    invoiceNotes,
    invoiceItems,
    billSummary,
    activeDraftId
  ]);

  // Open confirmation modal for verification before committing to live inventory
  const handleOpenConfirmPurchaseModal = () => {
    if (!activeDistributor) {
      alert('Please choose a valid distributor/supplier.');
      return;
    }

    if (!invoiceNo.trim()) {
      alert('Please enter the Distributor Invoice Number.');
      return;
    }

    if (invoiceItems.length === 0) {
      alert('Please add at least one product to the purchase entry before confirming.');
      productInputRef.current?.focus();
      return;
    }

    setDraftToConfirm(null);
    setShowConfirmModal(true);
  };

  // Save current entry as draft directly from the confirmation modal if not ready
  const handleSaveDraftFromModal = () => {
    if (draftToConfirm) {
      setSuccessBanner(`Draft "${draftToConfirm.id}" remains safely stored in Drafts.`);
      setTimeout(() => setSuccessBanner(null), 5000);
      return;
    }
    handleSaveAsPurchaseDraft();
  };

  // Execute complete and save after confirmation
  const handleConfirmAndCompletePurchase = () => {
    if (draftToConfirm) {
      executeCompleteAndSaveDraft(draftToConfirm);
      return;
    }

    executeCompleteAndSaveCurrentEntry();
  };

  // Convert a draft directly into a completed purchase invoice
  const executeCompleteAndSaveDraft = (draft: PurchaseDraft) => {
    const newInvoice: PurchaseInvoice = {
      id: `PI-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      invoiceNo: draft.invoiceNo.trim().toUpperCase(),
      invoiceDate: draft.invoiceDate,
      paymentDueDate: draft.paymentDueDate,
      distributorId: draft.distributorId,
      distributorName: draft.distributorName,
      distributorGstin: draft.distributorGstin,
      items: draft.items,
      subtotal: draft.subtotal,
      totalScheme: draft.totalScheme,
      totalDiscount: draft.totalDiscount,
      taxableAmount: draft.taxableAmount,
      cgstAmount: draft.cgstAmount,
      sgstAmount: draft.sgstAmount,
      totalTax: draft.totalTax,
      roundOff: 0,
      grandTotal: draft.grandTotal,
      paymentStatus: 'Unpaid',
      notes: draft.notes,
      createdAt: new Date().toISOString(),
      attachment: draft.attachment
    };

    StorageService.addPurchaseInvoice(newInvoice, autoUpdateInventory);
    StorageService.deletePurchaseDraft(draft.id);
    if (activeDraftId === draft.id) {
      setActiveDraftId(null);
    }
    reloadData();
    setActiveTab('invoices'); // Closes purchase entry tab and navigates to invoices ledger
    setViewingInvoice(newInvoice);
    setDraftToConfirm(null);
    setShowConfirmModal(false);
    const totalUnits = draft.items.reduce(
      (sum, item) => sum + (item.billedQuantity || 0) + (item.freeQuantity || 0),
      0
    );
    setSuccessBanner(
      `Purchase Entry #${newInvoice.invoiceNo} completed & saved! Inward items added into inventory stock, draft cleared, and entry tab closed.`
    );
    setTimeout(() => setSuccessBanner(null), 8000);
  };

  // Save current active purchase entry into completed ledger
  const executeCompleteAndSaveCurrentEntry = () => {
    if (!activeDistributor) return;

    if (editingInvoiceId) {
      const existing = purchaseInvoices.find(i => i.id === editingInvoiceId);
      const updatedInvoice: PurchaseInvoice = {
        id: editingInvoiceId,
        invoiceNo: invoiceNo.trim().toUpperCase(),
        invoiceDate,
        paymentDueDate: paymentDate,
        distributorId: activeDistributor.id,
        distributorName: activeDistributor.name,
        distributorGstin: activeDistributor.gstin,
        distributorPhone: activeDistributor.phone,
        items: invoiceItems,
        subtotal: billSummary.subtotal,
        totalScheme: billSummary.totalScheme,
        totalDiscount: billSummary.totalDiscount,
        taxableAmount: billSummary.taxableAmount,
        cgstAmount: billSummary.cgstAmount,
        sgstAmount: billSummary.sgstAmount,
        totalTax: billSummary.totalTax,
        roundOff: billSummary.roundOff,
        grandTotal: billSummary.grandTotal,
        paymentStatus: existing?.paymentStatus || 'Unpaid',
        notes: invoiceNotes,
        createdAt: existing?.createdAt || new Date().toISOString(),
        attachment: invoiceAttachment || undefined
      };

      // Update in storage with inventory re-calculation
      StorageService.updatePurchaseInvoice(updatedInvoice, autoUpdateInventory);
      if (activeDraftId) {
        StorageService.deletePurchaseDraft(activeDraftId);
        setActiveDraftId(null);
      }
      reloadData();
      setActiveTab('invoices'); // Closes purchase entry tab
      setViewingInvoice(updatedInvoice);
      setShowConfirmModal(false);

      setSuccessBanner(
        `Purchase Entry #${updatedInvoice.invoiceNo} confirmed & updated! Inventory stock recalculated, entry saved, and entry tab closed.`
      );
      setTimeout(() => setSuccessBanner(null), 8000);

      resetInvoiceForm();
      return;
    }

    const totalAmount = billSummary.grandTotal;
    const paidAmt = Number(supplierPaidAmount || 0);
    const balAmt = Math.max(0, totalAmount - paidAmt);
    const payStatus: 'Unpaid' | 'Paid' | 'Partially Paid' =
      balAmt <= 0 ? 'Paid' : (paidAmt > 0 ? 'Partially Paid' : 'Unpaid');

    const newInvoice: PurchaseInvoice = {
      id: `PI-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      invoiceNo: invoiceNo.trim().toUpperCase(),
      invoiceDate,
      paymentDueDate: paymentDate,
      distributorId: activeDistributor.id,
      distributorName: activeDistributor.name,
      distributorGstin: activeDistributor.gstin,
      distributorPhone: activeDistributor.phone,
      items: invoiceItems,
      subtotal: billSummary.subtotal,
      totalScheme: billSummary.totalScheme,
      totalDiscount: billSummary.totalDiscount,
      taxableAmount: billSummary.taxableAmount,
      cgstAmount: billSummary.cgstAmount,
      sgstAmount: billSummary.sgstAmount,
      totalTax: billSummary.totalTax,
      roundOff: billSummary.roundOff,
      grandTotal: billSummary.grandTotal,
      paymentStatus: payStatus,
      paymentMethod: supplierPaymentMethod,
      paidAmount: paidAmt,
      balanceAmount: balAmt,
      paymentReference: supplierPaymentRef || undefined,
      payments: paidAmt > 0 ? [{
        id: `sp-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        amount: paidAmt,
        paymentMethod: supplierPaymentMethod,
        referenceNo: supplierPaymentRef || undefined,
        notes: 'Initial inward payment',
        recordedBy: 'Accounts Pharmacist'
      }] : [],
      notes: invoiceNotes,
      createdAt: new Date().toISOString(),
      attachment: invoiceAttachment || undefined
    };

    // Save into storage & auto-restock medicines
    StorageService.addPurchaseInvoice(newInvoice, autoUpdateInventory);
    if (activeDraftId) {
      StorageService.deletePurchaseDraft(activeDraftId);
      setActiveDraftId(null);
    }
    reloadData();

    // Close purchase entry tab and show voucher view in invoices ledger
    setActiveTab('invoices');
    setViewingInvoice(newInvoice);
    setShowConfirmModal(false);

    // Set success banner
    setSuccessBanner(
      `Purchase Entry #${newInvoice.invoiceNo} Confirmed & Saved! Added ${billSummary.totalBilledUnits + billSummary.totalFreeUnits} units into stock, and closed purchase entry tab.`
    );
    setTimeout(() => setSuccessBanner(null), 8000);

    // Reset bill form for next invoice
    resetInvoiceForm();
  };

  // Hold purchase entry in drafts and close entry tab
  const handleHoldAndClosePurchaseEntry = () => {
    if (invoiceItems.length === 0 && !invoiceAttachment) {
      setActiveTab('invoices');
      return;
    }
    handleSaveAsPurchaseDraft();
    setActiveTab('invoices');
  };

  // Backwards compatibility alias
  const handleSavePurchaseEntry = handleOpenConfirmPurchaseModal;

  // Desktop keyboard shortcuts for fast inward entry & purchase numeric fields
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (viewingInvoice || selectedPO || showCreatePOModal || showMobileAppModal || showConfirmModal) return;

      // F1: Focus Product Entry
      if (e.key === 'F1') {
        e.preventDefault();
        productInputRef.current?.focus();
        productInputRef.current?.select();
      }
      // F2 or Ctrl+S: Save as Draft
      else if (e.key === 'F2' || ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S'))) {
        if (activeTab === 'entry') {
          e.preventDefault();
          handleSaveAsPurchaseDraft();
        }
      }
      // F3: Quick Add New Drug to Catalog
      else if (e.key === 'F3') {
        if (activeTab === 'entry') {
          e.preventDefault();
          setInitialProductQuery(productQuery);
          setShowQuickAddProductModal(true);
        }
      }
      // F4 or Ctrl+D: Edit Total Bill Discount
      else if (e.key === 'F4' || ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D'))) {
        if (activeTab === 'entry') {
          e.preventDefault();
          setShowTotalDiscountModal(true);
        }
      }
      // Alt+A: Add / Commit current product line item into invoice
      else if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        if (activeTab === 'entry') {
          e.preventDefault();
          handleAddProduct();
        }
      }
      // Alt+C: Clear row / Cancel edit
      else if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        if (activeTab === 'entry') {
          e.preventDefault();
          if (editingItemId) {
            handleCancelEditItem();
          } else {
            setProductQuery('');
            setSelectedMedicine(null);
            setBatch('');
            setExpiry('');
            focusField('purchase-product-query');
          }
        }
      }
      // F10 or Ctrl+Enter: Save Invoice
      else if (e.key === 'F10' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
        if (activeTab === 'entry' && invoiceItems.length > 0) {
          e.preventDefault();
          handleSavePurchaseEntry();
        }
      }
      // F11: Fullscreen Mode
      else if (e.key === 'F11') {
        e.preventDefault();
        toggleFullScreen();
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [
    viewingInvoice,
    selectedPO,
    showCreatePOModal,
    showMobileAppModal,
    activeTab,
    invoiceItems,
    productQuery,
    editingItemId,
    activeDistributor,
    invoiceNo,
    billSummary,
    box,
    unit,
    purchaseRate,
    scheme,
    discount,
    gst,
    free
  ]);

  // Mark invoice as paid
  const handleMarkInvoicePaid = (id: string) => {
    StorageService.updatePurchaseInvoicePaymentStatus(id, 'Paid');
    reloadData();
    if (viewingInvoice && viewingInvoice.id === id) {
      setViewingInvoice(prev => (prev ? { ...prev, paymentStatus: 'Paid' } : null));
    }
  };

  // Top KPI Stats
  const kpiStats = useMemo(() => {
    const totalInvoicesCount = purchaseInvoices.length;
    const totalPurchasesValue = purchaseInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
    const totalItcTax = purchaseInvoices.reduce((sum, i) => sum + (i.totalTax || 0), 0);
    const pendingPayable = suppliers.reduce((sum, s) => sum + (s.outstandingPayable || 0), 0);

    return {
      totalInvoicesCount,
      totalPurchasesValue,
      totalItcTax,
      pendingPayable
    };
  }, [purchaseInvoices, suppliers]);

  // Filtered Invoices for History Tab
  const filteredInvoices = useMemo(() => {
    return purchaseInvoices.filter(inv => {
      const q = invoiceSearch.toLowerCase();
      const matchesQ =
        inv.invoiceNo.toLowerCase().includes(q) ||
        inv.distributorName.toLowerCase().includes(q) ||
        inv.items.some(item => item.medicineName.toLowerCase().includes(q));

      const bal = inv.balanceAmount != null ? inv.balanceAmount : (inv.paymentStatus === 'Paid' ? 0 : inv.grandTotal);
      let matchesStatus = true;
      if (invoiceStatusFilter === 'Pending') {
        matchesStatus = bal > 0 || inv.paymentStatus !== 'Paid';
      } else if (invoiceStatusFilter === 'Unpaid') {
        matchesStatus = inv.paymentStatus === 'Unpaid' || (inv.paidAmount || 0) === 0;
      } else if (invoiceStatusFilter === 'Partially Paid') {
        matchesStatus = inv.paymentStatus === 'Partially Paid';
      } else if (invoiceStatusFilter === 'Paid') {
        matchesStatus = inv.paymentStatus === 'Paid' && bal <= 0;
      }

      return matchesQ && matchesStatus;
    });
  }, [purchaseInvoices, invoiceSearch, invoiceStatusFilter]);

  // Filtered POs for PO Tab
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      const q = poSearchQuery.toLowerCase();
      const matchesSearch =
        po.id.toLowerCase().includes(q) ||
        po.supplierName.toLowerCase().includes(q) ||
        po.items.some(i => i.medicineName.toLowerCase().includes(q));

      const matchesStatus = poStatusFilter === 'All' || po.status === poStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [purchaseOrders, poSearchQuery, poStatusFilter]);

  // Create Purchase Order (PO Tab)
  const handleSavePurchaseOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === newPOSupplierId);
    if (!sup || newPoItems.length === 0) {
      alert('Please select a supplier and add at least one medicine item.');
      return;
    }

    const items = newPoItems.map(item => {
      const med = medicines.find(m => m.id === item.medicineId)!;
      return {
        medicineId: med.id,
        medicineName: med.name,
        genericName: med.genericName,
        orderQuantity: item.quantity,
        unitCostPrice: item.unitCost,
        totalCost: item.quantity * item.unitCost
      };
    });

    const subtotal = items.reduce((sum, i) => sum + (i.totalCost || 0), 0);
    const taxAmount = subtotal * 0.12;
    const grandTotal = subtotal + taxAmount;

    const newPO: PurchaseOrder = {
      id: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierId: sup.id,
      supplierName: sup.name,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      items,
      subtotal,
      taxAmount,
      grandTotal,
      status: 'Sent',
      notes: 'Standard replenishment order'
    };

    StorageService.addPurchaseOrder(newPO);
    reloadData();
    setShowCreatePOModal(false);
    setNewPoItems([]);
  };

  return (
    <div
      className={`w-full transition-all duration-200 ${
        isFullScreen
          ? 'fixed inset-0 z-50 bg-slate-100 overflow-y-auto p-3 lg:p-6'
          : 'w-full max-w-[1920px] mx-auto p-3 lg:p-6 space-y-6'
      }`}
    >
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 lg:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <PharmacyLogo size="md" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-black tracking-tight text-slate-900">
                City Rx • Purchase & Inward Goods
              </h1>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                Full-Screen Widescreen
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Distributor inward invoices, batch expiry intake, trade schemes, GST calculations & inventory restock.
            </p>
          </div>
        </div>

        {/* View Switcher Tabs & Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl flex-wrap">
            <button
              onClick={() => setActiveTab('entry')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'entry'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {editingInvoiceId ? (
                <>
                  <Edit3 className="w-4 h-4 text-amber-600" />
                  <span>Edit Purchase Entry</span>
                </>
              ) : (
                <>
                  <PackagePlus className="w-4 h-4 text-teal-600" />
                  <span>Purchase Entry</span>
                </>
              )}
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'drafts'
                  ? 'bg-white text-amber-900 shadow-xs ring-1 ring-amber-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="tab-purchase-drafts"
            >
              <FileEdit className="w-4 h-4 text-amber-600" />
              <span>Purchase Drafts ({purchaseDrafts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'invoices'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4 text-teal-600" />
              <span>Invoices Ledger ({purchaseInvoices.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('payment-pending')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'payment-pending'
                  ? 'bg-white text-amber-900 shadow-xs ring-1 ring-amber-400'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="tab-purchases-payment-pending"
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Payment Pending (Due ₹)</span>
            </button>
            <button
              onClick={() => setActiveTab('payment-report')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'payment-report'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Payment Report</span>
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'suppliers'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Supplier List ({suppliers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'report'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              <span>Purchase Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Orders ({purchaseOrders.length})</span>
            </button>
          </div>

          {/* Quick Action: Select Past Invoice to Edit */}
          <button
            type="button"
            onClick={() => setShowSelectInvoiceModal(true)}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Search and edit an existing purchase entry invoice"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
            <span>Edit Past Entry</span>
          </button>

          {/* Quick Action: Add Sublayer / Supplier */}
          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            title="Add New Supplier or Sublayer"
          >
            <Plus className="w-3.5 h-3.5 text-teal-600" />
            <span>+ Add Sublayer</span>
          </button>

          {/* Quick Action: Add Product */}
          <button
            onClick={() => {
              setInitialProductQuery('');
              setShowQuickAddProductModal(true);
            }}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            title="Add New Product / Medicine to Catalog"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>+ Add Product</span>
          </button>

          {/* Mobile App Download Button */}
          <button
            onClick={() => setShowMobileAppModal(true)}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            title="Download City Rx Mobile App / PWA"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Mobile App</span>
          </button>

          {/* Direct Download Computer / Desktop App */}
          <button
            onClick={() => setShowDesktopAppModal(true)}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Direct Download Computer City Rx Desktop App (.bat launcher & desktop shortcut)"
          >
            <Monitor className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">PC App</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullScreen}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Toggle Fullscreen Mode [F11]"
            id="purchase-fullscreen-toggle"
          >
            {isFullScreen ? (
              <Minimize2 className="w-4 h-4 text-slate-700" />
            ) : (
              <Maximize2 className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-medium animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Inward Purchases
          </span>
          <div className="text-xl lg:text-2xl font-black text-slate-900 mt-1 font-mono">
            ₹{kpiStats.totalPurchasesValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-teal-700 font-semibold mt-1 inline-block">
            {kpiStats.totalInvoicesCount} Invoices Processed
          </span>
        </div>

        <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Eligible Input Tax Credit (ITC)
          </span>
          <div className="text-xl lg:text-2xl font-black text-teal-700 mt-1 font-mono">
            ₹{kpiStats.totalItcTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">
            GST Claims Offset against POS sales
          </span>
        </div>

        <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Distributor Payables
          </span>
          <div className="text-xl lg:text-2xl font-black text-amber-700 mt-1 font-mono">
            ₹{kpiStats.pendingPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">
            Across {suppliers.length} authorized vendors
          </span>
        </div>

        <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Stock Catalog Active
          </span>
          <div className="text-xl lg:text-2xl font-black text-slate-900 mt-1 font-mono">
            {medicines.length} Medicines
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
            Real-time batch & expiry intake
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ADD NEW PURCHASE (WIDE ENTRY DASHBOARD)           */}
      {/* ======================================================== */}
      {activeTab === 'entry' && (
        <div className="space-y-6">
          {/* System Network Disconnection / Reconnection Alert Banner */}
          {networkNotice && (
            <div className={`p-4 rounded-3xl flex items-center justify-between text-xs font-bold border transition-all shadow-xs ${
              isSystemOffline
                ? 'bg-amber-500/10 border-amber-300 text-amber-950 animate-pulse'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}>
              <div className="flex items-center gap-3">
                {isSystemOffline ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                <div>
                  <span className="font-black uppercase tracking-wide">
                    {isSystemOffline ? 'System Disconnected: ' : 'System Connected: '}
                  </span>
                  <span>{networkNotice}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNetworkNotice(null)}
                className="p-1 hover:bg-black/5 rounded-lg text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 1-Hour Standby Restored Draft Banner */}
          {restoredDraftInfo && (
            <div className="p-4 sm:p-5 bg-teal-50 border-2 border-teal-400 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-teal-950 shadow-md animate-fadeIn">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <RotateCcw className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm sm:text-base text-teal-950">
                      Active Purchase Entry Restored (#{restoredDraftInfo.invoiceNo})
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-200 text-teal-900 text-[10px] font-extrabold uppercase">
                      {restoredDraftInfo.itemCount} Serial Products Preserved
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 border border-emerald-300">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>Standby Active: {standbyRemainingMinutes}m Remaining</span>
                    </span>
                  </div>
                  <p className="text-xs text-teal-800 mt-1">
                    System safely recovered your products after disconnection/refresh. Continue entering the same product, add next products, and confirm save!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    productInputRef.current?.focus();
                    setRestoredDraftInfo(null);
                  }}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Continue Entry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Discard restored draft and start a brand new blank purchase invoice?')) {
                      try {
                        localStorage.removeItem(ACTIVE_PURCHASE_DRAFT_KEY);
                      } catch {}
                      setRestoredDraftInfo(null);
                      resetInvoiceForm();
                    }
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Discard & Start Fresh
                </button>
              </div>
            </div>
          )}

          {/* Edit Mode Alert Banner */}
          {editingInvoiceId && (
            <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-indigo-950 text-sm">
                      Editing Purchase Entry #{invoiceNo}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800 text-[10px] font-bold uppercase">
                      Update Mode
                    </span>
                  </div>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Modifying this invoice will automatically synchronize inventory stock batches and distributor totals.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const inv = purchaseInvoices.find(i => i.id === editingInvoiceId);
                    if (inv) handleDeleteInvoice(inv);
                  }}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                  title="Permanently delete this invoice"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Delete Bill</span>
                </button>
                <button
                  type="button"
                  onClick={cancelEditingInvoice}
                  className="px-3.5 py-2 bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel Edit</span>
                </button>
              </div>
            </div>
          )}

          {/* Invoice Document Upload Component (Images, XLS, PDF) */}
          <PurchaseInvoiceUploader
            attachment={invoiceAttachment}
            onAttachmentChange={setInvoiceAttachment}
            onSpreadsheetParsed={handleSpreadsheetParsed}
            existingItemsCount={invoiceItems.length}
            onShowPurchaseEntry={handlePreviewCurrentEntry}
            isEditMode={!!editingInvoiceId}
            editingInvoiceNo={invoiceNo}
          />

          {/* SECTION A: DISTRIBUTOR & INVOICE HEADER DETAILS */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 lg:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                <h2 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                  1. Distributor & Invoice Details
                </h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1-Hour Standby Active ({standbyRemainingMinutes}m left)</span>
                </span>
                {activeDraftId && (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-2xs">
                    <Save className="w-3.5 h-3.5 text-amber-700" />
                    <span>On Hold (Draft: {activeDraftId})</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowSelectInvoiceModal(true)}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  title="Choose an existing purchase entry to edit"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                  <span>{editingInvoiceId ? 'Switch Invoice to Edit' : 'Edit Existing Entry'}</span>
                </button>
                {editingInvoiceId && (
                  <button
                    type="button"
                    onClick={cancelEditingInvoice}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Clear edit mode and start a new blank invoice"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Blank Entry</span>
                  </button>
                )}
                {purchaseDrafts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('drafts')}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <FileEdit className="w-3.5 h-3.5 text-amber-600" />
                    <span>Saved Drafts ({purchaseDrafts.length})</span>
                  </button>
                )}
                {/* Close Purchase Entry Tab Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (invoiceItems.length > 0) {
                      if (confirm('Hold entry in drafts before closing Purchase Entry tab?')) {
                        handleSaveAsPurchaseDraft();
                      }
                    }
                    setActiveTab('invoices');
                  }}
                  className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Close purchase entry tab and return to Purchase Invoices ledger"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close Entry Tab</span>
                </button>
              </div>
            </div>

            {/* Active Draft Banner if currently working on a held draft */}
            {activeDraftId && (
              <div className="bg-gradient-to-r from-amber-50 via-amber-100/60 to-orange-50 border border-amber-300 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-200/90 rounded-xl text-amber-800 shrink-0">
                    <Save className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm">Entry Currently On Hold: {activeDraftId}</span>
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">
                        Saved in Draft
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900/80 mt-0.5">
                      This purchase entry is saved in drafts and has NOT updated live stock. When verified, click <strong>Confirm & Complete</strong> to commit it into stock and close the entry tab.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={handleOpenConfirmPurchaseModal}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Complete</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDraftId(null);
                      resetInvoiceForm();
                      setActiveTab('invoices');
                    }}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs cursor-pointer transition-colors"
                  >
                    Close Entry
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Distributor Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Distributor / Sublayer *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddSupplierModal(true)}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add Sublayer</span>
                  </button>
                </div>
                <select
                  id="purchase-distributor-select"
                  value={distributorId}
                  onChange={e => setDistributorId(e.target.value)}
                  onKeyDown={onEnterMoveTo('purchase-invoice-no-input')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.paymentTerms})
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice No */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Invoice No *
                </label>
                <input
                  type="text"
                  id="purchase-invoice-no-input"
                  value={invoiceNo}
                  onChange={e => setInvoiceNo(e.target.value)}
                  onKeyDown={onEnterMoveTo('purchase-product-input')}
                  placeholder="e.g. APX/INV-2026/902"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Invoice Date */}
              <div>
                <DateMonthYearPicker
                  value={invoiceDate}
                  onChange={setInvoiceDate}
                  label="Invoice Date *"
                  id="purchase-invoice-date"
                />
              </div>

              {/* Payment Date / Due Date */}
              <div>
                <DateMonthYearPicker
                  value={paymentDate}
                  onChange={setPaymentDate}
                  label="Payment Due Date"
                  id="purchase-payment-due-date"
                />
              </div>
            </div>

            {/* Active Distributor Meta Strip */}
            {activeDistributor && (
              <div className="p-3 bg-teal-50/50 rounded-2xl border border-teal-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-bold text-teal-900">{activeDistributor.name}</span>
                  <span className="text-slate-500 font-mono">GSTIN: {activeDistributor.gstin || 'Unregistered'}</span>
                  <span className="text-slate-500 font-mono">D.L.: {activeDistributor.drugLicenseNo || 'N/A'}</span>
                  <span className="text-slate-500">Terms: {activeDistributor.paymentTerms}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px]">Current Outstanding Payable:</span>
                  <span className="font-mono font-bold text-amber-800">
                    ₹{(activeDistributor.outstandingPayable ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION B: PRODUCT ENTRY ROW (FAST ENTRY TERMINAL) */}
          <div
            id="section-product-entry-row"
            className={`bg-white rounded-3xl border p-5 lg:p-6 shadow-xs space-y-4 transition-all ${
              editingItemId ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
            }`}
          >
            {editingItemId && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-amber-950">Editing Line Item: {productQuery || 'Medicine'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold uppercase">
                        Active Edit
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Modify fields below and click <strong className="font-black">"Update"</strong> to save changes to this item in the bill table.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEditItem}
                  className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold text-xs transition-colors shrink-0 shadow-2xs"
                >
                  Cancel Edit
                </button>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-teal-600" />
                <h2 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                  2. Product Entry (Barcode / Molecule Intake)
                </h2>
              </div>
              <span className="text-xs text-teal-700 font-semibold">
                {editingItemId
                  ? 'Update values below and click "Update" to commit changes.'
                  : "Scan barcode or type medicine name, then press Enter or click 'Add Product'"}
              </span>
            </div>

            {/* Comprehensive Product Input Fields Form */}
            <form onSubmit={handleAddProduct} className="space-y-4">
              {/* Row 1: Product Selection, Generic Composition / Salt Description, HSN, Batch, Expiry, Pack */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-3">
                {/* Product / Barcode Search (col-span 3) */}
                <div className="lg:col-span-3 relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Product / Barcode *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setInitialProductQuery(productQuery);
                        setShowQuickAddProductModal(true);
                      }}
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Add Product</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      ref={productInputRef}
                      id="purchase-product-input"
                      type="text"
                      value={productQuery}
                      onChange={e => {
                        setProductQuery(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (matchingMedicines.length > 0) {
                            handleSelectMedicine(matchingMedicines[0]);
                          } else {
                            focusField('purchase-generic-input');
                          }
                        }
                      }}
                      placeholder="Scan barcode or type brand..."
                      className="w-full pl-8 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                      <VoiceInputButton
                        onTranscript={(text) => {
                          setProductQuery(text);
                          setShowProductDropdown(true);
                        }}
                        size="xs"
                        title="Speak product name or barcode"
                      />
                    </div>
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showProductDropdown && matchingMedicines.length > 0 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {matchingMedicines.map(med => (
                        <div
                          key={med.id}
                          onClick={() => handleSelectMedicine(med)}
                          className="p-2.5 hover:bg-teal-50/70 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{med.name}</span>
                            <span className="text-[10px] text-slate-500 block">{med.genericName}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-slate-700 text-[11px]">
                              ₹{(med.batches[0]?.costPrice ?? 0).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              HSN: {med.hsnCode}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div
                        onClick={() => {
                          setInitialProductQuery(productQuery);
                          setShowQuickAddProductModal(true);
                          setShowProductDropdown(false);
                        }}
                        className="p-2.5 bg-teal-50/70 hover:bg-teal-100 text-teal-800 cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Can't find medicine? + Add New Product</span>
                      </div>
                    </div>
                  )}

                  {showProductDropdown && matchingMedicines.length === 0 && productQuery.trim().length > 1 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 text-center text-xs">
                      <p className="text-slate-500 mb-2">No product found matching "{productQuery}"</p>
                      <button
                        type="button"
                        onClick={() => {
                          setInitialProductQuery(productQuery);
                          setShowQuickAddProductModal(true);
                          setShowProductDropdown(false);
                        }}
                        className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add "{productQuery}" to Catalog</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Generic Composition / Salt Description (col-span 3) */}
                <div className="lg:col-span-3 relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1">
                      <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                      <span>Salt / Generic Composition</span>
                    </label>
                    {genericComposition && (
                      <button
                        type="button"
                        onClick={() => {
                          setGenericComposition('');
                          setShowGenericDropdown(false);
                        }}
                        className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold"
                        title="Clear salt"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <input
                      ref={genericInputRef}
                      id="purchase-generic-input"
                      type="text"
                      value={genericComposition}
                      onChange={e => {
                        setGenericComposition(e.target.value);
                        setShowGenericDropdown(true);
                      }}
                      onFocus={() => setShowGenericDropdown(true)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (matchingSalts.length > 0 && showGenericDropdown) {
                            handleSelectSalt(matchingSalts[0]);
                          } else {
                            focusField('purchase-input-hsn');
                          }
                        } else if (e.key === 'Escape') {
                          setShowGenericDropdown(false);
                        }
                      }}
                      placeholder="Type letters (e.g. Para, Panto, Amox)..."
                      className="w-full pl-8 pr-3 py-2 bg-teal-50/30 border border-teal-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                    <FlaskConical className="w-4 h-4 text-teal-600 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>

                  {/* Autocomplete Generic Composition / Salt List Dropdown */}
                  {showGenericDropdown && matchingSalts.length > 0 && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-teal-200 max-h-60 overflow-y-auto divide-y divide-slate-100">
                      <div className="p-2 bg-teal-50/80 text-[10px] font-bold text-teal-900 uppercase tracking-wider flex items-center justify-between">
                        <span>Generic Compositions ({matchingSalts.length})</span>
                        <span className="text-[9px] text-teal-600 font-normal">Click to pick</span>
                      </div>
                      {matchingSalts.map((salt, sIdx) => {
                        const medsForSalt = getMedicinesForSalt(salt);
                        return (
                          <div
                            key={sIdx}
                            onClick={() => handleSelectSalt(salt)}
                            className="p-2.5 hover:bg-teal-50/80 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900">{salt}</span>
                              {medsForSalt.length > 0 && (
                                <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded-full">
                                  {medsForSalt.length} brand{medsForSalt.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            {medsForSalt.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {medsForSalt.slice(0, 3).map(m => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGenericComposition(salt);
                                      handleSelectMedicine(m);
                                      setShowGenericDropdown(false);
                                    }}
                                    className="text-[9px] px-1.5 py-0.5 bg-slate-100 hover:bg-teal-200 text-slate-700 hover:text-teal-950 rounded font-medium transition-colors"
                                    title={`Select ${m.name} (${salt})`}
                                  >
                                    {m.name}
                                  </button>
                                ))}
                                {medsForSalt.length > 3 && (
                                  <span className="text-[9px] text-slate-400 self-center">+{medsForSalt.length - 3} more</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {showGenericDropdown && matchingSalts.length === 0 && genericComposition.trim().length > 0 && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-teal-200 p-2.5 text-center text-xs">
                      <p className="text-slate-600 mb-1">Custom salt: <b>"{genericComposition}"</b></p>
                      <button
                        type="button"
                        onClick={() => setShowGenericDropdown(false)}
                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs"
                      >
                        Confirm Composition
                      </button>
                    </div>
                  )}
                </div>

                {/* HSN No (col-span 1) */}
                <div className="lg:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    HSN No
                  </label>
                  <input
                    type="text"
                    id="purchase-input-hsn"
                    value={hsnNo}
                    onChange={e => setHsnNo(e.target.value)}
                    onKeyDown={onEnterMoveTo('purchase-input-batch')}
                    placeholder="300490"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                {/* Batch (col-span 2) */}
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Batch *
                  </label>
                  <input
                    type="text"
                    id="purchase-input-batch"
                    value={batch}
                    onChange={e => setBatch(e.target.value)}
                    onKeyDown={onEnterMoveTo('purchase-expiry-input')}
                    placeholder="e.g. DL-993A"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                {/* Expiry Month/Years (col-span 2) */}
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Expiry (Month / Year) *
                  </label>
                  <ExpiryMonthYearInput
                    id="purchase-expiry-input"
                    value={expiry}
                    onChange={setExpiry}
                    onKeyDown={onEnterMoveTo('purchase-input-pack')}
                  />
                </div>

                {/* Pack (col-span 1) */}
                <div className="lg:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Pack
                  </label>
                  <input
                    type="text"
                    id="purchase-input-pack"
                    value={pack}
                    onChange={e => setPack(e.target.value)}
                    onKeyDown={onEnterMoveTo('purchase-input-box')}
                    placeholder="10s"
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Automatic Old Entry Price & Master Reference Banner */}
              {oldEntryDetails && (
                <div className="p-2.5 bg-gradient-to-r from-teal-50 via-emerald-50 to-slate-50 border border-teal-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs animate-fadeIn">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-teal-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>Old Entry Price (Auto Master):</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-teal-100 text-teal-900 font-mono font-bold border border-teal-200">
                      Last Pur. Rate: ₹{oldEntryDetails.lastRate.toFixed(2)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-mono font-bold border border-amber-200">
                      Last MRP: ₹{oldEntryDetails.lastMrp.toFixed(2)}
                    </span>
                    <span className="text-slate-500 text-[11px] font-mono">
                      Batch: {oldEntryDetails.batchNo} ({oldEntryDetails.totalBatches} past intake{oldEntryDetails.totalBatches > 1 ? 's' : ''})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPurchaseRate(oldEntryDetails.lastRate);
                      setMrp(oldEntryDetails.lastMrp);
                      if (oldEntryDetails.expiry) setExpiry(oldEntryDetails.expiry);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 rounded-xl text-[11px] font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Re-apply Old Price</span>
                  </button>
                </div>
              )}

              {/* Row 2: Box, Unit, Free, MRP, Purchase Rate, Scheme, Discount, GST, Amount, Add Button */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2.5 items-end">
                {/* Box (Visible ~1 inch) */}
                <div className="lg:col-span-1 min-w-[70px]">
                  <label className="block text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider mb-1 text-center">
                    Box
                  </label>
                  <input
                    type="number"
                    min="1"
                    id="purchase-input-box"
                    value={box === 0 || box === '0' ? '' : box}
                    onChange={e => setBox(e.target.value)}
                    onFocus={e => e.target.select()}
                    onKeyDown={onEnterMoveTo('purchase-input-unit')}
                    placeholder=""
                    className="w-full px-2 py-2 bg-indigo-50/40 border border-indigo-200 rounded-xl text-xs font-mono font-bold text-indigo-950 text-center focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Unit/Box (Visible ~1 inch) */}
                <div className="lg:col-span-1 min-w-[70px]">
                  <label className="block text-[11px] font-extrabold text-teal-700 uppercase tracking-wider mb-1 text-center">
                    Unit
                  </label>
                  <input
                    type="number"
                    min="1"
                    id="purchase-input-unit"
                    value={unit === 0 || unit === '0' ? '' : unit}
                    onChange={e => setUnit(e.target.value)}
                    onFocus={e => e.target.select()}
                    onKeyDown={onEnterMoveTo('purchase-input-free')}
                    placeholder=""
                    className="w-full px-2 py-2 bg-teal-50/40 border border-teal-200 rounded-xl text-xs font-mono font-bold text-teal-950 text-center focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                {/* Free (Visible ~1 inch) */}
                <div className="lg:col-span-1 min-w-[65px]">
                  <label className="block text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider mb-1 text-center">
                    Free
                  </label>
                  <input
                    type="number"
                    min="0"
                    id="purchase-input-free"
                    value={free === 0 || free === '0' ? '' : free}
                    onChange={e => setFree(e.target.value)}
                    onFocus={e => e.target.select()}
                    onKeyDown={onEnterMoveTo('purchase-input-mrp')}
                    placeholder=""
                    className="w-full px-2 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-mono font-bold text-emerald-800 text-center focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* MRP (₹) (Visible ~1 inch) */}
                <div className="lg:col-span-1 min-w-[80px]">
                  <label className="block text-[11px] font-extrabold text-amber-800 uppercase tracking-wider mb-1 text-right">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="purchase-input-mrp"
                    value={mrp === 0 || mrp === '0' ? '' : mrp}
                    onChange={e => setMrp(e.target.value)}
                    onFocus={e => e.target.select()}
                    onKeyDown={onEnterMoveTo('purchase-input-rate')}
                    placeholder=""
                    className={`w-full px-2 py-2 rounded-xl text-xs font-mono font-bold text-right focus:outline-hidden ${
                      isPurchaseRateInvalid
                        ? 'bg-rose-50 border-2 border-rose-400 text-rose-950 focus:ring-2 focus:ring-rose-500'
                        : 'bg-amber-50/40 border border-amber-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500'
                    }`}
                  />
                </div>

                {/* Purchase Rate (Visible ~1 inch) */}
                <div className="lg:col-span-2 min-w-[85px]">
                  <label className="block text-[11px] font-extrabold text-teal-800 uppercase tracking-wider mb-1 text-right">
                    Rate (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="purchase-input-rate"
                    value={purchaseRate === 0 || purchaseRate === '0' ? '' : purchaseRate}
                    onChange={e => setPurchaseRate(e.target.value)}
                    onFocus={e => e.target.select()}
                    onKeyDown={onEnterMoveTo('purchase-input-scheme')}
                    placeholder=""
                    className={`w-full px-2.5 py-2 rounded-xl text-xs font-mono font-bold text-right focus:outline-hidden ${
                      isPurchaseRateInvalid
                        ? 'bg-rose-50 border-2 border-rose-500 text-rose-950 focus:ring-2 focus:ring-rose-500'
                        : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500'
                    }`}
                  />
                </div>

                {/* Scheme % */}
                <div className="lg:col-span-1 min-w-[65px]">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 text-center">
                    Scheme %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    id="purchase-input-scheme"
                    value={scheme === 0 || scheme === '0' ? '' : scheme}
                    onChange={e => setScheme(e.target.value)}
                    onFocus={e => e.target.select()}
                    onKeyDown={onEnterMoveTo('purchase-input-disc')}
                    placeholder=""
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 text-center focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                {/* Discount % */}
                <div className="lg:col-span-1 min-w-[65px]">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 text-center">
                    Disc %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    id="purchase-input-disc"
                    value={discount === 0 || discount === '0' ? '' : discount}
                    onChange={e => setDiscount(e.target.value)}
                    onFocus={e => e.target.select()}
                    onKeyDown={onEnterMoveTo('purchase-input-gst')}
                    placeholder=""
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 text-center focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                {/* GST % */}
                <div className="lg:col-span-1 min-w-[70px]">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 text-center">
                    GST %
                  </label>
                  <select
                    id="purchase-input-gst"
                    value={gst}
                    onChange={e => setGst(Number(e.target.value))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!isPurchaseRateInvalid) {
                          handleAddProduct();
                        }
                      }
                    }}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 text-center focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>

                {/* Calculated Amount */}
                <div className="lg:col-span-1 min-w-[85px]">
                  <label className="block text-[11px] font-bold text-teal-800 uppercase tracking-wider mb-1 text-right">
                    Amount (₹)
                  </label>
                  <div className="w-full px-2 py-2 bg-teal-50 border border-teal-200 rounded-xl text-xs font-mono font-bold text-teal-900 text-right truncate">
                    ₹{currentLineCalc.netAmount.toFixed(2)}
                  </div>
                </div>

                {/* ADD / UPDATE PRODUCT BUTTON */}
                <div className="lg:col-span-2">
                  {editingItemId ? (
                    <div className="flex gap-1.5">
                      <button
                        type="submit"
                        disabled={isPurchaseRateInvalid}
                        className={`flex-1 px-3 py-2 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer ${
                          isPurchaseRateInvalid
                            ? 'bg-slate-400 cursor-not-allowed opacity-60'
                            : 'bg-amber-600 hover:bg-amber-700'
                        }`}
                        title="Update this item in bill table"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Update</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditItem}
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                        title="Cancel editing item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={isPurchaseRateInvalid}
                      className={`w-full px-4 py-2 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer ${
                        isPurchaseRateInvalid
                          ? 'bg-slate-400 cursor-not-allowed opacity-60'
                          : 'bg-teal-600 hover:bg-teal-700'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Product</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Purchase Rate vs MRP Validation Alert Feedback */}
              {isPurchaseRateInvalid ? (
                <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center justify-between text-xs text-rose-800 font-bold animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      ⚠️ VALIDATION ERROR: Purchase Rate (₹{numCurrentRate.toFixed(2)}) must be strictly less than MRP (₹{numCurrentMrp.toFixed(2)})! You cannot buy goods at or above Maximum Retail Price.
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg shrink-0">
                    Rule: Rate &lt; MRP
                  </span>
                </div>
              ) : numCurrentMrp > 0 && numCurrentRate > 0 ? (
                <div className="flex items-center justify-between px-2 text-[11px] text-teal-800 font-medium">
                  <span>
                    Gross Margin: ₹{(numCurrentMrp - numCurrentRate).toFixed(2)} ({Math.round(((numCurrentMrp - numCurrentRate) / numCurrentMrp) * 100)}% profit margin on MRP)
                  </span>
                  <span className="text-emerald-700 font-bold">✓ Valid: Purchase Rate &lt; MRP</span>
                </div>
              ) : null}
            </form>
          </div>

          {/* SECTION C: WIDE PRODUCTS BILL TABLE */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 lg:p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                  3. Inward Bill Items ({invoiceItems.length} Products — Minimum 50 Product Serials Supported)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-900 border border-teal-300">
                  {invoiceItems.length >= 50 ? '50+ Serials Inward' : 'Serial S.No 1..50+ Supported'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  1-Hour Standby Protected
                </span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                <span>Total Billed Units: <strong className="text-slate-900">{billSummary.totalBilledUnits}</strong></span>
                <span>Free Scheme Units: <strong className="text-emerald-700">+{billSummary.totalFreeUnits}</strong></span>
                <span>Net Inward Stock: <strong className="text-teal-800">{billSummary.totalBilledUnits + billSummary.totalFreeUnits}</strong></span>
              </div>
            </div>

            {/* Widescreen Responsive Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-600 bg-slate-50/70">
                    <th className="py-3 px-3">S.No (1-50+)</th>
                    <th className="py-3 px-3 min-w-[180px]">Product / Molecule</th>
                    <th className="py-3 px-2">HSN</th>
                    <th className="py-3 px-2">Batch</th>
                    <th className="py-3 px-2">Expiry</th>
                    <th className="py-3 px-2">Pack</th>
                    <th className="py-3 px-1 text-center w-[72px] min-w-[70px] font-extrabold text-indigo-900 bg-indigo-50/80 border-x border-slate-200">
                      BOX
                    </th>
                    <th className="py-3 px-1 text-center w-[72px] min-w-[70px] font-extrabold text-teal-900 bg-teal-50/80 border-r border-slate-200">
                      UNIT
                    </th>
                    <th className="py-3 px-2 text-center font-bold">Billed</th>
                    <th className="py-3 px-2 text-center text-emerald-700 font-bold">Free</th>
                    <th className="py-3 px-2 text-center">Total In</th>
                    <th className="py-3 px-2 text-right w-[85px] min-w-[80px] font-extrabold text-slate-900 bg-amber-50/50">
                      MRP (₹)
                    </th>
                    <th className="py-3 px-2 text-right w-[85px] min-w-[80px] font-extrabold text-teal-950 bg-emerald-50/50">
                      RATE (₹)
                    </th>
                    <th className="py-3 px-2 text-right">Scheme</th>
                    <th className="py-3 px-2 text-right">Disc%</th>
                    <th className="py-3 px-2 text-right">Taxable</th>
                    <th className="py-3 px-2 text-center">GST</th>
                    <th className="py-3 px-3 text-right font-bold text-slate-900">Line Amount</th>
                    <th className="py-3 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceItems.length === 0 ? (
                    <tr>
                      <td colSpan={19} className="py-12 text-center text-slate-400">
                        <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-sm text-slate-600">No products added to this invoice yet</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Use the product entry row above to scan barcodes or enter products.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    invoiceItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{index + 1}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block">{item.medicineName}</span>
                          {item.genericName && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-medium mt-0.5 border border-teal-100 max-w-[210px] truncate" title={`Salt / Generic Composition: ${item.genericName}`}>
                              <FlaskConical className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                              <span className="truncate">{item.genericName}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 font-mono text-slate-600">{item.hsnCode}</td>
                        <td className="py-2.5 px-2 font-mono font-semibold text-slate-800">{item.batchNumber}</td>
                        <td className="py-2.5 px-2 font-mono text-slate-600">{item.expiryDate}</td>
                        <td className="py-2.5 px-2 text-slate-600">{item.pack}</td>
                        <td className="py-2.5 px-1 text-center font-mono font-extrabold text-indigo-950 bg-indigo-50/20 border-x border-slate-100">
                          {item.boxes || 1}
                        </td>
                        <td className="py-2.5 px-1 text-center font-mono font-extrabold text-teal-950 bg-teal-50/20 border-r border-slate-100">
                          {item.unitsPerBox || 10}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">
                          {item.billedQuantity}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-700">
                          {item.freeQuantity > 0 ? `+${item.freeQuantity}` : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-teal-800">
                          {item.totalQuantity}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 bg-amber-50/15">
                          ₹{(item.mrp ?? 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-extrabold text-teal-900 bg-emerald-50/15">
                          ₹{(item.purchaseRate ?? 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                          {item.schemePercentage > 0 ? `${item.schemePercentage}%` : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                          {item.discountPercentage > 0 ? `${item.discountPercentage}%` : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                          ₹{(item.taxableAmount ?? 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                          {item.gstRate}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                          ₹{(item.netAmount ?? 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleLoadItemIntoEditor(item)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                              title="Edit this item (load into editor row)"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveInvoiceItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Remove Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION D: TOTAL AMOUNT SUMMARY & SAVE CONTROLS (WIDE BAR) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 lg:p-6 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Remarks & Inventory Option (col-span 5) */}
              <div className="lg:col-span-5 space-y-3">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Remarks / Goods Inward Note
                </label>
                <textarea
                  rows={2}
                  value={invoiceNotes}
                  onChange={e => setInvoiceNotes(e.target.value)}
                  placeholder="e.g. Received via delivery van, cold chain maintained, physical counts matched."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
                />

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={autoUpdateInventory}
                    onChange={e => setAutoUpdateInventory(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500"
                  />
                  <span>Automatically restock pharmacy inventory & update medicine batches</span>
                </label>
              </div>

              {/* Tax & Grand Total Breakdown (col-span 7) */}
              <div className="lg:col-span-7 bg-slate-50 p-4 lg:p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Gross Total:</span>
                    <span className="font-mono font-bold text-slate-800">
                      ₹{billSummary.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px] block">Scheme & Disc:</span>
                      <button
                        type="button"
                        onClick={() => setShowTotalDiscountModal(true)}
                        className="text-[9px] font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                        title="Edit Total Bill Discount"
                        id="purchase-edit-total-discount-btn"
                      >
                        Edit
                      </button>
                    </div>
                    <span className="font-mono font-semibold text-rose-600 block mt-0.5">
                      - ₹{(billSummary.totalScheme + billSummary.totalDiscount).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Taxable Value:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{billSummary.taxableAmount.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">GST (CGST+SGST):</span>
                    <span className="font-mono font-bold text-teal-800">
                      + ₹{billSummary.totalTax.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Supplier Payment & Billing Terms */}
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-teal-600" />
                      <span>Supplier Payment Terms & Options</span>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      Math.max(0, billSummary.grandTotal - Number(supplierPaidAmount || 0)) === 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : Number(supplierPaidAmount || 0) > 0
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {Math.max(0, billSummary.grandTotal - Number(supplierPaidAmount || 0)) === 0
                        ? 'Fully Paid'
                        : Number(supplierPaidAmount || 0) > 0
                        ? 'Partially Paid'
                        : 'Credit / Unpaid'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Payment Mode
                      </label>
                      <select
                        value={supplierPaymentMethod}
                        onChange={e => {
                          const m = e.target.value as any;
                          setSupplierPaymentMethod(m);
                          if (m === 'Credit') {
                            setSupplierPaidAmount('0');
                          } else if (supplierPaidAmount === '0' || !supplierPaidAmount) {
                            setSupplierPaidAmount(billSummary.grandTotal.toFixed(2));
                          }
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="Credit">Credit / Unpaid</option>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI Payment</option>
                        <option value="Bank_Transfer">Bank Transfer / NEFT</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Paid Amount (₹)
                        </label>
                        <button
                          type="button"
                          onClick={() => setSupplierPaidAmount(billSummary.grandTotal.toFixed(2))}
                          className="text-[10px] text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
                        >
                          Full
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={supplierPaidAmount}
                        onChange={e => setSupplierPaidAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Balance Due (₹)
                      </label>
                      <div className="px-2.5 py-1.5 bg-slate-100 rounded-xl text-xs font-mono font-bold text-rose-700">
                        ₹{Math.max(0, billSummary.grandTotal - Number(supplierPaidAmount || 0)).toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Payment Ref / Cheque #
                      </label>
                      <input
                        type="text"
                        value={supplierPaymentRef}
                        onChange={e => setSupplierPaymentRef(e.target.value)}
                        placeholder="UTR / Cheque No."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Big Total Row & Save Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      TOTAL AMOUNT (PAYABLE)
                    </span>
                    <div className="text-2xl lg:text-3xl font-black font-mono text-emerald-800">
                      ₹{billSummary.grandTotal.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap justify-end">
                    {/* Hold Entry in Draft */}
                    <button
                      type="button"
                      onClick={handleSaveAsPurchaseDraft}
                      className="px-3.5 py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      title="Hold this inward purchase entry in drafts. Stock is not affected until confirmed and completed."
                      id="btn-save-as-purchase-draft"
                    >
                      <Save className="w-4 h-4 text-amber-700" />
                      <span>Hold Entry (Draft)</span>
                    </button>

                    {/* Hold & Close Entry Tab */}
                    <button
                      type="button"
                      onClick={handleHoldAndClosePurchaseEntry}
                      className="px-3.5 py-3 bg-amber-100/60 hover:bg-amber-200/80 text-amber-950 border border-amber-300 text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      title="Hold this entry in drafts and close Purchase Entry tab, returning to Invoices ledger."
                      id="btn-hold-and-close-tab"
                    >
                      <Bookmark className="w-4 h-4 text-amber-800" />
                      <span>Hold & Close Tab</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePreviewCurrentEntry}
                      className="px-3.5 py-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      title="Show preview voucher of current purchase entry with download/print"
                    >
                      <Eye className="w-4 h-4 text-teal-600" />
                      <span>Show Entry</span>
                    </button>

                    {editingInvoiceId ? (
                      <button
                        type="button"
                        onClick={cancelEditingInvoice}
                        className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Clear all items from this purchase invoice?')) {
                            setInvoiceItems([]);
                            setInvoiceAttachment(null);
                          }
                        }}
                        className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-2xl transition-colors cursor-pointer"
                      >
                        Clear Bill
                      </button>
                    )}

                    {/* Confirm, Complete & Save */}
                    <button
                      type="button"
                      onClick={handleOpenConfirmPurchaseModal}
                      className={`flex-1 sm:flex-none px-6 py-3 text-white text-sm font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        editingInvoiceId
                          ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                          : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      }`}
                      title="Confirm batch details, inward quantities, and complete purchase entry (closes tab on save)"
                    >
                      {editingInvoiceId ? (
                        <>
                          <Edit3 className="w-5 h-5" />
                          <span>Confirm & Update [F10]</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Confirm Save & Complete [F10]</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: PURCHASE DRAFTS (MANUALLY SAVED / DELETED DRAFTS)  */}
      {/* ======================================================== */}
      {activeTab === 'drafts' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5 lg:p-6 animate-fadeIn">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900">Purchase Inward Drafts</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {purchaseDrafts.length} Saved
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Saved distributor inward entries. These drafts remain securely in storage until you load them into entry to finalize, or manually delete them.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('entry')}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <PackagePlus className="w-4 h-4" />
                <span>+ New Purchase Entry</span>
              </button>

              {purchaseDrafts.length > 0 && (
                <button
                  onClick={handleClearAllPurchaseDrafts}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Clear all saved purchase drafts"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All Drafts</span>
                </button>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={purchaseDraftSearch}
                onChange={e => setPurchaseDraftSearch(e.target.value)}
                placeholder="Search drafts by draft ID, invoice number, distributor name, medicine..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              {purchaseDraftSearch && (
                <button
                  onClick={() => setPurchaseDraftSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Drafts List */}
          {filteredPurchaseDrafts.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <Archive className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {purchaseDraftSearch ? 'No matching purchase drafts found' : 'No Purchase Drafts Saved'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {purchaseDraftSearch
                  ? 'Try changing your search terms or clearing the filter.'
                  : 'You can save inward bills as drafts anytime while adding items. Drafts will remain saved until you manually resume or delete them.'}
              </p>
              <button
                onClick={() => setActiveTab('entry')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 shadow-xs cursor-pointer"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Go to Purchase Entry</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPurchaseDrafts.map(draft => {
                const isExpanded = expandedDraftId === draft.id;
                const formattedDate = new Date(draft.createdAt).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={draft.id}
                    className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-amber-300 transition-all shadow-2xs space-y-3"
                  >
                    {/* Top Row: Meta info and quick action buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                          <FileEdit className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md">
                              {draft.id}
                            </span>
                            <span className="font-bold text-sm text-slate-900">
                              {draft.distributorName}
                            </span>
                            {draft.distributorGstin && (
                              <span className="text-[11px] text-slate-400 font-mono">
                                GST: {draft.distributorGstin}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>Saved: {formattedDate}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">Inv #{draft.invoiceNo}</span>
                            <span>•</span>
                            <span>Inv Date: {draft.invoiceDate}</span>
                            {draft.paymentDueDate && (
                              <>
                                <span>•</span>
                                <span>Due: {draft.paymentDueDate}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Grand Total
                          </span>
                          <span className="text-base sm:text-lg font-black font-mono text-emerald-700">
                            ₹{draft.grandTotal.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setDraftToConfirm(draft);
                              setShowConfirmModal(true);
                            }}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            title="Confirm, complete and commit this draft directly into the purchase ledger & stock"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm & Complete</span>
                          </button>

                          <button
                            onClick={() => handleResumePurchaseDraft(draft)}
                            className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            title="Load this draft into the purchase entry form"
                          >
                            <Play className="w-3.5 h-3.5 text-teal-600" />
                            <span>Resume</span>
                          </button>

                          <button
                            onClick={e => handleDeletePurchaseDraft(draft.id, e)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Manually delete this draft"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Summary row */}
                    <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl flex-wrap gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-slate-800">
                          {(draft.items || []).length} Product Line(s)
                        </span>
                        <span>•</span>
                        <span>
                          Taxable: <strong className="font-mono">₹{draft.taxableAmount.toFixed(2)}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          GST Tax: <strong className="font-mono">₹{draft.totalTax.toFixed(2)}</strong>
                        </span>
                        {draft.notes && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-500 max-w-xs truncate">
                              Note: {draft.notes}
                            </span>
                          </>
                        )}
                        {draft.attachment && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-teal-700 font-semibold">
                              <Paperclip className="w-3 h-3" />
                              Attachment: {draft.attachment.name}
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => setExpandedDraftId(isExpanded ? null : draft.id)}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Details' : 'View Items'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Expanded Items Table */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-100 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/60">
                              <th className="p-2">#</th>
                              <th className="p-2">Medicine / Item</th>
                              <th className="p-2">Batch</th>
                              <th className="p-2">Expiry</th>
                              <th className="p-2">Pack</th>
                              <th className="p-2 text-right">Qty</th>
                              <th className="p-2 text-right">Free</th>
                              <th className="p-2 text-right">Rate</th>
                              <th className="p-2 text-right">MRP</th>
                              <th className="p-2 text-right">GST %</th>
                              <th className="p-2 text-right">Net Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {draft.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                                <td className="p-2">
                                  <div className="font-bold text-slate-800">{item.medicineName}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">HSN: {item.hsn}</div>
                                </td>
                                <td className="p-2 font-mono font-bold text-slate-700">{item.batch}</td>
                                <td className="p-2 font-mono text-slate-600">{item.expiry}</td>
                                <td className="p-2 text-slate-600">{item.pack}</td>
                                <td className="p-2 text-right font-mono font-bold text-slate-900">{item.box}</td>
                                <td className="p-2 text-right font-mono text-emerald-700">{item.free || 0}</td>
                                <td className="p-2 text-right font-mono text-slate-800">₹{item.purchaseRate.toFixed(2)}</td>
                                <td className="p-2 text-right font-mono text-slate-600">₹{item.mrp.toFixed(2)}</td>
                                <td className="p-2 text-right font-mono text-teal-700">{item.gst}%</td>
                                <td className="p-2 text-right font-mono font-black text-slate-900">
                                  ₹{item.netAmount.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: INWARD INVOICES (HISTORY & LEDGER)                */}
      {/* ======================================================== */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Inward Purchase Invoices Ledger</h2>
              <p className="text-xs text-slate-500">
                Complete record of vendor bills, GST input tax credits, and payment statuses.
              </p>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={invoiceSearch}
                  onChange={e => setInvoiceSearch(e.target.value)}
                  placeholder="Search invoice or distributor..."
                  className="pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden w-60"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                  <VoiceInputButton
                    onTranscript={(text) => setInvoiceSearch(text)}
                    size="xs"
                    title="Speak invoice number or distributor"
                  />
                </div>
              </div>

              <select
                value={invoiceStatusFilter}
                onChange={e => setInvoiceStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="All">All Invoices</option>
                <option value="Pending">⚠️ Pending Payment (Balance Due)</option>
                <option value="Unpaid">Unpaid Invoices</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Fully Paid</option>
              </select>

              <button
                type="button"
                onClick={() => exportPurchaseInvoicesLedgerToExcel(filteredInvoices)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                title="Download full inward purchases ledger to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Ledger (Excel)</span>
              </button>

              {purchaseInvoices.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all inward purchases to zero? This will set Total Inward Purchases and Input Tax Credit (ITC) to zero.')) {
                      StorageService.clearPurchaseInvoices();
                      setPurchaseInvoices([]);
                      setSuccessBanner('Inward purchases and Input Tax Credit (ITC) have been reset to zero.');
                    }
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Reset Total Inward Purchases and Eligible Input Tax Credit (ITC) to zero"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Zero</span>
                </button>
              )}

              <button
                onClick={() => {
                  resetInvoiceForm();
                  setActiveTab('entry');
                }}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Invoice / Upload</span>
              </button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-600 bg-slate-50/70">
                  <th className="py-3 px-3">Invoice No</th>
                  <th className="py-3 px-3">Distributor Name</th>
                  <th className="py-3 px-3">Invoice Date</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-2 text-center">Items</th>
                  <th className="py-3 px-3 text-right">Taxable</th>
                  <th className="py-3 px-3 text-right">Total GST</th>
                  <th className="py-3 px-3 text-right font-black">Total Bill</th>
                  <th className="py-3 px-3 text-right font-bold text-emerald-800">Paid Amount</th>
                  <th className="py-3 px-3 text-right font-bold text-rose-800">Balance Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-14 text-center text-slate-400">
                      <div className="max-w-sm mx-auto flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-3 shadow-xs">
                          <Truck className="w-6 h-6 stroke-[1.8]" />
                        </div>
                        <p className="font-bold text-slate-800 text-sm">No Inward Purchases Recorded</p>
                        <p className="text-slate-500 text-xs mt-1">
                          Total Inward Purchases: <span className="font-bold text-slate-700 font-mono">₹0.00</span> • Input Tax Credit (ITC): <span className="font-bold text-teal-700 font-mono">₹0.00</span>
                        </p>
                        <button
                          onClick={() => {
                            resetInvoiceForm();
                            setActiveTab('entry');
                          }}
                          className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Enter First Inward Bill</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-900">
                          {inv.invoiceNo}
                        </div>
                        {inv.attachment ? (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[10px] font-semibold text-teal-700">
                              {inv.attachment.type === 'pdf' ? (
                                <FileText className="w-3 h-3 text-rose-600" />
                              ) : inv.attachment.type === 'xls' || inv.attachment.type === 'csv' ? (
                                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Paperclip className="w-3 h-3 text-teal-600" />
                              )}
                              <span className="truncate max-w-[90px]">{inv.attachment.name}</span>
                            </span>
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {inv.distributorName}
                        {inv.distributorGstin && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            GSTIN: {inv.distributorGstin}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{inv.invoiceDate}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{inv.paymentDueDate}</td>
                      <td className="py-3 px-2 text-center font-mono font-semibold text-slate-800">
                        {(inv.items || []).length}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        ₹{(inv.taxableAmount ?? 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-teal-800 font-semibold">
                        ₹{(inv.totalTax ?? 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-sm">
                        ₹{(inv.grandTotal ?? 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        ₹{(inv.paidAmount ?? (inv.paymentStatus === 'Paid' ? inv.grandTotal : 0)).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                        ₹{(inv.balanceAmount ?? (inv.paymentStatus === 'Paid' ? 0 : inv.grandTotal)).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            inv.paymentStatus === 'Paid' || (inv.balanceAmount === 0 && (inv.paidAmount || 0) > 0)
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : inv.paymentStatus === 'Partially Paid' || ((inv.paidAmount || 0) > 0 && (inv.balanceAmount || 0) > 0)
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {inv.paymentStatus === 'Paid' || (inv.balanceAmount === 0 && (inv.paidAmount || 0) > 0)
                            ? 'Paid'
                            : inv.paymentStatus === 'Partially Paid' || ((inv.paidAmount || 0) > 0 && (inv.balanceAmount || 0) > 0)
                            ? 'Partial'
                            : 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {(inv.balanceAmount ?? (inv.paymentStatus === 'Paid' ? 0 : inv.grandTotal)) > 0 && (
                            <div className="inline-flex items-center rounded-lg shadow-xs overflow-hidden border border-emerald-600">
                              <button
                                type="button"
                                onClick={() => {
                                  setPayingTypeForModal('FULL');
                                  setPayingInvoiceForModal(inv);
                                }}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 transition-all cursor-pointer"
                                title={`Full Payment: Clear total pending balance of ₹${(inv.balanceAmount ?? inv.grandTotal).toFixed(2)}`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Full Pay</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPayingTypeForModal('PART');
                                  setPayingInvoiceForModal(inv);
                                }}
                                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-emerald-100 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border-l border-emerald-500"
                                title="Part Payment: Record installment or advance payment"
                              >
                                <CreditCard className="w-3 h-3 text-amber-300" />
                                <span>Part Pay</span>
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setViewingInvoice(inv)}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors border border-teal-200"
                            title="Show Purchase Entry Voucher"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                            <span>Show Entry</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setUpdatingInvoice(inv)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors border border-indigo-200"
                            title="Upload new invoice file & update entry"
                          >
                            <FileUp className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Upload Update</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditingInvoice(inv)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors border border-amber-300 shadow-2xs cursor-pointer"
                            title="Edit purchase entry in full form (load medicines, rates & supplier)"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                            <span>Edit Entry</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInvoice(inv)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors border border-rose-300 shadow-2xs cursor-pointer"
                            title="Permanently delete purchase entry, revert inventory batches & distributor ledger"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => exportPurchaseInvoiceToPDF(inv)}
                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs transition-colors"
                            title="Download PDF Bill"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => exportPurchaseInvoiceToExcel(inv)}
                            className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs transition-colors"
                            title="Download Excel Sheet"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                          {inv.attachment?.dataUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = inv.attachment!.dataUrl!;
                                link.download = inv.attachment!.name;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="p-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold rounded-lg text-xs transition-colors"
                              title={`Download Uploaded ${inv.attachment.name}`}
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {inv.paymentStatus !== 'Paid' && (
                            <button
                              type="button"
                              onClick={() => handleMarkInvoicePaid(inv.id)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
                              title="Mark as Paid"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Settle</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PURCHASE ORDERS (PO TRACKING)                     */}
      {/* ======================================================== */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Purchase Orders & Replenishments</h2>
              <p className="text-xs text-slate-500">
                Track formal orders sent to pharmaceutical distributors before invoice delivery.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={poSearchQuery}
                  onChange={e => setPoSearchQuery(e.target.value)}
                  placeholder="Search POs..."
                  className="pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden w-56"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                  <VoiceInputButton
                    onTranscript={(text) => setPoSearchQuery(text)}
                    size="xs"
                    title="Speak PO search query"
                  />
                </div>
              </div>

              <button
                onClick={() => setShowCreatePOModal(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create PO</span>
              </button>
            </div>
          </div>

          {/* PO Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-600 bg-slate-50/70">
                  <th className="py-3 px-3">PO Number</th>
                  <th className="py-3 px-3">Supplier</th>
                  <th className="py-3 px-3">Order Date</th>
                  <th className="py-3 px-3">Expected Date</th>
                  <th className="py-3 px-2 text-center">Items</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-right font-black">Grand Total</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      No purchase orders recorded.
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map(po => (
                    <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{po.id}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{po.supplierName}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{po.orderDate}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{po.expectedDeliveryDate}</td>
                      <td className="py-3 px-2 text-center font-mono font-semibold">{(po.items || []).length}</td>
                      <td className="py-3 px-3 text-right font-mono">₹{(po.subtotal ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{(po.grandTotal ?? 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            po.status === 'Received'
                              ? 'bg-emerald-100 text-emerald-800'
                              : po.status === 'In Transit'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {po.status !== 'Received' && (
                          <button
                            onClick={() => {
                              StorageService.updatePurchaseOrderStatus(po.id, 'Received');
                              reloadData();
                            }}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold rounded-lg text-xs transition-colors"
                          >
                            Receive
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: PURCHASE REPORT (ANALYTICS, LEDGER, ITC)          */}
      {/* ======================================================== */}
      {activeTab === 'report' && (
        <PurchaseReportView
          onViewInvoice={(inv) => setViewingInvoice(inv)}
          onRefreshData={() => {
            setPurchaseInvoices(StorageService.getPurchaseInvoices());
            setSuppliers(StorageService.getSuppliers());
            setMedicines(StorageService.getMedicines());
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* ======================================================== */}
      {/* TAB 5: RETAIL PAYMENT PENDING (DUE BILLS & AGING)        */}
      {/* ======================================================== */}
      {activeTab === 'payment-pending' && (
        <RetailPurchaseHubView
          initialTab="payment-pending"
          onRefreshData={() => {
            setPurchaseInvoices(StorageService.getPurchaseInvoices());
            setSuppliers(StorageService.getSuppliers());
            if (onRefreshData) onRefreshData();
          }}
          onNavigateToPurchases={() => setActiveTab('entry')}
        />
      )}

      {/* ======================================================== */}
      {/* TAB 6: RETAIL PURCHASE PAYMENT REPORT (AUDIT REGISTER)   */}
      {/* ======================================================== */}
      {activeTab === 'payment-report' && (
        <RetailPurchaseHubView
          initialTab="payment-report"
          onRefreshData={() => {
            setPurchaseInvoices(StorageService.getPurchaseInvoices());
            setSuppliers(StorageService.getSuppliers());
            if (onRefreshData) onRefreshData();
          }}
          onNavigateToPurchases={() => setActiveTab('entry')}
        />
      )}

      {/* ======================================================== */}
      {/* TAB 7: RETAIL SUPPLIER LIST (PHARMA DISTRIBUTORS)        */}
      {/* ======================================================== */}
      {activeTab === 'suppliers' && (
        <RetailPurchaseHubView
          initialTab="supplier-list"
          onRefreshData={() => {
            setPurchaseInvoices(StorageService.getPurchaseInvoices());
            setSuppliers(StorageService.getSuppliers());
            if (onRefreshData) onRefreshData();
          }}
          onNavigateToPurchases={() => setActiveTab('entry')}
        />
      )}

      {/* Printable Invoice Voucher Modal */}
      {viewingInvoice && (
        <PurchaseInvoiceVoucherModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          onMarkPaid={handleMarkInvoicePaid}
          onEditInvoice={startEditingInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onUploadUpdate={(inv) => setUpdatingInvoice(inv)}
        />
      )}

      {/* Upload & Update Invoice Modal */}
      {updatingInvoice && (
        <PurchaseInvoiceUpdateModal
          invoice={updatingInvoice}
          onClose={() => setUpdatingInvoice(null)}
          onUpdated={(updatedInvoice, message) => {
            reloadData();
            setViewingInvoice(updatedInvoice);
            setSuccessBanner(message);
            setTimeout(() => setSuccessBanner(null), 8000);
          }}
          onOpenInFullEditor={(inv, newAttachment, newItems) => {
            startEditingInvoice(inv);
            if (newAttachment) {
              setInvoiceAttachment(newAttachment);
            }
            if (newItems && newItems.length > 0) {
              setInvoiceItems(newItems);
            }
            setActiveTab('entry');
          }}
        />
      )}

      {/* Create PO Modal */}
      {showCreatePOModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Purchase Order (PO)</h3>
              <button
                onClick={() => setShowCreatePOModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchaseOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Supplier</label>
                <select
                  value={newPOSupplierId}
                  onChange={e => setNewPOSupplierId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">Add Medicine Item</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <select
                      value={selectedMedToAdd}
                      onChange={e => {
                        setSelectedMedToAdd(e.target.value);
                        const med = medicines.find(m => m.id === e.target.value);
                        if (med && med.batches[0]) {
                          setPoItemCostPrice(med.batches[0].costPrice);
                        }
                      }}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                    >
                      {medicines.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={poItemQuantity}
                      onChange={e => setPoItemQuantity(Number(e.target.value))}
                      placeholder="Qty"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-center"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const med = medicines.find(m => m.id === selectedMedToAdd);
                    if (!med) return;
                    setNewPoItems(prev => [
                      ...prev,
                      {
                        medicineId: med.id,
                        quantity: poItemQuantity,
                        unitCost: poItemCostPrice,
                        taxRate: med.taxRate
                      }
                    ]);
                  }}
                  className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl"
                >
                  Add Item to PO
                </button>
              </div>

              {/* Items Preview */}
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {newPoItems.map((item, idx) => {
                  const med = medicines.find(m => m.id === item.medicineId);
                  return (
                    <div
                      key={idx}
                      className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800">{med?.name}</span>
                      <span className="font-mono text-slate-600">
                        {item.quantity} units @ ₹{item.unitCost}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreatePOModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl"
                >
                  Dispatch Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile App Download Modal */}
      {showMobileAppModal && (
        <MobileAppDownloadModal
          isOpen={showMobileAppModal}
          onClose={() => setShowMobileAppModal(false)}
        />
      )}

      {/* Desktop Computer Download Modal (City Rx) */}
      {showDesktopAppModal && (
        <DesktopDownloadModal
          isOpen={showDesktopAppModal}
          onClose={() => setShowDesktopAppModal(false)}
          pharmacyName="City Rx"
        />
      )}

      {/* Add Supplier / Sublayer Modal */}
      {showAddSupplierModal && (
        <AddSupplierModal
          isOpen={showAddSupplierModal}
          onClose={() => setShowAddSupplierModal(false)}
          onSupplierAdded={handleSupplierAdded}
        />
      )}

      {/* Quick Add Product Modal */}
      {showQuickAddProductModal && (
        <QuickAddProductModal
          isOpen={showQuickAddProductModal}
          onClose={() => setShowQuickAddProductModal(false)}
          onProductAdded={handleProductAdded}
          initialQuery={initialProductQuery}
        />
      )}

      {/* Edit Purchase Item Modal */}
      {editingItemForModal && (
        <EditPurchaseItemModal
          isOpen={!!editingItemForModal}
          item={editingItemForModal}
          onClose={() => setEditingItemForModal(null)}
          onSave={handleSaveModalItem}
        />
      )}

      {/* Select Purchase Invoice Modal for Editing */}
      {showSelectInvoiceModal && (
        <SelectPurchaseInvoiceModal
          isOpen={showSelectInvoiceModal}
          invoices={purchaseInvoices}
          onClose={() => setShowSelectInvoiceModal(false)}
          onSelectInvoice={(inv) => {
            startEditingInvoice(inv);
            setShowSelectInvoiceModal(false);
          }}
          onDeleteInvoice={handleDeleteInvoice}
        />
      )}

      {/* Total Discount Edit Modal */}
      <TotalDiscountEditModal
        isOpen={showTotalDiscountModal}
        onClose={() => setShowTotalDiscountModal(false)}
        subtotal={billSummary.subtotal}
        currentDiscount={billSummary.totalDiscount}
        onApplyDiscount={handleApplyPurchaseDiscount}
      />

      {/* Confirm, Complete & Save Purchase Entry Modal */}
      {showConfirmModal && (
        <ConfirmPurchaseEntryModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setDraftToConfirm(null);
          }}
          invoiceData={confirmModalInvoiceData}
          onSaveAsDraft={handleSaveDraftFromModal}
          onConfirmAndComplete={handleConfirmAndCompletePurchase}
          isUpdatingExisting={!draftToConfirm && !!editingInvoiceId}
        />
      )}

      {/* Supplier Payment Settlement Modal */}
      {payingInvoiceForModal && (
        <SupplierPaymentModal
          isOpen={Boolean(payingInvoiceForModal)}
          invoice={payingInvoiceForModal}
          defaultPaymentType={payingTypeForModal}
          onClose={() => setPayingInvoiceForModal(null)}
          onPaymentSuccess={(updated) => {
            reloadData();
            setSuccessBanner(
              `Payment recorded for Invoice #${updated.invoiceNo} (${updated.distributorName})! Remaining balance: ₹${(updated.balanceAmount || 0).toFixed(2)}.`
            );
            setTimeout(() => setSuccessBanner(null), 6000);
          }}
        />
      )}
    </div>
  );
};
