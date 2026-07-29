import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";
import { getSupabaseStorageKey } from "@/lib/supabase/storage-key";

export const createClient = () => {
  const { url, key } = getSupabaseEnv();

  return createBrowserClient(url, key, {
    auth: {
      storageKey: getSupabaseStorageKey(),
    },
  });
};
