"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GUEST_COOKIE } from "@/lib/guest/constants";
import { createClient } from "@/utils/supabase/server";

export async function signOut() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  cookieStore.delete(GUEST_COOKIE);
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function continueAsGuest() {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/home");
}

export async function clearGuestCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_COOKIE);
}

export async function leaveGuestMode() {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_COOKIE);
  revalidatePath("/", "layout");
  redirect("/login");
}
