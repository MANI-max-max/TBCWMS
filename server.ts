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
    claimedSlots: 0,
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
    claimedSlots: 0,
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
    claimedSlots: 0,
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
    claimedSlots: 0,
    status: 'active',
    instructions: [
      'Buy through direct link',
      'Review after 3 days of testing with unboxing picture'
    ],
    createdAt: '2026-09-23'
  }
];

const INITIAL_CLAIMS: any[] = [];

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
