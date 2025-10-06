export function toISODate(dateStr: string): string {
  // Accepts 'YYYY-MM-DD' or 'DD/MM/YYYY' and returns 'YYYY-MM-DD'
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch {}
  return dateStr;
}

export function toDisplayDate(isoOrLocal: string): string {
  // Returns dd/mm/yyyy for any parseable date
  if (!isoOrLocal) return '—';
  const iso = toISODate(isoOrLocal);
  const [y, m, d] = iso.split('-');
  if (y && m && d) return `${d}/${m}/${y}`;
  try {
    const dt = new Date(isoOrLocal);
    if (!isNaN(dt.getTime())) {
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const yyyy = String(dt.getFullYear());
      return `${dd}/${mm}/${yyyy}`;
    }
  } catch {}
  return isoOrLocal;
}