import "server-only";

import { cookies } from "next/headers";
import { resolveLocale } from "@/lib/i18n/locales";
import type { AppLocale } from "@/lib/i18n/locales";
import type { UserProfile } from "@/lib/profile/types";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/utils/supabase/server";

export async function fetchProfileForUser(userId: string): Promise<UserProfile> {
  const service = createServiceClient();

  const { data: profile, error } = await service
    .from("profiles")
    .select("first_name, last_name, display_name, locale")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const {
    data: { user },
    error: authError,
  } = await service.auth.admin.getUserById(userId);

  if (authError || !user?.email) {
    throw new Error(authError?.message ?? "Could not load account email");
  }

  return {
    firstName: profile?.first_name ?? null,
    lastName: profile?.last_name ?? null,
    displayName: profile?.display_name ?? null,
    email: user.email,
    locale: resolveLocale(profile?.locale),
  };
}

export async function updateProfileForUser(
  userId: string,
  input: { firstName: string; lastName: string; locale?: AppLocale },
): Promise<void> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || null;

  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({
      first_name: firstName || null,
      last_name: lastName || null,
      display_name: displayName,
      ...(input.locale ? { locale: input.locale } : {}),
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

export async function deleteAccountForUser(confirmation: string): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.rpc("delete_own_account", {
    p_confirmation: confirmation,
  });

  if (error) throw new Error(error.message);
}
