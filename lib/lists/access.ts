import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

/** Constant-time access check for a single list (owner or member). */
export async function assertListAccess(
  userId: string,
  listId: string,
): Promise<void> {
  const service = createServiceClient();
  const [{ data: owned }, { data: membership }] = await Promise.all([
    service
      .from("lists")
      .select("id")
      .eq("id", listId)
      .eq("owner_id", userId)
      .maybeSingle(),
    service
      .from("list_members")
      .select("list_id")
      .eq("list_id", listId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (!owned && !membership) {
    throw new Error("List not found");
  }
}
