export const CODE_MAX_LEN = 24;

export function normalizeInput(raw: string, fallback: string): string {
  const clean = raw.replace(/\s+/g, ' ').trim().slice(0, CODE_MAX_LEN).trim();
  return clean || fallback;
}

export function formatOutput(prefix: string, value: string): string {
  return `${prefix} ${value}`;
}
