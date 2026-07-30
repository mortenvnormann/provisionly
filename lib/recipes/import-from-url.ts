import type { RecipeIngredientInput, RecipeInput } from "@/lib/recipes/types";

const MAX_HTML_BYTES = 1_500_000;
const FETCH_TIMEOUT_MS = 10_000;

const UNIT_PATTERN =
  "cups?|cup|tablespoons?|tbsps?|tbsp|teaspoons?|tsps?|tsp|ounces?|oz|pounds?|lbs?|lb|grams?|grammes?|g|kilograms?|kg|milliliters?|millilitres?|ml|liters?|litres?|l|pinch|pinches|cloves?|slices?|cans?|packages?|pkg|packets?|bunches?|heads?|stalks?|pieces?|pcs?|whole|large|medium|small";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function typeIncludes(typeValue: unknown, typeName: string): boolean {
  const types = asArray(typeValue).map((entry) =>
    String(entry).replace(/^schema:/i, "").toLowerCase(),
  );
  return types.includes(typeName.toLowerCase());
}

function collectNodes(value: unknown, out: Record<string, unknown>[] = []) {
  if (Array.isArray(value)) {
    for (const entry of value) collectNodes(entry, out);
    return out;
  }
  if (!isRecord(value)) return out;
  out.push(value);
  if ("@graph" in value) collectNodes(value["@graph"], out);
  return out;
}

function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const scriptRe =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRe.exec(html)) !== null) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // Ignore malformed JSON-LD blocks
    }
  }
  return blocks;
}

function findRecipeNode(html: string): Record<string, unknown> | null {
  for (const block of extractJsonLdBlocks(html)) {
    for (const node of collectNodes(block)) {
      if (typeIncludes(node["@type"], "Recipe")) return node;
    }
  }
  return null;
}

function textContent(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value.map(textContent).filter(Boolean).join("\n").trim();
  }
  if (isRecord(value)) {
    if (typeof value.name === "string") return value.name.trim();
    if (typeof value.text === "string") return value.text.trim();
    if (typeof value["@value"] === "string") return value["@value"].trim();
  }
  return "";
}

function parseIsoDurationMinutes(value: unknown): number | null {
  const raw = textContent(value);
  if (!raw) return null;
  const match = raw.match(
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i,
  );
  if (!match) return null;
  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);
  const total = days * 24 * 60 + hours * 60 + minutes + Math.round(seconds / 60);
  return total > 0 ? total : null;
}

function parseServings(value: unknown): number {
  const raw = textContent(value);
  if (!raw) return 4;
  const match = raw.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 4;
  const n = Math.round(Number(match[1]));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 1000) : 4;
}

function parseFraction(token: string): number | null {
  if (/^\d+(?:\.\d+)?$/.test(token)) return Number(token);
  const mixed = token.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  }
  const frac = token.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return null;
}

export function parseIngredientLine(line: string): RecipeIngredientInput {
  const cleaned = line.replace(/\s+/g, " ").trim();
  if (!cleaned) return { name: "" };

  const unitRe = new RegExp(
    `^(\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?)\\s*(${UNIT_PATTERN})?\\b\\s*(.*)$`,
    "i",
  );
  const match = cleaned.match(unitRe);
  if (!match) return { name: cleaned };

  const quantity = parseFraction(match[1]!.trim());
  const unit = match[2]?.trim() || null;
  const name = (match[3] ?? "").trim() || cleaned;

  return {
    name,
    quantity: quantity != null && Number.isFinite(quantity) ? quantity : null,
    unit,
  };
}

function parseIngredients(value: unknown): RecipeIngredientInput[] {
  return asArray(value)
    .map((entry) => parseIngredientLine(textContent(entry)))
    .filter((item) => item.name.length > 0)
    .slice(0, 200);
}

function parseInstructions(value: unknown): string {
  const steps: string[] = [];

  function walk(node: unknown) {
    if (node == null) return;
    if (typeof node === "string") {
      for (const line of node.split(/\n+/)) {
        const trimmed = line.trim();
        if (trimmed) steps.push(trimmed);
      }
      return;
    }
    if (Array.isArray(node)) {
      for (const entry of node) walk(entry);
      return;
    }
    if (!isRecord(node)) return;

    if (typeIncludes(node["@type"], "HowToSection")) {
      walk(node.itemListElement);
      return;
    }
    if (
      typeIncludes(node["@type"], "HowToStep") ||
      typeIncludes(node["@type"], "HowToDirection")
    ) {
      const text = textContent(node.text) || textContent(node.name);
      if (text) steps.push(text);
      return;
    }

    if (node.itemListElement != null) {
      walk(node.itemListElement);
      return;
    }

    const text = textContent(node.text) || textContent(node.name);
    if (text) steps.push(text);
  }

  walk(value);
  return steps.join("\n").slice(0, 50_000);
}

function parseTags(recipe: Record<string, unknown>): string[] {
  const tags = new Set<string>();
  for (const key of ["keywords", "recipeCategory", "recipeCuisine"] as const) {
    const value = recipe[key];
    if (typeof value === "string") {
      for (const part of value.split(/[,;|]/)) {
        const tag = part.trim();
        if (tag) tags.add(tag.slice(0, 50));
      }
      continue;
    }
    for (const entry of asArray(value)) {
      const tag = textContent(entry);
      if (tag) tags.add(tag.slice(0, 50));
    }
  }
  return [...tags].slice(0, 30);
}

function extractOpenGraph(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["'][^>]*>`,
    "i",
  );
  const match = html.match(re);
  return (match?.[1] || match?.[2] || "").trim() || null;
}

export function mapHtmlToRecipeInput(
  html: string,
  sourceUrl: string,
): RecipeInput | null {
  const recipe = findRecipeNode(html);
  const ogTitle = extractOpenGraph(html, "og:title");
  const ogDescription = extractOpenGraph(html, "og:description");

  if (!recipe) {
    if (!ogTitle) return null;
    return {
      title: ogTitle.slice(0, 200),
      description: (ogDescription ?? "").slice(0, 10_000),
      instructions: "",
      tags: [],
      defaultServings: 4,
      prepMinutes: null,
      cookMinutes: null,
      sourceUrl,
      ingredients: [],
    };
  }

  const title =
    textContent(recipe.name) || ogTitle || "Imported recipe";
  const description =
    textContent(recipe.description) || ogDescription || "";
  const ingredients = parseIngredients(recipe.recipeIngredient);
  const instructions = parseInstructions(recipe.recipeInstructions);

  if (!title.trim() && ingredients.length === 0 && !instructions) {
    return null;
  }

  return {
    title: title.slice(0, 200) || "Imported recipe",
    description: description.slice(0, 10_000),
    instructions,
    tags: parseTags(recipe),
    defaultServings: parseServings(
      recipe.recipeYield ?? recipe.yield ?? recipe.recipeServings,
    ),
    prepMinutes: parseIsoDurationMinutes(recipe.prepTime),
    cookMinutes: parseIsoDurationMinutes(recipe.cookTime),
    sourceUrl,
    ingredients,
  };
}

export async function fetchRecipeHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "Mozilla/5.0 (compatible; ProvisionlyRecipeImport/1.0; +https://provisionly.app)",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_HTML_BYTES) {
      throw new Error("Response too large");
    }
    return new TextDecoder("utf-8").decode(buffer);
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeImportUrl(raw: string): string {
  const trimmed = raw.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Invalid protocol");
  }
  return url.toString();
}
