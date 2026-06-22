#!/usr/bin/env node
/**
 * Verify security hardening migration is applied on the linked Supabase project.
 * Runs `supabase db push` (no-op if up to date) and prints SQL to confirm in dashboard.
 */

import { execSync } from "node:child_process";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

try {
  const pushOutput = run("npx supabase db push");
  console.log("verify:security — db push:", pushOutput.split("\n").pop() ?? pushOutput);
} catch (err) {
  console.error("verify:security — db push failed");
  if (err.stderr) console.error(String(err.stderr));
  process.exit(1);
}

console.log(`
verify:security — confirm in Supabase SQL Editor:

  select proname, pg_get_function_arguments(oid) as args
  from pg_proc
  where proname = 'delete_own_account';

  select policyname from pg_policies
  where tablename = 'list_members' and cmd = 'INSERT';

Expected:
  - delete_own_account(p_confirmation text)
  - Owners can add collaborators
`);
