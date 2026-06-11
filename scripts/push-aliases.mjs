#!/usr/bin/env node
/**
 * Push category aliases from data/category-aliases.json to remote Supabase.
 * Use when `npm run db:push` is unavailable (CLI not linked).
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(import.meta.dirname, "..");

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local optional if vars are exported
  }
}

function normalizeAlias(alias) {
  return alias.trim().toLowerCase().replace(/\s+/g, " ");
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const entries = JSON.parse(
  readFileSync(join(ROOT, "data/category-aliases.json"), "utf8"),
);

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: categories, error: catError } = await supabase
  .from("categories")
  .select("id, slug");

if (catError) {
  console.error("Failed to load categories:", catError.message);
  process.exit(1);
}

const slugToId = new Map((categories ?? []).map((c) => [c.slug, c.id]));

const rows = [];
for (const entry of entries) {
  const categoryId = slugToId.get(entry.slug);
  if (!categoryId) {
    console.error(`Unknown slug: ${entry.slug}`);
    process.exit(1);
  }
  rows.push({
    alias_normalized: normalizeAlias(entry.alias),
    category_id: categoryId,
    language: entry.language ?? null,
  });
}

const BATCH = 200;
let inserted = 0;
let skipped = 0;

for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const { error } = await supabase.from("category_aliases").upsert(batch, {
    onConflict: "alias_normalized,language",
    ignoreDuplicates: true,
  });

  if (error) {
    console.error(`Batch ${i / BATCH + 1} failed:`, error.message);
    process.exit(1);
  }

  inserted += batch.length;
  process.stdout.write(`\rProcessed ${Math.min(i + BATCH, rows.length)} / ${rows.length}`);
}

const { count, error: countError } = await supabase
  .from("category_aliases")
  .select("*", { count: "exact", head: true });

if (countError) {
  console.error("\nCould not verify count:", countError.message);
  process.exit(1);
}

console.log(`\n✓ Pushed ${rows.length} aliases (${count} total in category_aliases).`);
