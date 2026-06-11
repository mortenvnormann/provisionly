import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";

/**
 * Server-only Supabase client (bypasses RLS).
 * Always pair with getVerifiedUser() and enforce ownership in application code.
 *
 * Required on newer Supabase projects where PostgREST cannot verify ES256 user JWTs
 * (auth.getUser() works, but auth.uid() is null in RLS).
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local from Supabase → Project Settings → API → service_role (secret). Never expose this in the browser.",
    );
  }

  if (key.startsWith("sb_publishable_")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY must be the secret service_role key, not the publishable key.",
    );
  }

  const { url } = getSupabaseEnv();

  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
