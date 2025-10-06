\
// lib/db.ts
// Provides a 'db' export for legacy routes that import from '@/lib/db',
// and helpers for newer code paths.

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient | null {
  try {
    if (!process.env.DATABASE_URL) return null;
    if (!prisma) prisma = new PrismaClient();
    return prisma;
  } catch {
    return null;
  }
}

// Legacy default 'db' export expected by multiple API routes/pages.
// If DATABASE_URL is not set, this will be null. Those routes should
// handle null (or you can call getPrisma() within them).
export const db: any = getPrisma();

// Simple in-memory store for non-DB local/dev usage (optional)
export type WorkingRecord = {
  id: string;
  title: string;
  date: string;
  lodgeName?: string;
  lodgeNumber?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

const mem = new Map<string, WorkingRecord>();
export const memStore = {
  list: () => Array.from(mem.values()).sort((a, b) => b.date.localeCompare(a.date)),
  create: (w: Omit<WorkingRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = (globalThis as any).crypto?.randomUUID
      ? (globalThis as any).crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    const now = new Date().toISOString();
    const rec: WorkingRecord = { id, createdAt: now, updatedAt: now, ...w };
    mem.set(id, rec);
    return rec;
  },
  delete: (id: string) => mem.delete(id),
};
