/** Basic normalize for storage / display keys. */
export function normalizeItemName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Stronger normalize for category matching: strip leading quantities/units
 * and fold common Latin diacritics so "mælk" / "Mælk 1L" can match.
 */
export function normalizeForCategoryMatch(name: string): string {
  let value = normalizeItemName(name);
  if (!value) return value;

  // Strip repeated leading quantity / unit prefixes (e.g. "2x", "500 g", "1 liter").
  const qtyPrefix =
    /^(?:\d+(?:[.,]\d+)?\s*(?:x|×)?\s*|\d+(?:[.,]\d+)?\s*(?:kg|g|l|ml|cl|dl|liter|litre|stk|pk|pakke|pack|pcs|pc|oz|lb)\.?\s*)+/i;
  value = value.replace(qtyPrefix, "").trim();

  // Strip trailing quantity / unit (e.g. "mælk 1l", "eggs 12pcs").
  value = value
    .replace(
      /\s+\d+(?:[.,]\d+)?\s*(?:kg|g|l|ml|cl|dl|liter|litre|stk|pk|pakke|pack|pcs|pc|oz|lb)?\.?$/i,
      "",
    )
    .trim();

  return foldDiacritics(value).replace(/\s+/g, " ").trim();
}

function foldDiacritics(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
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
