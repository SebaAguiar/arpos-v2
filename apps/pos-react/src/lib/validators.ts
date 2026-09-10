export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export function isValidCuit(raw: string): boolean {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length !== 11) return false;

  const sum = CUIT_WEIGHTS.reduce(
    (acc, weight, i) => acc + Number(digits[i]) * weight,
    0,
  );
  const remainder = sum % 11;
  const expected = remainder === 0 ? 0 : remainder === 1 ? -1 : 11 - remainder;

  return expected === Number(digits[10]);
}

export function validatePasswordMatch(password: string, confirm: string): boolean {
  return password === confirm;
}