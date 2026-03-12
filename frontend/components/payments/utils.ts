export function formatMoney(amount: number | null | undefined, currency = 'USD'): string {
  if (amount == null) return '—';
  const symbol = currency === 'USD' ? '$' : '$';
  return `${symbol}${Number(amount).toFixed(2)}`;
}

export const PAYMENT_METHODS = ['efectivo', 'tarjeta', 'transferencia', 'otro'];
export const PAYMENT_STATUS = ['pending', 'paid', 'failed', 'refunded'];
