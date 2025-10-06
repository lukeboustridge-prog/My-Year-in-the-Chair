// lib/db.ts
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

// Minimal type used by fallback
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

// In-memory fallback store
const mem = new Map<string, WorkingRecord>();
export const memStore = {
  list: () => Array.from(mem.values()).sort((a, b) => b.date.localeCompare(a.date)),
  create: (w: Omit<WorkingRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const rec: WorkingRecord = { id, createdAt: now, updatedAt: now, ...w };
    mem.set(id, rec);
    return rec;
  },
  delete: (id: string) => mem.delete(id),
};
