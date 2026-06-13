import { db, auth } from '../lib/firebase';
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp, or, setDoc, QueryConstraint, onSnapshot, limit } from '../lib/firestore-compat';
import { Package, Order, Settings, OrderStatus, PaymentMethod, Banner, Service, Event, AccountListing, AccountOrder, AppNotification } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const PACKAGES_COL = 'packages';
const ORDERS_COL = 'orders';
const SETTINGS_COL = 'settings';
const BANNERS_COL = 'banners';
const SERVICES_COL = 'services';
const EVENTS_COL = 'events';
const SERVICE_TEMPLATES_COL = 'serviceTemplates';
const ACCOUNTS_COL = 'accounts';
const ACCOUNT_ORDERS_COL = 'accountOrders';
const NOTIFICATIONS_COL = 'notifications';

export const mapDocData = <T>(doc: any): T => {
  const data = doc.data();
  let createdAt = 0;
  if (data.createdAt?.toDate) {
    createdAt = data.createdAt.toDate().getTime();
  } else if (data.createdAt?.seconds) {
    createdAt = data.createdAt.seconds * 1000;
  } else if (data.createdAt) {
    createdAt = new Date(data.createdAt).getTime();
  } else {
    createdAt = Date.now();
  }
  return { id: doc.id, ...data, createdAt } as unknown as T;
};

// --- Service Templates ---
export async function getServiceTemplates(serviceId: string, onlyActive = true): Promise<any[]> {
  const constraints: QueryConstraint[] = [where('serviceId', '==', serviceId)];
  if (onlyActive) constraints.push(where('isActive', '==', true));
  
  try {
    const q = query(collection(db, SERVICE_TEMPLATES_COL), ...constraints);
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => mapDocData<any>(doc));
    return data.sort((a: any, b: any) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, SERVICE_TEMPLATES_COL);
    return [];
  }
}

export async function addServiceTemplate(data: Omit<any, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, SERVICE_TEMPLATES_COL), {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, SERVICE_TEMPLATES_COL);
    throw error;
  }
}

export async function updateServiceTemplate(id: string, data: Partial<any>): Promise<void> {
  try {
    await updateDoc(doc(db, SERVICE_TEMPLATES_COL, id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${SERVICE_TEMPLATES_COL}/${id}`);
  }
}

export async function deleteServiceTemplate(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, SERVICE_TEMPLATES_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${SERVICE_TEMPLATES_COL}/${id}`);
  }
}

// --- Services ---
export async function getServices(onlyActive = true): Promise<Service[]> {
  if (onlyActive && cache.services && isCacheValid(cache.services.timestamp)) {
    return cache.services.data;
  }

  if (onlyActive) {
    // Check localStorage if memory cache is empty
    const stored = getFromLocalStorage<Service[]>('services');
    if (stored && isCacheValid(stored.timestamp, 24 * 60 * 60 * 1000)) { // 24 hours for storage
      cache.services = stored;
      return stored.data;
    }
  }

  const constraints: QueryConstraint[] = [];
  if (onlyActive) constraints.push(where('isActive', '==', true));
  
  try {
    const q = query(collection(db, SERVICES_COL), ...constraints);
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => mapDocData<Service>(doc));
    const sorted = data.sort((a: any, b: any) => b.createdAt - a.createdAt);
    if (onlyActive) {
      cache.services = { data: sorted, timestamp: Date.now() };
      saveToLocalStorage('services', sorted);
    }
    return sorted;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, SERVICES_COL);
    return [];
  }
}

export async function getService(id: string): Promise<Service | null> {
  try {
    const docRef = doc(db, SERVICES_COL, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return mapDocData<Service>(snapshot);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${SERVICES_COL}/${id}`);
    return null;
  }
}

export async function addService(serviceData: Omit<Service, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, SERVICES_COL), {
      ...serviceData,
      createdAt: serverTimestamp()
    });
    cache.services = null;
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, SERVICES_COL);
    throw error;
  }
}

export async function updateService(id: string, serviceData: Partial<Service>): Promise<void> {
  try {
    await updateDoc(doc(db, SERVICES_COL, id), serviceData);
    cache.services = null;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${SERVICES_COL}/${id}`);
  }
}

export async function deleteService(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, SERVICES_COL, id));
    cache.services = null;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${SERVICES_COL}/${id}`);
  }
}

// --- Events ---
export async function getEvents(onlyActive = true): Promise<Event[]> {
  if (onlyActive && cache.events && isCacheValid(cache.events.timestamp)) {
    return cache.events.data;
  }

  if (onlyActive) {
    const stored = getFromLocalStorage<Event[]>('events');
    if (stored && isCacheValid(stored.timestamp, 24 * 60 * 60 * 1000)) {
      cache.events = stored;
      return stored.data;
    }
  }

  const constraints: QueryConstraint[] = [];
  if (onlyActive) constraints.push(where('isActive', '==', true));
  
  try {
    const q = query(collection(db, EVENTS_COL), ...constraints);
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => mapDocData<Event>(doc));
    const sorted = data.sort((a: any, b: any) => b.createdAt - a.createdAt);
    if (onlyActive) {
      cache.events = { data: sorted, timestamp: Date.now() };
      saveToLocalStorage('events', sorted);
    }
    return sorted;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, EVENTS_COL);
    return [];
  }
}

export async function addEvent(eventData: Omit<Event, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, EVENTS_COL), {
      ...eventData,
      createdAt: serverTimestamp()
    });
    cache.events = null;
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, EVENTS_COL);
    throw error;
  }
}

export async function updateEvent(id: string, eventData: Partial<Event>): Promise<void> {
  try {
    await updateDoc(doc(db, EVENTS_COL, id), eventData);
    cache.events = null;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${EVENTS_COL}/${id}`);
  }
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, EVENTS_COL, id));
    cache.events = null;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${EVENTS_COL}/${id}`);
  }
}

// --- Banners ---
export async function getBanners(onlyActive = true): Promise<Banner[]> {
  if (onlyActive && cache.banners && isCacheValid(cache.banners.timestamp)) {
    return cache.banners.data;
  }

  if (onlyActive) {
    const stored = getFromLocalStorage<Banner[]>('banners');
    if (stored && isCacheValid(stored.timestamp, 24 * 60 * 60 * 1000)) {
      cache.banners = stored;
      return stored.data;
    }
  }

  const constraints: QueryConstraint[] = [];
  if (onlyActive) constraints.push(where('isActive', '==', true));
  
  try {
    const q = query(collection(db, BANNERS_COL), ...constraints);
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => mapDocData<Banner>(doc));
    const sorted = data.sort((a, b) => (a.order || 0) - (b.order || 0));
    if (onlyActive) {
      cache.banners = { data: sorted, timestamp: Date.now() };
      saveToLocalStorage('banners', sorted);
    }
    return sorted;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, BANNERS_COL);
    return [];
  }
}

export async function addBanner(bannerData: Omit<Banner, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, BANNERS_COL), {
      ...bannerData,
      createdAt: serverTimestamp()
    });
    cache.banners = null;
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, BANNERS_COL);
    throw error;
  }
}

export async function updateBanner(id: string, bannerData: Partial<Banner>): Promise<void> {
  try {
    await updateDoc(doc(db, BANNERS_COL, id), bannerData);
    cache.banners = null;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${BANNERS_COL}/${id}`);
  }
}

export async function deleteBanner(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, BANNERS_COL, id));
    cache.banners = null;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${BANNERS_COL}/${id}`);
  }
}

// --- Cache Configuration ---
const CACHE_KEY_PREFIX = 'gr4d_cache_';
const cache = {
  packages: new Map<string, { data: Package[]; timestamp: number }>(),
  settings: null as { data: Settings; timestamp: number } | null,
  banners: null as { data: Banner[]; timestamp: number } | null,
  services: null as { data: Service[]; timestamp: number } | null,
  events: null as { data: Event[]; timestamp: number } | null,
};

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes for memory

function isCacheValid(timestamp: number, ttl = CACHE_TTL) {
  return Date.now() - timestamp < ttl;
}

function saveToLocalStorage(key: string, data: any) {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

function getFromLocalStorage<T>(key: string): { data: T; timestamp: number } | null {
  try {
    const item = localStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!item) return null;
    return JSON.parse(item);
  } catch (e) {
    return null;
  }
}

/**
 * Fetches all critical data for the home page in parallel to warm up the cache.
 */
export async function prewarmCache() {
  // Pre-load from localStorage first to memory
  const storedServices = getFromLocalStorage<Service[]>('services');
  if (storedServices) cache.services = storedServices;
  
  const storedBanners = getFromLocalStorage<Banner[]>('banners');
  if (storedBanners) cache.banners = storedBanners;

  const storedEvents = getFromLocalStorage<Event[]>('events');
  if (storedEvents) cache.events = storedEvents;

  const storedSettings = getFromLocalStorage<Settings>('settings');
  if (storedSettings) cache.settings = storedSettings;

  try {
    await Promise.all([
      getPackages(true),
      getServices(true),
      getEvents(true),
      getBanners(true),
      getSettings()
    ]);
  } catch (error) {
    console.warn('Cache prewarm partial failure:', error);
  }
}

// --- Settings ---
export async function getSettings(): Promise<Settings | null> {
  if (cache.settings && isCacheValid(cache.settings.timestamp)) {
    return cache.settings.data;
  }

  const stored = getFromLocalStorage<Settings>('settings');
  if (stored && isCacheValid(stored.timestamp, 24 * 60 * 60 * 1000)) {
    cache.settings = stored;
    return stored.data;
  }

  try {
    const docRef = doc(db, SETTINGS_COL, 'config');
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    const data = { ...snapshot.data() } as Settings;
    cache.settings = { data, timestamp: Date.now() };
    saveToLocalStorage('settings', data);
    return data;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${SETTINGS_COL}/config`);
    return null;
  }
}

export async function updateSettings(settings: Settings): Promise<void> {
  try {
    await setDoc(doc(db, SETTINGS_COL, 'config'), settings);
    cache.settings = null; // Invalidate cache
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COL}/config`);
  }
}

// --- Packages ---
export async function getPackages(onlyActive = true, gameId?: string): Promise<Package[]> {
  const cacheKey = `${onlyActive}-${gameId || 'all'}`;
  const cached = cache.packages.get(cacheKey);
  
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  const stored = getFromLocalStorage<Package[]>(`packages_${cacheKey}`);
  if (stored && isCacheValid(stored.timestamp, 24 * 60 * 60 * 1000)) {
    cache.packages.set(cacheKey, stored);
    return stored.data;
  }

  const constraints: QueryConstraint[] = [];
  if (onlyActive) constraints.push(where('isActive', '==', true));
  if (gameId) constraints.push(where('gameId', '==', gameId));
  
  try {
    const q = query(collection(db, PACKAGES_COL), ...constraints);
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => mapDocData<Package>(doc));
    const sortedData = data.sort((a: any, b: any) => b.createdAt - a.createdAt);
    
    cache.packages.set(cacheKey, { data: sortedData, timestamp: Date.now() });
    saveToLocalStorage(`packages_${cacheKey}`, sortedData);
    return sortedData;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PACKAGES_COL);
    return [];
  }
}

export async function addPackage(pkg: Omit<Package, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, PACKAGES_COL), {
      ...pkg,
      createdAt: serverTimestamp()
    });
    cache.packages.clear(); // Invalidate all packages cache
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, PACKAGES_COL);
    throw error;
  }
}

export async function updatePackage(id: string, pkg: Partial<Package>): Promise<void> {
  try {
    await updateDoc(doc(db, PACKAGES_COL, id), pkg);
    cache.packages.clear(); // Invalidate all packages cache
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PACKAGES_COL}/${id}`);
  }
}

export async function deletePackage(id: string): Promise<void> {
  try {
    const q = query(collection(db, ORDERS_COL), where('packageId', '==', id));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error("Cannot delete package: Orders exist for this package.");
    }
    await deleteDoc(doc(db, PACKAGES_COL, id));
    cache.packages.clear(); // Invalidate all packages cache
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PACKAGES_COL}/${id}`);
  }
}

// --- Orders ---
// --- Notifications ---
async function notifyOrderServerSide(data: { orderId: string; customerName: string; packageName: string; amount: number; type: 'PACKAGE' | 'ACCOUNT' }) {
  try {
    await fetch('/api/notify-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.warn('Failed to call server-side notification:', error);
  }
}

export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<string> {
  const initialStatus = OrderStatus.PENDING;
  
  // Validate order data before sending to Firestore
  if (!order.packageName || !order.customerName || !order.customerPhone || order.amount === undefined) {
    throw new Error('Missing required order fields. Please fill in all details.');
  }

  // STRICT ENFORCEMENT: Manual payments MUST have proof URL
  if ((order.paymentMethod === PaymentMethod.BANK || order.paymentMethod === PaymentMethod.EZ_CASH) && !order.paymentProofUrl) {
    throw new Error('Payment proof screenshot is required for Bank Transfer and eZ Cash payments.');
  }

  try {
    const orderData = {
      ...order,
      status: initialStatus,
      diamonds: (order.diamonds !== undefined && !isNaN(Number(order.diamonds))) ? Number(order.diamonds) : 0,
      createdAt: serverTimestamp(),
      authUid: auth.currentUser?.uid || null
    };

    console.log('Finalizing order submission to Firestore...', { ...orderData, createdAt: 'SERVER_TIMESTAMP' });
    
    const docRef = await addDoc(collection(db, ORDERS_COL), orderData);
    console.log('Firestore addDoc successful. Order ID:', docRef.id);

    // Create notification for admin
    try {
      await createNotification({
        title: 'New Order Received',
        message: `A new order for ${order.diamonds || 0} diamonds has been placed by ${order.customerName}.`,
        type: 'info',
        target: 'admin'
      });
    } catch (nError) {
      console.warn('Failed to create notification:', nError);
    }

    // Server-side notify (email)
    notifyOrderServerSide({
      orderId: docRef.id,
      customerName: order.customerName,
      packageName: order.packageName,
      amount: order.amount,
      type: 'PACKAGE'
    });

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, ORDERS_COL);
    throw error;
  }
}

export async function getOrder(id: string): Promise<Order | null> {
  try {
    const docRef = doc(db, ORDERS_COL, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return mapDocData<Order>(snapshot);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${ORDERS_COL}/${id}`);
    return null;
  }
}

export async function getUserOrders(identifier: string): Promise<Order[]> {
  const q = query(
    collection(db, ORDERS_COL),
    or(where('userId', '==', identifier), where('customerPhone', '==', identifier))
  );
  try {
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => mapDocData<Order>(doc));
    return data.sort((a: any, b: any) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ORDERS_COL);
    return [];
  }
}

export async function getOrders(statusFilter?: string): Promise<Order[]> {
  const constraints: QueryConstraint[] = [];
  if (statusFilter && statusFilter !== 'all') {
    constraints.push(where('status', '==', statusFilter));
  }
  try {
    const q = query(collection(db, ORDERS_COL), ...constraints);
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => mapDocData<Order>(doc));
    return data.sort((a: any, b: any) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ORDERS_COL);
    return [];
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus, adminNotes?: string): Promise<void> {
  try {
    const updateData: any = { status };
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    await updateDoc(doc(db, ORDERS_COL, id), updateData);

    // Create notification for all if completed/confirmed
    if (status === OrderStatus.COMPLETED || status === OrderStatus.CONFIRMED) {
      await createNotification({
        title: `Order #${id.slice(-6)} ${status.toUpperCase()}`,
        message: status === OrderStatus.COMPLETED 
          ? `Order for ${id.slice(-6)} has been successfully delivered!` 
          : `Payment for Order #${id.slice(-6)} has been confirmed.`,
        type: status === OrderStatus.COMPLETED ? 'success' : 'info',
        target: 'all'
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COL}/${id}`);
  }
}

export async function updateOrderAmount(id: string, amount: number): Promise<void> {
  try {
    await updateDoc(doc(db, ORDERS_COL, id), { amount });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COL}/${id}`);
  }
}

export async function uploadOrderProof(id: string, proofUrl: string): Promise<void> {
  try {
    await updateDoc(doc(db, ORDERS_COL, id), { 
      paymentProofUrl: proofUrl,
      proofSubmittedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COL}/${id}`);
  }
}

// --- Account Listings ---
export async function getAccountListings(onlyActive = true, includeSold = false): Promise<AccountListing[]> {
  const constraints: QueryConstraint[] = [];
  if (onlyActive) constraints.push(where('isActive', '==', true));
  if (!includeSold) constraints.push(where('isSold', '==', false));
  
  try {
    const q = query(collection(db, ACCOUNTS_COL), ...constraints);
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => mapDocData<AccountListing>(doc));
    return data.sort((a: any, b: any) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ACCOUNTS_COL);
    return [];
  }
}

export async function getAccountListing(id: string): Promise<AccountListing | null> {
  try {
    const docRef = doc(db, ACCOUNTS_COL, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return mapDocData<AccountListing>(snapshot);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${ACCOUNTS_COL}/${id}`);
    return null;
  }
}

export async function addAccountListing(data: Omit<AccountListing, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, ACCOUNTS_COL), {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, ACCOUNTS_COL);
    throw error;
  }
}

export async function updateAccountListing(id: string, data: Partial<AccountListing>): Promise<void> {
  try {
    await updateDoc(doc(db, ACCOUNTS_COL, id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ACCOUNTS_COL}/${id}`);
  }
}

export async function deleteAccountListing(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, ACCOUNTS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ACCOUNTS_COL}/${id}`);
  }
}

// --- Account Orders ---
export async function createAccountOrder(order: Omit<AccountOrder, 'id' | 'createdAt' | 'status'>): Promise<string> {
  const initialStatus = OrderStatus.PENDING;
  
  // STRICT ENFORCEMENT: Manual payments MUST have proof URL
  if ((order.paymentMethod === PaymentMethod.BANK || order.paymentMethod === PaymentMethod.EZ_CASH) && !order.paymentProofUrl) {
    throw new Error('Payment proof screenshot is required for account purchases.');
  }

  try {
    const docRef = await addDoc(collection(db, ACCOUNT_ORDERS_COL), {
      ...order,
      status: initialStatus,
      createdAt: serverTimestamp(),
      authUid: auth.currentUser?.uid || null
    });
    
    // Mark account as sold immediately
    try {
      await updateDoc(doc(db, ACCOUNTS_COL, order.accountId), { isSold: true });
    } catch (e) {
      console.warn("Could not mark account as sold, firestore rules may not be deployed:", e);
    }
    
    // Create notification for admin
    try {
      await createNotification({
        title: 'New Account Purchase',
        message: `${order.customerName} just purchased account: ${order.accountTitle}.`,
        type: 'info',
        target: 'admin'
      });
    } catch (nError) {
      console.warn('Failed to create notification:', nError);
    }

    // Server-side notify (email)
    notifyOrderServerSide({
      orderId: docRef.id,
      customerName: order.customerName,
      packageName: order.accountTitle,
      amount: order.amount,
      type: 'ACCOUNT'
    });

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, ACCOUNT_ORDERS_COL);
    throw error;
  }
}

export async function getAccountOrders(statusFilter?: string): Promise<AccountOrder[]> {
  const constraints: QueryConstraint[] = [];
  if (statusFilter && statusFilter !== 'all') {
    constraints.push(where('status', '==', statusFilter));
  }
  try {
    const q = query(collection(db, ACCOUNT_ORDERS_COL), ...constraints);
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => mapDocData<AccountOrder>(doc));
    return data.sort((a: any, b: any) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ACCOUNT_ORDERS_COL);
    return [];
  }
}

export async function updateAccountOrderStatus(id: string, status: OrderStatus): Promise<void> {
  try {
    await updateDoc(doc(db, ACCOUNT_ORDERS_COL, id), { status });

    if (status === OrderStatus.COMPLETED || status === OrderStatus.CONFIRMED) {
      await createNotification({
        title: `Account Order ${status.toUpperCase()}`,
        message: status === OrderStatus.COMPLETED 
          ? `An account purchase has been completed successfully.` 
          : `An account purchase payment has been confirmed.`,
        type: status === OrderStatus.COMPLETED ? 'success' : 'info',
        target: 'all'
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ACCOUNT_ORDERS_COL}/${id}`);
  }
}

// --- Notifications ---
export async function createNotification(data: Omit<AppNotification, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COL), {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, NOTIFICATIONS_COL);
    throw error;
  }
}

export function listenNotifications(callback: (notifications: AppNotification[]) => void, target: 'admin' | 'all' = 'all') {
  // Fetch recent notifications without the 'where' clause to avoid composite index requirement
  // We'll filter by target in memory since we only need the latest few
  const q = query(
    collection(db, NOTIFICATIONS_COL),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    const allNotifications = snapshot.docs.map(doc => mapDocData<AppNotification>(doc));
    const filtered = allNotifications
      .filter(n => n.target === target)
      .slice(0, 5);
    callback(filtered);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, NOTIFICATIONS_COL);
  });
}
