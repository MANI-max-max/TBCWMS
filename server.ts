import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'store.json');

// Initial default seed products
const INITIAL_PRODUCTS = [
  {
    id: 'PROD-101',
    title: 'Noise-Cancelling Wireless Headphones Pro',
    brand: 'AcousticWave',
    platform: 'Amazon',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=80',
    originalPrice: 1999,
    cashbackAmount: 1500,
    cashbackType: 'Flat Cashback',
    specialCode: 'FLP-BAND-44',
    purchaseUrl: 'https://www.flipkart.com',
    totalSlots: 40,
    claimedSlots: 28,
    status: 'active',
    instructions: [
      'Search on Flipkart store',
      'Verify merchant is PulseFit Official',
      'Submit screenshots within 48 hours of delivery'
    ],
    createdAt: '2026-09-21'
  },
  {
    id: 'PROD-103',
    title: 'Organic Arabica Dark Roast Coffee Beans 500g',
    brand: 'CafeArtisan',
    platform: 'Blinkit',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=700&q=80',
    originalPrice: 650,
    cashbackAmount: 650,
    cashbackType: '100% Free',
    specialCode: 'BLK-COFF-12',
    purchaseUrl: 'https://blinkit.com',
    totalSlots: 60,
    claimedSlots: 45,
    status: 'active',
    instructions: [
      'Order via Blinkit 10-minute delivery',
      'Rating & invoice screenshot required'
    ],
    createdAt: '2026-09-22'
  },
  {
    id: 'PROD-104',
    title: 'Ergonomic Precision Wireless Gaming Mouse',
    brand: 'ViperGear',
    platform: 'Amazon',
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=700&q=80',
    originalPrice: 1299,
    cashbackAmount: 1000,
    cashbackType: 'Flat Cashback',
    specialCode: 'AMZ-MOU-88',
    purchaseUrl: 'https://www.amazon.in',
    totalSlots: 35,
    claimedSlots: 19,
    status: 'active',
    instructions: [
      'Buy through direct link',
      'Review after 3 days of testing with unboxing picture'
    ],
    createdAt: '2026-09-23'
  }
];

const DEMO_PROOFS = {
  order: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="%230f172a"><rect width="100%" height="100%" fill="%230f172a"/><rect x="40" y="40" width="520" height="720" rx="16" fill="%231e293b" stroke="%23334155" stroke-width="2"/><text x="70" y="100" fill="%2338bdf8" font-family="sans-serif" font-weight="bold" font-size="22">ORDER CONFIRMATION</text><text x="70" y="140" fill="%2394a3b8" font-family="sans-serif" font-size="14">Order ID: %23402-9812491-18239</text><text x="70" y="170" fill="%23e2e8f0" font-family="sans-serif" font-size="16">Status: Delivered Successfully</text><line x1="70" y1="200" x2="530" y2="200" stroke="%23475569" stroke-width="1"/><text x="70" y="240" fill="%23cbd5e1" font-family="sans-serif" font-size="14">Delivery Address: Bangalore 560034</text><text x="70" y="280" fill="%2310b981" font-family="sans-serif" font-weight="bold" font-size="18">Total Paid: INR 1,499.00</text></svg>`,
  payment: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="%23064e3b"><rect width="100%" height="100%" fill="%23064e3b"/><rect x="40" y="40" width="520" height="720" rx="16" fill="%23065f46" stroke="%23047857" stroke-width="2"/><circle cx="300" cy="180" r="50" fill="%2310b981"/><text x="300" y="270" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="24">UPI PAYMENT SUCCESSFUL</text><text x="300" y="320" text-anchor="middle" fill="%23a7f3d0" font-family="sans-serif" font-weight="bold" font-size="32">INR 1,499.00</text></svg>`,
  rating: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="%23451a03"><rect width="100%" height="100%" fill="%23451a03"/><rect x="40" y="40" width="520" height="720" rx="16" fill="%2378350f" stroke="%23b45309" stroke-width="2"/><text x="70" y="110" fill="%23fde68a" font-family="sans-serif" font-weight="bold" font-size="22">5-STAR RATING &amp; REVIEW</text><text x="70" y="160" fill="%23fbbf24" font-family="sans-serif" font-size="28">★★★★★</text></svg>`
};

const INITIAL_CLAIMS = [
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
      }
    ]
  }
];

interface DatabaseSchema {
  products: any[];
  claims: any[];
  deletedProductIds: string[];
  updatedAt: number;
}

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.products) && Array.isArray(parsed.claims)) {
        const deletedIds: string[] = Array.isArray(parsed.deletedProductIds) ? parsed.deletedProductIds : [];
        // Strictly filter out any products that were marked deleted
        const filteredProducts = parsed.products.filter((p: any) => p && p.id && !deletedIds.includes(p.id));
        return {
          products: filteredProducts,
          claims: parsed.claims,
          deletedProductIds: deletedIds,
          updatedAt: parsed.updatedAt || Date.now()
        };
      }
    }
  } catch (err) {
    console.error('Error reading store file, initializing fresh:', err);
  }

  const initialData: DatabaseSchema = {
    products: INITIAL_PRODUCTS,
    claims: INITIAL_CLAIMS,
    deletedProductIds: [],
    updatedAt: Date.now()
  };
  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(data: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    data.updatedAt = Date.now();
    if (!Array.isArray(data.deletedProductIds)) {
      data.deletedProductIds = [];
    }
    // Guarantee no deleted products remain in stored array
    data.products = (data.products || []).filter((p: any) => p && p.id && !data.deletedProductIds.includes(p.id));
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database to file:', err);
  }
}

let db = loadDatabase();

// SSE Connected Clients for 0ms cross-device real-time updates
const sseClients: Response[] = [];

// Topic for global instant cross-container & cross-device pubsub
const GLOBAL_PUBSUB_URL = 'https://ntfy.sh/ais-wms-2eb8b3d8-c634-4640-a364-174578d3e305';

async function broadcastToCloudPubSub(type: string, payload: any) {
  try {
    await fetch(GLOBAL_PUBSUB_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload, deletedProductIds: db.deletedProductIds, timestamp: Date.now() })
    });
  } catch {}
}

function broadcastToClients(type: string, payload: any) {
  const activeProducts = db.products.filter(
    (p) => p && p.id && !db.deletedProductIds.includes(p.id)
  );
  const data = JSON.stringify({
    type,
    payload,
    deletedId: payload && typeof payload === 'object' ? payload.deletedId : undefined,
    deletedProductIds: db.deletedProductIds,
    products: activeProducts,
    timestamp: Date.now()
  });
  sseClients.forEach((client) => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {}
  });
  // Also push to global cross-container / cross-device pubsub
  broadcastToCloudPubSub(type, payload);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Serve static assets from public/ (favicons, icons, PWA manifest)
  app.use(express.static(path.resolve(__dirname, 'public')));

  // Server-Sent Events stream for cross-device live synchronization with keep-alive
  app.get('/api/events', (req: Request, res: Response) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    });
    const activeProducts = db.products.filter(
      (p) => p && p.id && !db.deletedProductIds.includes(p.id)
    );
    res.write(`data: ${JSON.stringify({
      type: 'CONNECTED',
      products: activeProducts,
      deletedProductIds: db.deletedProductIds,
      timestamp: Date.now()
    })}\n\n`);
    sseClients.push(res);

    // Keep connection alive on mobile devices and firewalls with 15s ping
    const keepAlive = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {}
    }, 15000);

    req.on('close', () => {
      clearInterval(keepAlive);
      const idx = sseClients.indexOf(res);
      if (idx !== -1) sseClients.splice(idx, 1);
    });
  });

  // GET Products (Always filters out any permanently deleted IDs)
  app.get('/api/products', (req: Request, res: Response) => {
    const activeProducts = db.products.filter(
      (p) => p && p.id && !db.deletedProductIds.includes(p.id)
    );
    res.json({
      products: activeProducts,
      deletedProductIds: db.deletedProductIds,
      updatedAt: db.updatedAt
    });
  });

  // GET Deleted Product IDs (Tombstones sync)
  app.get('/api/deleted-product-ids', (req: Request, res: Response) => {
    res.json({ deletedProductIds: db.deletedProductIds || [] });
  });

  // POST Products (Add new product or update existing)
  app.post('/api/products', (req: Request, res: Response) => {
    const product = req.body;
    if (!product || !product.id || !product.title) {
      res.status(400).json({ error: 'Invalid product data' });
      return;
    }

    // If product was permanently deleted, prevent stale device background sync from resurrecting it
    if (db.deletedProductIds.includes(product.id) && !req.query.forceUndelete) {
      const activeProducts = db.products.filter(
        (p) => p && p.id && !db.deletedProductIds.includes(p.id)
      );
      res.status(409).json({
        error: 'Product has been permanently deleted',
        deletedProductIds: db.deletedProductIds,
        products: activeProducts
      });
      return;
    }

    const idx = db.products.findIndex((p) => p.id === product.id);
    if (idx !== -1) {
      db.products[idx] = { ...db.products[idx], ...product };
    } else {
      db.products.unshift(product);
    }
    saveDatabase(db);
    broadcastToClients('SYNC_PRODUCTS', db.products);
    res.json({ success: true, product, products: db.products, deletedProductIds: db.deletedProductIds });
  });

  // PUT Product (Update existing product)
  app.put('/api/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    db.products[idx] = { ...db.products[idx], ...updates };
    saveDatabase(db);
    broadcastToClients('SYNC_PRODUCTS', db.products);
    res.json({ success: true, product: db.products[idx], products: db.products });
  });

  // DELETE Product - immediately & permanently removed on all devices & customer portal
  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const beforeCount = db.products.length;

    // Permanently record in deletedProductIds blacklist (tombstones)
    if (!db.deletedProductIds.includes(id)) {
      db.deletedProductIds.push(id);
    }

    db.products = db.products.filter((p) => p.id !== id);
    saveDatabase(db);
    broadcastToClients('PRODUCT_DELETED', { deletedId: id, products: db.products });
    res.json({
      success: true,
      deletedId: id,
      deleted: beforeCount !== db.products.length,
      deletedProductIds: db.deletedProductIds,
      products: db.products
    });
  });

  // Clean Slate - wipes all products and claims permanently
  app.post('/api/clean-slate', (req: Request, res: Response) => {
    // Add all previous and initial product IDs so nothing reappears on refresh
    db.products.forEach((p) => {
      if (p.id && !db.deletedProductIds.includes(p.id)) {
        db.deletedProductIds.push(p.id);
      }
    });
    INITIAL_PRODUCTS.forEach((p) => {
      if (p.id && !db.deletedProductIds.includes(p.id)) {
        db.deletedProductIds.push(p.id);
      }
    });

    db.products = [];
    db.claims = [];
    saveDatabase(db);
    broadcastToClients('SYNC_ALL', { products: [], claims: [] });
    res.json({
      success: true,
      message: 'All data cleared',
      products: [],
      claims: [],
      deletedProductIds: db.deletedProductIds
    });
  });

  // Reset Demo Data
  app.post('/api/reset-demo', (req: Request, res: Response) => {
    db.deletedProductIds = [];
    db.products = [...INITIAL_PRODUCTS];
    db.claims = [...INITIAL_CLAIMS];
    saveDatabase(db);
    broadcastToClients('SYNC_ALL', { products: db.products, claims: db.claims });
    res.json({ success: true, message: 'Reset to demo catalog', products: db.products, claims: db.claims });
  });

  // GET Claims
  app.get('/api/claims', (req: Request, res: Response) => {
    res.json({ claims: db.claims, updatedAt: db.updatedAt });
  });

  // POST Claim
  app.post('/api/claims', (req: Request, res: Response) => {
    const claim = req.body;
    if (!claim || !claim.id) {
      res.status(400).json({ error: 'Invalid claim' });
      return;
    }
    db.claims.unshift(claim);
    // increment product claimed slots if found
    const prod = db.products.find((p) => p.id === claim.productId);
    if (prod) {
      prod.claimedSlots = (prod.claimedSlots || 0) + 1;
    }
    saveDatabase(db);
    broadcastToClients('SYNC_ALL', { products: db.products, claims: db.claims });
    res.json({ success: true, claim, claims: db.claims });
  });

  // PUT Claim (Approve, Reject, or Payout)
  app.put('/api/claims/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const idx = db.claims.findIndex((c) => c.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Claim not found' });
      return;
    }

    db.claims[idx] = { ...db.claims[idx], ...updates };
    saveDatabase(db);
    broadcastToClients('SYNC_ALL', { products: db.products, claims: db.claims });
    res.json({ success: true, claim: db.claims[idx], claims: db.claims });
  });

  // Mount Vite middlewares in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TBC WMS Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
