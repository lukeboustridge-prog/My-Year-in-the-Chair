// lib/api.ts — tighten payload for /api/my-work to avoid "Invalid input"

export type Degree = '' | 'Initiation' | 'Passing' | 'Raising' | 'Installation' | 'Other';

export type Working = {
  id?: string;
  dateISO: string;      // YYYY-MM-DD
  degree: Degree;       // Work of the evening
  section: string;      // REQUIRED
  grandLodgeVisit: boolean;
  emergencyMeeting?: boolean;
  notes?: string;
};

function withCreds(init: RequestInit = {}): RequestInit {
  return { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init.headers||{}) }, ...init };
}

async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  try { return await res.json() as T; } catch { return null; }
}

export function toISO(input: string): string {
  if (!input) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
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

export async function getWorkings(limit?: number) {
  const url = limit ? `/api/my-work?limit=${limit}` : '/api/my-work';
  const res = await fetch(url, withCreds());
  if (!res.ok) return [];
  const raw = await parseJsonSafe<any>(res);
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((r: any) => ({
    id: r.id ?? r._id,
    dateISO: toISO(r.dateISO ?? r.date ?? ''),
    degree: (r.degree ?? r.eventType ?? r.work ?? 'Other'),
    section: r.section ?? r.part ?? r.role ?? '',
    grandLodgeVisit: Boolean(r.grandLodgeVisit),
    emergencyMeeting: Boolean(r.emergencyMeeting || r.emergency),
    notes: r.notes ?? ''
  }));
}

function workingBodyCompat(w: Working) {
  const notes = (w.notes ?? '').toString();
  // Always include booleans explicitly (some schemas require them present)
  const glv = !!w.grandLodgeVisit;
  const emerg = !!w.emergencyMeeting;

  const b: any = {
    // required core
    dateISO: w.dateISO,
    date: w.dateISO,
    degree: w.degree,
    eventType: w.degree,
    work: w.degree,
    workOfEvening: w.degree,
    section: w.section,
    part: w.section,
    role: w.section,
    // explicit booleans
    grandLodgeVisit: glv,
    emergencyMeeting: emerg,
    emergency: emerg,
    // string notes (present even if empty)
    notes,
  };
  return b;
}

export async function createWorking(payload: Working): Promise<Working> {
  if (!payload.dateISO) throw new Error('Date is required');
  if (!payload.degree) throw new Error('Please select Work of the evening');
  if (!payload.section) throw new Error('Please enter the Part / Section you performed');

  const body = workingBodyCompat(payload);
  const res = await fetch('/api/my-work', withCreds({ method: 'POST', body: JSON.stringify(body) }));
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Save failed');
  }
  const saved = (await parseJsonSafe<any>(res)) || {};
  return { id: saved.id ?? saved._id, ...payload };
}

export async function updateWorking(id: string, payload: Working): Promise<Working> {
  if (!payload.dateISO) throw new Error('Date is required');
  if (!payload.degree) throw new Error('Please select Work of the evening');
  if (!payload.section) throw new Error('Please enter the Part / Section you performed');

  const body = { id, ...workingBodyCompat(payload) };
  let res = await fetch(`/api/my-work/${id}`, withCreds({ method: 'PUT', body: JSON.stringify(body) }));
  if (!res.ok) {
    res = await fetch('/api/my-work', withCreds({ method: 'POST', body: JSON.stringify(body) }));
  }
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Update failed');
  }
  const saved = (await parseJsonSafe<any>(res)) || {};
  return { id: saved.id ?? id, ...payload };
}

export async function deleteWorking(id: string): Promise<void> {
  let res = await fetch(`/api/my-work/${id}`, withCreds({ method: 'DELETE' }));
  if (!res.ok) {
    res = await fetch('/api/my-work', withCreds({ method: 'POST', body: JSON.stringify({ id, _action: 'delete' }) }));
  }
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Delete failed');
  }
}