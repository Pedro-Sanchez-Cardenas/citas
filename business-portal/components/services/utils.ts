export function formatPriceFromCents(
  priceCents: number | null | undefined,
  currency = 'USD'
): string {
  if (priceCents == null) return '—';
  const amount = (priceCents / 100).toFixed(2);
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '$';
  return `${symbol}${amount} ${currency}`;
}
