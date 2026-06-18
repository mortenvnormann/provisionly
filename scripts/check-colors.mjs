#!/usr/bin/env node
/**
 * Fails if UI source files contain hardcoded colors outside the palette system.
 * Run: npm run check:colors
 */

import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

const ALLOWLIST = new Set([
  "app/design-tokens.css",
  "lib/design/palette.ts",
  "scripts/check-colors.mjs",
  "scripts/check-secrets.mjs",
]);

const SCAN_DIRS = ["components", "app", "lib"];

const PATTERNS = [
  { name: "hex color", regex: /#[0-9a-fA-F]{3,8}\b/ },
  { name: "text-white", regex: /\btext-white\b/ },
  { name: "bg-black", regex: /\bbg-black\b/ },
  { name: "rgb()/rgba()", regex: /\b(?:rgb|rgba)\(/ },
];

function listFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const rel = relative(ROOT, path);
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const stat = statSync(path);
    if (stat.isDirectory()) {
      listFiles(path, acc);
      continue;
    }
    if (/\.(tsx|ts|css)$/.test(entry)) acc.push(rel);
  }
  return acc;
}

function trackedFiles() {
  try {
    return execSync("git ls-files", { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

const files = new Set();
for (const dir of SCAN_DIRS) {
  try {
    for (const file of listFiles(join(ROOT, dir))) files.add(file);
  } catch {
    // directory may not exist
  }
}
for (const file of trackedFiles()) {
  if (SCAN_DIRS.some((dir) => file.startsWith(`${dir}/`))) files.add(file);
}

let failed = false;

for (const file of [...files].sort()) {
  if (ALLOWLIST.has(file)) continue;
  if (file.endsWith(".css") && file !== "app/globals.css") continue;

  let content;
  try {
    content = readFileSync(join(ROOT, file), "utf8");
  } catch {
    continue;
  }

  for (const { name, regex } of PATTERNS) {
    if (regex.test(content)) {
      console.error(`✗ Hardcoded ${name} found in: ${file}`);
      failed = true;
      regex.lastIndex = 0;
    }
  }
}

if (failed) {
  console.error(
    "\nUse CSS variables from app/design-tokens.css (e.g. var(--accent)).\n" +
      "Exceptions: lib/design/palette.ts, app/design-tokens.css\n",
  );
  process.exit(1);
}

console.log("✓ No hardcoded colors in UI source files.");
