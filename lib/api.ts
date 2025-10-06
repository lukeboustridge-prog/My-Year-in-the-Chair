export type CreateVisitInput = {
  lodgeName: string;
  lodgeNo: string;
  date: string | Date;
  notes?: string;
};

export async function createVisit(input: CreateVisitInput) {
  const res = await fetch('/api/visits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteVisit(id: string) {
  const res = await fetch(`/api/visits?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type CreateWorkingInput = {
  lodgeName: string;
  lodgeNo: string;
  workingType: string;
  date: string | Date;
  notes?: string;
};

export async function createWorking(input: CreateWorkingInput) {
  const res = await fetch('/api/workings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteWorking(id: string) {
  const res = await fetch(`/api/workings?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
