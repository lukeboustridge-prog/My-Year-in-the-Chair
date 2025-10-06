export async function createVisit(input: { lodgeName:string; lodgeNo:string; date:string|Date; notes?:string }) {
  const res = await fetch('/api/visits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createWorking(input: { lodgeName:string; lodgeNo:string; workingType:string; date:string|Date; notes?:string }) {
  const res = await fetch('/api/workings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
