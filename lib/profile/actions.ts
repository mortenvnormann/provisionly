"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GUEST_COOKIE } from "@/lib/guest/constants";
import { getVerifiedUser } from "@/lib/auth/get-user";
import {
  deleteAccountForUser,
  fetchProfileForUser,
  updateProfileForUser,
} from "@/lib/profile/server";
import type { UserProfile } from "@/lib/profile/types";
import { createClient } from "@/utils/supabase/server";

const DELETE_CONFIRMATION = "delete my account";

export async function fetchProfileAction(): Promise<UserProfile> {
  const user = await getVerifiedUser();
  return fetchProfileForUser(user.id);
}

export async function updateProfileAction(input: {
  firstName: string;
  lastName: string;
}): Promise<void> {
  const user = await getVerifiedUser();
  await updateProfileForUser(user.id, input);
  revalidatePath("/home");
  revalidatePath("/recipes");
  revalidatePath("/settings");
}

export async function deleteAccountAction(confirmation: string): Promise<void> {
  if (confirmation !== DELETE_CONFIRMATION) {
    throw new Error('Type "delete my account" to confirm.');
  }

  await getVerifiedUser();
  await deleteAccountForUser();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  cookieStore.delete(GUEST_COOKIE);
  revalidatePath("/", "layout");
  redirect("/login");
}
