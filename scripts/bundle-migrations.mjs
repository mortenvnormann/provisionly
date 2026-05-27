#!/usr/bin/env node
/**
 * Regenerates supabase/setup-all.sql from supabase/migrations/*.sql
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const migrationsDir = join(root, "supabase", "migrations");
const outFile = join(root, "supabase", "setup-all.sql");

const files = (await readdir(migrationsDir))
  .filter((f) => f.endsWith(".sql"))
  .sort();

const header = `-- =============================================================================
-- Provisionly: run this ENTIRE file once in Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/_/sql/new
-- Generated from supabase/migrations/ — do not edit by hand; run: npm run db:bundle
-- =============================================================================

`;

let body = "";
for (const file of files) {
  const sql = await readFile(join(migrationsDir, file), "utf8");
  body += `-- --- ${file} ---\n${sql}\n\n`;
}

await writeFile(outFile, header + body);
console.log(`Wrote ${outFile} (${files.length} migrations)`);
