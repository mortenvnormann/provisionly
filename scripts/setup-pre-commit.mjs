#!/usr/bin/env node
/**
 * Installs a git pre-commit hook that runs npm run check:secrets.
 * Run once after clone: npm run setup:hooks
 */

import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const gitDir = join(process.cwd(), ".git");
const hooksDir = join(gitDir, "hooks");
const hookPath = join(hooksDir, "pre-commit");

if (!existsSync(gitDir)) {
  console.log("No .git directory — skipping pre-commit hook setup.");
  process.exit(0);
}

mkdirSync(hooksDir, { recursive: true });

const hook = `#!/bin/sh
set -e
npm run check:secrets
`;

writeFileSync(hookPath, hook, { mode: 0o755 });
chmodSync(hookPath, 0o755);
console.log("✓ Installed pre-commit hook (check:secrets).");
