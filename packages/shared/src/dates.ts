import { format, isValid, parse } from 'date-fns';

/** Parse a DD/MM/YYYY string; returns null when invalid. */
export function parseDdMmYyyy(value: string): Date | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;
  const d = parse(value, 'dd/MM/yyyy', new Date());
  return isValid(d) ? d : null;
}

export function formatDdMmYyyy(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return format(d, 'dd/MM/yyyy');
}

/** DD/MM/YYYY -> YYYY-MM-DD (for storage / API). */
export function ddMmYyyyToIso(value: string): string | null {
  const d = parseDdMmYyyy(value);
  return d ? format(d, 'yyyy-MM-dd') : null;
}

/** YYYY-MM-DD -> DD/MM/YYYY without timezone shifts. */
export function isoToDdMmYyyy(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
