import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDocFromServer,
  onSnapshot,
  Firestore,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { Medicine, SaleTransaction, PurchaseInvoice, WholesaleBuyer, SalesReturn, PurchaseReturn, User } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
    },
    operationType,
    path
  };
  console.warn('Firestore Warning / Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Initialize Firebase App singleton
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with the exact database ID from config
export const db: Firestore = getFirestore(
  firebaseApp,
  firebaseConfig.firestoreDatabaseId || undefined
);

export const auth = getAuth(firebaseApp);
export const storage = getStorage(firebaseApp);

let isCloudConnected = false;
export const isFirestoreOnline = () => isCloudConnected;

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const testDocRef = doc(db, 'system', 'connection_test');
    await setDoc(testDocRef, {
      lastChecked: new Date().toISOString(),
      client: 'City Rx Cloud Terminal',
      version: '2026.1'
    }, { merge: true });
    isCloudConnected = true;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pharmacy:cloud-sync-status', {
        detail: { status: 'connected', timestamp: Date.now() }
      }));
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system/connection_test');
    isCloudConnected = false;
    return false;
  }
}

// Background sync test
testFirestoreConnection();

/**
 * Real-time synchronization helper:
 * Pushes sales, medicines, purchases, buyers to Firestore so that
 * any computer terminal and mobile phone app instantly stay in sync.
 */
export class CloudSyncService {
  static async pushSale(sale: SaleTransaction): Promise<void> {
    try {
      const docRef = doc(db, 'sales', sale.id);
      await setDoc(docRef, {
        ...sale,
        syncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `sales/${sale.id}`);
    }
  }

  static async pushMedicine(medicine: Medicine): Promise<void> {
    try {
      const docRef = doc(db, 'medicines', medicine.id);
      await setDoc(docRef, {
        ...medicine,
        syncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `medicines/${medicine.id}`);
    }
  }

  static async pushPurchase(purchase: PurchaseInvoice): Promise<void> {
    try {
      const docRef = doc(db, 'purchases', purchase.id);
      await setDoc(docRef, {
        ...purchase,
        syncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `purchases/${purchase.id}`);
    }
  }

  static async pushWholesaleBuyer(buyer: WholesaleBuyer): Promise<void> {
    try {
      const docRef = doc(db, 'wholesale_buyers', buyer.id);
      await setDoc(docRef, {
        ...buyer,
        syncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `wholesale_buyers/${buyer.id}`);
    }
  }

  static async pushPharmacyTenant(tenant: any): Promise<void> {
    try {
      const docRef = doc(db, 'pharmacies', tenant.id);
      await setDoc(docRef, {
        ...tenant,
        syncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `pharmacies/${tenant.id}`);
    }
  }

  /**
   * Listen to real-time sales so mobile app receives new invoices from computer
   */
  static subscribeSales(onSalesUpdate: (sales: SaleTransaction[]) => void): () => void {
    const colRef = collection(db, 'sales');
    return onSnapshot(colRef, (snapshot) => {
      const items: SaleTransaction[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as SaleTransaction);
      });
      if (items.length > 0) {
        onSalesUpdate(items);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sales');
    });
  }

  /**
   * Listen to real-time medicines so stock adjusted on computer updates mobile app
   */
  static subscribeMedicines(onMedicinesUpdate: (meds: Medicine[]) => void): () => void {
    const colRef = collection(db, 'medicines');
    return onSnapshot(colRef, (snapshot) => {
      const items: Medicine[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as Medicine);
      });
      if (items.length > 0) {
        onMedicinesUpdate(items);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'medicines');
    });
  }
}
