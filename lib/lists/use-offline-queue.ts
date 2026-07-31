"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addListItemAction,
  deleteListItemAction,
  fetchListSyncAction,
  setAllListItemsCheckedAction,
  setItemCheckedAction,
} from "@/lib/lists/actions";
import {
  isLocalItemId,
  listMutations,
  readIdMap,
  removeMutation,
  resolveItemId,
  setIdMapping,
  type OfflineMutation,
} from "@/lib/lists/offline-queue";
import { writeListCache } from "@/lib/lists/list-cache";
import { repairListItemCategoriesAction } from "@/lib/categorisation/actions";
import type { ListItemRow } from "@/lib/lists/types";
import { useOnline } from "@/lib/pwa/use-online";

type UseOfflineQueueOptions = {
  listId: string;
  enabled: boolean;
  locale: string;
  onSynced: (payload: {
    items: ListItemRow[];
    title: string;
    groupByCategory: boolean;
  }) => void;
  onSyncError: () => void;
};

async function applyMutation(
  mutation: OfflineMutation,
  idMap: Record<string, string>,
  sortKeys: string[],
): Promise<{ idMap: Record<string, string>; sortKeys: string[] }> {
  switch (mutation.type) {
    case "add_item": {
      const row = await addListItemAction(mutation.listId, {
        name: mutation.payload.name,
        quantity: mutation.payload.quantity,
        unit: mutation.payload.unit,
        existingSortKeys: sortKeys,
      });
      setIdMapping(mutation.tempItemId, row.id);
      const nextMap = { ...idMap, [mutation.tempItemId]: row.id };
      return { idMap: nextMap, sortKeys: [...sortKeys, row.sortKey] };
    }
    case "toggle_checked": {
      const serverItemId = resolveItemId(mutation.itemId, idMap);
      if (isLocalItemId(mutation.itemId) && !idMap[mutation.itemId]) {
        return { idMap, sortKeys };
      }
      await setItemCheckedAction(serverItemId, mutation.checked, mutation.listId);
      return { idMap, sortKeys };
    }
    case "set_all_checked": {
      await setAllListItemsCheckedAction(mutation.listId, mutation.checked);
      return { idMap, sortKeys };
    }
    case "delete_item": {
      if (isLocalItemId(mutation.itemId) && !idMap[mutation.itemId]) {
        return { idMap, sortKeys };
      }
      const serverItemId = resolveItemId(mutation.itemId, idMap);
      await deleteListItemAction(serverItemId);
      return { idMap, sortKeys };
    }
    default:
      return { idMap, sortKeys };
  }
}

export function useOfflineQueue({
  listId,
  enabled,
  locale,
  onSynced,
  onSyncError,
}: UseOfflineQueueOptions) {
  const online = useOnline();
  const [syncing, setSyncing] = useState(false);
  const flushingRef = useRef(false);
  const onSyncedRef = useRef(onSynced);
  const onSyncErrorRef = useRef(onSyncError);

  useEffect(() => {
    onSyncedRef.current = onSynced;
    onSyncErrorRef.current = onSyncError;
  });

  const flush = useCallback(async () => {
    if (!enabled || flushingRef.current || !navigator.onLine) return;

    const pending = listMutations(listId);
    if (pending.length === 0) return;

    flushingRef.current = true;
    setSyncing(true);

    let idMap = { ...readIdMap() };

    try {
      let sortKeys: string[] = [];
      try {
        const baseline = await fetchListSyncAction(listId);
        sortKeys = baseline.items.map((item) => item.sortKey);
      } catch {
        sortKeys = [];
      }

      for (const mutation of pending) {
        const result = await applyMutation(mutation, idMap, sortKeys);
        idMap = result.idMap;
        sortKeys = result.sortKeys;
        removeMutation(mutation.id);
      }

      const sync = await fetchListSyncAction(listId);
      const items = await repairListItemCategoriesAction(
        listId,
        sync.items,
        locale,
      );

      writeListCache(listId, sync.title, items, sync.groupByCategory);
      onSyncedRef.current({
        items,
        title: sync.title,
        groupByCategory: sync.groupByCategory,
      });
    } catch {
      onSyncErrorRef.current();
    } finally {
      flushingRef.current = false;
      setSyncing(false);
    }
  }, [enabled, listId, locale]);

  useEffect(() => {
    if (!enabled || !online) return;
    void flush();
  }, [enabled, online, flush]);

  useEffect(() => {
    if (!enabled) return;

    function onVisibilityChange() {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void flush();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, flush]);

  return { syncing, flush };
}
