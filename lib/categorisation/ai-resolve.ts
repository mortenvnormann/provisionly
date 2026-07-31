import "server-only";

import type { CategoryRow } from "@/lib/lists/types";

const MODEL = "gemini-2.0-flash";
const TIMEOUT_MS = 8_000;

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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      console.error(
        "[categorisation] Gemini HTTP",
        response.status,
        await response.text().catch(() => ""),
      );
      return null;
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
    if (!text) return null;

    const parsed = JSON.parse(text) as { slug?: unknown };
    const slug = typeof parsed.slug === "string" ? parsed.slug.trim() : "";
    if (!slug) return null;
    if (slug === "general") return "general";
    if (!slugSet.has(slug)) return null;
    return slug;
  } catch (error) {
    console.error("[categorisation] Gemini failed:", error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
