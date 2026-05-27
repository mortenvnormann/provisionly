"use client";

import { GUEST_LISTS_KEY } from "@/lib/guest/constants";
import {
  migrateGuestListsAction,
  type GuestMigrationResult,
} from "@/lib/lists/actions";
import { getGuestLists } from "@/lib/guest/storage";

export type { GuestMigrationResult };

export function hasPendingGuestLists(): boolean {
  return getGuestLists().length > 0;
}

/** Read local guest lists, import via server action (authenticated cookies), update localStorage. */
export async function runGuestMigration(): Promise<GuestMigrationResult> {
  const guestLists = getGuestLists();

  if (guestLists.length === 0) {
    return {
      migrated: 0,
      skipped: 0,
      errors: [],
      migratedGuestIds: [],
      lists: [],
    };
  }

  const result = await migrateGuestListsAction(guestLists);

  if (result.migratedGuestIds.length > 0) {
    const remaining = guestLists.filter(
      (list) => !result.migratedGuestIds.includes(list.id),
    );
    if (remaining.length === 0) {
      localStorage.removeItem(GUEST_LISTS_KEY);
    } else {
      localStorage.setItem(GUEST_LISTS_KEY, JSON.stringify(remaining));
    }
  }

  return result;
}
