import { cache } from "react";
import { cookies } from "next/headers";
import { GUEST_COOKIE } from "@/lib/guest/constants";
import { createClient } from "@/utils/supabase/server";

export const getSessionState = cache(async function getSessionState() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isGuest = cookieStore.get(GUEST_COOKIE)?.value === "1";

  return { user, isGuest, isAuthenticated: !!user };
});
