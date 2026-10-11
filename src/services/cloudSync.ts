import { WmsProduct } from '../types/wms';

const STORAGE_KEY_PRODUCTS = 'wms_portal_products_v2';
const STORAGE_KEY_DELETED_IDS = 'wms_deleted_product_ids_v2';
const STORAGE_KEY_TIMESTAMP = 'wms_portal_products_timestamp';
const BROADCAST_CHANNEL_NAME = 'tbc_wms_realtime_broadcast_v3';

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch {
  // BroadcastChannel fallback
}

export interface SyncPayload {
  type: 'SYNC_PRODUCTS' | 'PRODUCT_DELETED' | 'PRODUCT_ADDED' | 'PRODUCT_UPDATED' | 'SYNC_ALL' | 'CONNECTED';
  productId?: string;
  deletedId?: string;
  deletedProductIds?: string[];
  products?: WmsProduct[];
  timestamp: number;
}

function getLocalDeletedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_IDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveLocalDeletedIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_DELETED_IDS, JSON.stringify(ids));
  } catch {}
}

function mergeDeletedIds(newIds: string[]): string[] {
  if (!Array.isArray(newIds) || newIds.length === 0) return getLocalDeletedIds();
  const current = getLocalDeletedIds();
  let changed = false;
  newIds.forEach((id) => {
    if (id && !current.includes(id)) {
      current.push(id);
      changed = true;
    }
  });
  if (changed) {
    saveLocalDeletedIds(current);
  }
  return current;
}

function filterProducts(products: WmsProduct[]): WmsProduct[] {
  const deletedIds = getLocalDeletedIds();
  if (!deletedIds.length) return products || [];
  return (products || []).filter((p) => p && p.id && !deletedIds.includes(p.id));
}

export const cloudSync = {
  // Broadcast an immediate local update to all open tabs and windows (0ms latency)
  broadcast(
    type: SyncPayload['type'],
    products: WmsProduct[],
    productId?: string,
    deletedProductIds?: string[]
  ): void {
    const timestamp = Date.now();
    if (deletedProductIds && Array.isArray(deletedProductIds)) {
      mergeDeletedIds(deletedProductIds);
    }
    const cleanProducts = filterProducts(products);
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(cleanProducts));
      localStorage.setItem(STORAGE_KEY_TIMESTAMP, timestamp.toString());
    } catch {}

    const payload: SyncPayload = {
      type,
      productId,
      deletedId: type === 'PRODUCT_DELETED' ? productId : undefined,
      deletedProductIds: getLocalDeletedIds(),
      products: cleanProducts,
      timestamp
    };

    // 1. Send via BroadcastChannel (instant cross-tab communication)
    try {
      if (broadcastChannel) {
        broadcastChannel.postMessage(payload);
      }
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    // 2. Dispatch window event for current document
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tbc_wms_local_sync', { detail: payload }));
    }
  },

  // Notify server of product addition/edit
  async saveProductToServer(product: WmsProduct): Promise<void> {
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
    } catch {
      // offline / static fallback
    }
  },

  // Notify server of product deletion - permanently deletes on server and records tombstone
  async deleteProductFromServer(productId: string): Promise<void> {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.deletedProductIds)) {
          mergeDeletedIds(data.deletedProductIds);
        }
      }
    } catch {
      // offline / static fallback
    }
  },

  // Notify server of clean slate
  async cleanSlateOnServer(): Promise<void> {
    try {
      await fetch('/api/clean-slate', {
        method: 'POST'
      });
    } catch {
      // offline / static fallback
    }
  },

  // Notify server of demo data reset
  async resetDemoOnServer(): Promise<void> {
    try {
      await fetch('/api/reset-demo', {
        method: 'POST'
      });
    } catch {
      // offline / static fallback
    }
  },

  // Fetch latest products and deleted tombstones from server
  async fetchProducts(): Promise<{ products: WmsProduct[]; deletedProductIds: string[] } | null> {
    try {
      const res = await fetch(`/api/products?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.products)) {
          const deletedIds: string[] = Array.isArray(data.deletedProductIds) ? data.deletedProductIds : [];
          return { products: data.products, deletedProductIds: deletedIds };
        }
      }
    } catch {
      // offline fallback
    }
    return null;
  },

  // Subscribe to real-time events (Server-Sent Events for cross-device + BroadcastChannel for cross-tab)
  subscribe(onProductsChange: (products: WmsProduct[]) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const applyIncomingSync = (incomingProducts: WmsProduct[] | undefined, incomingDeletedIds?: string[]) => {
      if (incomingDeletedIds && Array.isArray(incomingDeletedIds)) {
        mergeDeletedIds(incomingDeletedIds);
      }
      let sourceList: WmsProduct[] = [];
      if (Array.isArray(incomingProducts)) {
        sourceList = incomingProducts;
      } else {
        try {
          const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
          if (saved) sourceList = JSON.parse(saved);
        } catch {}
      }
      const clean = filterProducts(sourceList);
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(clean));
      } catch {}
      onProductsChange(clean);
    };

    // 1. Handler for BroadcastChannel (cross-tab 0ms)
    const handleBroadcast = (event: MessageEvent<SyncPayload>) => {
      if (event.data) {
        if (event.data.deletedId) {
          mergeDeletedIds([event.data.deletedId]);
        }
        if (event.data.deletedProductIds) {
          mergeDeletedIds(event.data.deletedProductIds);
        }
        applyIncomingSync(event.data.products, event.data.deletedProductIds);
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcast);
    }

    // 2. Handler for local custom event (same page 0ms)
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<SyncPayload>;
      if (customEvent.detail) {
        if (customEvent.detail.deletedId) {
          mergeDeletedIds([customEvent.detail.deletedId]);
        }
        if (customEvent.detail.deletedProductIds) {
          mergeDeletedIds(customEvent.detail.deletedProductIds);
        }
        applyIncomingSync(customEvent.detail.products, customEvent.detail.deletedProductIds);
      }
    };
    window.addEventListener('tbc_wms_local_sync', handleCustomEvent);

    // 3. Native storage event (across browser tabs)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_PRODUCTS || e.key === STORAGE_KEY_DELETED_IDS) {
        applyIncomingSync(undefined);
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // 4. Server-Sent Events (SSE) for Real-Time Cross-Device Sync (0ms delay across all devices & phones)
    let eventSource: EventSource | null = null;
    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/events');
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (!data) return;

            // Merge any incoming deleted tombstones immediately
            if (Array.isArray(data.deletedProductIds)) {
              mergeDeletedIds(data.deletedProductIds);
            }
            if (data.deletedId) {
              mergeDeletedIds([data.deletedId]);
            }
            if (data.payload?.deletedId) {
              mergeDeletedIds([data.payload.deletedId]);
            }

            // Extract products from any format
            let productsToApply: WmsProduct[] | undefined = undefined;
            if (Array.isArray(data.products)) {
              productsToApply = data.products;
            } else if (Array.isArray(data.payload)) {
              productsToApply = data.payload;
            } else if (data.payload && Array.isArray(data.payload.products)) {
              productsToApply = data.payload.products;
            }

            // Immediately apply and notify React component state
            applyIncomingSync(productsToApply, data.deletedProductIds);
          } catch (err) {
            console.warn('[SSE] Parse error:', err);
          }
        };

        eventSource.onerror = () => {
          // SSE reconnects automatically
        };
      } catch (err) {
        console.warn('[SSE] Connection error:', err);
      }
    };

    connectSSE();

    // 5. Active Cross-Device Polling to guarantee sync if connection fluctuates or backgrounded
    let isFetching = false;
    const syncWithServer = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const result = await cloudSync.fetchProducts();
        if (result && Array.isArray(result.products)) {
          if (result.deletedProductIds.length > 0) {
            mergeDeletedIds(result.deletedProductIds);
          }
          const clean = filterProducts(result.products);
          const currentLocal = localStorage.getItem(STORAGE_KEY_PRODUCTS);
          const cleanStr = JSON.stringify(clean);
          if (currentLocal !== cleanStr) {
            localStorage.setItem(STORAGE_KEY_PRODUCTS, cleanStr);
            onProductsChange(clean);
          }
        }
      } catch {
        // silent
      } finally {
        isFetching = false;
      }
    };

    const pollInterval = setInterval(syncWithServer, 1500);

    // 6. Fast sync when window gains focus or tab becomes visible (e.g. customer opens browser/phone)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncWithServer();
      }
    };
    window.addEventListener('focus', syncWithServer);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial server fetch to align device data immediately on page load
    syncWithServer();

    // Cleanup subscription
    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast);
      }
      window.removeEventListener('tbc_wms_local_sync', handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('focus', syncWithServer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(pollInterval);
    };
  }
};
