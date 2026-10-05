import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';

// Views
import { POSView } from './views/POSView';
import { InventoryView } from './views/InventoryView';
import { GenericSubstitutionView } from './views/GenericSubstitutionView';
import { PurchasesView } from './views/PurchasesView';
import { PurchaseReturnsView } from './views/PurchaseReturnsView';
import { SalesReturnsView } from './views/SalesReturnsView';
import { SuppliersView } from './views/SuppliersView';
import { PatientsView } from './views/PatientsView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { ClinicPortalView } from './views/ClinicPortalView';
import { SecurityView } from './views/SecurityView';
import { ShortLinkSearchView } from './views/ShortLinkSearchView';
import { PlayStoreAppView } from './views/PlayStoreAppView';
import { StockReportView } from './components/StockReportView';
import { ScheduleDrugReportView } from './components/ScheduleDrugReportView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CustomerOrderPortalView } from './views/CustomerOrderPortalView';
import { SoftwareControllerView } from './views/SoftwareControllerView';
import { WholesaleHubView } from './components/WholesaleHubView';
import { BatchExpiryDashboard } from './components/BatchExpiryDashboard';
import { RetailDashboardView } from './components/RetailDashboardView';
import { WholesaleDashboardView } from './components/WholesaleDashboardView';
import { RetailPurchaseHubView } from './components/RetailPurchaseHubView';

// Models and Services
import { User, Medicine, Patient, Doctor, SaleTransaction, MedicineBatch, CartItem, ClinicConsultation, CustomerOnlineOrderItem } from './types';
import { INITIAL_USERS } from './mockData';
import { StorageService } from './services/storage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [isAuthLocked, setIsAuthLocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState<boolean>(false);

  // App Data State
  const [medicines, setMedicines] = useState<Medicine[]>(() => StorageService.getMedicines());
  const [patients, setPatients] = useState<Patient[]>(() => StorageService.getPatients());
  const [doctors, setDoctors] = useState<Doctor[]>(() => StorageService.getDoctors());
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // POS pre-loaded state from Clinic Consultation
  const [posInitialCart, setPosInitialCart] = useState<CartItem[]>([]);
  const [posInitialPatientId, setPosInitialPatientId] = useState<string>('');
  const [posInitialDoctorId, setPosInitialDoctorId] = useState<string>('');
  const [posConsultationId, setPosConsultationId] = useState<string>('');

  // Global keydown for ⌘K / Ctrl+K search and Alt+V / Ctrl+Shift+V for Voice Assistant
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      } else if ((e.altKey && (e.key === 'v' || e.key === 'V')) || ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'v' || e.key === 'V'))) {
        e.preventDefault();
        setIsVoiceAssistantOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync data whenever triggered
  const reloadData = useCallback(() => {
    setMedicines(StorageService.getMedicines());
    setPatients(StorageService.getPatients());
    setDoctors(StorageService.getDoctors());
    setCurrentUser(StorageService.getCurrentUser());
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // When a retail sale completes in POS
  const handleTransactionComplete = (tx: SaleTransaction) => {
    reloadData();
  };

  // Switch to Generics optimizer from POS
  const handleOpenGenericsFromPOS = (medicine: Medicine) => {
    setActiveTab('generics');
  };

  // Transfer Prescribed Medicines from Clinic Consultation directly to POS Cart
  const handleSendConsultationToPOS = (consultation: ClinicConsultation) => {
    const loadedCart: CartItem[] = [];

    consultation.prescriptions.forEach(rx => {
      // Find matching medicine in stock
      const med =
        medicines.find(m => m.id === rx.medicineId) ||
        medicines.find(m => m.name.toLowerCase().includes(rx.medicineName.toLowerCase()));

      if (med && Array.isArray(med.batches) && med.batches.length > 0) {
        // Pick first batch with stock > 0, or first batch
        const batch = med.batches.find(b => b.stock > 0) || med.batches[0];
        const qty = rx.quantity || 10;
        const unitPrice = batch.sellingPrice;
        const discountPercent = 0;
        const taxRate = med.taxRate || 12;
        const subtotal = unitPrice * qty;
        const taxAmount = (subtotal * taxRate) / 100;
        const total = subtotal + taxAmount;

        loadedCart.push({
          medicine: med,
          selectedBatch: batch,
          quantity: qty,
          discountPercent: 0
        });
      }
    });

    setPosInitialCart(loadedCart);
    setPosInitialPatientId(consultation.patientId);
    setPosInitialDoctorId(consultation.doctorId);
    setPosConsultationId(consultation.id);
    setActiveTab('pos');
  };

  // Dispense a generic alternative selected in Generics View directly in POS
  const handleDispenseGenericInPOS = (medicine: Medicine) => {
    if (medicine && Array.isArray(medicine.batches) && medicine.batches.length > 0) {
      const batch = medicine.batches.find(b => b.stock > 0) || medicine.batches[0];
      const qty = 1;
      setPosInitialCart(prev => [
        ...prev,
        {
          medicine,
          selectedBatch: batch,
          quantity: qty,
          discountPercent: 0
        }
      ]);
    }
    setActiveTab('pos');
  };

  // Select patient from Patients View and start sale in POS
  const handleSelectPatientForPOS = (patient: Patient) => {
    setPosInitialPatientId(patient.id);
    setActiveTab('pos');
  };

  // Convert online order items to POS cart items
  const handleConvertOnlineOrderToPOS = (onlineItems?: CustomerOnlineOrderItem[]) => {
    if (onlineItems && onlineItems.length > 0) {
      const convertedCartItems: CartItem[] = onlineItems.map(item => {
        const med = medicines.find(m => m.id === item.medicineId) || {
          id: item.medicineId,
          name: item.medicineName,
          genericName: item.genericName,
          category: 'Allopathy',
          dosageForm: item.dosageForm || 'Tablet',
          strength: '',
          manufacturer: 'Standard Pharma',
          hsnCode: '3004',
          scheduleType: item.requiresPrescription ? 'H' : 'OTC',
          prescriptionRequired: item.requiresPrescription,
          storageCondition: 'Normal',
          minStockAlert: 10,
          pack: item.pack || '1 Strip',
          batches: []
        };

        const batch = (med.batches && med.batches.find(b => b.stock > 0)) || med.batches?.[0] || {
          batchNumber: 'ORD-DISPATCH',
          expiryDate: '2027-12-31',
          manufacturingDate: '2025-01-01',
          stock: 100,
          costPrice: item.unitPrice * 0.7,
          sellingPrice: item.unitPrice,
          mrp: item.unitPrice * 1.15,
          location: 'Dispatch Counter'
        };

        return {
          medicine: med,
          selectedBatch: batch,
          quantity: item.quantity,
          discountPercent: 5,
          unitType: 'pack'
        };
      });
      setPosInitialCart(convertedCartItems);
    }
    setActiveTab('pos');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white pb-16 lg:pb-0">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onSelectUser={user => setCurrentUser(user)}
        onLogout={() => setIsAuthLocked(true)}
        medicines={medicines}
        patients={patients}
        onNavigateTab={tabId => setActiveTab(tabId)}
        onToggleMobileNav={() => setMobileNavOpen(prev => !prev)}
        onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
        onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex w-full max-w-[1920px] mx-auto min-w-0">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={tabId => setActiveTab(tabId)}
          mobileNavOpen={mobileNavOpen}
          onCloseMobileNav={() => setMobileNavOpen(false)}
        />

        {/* Dynamic Main Workspace View */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {activeTab === 'retail-dashboard' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <RetailDashboardView
                key={`ret-dash-${refreshTrigger}`}
                onNavigateToPOS={() => setActiveTab('pos')}
                onNavigateToPatients={() => setActiveTab('patients')}
                onNavigateToClinic={() => setActiveTab('clinic')}
                onNavigateToReports={() => setActiveTab('reports')}
                onNavigateToExpiry={() => setActiveTab('expiry-dashboard')}
                onNavigateToRetailPurchases={(tab) => {
                  if (tab === 'payment-pending') setActiveTab('retail-payment-pending');
                  else if (tab === 'payment-report') setActiveTab('retail-payment-report');
                  else if (tab === 'supplier-list') setActiveTab('retail-suppliers');
                }}
                onRefreshData={reloadData}
              />
            </div>
          )}

          {activeTab === 'retail-payment-pending' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <RetailPurchaseHubView
                key={`rph-pending-${refreshTrigger}`}
                initialTab="payment-pending"
                onRefreshData={reloadData}
                onNavigateToPurchases={() => setActiveTab('purchases')}
              />
            </div>
          )}

          {activeTab === 'retail-payment-report' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <RetailPurchaseHubView
                key={`rph-report-${refreshTrigger}`}
                initialTab="payment-report"
                onRefreshData={reloadData}
                onNavigateToPurchases={() => setActiveTab('purchases')}
              />
            </div>
          )}

          {(activeTab === 'retail-suppliers' || activeTab === 'retail-supplier-list') && (
            <div className="p-4 sm:p-6 lg:p-8">
              <RetailPurchaseHubView
                key={`rph-sup-${refreshTrigger}`}
                initialTab="supplier-list"
                onRefreshData={reloadData}
                onNavigateToPurchases={() => setActiveTab('purchases')}
              />
            </div>
          )}

          {activeTab === 'retail-purchases' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <RetailPurchaseHubView
                key={`rph-purch-${refreshTrigger}`}
                initialTab="all-purchases"
                onRefreshData={reloadData}
                onNavigateToPurchases={() => setActiveTab('purchases')}
              />
            </div>
          )}

          {activeTab === 'wholesale-dashboard' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <WholesaleDashboardView
                key={`whl-dash-${refreshTrigger}`}
                onNavigateToWholesalePOS={() => {
                  StorageService.setActivePOSMode('wholesale');
                  setActiveTab('wholesale-pos');
                }}
                onNavigateToWholesaleHub={tab => {
                  if (tab === 'payment-pending') setActiveTab('wholesale-pending');
                  else if (tab === 'sales-return') setActiveTab('wholesale-returns');
                  else setActiveTab('wholesale-hub');
                }}
                onNavigateToPurchases={() => setActiveTab('purchases')}
                onNavigateToExpiry={() => setActiveTab('expiry-dashboard')}
                onRefreshData={reloadData}
              />
            </div>
          )}

          {activeTab === 'expiry-dashboard' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <BatchExpiryDashboard
                key={`exp-dash-${refreshTrigger}`}
                medicines={medicines}
                onSelectForPOS={(med, batch) => {
                  setActiveTab('pos');
                }}
                onNavigateToPurchaseReturn={(med, batch) => {
                  setActiveTab('purchase-returns');
                }}
                onRefreshData={reloadData}
              />
            </div>
          )}

          {(activeTab === 'pos' || activeTab === 'wholesale-pos') && (
            <POSView
              key={`pos-${refreshTrigger}-${posConsultationId}-${activeTab}`}
              medicines={medicines}
              patients={patients}
              doctors={doctors}
              onTransactionComplete={handleTransactionComplete}
              onOpenGenericsModal={handleOpenGenericsFromPOS}
              initialPatientId={posInitialPatientId}
              initialDoctorId={posInitialDoctorId}
              initialCart={posInitialCart}
              consultationId={posConsultationId}
              currentUser={currentUser}
              onNavigateToPurchases={() => setActiveTab('purchases')}
              onNavigateToInventory={() => setActiveTab('inventory')}
              initialMode={activeTab === 'wholesale-pos' ? 'wholesale' : 'retail'}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              key={`inv-${refreshTrigger}`}
              onSelectForPOS={(med, batch) => {
                setActiveTab('pos');
              }}
              onNavigateToPurchases={() => setActiveTab('purchases')}
              onRefreshData={reloadData}
            />
          )}

          {activeTab === 'stock-report' && (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
              <StockReportView
                key={`stock-rep-${refreshTrigger}`}
                medicines={medicines}
                onSelectForPOS={() => {
                  setActiveTab('pos');
                }}
              />
            </div>
          )}

          {activeTab === 'purchase-report' && (
            <ReportsView
              key={`rep-po-direct-${refreshTrigger}`}
              initialSubTab="purchases"
              onRefreshData={reloadData}
            />
          )}

          {activeTab === 'generics' && (
            <GenericSubstitutionView
              key={`gen-${refreshTrigger}`}
              onSelectForPOS={handleDispenseGenericInPOS}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesView
              key={`po-${refreshTrigger}`}
              onRefreshData={reloadData}
            />
          )}

          {activeTab === 'purchase-returns' && (
            <PurchaseReturnsView
              key={`pr-${refreshTrigger}`}
              onRefreshData={reloadData}
            />
          )}

          {activeTab === 'sales-returns' && (
            <SalesReturnsView
              key={`sr-${refreshTrigger}`}
              onRefreshData={reloadData}
            />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersView
              key={`sup-${refreshTrigger}`}
              onRefreshData={reloadData}
            />
          )}

          {activeTab === 'clinic' && (
            <ClinicPortalView
              key={`clinic-${refreshTrigger}`}
              onSendToPOS={handleSendConsultationToPOS}
              onRefreshData={reloadData}
            />
          )}

          {activeTab === 'patients' && (
            <PatientsView
              key={`pat-${refreshTrigger}`}
              onSelectPatientForPOS={handleSelectPatientForPOS}
              onRefreshData={reloadData}
            />
          )}

          {activeTab === 'appointments' && (
            <ClinicPortalView
              key={`apt-${refreshTrigger}`}
              onSendToPOS={handleSendConsultationToPOS}
              onRefreshData={reloadData}
            />
          )}

          {activeTab === 'report-schedule' && (
            <ScheduleDrugReportView
              key={`rep-sched-${refreshTrigger}`}
              onNavigateToPOS={() => setActiveTab('pos')}
              onRefreshData={reloadData}
            />
          )}

          {activeTab === 'report-sales' && (
            <ReportsView
              key={`rep-sales-${refreshTrigger}`}
              initialSubTab="sales"
              onRefreshData={reloadData}
            />
          )}

          {activeTab === 'report-purchases' && (
            <ReportsView
              key={`rep-po-${refreshTrigger}`}
              initialSubTab="purchases"
              onRefreshData={reloadData}
            />
          )}

          {activeTab === 'report-profitability' && (
            <ReportsView
              key={`rep-prof-${refreshTrigger}`}
              initialSubTab="profitability"
              onRefreshData={reloadData}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              key={`rep-all-${refreshTrigger}`}
              initialSubTab="all"
              onRefreshData={reloadData}
            />
          )}

          {activeTab === 'short-links' && (
            <div className="p-6">
              <ShortLinkSearchView
                onNavigateToPOS={() => setActiveTab('pos')}
              />
            </div>
          )}

          {activeTab === 'playstore-app' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <PlayStoreAppView
                onNavigateTab={setActiveTab}
              />
            </div>
          )}

          {activeTab === 'software-controller' && (
            <SoftwareControllerView
              key={`ctrl-${refreshTrigger}`}
              onRefreshData={reloadData}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'wholesale-hub' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <WholesaleHubView
                key={`whub-${refreshTrigger}`}
                initialTab="sales-report"
                onNavigateToPurchases={() => setActiveTab('purchases')}
                onRefreshData={reloadData}
              />
            </div>
          )}

          {activeTab === 'wholesale-pending' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <WholesaleHubView
                key={`wpending-${refreshTrigger}`}
                initialTab="payment-pending"
                onNavigateToPurchases={() => setActiveTab('purchases')}
                onRefreshData={reloadData}
              />
            </div>
          )}

          {activeTab === 'wholesale-returns' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <WholesaleHubView
                key={`wret-${refreshTrigger}`}
                initialTab="sales-return"
                onNavigateToPurchases={() => setActiveTab('purchases')}
                onRefreshData={reloadData}
              />
            </div>
          )}

          {activeTab === 'wholesale-purchases' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <WholesaleHubView
                key={`wpurch-${refreshTrigger}`}
                initialTab="purchase-entry"
                onNavigateToPurchases={() => setActiveTab('purchases')}
                onRefreshData={reloadData}
              />
            </div>
          )}

          {activeTab === 'wholesale-purchase-returns' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <WholesaleHubView
                key={`wpret-${refreshTrigger}`}
                initialTab="purchase-return"
                onNavigateToPurchases={() => setActiveTab('purchases')}
                onRefreshData={reloadData}
              />
            </div>
          )}

          {activeTab === 'wholesale-purchase-report' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <WholesaleHubView
                key={`wprep-${refreshTrigger}`}
                initialTab="purchase-report"
                onNavigateToPurchases={() => setActiveTab('purchases')}
                onRefreshData={reloadData}
              />
            </div>
          )}

          {activeTab === 'security' && (
            <SecurityView
              key={`sec-${refreshTrigger}`}
              currentUser={currentUser}
              onSwitchUser={user => {
                setCurrentUser(user);
                reloadData();
              }}
              onUsersUpdated={reloadData}
            />
          )}

          {activeTab === 'online-orders' && (
            <CustomerOrderPortalView
              medicines={medicines}
              onNavigateToPOS={handleConvertOnlineOrderToPOS}
              onRefreshData={reloadData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              key={`set-${refreshTrigger}`}
              onProfileUpdated={reloadData}
              onNavigateTab={setActiveTab}
            />
          )}
        </main>
      </div>

      {/* Global Command / Search Modal (⌘K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onNavigate={(tabId) => {
          setActiveTab(tabId);
          setIsGlobalSearchOpen(false);
        }}
      />

      {/* Global AI Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        onNavigateTab={(tabId) => {
          setActiveTab(tabId);
          setIsVoiceAssistantOpen(false);
        }}
        onAddToCart={(med) => {
          handleDispenseGenericInPOS(med);
        }}
      />

      {/* Auth / Screen Lock Modal */}
      {isAuthLocked && (
        <LoginModal
          allowClose={currentUser !== null}
          onClose={() => setIsAuthLocked(false)}
          onLoginSuccess={user => {
            setCurrentUser(user);
            setIsAuthLocked(false);
            reloadData();
          }}
        />
      )}

      {/* Real-time PWA Offline State Indicator */}
      <OfflineIndicator />
    </div>
  );
}
