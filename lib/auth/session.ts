import { cache } from "react";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { GUEST_COOKIE } from "@/lib/guest/constants";
import { createClient } from "@/utils/supabase/server";

export const getSessionState = cache(async function getSessionState() {
  const cookieStore = await cookies();
  const isGuest = cookieStore.get(GUEST_COOKIE)?.value === "1";

  let user: User | null = null;
  try {
    const supabase = createClient(cookieStore);
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch {
    // Edge/network auth failures should not crash the app shell.
    user = null;
  }

  return { user, isGuest, isAuthenticated: !!user };
});
