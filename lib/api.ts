// lib/api.ts — compat payloads for Lodge Work (fix 400 Invalid Input)
export type Degree = '' | 'Initiation' | 'Passing' | 'Raising' | 'Installation' | 'Other';

export type Working = {
  id?: string;
  dateISO: string;      // YYYY-MM-DD
  degree: Degree;       // Work of the evening
  section: string;      // REQUIRED (client enforces)
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

export async function getWorkings(limit?: number): Promise<Working[]> {
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

// Build a very compatible body: include multiple alias keys the backend might expect.
function workingBodyCompat(w: Working) {
  const b: any = {
    // date variants
    dateISO: w.dateISO,
    date: w.dateISO,
    // work variants
    degree: w.degree,
    eventType: w.degree,
    work: w.degree,
    workOfEvening: w.degree,
    // section/part variants
    section: w.section,
    part: w.section,
    role: w.section,
  };
  if (w.grandLodgeVisit) b.grandLodgeVisit = true;
  if (w.emergencyMeeting) { b.emergencyMeeting = true; b.emergency = true; }
  if (w.notes) b.notes = w.notes;
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