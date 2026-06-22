#!/usr/bin/env node
/**
 * Verify Supabase Realtime is reachable and list tables are published.
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(import.meta.dirname, "..");
const REQUIRED_TABLES = [
  "lists",
  "list_items",
  "list_members",
  "recipes",
  "recipe_ingredients",
];

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
    // optional if vars are exported
  }
}

function fail(message) {
  console.error(`check:realtime — ${message}`);
  process.exit(1);
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  fail("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

const supabase = createClient(url, anonKey);
const probeListId = "00000000-0000-0000-0000-000000000000";

const timeout = setTimeout(() => {
  fail("Timed out waiting for Realtime SUBSCRIBED (check Database → Replication)");
}, 15000);

const channel = supabase
  .channel("provisionly-realtime-check")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "list_items",
      filter: `list_id=eq.${probeListId}`,
    },
    () => {},
  )
  .subscribe((status, err) => {
    if (status === "SUBSCRIBED") {
      clearTimeout(timeout);
      void supabase.removeChannel(channel);
      console.log("check:realtime — websocket SUBSCRIBED");
      console.log(
        `check:realtime — ensure these tables are enabled in Database → Replication: ${REQUIRED_TABLES.join(", ")}`,
      );
      process.exit(0);
    }

    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      clearTimeout(timeout);
      fail(
        `Realtime ${status}${err ? `: ${err.message}` : ""}. Enable Replication for ${REQUIRED_TABLES.join(", ")}.`,
      );
    }
  });
