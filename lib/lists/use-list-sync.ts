"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { fetchListSyncAction } from "@/lib/lists/actions";
import { itemsFingerprint } from "@/lib/lists/list-cache";
import type { ListItemRow } from "@/lib/lists/types";
import type { ListMemberRow } from "@/lib/share/types";

type UseListSyncOptions = {
  listId: string;
  enabled: boolean;
  skipInitialSync?: boolean;
  initialGroupByCategory?: boolean;
  initialTitle?: string;
  onItemsChange: (items: ListItemRow[]) => void;
  onGroupByCategoryChange?: (groupByCategory: boolean) => void;
  onTitleChange?: (title: string) => void;
  onMembersChange?: (members: ListMemberRow[]) => void;
};

const localFingerprintByList = new Map<string, string>();

/** Mark local optimistic items as already applied so echo sync is a no-op. */
export function markListItemsLocallySynced(
  listId: string,
  items: ListItemRow[],
): void {
  localFingerprintByList.set(listId, itemsFingerprint(items));
}

export function useListSync({
  listId,
  enabled,
  skipInitialSync = false,
  initialGroupByCategory = true,
  initialTitle = "",
  onItemsChange,
  onGroupByCategoryChange,
  onTitleChange,
  onMembersChange,
}: UseListSyncOptions) {
  const fingerprintRef = useRef<string>("");
  const syncGenerationRef = useRef(0);
  const groupByCategoryRef = useRef<boolean>(initialGroupByCategory);
  const titleRef = useRef<string>(initialTitle);
  const membersFingerprintRef = useRef<string>("");
  const onItemsChangeRef = useRef(onItemsChange);
  const onGroupByCategoryChangeRef = useRef(onGroupByCategoryChange);
  const onTitleChangeRef = useRef(onTitleChange);
  const onMembersChangeRef = useRef(onMembersChange);

  useEffect(() => {
    onItemsChangeRef.current = onItemsChange;
    onGroupByCategoryChangeRef.current = onGroupByCategoryChange;
    onTitleChangeRef.current = onTitleChange;
    onMembersChangeRef.current = onMembersChange;
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let syncTimer: ReturnType<typeof setTimeout> | null = null;
    syncGenerationRef.current = 0;

    async function sync() {
      if (document.visibilityState !== "visible") return;
      const gen = ++syncGenerationRef.current;
      try {
        const { items, groupByCategory, title, members } =
          await fetchListSyncAction(listId);
        if (cancelled || gen !== syncGenerationRef.current) return;

        const fingerprint = itemsFingerprint(items);
        const localFingerprint = localFingerprintByList.get(listId);
        if (
          fingerprint === fingerprintRef.current ||
          fingerprint === localFingerprint
        ) {
          fingerprintRef.current = fingerprint;
          if (localFingerprint === fingerprint) {
            localFingerprintByList.delete(listId);
          }
        } else {
          fingerprintRef.current = fingerprint;
          onItemsChangeRef.current(items);
        }

        if (
          onGroupByCategoryChangeRef.current &&
          groupByCategoryRef.current !== groupByCategory
        ) {
          groupByCategoryRef.current = groupByCategory;
          onGroupByCategoryChangeRef.current(groupByCategory);
        }

        if (onTitleChangeRef.current && titleRef.current !== title) {
          titleRef.current = title;
          onTitleChangeRef.current(title);
        }

        if (onMembersChangeRef.current) {
          const membersFingerprint = members
            .map((m) => `${m.userId}:${m.role}:${m.displayName}`)
            .join("|");
          if (membersFingerprint !== membersFingerprintRef.current) {
            membersFingerprintRef.current = membersFingerprint;
            onMembersChangeRef.current(members);
          }
        }
      } catch {
        // Ignore transient network errors during sync
      }
    }

    function scheduleSync() {
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        syncTimer = null;
        void sync();
      }, 100);
    }

    async function syncAll() {
      await sync();
    }

    if (!skipInitialSync) {
      void syncAll();
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`list-sync:${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "list_items",
          filter: `list_id=eq.${listId}`,
        },
        () => {
          scheduleSync();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "lists",
          filter: `id=eq.${listId}`,
        },
        () => {
          scheduleSync();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "list_members",
          filter: `list_id=eq.${listId}`,
        },
        () => {
          scheduleSync();
        },
      )
      .subscribe();

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void syncAll();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      if (syncTimer) clearTimeout(syncTimer);
      void supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, listId, skipInitialSync]);
}
