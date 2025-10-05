export function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
export function startOfLast12Months(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1 - 11 * 30); // fallback rough
}
// Better precise 12 months back: same day last year + 1 day
export function oneYearAgo(d = new Date()) {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() - 1);
  return x;
}
