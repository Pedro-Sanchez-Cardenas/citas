export function formatMoneyFromCents(
  amountCents: number | null | undefined,
  currency = 'USD'
): string {
  if (amountCents == null) return '—';
  const amount = (amountCents / 100).toFixed(2);
  const symbol = currency === 'USD' ? '$' : '$';
  return `${symbol}${amount}`;
}
