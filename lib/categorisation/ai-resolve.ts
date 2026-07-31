import "server-only";

import type { CategoryRow } from "@/lib/lists/types";

/** Prefer current Flash-Lite; fall back if a model ID 404s for the key/project. */
const MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"] as const;
const TIMEOUT_MS = 4_000;

function categoryLabel(category: CategoryRow, locale: string): string {
  return (
    category.labels[locale] ??
    category.labels.en ??
    category.slug.replace(/_/g, " ")
  );
}

export function getGeminiApiKey(): string | null {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  return key || null;
}

export async function categorizeItemWithGemini(options: {
  itemName: string;
  locale: string;
  categories: CategoryRow[];
}): Promise<string | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const name = options.itemName.trim();
  if (!name) return null;

  const catalog = options.categories
    .filter((category) => category.slug !== "general")
    .map((category) => ({
      slug: category.slug,
      label: categoryLabel(category, options.locale),
    }));

  if (catalog.length === 0) return null;

  const slugSet = new Set(catalog.map((entry) => entry.slug));
  const prompt = [
    "You categorise grocery list items for a shopping app.",
    `User locale: ${options.locale}`,
    "Pick exactly one category slug from this closed list:",
    JSON.stringify(catalog),
    'If unsure, return "general".',
    "Reply with JSON only: {\"slug\":\"...\"}",
    `Item name: ${JSON.stringify(name)}`,
  ].join("\n");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    for (const model of MODELS) {
      const result = await callGeminiModel({
        apiKey,
        model,
        prompt,
        signal: controller.signal,
        slugSet,
      });
      if (result.status === "ok") return result.slug;
      if (result.status === "not_found") {
        console.error(
          "[categorisation] Gemini model not found, trying next:",
          model,
        );
        continue;
      }
      // Other HTTP/parse failures: stop (don't burn fallbacks on bad responses).
      return null;
    }
    return null;
  } catch (error) {
    console.error("[categorisation] Gemini failed:", error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

type GeminiCallResult =
  | { status: "ok"; slug: string }
  | { status: "not_found" }
  | { status: "error" };

async function callGeminiModel(options: {
  apiKey: string;
  model: string;
  prompt: string;
  signal: AbortSignal;
  slugSet: Set<string>;
}): Promise<GeminiCallResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${encodeURIComponent(options.apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: options.signal,
    body: JSON.stringify({
      contents: [{ parts: [{ text: options.prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        // Gemini 3.x: prefer thinkingLevel; avoid deprecated temperature.
        thinkingConfig: { thinkingLevel: "minimal" },
      },
    }),
  });

  if (response.status === 404) {
    console.error(
      "[categorisation] Gemini HTTP 404",
      options.model,
      await response.text().catch(() => ""),
    );
    return { status: "not_found" };
  }

  if (!response.ok) {
    console.error(
      "[categorisation] Gemini HTTP",
      response.status,
      options.model,
      await response.text().catch(() => ""),
    );
    return { status: "error" };
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) return { status: "error" };

  try {
    const parsed = JSON.parse(text) as { slug?: unknown };
    const slug = typeof parsed.slug === "string" ? parsed.slug.trim() : "";
    if (!slug) return { status: "error" };
    if (slug === "general") return { status: "ok", slug: "general" };
    if (!options.slugSet.has(slug)) return { status: "error" };
    return { status: "ok", slug };
  } catch {
    return { status: "error" };
  }
}
