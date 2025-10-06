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

// Raw server visit shape (unknown — we coerce to UI Visit)
type VisitRow = {
  id?: string;
  date?: string;        // ISO
  dateISO?: string;     // sometimes present in older UI
  lodge?: string;
  lodgeName?: string;
  lodgeNumber?: string;
  eventType?: string;
  grandLodgeVisit?: boolean;
  notes?: string;
};

// ---- Types expected by UI pages ----
export type Degree = 'EA' | 'FC' | 'MM' | 'Installation' | 'Other' | string;

// Visit shape expected by /app/visits/page.tsx
export type Visit = {
  id?: string;
  dateISO: string;                    // canonical ISO date for UI
  // keep a 'date' mirror to satisfy any pages using v.date
  date?: string;
  lodgeName?: string;
  lodgeNumber?: string;
  eventType?: string;
  grandLodgeVisit?: boolean;
  notes?: string;
};

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

// Map a server VisitRow -> UI Visit
export function toVisit(v: VisitRow): Visit {
  const dateISO = (v.dateISO || v.date || '').toString();
  const lodgeName = v.lodgeName || v.lodge || '';
  const lodgeNumber = v.lodgeNumber || '';
  return {
    id: v.id,
    dateISO,
    date: dateISO,
    lodgeName: lodgeName || undefined,
    lodgeNumber: lodgeNumber || undefined,
    eventType: v.eventType || undefined,
    grandLodgeVisit: !!v.grandLodgeVisit,
    notes: v.notes || undefined,
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
export async function getWorkings(limit?: number): Promise<Working[]> {
  const rows = await listLodgeWorkings();
  const mapped = rows.map(toWorking);
  return typeof limit === 'number' ? mapped.slice(0, Math.max(0, limit)) : mapped;
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
export async function getVisits(limit?: number): Promise<Visit[]> {
  const qs = typeof limit === 'number' ? `?limit=${limit}` : '';
  const rows = await j<VisitRow[]>(`/api/visits${qs}`, { cache: 'no-store' }).catch(() => [] as VisitRow[]);
  const mapped = rows.map(toVisit);
  return typeof limit === 'number' ? mapped.slice(0, Math.max(0, limit)) : mapped;
}

export async function createVisit(input: any) {
  // Accept UI Visit and map to a reasonable server payload. If /api/visits fails, fallback to /api/workings.
  const v: Visit = (input && input.dateISO !== undefined) ? input as Visit : toVisit(input as VisitRow);
  const body: any = {
    date: v.dateISO,
    lodgeName: v.lodgeName,
    lodgeNumber: v.lodgeNumber,
    eventType: v.eventType,
    grandLodgeVisit: v.grandLodgeVisit,
    notes: v.notes,
  };
  try {
    return await j('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // Fallback to a Working create so local/dev still records something
    return createLodgeWorking({
      title: (v.eventType || 'Visit') + (v.lodgeName ? ' – ' + v.lodgeName : ''),
      date: v.dateISO,
      lodgeName: v.lodgeName,
      lodgeNumber: v.lodgeNumber,
      notes: v.notes,
      createdBy: undefined,
    });
  }
}

export async function updateVisit(id: string, patch: Partial<Visit>) {
  const body: any = { ...patch };
  if ((patch as any).dateISO && !(patch as any).date) {
    body.date = (patch as any).dateISO;
  }
  return j(`/api/visits/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
export async function deleteVisit(id: string) {
  await j(`/api/visits/${id}`, { method: 'DELETE' });
  return { ok: true as const };
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
