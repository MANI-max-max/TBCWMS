// Vercel Serverless Function Handler for /api/*
import type { Request, Response } from 'express';

// In-memory store for Vercel Serverless instance
let memoryProducts: any[] = [];
let memoryClaims: any[] = [];
let memoryDeletedIds: string[] = [];

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';

  if (url.includes('/products')) {
    if (req.method === 'GET') {
      const active = memoryProducts.filter((p: any) => p && p.id && !memoryDeletedIds.includes(p.id));
      return res.status(200).json({ products: active, deletedProductIds: memoryDeletedIds });
    }
    if (req.method === 'POST') {
      const product = req.body;
      if (product && product.id) {
        if (memoryDeletedIds.includes(product.id)) {
          return res.status(409).json({ error: 'Product is permanently deleted', deletedProductIds: memoryDeletedIds });
        }
        const idx = memoryProducts.findIndex((p: any) => p.id === product.id);
        if (idx !== -1) {
          memoryProducts[idx] = { ...memoryProducts[idx], ...product };
        } else {
          memoryProducts.unshift(product);
        }
      }
      return res.status(200).json({ success: true, products: memoryProducts, deletedProductIds: memoryDeletedIds });
    }
    if (req.method === 'DELETE') {
      const parts = url.split('/');
      const id = parts[parts.length - 1];
      if (!memoryDeletedIds.includes(id)) {
        memoryDeletedIds.push(id);
      }
      memoryProducts = memoryProducts.filter((p: any) => p.id !== id);
      return res.status(200).json({ success: true, products: memoryProducts, deletedProductIds: memoryDeletedIds, deletedId: id });
    }
  }

  if (url.includes('/clean-slate')) {
    memoryProducts = [];
    memoryClaims = [];
    memoryDeletedIds = [];
    return res.status(200).json({ success: true, products: [], claims: [] });
  }

  return res.status(200).json({ status: 'ok' });
}
