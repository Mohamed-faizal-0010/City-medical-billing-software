import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Phone,
  PhoneCall,
  MessageSquare,
  MapPin,
  Compass,
  Navigation,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  AlertCircle,
  FileText,
  Upload,
  Camera,
  ExternalLink,
  Store,
  CreditCard,
  QrCode,
  ArrowRight,
  Filter,
  X,
  Printer,
  ChevronRight,
  AlertTriangle,
  Send,
  HelpCircle,
  Package,
  UserCheck,
  Eye,
  Download
} from 'lucide-react';
import {
  Medicine,
  CustomerOnlineOrder,
  CustomerOnlineOrderItem,
  CustomerLocation,
  OnlineOrderStatus,
  OnlinePaymentMethod,
  OnlinePaymentStatus,
  CustomerServiceInquiry
} from '../types';
import { StorageService } from '../services/storage';
import { CustomerLocationPicker } from '../components/CustomerLocationPicker';
import { CustomerOnlinePaymentModal } from '../components/CustomerOnlinePaymentModal';
import { CustomerServiceHubModal } from '../components/CustomerServiceHubModal';

const HELPLINE_NUMBER = '8438678498';

interface CustomerOrderPortalViewProps {
  medicines: Medicine[];
  onNavigateToPOS?: (prefilledItems?: any[]) => void;
  onRefreshData?: () => void;
}

export const CustomerOrderPortalView: React.FC<CustomerOrderPortalViewProps> = ({
  medicines,
  onNavigateToPOS,
  onRefreshData
}) => {
  // Mode: 'store' (Customer Shopping) vs 'dispatcher' (Pharmacy Staff Order Management)
  const [activePortalMode, setActivePortalMode] = useState<'store' | 'dispatcher'>('store');
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'tracking' | 'support'>('catalog');

  // Orders State
  const [orders, setOrders] = useState<CustomerOnlineOrder[]>(() => StorageService.getCustomerOnlineOrders());
  const [inquiries, setInquiries] = useState<CustomerServiceInquiry[]>(() => StorageService.getCustomerServiceInquiries());

  // Customer Catalog Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Customer Cart State
  const [cart, setCart] = useState<CustomerOnlineOrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customer Location & Checkout Details
  const [customerName, setCustomerName] = useState('Ramesh Kumar');
  const [customerPhone, setCustomerPhone] = useState('9842188442');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryType, setDeliveryType] = useState<'home_delivery' | 'store_pickup'>('home_delivery');
  const [customerLocation, setCustomerLocation] = useState<CustomerLocation>({
    addressLine: '18, Bazaar Street, Near Bus Stand',
    locality: 'Melur Town',
    city: 'Melur',
    taluk: 'Melur Taluk',
    district: 'Madurai District',
    pincode: '625103',
    distanceKm: 0.8,
    isGpsDetected: false
  });

  // Prescription Upload state
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string | null>(null);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string>('');
  const [trackingOrderId, setTrackingOrderId] = useState<string>('');
  const [orderConfirmedModal, setOrderConfirmedModal] = useState<CustomerOnlineOrder | null>(null);
  const [receiptPreviewModal, setReceiptPreviewModal] = useState<{
    url: string;
    title: string;
    type: 'receipt' | 'prescription';
  } | null>(null);

  // Dispatcher filters
  const [dispatcherStatusFilter, setDispatcherStatusFilter] = useState<string>('all');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<CustomerOnlineOrder | null>(null);

  // Reload orders when storage changes
  const reloadOrders = () => {
    setOrders(StorageService.getCustomerOnlineOrders());
    setInquiries(StorageService.getCustomerServiceInquiries());
    if (onRefreshData) onRefreshData();
  };

  // Filter medicines for catalog
  const filteredMedicines = useMemo(() => {
    return medicines.filter(med => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        med.name.toLowerCase().includes(q) ||
        (med.genericName && med.genericName.toLowerCase().includes(q)) ||
        med.category.toLowerCase().includes(q) ||
        (med.indications && med.indications.some(ind => ind.toLowerCase().includes(q)));

      const matchesCategory =
        selectedCategory === 'all' ||
        med.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        (med.form && med.form.toLowerCase() === selectedCategory.toLowerCase());

      return matchesQuery && matchesCategory;
    });
  }, [medicines, searchQuery, selectedCategory]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const deliveryFee = useMemo(() => {
    if (deliveryType === 'store_pickup') return 0;
    if (cartSubtotal >= 199 || cartSubtotal === 0) return 0; // Free delivery over ₹199
    return 25.00;
  }, [cartSubtotal, deliveryType]);

  const discount = useMemo(() => {
    // 5% online discount on cart total
    return Math.round(cartSubtotal * 0.05);
  }, [cartSubtotal]);

  const grandTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - discount + deliveryFee);
  }, [cartSubtotal, discount, deliveryFee]);

  const cartHasRxItems = useMemo(() => {
    return cart.some(item => item.requiresPrescription);
  }, [cart]);

  // Cart Handlers
  const handleAddToCart = (medicine: Medicine) => {
    setCart(prev => {
      const existing = prev.find(item => item.medicineId === medicine.id);
      if (existing) {
        return prev.map(item =>
          item.medicineId === medicine.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        );
      } else {
        const defaultBatch = medicine.batches?.[0];
        const price = defaultBatch?.sellingPrice || 50;
        const requiresRx =
          medicine.scheduleType === 'H' ||
          medicine.scheduleType === 'H1' ||
          medicine.scheduleType === 'X' ||
          medicine.prescriptionRequired;

        return [
          ...prev,
          {
            medicineId: medicine.id,
            medicineName: medicine.name,
            genericName: medicine.genericName,
            quantity: 1,
            unitPrice: price,
            total: price,
            pack: medicine.pack || '1 Strip',
            dosageForm: medicine.form,
            requiresPrescription: !!requiresRx
          }
        ];
      }
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (medicineId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.medicineId === medicineId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              total: newQty * item.unitPrice
            };
          }
          return item;
        })
        .filter(Boolean) as CustomerOnlineOrderItem[];
    });
  };

  const handleRemoveFromCart = (medicineId: string) => {
    setCart(prev => prev.filter(item => item.medicineId !== medicineId));
  };

  // Prescription File Handlers
  const handlePrescriptionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPrescriptionFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrescriptionPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Proceed to Checkout / Online Payment
  const handleInitiateOrder = () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Add medicines to continue.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || customerPhone.length < 10) {
      alert('Please enter your name and a valid 10-digit mobile number for order verification.');
      return;
    }
    if (deliveryType === 'home_delivery' && !customerLocation.addressLine.trim()) {
      alert('Please provide your delivery address or click "Use My Current Location".');
      return;
    }

    const newId = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setPendingOrderId(newId);
    setShowPaymentModal(true);
  };

  // Finalize Order with Payment
  const handlePaymentComplete = (
    method: OnlinePaymentMethod,
    status: OnlinePaymentStatus,
    upiRef?: string,
    paymentReceiptUrl?: string,
    paymentReceiptFileName?: string
  ) => {
    const newOrder: CustomerOnlineOrder = {
      id: pendingOrderId || `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      orderDate: new Date().toISOString(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      deliveryType,
      deliveryAddress:
        deliveryType === 'home_delivery'
          ? customerLocation
          : {
              addressLine: 'City Medical Store Counter, Chokkalingapuram, Melur',
              locality: 'Melur Town',
              city: 'Melur',
              pincode: '625103',
              distanceKm: 0
            },
      items: [...cart],
      prescriptionUrl: prescriptionPreview || undefined,
      prescriptionFileName: prescriptionFile?.name || undefined,
      prescriptionRequired: cartHasRxItems,
      prescriptionVerified: !cartHasRxItems,
      subtotal: cartSubtotal,
      deliveryFee,
      discount,
      grandTotal,
      paymentMethod: method,
      paymentStatus: status,
      upiReference: upiRef,
      paymentReceiptUrl,
      paymentReceiptFileName,
      orderStatus: 'Placed',
      estimatedDeliveryTime:
        deliveryType === 'home_delivery'
          ? customerLocation.distanceKm && customerLocation.distanceKm <= 3
            ? '30 - 45 mins'
            : '45 - 60 mins'
          : 'Ready in 15 mins for Counter Pickup',
      notes: `${method} payment ${status}. Delivery to ${customerLocation.locality || 'Melur'}.`
    };

    StorageService.addCustomerOnlineOrder(newOrder);
    reloadOrders();

    setShowPaymentModal(false);
    setCart([]);
    setIsCartOpen(false);
    setOrderConfirmedModal(newOrder);
  };

  // Dispatcher Actions
  const handleUpdateOrderStatus = (orderId: string, newStatus: OnlineOrderStatus) => {
    StorageService.updateCustomerOnlineOrderStatus(orderId, newStatus);
    reloadOrders();
  };

  // Convert Online Order directly to POS Transaction
  const handleConvertOrderToPOS = (order: CustomerOnlineOrder) => {
    if (onNavigateToPOS) {
      onNavigateToPOS(order.items);
    } else {
      alert(`Order ${order.id} transferred. Switch to POS Billing tab.`);
    }
  };

  const whatsappUrl = `https://wa.me/91${HELPLINE_NUMBER}?text=${encodeURIComponent(
    'Hello City Medical Pharmacist, I have an inquiry about my online medicine order.'
  )}`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="customer-online-order-portal">
      {/* Top Emergency & Support Announcement Bar */}
      <header className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 text-white px-4 py-2.5 shadow-md border-b border-emerald-700/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Brand & Store Location */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                City Medical
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded text-[11px] font-semibold">
                Online Order Portal
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-slate-300 text-[11px] border-l border-white/20 pl-3">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chokkalingapuram, Melur, Madurai - 625103</span>
            </div>
          </div>

          {/* Customer Service & Contact Number */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            {/* Direct Helpline */}
            <a
              href={`tel:${HELPLINE_NUMBER}`}
              className="flex items-center gap-1.5 bg-emerald-700/60 hover:bg-emerald-600 border border-emerald-500/50 px-2.5 py-1 rounded-lg text-white font-bold text-xs transition-colors shadow-xs"
              title="Click to Call Helpline"
              id="header-call-helpline-btn"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">24/7 Helpline:</span>
              <span className="font-mono text-emerald-200">+91 {HELPLINE_NUMBER}</span>
            </a>

            {/* Direct WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-2.5 py-1 rounded-lg font-bold text-xs transition-colors shadow-xs"
              id="header-whatsapp-btn"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            {/* Customer Service Hub Modal Trigger */}
            <button
              onClick={() => setShowSupportModal(true)}
              className="flex items-center gap-1 text-emerald-300 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors font-medium text-xs cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Customer Service</span>
            </button>

            {/* View Switcher: Customer Portal vs Pharmacist Dispatcher */}
            <div className="flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-white/20">
              <button
                onClick={() => setActivePortalMode('store')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  activePortalMode === 'store'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Customer Store
              </button>
              <button
                onClick={() => setActivePortalMode('dispatcher')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activePortalMode === 'dispatcher'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>Dispatch Desk</span>
                {orders.filter(o => o.orderStatus === 'Placed').length > 0 && (
                  <span className="w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-black">
                    {orders.filter(o => o.orderStatus === 'Placed').length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. CUSTOMER STORE VIEW */}
      {/* ========================================================================= */}
      {activePortalMode === 'store' && (
        <div className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-5 lg:p-6 space-y-6">
          {/* Hero Banner & Value Props */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-2xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 bg-emerald-950/40 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold text-emerald-200 border border-emerald-400/30">
                <Truck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Express 30-45 Mins Local Delivery in Melur & Nearby Villages</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
                Order Medicines Online with Instant Doorstep Delivery
              </h1>

              <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                100% Genuine Medicines, Cold-Chain Insulin Storage, Schedule Drug compliance with digital doctor prescription verification, and instant dynamic UPI payment.
              </p>

              {/* Badges / Key highlights */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-lg backdrop-blur-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Verified Pharmacy (Reg: TN-58291-A)</span>
                </span>
                <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-lg backdrop-blur-xs">
                  <QrCode className="w-4 h-4 text-teal-300" />
                  <span>Dynamic UPI & COD Options</span>
                </span>
                <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-lg backdrop-blur-xs">
                  <Navigation className="w-4 h-4 text-amber-300" />
                  <span>GPS Location Delivery Tracking</span>
                </span>
              </div>
            </div>

            {/* Quick Upload Rx Card on the right */}
            <div className="mt-5 sm:mt-0 sm:absolute sm:right-6 sm:top-6 sm:bottom-6 sm:w-80 bg-white text-slate-900 rounded-xl p-4 shadow-xl flex flex-col justify-between border border-emerald-100">
              <div>
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Have a Doctor's Prescription?</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Upload prescription photo. Our pharmacist will verify, pack, and deliver.
                </p>

                <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 rounded-lg p-3 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-all">
                  <Upload className="w-6 h-6 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-800">
                    {prescriptionFile ? prescriptionFile.name : 'Upload Prescription (Camera / Photo)'}
                  </span>
                  <span className="text-[10px] text-slate-500">JPG, PNG, PDF up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handlePrescriptionUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {prescriptionPreview && (
                <div className="mt-2 text-xs text-emerald-700 flex items-center justify-between bg-emerald-100/60 p-2 rounded">
                  <span className="truncate max-w-[180px] font-semibold">Rx Attached</span>
                  <button
                    onClick={() => {
                      setPrescriptionFile(null);
                      setPrescriptionPreview(null);
                    }}
                    className="text-red-600 hover:text-red-800 font-bold"
                  >
                    Remove
                  </button>
                </div>
              )}

              <button
                onClick={() => setIsCartOpen(true)}
                className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Proceed to Order Rx Medicines</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('catalog')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeSubTab === 'catalog'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Browse Medicines ({filteredMedicines.length})
              </button>

              <button
                onClick={() => setActiveSubTab('tracking')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSubTab === 'tracking'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Track My Orders</span>
                {orders.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    {orders.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowSupportModal(true)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-200/70 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <span>Customer Service</span>
              </button>
            </div>

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer relative"
              id="customer-view-cart-btn"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})</span>
              {cartSubtotal > 0 && (
                <span className="ml-1 pl-2 border-l border-emerald-400 font-mono">
                  ₹{cartSubtotal.toFixed(0)}
                </span>
              )}
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: MEDICINE CATALOG */}
          {/* ========================================================================= */}
          {activeSubTab === 'catalog' && (
            <div className="space-y-5">
              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search medicines by brand name, generic composition, symptoms (e.g. Paracetamol, Metformin, Fever, BP)..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category quick selectors */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {[
                    { id: 'all', label: 'All Items' },
                    { id: 'tablet', label: 'Tablets & Capsules' },
                    { id: 'syrup', label: 'Syrups' },
                    { id: 'injection', label: 'Injections' },
                    { id: 'drops', label: 'Eye/Ear Drops' },
                    { id: 'device', label: 'Devices / OTC' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medicine Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMedicines.map(med => {
                  const batch = med.batches?.[0];
                  const price = batch?.sellingPrice || 50;
                  const mrp = batch?.mrp || price * 1.15;
                  const inStock = (batch?.stock || 0) > 0;
                  const requiresRx =
                    med.scheduleType === 'H' ||
                    med.scheduleType === 'H1' ||
                    med.scheduleType === 'X' ||
                    med.prescriptionRequired;

                  const cartItem = cart.find(i => i.medicineId === med.id);

                  return (
                    <div
                      key={med.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Badges */}
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {med.form}
                          </span>
                          {requiresRx ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <span>Rx Required</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              OTC
                            </span>
                          )}
                        </div>

                        {/* Medicine Name & Generic */}
                        <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-emerald-700 transition-colors">
                          {med.name}
                        </h3>
                        <p className="text-xs text-slate-500 italic mt-0.5 line-clamp-1">
                          {med.genericName || med.category}
                        </p>

                        <div className="mt-2 text-xs text-slate-600 flex items-center gap-2">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                            Pack: {med.pack || '1 Strip'}
                          </span>
                          {inStock ? (
                            <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Stock
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold text-[11px]">
                              Call for Stock
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pricing & Add to Cart */}
                      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-slate-900 font-mono">
                              ₹{price.toFixed(2)}
                            </span>
                            {mrp > price && (
                              <span className="text-xs text-slate-400 line-through font-mono">
                                ₹{mrp.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {mrp > price && (
                            <span className="text-[10px] font-bold text-emerald-700">
                              {Math.round(((mrp - price) / mrp) * 100)}% OFF
                            </span>
                          )}
                        </div>

                        {cartItem ? (
                          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-xl p-1">
                            <button
                              onClick={() => handleUpdateCartQty(med.id, -1)}
                              className="w-7 h-7 rounded-lg bg-white text-emerald-800 hover:bg-emerald-100 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-black text-emerald-950 font-mono">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateCartQty(med.id, 1)}
                              className="w-7 h-7 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(med)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: LIVE ORDER TRACKING */}
          {/* ========================================================================= */}
          {activeSubTab === 'tracking' && (
            <div className="space-y-5">
              {/* Order Search Filter */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={trackingOrderId}
                    onChange={e => setTrackingOrderId(e.target.value)}
                    placeholder="Enter Order ID (e.g. ORD-2026-8910) or your 10-digit Phone number..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <button
                  onClick={() => setTrackingOrderId('')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Show All Orders
                </button>
              </div>

              {/* Orders List */}
              <div className="space-y-4">
                {orders
                  .filter(o => {
                    if (!trackingOrderId.trim()) return true;
                    const q = trackingOrderId.toLowerCase();
                    return o.id.toLowerCase().includes(q) || o.customerPhone.includes(q);
                  })
                  .map(order => {
                    const statusSteps: OnlineOrderStatus[] = [
                      'Placed',
                      'Prescription Verified',
                      'Packed',
                      'Out for Delivery',
                      'Delivered'
                    ];
                    const currentStepIdx = statusSteps.indexOf(order.orderStatus);

                    return (
                      <div
                        key={order.id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4"
                      >
                        {/* Order Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-slate-900 text-base">
                                #{order.id}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                                  order.orderStatus === 'Delivered'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : order.orderStatus === 'Out for Delivery'
                                    ? 'bg-blue-100 text-blue-800 animate-pulse'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {order.orderStatus}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">
                              Placed on {new Date(order.orderDate).toLocaleString()} • Customer: {order.customerName} (+91 {order.customerPhone})
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-slate-500 block">Total Amount</span>
                            <span className="text-lg font-black text-slate-900 font-mono">
                              ₹{order.grandTotal.toFixed(2)}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-700 block">
                              {order.paymentMethod} • {order.paymentStatus}
                            </span>
                          </div>
                        </div>

                        {/* Visual 5-Step Status Progress Tracker */}
                        <div className="py-2">
                          <div className="grid grid-cols-5 gap-2 text-center">
                            {statusSteps.map((step, idx) => {
                              const isPassed = idx <= currentStepIdx;
                              const isCurrent = idx === currentStepIdx;

                              return (
                                <div key={step} className="space-y-1">
                                  <div
                                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                      isPassed
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                                    } ${isCurrent ? 'ring-4 ring-emerald-200' : ''}`}
                                  >
                                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                  </div>
                                  <span
                                    className={`text-[11px] font-bold block leading-tight ${
                                      isCurrent
                                        ? 'text-emerald-800'
                                        : isPassed
                                        ? 'text-slate-800'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {step}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Location and Delivery Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl text-xs text-slate-700">
                          <div>
                            <span className="font-bold text-slate-900 block mb-1 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Delivery Address & Location</span>
                            </span>
                            <p className="text-slate-800">{order.deliveryAddress.addressLine}</p>
                            <p className="text-slate-600">
                              {order.deliveryAddress.locality}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
                            </p>
                            {order.deliveryAddress.distanceKm !== undefined && (
                              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded mt-1 inline-block">
                                Distance: ~{order.deliveryAddress.distanceKm} km from Melur Pharmacy
                              </span>
                            )}
                          </div>

                          <div>
                            <span className="font-bold text-slate-900 block mb-1 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Estimated Delivery ETA</span>
                            </span>
                            <p className="text-emerald-800 font-bold">
                              {order.estimatedDeliveryTime || '30 - 45 mins Express Delivery'}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <a
                                href={`tel:${HELPLINE_NUMBER}`}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                <span>Call Pharmacist</span>
                              </a>
                              <a
                                href={`https://wa.me/91${HELPLINE_NUMBER}?text=${encodeURIComponent(
                                  `Hi, checking status of my Order #${order.id}`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-teal-600 text-white rounded text-[11px] font-bold flex items-center gap-1"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>WhatsApp Rider</span>
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Items ordered */}
                        <div className="border-t border-slate-100 pt-2 text-xs">
                          <span className="font-bold text-slate-800 block mb-1">
                            Items in this package:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {order.items.map(item => (
                              <span
                                key={item.medicineId}
                                className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800 font-medium"
                              >
                                {item.medicineName} × {item.quantity} ({item.pack || 'strip'}) • ₹{item.total.toFixed(2)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SLIDE-OUT CART & CHECKOUT DRAWER */}
          {/* ========================================================================= */}
          {isCartOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
              <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden border-l border-slate-200">
                {/* Drawer Header */}
                <div className="p-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-emerald-300" />
                    <div>
                      <h3 className="font-black text-base text-white">Your Medicine Cart</h3>
                      <span className="text-xs text-emerald-200">
                        {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="p-5 overflow-y-auto flex-1 space-y-5">
                  {cart.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-700">Your cart is empty</h4>
                      <p className="text-xs text-slate-500">
                        Browse medicines and tap "Add" to start your order.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Cart Items List */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                          Review Items
                        </span>
                        {cart.map(item => (
                          <div
                            key={item.medicineId}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {item.medicineName}
                              </h4>
                              <p className="text-[11px] text-slate-500 truncate">
                                {item.genericName || item.pack}
                              </p>
                              <span className="text-xs font-black text-slate-900 font-mono">
                                ₹{item.unitPrice.toFixed(2)} each
                              </span>
                            </div>

                            {/* Qty controls */}
                            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg p-1">
                              <button
                                onClick={() => handleUpdateCartQty(item.medicineId, -1)}
                                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center text-xs font-bold font-mono">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateCartQty(item.medicineId, 1)}
                                className="w-6 h-6 rounded bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center font-bold text-xs"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => handleRemoveFromCart(item.medicineId)}
                              className="text-slate-400 hover:text-red-600 p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Rx Warning if prescription drugs present */}
                      {cartHasRxItems && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                          <div className="flex items-center gap-2 font-bold">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Prescription Required for Schedule H items</span>
                          </div>
                          <p className="text-[11px] text-amber-800">
                            Your cart contains regulated prescription medicines. Please ensure your prescription is uploaded or keep it ready for our pharmacist's verification.
                          </p>
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-amber-700">
                            <Camera className="w-3.5 h-3.5" />
                            <span>{prescriptionFile ? 'Change Prescription' : 'Upload Doctor Prescription'}</span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={handlePrescriptionUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}

                      {/* Delivery Mode Toggle */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                          Select Delivery Mode
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setDeliveryType('home_delivery')}
                            className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                              deliveryType === 'home_delivery'
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                                : 'border-slate-200 bg-white text-slate-600'
                            }`}
                          >
                            <Truck className="w-4 h-4 text-emerald-600" />
                            <div>
                              <span className="text-xs font-bold block">Home Delivery</span>
                              <span className="text-[10px] text-slate-500">30-45 mins</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeliveryType('store_pickup')}
                            className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                              deliveryType === 'store_pickup'
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                                : 'border-slate-200 bg-white text-slate-600'
                            }`}
                          >
                            <Store className="w-4 h-4 text-teal-600" />
                            <div>
                              <span className="text-xs font-bold block">Store Pickup</span>
                              <span className="text-[10px] text-slate-500">Free at Counter</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Customer Details & Contact Number */}
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                          Customer Contact Details
                        </span>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Your Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={customerName}
                              onChange={e => setCustomerName(e.target.value)}
                              placeholder="Full Name"
                              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Contact Number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="tel"
                                maxLength={10}
                                value={customerPhone}
                                onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                                placeholder="98421 XXXXX"
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customer Location Picker (GPS Geolocation & Address) */}
                      {deliveryType === 'home_delivery' && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider mb-2">
                            Delivery Address & Location
                          </span>
                          <CustomerLocationPicker
                            location={customerLocation}
                            onChange={setCustomerLocation}
                          />
                        </div>
                      )}

                      {/* Price Breakdown */}
                      <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Items Subtotal</span>
                          <span className="font-mono">₹{cartSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700">
                          <span>Special Online Discount (5%)</span>
                          <span className="font-mono">-₹{discount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Delivery Fee {cartSubtotal >= 199 && <span className="text-emerald-600 font-bold">(FREE on ₹199+)</span>}</span>
                          <span className="font-mono">
                            {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                          <span>Grand Total Payable</span>
                          <span className="font-mono text-base text-emerald-700">
                            ₹{grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Drawer Footer Actions */}
                {cart.length > 0 && (
                  <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2">
                    <button
                      onClick={handleInitiateOrder}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      id="proceed-payment-btn"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Proceed to Online Payment (₹{grandTotal.toFixed(2)})</span>
                    </button>
                    <p className="text-[11px] text-center text-slate-500">
                      Supports Dynamic UPI, Cards, Net Banking & Cash on Delivery
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PHARMACIST DISPATCHER & ORDER MANAGEMENT VIEW */}
      {/* ========================================================================= */}
      {activePortalMode === 'dispatcher' && (
        <div className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-5 lg:p-6 space-y-6">
          {/* Dispatcher Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                Pharmacy Operations
              </span>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>Online Order Dispatcher & Prescription Verification</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {orders.length} Active Orders
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Verify customer prescriptions, coordinate local delivery riders, and convert online orders to POS Tax Invoices with 1 click.
              </p>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
              {[
                { id: 'all', label: 'All Orders' },
                { id: 'Placed', label: 'New Placed' },
                { id: 'Prescription Verified', label: 'Rx Verified' },
                { id: 'Packed', label: 'Packed' },
                { id: 'Out for Delivery', label: 'Out for Delivery' },
                { id: 'Delivered', label: 'Delivered' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDispatcherStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    dispatcherStatusFilter === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Orders Feed */}
            <div className="lg:col-span-2 space-y-4">
              {orders
                .filter(o => dispatcherStatusFilter === 'all' || o.orderStatus === dispatcherStatusFilter)
                .map(order => (
                  <div
                    key={order.id}
                    className={`bg-white border rounded-2xl p-4 shadow-xs transition-all space-y-3 cursor-pointer ${
                      selectedOrderForDetail?.id === order.id
                        ? 'border-emerald-500 ring-2 ring-emerald-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedOrderForDetail(order)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          #{order.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            order.orderStatus === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.orderStatus === 'Out for Delivery'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <span className="text-sm font-black text-emerald-700 font-mono">
                        ₹{order.grandTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Customer & Location */}
                    <div className="text-xs space-y-1 text-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {order.customerName}
                        </span>
                        <span className="font-mono font-bold text-slate-800">
                          +91 {order.customerPhone}
                        </span>
                      </div>
                      <div className="flex items-start gap-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">
                          {order.deliveryAddress.addressLine}, {order.deliveryAddress.locality}
                          {order.deliveryAddress.distanceKm !== undefined && (
                            <strong className="text-emerald-800 font-semibold ml-1">
                              (~{order.deliveryAddress.distanceKm} km)
                            </strong>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Items count & Payment Tag */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">
                        {order.items.length} medicines • {order.deliveryType === 'home_delivery' ? 'Home Delivery' : 'Counter Pickup'}
                      </span>
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {order.paymentMethod} ({order.paymentStatus})
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Selected Order Actions Drawer / Side Column */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 h-fit sticky top-20">
              {selectedOrderForDetail ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Order Details
                      </span>
                      <h3 className="font-black text-slate-900 text-base font-mono">
                        #{selectedOrderForDetail.id}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {selectedOrderForDetail.orderStatus}
                    </span>
                  </div>

                  {/* Customer Direct Contacts */}
                  <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-2">
                    <span className="font-bold text-slate-800 block">Customer Information</span>
                    <p className="font-bold text-slate-900">{selectedOrderForDetail.customerName}</p>
                    <p className="font-mono text-slate-700">+91 {selectedOrderForDetail.customerPhone}</p>
                    <div className="flex gap-2 pt-1">
                      <a
                        href={`tel:${selectedOrderForDetail.customerPhone}`}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Customer</span>
                      </a>
                      <a
                        href={`https://wa.me/91${selectedOrderForDetail.customerPhone}?text=${encodeURIComponent(
                          `Hello ${selectedOrderForDetail.customerName}, City Medical Pharmacy here regarding your online order #${selectedOrderForDetail.id}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Customer Location */}
                  <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
                    <span className="font-bold text-slate-800 block flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Customer Location & Address</span>
                    </span>
                    <p className="text-slate-900">{selectedOrderForDetail.deliveryAddress.addressLine}</p>
                    <p className="text-slate-600">
                      {selectedOrderForDetail.deliveryAddress.locality}, {selectedOrderForDetail.deliveryAddress.city} - {selectedOrderForDetail.deliveryAddress.pincode}
                    </p>
                    {selectedOrderForDetail.deliveryAddress.landmark && (
                      <p className="text-slate-500 italic">
                        Landmark: {selectedOrderForDetail.deliveryAddress.landmark}
                      </p>
                    )}
                    {selectedOrderForDetail.deliveryAddress.distanceKm !== undefined && (
                      <p className="text-emerald-800 font-bold pt-1">
                        Distance from Store: ~{selectedOrderForDetail.deliveryAddress.distanceKm} km
                      </p>
                    )}
                  </div>

                  {/* UPI Payment Verification Card */}
                  {selectedOrderForDetail.paymentMethod === 'UPI' && (
                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                          <span>UPI Payment Verification</span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            selectedOrderForDetail.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {selectedOrderForDetail.paymentStatus === 'Paid' ? 'Verified / Paid' : 'Payment Pending Check'}
                        </span>
                      </div>

                      {selectedOrderForDetail.upiReference && (
                        <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-emerald-100">
                          <span className="text-slate-500 font-medium">Customer UTR / Ref:</span>
                          <span className="font-mono font-bold text-slate-900">{selectedOrderForDetail.upiReference}</span>
                        </div>
                      )}

                      {selectedOrderForDetail.paymentReceiptUrl ? (
                        <div className="space-y-1.5 pt-0.5">
                          <span className="text-[11px] font-bold text-slate-700 block">
                            Customer Attached Payment Proof:
                          </span>
                          <div className="p-2 bg-white rounded-xl border border-emerald-200 flex items-center justify-between gap-2 shadow-xs">
                            <div
                              onClick={() =>
                                setReceiptPreviewModal({
                                  url: selectedOrderForDetail.paymentReceiptUrl!,
                                  title: `Payment Receipt - Order #${selectedOrderForDetail.id}`,
                                  type: 'receipt'
                                })
                              }
                              className="flex items-center gap-2 cursor-pointer overflow-hidden flex-1"
                            >
                              <img
                                src={selectedOrderForDetail.paymentReceiptUrl}
                                alt="Payment proof"
                                className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                              />
                              <div className="overflow-hidden">
                                <span className="text-xs font-bold text-slate-800 block truncate">
                                  {selectedOrderForDetail.paymentReceiptFileName || 'Payment Screenshot.png'}
                                </span>
                                <span className="text-[10px] text-emerald-700 font-semibold block">
                                  Click to view full screenshot
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setReceiptPreviewModal({
                                  url: selectedOrderForDetail.paymentReceiptUrl!,
                                  title: `Payment Receipt - Order #${selectedOrderForDetail.id}`,
                                  type: 'receipt'
                                })
                              }
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              <span>View</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic">
                          No screenshot uploaded by customer. Check merchant bank statement for UTR #{selectedOrderForDetail.upiReference || 'N/A'}.
                        </p>
                      )}

                      {selectedOrderForDetail.paymentStatus !== 'Paid' && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = StorageService.updateCustomerOnlineOrderPayment(
                              selectedOrderForDetail.id,
                              'Paid'
                            );
                            if (updated) {
                              setSelectedOrderForDetail(updated);
                              reloadOrders();
                            }
                          }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Mark Payment Received</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Doctor Prescription Verification Card */}
                  {selectedOrderForDetail.prescriptionUrl && (
                    <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Doctor's Prescription</span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            selectedOrderForDetail.prescriptionVerified
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {selectedOrderForDetail.prescriptionVerified ? 'Rx Verified' : 'Rx Pending'}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-blue-200 flex items-center justify-between gap-2">
                        <div
                          onClick={() =>
                            setReceiptPreviewModal({
                              url: selectedOrderForDetail.prescriptionUrl!,
                              title: `Prescription - Order #${selectedOrderForDetail.id}`,
                              type: 'prescription'
                            })
                          }
                          className="flex items-center gap-2 cursor-pointer overflow-hidden flex-1"
                        >
                          <img
                            src={selectedOrderForDetail.prescriptionUrl}
                            alt="Doctor Prescription"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                          />
                          <div className="overflow-hidden">
                            <span className="text-xs font-bold text-slate-800 block truncate">
                              {selectedOrderForDetail.prescriptionFileName || 'Prescription.png'}
                            </span>
                            <span className="text-[10px] text-blue-700 font-semibold block">
                              Click to view full image
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setReceiptPreviewModal({
                              url: selectedOrderForDetail.prescriptionUrl!,
                              title: `Prescription - Order #${selectedOrderForDetail.id}`,
                              type: 'prescription'
                            })
                          }
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status update controls */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                      Update Order Status
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {(['Prescription Verified', 'Packed', 'Out for Delivery', 'Delivered'] as OnlineOrderStatus[]).map(st => (
                        <button
                          key={st}
                          onClick={() => handleUpdateOrderStatus(selectedOrderForDetail.id, st)}
                          className={`px-2.5 py-1.5 rounded-lg border font-bold text-center cursor-pointer transition-all ${
                            selectedOrderForDetail.orderStatus === st
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 1-Click Convert to POS Invoice */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleConvertOrderToPOS(selectedOrderForDetail)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Convert to POS Tax Invoice</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Select an order from the list to view customer location, prescription, and dispatch actions.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Online Payment Modal */}
      {showPaymentModal && (
        <CustomerOnlinePaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderId={pendingOrderId}
          amount={grandTotal}
          customerName={customerName}
          customerPhone={customerPhone}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {/* Customer Service Hub Modal */}
      {showSupportModal && (
        <CustomerServiceHubModal
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
        />
      )}

      {/* Order Confirmed Modal */}
      {orderConfirmedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center space-y-4 border border-slate-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Order Successfully Placed!
              </span>
              <h3 className="text-xl font-black text-slate-900 font-mono mt-1">
                #{orderConfirmedModal.id}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Thank you, <strong>{orderConfirmedModal.customerName}</strong>. Our on-duty pharmacist Anusya Begum has received your order and is packing it for dispatch.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-left text-xs space-y-1.5 text-slate-700 border border-slate-200">
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="font-bold text-emerald-800">
                  {orderConfirmedModal.paymentMethod} ({orderConfirmedModal.paymentStatus})
                </span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-bold text-slate-900 font-mono">
                  ₹{orderConfirmedModal.grandTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Delivery ETA:</span>
                <span className="font-bold text-teal-800">
                  {orderConfirmedModal.estimatedDeliveryTime}
                </span>
              </div>
              <div className="pt-1 border-t border-slate-200 text-[11px] text-slate-500">
                📍 {orderConfirmedModal.deliveryAddress.addressLine}, {orderConfirmedModal.deliveryAddress.locality}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={`https://wa.me/91${HELPLINE_NUMBER}?text=${encodeURIComponent(
                  `Hi, I have placed Order #${orderConfirmedModal.id} at City Medical.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Updates</span>
              </a>

              <button
                onClick={() => {
                  setOrderConfirmedModal(null);
                  setActiveSubTab('tracking');
                  setTrackingOrderId(orderConfirmedModal.id);
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
              >
                Track Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Size Preview Modal for Receipt Proof or Prescription */}
      {receiptPreviewModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                {receiptPreviewModal.type === 'receipt' ? (
                  <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                )}
                <span className="font-bold text-xs truncate">
                  {receiptPreviewModal.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={receiptPreviewModal.url}
                  download={receiptPreviewModal.title.replace(/\s+/g, '_') + '.png'}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                  title="Download image"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setReceiptPreviewModal(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center min-h-[300px]">
              <img
                src={receiptPreviewModal.url}
                alt={receiptPreviewModal.title}
                className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-md bg-white border border-slate-300"
              />
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Verified against merchant settlement ledger
              </span>
              <button
                onClick={() => setReceiptPreviewModal(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
