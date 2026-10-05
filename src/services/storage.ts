import {
  Medicine,
  Supplier,
  Doctor,
  Patient,
  SaleTransaction,
  SalesReturn,
  PurchaseOrder,
  PurchaseReturn,
  OperatingExpense,
  User,
  GenericAlternative,
  Appointment,
  PharmacyProfile,
  ClinicDetails,
  ClinicConsultation,
  PurchaseInvoice,
  SupplierPaymentEntry,
  ShortLink,
  StockAdjustment,
  PatientNotification,
  SalesDraft,
  PurchaseDraft,
  CustomerOnlineOrder,
  CustomerServiceInquiry,
  OnlineOrderStatus,
  OnlinePaymentStatus,
  LowStockAlertItem,
  PrinterSettings,
  PharmacyBusinessType,
  WholesaleBuyer,
  PharmacyTenant,
  WholesalePaymentCollection
} from '../types';
import { DEFAULT_PRINTER_SETTINGS } from '../utils/escPosUtils';
import {
  INITIAL_MEDICINES,
  INITIAL_SUPPLIERS,
  INITIAL_DOCTORS,
  INITIAL_PATIENTS,
  INITIAL_TRANSACTIONS,
  INITIAL_SALES_RETURNS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_PURCHASE_RETURNS,
  INITIAL_APPOINTMENTS,
  INITIAL_EXPENSES,
  INITIAL_USERS,
  CITY_MEDICAL_PROFILE,
  CITY_MEDICAL_CLINIC_DETAILS,
  INITIAL_CONSULTATIONS,
  INITIAL_PURCHASE_INVOICES,
  INITIAL_WHOLESALE_BUYERS,
  INITIAL_PHARMACY_TENANTS,
  INITIAL_WHOLESALE_PAYMENTS
} from '../mockData';
import { INITIAL_SHORT_LINKS } from '../data/initialShortLinks';
import { CloudSyncService } from './firebase';

const STORAGE_KEYS = {
  USERS: 'pharmcloud_users_v1',
  CURRENT_USER: 'pharmcloud_current_user_v1',
  MEDICINES: 'pharmcloud_medicines_v1',
  SUPPLIERS: 'pharmcloud_suppliers_v1',
  DOCTORS: 'pharmcloud_doctors_v1',
  PATIENTS: 'pharmcloud_patients_v1',
  TRANSACTIONS: 'pharmcloud_transactions_v1',
  SALES_RETURNS: 'pharmcloud_sales_returns_v1',
  PURCHASE_ORDERS: 'pharmcloud_purchase_orders_v1',
  PURCHASE_RETURNS: 'pharmcloud_purchase_returns_v1',
  APPOINTMENTS: 'pharmcloud_appointments_v1',
  EXPENSES: 'pharmcloud_expenses_v1',
  ENCRYPTION_META: 'pharmcloud_encryption_meta_v1',
  PHARMACY_PROFILE: 'pharmcloud_profile_v1',
  CLINIC_DETAILS: 'pharmcloud_clinic_details_v1',
  CONSULTATIONS: 'pharmcloud_consultations_v1',
  PURCHASE_INVOICES: 'pharmcloud_purchase_invoices_v2',
  SHORT_LINKS: 'pharmcloud_short_links_v1',
  STOCK_ADJUSTMENTS: 'pharmcloud_stock_adjustments_v1',
  PATIENT_NOTIFICATIONS: 'pharmcloud_patient_notifications_v1',
  SALES_DRAFTS: 'cityrx_sales_drafts_v1',
  PURCHASE_DRAFTS: 'cityrx_purchase_drafts_v1',
  CUSTOMER_ONLINE_ORDERS: 'cityrx_customer_online_orders_v1',
  CUSTOMER_SERVICE_INQUIRIES: 'cityrx_customer_service_inquiries_v1',
  PRINTER_SETTINGS: 'cityrx_printer_settings_v1',
  WHOLESALE_BUYERS: 'cityrx_wholesale_buyers_v1',
  ACTIVE_BUSINESS_MODE: 'cityrx_active_business_mode_v1',
  PHARMACY_TENANTS: 'cityrx_pharmacy_tenants_v1',
  ACTIVE_TENANT_ID: 'cityrx_active_tenant_id_v1',
  WHOLESALE_PAYMENTS: 'cityrx_wholesale_payments_v1'
};

export class StorageService {
  // Safe helper
  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item);
    } catch {
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage setItem failed:', e);
    }
  }

  // Users & Auth
  static getUsers(): User[] {
    let users = this.getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    let modified = false;

    // Ensure all users have passwords, active status, and default metadata
    users = users.map(u => {
      const initial = INITIAL_USERS.find(iu => iu.username.toLowerCase() === u.username.toLowerCase());
      let updated = { ...u };
      if (!updated.password && initial?.password) {
        updated.password = initial.password;
        modified = true;
      } else if (!updated.password) {
        updated.password = 'citymed123';
        modified = true;
      }
      if (!updated.status) {
        updated.status = 'active';
        modified = true;
      }
      if (!updated.createdAt) {
        updated.createdAt = initial?.createdAt || '2025-01-01';
        modified = true;
      }
      if (u.role === 'pharmacist' && !u.name.includes('Anusya')) {
        updated.name = 'Anusya Begum, D.Pharm (Registered Pharmacist)';
        updated.email = 'anusya.citymed@gmail.com';
        updated.licenseNumber = 'TN-RPH-78419';
        updated.avatar = 'https://images.unsplash.com/photo-1594824813583-125c13e51493?auto=format&fit=crop&q=80&w=200';
        modified = true;
      }
      return updated;
    });

    if (modified) {
      this.setItem(STORAGE_KEYS.USERS, users);
    }
    return users;
  }

  static saveUsers(users: User[]): void {
    this.setItem(STORAGE_KEYS.USERS, users);
  }

  static addUser(userData: Omit<User, 'id'>): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const cleanUsername = userData.username.trim().toLowerCase();

    if (!cleanUsername) {
      return { success: false, error: 'Username cannot be empty.' };
    }
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, error: `Username "${userData.username}" is already in use. Please choose another username.` };
    }
    if (!userData.password || userData.password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }
    if (!userData.name.trim()) {
      return { success: false, error: 'Full Staff Name is required.' };
    }

    const defaultAvatars = [
      'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
      'https://images.unsplash.com/photo-1594824813583-125c13e51493?auto=format&fit=crop&q=80&w=200',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
    ];
    const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      username: userData.username.trim(),
      password: userData.password,
      name: userData.name.trim(),
      role: userData.role || 'cashier',
      email: userData.email?.trim() || `${cleanUsername}@citymedical.local`,
      phone: userData.phone?.trim() || '',
      licenseNumber: userData.licenseNumber?.trim() || '',
      avatar: userData.avatar || randomAvatar,
      status: userData.status || 'active',
      createdAt: new Date().toISOString().slice(0, 10),
      lastLogin: 'Never',
      pin: userData.pin || ''
    };

    users.push(newUser);
    this.saveUsers(users);
    return { success: true, user: newUser };
  }

  static updateUser(id: string, updates: Partial<User>): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return { success: false, error: 'User account not found.' };
    }

    if (updates.username) {
      const cleanUsername = updates.username.trim().toLowerCase();
      if (users.some(u => u.id !== id && u.username.toLowerCase() === cleanUsername)) {
        return { success: false, error: `Username "${updates.username}" is already in use by another staff member.` };
      }
    }

    if (updates.password !== undefined && updates.password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }

    const updatedUser = { ...users[index], ...updates };
    users[index] = updatedUser;
    this.saveUsers(users);

    // Sync current user if modifying self
    const current = this.getCurrentUser();
    if (current && current.id === id) {
      this.setCurrentUser(updatedUser);
    }

    return { success: true, user: updatedUser };
  }

  static deleteUser(id: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    const user = users.find(u => u.id === id);
    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const activeAdmins = users.filter(u => u.role === 'admin' && u.status === 'active');
      if (activeAdmins.length <= 1) {
        return { success: false, error: 'Action denied: Cannot delete the only remaining Administrator account.' };
      }
    }

    const filtered = users.filter(u => u.id !== id);
    this.saveUsers(filtered);

    // If deleting active logged-in user, switch to first remaining
    const current = this.getCurrentUser();
    if (current && current.id === id && filtered.length > 0) {
      this.setCurrentUser(filtered[0]);
    }

    return { success: true };
  }

  static authenticateUser(username: string, password: string): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    const user = users.find(u => u.username.toLowerCase() === cleanUsername);
    if (!user) {
      return { success: false, error: `Username "${username}" not recognized. Please check spelling or contact Admin.` };
    }

    if (user.status === 'inactive') {
      return { success: false, error: 'This user account is suspended/inactive. Please contact your Chief Pharmacist or Administrator.' };
    }

    if (user.password && user.password !== cleanPassword) {
      return { success: false, error: 'Invalid password. Please check your password and try again.' };
    }

    // Update last login
    const now = new Date();
    const timeStr = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    user.lastLogin = timeStr;
    this.saveUsers(users);
    this.setCurrentUser(user);

    return { success: true, user };
  }

  // =========================================================================
  // PHONE VERIFICATION (OTP) & MOBILE AUTHENTICATION
  // =========================================================================
  static generateVerificationCode(phone: string): { code: string; phone: string; expiresAt: number } {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    // For 8438678498, generate a dedicated memorable code or random 6-digit code
    const code = cleanPhone.endsWith('8438678498')
      ? '843867'
      : Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    try {
      localStorage.setItem(`cityrx_otp_${cleanPhone}`, JSON.stringify({ code, expiresAt }));
    } catch {
      // In-memory fallback
    }

    // Also record an entry in patient notification logs for audit trail
    try {
      this.addPatientNotification({
        id: `notif-otp-${Date.now().toString().slice(-6)}`,
        patientId: 'staff-auth',
        patientName: 'Staff Member (' + cleanPhone + ')',
        patientPhone: cleanPhone,
        channel: 'SMS',
        templateType: 'custom',
        message: `Your City Rx - City Medical verification code is: ${code}. Valid for 10 minutes. Do not share this OTP with anyone.`,
        status: 'Sent',
        sentAt: new Date().toISOString(),
        language: 'en'
      });
    } catch {
      // Non-blocking
    }

    return { code, phone: cleanPhone, expiresAt };
  }

  static verifyCode(phone: string, inputCode: string): { valid: boolean; error?: string } {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanCode = inputCode.trim();

    if (!cleanCode) {
      return { valid: false, error: 'Please enter the 6-digit verification code.' };
    }

    // Always allow master test codes or the dedicated 843867 code for seamless testing
    if (cleanCode === '843867' || cleanCode === '123456') {
      return { valid: true };
    }

    try {
      const stored = localStorage.getItem(`cityrx_otp_${cleanPhone}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() > parsed.expiresAt) {
          return { valid: false, error: 'Verification code has expired. Please request a new code.' };
        }
        if (parsed.code === cleanCode) {
          return { valid: true };
        }
      }
    } catch {
      // Fallback
    }

    return { valid: false, error: 'Invalid verification code. Please check and try again.' };
  }

  static getUserByPhone(phone: string): User | undefined {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const users = this.getUsers();
    return users.find(u => {
      if (!u.phone) return false;
      const uPhone = u.phone.replace(/[^0-9]/g, '');
      return uPhone === cleanPhone || (cleanPhone.length >= 10 && uPhone.endsWith(cleanPhone.slice(-10)));
    });
  }

  static authenticateByPhone(phone: string, code: string): {
    success: boolean;
    user?: User;
    isNewUser?: boolean;
    error?: string;
  } {
    const verification = this.verifyCode(phone, code);
    if (!verification.valid) {
      return { success: false, error: verification.error || 'Invalid verification code.' };
    }

    const user = this.getUserByPhone(phone);
    if (user) {
      if (user.status === 'inactive') {
        return { success: false, error: 'This user account is suspended. Please contact the administrator.' };
      }
      const now = new Date();
      user.lastLogin = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const users = this.getUsers().map(u => (u.id === user.id ? user : u));
      this.saveUsers(users);
      this.setCurrentUser(user);
      return { success: true, user, isNewUser: false };
    }

    // Verified phone but no account exists yet
    return { success: true, isNewUser: true };
  }

  // =========================================================================
  // DOWNLOAD USER CREDENTIALS & STAFF PASS
  // =========================================================================
  static downloadUserCredentials(user: User, rawPassword?: string): void {
    const profile = this.getPharmacyProfile();
    const timestamp = new Date().toLocaleString();
    const phoneDisplay = user.phone || '8438678498';

    const content = `================================================================
  ${profile.name.toUpperCase()}
  STAFF CREDENTIALS & TERMINAL ACCESS PASS
================================================================
Generated On        : ${timestamp}
Pharmacy Location   : ${profile.addressLine1}, ${profile.taluk}, ${profile.district}
Pharmacy Helpline   : +91 ${profile.mobile}
----------------------------------------------------------------
STAFF USER DETAILS
----------------------------------------------------------------
Full Name           : ${user.name}
Assigned Username   : ${user.username}
Registered Mobile   : +91 ${phoneDisplay} [VERIFIED]
Assigned Role       : ${user.role.toUpperCase()}
${rawPassword ? `Access Password     : ${rawPassword}` : `Access Password     : (Securely Enrolled)`}
Official Email      : ${user.email}
License / Reg No.   : ${user.licenseNumber || 'Not Applicable'}
Account Status      : ${user.status || 'Active'}
Staff ID Ref        : ${user.id}
Terminal URL        : ${window.location.origin}
----------------------------------------------------------------
ROLE PERMISSIONS & CAPABILITIES:
- ${user.role === 'admin' ? 'Full Administrator Access: Inventory, POS, Staff Accounts, Financial Reports' : user.role === 'pharmacist' ? 'Pharmacist Access: POS Billing, Prescription Audit, Generic Substitutions, Drug Stock' : user.role === 'cashier' ? 'Cashier Access: Retail POS Billing, Quick Sales, Thermal Receipts, Held Invoices' : 'Doctor Access: Clinical Consultations, E-Prescriptions, Patient File'}
----------------------------------------------------------------
SECURITY ADVISORY:
Keep your username and password strictly confidential.
Always lock your terminal when stepping away from the counter.
================================================================
  Get Well Soon! • City Rx Melur • Drug License: ${profile.drugLicenseNo || 'TN-Form-20B/21B'}
================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CityRx_Staff_Pass_${user.username}_${phoneDisplay}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static downloadAllUsersList(): void {
    const profile = this.getPharmacyProfile();
    const users = this.getUsers();
    const timestamp = new Date().toLocaleString();

    let content = `================================================================
  ${profile.name.toUpperCase()}
  OFFICIAL STAFF ROSTER & ACCESS DIRECTORY
================================================================
Generated On: ${timestamp}
Total Registered Staff: ${users.length}
Pharmacy Phone: +91 ${profile.mobile}
================================================================\n\n`;

    users.forEach((u, idx) => {
      content += `[${idx + 1}] ${u.name}\n`;
      content += `    Username : ${u.username}\n`;
      content += `    Role     : ${u.role.toUpperCase()}\n`;
      content += `    Mobile   : +91 ${u.phone || '8438678498'}\n`;
      content += `    Email    : ${u.email}\n`;
      content += `    License  : ${u.licenseNumber || 'N/A'}\n`;
      content += `    Status   : ${u.status || 'Active'}\n`;
      content += `    Last Log : ${u.lastLogin || 'Never'}\n\n`;
    });

    content += `================================================================
End of Staff Directory. City Rx Melur, Madurai.
================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CityRx_All_Staff_Roster_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static getCurrentUser(): User | null {
    const user = this.getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (!user) {
      const allUsers = this.getUsers();
      const defaultUser = allUsers[0] || INITIAL_USERS[0];
      this.setCurrentUser(defaultUser);
      return defaultUser;
    }
    return user;
  }

  static setCurrentUser(user: User | null): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  // Pharmacy Profile (City Medical, Melur, Madurai)
  static getPharmacyProfile(): PharmacyProfile {
    const profile = this.getItem<PharmacyProfile>(STORAGE_KEYS.PHARMACY_PROFILE, CITY_MEDICAL_PROFILE);
    if (!profile.pharmacistName) {
      profile.pharmacistName = 'Anusya Begum';
    }
    return profile;
  }

  static savePharmacyProfile(profile: PharmacyProfile): void {
    this.setItem(STORAGE_KEYS.PHARMACY_PROFILE, profile);
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('pharmacy:profile-updated', { detail: profile }));
      } catch {}
    }
  }

  // Business Operating Mode (Retail / Wholesale / Dual-Mode)
  static getBusinessType(): PharmacyBusinessType {
    const profile = this.getPharmacyProfile();
    return profile.businessType || 'both';
  }

  static setBusinessType(type: PharmacyBusinessType): void {
    const profile = this.getPharmacyProfile();
    profile.businessType = type;
    this.savePharmacyProfile(profile);
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('pharmacy:business-mode-updated', { detail: type }));
      } catch {}
    }
  }

  // Active Mode for current POS / Sales session
  static getActivePOSMode(): 'retail' | 'wholesale' {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_BUSINESS_MODE);
      if (saved === 'retail' || saved === 'wholesale') return saved;
    } catch {}
    const businessType = this.getBusinessType();
    return businessType === 'wholesale' ? 'wholesale' : 'retail';
  }

  static setActivePOSMode(mode: 'retail' | 'wholesale'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_BUSINESS_MODE, mode);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pharmacy:pos-mode-changed', { detail: mode }));
      }
    } catch {}
  }

  // Wholesale B2B Buyers Directory
  static getWholesaleBuyers(): WholesaleBuyer[] {
    return this.getItem<WholesaleBuyer[]>(STORAGE_KEYS.WHOLESALE_BUYERS, INITIAL_WHOLESALE_BUYERS);
  }

  static saveWholesaleBuyers(buyers: WholesaleBuyer[]): void {
    this.setItem(STORAGE_KEYS.WHOLESALE_BUYERS, buyers);
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('pharmacy:wholesale-buyers-updated', { detail: buyers }));
      } catch {}
    }
  }

  static addWholesaleBuyer(buyer: WholesaleBuyer): void {
    const list = this.getWholesaleBuyers();
    const existingIdx = list.findIndex(b => b.id === buyer.id || (b.gstin && b.gstin === buyer.gstin));
    if (existingIdx >= 0) {
      list[existingIdx] = buyer;
    } else {
      list.unshift(buyer);
    }
    this.saveWholesaleBuyers(list);
  }

  static deleteWholesaleBuyer(buyerId: string): void {
    const list = this.getWholesaleBuyers().filter(b => b.id !== buyerId);
    this.saveWholesaleBuyers(list);
  }

  static updateGstin(gstin: string): PharmacyProfile {
    const profile = this.getPharmacyProfile();
    const cleanGstin = gstin.trim().toUpperCase();
    const updated: PharmacyProfile = {
      ...profile,
      gstin: cleanGstin
    };
    this.savePharmacyProfile(updated);
    return updated;
  }

  static updateUpiQr(data: {
    upiQrCodeUrl?: string;
    upiVpa?: string;
    upiId?: string;
    upiQrFileName?: string;
  }): PharmacyProfile {
    const profile = this.getPharmacyProfile();
    const updated: PharmacyProfile = {
      ...profile,
      upiQrCodeUrl: data.upiQrCodeUrl !== undefined ? data.upiQrCodeUrl : profile.upiQrCodeUrl,
      upiVpa: data.upiVpa !== undefined ? data.upiVpa.trim() : profile.upiVpa,
      upiId: data.upiId !== undefined ? data.upiId.trim() : (data.upiVpa?.trim() || profile.upiId),
      upiQrFileName: data.upiQrFileName !== undefined ? data.upiQrFileName : profile.upiQrFileName,
      upiQrUploadedAt: data.upiQrCodeUrl ? new Date().toISOString() : profile.upiQrUploadedAt
    };
    this.savePharmacyProfile(updated);
    return updated;
  }

  // Thermal & POS Printer Hardware Settings
  static getPrinterSettings(): PrinterSettings {
    const saved = this.getItem<PrinterSettings>(STORAGE_KEYS.PRINTER_SETTINGS, DEFAULT_PRINTER_SETTINGS);
    return {
      ...DEFAULT_PRINTER_SETTINGS,
      ...saved
    };
  }

  static savePrinterSettings(settings: PrinterSettings): void {
    this.setItem(STORAGE_KEYS.PRINTER_SETTINGS, settings);
    // Also sync printerType into profile or preferred format
    try {
      localStorage.setItem('cityrx_preferred_print_format', settings.printerType);
    } catch {}
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('pharmacy:printer-updated', { detail: settings }));
      } catch {}
    }
  }

  // Medicines & Inventory
  static getMedicines(): Medicine[] {
    let list = this.getItem<Medicine[]>(STORAGE_KEYS.MEDICINES, INITIAL_MEDICINES);
    let changed = false;

    // Ensure all initialized medicines with updated manufacturer & generic names exist
    for (const initMed of INITIAL_MEDICINES) {
      const existingIdx = list.findIndex(m => m.id === initMed.id || m.name.toLowerCase() === initMed.name.toLowerCase());
      if (existingIdx === -1) {
        list.push(initMed);
        changed = true;
      } else {
        const existing = list[existingIdx];
        if (
          existing.manufacturer !== initMed.manufacturer ||
          existing.genericName !== initMed.genericName ||
          existing.category !== initMed.category ||
          existing.form !== initMed.form
        ) {
          list[existingIdx] = {
            ...initMed,
            batches: (existing.batches && existing.batches.length > 0) ? existing.batches : initMed.batches
          };
          changed = true;
        }
      }
    }

    // Defensive guarantee: ensure every medicine has an array of batches
    list = (list || []).map(m => ({
      ...m,
      batches: Array.isArray(m.batches) ? m.batches : []
    }));

    // Zero-stock policy enforcement: ensure all medicines and batches have 0 stock total
    const ZERO_STOCK_FLAG = 'pharmcloud_all_stock_zero_v5';
    if (localStorage.getItem(ZERO_STOCK_FLAG) !== 'true') {
      list = (list || []).map(m => ({
        ...m,
        batches: (Array.isArray(m.batches) ? m.batches : []).map(b => ({
          ...b,
          stock: 0
        }))
      }));
      try {
        localStorage.setItem(ZERO_STOCK_FLAG, 'true');
      } catch {
        // non-blocking
      }
      changed = true;
    }

    if (changed) {
      this.saveMedicines(list);
    }

    return list;
  }

  static setAllStockToZero(): { count: number; totalZeroed: number } {
    const list = this.getMedicines();
    let totalZeroed = 0;
    const zeroed = (list || []).map(med => ({
      ...med,
      batches: (Array.isArray(med.batches) ? med.batches : []).map(b => {
        totalZeroed += (b.stock || 0);
        return {
          ...b,
          stock: 0
        };
      })
    }));
    this.saveMedicines(zeroed);
    try {
      localStorage.setItem('pharmcloud_all_stock_zero_v5', 'true');
    } catch {
      // non-blocking
    }
    return { count: zeroed.length, totalZeroed };
  }

  static saveMedicines(medicines: Medicine[]): void {
    const sanitized = (medicines || []).map(m => ({
      ...m,
      batches: Array.isArray(m.batches) ? m.batches : []
    }));
    this.setItem(STORAGE_KEYS.MEDICINES, sanitized);
  }

  static updateMedicine(updated: Medicine): void {
    const list = this.getMedicines();
    const index = list.findIndex(m => m.id === updated.id);
    if (index >= 0) {
      list[index] = updated;
    } else {
      list.unshift(updated);
    }
    this.saveMedicines(list);
  }

  static findGenericAlternatives(medicine: Medicine): GenericAlternative[] {
    const allMeds = this.getMedicines();
    const normalizedTargetGeneric = medicine.genericName.toLowerCase().trim();

    // Standard salt / formulation filler words that don't differentiate active ingredient
    const IGNORED_WORDS = new Set([
      'gastro', 'resistant', 'sustained', 'release', 'enteric', 'coated', 'sodium',
      'potassium', 'hydrochloride', 'tablet', 'tablets', 'capsule', 'capsules',
      'syrup', 'suspension', 'injection', 'drops', 'sachet', 'granules', 'chewable',
      'extended', 'oral', 'film', 'effervescent', 'inhaler', 'rotacaps'
    ]);

    // Extract core active molecule tokens
    const extractActiveMolecules = (str: string) =>
      str
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 3 && !/^\d+$/.test(t) && !IGNORED_WORDS.has(t));

    const targetMolecules = extractActiveMolecules(medicine.genericName);

    return allMeds
      .filter(m => {
        if (m.id === medicine.id) return false;
        const candidateGeneric = m.genericName.toLowerCase().trim();
        if (candidateGeneric === normalizedTargetGeneric) return true;

        const candidateMolecules = extractActiveMolecules(m.genericName);
        if (targetMolecules.length > 0 && candidateMolecules.length > 0) {
          // Check if key active molecules overlap
          const matchCount = targetMolecules.filter(t => candidateMolecules.includes(t)).length;
          // Exact match or strong match
          const requiredMatches = Math.max(1, Math.min(targetMolecules.length, candidateMolecules.length));
          if (matchCount >= requiredMatches) {
            return true;
          }
          // Also match similar PPI classes (e.g. Pantoprazole & Rabeprazole with Domperidone)
          const targetHasPPI = targetMolecules.some(t => t.includes('prazole'));
          const candidateHasPPI = candidateMolecules.some(t => t.includes('prazole'));
          const targetHasDomperidone = targetMolecules.includes('domperidone');
          const candidateHasDomperidone = candidateMolecules.includes('domperidone');
          if (targetHasPPI && candidateHasPPI && targetHasDomperidone && candidateHasDomperidone) {
            return true;
          }
        }
        return false;
      })
      .map(alt => {
        const totalStock = alt.batches.reduce((sum, b) => sum + b.stock, 0);
        const altPrice = alt.batches[0]?.sellingPrice || 0;
        const origPrice = medicine.batches[0]?.sellingPrice || 1;
        const savingsPercentage = origPrice > altPrice ? Math.round(((origPrice - altPrice) / origPrice) * 100) : 0;

        return {
          medicineId: alt.id,
          brandName: alt.name,
          genericName: alt.genericName,
          manufacturer: alt.manufacturer,
          sellingPrice: altPrice,
          stockAvailable: totalStock,
          savingsPercentage,
          form: alt.form,
          strength: alt.strength
        };
      })
      .sort((a, b) => {
        // In-stock first, then highest savings
        if ((a.stockAvailable > 0) !== (b.stockAvailable > 0)) {
          return a.stockAvailable > 0 ? -1 : 1;
        }
        return b.savingsPercentage - a.savingsPercentage;
      });
  }

  // Low Stock Notification & Monitoring System
  static getLowStockAlerts(): LowStockAlertItem[] {
    const list = this.getMedicines();
    return list
      .map(med => {
        const totalStock = (med.batches || []).reduce((sum, b) => sum + (b.stock || 0), 0);
        const roundedStock = Math.round(totalStock * 1000) / 1000;
        const minAlert = med.minStockAlert ?? 20;
        return {
          medicineId: med.id,
          medicineName: med.name,
          genericName: med.genericName,
          strength: med.strength,
          form: med.form,
          currentStock: roundedStock,
          minStockAlert: minAlert,
          deficit: Math.max(0, minAlert - roundedStock),
          suggestedReorderQuantity: Math.max(minAlert * 2 - roundedStock, minAlert),
          manufacturer: med.manufacturer,
          rackLocation: med.rackLocation,
          status: (roundedStock === 0 ? 'critical_zero' : 'low_stock') as 'critical_zero' | 'low_stock',
          timestamp: new Date().toISOString()
        };
      })
      .filter(item => item.currentStock <= item.minStockAlert)
      .sort((a, b) => a.currentStock - b.currentStock);
  }

  static notifyLowStockChanges(affectedMedIds: string[]): LowStockAlertItem[] {
    const allAlerts = this.getLowStockAlerts();
    const affectedAlerts = allAlerts.filter(a => affectedMedIds.includes(a.medicineId));
    if (typeof window !== 'undefined' && affectedAlerts.length > 0) {
      try {
        window.dispatchEvent(
          new CustomEvent('pharmacy:low-stock-alert', {
            detail: { alerts: affectedAlerts, allLowStock: allAlerts }
          })
        );
      } catch {
        // non-blocking
      }
    }
    return affectedAlerts;
  }

  // Deduct inventory for sale
  static deductStockForSale(items: { medicineId: string; batchNumber: string; quantity: number; stockDeduction?: number }[]): { success: boolean; triggeredAlerts: LowStockAlertItem[] } {
    const medicines = this.getMedicines();
    const affectedIds = new Set<string>();

    for (const item of items) {
      const med = medicines.find(m => m.id === item.medicineId);
      if (!med) continue;
      const batch = med.batches.find(b => b.batchNumber === item.batchNumber);
      if (!batch) continue;

      const deductQty = typeof item.stockDeduction === 'number' && item.stockDeduction > 0
        ? item.stockDeduction
        : item.quantity;

      // Subtract quantity with 3-decimal precision for clean fractional pack tracking
      batch.stock = Math.max(0, Math.round((batch.stock - deductQty) * 1000) / 1000);
      affectedIds.add(med.id);
    }

    this.saveMedicines(medicines);
    const triggeredAlerts = this.notifyLowStockChanges(Array.from(affectedIds));
    return { success: true, triggeredAlerts };
  }

  // Restock inventory from Sales Return or Physical Adjustment
  static adjustBatchStock(
    medicineId: string,
    batchNumber: string,
    deltaQuantity: number,
    reason?: string,
    notes?: string,
    adjustedBy?: string
  ): StockAdjustment | null {
    const medicines = this.getMedicines();
    const med = medicines.find(m => m.id === medicineId);
    if (!med) return null;

    const batch = med.batches.find(b => b.batchNumber === batchNumber);
    if (!batch) return null;

    const previousStock = batch.stock || 0;
    const newStock = Math.max(0, Math.round((previousStock + deltaQuantity) * 1000) / 1000);
    batch.stock = newStock;

    this.saveMedicines(medicines);
    this.notifyLowStockChanges([medicineId]);

    // Record audit adjustment entry
    const currentUser = this.getCurrentUser();
    const adjustment: StockAdjustment = {
      id: `ADJ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString(),
      type: deltaQuantity >= 0 ? 'ADD' : 'REMOVE',
      medicineId,
      medicineName: med.name,
      batchNumber,
      quantity: Math.abs(deltaQuantity),
      previousStock,
      newStock,
      reason: reason || (deltaQuantity >= 0 ? 'Physical inventory surplus' : 'Inventory write-off'),
      customNotes: notes,
      adjustedBy: adjustedBy || currentUser?.name || 'Chief Pharmacist'
    };

    const history = this.getStockAdjustments();
    history.unshift(adjustment);
    this.setItem(STORAGE_KEYS.STOCK_ADJUSTMENTS, history);

    return adjustment;
  }

  static getStockAdjustments(): StockAdjustment[] {
    return this.getItem<StockAdjustment[]>(STORAGE_KEYS.STOCK_ADJUSTMENTS, []);
  }

  static recordStockAdjustment(adj: Omit<StockAdjustment, 'id' | 'date'>): StockAdjustment {
    const history = this.getStockAdjustments();
    const fullAdj: StockAdjustment = {
      ...adj,
      id: `ADJ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString()
    };
    history.unshift(fullAdj);
    this.setItem(STORAGE_KEYS.STOCK_ADJUSTMENTS, history);
    return fullAdj;
  }

  static recordStockAdjustments(adjs: StockAdjustment[]): void {
    if (!adjs || adjs.length === 0) return;
    const history = this.getStockAdjustments();
    history.unshift(...adjs);
    this.setItem(STORAGE_KEYS.STOCK_ADJUSTMENTS, history);
  }

  // Add new batch to existing medicine
  static addBatchToMedicine(medicineId: string, newBatch: Medicine['batches'][0]): void {
    const medicines = this.getMedicines();
    const med = medicines.find(m => m.id === medicineId);
    if (!med) return;

    const existingIndex = med.batches.findIndex(b => b.batchNumber === newBatch.batchNumber);
    if (existingIndex >= 0) {
      med.batches[existingIndex].stock += newBatch.stock;
      med.batches[existingIndex].costPrice = newBatch.costPrice;
      med.batches[existingIndex].sellingPrice = newBatch.sellingPrice;
    } else {
      med.batches.push(newBatch);
    }

    this.saveMedicines(medicines);
  }

  // Suppliers & Payables
  static getSuppliers(): Supplier[] {
    const list = this.getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    // Ensure existing saved suppliers have fallback image and agencyCode
    return (list || []).map(s => {
      const initMatch = INITIAL_SUPPLIERS.find(init => init.id === s.id);
      return {
        ...s,
        image: s.image || initMatch?.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=80',
        agencyCode: s.agencyCode || initMatch?.agencyCode || `AGY-${s.id.toUpperCase()}`
      };
    });
  }

  static saveSuppliers(suppliers: Supplier[]): void {
    this.setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
  }

  static updateSupplierImage(supplierId: string, image: string): void {
    const suppliers = this.getSuppliers();
    const sup = suppliers.find(s => s.id === supplierId);
    if (sup) {
      sup.image = image;
      this.saveSuppliers(suppliers);
    }
  }

  static updateSupplierPayable(supplierId: string, deltaAmount: number): void {
    const suppliers = this.getSuppliers();
    const sup = suppliers.find(s => s.id === supplierId);
    if (sup) {
      sup.outstandingPayable = Math.max(0, sup.outstandingPayable + deltaAmount);
      this.saveSuppliers(suppliers);
    }
  }

  // Doctors
  static getDoctors(): Doctor[] {
    return this.getItem<Doctor[]>(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
  }

  static saveDoctors(doctors: Doctor[]): void {
    this.setItem(STORAGE_KEYS.DOCTORS, doctors);
  }

  // Patients & Refill Reminders
  static getPatients(): Patient[] {
    const list = this.getItem<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    return (list || []).map(p => {
      const allg = Array.isArray(p.allergies) ? p.allergies : (Array.isArray(p.drugAllergies) ? p.drugAllergies : []);
      const due = typeof p.outstandingDue === 'number' ? p.outstandingDue : 0;
      return {
        ...p,
        allergies: allg,
        drugAllergies: allg,
        chronicConditions: Array.isArray(p.chronicConditions) ? p.chronicConditions : [],
        refillReminders: Array.isArray(p.refillReminders) ? p.refillReminders : [],
        prescriptions: Array.isArray(p.prescriptions) ? p.prescriptions : [],
        creditLimit: typeof p.creditLimit === 'number' ? p.creditLimit : 5000,
        outstandingDue: due,
        creditDays: typeof p.creditDays === 'number' ? p.creditDays : 15,
        creditStatus: p.creditStatus || (due > 0 ? 'Due' : 'Good'),
        creditLedger: Array.isArray(p.creditLedger) ? p.creditLedger : []
      };
    });
  }

  static savePatients(patients: Patient[]): void {
    const sanitized = (patients || []).map(p => {
      const allg = Array.isArray(p.allergies) ? p.allergies : (Array.isArray(p.drugAllergies) ? p.drugAllergies : []);
      return {
        ...p,
        allergies: allg,
        drugAllergies: allg,
        chronicConditions: Array.isArray(p.chronicConditions) ? p.chronicConditions : [],
        refillReminders: Array.isArray(p.refillReminders) ? p.refillReminders : [],
        prescriptions: Array.isArray(p.prescriptions) ? p.prescriptions : [],
        creditLedger: Array.isArray(p.creditLedger) ? p.creditLedger : []
      };
    });
    this.setItem(STORAGE_KEYS.PATIENTS, sanitized);
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('pharmacy:patient-credit-updated', { detail: sanitized }));
      } catch {}
    }
  }

  static updatePatient(updated: Patient): void {
    const patients = this.getPatients();
    const index = patients.findIndex(p => p.id === updated.id);
    if (index >= 0) {
      patients[index] = updated;
    } else {
      patients.unshift(updated);
    }
    this.savePatients(patients);
  }

  static addPatient(patientData: Partial<Patient>): Patient {
    const patients = this.getPatients();
    const allg = Array.isArray(patientData.allergies) ? patientData.allergies : (Array.isArray(patientData.drugAllergies) ? patientData.drugAllergies : []);
    const newPatient: Patient = {
      id: patientData.id || `pat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: patientData.name || 'New Patient',
      phone: patientData.phone || '',
      age: patientData.age || 30,
      gender: patientData.gender || 'Other',
      chronicConditions: Array.isArray(patientData.chronicConditions) ? patientData.chronicConditions : [],
      allergies: allg,
      drugAllergies: allg,
      refillReminders: Array.isArray(patientData.refillReminders) ? patientData.refillReminders : [],
      prescriptions: Array.isArray(patientData.prescriptions) ? patientData.prescriptions : [],
      address: patientData.address || '',
      creditLimit: patientData.creditLimit ?? 5000,
      outstandingDue: patientData.outstandingDue ?? 0,
      creditDays: patientData.creditDays ?? 15,
      creditStatus: patientData.creditStatus || (patientData.outstandingDue && patientData.outstandingDue > 0 ? 'Due' : 'Good'),
      creditDueDate: patientData.creditDueDate,
      creditLedger: Array.isArray(patientData.creditLedger) ? patientData.creditLedger : []
    };
    patients.unshift(newPatient);
    this.savePatients(patients);
    return newPatient;
  }

  // =========================================================================
  // PATIENT CREDIT / DUE LEDGER & PAYMENT RECOVERY
  // =========================================================================
  static recordPatientCreditSale(
    patientId: string,
    invoiceId: string,
    amount: number,
    dueDate?: string,
    notes?: string,
    recordedBy: string = 'POS Billing'
  ): { success: boolean; newBalance: number } {
    const patients = this.getPatients();
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return { success: false, newBalance: 0 };

    const currentDue = Number(patient.outstandingDue || 0);
    const newBalance = Math.round((currentDue + amount) * 100) / 100;

    patient.outstandingDue = newBalance;
    patient.creditStatus = 'Due';
    if (dueDate) {
      patient.creditDueDate = dueDate;
    } else {
      const d = new Date();
      d.setDate(d.getDate() + (patient.creditDays || 15));
      patient.creditDueDate = d.toISOString().split('T')[0];
    }

    if (!Array.isArray(patient.creditLedger)) {
      patient.creditLedger = [];
    }

    patient.creditLedger.unshift({
      id: `pce-${Date.now().toString().slice(-6)}`,
      patientId: patient.id,
      date: new Date().toISOString(),
      type: 'Credit_Sale',
      invoiceId,
      amount,
      balanceAfter: newBalance,
      notes: notes || `Credit Sale Bill #${invoiceId}`,
      recordedBy
    });

    this.savePatients(patients);
    return { success: true, newBalance };
  }

  static recordPatientDuePayment(
    patientId: string,
    paymentAmount: number,
    paymentMethod: string = 'Cash',
    referenceNo?: string,
    notes?: string,
    recordedBy: string = 'Pharmacist'
  ): { success: boolean; newBalance: number; receiptId: string } {
    const patients = this.getPatients();
    const patient = patients.find(p => p.id === patientId);
    const receiptId = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!patient) return { success: false, newBalance: 0, receiptId };

    const currentDue = Number(patient.outstandingDue || 0);
    const newBalance = Math.max(0, Math.round((currentDue - paymentAmount) * 100) / 100);

    patient.outstandingDue = newBalance;
    patient.lastPaymentDate = new Date().toISOString().split('T')[0];
    patient.creditStatus = newBalance === 0 ? 'Good' : 'Due';

    if (!Array.isArray(patient.creditLedger)) {
      patient.creditLedger = [];
    }

    patient.creditLedger.unshift({
      id: receiptId,
      patientId: patient.id,
      date: new Date().toISOString(),
      type: 'Payment_Received',
      amount: paymentAmount,
      balanceAfter: newBalance,
      paymentMethod,
      referenceNo,
      notes: notes || `Payment Received - Balance Due: ₹${newBalance.toFixed(2)}`,
      recordedBy
    });

    this.savePatients(patients);
    return { success: true, newBalance, receiptId };
  }

  static updatePatientCreditLimit(patientId: string, limit: number, creditDays?: number): void {
    const patients = this.getPatients();
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    patient.creditLimit = limit;
    if (typeof creditDays === 'number') {
      patient.creditDays = creditDays;
    }
    this.savePatients(patients);
  }

  static getPatientCreditLedger(patientId: string) {
    const patients = this.getPatients();
    const patient = patients.find(p => p.id === patientId);
    return patient?.creditLedger || [];
  }

  static markRefillReminderSent(patientId: string, reminderId: string): void {
    const patients = this.getPatients();
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    const reminder = patient.refillReminders.find(r => r.id === reminderId);
    if (reminder) {
      reminder.status = 'Sent';
      reminder.lastNotificationSent = new Date().toISOString();
      this.savePatients(patients);
    }
  }

  static recordRefillCompleted(patientId: string, reminderId: string): void {
    const patients = this.getPatients();
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    const reminder = patient.refillReminders.find(r => r.id === reminderId);
    if (reminder) {
      reminder.status = 'Refilled';
      // Calculate next refill date based on supply
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + (reminder.daysSupply || 30));
      reminder.nextRefillDue = nextDate.toISOString().split('T')[0];
      this.savePatients(patients);
    }
  }

  // Daily OPD / Patient Consultation Token Generator
  static getNextDailyTokenNumber(dateStr?: string): { tokenNumber: number; tokenFormatted: string; tokenDate: string } {
    const today = dateStr || new Date().toISOString().split('T')[0];
    const patients = this.getPatients();
    // Filter patients who received a token today
    const todaysTokens = patients
      .filter(p => p.tokenDate === today && typeof p.tokenNumber === 'number')
      .map(p => p.tokenNumber as number);

    const key = `cityrx_token_counter_${today}`;
    let storedCounter = 0;
    try {
      storedCounter = Number(localStorage.getItem(key) || 0);
    } catch {}

    const maxIssued = todaysTokens.length > 0 ? Math.max(...todaysTokens) : 0;
    const nextNum = Math.max(maxIssued, storedCounter) + 1;

    try {
      localStorage.setItem(key, String(nextNum));
    } catch {}

    const formatted = `#${nextNum < 10 ? '0' : ''}${nextNum}`;
    return {
      tokenNumber: nextNum,
      tokenFormatted: formatted,
      tokenDate: today
    };
  }

  static issuePatientToken(
    patientId: string,
    doctorName?: string,
    doctorId?: string,
    consultationTime?: string
  ): Patient | null {
    const patients = this.getPatients();
    const p = patients.find(pt => pt.id === patientId);
    if (!p) return null;
    const tokenInfo = this.getNextDailyTokenNumber();
    p.tokenNumber = tokenInfo.tokenNumber;
    p.tokenFormatted = tokenInfo.tokenFormatted;
    p.tokenDate = tokenInfo.tokenDate;
    if (doctorName) p.consultationDoctorName = doctorName;
    if (doctorId) p.consultationDoctorId = doctorId;
    if (consultationTime) p.consultationTime = consultationTime;
    p.consultationStatus = 'Waiting';
    this.savePatients(patients);
    return p;
  }

  // Patient SMS / WhatsApp Notifications
  static getPatientNotifications(): PatientNotification[] {
    const defaultList: PatientNotification[] = [
      {
        id: 'notif-101',
        patientId: 'pat-101',
        patientName: 'Kavita Sundaram',
        patientPhone: '+91 98450 12345',
        channel: 'WhatsApp',
        templateType: 'refill',
        message: 'Vanakkam Kavita Sundaram, this is a friendly reminder from City Medical, Melur. Your Glycomet-GP 1 (Glimepiride + Metformin) is due for refill. Call +91 98421 87654 for free local delivery.',
        status: 'Delivered',
        sentAt: '2026-09-15T09:30:00.000Z',
        referenceId: 'ref-01',
        language: 'en'
      },
      {
        id: 'notif-102',
        patientId: 'pat-102',
        patientName: 'Rajeshwari Natarajan',
        patientPhone: '+91 94432 67890',
        channel: 'SMS',
        templateType: 'rx_ready',
        message: 'City Medical Melur: Your chronic care medicines are packed and ready for pickup. Bill amount: Rs. 640. Ph: 9842187654.',
        status: 'Sent',
        sentAt: '2026-09-14T14:15:00.000Z',
        language: 'en'
      }
    ];
    return this.getItem<PatientNotification[]>(STORAGE_KEYS.PATIENT_NOTIFICATIONS, defaultList);
  }

  static savePatientNotifications(notifications: PatientNotification[]): void {
    this.setItem(STORAGE_KEYS.PATIENT_NOTIFICATIONS, notifications || []);
  }

  static addPatientNotification(notification: PatientNotification): void {
    const list = this.getPatientNotifications();
    list.unshift(notification);
    this.savePatientNotifications(list);
  }

  // Sales Transactions
  static clearAllSalesTransactions(): void {
    this.setItem(STORAGE_KEYS.TRANSACTIONS, []);
    this.setItem(STORAGE_KEYS.SALES_RETURNS, []);
    try {
      localStorage.setItem('cityrx_sales_zero_reset_v4', 'true');
    } catch {}
  }

  static getNextInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const transactions = this.getTransactions();
    const count = transactions.length + 1;
    const padded = String(count).padStart(4, '0');
    return `INV-${year}-${padded}`;
  }

  static getTransactions(): SaleTransaction[] {
    // One-time clean reset: ensures historical sample sales invoices are cleared to zero
    // so sales, gross sales, cost of goods sold, discounts conceded, and output GST start fresh from today onwards
    try {
      if (!localStorage.getItem('cityrx_sales_zero_reset_v4')) {
        localStorage.setItem('cityrx_sales_zero_reset_v4', 'true');
        this.setItem(STORAGE_KEYS.TRANSACTIONS, []);
        this.setItem(STORAGE_KEYS.SALES_RETURNS, []);
        return [];
      }
    } catch {}

    const list = this.getItem<SaleTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    return (list || []).map(tx => ({
      ...tx,
      items: Array.isArray(tx.items) ? tx.items : []
    }));
  }

  static addTransaction(tx: SaleTransaction): void {
    const transactions = this.getTransactions();
    transactions.unshift(tx);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);

    // Also deduct stock automatically
    const deductItems = (tx.items || []).map(i => ({
      medicineId: i.medicineId,
      batchNumber: i.batchNumber,
      quantity: i.quantity
    }));
    this.deductStockForSale(deductItems);

    // If patient is registered, update last visit date and add or update refill record
    if (tx.patientId) {
      const patients = this.getPatients();
      const patient = patients.find(p => p.id === tx.patientId);
      if (patient) {
        patient.lastVisitDate = tx.date.split('T')[0];
        this.savePatients(patients);
      }

      // If sale is on Credit / Khata, automatically record in patient credit ledger
      if (tx.paymentMethod === 'Credit') {
        const creditAmt = tx.creditBalanceAmount !== undefined ? tx.creditBalanceAmount : tx.grandTotal;
        this.recordPatientCreditSale(
          tx.patientId,
          tx.id,
          creditAmt,
          tx.creditDueDate,
          `POS Bill #${tx.id} (Total: ₹${tx.grandTotal.toFixed(2)}${tx.paidAmount ? `, Paid: ₹${tx.paidAmount.toFixed(2)}` : ''})`,
          tx.cashierName || 'Pharmacist'
        );
      }
    }
  }

  // Sales Returns
  static getSalesReturns(): SalesReturn[] {
    try {
      if (!localStorage.getItem('cityrx_sales_zero_reset_v4')) {
        return [];
      }
    } catch {}

    const list = this.getItem<SalesReturn[]>(STORAGE_KEYS.SALES_RETURNS, []);
    return (list || []).map(ret => ({
      ...ret,
      refundAmount: ret.refundAmount ?? ret.totalRefundAmount ?? 0,
      totalRefundAmount: ret.totalRefundAmount ?? ret.refundAmount ?? 0,
      customerName: ret.customerName || ret.patientName || 'Customer',
      patientName: ret.patientName || ret.customerName || 'Customer',
    }));
  }

  static addSalesReturn(ret: SalesReturn): void {
    const returns = this.getSalesReturns();
    returns.unshift(ret);
    this.setItem(STORAGE_KEYS.SALES_RETURNS, returns);

    // If marked returnToStock, adjust inventory batch
    for (const item of ret.items) {
      if (item.returnToStock) {
        this.adjustBatchStock(item.medicineId, item.batchNumber, item.quantity, `Sales Return ${ret.id}`);
      }
    }

    // Mark original transaction as partially/fully refunded
    const transactions = this.getTransactions();
    const tx = transactions.find(t => t.id === ret.invoiceId);
    if (tx) {
      tx.paymentStatus = 'Partial_Refund';
      this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    }
  }

  // Purchase Orders
  static getPurchaseOrders(): PurchaseOrder[] {
    const list = this.getItem<PurchaseOrder[]>(STORAGE_KEYS.PURCHASE_ORDERS, INITIAL_PURCHASE_ORDERS);
    return (list || []).map(po => ({
      ...po,
      items: Array.isArray(po.items) ? po.items : []
    }));
  }

  static addPurchaseOrder(po: PurchaseOrder): void {
    const list = this.getPurchaseOrders();
    list.unshift(po);
    this.setItem(STORAGE_KEYS.PURCHASE_ORDERS, list);
  }

  static updatePurchaseOrderStatus(poId: string, status: PurchaseOrder['status']): void {
    const list = this.getPurchaseOrders();
    const po = list.find(p => p.id === poId);
    if (!po) return;

    po.status = status;
    if (status === 'Received') {
      po.receivedDate = new Date().toISOString().split('T')[0];
      // Automatically restock medicines and add to supplier outstanding payable
      this.receivePurchaseOrderInventory(po);
      this.updateSupplierPayable(po.supplierId, po.grandTotal);
    }
    this.setItem(STORAGE_KEYS.PURCHASE_ORDERS, list);
  }

  private static receivePurchaseOrderInventory(po: PurchaseOrder): void {
    const medicines = this.getMedicines();
    const today = new Date();
    // Expiry default 2 years in future for newly received PO stock
    const expDate = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    const mfgDate = today.toISOString().split('T')[0];

    for (const item of (po.items || [])) {
      const med = medicines.find(m => m.id === item.medicineId);
      if (!med) continue;

      const newBatchNumber = `PO-${po.id.slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;
      const mrp = Math.round(item.unitCostPrice * 1.45); // Standard 45% markup for retail
      const sellingPrice = Math.round(item.unitCostPrice * 1.35);

      med.batches.push({
        batchNumber: newBatchNumber,
        expiryDate: expDate,
        manufacturingDate: mfgDate,
        stock: item.orderQuantity,
        costPrice: item.unitCostPrice,
        sellingPrice,
        mrp,
        location: 'Received Bay / Main Shelf'
      });
    }

    this.saveMedicines(medicines);
  }

  // Purchase Invoices & Goods Inward Entries
  static getPurchaseInvoices(): PurchaseInvoice[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (!localStorage.getItem(STORAGE_KEYS.PURCHASE_INVOICES)) {
        localStorage.removeItem('pharmcloud_purchase_invoices_v1');
        this.savePurchaseInvoices(INITIAL_PURCHASE_INVOICES);
        return INITIAL_PURCHASE_INVOICES;
      }
    }
    const list = this.getItem<PurchaseInvoice[]>(STORAGE_KEYS.PURCHASE_INVOICES, INITIAL_PURCHASE_INVOICES);
    const suppliers = this.getSuppliers();
    return (list || []).map(inv => {
      const items = Array.isArray(inv.items) ? inv.items : [];
      const res = { ...inv, items };
      if (!res.distributorImage) {
        const sup = suppliers.find(s => s.id === inv.distributorId);
        if (sup?.image) {
          res.distributorImage = sup.image;
        }
      }
      return res;
    });
  }

  static savePurchaseInvoices(invoices: PurchaseInvoice[]): void {
    this.setItem(STORAGE_KEYS.PURCHASE_INVOICES, invoices);
  }

  static clearPurchaseInvoices(): void {
    this.savePurchaseInvoices([]);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('pharmcloud_purchase_invoices_v1');
    }
  }

  static addPurchaseInvoice(invoice: PurchaseInvoice, autoUpdateInventory: boolean = true): void {
    const list = this.getPurchaseInvoices();
    if (!invoice.distributorImage) {
      const sup = this.getSuppliers().find(s => s.id === invoice.distributorId);
      if (sup?.image) {
        invoice.distributorImage = sup.image;
      }
    }
    list.unshift(invoice);
    this.savePurchaseInvoices(list);

    // 1. Update distributor accounts payable with unpaid balance
    const grandTotal = invoice.grandTotal || 0;
    const paid = invoice.paidAmount != null ? invoice.paidAmount : (invoice.paymentStatus === 'Paid' ? grandTotal : 0);
    const balance = invoice.balanceAmount != null ? invoice.balanceAmount : Math.max(0, grandTotal - paid);
    invoice.paidAmount = paid;
    invoice.balanceAmount = balance;
    invoice.paymentStatus = balance <= 0 ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');

    if (balance > 0) {
      this.updateSupplierPayable(invoice.distributorId, balance);
    }

    // 2. Automatically update medicines inventory stock and batch records
    if (autoUpdateInventory) {
      const medicines = this.getMedicines();

      for (const item of invoice.items) {
        let med = medicines.find(m => m.id === item.medicineId || m.name.toLowerCase() === item.medicineName.toLowerCase());

        // If medicine doesn't exist yet, create a new one
        if (!med) {
          med = {
            id: item.medicineId || `med-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: item.medicineName,
            genericName: item.genericName || item.medicineName,
            strength: 'Standard',
            form: 'Tablet',
            manufacturer: invoice.distributorName,
            category: 'General Healthcare',
            prescriptionRequired: false,
            hsnCode: item.hsnCode || '300490',
            taxRate: item.gstRate || 12,
            minStockAlert: 20,
            batches: []
          };
          medicines.unshift(med);
        } else {
          // Update HSN or tax rate if provided
          if (item.hsnCode) med.hsnCode = item.hsnCode;
          if (item.gstRate != null) med.taxRate = item.gstRate;
          if (item.genericName && (!med.genericName || med.genericName.toLowerCase() === med.name.toLowerCase())) {
            med.genericName = item.genericName;
          }
        }

        // Add or update batch
        const totalReceivedStock = item.totalQuantity || (item.billedQuantity + (item.freeQuantity || 0));
        const existingBatch = med.batches.find(b => b.batchNumber.toLowerCase() === item.batchNumber.toLowerCase());

        if (existingBatch) {
          existingBatch.stock += totalReceivedStock;
          existingBatch.costPrice = item.purchaseRate;
          existingBatch.mrp = item.mrp;
          existingBatch.sellingPrice = item.mrp;
          if (item.expiryDate) existingBatch.expiryDate = item.expiryDate;
        } else {
          med.batches.push({
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            manufacturingDate: invoice.invoiceDate,
            stock: totalReceivedStock,
            costPrice: item.purchaseRate,
            sellingPrice: item.mrp,
            mrp: item.mrp,
            location: 'Main Shelf / Storage'
          });
        }
      }

      this.saveMedicines(medicines);
    }
  }

  static updatePurchaseInvoice(updatedInvoice: PurchaseInvoice, autoUpdateInventory: boolean = true): void {
    const list = this.getPurchaseInvoices();
    const index = list.findIndex(i => i.id === updatedInvoice.id);
    if (index === -1) return;

    const previousInvoice = list[index];
    const diffGrandTotal = updatedInvoice.grandTotal - previousInvoice.grandTotal;

    list[index] = updatedInvoice;
    this.savePurchaseInvoices(list);

    // Adjust supplier accounts payable difference if grandTotal changed or distributor changed
    if (previousInvoice.distributorId !== updatedInvoice.distributorId) {
      this.updateSupplierPayable(previousInvoice.distributorId, -previousInvoice.grandTotal);
      this.updateSupplierPayable(updatedInvoice.distributorId, updatedInvoice.grandTotal);
    } else if (diffGrandTotal !== 0) {
      this.updateSupplierPayable(updatedInvoice.distributorId, diffGrandTotal);
    }

    if (autoUpdateInventory) {
      const medicines = this.getMedicines();

      for (const item of updatedInvoice.items) {
        let med = medicines.find(m => m.id === item.medicineId || m.name.toLowerCase() === item.medicineName.toLowerCase());

        if (!med) {
          med = {
            id: item.medicineId || `med-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: item.medicineName,
            genericName: item.genericName || item.medicineName,
            strength: 'Standard',
            form: 'Tablet',
            manufacturer: updatedInvoice.distributorName,
            category: 'General Healthcare',
            prescriptionRequired: false,
            hsnCode: item.hsnCode || '300490',
            taxRate: item.gstRate || 12,
            minStockAlert: 20,
            batches: []
          };
          medicines.unshift(med);
        } else {
          if (item.hsnCode) med.hsnCode = item.hsnCode;
          if (item.gstRate != null) med.taxRate = item.gstRate;
        }

        const totalReceivedStock = item.totalQuantity || (item.billedQuantity + (item.freeQuantity || 0));
        const existingBatch = med.batches.find(b => b.batchNumber.toLowerCase() === item.batchNumber.toLowerCase());

        if (existingBatch) {
          existingBatch.costPrice = item.purchaseRate;
          existingBatch.mrp = item.mrp;
          existingBatch.sellingPrice = item.mrp;
          if (item.expiryDate) existingBatch.expiryDate = item.expiryDate;
        } else {
          med.batches.push({
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            manufacturingDate: updatedInvoice.invoiceDate,
            stock: totalReceivedStock,
            costPrice: item.purchaseRate,
            sellingPrice: item.mrp,
            mrp: item.mrp,
            location: 'Main Shelf / Storage'
          });
        }
      }

      this.saveMedicines(medicines);
    }
  }

  static deletePurchaseInvoice(invoiceId: string, revertStockAndPayable: boolean = true): void {
    const list = this.getPurchaseInvoices();
    const inv = list.find(i => i.id === invoiceId);
    if (!inv) return;

    if (revertStockAndPayable) {
      // 1. Revert distributor payable balance
      if (inv.distributorId && inv.grandTotal) {
        this.updateSupplierPayable(inv.distributorId, -inv.grandTotal);
      }

      // 2. Adjust inward inventory batches
      if (Array.isArray(inv.items)) {
        for (const item of inv.items) {
          const totalQty = item.totalQuantity || (item.billedQuantity + (item.freeQuantity || 0));
          if (item.medicineId && item.batchNumber && totalQty > 0) {
            this.adjustBatchStock(
              item.medicineId,
              item.batchNumber,
              -totalQty,
              `Inward Bill #${inv.invoiceNo} Deleted`
            );
          }
        }
      }
    }

    const remaining = list.filter(i => i.id !== invoiceId);
    this.savePurchaseInvoices(remaining);
  }

  static updatePurchaseInvoiceAttachment(invoiceId: string, attachment: PurchaseInvoice['attachment']): PurchaseInvoice | null {
    const list = this.getPurchaseInvoices();
    const inv = list.find(i => i.id === invoiceId);
    if (!inv) return null;
    inv.attachment = attachment;
    this.savePurchaseInvoices(list);
    return inv;
  }

  static updatePurchaseInvoicePaymentStatus(invoiceId: string, paymentStatus: PurchaseInvoice['paymentStatus']): void {
    const list = this.getPurchaseInvoices();
    const inv = list.find(i => i.id === invoiceId);
    if (inv) {
      inv.paymentStatus = paymentStatus;
      if (paymentStatus === 'Paid') {
        const grandTotal = inv.grandTotal || 0;
        const remaining = inv.balanceAmount ?? (grandTotal - (inv.paidAmount || 0));
        inv.paidAmount = grandTotal;
        inv.balanceAmount = 0;
        if (remaining > 0 && inv.distributorId) {
          this.updateSupplierPayable(inv.distributorId, -remaining);
        }
      }
      this.savePurchaseInvoices(list);
    }
  }

  // Record a partial or full payment towards a supplier purchase invoice
  static recordSupplierPayment(
    invoiceId: string,
    payment: {
      amount: number;
      paymentMethod: string;
      referenceNo?: string;
      notes?: string;
      recordedBy?: string;
    }
  ): PurchaseInvoice | null {
    const list = this.getPurchaseInvoices();
    const inv = list.find(i => i.id === invoiceId);
    if (!inv) return null;

    const grandTotal = inv.grandTotal || 0;
    const currentPaid = inv.paidAmount != null ? inv.paidAmount : (inv.paymentStatus === 'Paid' ? grandTotal : 0);
    const payAmt = Math.max(0, Math.min(grandTotal - currentPaid, payment.amount));
    const newPaid = currentPaid + payAmt;
    const newBalance = Math.max(0, grandTotal - newPaid);

    inv.paidAmount = newPaid;
    inv.balanceAmount = newBalance;
    inv.paymentStatus = newBalance <= 0 ? 'Paid' : 'Partially Paid';
    inv.paymentMethod = payment.paymentMethod;

    const newPaymentEntry: SupplierPaymentEntry = {
      id: `sp-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      amount: payAmt,
      paymentMethod: payment.paymentMethod,
      referenceNo: payment.referenceNo,
      notes: payment.notes,
      recordedBy: payment.recordedBy || 'Finance Desk'
    };

    inv.payments = [...(inv.payments || []), newPaymentEntry];
    this.savePurchaseInvoices(list);

    // Deduct paid amount from distributor outstanding payable
    if (inv.distributorId && payAmt > 0) {
      this.updateSupplierPayable(inv.distributorId, -payAmt);
    }

    return inv;
  }

  // Purchase Returns & Debit Notes
  static getPurchaseReturns(): PurchaseReturn[] {
    return this.getItem<PurchaseReturn[]>(STORAGE_KEYS.PURCHASE_RETURNS, INITIAL_PURCHASE_RETURNS);
  }

  static addPurchaseReturn(pr: PurchaseReturn): void {
    const returns = this.getPurchaseReturns();
    returns.unshift(pr);
    this.setItem(STORAGE_KEYS.PURCHASE_RETURNS, returns);

    // Deduct stock from returned batch
    for (const item of pr.items) {
      this.adjustBatchStock(item.medicineId, item.batchNumber, -item.quantity, `Purchase Return ${pr.id}`);
    }

    // Adjust Accounts Payable balance for the supplier
    if (pr.accountsPayableAdjusted) {
      this.updateSupplierPayable(pr.supplierId, -pr.totalDebitAmount);
    }
  }

  // Appointments
  static getAppointments(): Appointment[] {
    return this.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  }

  static addAppointment(apt: Appointment): void {
    const list = this.getAppointments();
    list.unshift(apt);
    this.setItem(STORAGE_KEYS.APPOINTMENTS, list);
  }

  static updateAppointmentStatus(aptId: string, status: Appointment['status']): void {
    const list = this.getAppointments();
    const apt = list.find(a => a.id === aptId);
    if (apt) {
      apt.status = status;
      this.setItem(STORAGE_KEYS.APPOINTMENTS, list);
    }
  }

  // Expenses
  static getExpenses(): OperatingExpense[] {
    return this.getItem<OperatingExpense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  }

  static addExpense(exp: OperatingExpense): void {
    const list = this.getExpenses();
    list.unshift(exp);
    this.setItem(STORAGE_KEYS.EXPENSES, list);
  }

  // Clinic Details & Consultations
  static getClinicDetails(): ClinicDetails {
    return this.getItem<ClinicDetails>(STORAGE_KEYS.CLINIC_DETAILS, CITY_MEDICAL_CLINIC_DETAILS);
  }

  static saveClinicDetails(details: ClinicDetails): void {
    this.setItem(STORAGE_KEYS.CLINIC_DETAILS, details);
  }

  static getConsultations(): ClinicConsultation[] {
    const list = this.getItem<ClinicConsultation[]>(STORAGE_KEYS.CONSULTATIONS, INITIAL_CONSULTATIONS);
    return (list || []).map(c => ({
      ...c,
      prescriptions: Array.isArray(c.prescriptions) ? c.prescriptions : []
    }));
  }

  static saveConsultations(list: ClinicConsultation[]): void {
    this.setItem(STORAGE_KEYS.CONSULTATIONS, list);
  }

  static addConsultation(consultation: ClinicConsultation): void {
    const list = this.getConsultations();
    list.unshift(consultation);
    this.setItem(STORAGE_KEYS.CONSULTATIONS, list);

    // Also auto-update appointment status if linked
    if (consultation.appointmentId) {
      this.updateAppointmentStatus(consultation.appointmentId, 'Completed');
    }

    // Auto-create refill reminders if prescription has long-term maintenance drugs (e.g., duration >= 15 days)
    const rxList = Array.isArray(consultation.prescriptions) ? consultation.prescriptions : [];
    if (consultation.patientId && rxList.length > 0) {
      const patients = this.getPatients();
      const patient = patients.find(p => p.id === consultation.patientId);
      if (patient) {
        patient.refillReminders = Array.isArray(patient.refillReminders) ? patient.refillReminders : [];
        rxList.forEach(rx => {
          if (rx.durationDays >= 15) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + rx.durationDays - 3); // Alert 3 days before supply runs out
            const newReminder = {
              id: `ref-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              patientId: patient.id,
              medicineName: rx.medicineName,
              dosage: rx.dosage,
              prescribedDate: new Date().toISOString().split('T')[0],
              daysSupply: rx.durationDays,
              nextRefillDue: dueDate.toISOString().split('T')[0],
              status: 'Active' as const
            };
            patient.refillReminders.unshift(newReminder);
          }
        });
        this.savePatients(patients);
      }
    }
  }

  static markConsultationDispensed(conId: string, invoiceId?: string): void {
    const list = this.getConsultations();
    const con = list.find(c => c.id === conId);
    if (con) {
      con.dispensedInPharmacy = true;
      if (invoiceId) con.posInvoiceId = invoiceId;
      this.saveConsultations(list);
    }
  }

  // Reset to initial demo dataset
  static resetToDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.MEDICINES);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(STORAGE_KEYS.DOCTORS);
    localStorage.removeItem(STORAGE_KEYS.PATIENTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.SALES_RETURNS);
    localStorage.removeItem(STORAGE_KEYS.PURCHASE_ORDERS);
    localStorage.removeItem(STORAGE_KEYS.PURCHASE_RETURNS);
    localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.CLINIC_DETAILS);
    localStorage.removeItem(STORAGE_KEYS.CONSULTATIONS);
    localStorage.removeItem(STORAGE_KEYS.PURCHASE_INVOICES);
  }

  static saveTransactions(transactions: SaleTransaction[]): void {
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  static saveSalesReturns(returns: SalesReturn[]): void {
    this.setItem(STORAGE_KEYS.SALES_RETURNS, returns);
  }

  static savePurchaseOrders(orders: PurchaseOrder[]): void {
    this.setItem(STORAGE_KEYS.PURCHASE_ORDERS, orders);
  }

  static savePurchaseReturns(returns: PurchaseReturn[]): void {
    this.setItem(STORAGE_KEYS.PURCHASE_RETURNS, returns);
  }

  static saveAppointments(appointments: Appointment[]): void {
    this.setItem(STORAGE_KEYS.APPOINTMENTS, appointments);
  }

  // Cryptographic JSON Backup Export & Import
  static exportDatabaseJSON(): string {
    const fullBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile: this.getPharmacyProfile(),
      medicines: this.getMedicines(),
      suppliers: this.getSuppliers(),
      doctors: this.getDoctors(),
      patients: this.getPatients(),
      transactions: this.getTransactions(),
      salesReturns: this.getSalesReturns(),
      purchaseOrders: this.getPurchaseOrders(),
      purchaseReturns: this.getPurchaseReturns(),
      purchaseInvoices: this.getPurchaseInvoices(),
      appointments: this.getAppointments(),
      expenses: this.getExpenses()
    };
    return JSON.stringify(fullBackup, null, 2);
  }

  static importDatabaseJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) this.savePharmacyProfile(data.profile);
      if (data.medicines) this.saveMedicines(data.medicines);
      if (data.suppliers) this.saveSuppliers(data.suppliers);
      if (data.doctors) this.saveDoctors(data.doctors);
      if (data.patients) this.savePatients(data.patients);
      if (data.transactions) this.saveTransactions(data.transactions);
      if (data.salesReturns) this.saveSalesReturns(data.salesReturns);
      if (data.purchaseOrders) this.savePurchaseOrders(data.purchaseOrders);
      if (data.purchaseReturns) this.savePurchaseReturns(data.purchaseReturns);
      if (data.purchaseInvoices) this.savePurchaseInvoices(data.purchaseInvoices);
      if (data.appointments) this.saveAppointments(data.appointments);
      if (data.shortLinks) this.saveShortLinks(data.shortLinks);
      return true;
    } catch (e) {
      console.error('Failed to import database JSON:', e);
      return false;
    }
  }

  // Short Links & Web Portal
  static getShortLinks(): ShortLink[] {
    let list = this.getItem<ShortLink[]>(STORAGE_KEYS.SHORT_LINKS, INITIAL_SHORT_LINKS);
    let changed = false;
    for (const initLink of INITIAL_SHORT_LINKS) {
      if (!list.some(l => l.id === initLink.id || l.code === initLink.code)) {
        list.push(initLink);
        changed = true;
      }
    }
    if (changed) {
      this.saveShortLinks(list);
    }
    return list;
  }

  static saveShortLinks(links: ShortLink[]): void {
    this.setItem(STORAGE_KEYS.SHORT_LINKS, links);
  }

  static addShortLink(data: Omit<ShortLink, 'id' | 'createdAt' | 'clicks' | 'isActive' | 'shortUrl'> & Partial<ShortLink>): ShortLink {
    const list = this.getShortLinks();
    const cleanCode = (data.code || `link-${Date.now().toString(36)}`).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
    const domain = data.domain || 'cityrx.link';
    const newLink: ShortLink = {
      id: data.id || `sl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: cleanCode,
      domain,
      shortUrl: `https://${domain}/${cleanCode}`,
      originalUrl: data.originalUrl || `/`,
      title: data.title || `Short Link ${cleanCode}`,
      category: data.category || 'custom',
      metadata: data.metadata,
      clicks: data.clicks ?? 0,
      createdAt: data.createdAt || new Date().toISOString(),
      isActive: data.isActive ?? true,
      expiresAt: data.expiresAt
    };

    const existingIndex = list.findIndex(l => l.code === newLink.code);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...newLink, clicks: list[existingIndex].clicks };
    } else {
      list.unshift(newLink);
    }
    this.saveShortLinks(list);
    return newLink;
  }

  static deleteShortLink(id: string): void {
    const list = this.getShortLinks().filter(l => l.id !== id);
    this.saveShortLinks(list);
  }

  static updateShortLink(link: ShortLink): void {
    const list = this.getShortLinks();
    const index = list.findIndex(l => l.id === link.id);
    if (index >= 0) {
      list[index] = { ...link, updatedAt: new Date().toISOString() };
      this.saveShortLinks(list);
    }
  }

  static incrementShortLinkClicks(idOrCode: string): void {
    const list = this.getShortLinks();
    const item = list.find(l => l.id === idOrCode || l.code.toLowerCase() === idOrCode.toLowerCase());
    if (item) {
      item.clicks = (item.clicks || 0) + 1;
      this.saveShortLinks(list);
    }
  }

  static createShortLinkForInvoice(invoiceId: string, patientName?: string, amount?: number, phone?: string): ShortLink {
    const code = `inv-${invoiceId.replace(/^INV-/, '').toLowerCase()}`;
    return this.addShortLink({
      code,
      domain: 'cityrx.link',
      originalUrl: `/invoice/${invoiceId}`,
      title: `Digital Tax Invoice #${invoiceId}${patientName ? ` (${patientName})` : ''}`,
      category: 'invoice',
      metadata: {
        invoiceId,
        patientName,
        patientPhone: phone,
        amount,
        description: `Official digital bill issued by City Medical, Melur.`
      }
    });
  }

  static createShortLinkForMedicine(medicine: Medicine): ShortLink {
    const code = medicine.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const price = medicine.batches[0]?.sellingPrice || 0;
    return this.addShortLink({
      code,
      domain: 'cityrx.link',
      originalUrl: `/medicine/${medicine.id}`,
      title: `${medicine.name} - ${medicine.genericName}`,
      category: 'medicine',
      metadata: {
        medicineId: medicine.id,
        medicineName: medicine.name,
        genericName: medicine.genericName,
        manufacturer: medicine.manufacturer,
        amount: price,
        description: `${medicine.form} - ${medicine.strength}. Available in-stock at City Medical.`
      }
    });
  }

  // ==========================================
  // SALES DRAFTS (MANUAL SAVE & REMAIN IN DRAFTS)
  // ==========================================
  static getSalesDrafts(): SalesDraft[] {
    let drafts = this.getItem<SalesDraft[]>(STORAGE_KEYS.SALES_DRAFTS, []);

    // Also check and migrate any legacy held bills
    try {
      const legacyHeld = localStorage.getItem('cityrx_held_bills_v1');
      if (legacyHeld) {
        const parsed = JSON.parse(legacyHeld);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated: SalesDraft[] = parsed.map((item: any) => ({
            id: item.id || `HOLD-${Date.now().toString().slice(-4)}`,
            timestamp: item.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: item.date || new Date().toISOString(),
            title: item.title || `Counter Sale Draft (${item.patientName || 'Walk-in'})`,
            notes: item.notes || '',
            patientName: item.patientName || 'Walk-in Customer',
            patientId: item.patientId,
            doctorId: item.doctorId,
            doctorName: item.doctorName,
            cart: item.cart || [],
            itemCount: (item.cart || []).length,
            subtotal: item.totalAmount || 0,
            totalDiscount: 0,
            totalTax: 0,
            grandTotal: item.totalAmount || 0,
            cashierName: item.cashierName
          }));

          // Merge any non-duplicate items
          const existingIds = new Set(drafts.map(d => d.id));
          migrated.forEach(m => {
            if (!existingIds.has(m.id)) {
              drafts.push(m);
            }
          });
          this.setItem(STORAGE_KEYS.SALES_DRAFTS, drafts);
        }
      }
    } catch (err) {
      console.warn('Error reading legacy held bills:', err);
    }

    return drafts;
  }

  static saveSalesDraft(draft: SalesDraft): void {
    const drafts = this.getSalesDrafts();
    const existingIndex = drafts.findIndex(d => d.id === draft.id);
    if (existingIndex >= 0) {
      drafts[existingIndex] = draft;
    } else {
      drafts.unshift(draft);
    }
    this.setItem(STORAGE_KEYS.SALES_DRAFTS, drafts);
    // Keep legacy key in sync for backwards compatibility
    try {
      localStorage.setItem('cityrx_held_bills_v1', JSON.stringify(drafts));
    } catch (e) {
      // ignore
    }
  }

  static deleteSalesDraft(id: string): void {
    let drafts = this.getSalesDrafts();
    drafts = drafts.filter(d => d.id !== id);
    this.setItem(STORAGE_KEYS.SALES_DRAFTS, drafts);
    try {
      localStorage.setItem('cityrx_held_bills_v1', JSON.stringify(drafts));
    } catch (e) {
      // ignore
    }
  }

  static clearAllSalesDrafts(): void {
    this.setItem(STORAGE_KEYS.SALES_DRAFTS, []);
    try {
      localStorage.removeItem('cityrx_held_bills_v1');
    } catch (e) {
      // ignore
    }
  }

  // ==========================================
  // PURCHASE DRAFTS (MANUAL SAVE & REMAIN IN DRAFTS)
  // ==========================================
  static getPurchaseDrafts(): PurchaseDraft[] {
    return this.getItem<PurchaseDraft[]>(STORAGE_KEYS.PURCHASE_DRAFTS, []);
  }

  static savePurchaseDraft(draft: PurchaseDraft): void {
    const drafts = this.getPurchaseDrafts();
    const existingIndex = drafts.findIndex(d => d.id === draft.id);
    if (existingIndex >= 0) {
      drafts[existingIndex] = draft;
    } else {
      drafts.unshift(draft);
    }
    this.setItem(STORAGE_KEYS.PURCHASE_DRAFTS, drafts);
  }

  static deletePurchaseDraft(id: string): void {
    const drafts = this.getPurchaseDrafts().filter(d => d.id !== id);
    this.setItem(STORAGE_KEYS.PURCHASE_DRAFTS, drafts);
  }

  static clearAllPurchaseDrafts(): void {
    this.setItem(STORAGE_KEYS.PURCHASE_DRAFTS, []);
  }

  // ==========================================
  // CUSTOMER ONLINE ORDERS & DELIVERY TRACKING
  // ==========================================
  static getCustomerOnlineOrders(): CustomerOnlineOrder[] {
    const defaultOrders: CustomerOnlineOrder[] = [
      {
        id: 'ORD-2026-8910',
        orderDate: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
        customerName: 'Muthu Kumar',
        customerPhone: '9842144321',
        customerEmail: 'muthu.kumar@gmail.com',
        deliveryType: 'home_delivery',
        deliveryAddress: {
          addressLine: '14, Alagar Kovil Main Road, Opposite SBI ATM',
          locality: 'Melur Town',
          city: 'Melur',
          taluk: 'Melur Taluk',
          district: 'Madurai District',
          pincode: '625103',
          latitude: 10.0345,
          longitude: 78.3372,
          distanceKm: 1.2,
          deliveryNotes: 'Call on reaching the blue gate. Senior citizen home.',
          isGpsDetected: true
        },
        items: [
          {
            medicineId: 'med-001',
            medicineName: 'Paracetamol 650mg (Dolo 650)',
            genericName: 'Paracetamol 650mg',
            quantity: 2,
            unitPrice: 32.50,
            total: 65.00,
            pack: '1 Strip (15 Tablets)',
            dosageForm: 'Tablet',
            requiresPrescription: false
          },
          {
            medicineId: 'med-003',
            medicineName: 'Azithromycin 500mg (Azee 500)',
            genericName: 'Azithromycin 500mg',
            quantity: 1,
            unitPrice: 119.00,
            total: 119.00,
            pack: '1 Strip (5 Tablets)',
            dosageForm: 'Tablet',
            requiresPrescription: true
          }
        ],
        prescriptionRequired: true,
        prescriptionVerified: true,
        prescriptionFileName: 'Doctor_Prescription_Dr_Senthil.jpg',
        subtotal: 184.00,
        deliveryFee: 0,
        discount: 10.00,
        grandTotal: 174.00,
        paymentMethod: 'UPI',
        paymentStatus: 'Paid',
        upiReference: 'UPI-RR-904817263541',
        orderStatus: 'Out for Delivery',
        estimatedDeliveryTime: '30 mins (Arriving by 4:15 PM)',
        notes: 'Express 45-min local pharmacy delivery dispatched via rider.'
      },
      {
        id: 'ORD-2026-8911',
        orderDate: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        customerName: 'Kavitha Ramachandran',
        customerPhone: '9443278910',
        deliveryType: 'store_pickup',
        deliveryAddress: {
          addressLine: 'City Medical Counter Pickup - Express Self Pickup',
          locality: 'Chokkalingapuram',
          city: 'Melur',
          pincode: '625103',
          distanceKm: 0.1
        },
        items: [
          {
            medicineId: 'med-004',
            medicineName: 'Metformin 500mg (Glycomet 500)',
            genericName: 'Metformin Hydrochloride 500mg',
            quantity: 3,
            unitPrice: 42.00,
            total: 126.00,
            pack: '1 Strip (20 Tablets)',
            dosageForm: 'Tablet',
            requiresPrescription: true
          },
          {
            medicineId: 'med-006',
            medicineName: 'ORS Electral Powder (Apple Flavor)',
            genericName: 'Oral Rehydration Salts IP',
            quantity: 4,
            unitPrice: 21.50,
            total: 86.00,
            pack: '1 Sachet (21.8g)',
            dosageForm: 'Sachet',
            requiresPrescription: false
          }
        ],
        prescriptionRequired: true,
        prescriptionVerified: true,
        subtotal: 212.00,
        deliveryFee: 0,
        discount: 12.00,
        grandTotal: 200.00,
        paymentMethod: 'UPI',
        paymentStatus: 'Paid',
        upiReference: 'UPI-RR-887412093812',
        orderStatus: 'Packed',
        estimatedDeliveryTime: 'Ready at Counter for Express Pickup',
        notes: 'Customer will collect from counter after 5:00 PM.'
      }
    ];

    return this.getItem<CustomerOnlineOrder[]>(STORAGE_KEYS.CUSTOMER_ONLINE_ORDERS, defaultOrders);
  }

  static saveCustomerOnlineOrders(orders: CustomerOnlineOrder[]): void {
    this.setItem(STORAGE_KEYS.CUSTOMER_ONLINE_ORDERS, orders);
  }

  static addCustomerOnlineOrder(order: CustomerOnlineOrder): void {
    const orders = this.getCustomerOnlineOrders();
    orders.unshift(order);
    this.saveCustomerOnlineOrders(orders);
  }

  static updateCustomerOnlineOrderStatus(
    orderId: string,
    status: OnlineOrderStatus,
    notes?: string
  ): CustomerOnlineOrder | null {
    const orders = this.getCustomerOnlineOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      orders[idx].orderStatus = status;
      if (notes) {
        orders[idx].notes = notes;
      }
      if (status === 'Prescription Verified') {
        orders[idx].prescriptionVerified = true;
      }
      this.saveCustomerOnlineOrders(orders);
      return orders[idx];
    }
    return null;
  }

  static updateCustomerOnlineOrderPayment(
    orderId: string,
    paymentStatus: OnlinePaymentStatus,
    upiRef?: string
  ): CustomerOnlineOrder | null {
    const orders = this.getCustomerOnlineOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      orders[idx].paymentStatus = paymentStatus;
      if (upiRef) {
        orders[idx].upiReference = upiRef;
      }
      this.saveCustomerOnlineOrders(orders);
      return orders[idx];
    }
    return null;
  }

  static deleteCustomerOnlineOrder(orderId: string): void {
    const orders = this.getCustomerOnlineOrders().filter(o => o.id !== orderId);
    this.saveCustomerOnlineOrders(orders);
  }

  // ==========================================
  // CUSTOMER SERVICE INQUIRIES & HELPLINE
  // ==========================================
  static getCustomerServiceInquiries(): CustomerServiceInquiry[] {
    const defaultInquiries: CustomerServiceInquiry[] = [
      {
        id: 'INQ-2026-501',
        customerName: 'S. Rajasekaran',
        customerPhone: '9842188442',
        inquiryType: 'medicine_availability',
        medicineRequested: 'Insulin Glargine (Lantus 100IU/ml Cartridge)',
        message: 'Need 2 cartridges of Lantus insulin urgently. Do you keep cold-chain stock available today?',
        status: 'Pharmacist Responded',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        responseNotes: 'Cold-chain 4°C stock is available. Reserved 2 cartridges for customer.'
      },
      {
        id: 'INQ-2026-502',
        customerName: 'Deepa Ramesh',
        customerPhone: '9789123456',
        inquiryType: 'pharmacist_consult',
        message: 'My father has mild dizziness after taking blood pressure tablets. Can pharmacist Anusya Begum call me?',
        status: 'Open',
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      }
    ];

    return this.getItem<CustomerServiceInquiry[]>(STORAGE_KEYS.CUSTOMER_SERVICE_INQUIRIES, defaultInquiries);
  }

  static addCustomerServiceInquiry(inquiry: CustomerServiceInquiry): void {
    const list = this.getCustomerServiceInquiries();
    list.unshift(inquiry);
    this.setItem(STORAGE_KEYS.CUSTOMER_SERVICE_INQUIRIES, list);
  }

  static updateCustomerServiceInquiry(
    id: string,
    status: CustomerServiceInquiry['status'],
    responseNotes?: string
  ): void {
    const list = this.getCustomerServiceInquiries();
    const idx = list.findIndex(item => item.id === id);
    if (idx >= 0) {
      list[idx].status = status;
      if (responseNotes) {
        list[idx].responseNotes = responseNotes;
      }
      this.setItem(STORAGE_KEYS.CUSTOMER_SERVICE_INQUIRIES, list);
    }
  }

  // ==========================================
  // SOFTWARE CONTROLLER / MULTI-PHARMACY TENANTS
  // ==========================================
  static getPharmacyTenants(): PharmacyTenant[] {
    return this.getItem<PharmacyTenant[]>(STORAGE_KEYS.PHARMACY_TENANTS, INITIAL_PHARMACY_TENANTS);
  }

  static savePharmacyTenants(tenants: PharmacyTenant[]): void {
    this.setItem(STORAGE_KEYS.PHARMACY_TENANTS, tenants);
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('pharmacy:tenants-updated', { detail: tenants }));
      } catch {}
    }
  }

  static addPharmacyTenant(tenant: PharmacyTenant): void {
    const tenants = this.getPharmacyTenants();
    const existingIndex = tenants.findIndex(t => t.id === tenant.id || t.pharmacyCode === tenant.pharmacyCode);
    if (existingIndex >= 0) {
      tenants[existingIndex] = tenant;
    } else {
      tenants.push(tenant);
    }
    this.savePharmacyTenants(tenants);
  }

  static updatePharmacyTenant(tenant: PharmacyTenant): void {
    const tenants = this.getPharmacyTenants();
    const index = tenants.findIndex(t => t.id === tenant.id);
    if (index >= 0) {
      tenants[index] = tenant;
      this.savePharmacyTenants(tenants);

      // If updating currently active pharmacy profile, sync profile too
      const currentProfile = this.getPharmacyProfile();
      if (currentProfile.pharmacyCode === tenant.pharmacyCode || tenant.id === 'pharm-001') {
        const updatedProfile: PharmacyProfile = {
          ...currentProfile,
          name: tenant.name,
          pharmacyCode: tenant.pharmacyCode,
          businessType: tenant.businessType,
          retailActive: tenant.retailActive,
          wholesaleActive: tenant.wholesaleActive,
          tagline: tenant.tagline,
          mobile: tenant.mobile,
          email: tenant.email,
          addressLine1: tenant.addressLine1,
          gstin: tenant.gstin,
          drugLicenseNo: tenant.drugLicenseNo,
          wholesaleLicenseNo: tenant.wholesaleLicenseNo,
          retailLicenseNo: tenant.retailLicenseNo,
          upiId: tenant.paymentUpiId || currentProfile.upiId
        };
        this.savePharmacyProfile(updatedProfile);
      }
    }
  }

  static deletePharmacyTenant(id: string): void {
    const tenants = this.getPharmacyTenants().filter(t => t.id !== id);
    this.savePharmacyTenants(tenants);
  }

  static toggleTenantRetail(id: string): boolean {
    const tenants = this.getPharmacyTenants();
    const t = tenants.find(item => item.id === id);
    if (t) {
      t.retailActive = !t.retailActive;
      this.savePharmacyTenants(tenants);

      const profile = this.getPharmacyProfile();
      if (profile.pharmacyCode === t.pharmacyCode || id === 'pharm-001') {
        profile.retailActive = t.retailActive;
        this.savePharmacyProfile(profile);
      }
      return t.retailActive;
    }
    return false;
  }

  static toggleTenantWholesale(id: string): boolean {
    const tenants = this.getPharmacyTenants();
    const t = tenants.find(item => item.id === id);
    if (t) {
      t.wholesaleActive = !t.wholesaleActive;
      this.savePharmacyTenants(tenants);

      const profile = this.getPharmacyProfile();
      if (profile.pharmacyCode === t.pharmacyCode || id === 'pharm-001') {
        profile.wholesaleActive = t.wholesaleActive;
        this.savePharmacyProfile(profile);
      }
      return t.wholesaleActive;
    }
    return false;
  }

  static switchActiveTenant(tenant: PharmacyTenant): void {
    const profile = this.getPharmacyProfile();
    const updated: PharmacyProfile = {
      ...profile,
      name: tenant.name,
      pharmacyCode: tenant.pharmacyCode,
      businessType: tenant.businessType,
      retailActive: tenant.retailActive,
      wholesaleActive: tenant.wholesaleActive,
      tagline: tenant.tagline,
      addressLine1: tenant.addressLine1,
      taluk: tenant.city + ' Taluk',
      district: tenant.district,
      state: tenant.state,
      pincode: tenant.pincode,
      mobile: tenant.mobile,
      email: tenant.email,
      gstin: tenant.gstin,
      drugLicenseNo: tenant.drugLicenseNo,
      wholesaleLicenseNo: tenant.wholesaleLicenseNo,
      retailLicenseNo: tenant.retailLicenseNo,
      upiId: tenant.paymentUpiId || profile.upiId
    };
    this.savePharmacyProfile(updated);
    this.setBusinessType(tenant.businessType);
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TENANT_ID, tenant.id);
    } catch {}
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('pharmacy:tenant-switched', { detail: tenant }));
      } catch {}
    }
  }

  // ==========================================
  // WHOLESALE B2B PAYMENT COLLECTIONS
  // ==========================================
  static getWholesalePayments(): WholesalePaymentCollection[] {
    return this.getItem<WholesalePaymentCollection[]>(STORAGE_KEYS.WHOLESALE_PAYMENTS, INITIAL_WHOLESALE_PAYMENTS);
  }

  static saveWholesalePayments(payments: WholesalePaymentCollection[]): void {
    this.setItem(STORAGE_KEYS.WHOLESALE_PAYMENTS, payments);
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('pharmacy:wholesale-payments-updated', { detail: payments }));
      } catch {}
    }
  }

  static addWholesalePayment(payment: WholesalePaymentCollection): void {
    const list = this.getWholesalePayments();
    list.unshift(payment);
    this.saveWholesalePayments(list);

    // Also deduct from buyer's outstandingBalance if buyer exists
    const buyers = this.getWholesaleBuyers();
    const bIdx = buyers.findIndex(b => b.id === payment.buyerId || b.businessName === payment.buyerName);
    if (bIdx >= 0) {
      buyers[bIdx].outstandingBalance = Math.max(0, (buyers[bIdx].outstandingBalance || 0) - payment.amount);
      this.saveWholesaleBuyers(buyers);
    }
  }
}

