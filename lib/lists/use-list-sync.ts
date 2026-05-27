"use client";

import { useEffect, useRef } from "react";
import { fetchListSyncAction } from "@/lib/lists/actions";
import { itemsFingerprint } from "@/lib/lists/list-cache";
import type { ListItemRow } from "@/lib/lists/types";

const POLL_MS = 4000;

type UseListSyncOptions = {
  listId: string;
  enabled: boolean;
  initialGroupByCategory?: boolean;
  onItemsChange: (items: ListItemRow[]) => void;
  onGroupByCategoryChange?: (groupByCategory: boolean) => void;
};

export function useListSync({
  listId,
  enabled,
  initialGroupByCategory = true,
  onItemsChange,
  onGroupByCategoryChange,
}: UseListSyncOptions) {
  const fingerprintRef = useRef<string>("");
  const groupByCategoryRef = useRef<boolean>(initialGroupByCategory);
  const onItemsChangeRef = useRef(onItemsChange);
  const onGroupByCategoryChangeRef = useRef(onGroupByCategoryChange);

  useEffect(() => {
    onItemsChangeRef.current = onItemsChange;
    onGroupByCategoryChangeRef.current = onGroupByCategoryChange;
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function poll() {
      if (document.visibilityState !== "visible") return;
      try {
        const { items, groupByCategory } = await fetchListSyncAction(listId);
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
      } catch {
        // Ignore transient network errors during polling
      }
    }

    void poll();
    const interval = setInterval(() => void poll(), POLL_MS);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void poll();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, listId]);
}
