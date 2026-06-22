"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { fetchListSyncAction } from "@/lib/lists/actions";
import { itemsFingerprint } from "@/lib/lists/list-cache";
import type { ListItemRow } from "@/lib/lists/types";

type UseListSyncOptions = {
  listId: string;
  enabled: boolean;
  initialGroupByCategory?: boolean;
  initialTitle?: string;
  onItemsChange: (items: ListItemRow[]) => void;
  onGroupByCategoryChange?: (groupByCategory: boolean) => void;
  onTitleChange?: (title: string) => void;
};

export function useListSync({
  listId,
  enabled,
  initialGroupByCategory = true,
  initialTitle = "",
  onItemsChange,
  onGroupByCategoryChange,
  onTitleChange,
}: UseListSyncOptions) {
  const fingerprintRef = useRef<string>("");
  const groupByCategoryRef = useRef<boolean>(initialGroupByCategory);
  const titleRef = useRef<string>(initialTitle);
  const onItemsChangeRef = useRef(onItemsChange);
  const onGroupByCategoryChangeRef = useRef(onGroupByCategoryChange);
  const onTitleChangeRef = useRef(onTitleChange);

  useEffect(() => {
    onItemsChangeRef.current = onItemsChange;
    onGroupByCategoryChangeRef.current = onGroupByCategoryChange;
    onTitleChangeRef.current = onTitleChange;
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

    void sync();

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
      .subscribe();

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void sync();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, listId]);
}

