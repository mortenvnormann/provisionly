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
