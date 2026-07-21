export function convertSarToYer(amountSar: number | string, rate: number | string): number {
  const base = Number(amountSar);
  const exchangeRate = Number(rate);
  if (!Number.isFinite(base) || !Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    return Math.floor(base);
  }
  return Math.floor(base * exchangeRate);
}

export function normalizeAccountNumber(value: string): string {
  return value.replace(/\D/g, '');
}
