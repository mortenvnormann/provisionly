"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { fetchListSyncAction } from "@/lib/lists/actions";
import { fetchListMembersAction } from "@/lib/share/actions";
import { itemsFingerprint } from "@/lib/lists/list-cache";
import type { ListItemRow } from "@/lib/lists/types";
import type { ListMemberRow } from "@/lib/share/types";

type UseListSyncOptions = {
  listId: string;
  enabled: boolean;
  initialGroupByCategory?: boolean;
  initialTitle?: string;
  onItemsChange: (items: ListItemRow[]) => void;
  onGroupByCategoryChange?: (groupByCategory: boolean) => void;
  onTitleChange?: (title: string) => void;
  onMembersChange?: (members: ListMemberRow[]) => void;
};

export function useListSync({
  listId,
  enabled,
  initialGroupByCategory = true,
  initialTitle = "",
  onItemsChange,
  onGroupByCategoryChange,
  onTitleChange,
  onMembersChange,
}: UseListSyncOptions) {
  const fingerprintRef = useRef<string>("");
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

    async function sync() {
      if (document.visibilityState !== "visible") return;
      try {
        const { items, groupByCategory, title } =
          await fetchListSyncAction(listId);
        if (cancelled) return;

        const fingerprint = itemsFingerprint(items);
        if (fingerprint !== fingerprintRef.current) {
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
      } catch {
        // Ignore transient network errors during sync
      }
    }

    async function syncMembers() {
      if (document.visibilityState !== "visible") return;
      if (!onMembersChangeRef.current) return;
      try {
        const members = await fetchListMembersAction(listId);
        if (cancelled) return;

        const fingerprint = members
          .map((m) => `${m.userId}:${m.role}:${m.displayName}`)
          .join("|");
        if (fingerprint !== membersFingerprintRef.current) {
          membersFingerprintRef.current = fingerprint;
          onMembersChangeRef.current(members);
        }
      } catch {
        // Ignore transient network errors during sync
      }
    }

    async function syncAll() {
      await Promise.all([sync(), syncMembers()]);
    }

    void syncAll();

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
          void sync();
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
          void sync();
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
          void syncMembers();
        },
      )
      .subscribe();

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void syncAll();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, listId]);
}
