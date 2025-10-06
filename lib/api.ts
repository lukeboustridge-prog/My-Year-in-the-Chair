export type Degree = 'Initiation' | 'Passing' | 'Raising' | 'Installation' | 'Other';

export type Visit = {
  id?: string;
  dateISO: string;      // YYYY-MM-DD
  lodgeName: string;
  lodgeNumber?: string;
  eventType: Degree;
  grandLodgeVisit: boolean;
  notes?: string;
};

export type Working = {
  id?: string;
  dateISO: string;      // YYYY-MM-DD
  degree: Degree;
  section: string;
  grandLodgeVisit: boolean;
  notes?: string;
};

async function j<T>(res: Response): Promise<T> {
  const txt = await res.text();
  try { return JSON.parse(txt) as T; } catch { return txt as unknown as T; }
}

function withCreds(init: RequestInit = {}): RequestInit {
  return { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init.headers||{}) }, ...init };
}

/** ---------- VISITS ---------- */

export async function getVisits(limit?: number): Promise<Visit[]> {
  const url = limit ? `/api/visits?limit=${limit}` : '/api/visits';
  const res = await fetch(url, withCreds());
  if (!res.ok) return [];
  const raw = await j<any>(res);
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((r: any) => ({
    id: r.id ?? r._id,
    dateISO: toISO(r.dateISO ?? r.date ?? ''),
    lodgeName: r.lodgeName ?? r.lodge ?? '',
    lodgeNumber: r.lodgeNumber ?? r.lodge_no ?? r.number ?? '',
    eventType: r.eventType ?? r.degree ?? 'Other',
    grandLodgeVisit: Boolean(r.grandLodgeVisit),
    notes: r.notes ?? ''
  }));
}

export async function createVisit(payload: Visit): Promise<Visit> {
  const body: any = {
    dateISO: payload.dateISO,
    date: payload.dateISO,
    lodgeName: payload.lodgeName,
    lodge: payload.lodgeName,
    lodgeNumber: payload.lodgeNumber ?? '',
    eventType: payload.eventType,
    degree: payload.eventType,
    grandLodgeVisit: !!payload.grandLodgeVisit,
    notes: payload.notes ?? ''
  };
  const res = await fetch('/api/visits', withCreds({ method: 'POST', body: JSON.stringify(body) }));
  if (!res.ok) throw new Error(typeof await j(res) === 'string' ? (await j<string>(res)) : 'Save failed');
  const saved = await j<any>(res);
  return {
    id: saved.id ?? saved._id,
    ...body,
  };
}

export async function updateVisit(id: string, payload: Visit): Promise<Visit> {
  const body: any = {
    id,
    dateISO: payload.dateISO,
    date: payload.dateISO,
    lodgeName: payload.lodgeName,
    lodge: payload.lodgeName,
    lodgeNumber: payload.lodgeNumber ?? '',
    eventType: payload.eventType,
    degree: payload.eventType,
    grandLodgeVisit: !!payload.grandLodgeVisit,
    notes: payload.notes ?? ''
  };

  // Try RESTful /:id first, then fallback to POST with id
  let res = await fetch(`/api/visits/${id}`, withCreds({ method: 'PUT', body: JSON.stringify(body) }));
  if (!res.ok) {
    res = await fetch('/api/visits', withCreds({ method: 'POST', body: JSON.stringify(body) }));
  }
  if (!res.ok) throw new Error(typeof await j(res) === 'string' ? (await j<string>(res)) : 'Update failed');
  const saved = await j<any>(res);
  return {
    id: saved.id ?? id,
    ...body,
  };
}

export async function deleteVisit(id: string): Promise<void> {
  const res = await fetch(`/api/visits/${id}`, withCreds({ method: 'DELETE' }));
  if (!res.ok) {
    // fallback: DELETE not supported, try POST with a verb
    await fetch('/api/visits', withCreds({ method: 'POST', body: JSON.stringify({ id, _action: 'delete' }) }));
  }
}

/** ---------- WORKINGS ---------- */

export async function getWorkings(limit?: number): Promise<Working[]> {
  const url = limit ? `/api/my-work?limit=${limit}` : '/api/my-work';
  const res = await fetch(url, withCreds());
  if (!res.ok) return [];
  const raw = await j<any>(res);
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((r: any) => ({
    id: r.id ?? r._id,
    dateISO: toISO(r.dateISO ?? r.date ?? ''),
    degree: r.degree ?? 'Other',
    section: r.section ?? '',
    grandLodgeVisit: Boolean(r.grandLodgeVisit),
    notes: r.notes ?? ''
  }));
}

export async function createWorking(payload: Working): Promise<Working> {
  const body: any = {
    dateISO: payload.dateISO,
    date: payload.dateISO,
    degree: payload.degree,
    section: payload.section,
    grandLodgeVisit: !!payload.grandLodgeVisit,
    notes: payload.notes ?? ''
  };
  const res = await fetch('/api/my-work', withCreds({ method: 'POST', body: JSON.stringify(body) }));
  if (!res.ok) throw new Error(typeof await j(res) === 'string' ? (await j<string>(res)) : 'Save failed');
  const saved = await j<any>(res);
  return { id: saved.id ?? saved._id, ...body };
}

export async function updateWorking(id: string, payload: Working): Promise<Working> {
  const body: any = {
    id,
    dateISO: payload.dateISO,
    date: payload.dateISO,
    degree: payload.degree,
    section: payload.section,
    grandLodgeVisit: !!payload.grandLodgeVisit,
    notes: payload.notes ?? ''
  };
  let res = await fetch(`/api/my-work/${id}`, withCreds({ method: 'PUT', body: JSON.stringify(body) }));
  if (!res.ok) {
    res = await fetch('/api/my-work', withCreds({ method: 'POST', body: JSON.stringify(body) }));
  }
  if (!res.ok) throw new Error(typeof await j(res) === 'string' ? (await j<string>(res)) : 'Update failed');
  const saved = await j<any>(res);
  return { id: saved.id ?? id, ...body };
}

export async function deleteWorking(id: string): Promise<void> {
  const res = await fetch(`/api/my-work/${id}`, withCreds({ method: 'DELETE' }));
  if (!res.ok) {
    await fetch('/api/my-work', withCreds({ method: 'POST', body: JSON.stringify({ id, _action: 'delete' }) }));
  }
}

/** ---------- Leaderboard ---------- */

export type LeaderboardRow = { rank: number; name: string; points: number; period: '12mo'|'month' };

export async function getLeaderboard(period: '12mo'|'month'): Promise<LeaderboardRow[]> {
  const res = await fetch(`/api/leaderboard?period=${period}`, withCreds());
  if (!res.ok) return [];
  const raw = await j<any>(res);
  const rows: LeaderboardRow[] = Array.isArray(raw) ? raw : [];
  return rows;
}

/** ---------- Utilities ---------- */

export function toISO(input: string): string {
  if (!input) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const m = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }
  try {
    const d = new Date(input);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch {}
  return input;
}