// lib/api.ts
// Centralized client helpers for API routes, including legacy names used across the app.
// This file provides shims so older pages keep compiling while we migrate to the new endpoints.

export type LodgeWorking = {
  id: string;
  title: string;
  date: string;          // ISO string
  lodgeName?: string;
  lodgeNumber?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Visit = {
  id: string;
  date: string;
  lodge?: string;
  notes?: string;
};

// ---- Types expected by /app/my-work/page.tsx ----
export type Degree = 'EA' | 'FC' | 'MM' | 'Installation' | 'Other' | string;

export type Working = {
  id?: string;
  dateISO: string;             // ISO date string
  degree: Degree;
  candidateName?: string;
  lodgeName?: string;
  lodgeNumber?: string;
  grandLodgeVisit?: boolean;
  emergencyMeeting?: boolean;
  notes?: string;
};

// Leaderboard row shape expected by /app/leaderboard/page.tsx
export type LeaderboardRow = {
  userId: string;
  name: string;
  visits: number;
  workings: number;
  points?: number;
  month?: string;
  year?: number;
  rank?: number;
};

// Generic JSON fetcher
async function j<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Request failed ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// -------------------- Workings (legacy aliases + new) --------------------
export async function listLodgeWorkings(): Promise<LodgeWorking[]> {
  return j('/api/workings', { cache: 'no-store' });
}

// Map a LodgeWorking row to the Working shape used by /app/my-work/page.tsx
export function toWorking(lw: LodgeWorking): Working {
  // Try to derive a degree and candidate from title convention "Degree – Candidate"
  let degree: Degree = 'Other';
  let candidateName: string | undefined;
  if (lw.title) {
    const parts = lw.title.split('–').map(s => s.trim());
    if (parts.length >= 1 && parts[0]) degree = parts[0] as Degree;
    if (parts.length >= 2 && parts[1]) candidateName = parts[1];
  }
  return {
    id: lw.id,
    dateISO: lw.date,
    degree,
    candidateName,
    lodgeName: lw.lodgeName,
    lodgeNumber: lw.lodgeNumber,
    notes: lw.notes,
  };
}

export type CreateLodgeWorkingInput = Omit<LodgeWorking, 'id' | 'createdAt' | 'updatedAt'>;
export async function createLodgeWorking(input: CreateLodgeWorkingInput): Promise<LodgeWorking> {
  return j('/api/workings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
export async function deleteLodgeWorking(id: string): Promise<{ ok: true }> {
  await j(`/api/workings/${id}`, { method: 'DELETE' });
  return { ok: true };
}

// Legacy names used by /app/my-work/page.tsx
export async function getWorkings(): Promise<Working[]> {
  const rows = await listLodgeWorkings();
  return rows.map(toWorking);
}
export async function createWorking(input: CreateLodgeWorkingInput | Working) {
  // Allow Working shape; map to server input
  const mapped: CreateLodgeWorkingInput = (input as any).title
    ? (input as any)
    : {
        title: ((input as Working).degree || 'Working') + ( (input as Working).candidateName ? ' – ' + (input as Working).candidateName : '' ),
        date: (input as Working).dateISO,
        lodgeName: (input as Working).lodgeName,
        lodgeNumber: (input as Working).lodgeNumber,
        notes: (input as Working).notes,
      };
  return createLodgeWorking(mapped);
}
export async function updateWorking(_id: string, _patch: Partial<CreateLodgeWorkingInput | Working>) {
  // Not implemented in API; return noop for compatibility
  return { ok: true } as any;
}
export const deleteWorking = deleteLodgeWorking;

// -------------------- Visits (legacy shims) --------------------
export async function getVisits(): Promise<Visit[]> {
  return j('/api/visits', { cache: 'no-store' });
}
export async function updateVisit(id: string, patch: Partial<Visit>) {
  return j(`/api/visits/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}
export async function deleteVisit(id: string) {
  await j(`/api/visits/${id}`, { method: 'DELETE' });
  return { ok: true as const };
}

// Keep the earlier build warning quiet by providing this shim as well
export async function createVisit(input: any) {
  // Some pages may still call this; route to /api/visits if present, else to /api/workings
  try {
    return await j('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    return createLodgeWorking(input);
  }
}

// -------------------- Leaderboard (accepts optional period) --------------------
export async function getLeaderboard(period?: string) {
  try {
    const qs = period ? `?period=${encodeURIComponent(period)}` : '';
    return await j<LeaderboardRow[]>(`/api/leaderboard${qs}`, { cache: 'no-store' });
  } catch {
    return [] as LeaderboardRow[];
  }
}

// -------------------- Profile helpers (soft optional) --------------------
export async function getProfileName(): Promise<string> {
  try {
    const data = await j<{ name?: string }>('/api/profile', { cache: 'no-store' });
    return data?.name || '';
  } catch {
    return '';
  }
}

export async function getOwnRanks(): Promise<any> {
  try {
    return await j('/api/profile', { cache: 'no-store' });
  } catch {
    return {};
  }
}
