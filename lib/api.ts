// lib/api.ts — Restores ALL exports (profile, visits, workings, leaderboard)

export type Degree = '' | 'Initiation' | 'Passing' | 'Raising' | 'Installation' | 'Other';

export type Visit = {
  id?: string;
  dateISO: string;
  lodgeName: string;
  lodgeNumber?: string;
  eventType: Degree;
  grandLodgeVisit: boolean;
  notes?: string;
};

export type Working = {
  id?: string;
  dateISO: string;
  degree: Degree;
  candidateName: string;
  section?: string; // legacy/optional
  grandLodgeVisit: boolean;
  emergencyMeeting?: boolean;
  notes?: string;
};

export type LeaderboardRow = { rank: number; name: string; points: number; period: '12mo'|'month' };

function withCreds(init: RequestInit = {}): RequestInit {
  return { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init.headers||{}) }, ...init };
}

async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  try { return await res.json() as T; } catch { return null; }
}

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

/* ---------------- PROFILE ---------------- */
export async function getProfile(): Promise<{ prefix?: string; fullName?: string; name?: string; firstName?: string; lastName?: string; postNominals?: string; }> {
  const res = await fetch('/api/profile', withCreds());
  if (!res.ok) return {};
  return (await parseJsonSafe<any>(res)) || {};
}

export async function getProfileName(): Promise<string> {
  const data = await getProfile();
  const prefix = (data?.prefix || '').toString().trim();
  const fullName = (data?.fullName || data?.name || [data?.firstName, data?.lastName].filter(Boolean).join(' ') || '').toString().trim();
  const post = (data?.postNominals || '').toString().trim();
  const display = [prefix, fullName, post].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return display || 'You';
}

/* ---------------- VISITS ---------------- */
export async function getVisits(limit?: number): Promise<Visit[]> {
  const url = limit ? `/api/visits?limit=${limit}` : '/api/visits';
  const res = await fetch(url, withCreds());
  if (!res.ok) return [];
  const raw = await parseJsonSafe<any>(res);
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((r: any) => ({
    id: r.id ?? r._id,
    dateISO: toISO(r.dateISO ?? r.date ?? ''),
    lodgeName: r.lodgeName ?? r.lodge ?? '',
    lodgeNumber: r.lodgeNumber ?? r.lodge_no ?? r.number ?? '',
    eventType: (r.eventType ?? r.degree ?? 'Other') as Degree,
    grandLodgeVisit: Boolean(r.grandLodgeVisit),
    notes: r.notes ?? ''
  }));
}

export async function createVisit(payload: Visit): Promise<Visit> {
  if (!payload.dateISO) throw new Error('Date is required');
  if (!payload.eventType) throw new Error('Please select Work of the evening');
  const body: any = {
    dateISO: payload.dateISO,
    date: payload.dateISO,
    lodgeName: payload.lodgeName,
    lodge: payload.lodgeName,
    lodgeNumber: payload.lodgeNumber ?? '',
    eventType: payload.eventType,
    degree: payload.eventType,
    notes: (payload.notes ?? '').toString(),
    grandLodgeVisit: !!payload.grandLodgeVisit
  };
  const res = await fetch('/api/visits', withCreds({ method: 'POST', body: JSON.stringify(body) }));
  if (!res.ok) { const txt = await res.text(); throw new Error(txt || 'Save failed'); }
  const saved = (await parseJsonSafe<any>(res)) || {};
  return { id: saved.id ?? saved._id, ...payload };
}

export async function updateVisit(id: string, payload: Visit): Promise<Visit> {
  if (!payload.dateISO) throw new Error('Date is required');
  if (!payload.eventType) throw new Error('Please select Work of the evening');
  const body: any = {
    id,
    dateISO: payload.dateISO,
    date: payload.dateISO,
    lodgeName: payload.lodgeName,
    lodge: payload.lodgeName,
    lodgeNumber: payload.lodgeNumber ?? '',
    eventType: payload.eventType,
    degree: payload.eventType,
    notes: (payload.notes ?? '').toString(),
    grandLodgeVisit: !!payload.grandLodgeVisit
  };
  let res = await fetch(`/api/visits/${id}`, withCreds({ method: 'PUT', body: JSON.stringify(body) }));
  if (!res.ok) res = await fetch('/api/visits', withCreds({ method: 'POST', body: JSON.stringify(body) }));
  if (!res.ok) { const txt = await res.text(); throw new Error(txt || 'Update failed'); }
  const saved = (await parseJsonSafe<any>(res)) || {};
  return { id: saved.id ?? id, ...payload };
}

export async function deleteVisit(id: string): Promise<void> {
  let res = await fetch(`/api/visits/${id}`, withCreds({ method: 'DELETE' }));
  if (!res.ok) res = await fetch('/api/visits', withCreds({ method: 'POST', body: JSON.stringify({ id, _action: 'delete' }) }));
  if (!res.ok) { const txt = await res.text(); throw new Error(txt || 'Delete failed'); }
}

/* ---------------- WORKINGS (candidateName UI, section legacy) ---------------- */
export async function getWorkings(limit?: number): Promise<Working[]> {
  const url = limit ? `/api/my-work?limit=${limit}` : '/api/my-work';
  const res = await fetch(url, withCreds());
  if (!res.ok) return [];
  const raw = await parseJsonSafe<any>(res);
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((r: any) => ({
    id: r.id ?? r._id,
    dateISO: toISO(r.dateISO ?? r.date ?? ''),
    degree: (r.degree ?? r.eventType ?? r.work ?? 'Other') as Degree,
    candidateName: r.candidateName ?? r.candidate ?? r.name ?? r.candidate_full_name ?? '',
    section: r.section ?? r.part ?? r.role ?? '',
    grandLodgeVisit: !!r.grandLodgeVisit,
    emergencyMeeting: !!(r.emergencyMeeting || r.emergency),
    notes: r.notes ?? ''
  }));
}

function bodyCompat(w: Working, action?: 'create'|'update'|'delete') {
  const candidate = (w.candidateName ?? '').toString();
  const section = ((w.section ?? candidate) || 'Candidate').toString();
  const notes = (w.notes ?? '').toString();
  const emerg = !!w.emergencyMeeting;
  const glv = !!w.grandLodgeVisit;

  const b: any = {
    ...(action ? { _action: action } : {}),
    ...(w.id ? { id: w.id } : {}),
    dateISO: w.dateISO,
    date: w.dateISO,
    degree: w.degree,
    eventType: w.degree,
    work: w.degree,
    workOfEvening: w.degree,
    candidateName: candidate,
    candidate: candidate,
    name: candidate,
    candidate_full_name: candidate,
    section,
    part: section,
    role: section,
    grandLodgeVisit: glv,
    emergencyMeeting: emerg,
    emergency: emerg,
    notes
  };
  return b;
}

export async function createWorking(payload: Working): Promise<Working> {
  if (!payload.dateISO) throw new Error('Date is required');
  if (!payload.degree) throw new Error('Please select Work of the evening');
  if (!payload.candidateName) throw new Error('Please enter the Candidate Name');
  const res = await fetch('/api/my-work', withCreds({ method: 'POST', body: JSON.stringify(bodyCompat(payload, 'create')) }));
  if (!res.ok) { const txt = await res.text(); throw new Error(txt || 'Save failed'); }
  const saved = (await parseJsonSafe<any>(res)) || {};
  return { id: saved.id ?? saved._id, ...payload };
}

export async function updateWorking(id: string, payload: Working): Promise<Working> {
  if (!payload.dateISO) throw new Error('Date is required');
  if (!payload.degree) throw new Error('Please select Work of the evening');
  if (!payload.candidateName) throw new Error('Please enter the Candidate Name');
  const res = await fetch('/api/my-work', withCreds({ method: 'POST', body: JSON.stringify(bodyCompat({ ...payload, id }, 'update')) }));
  if (!res.ok) { const txt = await res.text(); throw new Error(txt || 'Update failed'); }
  const saved = (await parseJsonSafe<any>(res)) || {};
  return { id: saved.id ?? id, ...payload };
}

export async function deleteWorking(id: string): Promise<void> {
  let res = await fetch(`/api/my-work/${id}`, withCreds({ method: 'DELETE' }));
  if (!res.ok) res = await fetch('/api/my-work', withCreds({ method: 'POST', body: JSON.stringify({ _action: 'delete', id }) }));
  if (!res.ok) { const txt = await res.text(); throw new Error(txt || 'Delete failed'); }
}

/* ---------------- LEADERBOARD ---------------- */
export async function getLeaderboard(period: '12mo'|'month'): Promise<LeaderboardRow[]> {
  const res = await fetch(`/api/leaderboard?period=${period}`, withCreds());
  if (!res.ok) return [];
  const raw = await parseJsonSafe<any>(res);
  const rows: LeaderboardRow[] = Array.isArray(raw) ? raw : [];
  return rows;
}

function withinLastMonths(iso: string, months: number): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const start = new Date(now);
  start.setMonth(now.getMonth() - months);
  return d >= start && d <= now;
}

function withinCurrentMonth(iso: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export async function getOwnRanks(): Promise<{ rank12?: number; rankM?: number; points12?: number; pointsM?: number; name: string; }>{ 
  const name = await getProfileName();
  const [api12, apiM] = await Promise.all([getLeaderboard('12mo').catch(()=>[]), getLeaderboard('month').catch(()=>[])]);
  function findRank(rows: LeaderboardRow[]): number | undefined {
    const i = rows.findIndex(r => r.name.trim().toLowerCase() === name.trim().toLowerCase());
    return i >= 0 ? rows[i].rank : undefined;
  }
  const rank12Api = findRank(api12);
  const rankMApi = findRank(apiM);
  if (rank12Api !== undefined || rankMApi !== undefined) {
    return { rank12: rank12Api, rankM: rankMApi, name };
  }
  const [visits, works] = await Promise.all([getVisits().catch(()=>[]), getWorkings().catch(()=>[])]);
  const points12 = visits.filter(v => withinLastMonths(v.dateISO, 12)).length + works.filter(w => withinLastMonths(w.dateISO, 12)).length;
  const pointsM = visits.filter(v => withinCurrentMonth(v.dateISO)).length + works.filter(w => withinCurrentMonth(w.dateISO)).length;
  return { rank12: points12 ? 1 : undefined, rankM: pointsM ? 1 : undefined, points12, pointsM, name };
}