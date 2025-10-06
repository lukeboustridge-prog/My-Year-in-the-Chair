// lib/api.ts — POST-only updates for /api/my-work, include legacy fields
export type Degree = '' | 'Initiation' | 'Passing' | 'Raising' | 'Installation' | 'Other';

export type Working = {
  id?: string;
  dateISO: string;
  degree: Degree;
  candidateName: string;
  section?: string;
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
    candidateName: r.candidateName ?? r.candidate ?? r.name ?? r.candidate_full_name ?? '',
    section: r.section ?? r.part ?? r.role ?? '',
    grandLodgeVisit: !!r.grandLodgeVisit,
    emergencyMeeting: !!(r.emergencyMeeting || r.emergency),
    notes: r.notes ?? ''
  }));
}

function bodyCompat(w: Working, action?: 'create'|'update'|'delete') {
  const candidate = (w.candidateName ?? '').toString();
  const section = (w.section ?? candidate || 'Candidate').toString(); // legacy field fallback
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
    // candidate aliases
    candidateName: candidate,
    candidate: candidate,
    name: candidate,
    candidate_full_name: candidate,
    // legacy section aliases (required by some schemas)
    section,
    part: section,
    role: section,
    // booleans explicit
    grandLodgeVisit: glv,
    emergencyMeeting: emerg,
    emergency: emerg,
    // notes always string
    notes
  };
  return b;
}

export async function createWorking(payload: Working) {
  if (!payload.dateISO) throw new Error('Date is required');
  if (!payload.degree) throw new Error('Please select Work of the evening');
  if (!payload.candidateName) throw new Error('Please enter the Candidate Name');

  const res = await fetch('/api/my-work', withCreds({ method: 'POST', body: JSON.stringify(bodyCompat(payload, 'create')) }));
  if (!res.ok) { const txt = await res.text(); throw new Error(txt || 'Save failed'); }
  const saved = (await parseJsonSafe<any>(res)) || {};
  return { id: saved.id ?? saved._id, ...payload };
}

export async function updateWorking(id: string, payload: Working) {
  if (!payload.dateISO) throw new Error('Date is required');
  if (!payload.degree) throw new Error('Please select Work of the evening');
  if (!payload.candidateName) throw new Error('Please enter the Candidate Name');

  const res = await fetch('/api/my-work', withCreds({ method: 'POST', body: JSON.stringify(bodyCompat({ ...payload, id }, 'update')) }));
  if (!res.ok) { const txt = await res.text(); throw new Error(txt || 'Update failed'); }
  const saved = (await parseJsonSafe<any>(res)) || {};
  return { id: saved.id ?? id, ...payload };
}

export async function deleteWorking(id: string) {
  // Try DELETE first, fallback to POST action
  let res = await fetch(`/api/my-work/${id}`, withCreds({ method: 'DELETE' }));
  if (!res.ok) {
    res = await fetch('/api/my-work', withCreds({ method: 'POST', body: JSON.stringify({ _action: 'delete', id }) }));
  }
  if (!res.ok) { const txt = await res.text(); throw new Error(txt || 'Delete failed'); }
}