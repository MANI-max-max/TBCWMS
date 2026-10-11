import { WmsProduct, WmsClaim, ClaimStatus, AuditLogEntry } from '../types/wms';
import { cloudSync } from './cloudSync';

// Import high-fidelity generated images
import headphonesImg from '../assets/images/wms_prod_headphones_1790431718531.jpg';
import smartwatchImg from '../assets/images/wms_prod_smartwatch_1790431732200.jpg';
import coffeeImg from '../assets/images/wms_prod_coffee_1790431744686.jpg';
import mouseImg from '../assets/images/wms_prod_mouse_1790431756712.jpg';

const STORAGE_KEY_PRODUCTS = 'wms_portal_products_v2';
const STORAGE_KEY_DELETED_IDS = 'wms_deleted_product_ids_v2';
const STORAGE_KEY_CLAIMS = 'wms_portal_claims_v2';
const STORAGE_KEY_USER = 'wms_portal_user_v2';

// High-quality SVG/DataURI proof samples for testing
export const DEMO_PROOFS = {
  order: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="%230f172a"><rect width="100%" height="100%" fill="%230f172a"/><rect x="40" y="40" width="520" height="720" rx="16" fill="%231e293b" stroke="%23334155" stroke-width="2"/><text x="70" y="100" fill="%2338bdf8" font-family="sans-serif" font-weight="bold" font-size="22">ORDER CONFIRMATION</text><text x="70" y="140" fill="%2394a3b8" font-family="sans-serif" font-size="14">Order ID: %23402-9812491-18239</text><text x="70" y="170" fill="%23e2e8f0" font-family="sans-serif" font-size="16">Status: Delivered Successfully</text><line x1="70" y1="200" x2="530" y2="200" stroke="%23475569" stroke-width="1"/><text x="70" y="240" fill="%23cbd5e1" font-family="sans-serif" font-size="14">Delivery Address: Bangalore 560034</text><text x="70" y="280" fill="%2310b981" font-family="sans-serif" font-weight="bold" font-size="18">Total Paid: INR 1,499.00</text><rect x="70" y="320" width="460" height="200" rx="12" fill="%230f172a" stroke="%23334155"/><text x="100" y="390" fill="%2394a3b8" font-family="monospace" font-size="14">Verified Merchant Dispatch Proof</text><text x="100" y="430" fill="%2364748b" font-family="monospace" font-size="12">Timestamp: 2026-09-24 14:32:10 UTC</text></svg>`,
  payment: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="%23064e3b"><rect width="100%" height="100%" fill="%23064e3b"/><rect x="40" y="40" width="520" height="720" rx="16" fill="%23065f46" stroke="%23047857" stroke-width="2"/><circle cx="300" cy="180" r="50" fill="%2310b981"/><path d="M280 180 L295 195 L325 165" stroke="%23ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="300" y="270" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="24">UPI PAYMENT SUCCESSFUL</text><text x="300" y="320" text-anchor="middle" fill="%23a7f3d0" font-family="sans-serif" font-weight="bold" font-size="32">INR 1,499.00</text><text x="300" y="370" text-anchor="middle" fill="%236ee7b7" font-family="monospace" font-size="14">UPI Ref / UTR: 426819208492</text><line x1="70" y1="420" x2="530" y2="420" stroke="%23047857" stroke-width="1"/><text x="70" y="470" fill="%23d1fae5" font-family="sans-serif" font-size="14">To: Merchant Official Store</text><text x="70" y="510" fill="%23d1fae5" font-family="sans-serif" font-size="14">From Account: AXIS BANK ...8812</text></svg>`,
  rating: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="%23451a03"><rect width="100%" height="100%" fill="%23451a03"/><rect x="40" y="40" width="520" height="720" rx="16" fill="%2378350f" stroke="%23b45309" stroke-width="2"/><text x="70" y="110" fill="%23fde68a" font-family="sans-serif" font-weight="bold" font-size="22">5-STAR RATING &amp; REVIEW</text><text x="70" y="160" fill="%23fbbf24" font-family="sans-serif" font-size="28">★★★★★</text><text x="70" y="210" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="16">"Exceptional quality, super fast delivery!"</text><text x="70" y="250" fill="%23fed7aa" font-family="sans-serif" font-size="13">Reviewed in India with Verified Purchase badge.</text><rect x="70" y="290" width="460" height="380" rx="12" fill="%23451a03" stroke="%2392400e"/><text x="95" y="340" fill="%23fef3c7" font-family="sans-serif" font-size="14">Customer feedback is live and publicly listed.</text><text x="95" y="380" fill="%23d97706" font-family="monospace" font-size="12">Helpful votes: 12 · Public profile match</text></svg>`
};

export const INITIAL_PRODUCTS: WmsProduct[] = [
  {
    id: 'PROD-101',
    title: 'Noise-Cancelling Wireless Headphones Pro',
    brand: 'AcousticWave',
    platform: 'Amazon',
    imageUrl: headphonesImg,
    originalPrice: 2499,
    cashbackAmount: 2499,
    cashbackType: '100% Free',
    specialCode: 'AMZ-ANC-99',
    purchaseUrl: 'https://www.amazon.in',
    totalSlots: 50,
    claimedSlots: 32,
    status: 'active',
    instructions: [
      'Search product on Amazon using our direct link',
      'Place order and pay standard checkout price',
      'Leave 5-star review upon delivery with 2 photos',
      'Upload 3 screenshots here for 100% full refund'
    ],
    createdAt: '2026-09-20'
  },
  {
    id: 'PROD-102',
    title: 'Smart AMOLED Fitness Tracker Watch v4',
    brand: 'PulseFit',
    platform: 'Flipkart',
    imageUrl: smartwatchImg,
    originalPrice: 1999,
    cashbackAmount: 1500,
    cashbackType: 'Flat Cashback',
    specialCode: 'FLP-BAND-44',
    purchaseUrl: 'https://www.flipkart.com',
    totalSlots: 40,
    claimedSlots: 26,
    status: 'active',
    instructions: [
      'Buy only via Flipkart verified seller link',
      'Keep invoice receipt handy for verification',
      'Submit rating screenshot after 24h of delivery',
      'Instant UPI payout within 2 hours of admin approval'
    ],
    createdAt: '2026-09-21'
  },
  {
    id: 'PROD-103',
    title: 'Organic Arabica Dark Roast Coffee Beans 500g',
    brand: 'MountainRoast',
    platform: 'Blinkit',
    imageUrl: coffeeImg,
    originalPrice: 650,
    cashbackAmount: 650,
    cashbackType: '100% Free',
    specialCode: 'BLK-COFF-12',
    purchaseUrl: 'https://www.blinkit.com',
    totalSlots: 30,
    claimedSlots: 18,
    status: 'active',
    instructions: [
      'Fast 10-minute Blinkit instant delivery order',
      'Capture delivery confirmation message and app receipt',
      'Submit review and enter UPI ID for fast direct refund'
    ],
    createdAt: '2026-09-22'
  },
  {
    id: 'PROD-104',
    title: 'Ergonomic Precision Wireless Gaming Mouse',
    brand: 'ViperX',
    platform: 'Amazon',
    imageUrl: mouseImg,
    originalPrice: 1299,
    cashbackAmount: 1000,
    cashbackType: 'Flat Cashback',
    specialCode: 'AMZ-MOU-88',
    purchaseUrl: 'https://www.amazon.in',
    totalSlots: 25,
    claimedSlots: 9,
    status: 'active',
    instructions: [
      'Verify special code AMZ-MOU-88 during claim submission',
      'All 3 screenshot proofs must be clear without blurring',
      'Payments disbursed via IMPS / UPI'
    ],
    createdAt: '2026-09-24'
  }
];

export const INITIAL_CLAIMS: WmsClaim[] = [
  {
    id: 'CLM-2026-8801',
    productId: 'PROD-101',
    productTitle: 'Noise-Cancelling Wireless Headphones Pro',
    platform: 'Amazon',
    cashbackAmount: 2499,
    systemCode: 'AMZ-ANC-99',
    submittedCode: 'AMZ-ANC-99',
    isCodeMatched: true,
    customerName: 'Aritra Sen',
    customerPhone: '9830123456',
    customerEmail: 'aritra.sen@example.com',
    refundUpi: 'aritra@okaxis',
    orderScreenshot: DEMO_PROOFS.order,
    paymentScreenshot: DEMO_PROOFS.payment,
    ratingScreenshot: DEMO_PROOFS.rating,
    status: 'Pending',
    submittedAt: '2026-09-25 11:20:00',
    auditLogs: [
      {
        id: 'log-1',
        timestamp: '2026-09-25 11:20:00',
        action: 'Claim Submitted',
        note: 'Customer submitted all 3 proofs with valid code match.',
        performedBy: 'Aritra Sen'
      }
    ]
  },
  {
    id: 'CLM-2026-8802',
    productId: 'PROD-102',
    productTitle: 'Smart AMOLED Fitness Tracker Watch v4',
    platform: 'Flipkart',
    cashbackAmount: 1500,
    systemCode: 'FLP-BAND-44',
    submittedCode: 'FLP-BAND-44',
    isCodeMatched: true,
    customerName: 'Priya Sharma',
    customerPhone: '9871122334',
    customerEmail: 'priya.sharma@example.com',
    refundUpi: 'priya@okhdfcbank',
    orderScreenshot: DEMO_PROOFS.order,
    paymentScreenshot: DEMO_PROOFS.payment,
    ratingScreenshot: DEMO_PROOFS.rating,
    status: 'Paid',
    payoutRefNo: 'UTR-940219482910',
    paidAt: '2026-09-25 14:10:00',
    submittedAt: '2026-09-24 16:45:00',
    auditLogs: [
      {
        id: 'log-2',
        timestamp: '2026-09-24 16:45:00',
        action: 'Claim Submitted',
        performedBy: 'Priya Sharma'
      },
      {
        id: 'log-3',
        timestamp: '2026-09-25 10:15:00',
        action: 'Claim Approved',
        note: 'Proofs verified and rating confirmed on Flipkart.',
        performedBy: 'Executive Admin'
      },
      {
        id: 'log-4',
        timestamp: '2026-09-25 14:10:00',
        action: 'Payout Disbursed',
        note: 'UTR: UTR-940219482910 credited to priya@okhdfcbank',
        performedBy: 'Accounts Finance'
      }
    ]
  },
  {
    id: 'CLM-2026-8803',
    productId: 'PROD-103',
    productTitle: 'Organic Arabica Dark Roast Coffee Beans 500g',
    platform: 'Blinkit',
    cashbackAmount: 650,
    systemCode: 'BLK-COFF-12',
    submittedCode: 'BLK-COFF-12',
    isCodeMatched: true,
    customerName: 'Rahul Verma',
    customerPhone: '9123456780',
    customerEmail: 'rahul.v@example.com',
    refundUpi: 'rahul@paytm',
    orderScreenshot: DEMO_PROOFS.order,
    paymentScreenshot: DEMO_PROOFS.payment,
    ratingScreenshot: DEMO_PROOFS.rating,
    status: 'Approved',
    submittedAt: '2026-09-25 09:12:00',
    auditLogs: [
      {
        id: 'log-5',
        timestamp: '2026-09-25 09:12:00',
        action: 'Claim Submitted',
        performedBy: 'Rahul Verma'
      },
      {
        id: 'log-6',
        timestamp: '2026-09-25 13:00:00',
        action: 'Claim Approved',
        note: 'Queued for next banking batch payout.',
        performedBy: 'Executive Admin'
      }
    ]
  },
  {
    id: 'CLM-2026-8804',
    productId: 'PROD-104',
    productTitle: 'Ergonomic Precision Wireless Gaming Mouse',
    platform: 'Amazon',
    cashbackAmount: 1000,
    systemCode: 'AMZ-MOU-88',
    submittedCode: 'AMZ-WRONG-CODE',
    isCodeMatched: false,
    customerName: 'Tanmoy Das',
    customerPhone: '9840192837',
    customerEmail: 'tanmoy.das@example.com',
    refundUpi: 'tanmoy@ybl',
    orderScreenshot: DEMO_PROOFS.order,
    paymentScreenshot: DEMO_PROOFS.payment,
    ratingScreenshot: DEMO_PROOFS.rating,
    status: 'Rejected',
    rejectionReason: 'Invalid Special Code entered (AMZ-WRONG-CODE). Please resubmit with the correct code from product card.',
    submittedAt: '2026-09-24 18:30:00',
    auditLogs: [
      {
        id: 'log-7',
        timestamp: '2026-09-24 18:30:00',
        action: 'Claim Submitted',
        note: 'Special code mismatch flagged by system.',
        performedBy: 'Tanmoy Das'
      },
      {
        id: 'log-8',
        timestamp: '2026-09-25 08:30:00',
        action: 'Claim Rejected',
        note: 'Code mismatch. Reason sent to customer.',
        performedBy: 'Executive Admin'
      }
    ]
  }
];

export const storage = {
  getDeletedProductIds(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_DELETED_IDS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  },

  addDeletedProductId(productId: string): void {
    if (!productId) return;
    try {
      const current = this.getDeletedProductIds();
      if (!current.includes(productId)) {
        current.push(productId);
        localStorage.setItem(STORAGE_KEY_DELETED_IDS, JSON.stringify(current));
      }
    } catch {}
  },

  syncDeletedProductIds(ids: string[]): void {
    if (!Array.isArray(ids) || ids.length === 0) return;
    try {
      const current = this.getDeletedProductIds();
      let changed = false;
      ids.forEach((id) => {
        if (id && !current.includes(id)) {
          current.push(id);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(STORAGE_KEY_DELETED_IDS, JSON.stringify(current));
      }
    } catch {}
  },

  clearDeletedProductIds(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_DELETED_IDS);
    } catch {}
  },

  filterOutDeleted(products: WmsProduct[]): WmsProduct[] {
    const deletedIds = this.getDeletedProductIds();
    if (!deletedIds || deletedIds.length === 0) return products || [];
    return (products || []).filter((p) => p && p.id && !deletedIds.includes(p.id));
  },

  getProducts(): WmsProduct[] {
    const deletedIds = this.getDeletedProductIds();
    try {
      const data = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (data !== null) {
        const parsed: WmsProduct[] = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter((p) => p && p.id && !deletedIds.includes(p.id));
        }
      }
    } catch {
      // fallback
    }
    // Seed initial filtered by deletedIds so deleted products NEVER reappear on new device/window
    const initialFiltered = INITIAL_PRODUCTS.filter((p) => !deletedIds.includes(p.id));
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(initialFiltered));
    return initialFiltered;
  },

  saveProducts(products: WmsProduct[]): void {
    const deletedIds = this.getDeletedProductIds();
    const clean = (products || []).filter((p) => p && p.id && !deletedIds.includes(p.id));
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(clean));
  },

  getClaims(): WmsClaim[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CLAIMS);
      if (data !== null) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    // Seed initial
    localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(INITIAL_CLAIMS));
    return INITIAL_CLAIMS;
  },

  saveClaims(claims: WmsClaim[]): void {
    localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(claims));
  },

  addClaim(claim: WmsClaim): void {
    const claims = this.getClaims();
    claims.unshift(claim);
    this.saveClaims(claims);

    // Update claimedSlots on product
    const products = this.getProducts();
    const prod = products.find(p => p.id === claim.productId);
    if (prod) {
      prod.claimedSlots += 1;
      this.saveProducts(products);
    }

    try {
      fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claim)
      }).catch(() => {});
    } catch {}
  },

  updateClaim(claimId: string, updates: Partial<WmsClaim>, adminName = 'Executive Admin'): WmsClaim | null {
    const claims = this.getClaims();
    const index = claims.findIndex(c => c.id === claimId);
    if (index === -1) return null;

    const existing = claims[index];
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newLogs: AuditLogEntry[] = [...(existing.auditLogs || [])];
    if (updates.status && updates.status !== existing.status) {
      newLogs.push({
        id: `log-${Date.now()}`,
        timestamp: now,
        action: `Status Changed to ${updates.status}`,
        note: updates.rejectionReason || (updates.payoutRefNo ? `Payout UTR: ${updates.payoutRefNo}` : undefined),
        performedBy: adminName
      });
    }

    const updated: WmsClaim = {
      ...existing,
      ...updates,
      auditLogs: newLogs
    };

    claims[index] = updated;
    this.saveClaims(claims);

    try {
      fetch(`/api/claims/${claimId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).catch(() => {});
    } catch {}

    return updated;
  },

  addProduct(product: WmsProduct): void {
    // If re-adding or new product, remove from deletedIds blacklist
    try {
      const currentDeleted = this.getDeletedProductIds().filter(id => id !== product.id);
      localStorage.setItem(STORAGE_KEY_DELETED_IDS, JSON.stringify(currentDeleted));
    } catch {}
    const products = this.getProducts();
    const existingIdx = products.findIndex(p => p.id === product.id);
    if (existingIdx !== -1) {
      products[existingIdx] = product;
    } else {
      products.unshift(product);
    }
    this.saveProducts(products);
    cloudSync.broadcast('PRODUCT_ADDED', products, product.id);
    cloudSync.saveProductToServer(product);
  },

  updateProduct(productId: string, updates: Partial<WmsProduct>): void {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === productId);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...updates };
      this.saveProducts(products);
      cloudSync.broadcast('PRODUCT_UPDATED', products, productId);
      cloudSync.saveProductToServer(products[idx]);
    }
  },

  deleteProduct(productId: string): void {
    // 1. Immediately record in permanent blacklist so it NEVER resurfaces
    this.addDeletedProductId(productId);

    // 2. Remove from active product list
    const currentProducts = this.getProducts();
    const remainingProducts = currentProducts.filter(p => p.id !== productId);
    this.saveProducts(remainingProducts);

    // 3. Instant 0ms broadcast across local tabs and windows
    cloudSync.broadcast('PRODUCT_DELETED', remainingProducts, productId, this.getDeletedProductIds());

    // 4. Send DELETE to server for instant cross-device permanent removal
    cloudSync.deleteProductFromServer(productId);
  },

  recordPayout(claimId: string, utrRef: string, adminName = 'Executive Admin'): WmsClaim | null {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return this.updateClaim(claimId, {
      status: 'Paid',
      payoutRefNo: utrRef,
      paidAt: now
    }, adminName);
  },

  resetToDemoData(): void {
    this.clearDeletedProductIds();
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(INITIAL_CLAIMS));
    cloudSync.broadcast('SYNC_ALL', INITIAL_PRODUCTS);
    cloudSync.resetDemoOnServer();
  },

  resetAllData(): void {
    this.resetToDemoData();
  },

  clearAllData(): void {
    // Add all initial and current product IDs so they never reappear
    INITIAL_PRODUCTS.forEach(p => this.addDeletedProductId(p.id));
    this.getProducts().forEach(p => this.addDeletedProductId(p.id));
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify([]));
    cloudSync.broadcast('SYNC_ALL', []);
    cloudSync.cleanSlateOnServer();
  },

  cleanSlate(): void {
    this.clearAllData();
  },

  exportClaimsAsCsv(): string {
    return this.exportClaimsToCsv(this.getClaims());
  },

  exportDatabaseJson(): string {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      products: this.getProducts(),
      claims: this.getClaims()
    };
    return JSON.stringify(data, null, 2);
  },

  importDatabaseJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.products) && Array.isArray(parsed.claims)) {
        this.saveProducts(parsed.products);
        this.saveClaims(parsed.claims);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  exportClaimsToCsv(claims: WmsClaim[]): string {
    const headers = [
      'Claim ID',
      'Submission Date',
      'Customer Name',
      'Mobile',
      'Email',
      'Product Title',
      'Platform',
      'Cashback Amount (INR)',
      'System Code',
      'Submitted Code',
      'Code Matched',
      'UPI ID',
      'Status',
      'Payout Ref No / UTR',
      'Paid Date',
      'Rejection Reason'
    ];

    const escapeCsv = (val: unknown) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = claims.map(c => [
      c.id,
      c.submittedAt,
      c.customerName,
      c.customerPhone,
      c.customerEmail,
      c.productTitle,
      c.platform,
      c.cashbackAmount,
      c.systemCode,
      c.submittedCode,
      c.isCodeMatched ? 'YES' : 'NO',
      c.refundUpi,
      c.status,
      c.payoutRefNo || '',
      c.paidAt || '',
      c.rejectionReason || ''
    ].map(escapeCsv).join(','));

    // UTF-8 BOM
    return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  }
};
