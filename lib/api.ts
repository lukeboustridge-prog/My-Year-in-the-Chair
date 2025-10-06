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
  workOfEvening?: string;
  grandLodgeVisit?: boolean;
  comments?: string;
  notes?: string;
  region?: string;
  location?: string;
};

type MyWorkRow = {
  id?: string;
  date?: string;
  dateISO?: string;
  work?: string;
  degree?: string;
  candidateName?: string;
  lodgeName?: string;
  lodgeNumber?: string;
  grandLodgeVisit?: boolean;
  emergencyMeeting?: boolean;
  comments?: string;
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

const WORK_TYPE_LABELS: Record<string, string> = {
  INITIATION: 'Initiation',
  PASSING: 'Passing',
  RAISING: 'Raising',
  INSTALLATION: 'Installation',
  PRESENTATION: 'Presentation',
  LECTURE: 'Lecture',
  OTHER: 'Other',
};

const WORK_TYPE_ALIASES: Record<string, string> = {
  INITIATION: 'INITIATION',
  EA: 'INITIATION',
  'ENTERED APPRENTICE': 'INITIATION',
  PASSING: 'PASSING',
  FC: 'PASSING',
  RAISING: 'RAISING',
  MM: 'RAISING',
  INSTALLATION: 'INSTALLATION',
  PRESENTATION: 'PRESENTATION',
  LECTURE: 'LECTURE',
  OTHER: 'OTHER',
};

function normalizeWorkCode(value?: string | null): string {
  if (!value) return 'OTHER';
  const key = value.toString().trim().toUpperCase();
  return WORK_TYPE_ALIASES[key] ?? 'OTHER';
}

function formatWorkLabel(code?: string | null, fallback?: string | null): string {
  if (fallback && fallback.trim()) return fallback.trim();
  if (!code) return 'Other';
  const key = code.toString().trim().toUpperCase();
  return WORK_TYPE_LABELS[key] ?? (key.charAt(0) + key.slice(1).toLowerCase());
}

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
  const workCode = (v.workOfEvening || '').toString();
  const notes = v.notes ?? v.comments;
  return {
    id: v.id,
    dateISO,
    date: dateISO,
    lodgeName: lodgeName || undefined,
    lodgeNumber: lodgeNumber || undefined,
    eventType: v.eventType || formatWorkLabel(workCode),
    grandLodgeVisit: !!v.grandLodgeVisit,
    notes: notes || undefined,
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
function toMyWork(row: MyWorkRow): Working {
  const dateISO = (row.dateISO || row.date || '').toString();
  const workCode = (row.work || row.degree || '').toString();
  return {
    id: row.id,
    dateISO,
    degree: formatWorkLabel(workCode, row.degree),
    candidateName: row.candidateName || undefined,
    lodgeName: row.lodgeName || undefined,
    lodgeNumber: row.lodgeNumber || undefined,
    grandLodgeVisit: !!row.grandLodgeVisit,
    emergencyMeeting: !!row.emergencyMeeting,
    notes: row.notes || row.comments || undefined,
  };
}

export async function getWorkings(limit?: number): Promise<Working[]> {
  const qs = typeof limit === 'number' ? `?limit=${limit}` : '';
  const rows = await j<MyWorkRow[]>(`/api/mywork${qs}`, { cache: 'no-store' }).catch(() => [] as MyWorkRow[]);
  const mapped = rows.map(toMyWork);
  return typeof limit === 'number' ? mapped.slice(0, Math.max(0, limit)) : mapped;
}

function workingInputToPayload(input: Working) {
  const code = normalizeWorkCode(input.degree);
  return {
    date: input.dateISO,
    work: code,
    degree: formatWorkLabel(code, input.degree),
    candidateName: input.candidateName,
    lodgeName: input.lodgeName,
    lodgeNumber: input.lodgeNumber,
    grandLodgeVisit: input.grandLodgeVisit,
    emergencyMeeting: input.emergencyMeeting,
    notes: input.notes,
    comments: input.notes,
  };
}

export async function createWorking(input: Working): Promise<Working> {
  const payload = workingInputToPayload(input);
  const row = await j<MyWorkRow>('/api/mywork', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return toMyWork(row);
}

export async function updateWorking(id: string, patch: Partial<Working>): Promise<Working> {
  const body: any = { id };
  if (patch.dateISO) body.date = patch.dateISO;
  if (patch.degree) body.work = normalizeWorkCode(patch.degree);
  if (patch.candidateName !== undefined) body.candidateName = patch.candidateName;
  if (patch.lodgeName !== undefined) body.lodgeName = patch.lodgeName;
  if (patch.lodgeNumber !== undefined) body.lodgeNumber = patch.lodgeNumber;
  if (patch.grandLodgeVisit !== undefined) body.grandLodgeVisit = patch.grandLodgeVisit;
  if (patch.emergencyMeeting !== undefined) body.emergencyMeeting = patch.emergencyMeeting;
  if (patch.notes !== undefined) {
    body.notes = patch.notes;
    body.comments = patch.notes;
  }
  const row = await j<MyWorkRow>('/api/mywork', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return toMyWork(row);
}

export async function deleteWorking(id: string): Promise<{ ok: true }> {
  await j('/api/mywork', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  return { ok: true };
}

// -------------------- Visits (legacy shims) --------------------
export async function getVisits(limit?: number): Promise<Visit[]> {
  const qs = typeof limit === 'number' ? `?limit=${limit}` : '';
  const rows = await j<VisitRow[]>(`/api/visits${qs}`, { cache: 'no-store' }).catch(() => [] as VisitRow[]);
  const mapped = rows.map(toVisit);
  return typeof limit === 'number' ? mapped.slice(0, Math.max(0, limit)) : mapped;
}

export async function createVisit(input: Visit): Promise<Visit> {
  // Accept UI Visit and map to a reasonable server payload.
  const v = input;
  const workCode = normalizeWorkCode(v.eventType);
  const body: any = {
    date: v.dateISO,
    lodgeName: v.lodgeName,
    lodgeNumber: v.lodgeNumber,
    eventType: v.eventType || formatWorkLabel(workCode),
    workOfEvening: workCode,
    grandLodgeVisit: v.grandLodgeVisit,
    notes: v.notes,
  };
  if (v.notes !== undefined) {
    body.comments = v.notes;
  }
  const row = await j<VisitRow>('/api/visits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return toVisit(row);
}

export async function updateVisit(id: string, patch: Partial<Visit>): Promise<Visit> {
  const body: any = { ...patch };
  if ((patch as any).dateISO && !(patch as any).date) {
    body.date = (patch as any).dateISO;
  }
  if (patch.eventType) {
    body.eventType = patch.eventType;
    body.workOfEvening = normalizeWorkCode(patch.eventType);
  }
  const row = await j<VisitRow>(`/api/visits/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return toVisit(row);
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
