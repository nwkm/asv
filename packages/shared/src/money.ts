/** Parse "12,50" / "12.50" into integer cents; null if invalid or not positive. */
export function parseAmountToCents(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return cents > 0 ? cents : null;
}

export function formatCents(cents: number, locale = 'fr-FR', currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}
