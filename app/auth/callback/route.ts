import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { GUEST_COOKIE } from "@/lib/guest/constants";
import { localeCookieHeader } from "@/lib/i18n/cookie";
import { getLocaleForUser } from "@/lib/i18n/user-locale";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }
    cookieStore.delete(GUEST_COOKIE);

    const response = NextResponse.redirect(`${origin}${next}`);
    if (data.user) {
      try {
        const locale = await getLocaleForUser(data.user.id);
        response.headers.append("Set-Cookie", localeCookieHeader(locale));
      } catch {
        // profile locale is optional on first login
      }
    }
    return response;
  }

  return NextResponse.redirect(`${origin}${next}`);
}
