#!/usr/bin/env node
/**
 * Fails if staged or tracked files contain likely Supabase secrets.
 * Run: npm run check:secrets
 */

import { execSync } from "node:child_process";

const PATTERNS = [
  { name: "publishable key", regex: /sb_publishable_[a-zA-Z0-9_-]{20,}/ },
  { name: "secret key", regex: /sb_secret_[a-zA-Z0-9_-]{20,}/ },
  { name: "service role in env file", regex: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S+/ },
  { name: "anon key in env file", regex: /SUPABASE_(?:ANON|PUBLISHABLE)_KEY\s*=\s*eyJ/ },
  { name: "JWT service_role", regex: /"role"\s*:\s*"service_role"/ },
  {
    name: "legacy JWT blob",
    regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
  },
  {
    name: "generic API secret",
    regex: /(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*['"]?[a-zA-Z0-9_-]{32,}/i,
  },
];

const ALLOWLIST = new Set([
  ".env.example",
  "scripts/check-secrets.mjs",
  "supabase/setup-all.sql",
]);

const PLACEHOLDER_MARKERS = [
  "your-",
  "placeholder",
  "example",
  "changeme",
  "xxx",
  "…",
  "...",
];

function listTrackedFiles() {
  return execSync("git ls-files", { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);
}

function listStagedFiles() {
  try {
    return execSync("git diff --cached --name-only", { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function readFile(path) {
  try {
    return execSync(`git show :${path}`, { encoding: "utf8" });
  } catch {
    return null;
  }
}

function readWorkingFile(path) {
  try {
    return execSync(`cat "${path.replace(/"/g, '\\"')}"`, { encoding: "utf8" });
  } catch {
    return null;
  }
}

function looksLikePlaceholder(match) {
  const lower = match.toLowerCase();
  return PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker));
}

const files = new Set([...listTrackedFiles(), ...listStagedFiles()]);
let failed = false;

for (const file of files) {
  if (ALLOWLIST.has(file) || file.startsWith("node_modules/")) continue;

  const content =
    readFile(file) ??
    (file.endsWith(".env") || file.includes(".env") ? null : readWorkingFile(file));
  if (!content) continue;

  for (const { name, regex } of PATTERNS) {
    const match = content.match(regex);
    if (match && !looksLikePlaceholder(match[0])) {
      console.error(`✗ Possible ${name} found in: ${file}`);
      failed = true;
    }
  }
}

if (failed) {
  console.error(
    "\nRemove secrets from tracked files. Use .env.local (gitignored) for real keys.\n",
  );
  process.exit(1);
}

console.log("✓ No obvious Supabase secrets in tracked/staged files.");
