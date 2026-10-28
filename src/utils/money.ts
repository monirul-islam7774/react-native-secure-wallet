/** All amounts travel as integer minor units (paisa/cents) — same contract as digital-wallet-api. */
const MINOR_DIGITS: Record<string, number> = { BDT: 2, USD: 2, JPY: 0 };

export function minorDigits(currency: string): number {
  return MINOR_DIGITS[currency] ?? 2;
}

/** 150050, 'BDT' -> '৳1,500.50' (locale-aware, no floating-point maths on stored values). */
export function formatMoney(minor: number, currency: string): string {
  const digits = minorDigits(currency);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(minor / 10 ** digits);
}

/**
 * Parses user input like "1,500.5" into minor units using string maths (no float rounding bugs).
 * Returns null for invalid, zero, negative or too-precise input.
 */
export function parseAmount(input: string, currency: string): number | null {
  const digits = minorDigits(currency);
  const clean = input.replace(/,/g, '').trim();
  const pattern = digits === 0 ? /^\d+$/ : new RegExp(`^\\d+(\\.\\d{1,${digits}})?$`);
  if (!pattern.test(clean)) return null;

  const [whole, fraction = ''] = clean.split('.');
  const minor = Number(whole + fraction.padEnd(digits, '0'));
  if (!Number.isSafeInteger(minor) || minor <= 0) return null;
  return minor;
}
