"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GUEST_COOKIE } from "@/lib/guest/constants";
import { getVerifiedUser } from "@/lib/auth/get-user";
import { setLocaleCookie } from "@/lib/i18n/cookie";
import type { AppLocale } from "@/lib/i18n/locales";
import { getTranslations } from "next-intl/server";
import { parseDeleteConfirmation, parseProfileUpdate } from "@/lib/validation/parse";
import {
  deleteAccountForUser,
  fetchProfileForUser,
  updateProfileForUser,
} from "@/lib/profile/server";
import type { UserProfile } from "@/lib/profile/types";
import { createClient } from "@/utils/supabase/server";

export async function fetchProfileAction(): Promise<UserProfile> {
  const user = await getVerifiedUser();
  return fetchProfileForUser(user.id);
}

export async function updateProfileAction(input: {
  firstName: string;
  lastName: string;
  locale?: AppLocale;
}): Promise<void> {
  const user = await getVerifiedUser();
  const validated = parseProfileUpdate(input);
  await updateProfileForUser(user.id, validated);
  if (validated.locale) {
    await setLocaleCookie(validated.locale);
  }
  revalidatePath("/home");
  revalidatePath("/recipes");
  revalidatePath("/settings");
  revalidatePath("/lists", "layout");
}

export async function deleteAccountAction(confirmation: string): Promise<void> {
  const t = await getTranslations("errors");
  let validated: string;
  try {
    validated = parseDeleteConfirmation(confirmation);
  } catch {
    throw new Error(t("deleteAccountConfirm"));
  }

  await getVerifiedUser();
  await deleteAccountForUser(validated);

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  cookieStore.delete(GUEST_COOKIE);
  revalidatePath("/", "layout");
  redirect("/login");
}
