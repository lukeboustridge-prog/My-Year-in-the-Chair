// lib/api.ts
// Thin client for API routes. Keeps UI clean and typed.

export type LodgeWorking = {
  id: string;
  title: string;
  date: string;          // ISO string
  lodgeName?: string;
  lodgeNumber?: string;
  notes?: string;
  createdBy?: string;    // user id or email if available
  createdAt?: string;    // ISO
  updatedAt?: string;    // ISO
};

// ---------- Lodge Workings ----------
export async function listLodgeWorkings(): Promise<LodgeWorking[]> {
  const res = await fetch('/api/workings', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load Lodge Workings');
  return res.json();
}

export type CreateLodgeWorkingInput = Omit<LodgeWorking, 'id' | 'createdAt' | 'updatedAt'>;

export async function createLodgeWorking(input: CreateLodgeWorkingInput): Promise<LodgeWorking> {
  const res = await fetch('/api/workings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'Failed to create Lodge Working');
  }
  return res.json();
}

export async function deleteLodgeWorking(id: string): Promise<{ ok: true }> {
  const res = await fetch(`/api/workings/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'Failed to delete Lodge Working');
  }
  return { ok: true };
}

// ---------- Backward-compat shim to silence build warning ----------
/**
 * Some pages were importing createVisit from ../../lib/api, but the helper
 * did not exist. Exporting a no-op wrapper to keep builds green if it is
 * still referenced. Prefer createLodgeWorking going forward.
 */
export async function createVisit(..._args: any[]) {
  console.warn('createVisit is deprecated. Use createLodgeWorking instead.');
  return createLodgeWorking(_args[0] as CreateLodgeWorkingInput);
}
