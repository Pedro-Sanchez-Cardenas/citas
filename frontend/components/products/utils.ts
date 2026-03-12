export function formatMoneyFromCents(amountCents: number | null | undefined): string {
  if (amountCents == null) return '—';
  const amount = (amountCents / 100).toFixed(2);
  return `$${amount}`;
}
