/**
 * Central Supabase env access. Only NEXT_PUBLIC_* keys belong here —
 * they are embedded in the client bundle by design and rely on RLS.
 *
 * Never use service_role or sb_secret_* keys in this module.
 */

function forbiddenKeyMessage(name: string): string {
  return `[Provisionly] ${name} must not be a secret or service_role key. Use the publishable or anon key from Supabase → Project Settings → API.`;
}

function assertPublicSupabaseKey(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(`[Provisionly] Missing ${name}. Copy .env.example to .env.local and add your Supabase API keys.`);
  }

  const key = value.trim();

  if (
    key.startsWith("sb_secret_") ||
    key.includes("service_role") ||
    name.includes("SERVICE_ROLE")
  ) {
    throw new Error(forbiddenKeyMessage(name));
  }

  return key;
}

export function getSupabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "[Provisionly] Missing NEXT_PUBLIC_SUPABASE_URL. Copy .env.example to .env.local.",
    );
  }

  if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    throw new Error(
      "[Provisionly] NEXT_PUBLIC_SUPABASE_URL must be your https://….supabase.co project URL.",
    );
  }

  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const key = publishable || anon;
  const keyName = publishable
    ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    : "NEXT_PUBLIC_SUPABASE_ANON_KEY";

  return {
    url,
    key: assertPublicSupabaseKey(keyName, key),
  };
}
