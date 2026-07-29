import { getSupabaseEnv } from "@/lib/env";

/** Cookie/storage key used by @supabase/ssr (e.g. sb-<project-ref>-auth-token). */
export function getSupabaseStorageKey(): string {
  const { url } = getSupabaseEnv();
  const projectRef = new URL(url).hostname.split(".")[0];
  return `sb-${projectRef}-auth-token`;
}
