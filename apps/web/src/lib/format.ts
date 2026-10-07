export { formatCents, formatDdMmYyyy, isoToDdMmYyyy } from '@asv/shared';

export const fmtTime = (iso: string | Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

export const fmtDateTime = (iso: string | Date) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const localeTag = (l: string) => (l === 'fr' ? 'fr-FR' : 'en-GB');
export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? 'EUR';
