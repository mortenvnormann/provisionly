import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { GUEST_COOKIE } from "@/lib/guest/constants";
import { getSupabaseEnv } from "@/lib/env";
import { getSupabaseStorageKey } from "@/lib/supabase/storage-key";

const AUTH_PATHS = ["/login", "/auth/callback"];

const PUBLIC_PATHS = new Set([
  "/manifest.webmanifest",
  "/icon",
  "/apple-icon",
]);

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/icons/")) return true;
  if (pathname.startsWith("/serwist/")) return true;
  if (pathname === "/~offline") return true;
  if (pathname === "/api/health") return true;
  return false;
}

/** Server Actions POST to the current page; redirects break the action response. */
function isServerAction(request: NextRequest) {
  return (
    request.headers.has("next-action") ||
    request.headers.has("Next-Action")
  );
}

export async function updateSession(request: NextRequest) {
  const { url, key } = getSupabaseEnv();
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(url, key, {
    auth: {
      storageKey: getSupabaseStorageKey(),
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Supabase auth calls can fail in the Edge runtime (e.g. `fetch failed`).
  // If that happens, do not redirect here—let server components (Node runtime)
  // validate auth instead to avoid login redirect loops.
  let user: unknown = null;
  let authChecked = true;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    authChecked = false;
  }

  const isGuest = request.cookies.get(GUEST_COOKIE)?.value === "1";
  const hasAccess = (!!user as boolean) || isGuest;

  if (!authChecked) {
    return supabaseResponse;
  }

  if (isServerAction(request)) {
    if (user && request.cookies.get(GUEST_COOKIE)) {
      supabaseResponse.cookies.delete(GUEST_COOKIE);
    }
    return supabaseResponse;
  }

  if (isPublicPath(pathname)) {
    return supabaseResponse;
  }

  if (pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = hasAccess ? "/home" : "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (!hasAccess && !isAuthPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    const returnPath = `${pathname}${request.nextUrl.search}`;
    if (returnPath !== "/login") {
      redirectUrl.searchParams.set("next", returnPath);
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (hasAccess && pathname === "/login" && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/home";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && request.cookies.get(GUEST_COOKIE)) {
    supabaseResponse.cookies.delete(GUEST_COOKIE);
  }

  return supabaseResponse;
}
