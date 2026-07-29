export function normalizeItemName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function nextSortKey(existing: string[]): string {
  if (existing.length === 0) return "a0";
  const last = existing[existing.length - 1];
  const match = last.match(/^a(\d+)$/);
  const n = match ? Number.parseInt(match[1], 10) + 1 : existing.length;
  return `a${n}`;
}

export function compareSortKeys(a: string, b: string): number {
  const ma = a.match(/^a(\d+)$/);
  const mb = b.match(/^a(\d+)$/);
  if (ma && mb) return Number(ma[1]) - Number(mb[1]);
  return a.localeCompare(b);
}
