const E164 = /^\+[1-9]\d{7,14}$/;

/**
 * Normalise an Indian-style number to E.164 (+91XXXXXXXXXX).
 * Accepts "98400 12345", "098400-12345", "919840012345", "+91 98400 12345".
 * Returns null when it can't be a valid number.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  let s = (raw ?? "").replace(/[\s\-().]/g, "");
  if (!s) return null;
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  if (!s.startsWith("+")) {
    const digits = s.length === 11 && s.startsWith("0") ? s.slice(1) : s;
    if (/^[6-9]\d{9}$/.test(digits)) s = `+91${digits}`;
    else if (/^91[6-9]\d{9}$/.test(digits)) s = `+${digits}`;
    else s = `+${digits}`;
  }
  return E164.test(s) ? s : null;
}

export function isValidPhone(raw: string | null | undefined): boolean {
  return normalizePhone(raw) !== null;
}

/** WhatsApp id: digits only. */
export function waId(phone: string | null | undefined): string {
  return (phone ?? "").replace(/\D/g, "");
}

export function waLink(phone: string | null | undefined, text?: string): string {
  const base = `https://wa.me/${waId(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** "+91 98400 12345" for display (Indian numbers), other numbers unchanged. */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = waId(phone);
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return phone.startsWith("+") ? phone : `+${digits}`;
}

export function telLink(phone: string | null | undefined): string {
  return `tel:+${waId(phone)}`;
}
