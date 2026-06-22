"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AddItemBar } from "@/components/lists/add-item-bar";
import { ListActionsMenu } from "@/components/lists/list-actions-menu";
import { ListItemRowView } from "@/components/lists/list-item-row";
import { ListMembers } from "@/components/lists/list-members";
import { ShareListSheet } from "@/components/lists/share-list-sheet";
import { ProblemPage } from "@/components/layout/problem-page";
import { BackLink } from "@/components/ui/back-link";
import { SwipeRow } from "@/components/ui/swipe-row";
import { LoadingState } from "@/components/ui/loading-state";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { resolveCategoryId } from "@/lib/categorisation/resolve";
import { useCategories } from "@/lib/categorisation/use-categories";
import {
  addGuestItem,
  clearCheckedGuestItems,
  deleteGuestItem,
  deleteGuestList,
  getGuestList,
  updateGuestList,
  updateGuestItem,
} from "@/lib/guest/storage";
import type { GuestListItem } from "@/lib/guest/types";
import {
  addListItemAction,
  deleteCheckedItemsAction,
  deleteListAction,
  deleteListItemAction,
  fetchListItemsAction,
  leaveListAction,
  setItemCheckedAction,
  setListGroupByCategoryAction,
  updateListItemAction,
} from "@/lib/lists/actions";
import {
  groupItemsByCategory,
  groupItemsByCategoryId,
} from "@/lib/lists/api";
import {
  itemsFingerprint,
  readListCache,
  writeListCache,
} from "@/lib/lists/list-cache";
import {
  applyQueuedMutations,
  countPendingMutations,
  createLocalItemId,
  enqueue,
} from "@/lib/lists/offline-queue";
import { nextSortKey } from "@/lib/lists/normalize";
import { repairListItemCategories } from "@/lib/lists/repair-categories";
import type { ListItemRow } from "@/lib/lists/types";
import { useOfflineQueue } from "@/lib/lists/use-offline-queue";
import { useListSync } from "@/lib/lists/use-list-sync";
import { useOnline } from "@/lib/pwa/use-online";
import type { ListMemberRow } from "@/lib/share/types";
import { createClient } from "@/utils/supabase/client";
import { useTranslations } from "next-intl";

type ListDetailProps = {
  listId: string;
  isGuest: boolean;
  initialTitle?: string;
  initialItems?: ListItemRow[];
  initialMembers?: ListMemberRow[];
  currentUserId?: string;
  isOwner?: boolean;
  showJoinedBanner?: boolean;
  locale?: string;
  initialGroupByCategory?: boolean;
};

function guestItemToRow(item: GuestListItem, listId: string): ListItemRow {
  return {
    id: item.id,
    listId,
    name: item.name,
    quantity: item.quantity ?? null,
    unit: item.unit ?? null,
    categoryId: item.categoryId ?? null,
    checked: item.checked,
    sortKey: item.sortKey ?? "a0",
  };
}

export function ListDetail({
  listId,
  isGuest,
  initialTitle,
  initialItems,
  initialMembers = [],
  currentUserId,
  isOwner = true,
  showJoinedBanner = false,
  locale = "en",
  initialGroupByCategory = true,
}: ListDetailProps) {
  const tLists = useTranslations("lists");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const confirmDialog = useConfirm();
  const cached = !isGuest ? readListCache(listId) : null;
  const hasPendingQueue = !isGuest && countPendingMutations(listId) > 0;
  const [title, setTitle] = useState(
    initialTitle ?? cached?.title ?? tLists("defaultListTitle"),
  );
  const [items, setItems] = useState<ListItemRow[]>(() => {
    if (isGuest) return initialItems ?? [];
    if (hasPendingQueue && cached?.items) {
      return cached.items;
    }
    const base = initialItems ?? cached?.items ?? [];
    return applyQueuedMutations(listId, base);
  });
  const [groupByCategory, setGroupByCategory] = useState(
    initialGroupByCategory ?? cached?.groupByCategory ?? true,
  );
  const [members, setMembers] = useState<ListMemberRow[]>(initialMembers);
  const online = useOnline();
  const authOffline = !isGuest && !online;
  const [syncError, setSyncError] = useState(false);
  const [loading, setLoading] = useState(
    !isGuest && !initialItems && !(cached?.items?.length ?? 0),
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [joinedBanner, setJoinedBanner] = useState(showJoinedBanner);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const { categories, labelFor, error: categoriesError } = useCategories(
    locale,
    tCommon("general"),
  );

  const persistCache = useCallback(
    (nextTitle: string, nextItems: ListItemRow[], nextGroupByCategory = groupByCategory) => {
      if (!isGuest) {
        writeListCache(listId, nextTitle, nextItems, nextGroupByCategory);
      }
    },
    [isGuest, listId, groupByCategory],
  );

  const load = useCallback(async () => {
    if (isGuest) {
      const supabase = createClient();
      const list = getGuestList(listId);
      if (!list) {
        setLoading(false);
        return;
      }
      setTitle(list.title);
      setGroupByCategory(list.groupByCategory !== false);
      let rows = list.items.map((i) => guestItemToRow(i, listId));
      rows = await repairListItemCategories(supabase, listId, rows, locale, true);
      setItems(rows);
      setLoading(false);
      return;
    }

    try {
      const listItems = await fetchListItemsAction(listId);
      setItems(listItems);
      writeListCache(
        listId,
        initialTitle ?? cached?.title ?? tLists("defaultListTitle"),
        listItems,
        groupByCategory,
      );
    } catch {
      const fallback = readListCache(listId);
      if (fallback) {
        setTitle(fallback.title);
        setItems(fallback.items);
        setGroupByCategory(fallback.groupByCategory ?? true);
      }
    } finally {
      setLoading(false);
    }
  }, [
    isGuest,
    listId,
    locale,
    initialTitle,
    cached,
    groupByCategory,
    tLists,
  ]);

  useEffect(() => {
    if (isGuest || !initialItems) {
      void load();
    } else if (!hasPendingQueue) {
      persistCache(initialTitle ?? title, initialItems, groupByCategory);
    }
  }, [load, isGuest, initialItems, initialTitle, persistCache, title, groupByCategory, hasPendingQueue]);

  useListSync({
    listId,
    enabled: !isGuest && online,
    initialGroupByCategory: groupByCategory,
    initialTitle: title,
    onItemsChange: (nextItems) => {
      setItems(nextItems);
      persistCache(title, nextItems);
    },
    onGroupByCategoryChange: setGroupByCategory,
    onTitleChange: (nextTitle) => {
      setTitle(nextTitle);
      persistCache(nextTitle, items, groupByCategory);
    },
    onMembersChange: setMembers,
  });

  const { syncing } = useOfflineQueue({
    listId,
    enabled: !isGuest,
    locale,
    onSynced: ({ items: nextItems, title: nextTitle, groupByCategory: nextGroup }) => {
      setSyncError(false);
      setTitle(nextTitle);
      setItems(nextItems);
      setGroupByCategory(nextGroup);
      persistCache(nextTitle, nextItems, nextGroup);
    },
    onSyncError: () => setSyncError(true),
  });

  const writesBlocked = syncing;

  useEffect(() => {
    if (!showJoinedBanner) return;
    const timer = setTimeout(() => setJoinedBanner(false), 5000);
    return () => clearTimeout(timer);
  }, [showJoinedBanner]);

  const grouped = useMemo(() => {
    if (items.length === 0) return [];
    if (!groupByCategory) {
      return [
        {
          categoryId: null,
          items: [...items].sort((a, b) => a.sortKey.localeCompare(b.sortKey)),
        },
      ];
    }
    if (categories.length === 0) {
      return groupItemsByCategoryId(items);
    }
    return groupItemsByCategory(items, categories);
  }, [items, categories, groupByCategory]);

  const hasChecked = items.some((i) => i.checked);
  const syncFingerprint = itemsFingerprint(items);

  async function handleAdd(input: {
    name: string;
    quantity?: number;
    unit?: string;
  }) {
    if (writesBlocked) return;
    if (isGuest) {
      const supabase = createClient();
      const categoryId = await resolveCategoryId(supabase, input.name, locale);
      addGuestItem(listId, {
        name: input.name,
        quantity: input.quantity,
        unit: input.unit,
        checked: false,
        categoryId: categoryId ?? undefined,
      });
      void load();
      return;
    }

    if (authOffline) {
      const tempItemId = createLocalItemId();
      const sortKey = nextSortKey(items.map((item) => item.sortKey));
      enqueue({
        type: "add_item",
        listId,
        tempItemId,
        payload: {
          name: input.name,
          quantity: input.quantity ?? null,
          unit: input.unit ?? null,
          sortKey,
        },
      });
      setItems((prev) => {
        const next = [
          ...prev,
          {
            id: tempItemId,
            listId,
            name: input.name,
            quantity: input.quantity ?? null,
            unit: input.unit ?? null,
            categoryId: null,
            checked: false,
            sortKey,
          },
        ];
        persistCache(title, next);
        return next;
      });
      return;
    }

    const row = await addListItemAction(listId, {
      name: input.name,
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      existingSortKeys: items.map((i) => i.sortKey),
    });
    setItems((prev) => {
      const next = [...prev, row];
      persistCache(title, next);
      return next;
    });
  }

  async function handleToggle(itemId: string, checked: boolean) {
    if (writesBlocked) return;
    if (isGuest) {
      updateGuestItem(listId, itemId, { checked });
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, checked } : i)),
      );
      return;
    }

    if (authOffline) {
      enqueue({
        type: "toggle_checked",
        listId,
        itemId,
        checked,
      });
      setItems((prev) => {
        const next = prev.map((item) =>
          item.id === itemId ? { ...item, checked } : item,
        );
        persistCache(title, next);
        return next;
      });
      return;
    }

    await setItemCheckedAction(itemId, checked, listId);
    setItems((prev) => {
      const next = prev.map((i) => (i.id === itemId ? { ...i, checked } : i));
      persistCache(title, next);
      return next;
    });
  }

  async function handleClearChecked() {
    if (authOffline) return;
    if (isGuest) {
      clearCheckedGuestItems(listId);
      void load();
      return;
    }

    await deleteCheckedItemsAction(listId);
    setItems((prev) => {
      const next = prev.filter((i) => !i.checked);
      persistCache(title, next);
      return next;
    });
  }

  async function handleDeleteList() {
    if (authOffline) return;
    const ok = await confirmDialog(
      isGuest || isOwner
        ? tLists("deleteListConfirm", { title })
        : tLists("removeListConfirm", { title }),
      isGuest || isOwner ? tCommon("delete") : tCommon("remove"),
    );
    if (!ok) return;

    if (isGuest) {
      deleteGuestList(listId);
    } else if (isOwner) {
      await deleteListAction(listId);
    } else {
      await leaveListAction(listId);
    }
    router.push("/home");
    router.refresh();
  }

  async function handleToggleGroupByCategory() {
    if (authOffline) return;
    const next = !groupByCategory;
    setGroupByCategory(next);
    persistCache(title, items, next);

    if (isGuest) {
      updateGuestList(listId, (list) => ({ ...list, groupByCategory: next }));
      return;
    }

    try {
      await setListGroupByCategoryAction(listId, next);
    } catch {
      setGroupByCategory(!next);
      persistCache(title, items, !next);
    }
  }

  async function handleUpdateItem(
    itemId: string,
    input: { name: string; quantity?: number; unit?: string },
  ) {
    if (authOffline) return;
    if (isGuest) {
      const supabase = createClient();
      const categoryId = await resolveCategoryId(supabase, input.name, locale);
      updateGuestItem(listId, itemId, {
        name: input.name,
        quantity: input.quantity,
        unit: input.unit,
        categoryId: categoryId ?? undefined,
      });
      setItems((prev) => {
        const next = prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                name: input.name,
                quantity: input.quantity ?? null,
                unit: input.unit ?? null,
                categoryId: categoryId ?? null,
              }
            : i,
        );
        persistCache(title, next);
        return next;
      });
      return;
    }

    const row = await updateListItemAction(itemId, listId, {
      name: input.name,
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
    });
    setItems((prev) => {
      const next = prev.map((i) => (i.id === itemId ? row : i));
      persistCache(title, next);
      return next;
    });
  }

  async function handleDeleteItem(itemId: string) {
    if (writesBlocked) return;
    if (isGuest) {
      deleteGuestItem(listId, itemId);
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== itemId);
        persistCache(title, next);
        return next;
      });
      return;
    }

    if (authOffline) {
      enqueue({
        type: "delete_item",
        listId,
        itemId,
      });
      setItems((prev) => {
        const next = prev.filter((item) => item.id !== itemId);
        persistCache(title, next);
        return next;
      });
      return;
    }

    await deleteListItemAction(itemId);
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== itemId);
      persistCache(title, next);
      return next;
    });
  }

  if (loading) {
    return <LoadingState label={tLists("loadingList")} />;
  }

  if (isGuest && !getGuestList(listId)) {
    return (
      <ProblemPage
        appName={tCommon("appName")}
        title={tErrors("listNotFound")}
        description={tErrors("pageNotFoundDescription")}
        primaryLabel={tErrors("goHome")}
        primaryHref="/home"
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <header className="safe-area-pt sticky top-0 z-10 shrink-0 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-2 py-3">
          <BackLink href="/home" label={tCommon("back")} />
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-[var(--foreground)]">
            {title}
          </h1>
          <ListActionsMenu
            isGuest={isGuest}
            isOwner={isOwner}
            hasChecked={hasChecked}
            groupByCategory={groupByCategory}
            offlineRestricted={authOffline}
            onShare={() => setShareOpen(true)}
            onClearChecked={() => void handleClearChecked()}
            onToggleGroupByCategory={() => void handleToggleGroupByCategory()}
            onDelete={() => void handleDeleteList()}
          />
        </div>
        {!isGuest ? (
          <ListMembers members={members} currentUserId={currentUserId} />
        ) : null}
        <AddItemBar onAdd={handleAdd} disabled={writesBlocked} />
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {syncing ? (
          <div className="mx-4 mt-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm text-[var(--foreground)]">
            {tCommon("offlineSyncing")}
          </div>
        ) : null}
        {syncError ? (
          <div className="mx-4 mt-3 rounded-xl border border-[var(--destructive)]/40 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
            {tCommon("offlineSyncFailed")}
          </div>
        ) : null}
        {joinedBanner ? (
          <div className="mx-4 mt-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
            {tLists("joinedBanner")}
          </div>
        ) : null}
        {categoriesError ? (
          <div className="mx-4 mt-3 rounded-xl border border-[var(--destructive)]/40 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
            {categoriesError}
          </div>
        ) : null}
        {items.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-[var(--muted-foreground)]">
            {tLists("addFirstItem")}
          </p>
        ) : (
          grouped.map(({ categoryId, items: sectionItems }) => (
            <section
              key={groupByCategory ? (categoryId ?? tCommon("general")) : "flat"}
              className="px-2 py-3"
            >
              {groupByCategory ? (
                <h2 className="mb-1 px-2 text-xs font-semibold tracking-wide text-[var(--secondary)] uppercase">
                  {labelFor(categoryId)}
                </h2>
              ) : null}
              <ul
                className="overflow-hidden rounded-xl border border-[var(--border)]/60 bg-[var(--surface)]"
                data-sync={syncFingerprint}
              >
                {sectionItems.map((item) => (
                  <li
                    key={item.id}
                    className="border-b border-[var(--border)]/60 last:border-b-0"
                  >
                    <SwipeRow
                      className="rounded-none"
                      requireConfirm
                      confirmOnDelete={false}
                      confirmMessage={tLists("deleteItemConfirm")}
                      deleteLabel={tCommon("delete")}
                      onDelete={() => void handleDeleteItem(item.id)}
                    >
                      <ListItemRowView
                        item={item}
                        editing={editingItemId === item.id}
                        onStartEdit={(id) => {
                          if (!authOffline) setEditingItemId(id);
                        }}
                        onCancelEdit={() => setEditingItemId(null)}
                        onToggle={(id, checked) => void handleToggle(id, checked)}
                        onUpdate={(id, input) => handleUpdateItem(id, input)}
                      />
                    </SwipeRow>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
        </div>
      </div>

      {!isGuest ? (
        <ShareListSheet
          listId={listId}
          listTitle={title}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </div>
  );
}
