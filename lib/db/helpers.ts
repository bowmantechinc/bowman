import "server-only";

export function toCsv(values: string[] | undefined): string {
  return (values ?? []).filter(Boolean).join("|");
}

export function fromCsv(value: string | undefined): string[] {
  return (value ?? "")
    .split("|")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function toNumber(value: string | undefined, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
