"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddItemBar, ADD_ITEM_INPUT_ID } from "@/components/lists/add-item-bar";
import { ListActionsMenu } from "@/components/lists/list-actions-menu";
import { ListItemRowView } from "@/components/lists/list-item-row";
import { ListMembers } from "@/components/lists/list-members";
import { ProblemPage } from "@/components/layout/problem-page";
import { useRegisterDock } from "@/components/layout/dock-context";
import { ActionErrorBanner } from "@/components/ui/action-error-banner";
import { BackLink } from "@/components/ui/back-link";
import { ShareIcon } from "@/components/ui/icons";
import { SwipeRow } from "@/components/ui/swipe-row";
import { LoadingState } from "@/components/ui/loading-state";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  resolveCategoryIdAction,
  suggestItemCategoryRepairsAction,
} from "@/lib/categorisation/actions";
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
  leaveListAction,
  setItemCheckedAction,
  setListGroupByCategoryAction,
  updateListItemAction,
} from "@/lib/lists/actions";
import {
  getPrefetchedListDetail,
  prefetchListDetailData,
} from "@/lib/lists/list-detail-prefetch-cache";
import {
  groupItemsByCategory,
  groupItemsByCategoryId,
} from "@/lib/lists/api";
import {
  readListCache,
  writeListCache,
} from "@/lib/lists/list-cache";
import {
  applyQueuedMutations,
  countPendingMutations,
  createLocalItemId,
  enqueue,
} from "@/lib/lists/offline-queue";
import { mergeListItemsPreservingOrder } from "@/lib/lists/merge-items";
import { nextSortKey } from "@/lib/lists/normalize";
import type { CategoryRow, ListItemRow } from "@/lib/lists/types";
import { useOfflineQueue } from "@/lib/lists/use-offline-queue";
import { useListSync, markListItemsLocallySynced } from "@/lib/lists/use-list-sync";
import { useOnline } from "@/lib/pwa/use-online";
import type { ListMemberRow } from "@/lib/share/types";
import { useTranslations } from "next-intl";

const ShareListSheet = dynamic(
  () =>
    import("@/components/lists/share-list-sheet").then((m) => ({
      default: m.ShareListSheet,
    })),
  { ssr: false },
);

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
  initialCategories?: CategoryRow[];
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
  isOwner: isOwnerProp = true,
  showJoinedBanner = false,
  locale: localeProp = "en",
  initialGroupByCategory = true,
  initialCategories,
}: ListDetailProps) {
  const tLists = useTranslations("lists");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const confirmDialog = useConfirm();
  const prefetched = !isGuest ? getPrefetchedListDetail(listId) : null;
  const cached = !isGuest ? readListCache(listId) : null;
  const hasPendingQueue = !isGuest && countPendingMutations(listId) > 0;
  const bootstrapItems = initialItems ?? prefetched?.items ?? cached?.items;
  const hasBootstrapData =
    isGuest || bootstrapItems !== undefined || (cached?.items?.length ?? 0) > 0;
  const [title, setTitle] = useState(
    initialTitle ??
      prefetched?.title ??
      cached?.title ??
      tLists("defaultListTitle"),
  );
  const [items, setItems] = useState<ListItemRow[]>(() => {
    if (isGuest) return initialItems ?? [];
    if (hasPendingQueue && cached?.items) {
      return cached.items;
    }
    const base = bootstrapItems ?? [];
    return applyQueuedMutations(listId, base);
  });
  const [groupByCategory, setGroupByCategory] = useState(
    initialGroupByCategory ??
      prefetched?.groupByCategory ??
      cached?.groupByCategory ??
      true,
  );
  const [members, setMembers] = useState<ListMemberRow[]>(
    initialMembers.length > 0
      ? initialMembers
      : (prefetched?.members ?? []),
  );
  const [isOwner, setIsOwner] = useState(
    isOwnerProp ?? prefetched?.isOwner ?? true,
  );
  const [locale, setLocale] = useState(
    localeProp ?? prefetched?.locale ?? "en",
  );
  const [categorySeed, setCategorySeed] = useState<CategoryRow[] | undefined>(
    initialCategories ?? prefetched?.categories,
  );
  const online = useOnline();
  const authOffline = !isGuest && !online;
  const [syncError, setSyncError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!hasBootstrapData);
  const [notFound, setNotFound] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [joinedBanner, setJoinedBanner] = useState(showJoinedBanner);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  type PendingToggle = {
    desired: boolean;
    inFlight: boolean;
  };
  const pendingTogglesRef = useRef<Map<string, PendingToggle>>(new Map());
  const checkedByIdRef = useRef<Map<string, boolean>>(new Map());
  const pendingCacheItemsRef = useRef<ListItemRow[] | null>(null);
  const cacheFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);
  titleRef.current = title;
  const { categories, labelFor, error: categoriesError } = useCategories(
    locale,
    tCommon("general"),
    categorySeed,
    tErrors("couldNotLoadCategories"),
  );

  const showActionError = useCallback(
    (message: string) => setActionError(message),
    [],
  );

  useEffect(() => {
    const map = new Map<string, boolean>();
    for (const item of items) {
      const pending = pendingTogglesRef.current.get(item.id);
      map.set(item.id, pending?.desired ?? item.checked);
    }
    checkedByIdRef.current = map;
  }, [items]);

  const persistCache = useCallback(
    (nextTitle: string, nextItems: ListItemRow[], nextGroupByCategory = groupByCategory) => {
      if (!isGuest) {
        writeListCache(listId, nextTitle, nextItems, nextGroupByCategory);
      }
    },
    [isGuest, listId, groupByCategory],
  );

  const scheduleToggleCacheFlush = useCallback(
    (nextItems: ListItemRow[]) => {
      pendingCacheItemsRef.current = nextItems;
      if (cacheFlushTimerRef.current != null) {
        clearTimeout(cacheFlushTimerRef.current);
      }
      cacheFlushTimerRef.current = setTimeout(() => {
        cacheFlushTimerRef.current = null;
        const snapshot = pendingCacheItemsRef.current;
        if (!snapshot) return;
        pendingCacheItemsRef.current = null;
        persistCache(titleRef.current, snapshot);
        markListItemsLocallySynced(listId, snapshot);
      }, 0);
    },
    [persistCache, listId],
  );

  useEffect(() => {
    return () => {
      if (cacheFlushTimerRef.current != null) {
        clearTimeout(cacheFlushTimerRef.current);
      }
    };
  }, []);

  const applyPageData = useCallback(
    (data: NonNullable<ReturnType<typeof getPrefetchedListDetail>>) => {
      setTitle(data.title);
      setItems(applyQueuedMutations(listId, data.items));
      setMembers(data.members);
      setGroupByCategory(data.groupByCategory);
      setIsOwner(data.isOwner);
      setLocale(data.locale);
      setCategorySeed(data.categories);
      persistCache(data.title, data.items, data.groupByCategory);
    },
    [listId, persistCache],
  );

  const load = useCallback(async () => {
    if (isGuest) {
      const list = getGuestList(listId);
      if (!list) {
        setLoading(false);
        return;
      }
      setTitle(list.title);
      setGroupByCategory(list.groupByCategory !== false);
      const rows = list.items.map((item) => guestItemToRow(item, listId));
      const repaired = await suggestItemCategoryRepairsAction(rows, locale);
      for (let i = 0; i < repaired.length; i++) {
        const before = rows[i];
        const after = repaired[i];
        if (after.categoryId !== before.categoryId) {
          updateGuestItem(listId, after.id, {
            categoryId: after.categoryId ?? undefined,
          });
        }
      }
      setItems(repaired);
      setLoading(false);
      return;
    }

    try {
      const data = await prefetchListDetailData(listId);
      if (!data) {
        setNotFound(true);
        return;
      }
      applyPageData(data);
    } catch {
      const fallback = readListCache(listId);
      if (fallback) {
        setTitle(fallback.title);
        setItems(fallback.items);
        setGroupByCategory(fallback.groupByCategory ?? true);
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, [applyPageData, isGuest, listId, locale]);

  useEffect(() => {
    if (isGuest) {
      void load();
      return;
    }

    if (prefetched) {
      if (!hasPendingQueue) {
        persistCache(
          prefetched.title,
          prefetched.items,
          prefetched.groupByCategory,
        );
      }
      return;
    }

    if (initialItems) {
      if (!hasPendingQueue) {
        persistCache(initialTitle ?? title, initialItems, groupByCategory);
      }
      return;
    }

    void load();
  }, [
    load,
    isGuest,
    prefetched,
    initialItems,
    initialTitle,
    persistCache,
    title,
    groupByCategory,
    hasPendingQueue,
  ]);

  const hasFreshData = !!(prefetched ?? initialItems ?? cached?.items?.length);

  useListSync({
    listId,
    enabled: !isGuest && online,
    skipInitialSync: hasFreshData,
    initialGroupByCategory: groupByCategory,
    initialTitle: title,
    onItemsChange: (serverItems) => {
      if (pendingTogglesRef.current.size > 0) return;
      setItems((prev) => {
        const next = mergeListItemsPreservingOrder(prev, serverItems);
        persistCache(title, next);
        markListItemsLocallySynced(listId, next);
        return next;
      });
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
          items,
        },
      ];
    }
    if (categories.length === 0) {
      return groupItemsByCategoryId(items);
    }
    return groupItemsByCategory(items, categories);
  }, [items, categories, groupByCategory]);

  const hasChecked = items.some((i) => i.checked);

  async function handleAdd(input: {
    name: string;
    quantity?: number;
    unit?: string;
  }) {
    if (writesBlocked) return;
    if (isGuest) {
      const categoryId = await resolveCategoryIdAction(input.name, locale);
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

    try {
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
    } catch (err) {
      console.error(err);
      showActionError(tLists("couldNotSaveItem"));
    }
  }

  async function handleToggle(itemId: string) {
    if (writesBlocked) return;

    const current =
      pendingTogglesRef.current.get(itemId)?.desired ??
      checkedByIdRef.current.get(itemId) ??
      false;
    const checked = !current;
    checkedByIdRef.current.set(itemId, checked);

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
        scheduleToggleCacheFlush(next);
        return next;
      });
      return;
    }

    const existing = pendingTogglesRef.current.get(itemId);
    pendingTogglesRef.current.set(itemId, {
      desired: checked,
      inFlight: existing?.inFlight ?? false,
    });

    setItems((prev) => {
      const next = prev.map((i) => (i.id === itemId ? { ...i, checked } : i));
      scheduleToggleCacheFlush(next);
      return next;
    });

    function flushToggle(id: string) {
      const entry = pendingTogglesRef.current.get(id);
      if (!entry || entry.inFlight) return;
      entry.inFlight = true;
      const written = entry.desired;
      void setItemCheckedAction(id, written, listId)
        .then(() => settleToggle(id, written, null))
        .catch((err) => settleToggle(id, written, err));
    }

    function settleToggle(id: string, written: boolean, err: unknown) {
      const entry = pendingTogglesRef.current.get(id);
      if (!entry) return;
      entry.inFlight = false;
      if (entry.desired !== written) {
        flushToggle(id);
        return;
      }
      pendingTogglesRef.current.delete(id);
      if (err) {
        const reverted = !written;
        checkedByIdRef.current.set(id, reverted);
        setItems((prev) => {
          const next = prev.map((i) =>
            i.id === id ? { ...i, checked: reverted } : i,
          );
          scheduleToggleCacheFlush(next);
          return next;
        });
        console.error(err);
        showActionError(tLists("couldNotSaveItem"));
      }
    }

    if (!existing?.inFlight) {
      flushToggle(itemId);
    }
  }

  async function handleClearChecked() {
    if (authOffline) return;
    if (isGuest) {
      clearCheckedGuestItems(listId);
      void load();
      return;
    }

    try {
      await deleteCheckedItemsAction(listId);
      setItems((prev) => {
        const next = prev.filter((i) => !i.checked);
        persistCache(title, next);
        return next;
      });
    } catch (err) {
      console.error(err);
      showActionError(tLists("couldNotSaveItem"));
    }
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
    } catch (err) {
      console.error(err);
      setGroupByCategory(!next);
      persistCache(title, items, !next);
      showActionError(tLists("couldNotSaveItem"));
    }
  }

  const focusAddItem = useCallback(() => {
    document.getElementById(ADD_ITEM_INPUT_ID)?.focus();
  }, []);

  const dockHandlers = useMemo(
    () => ({
      sortVisible: true,
      sortActive: groupByCategory,
      onSort: () => void handleToggleGroupByCategory(),
      action: {
        visible: true,
        label: tLists("clearChecked"),
        disabled: !hasChecked || authOffline,
        onPress: () => void handleClearChecked(),
      },
      addVisible: true,
      onAdd: focusAddItem,
    }),
    [
      authOffline,
      groupByCategory,
      hasChecked,
      focusAddItem,
      tLists,
    ],
  );

  useRegisterDock(dockHandlers);

  async function handleUpdateItem(
    itemId: string,
    input: { name: string; quantity?: number; unit?: string },
  ) {
    if (authOffline) return;
    if (isGuest) {
      const categoryId = await resolveCategoryIdAction(input.name, locale);
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

    try {
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
    } catch (err) {
      console.error(err);
      showActionError(tLists("couldNotSaveItem"));
      throw err;
    }
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

    try {
      await deleteListItemAction(itemId);
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== itemId);
        persistCache(title, next);
        return next;
      });
    } catch (err) {
      console.error(err);
      showActionError(tLists("couldNotSaveItem"));
    }
  }

  if (loading) {
    return <LoadingState label={tLists("loadingList")} />;
  }

  if (notFound || (isGuest && !getGuestList(listId))) {
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
      <header className="safe-area-pt font-ui sticky top-0 z-10 shrink-0 bg-[var(--background)]/95">
        <div className="flex items-center gap-2 px-2 py-2">
          <BackLink href="/home" label={tCommon("back")} />
          <h1 className="heading-editorial min-w-0 flex-1 truncate text-lg text-[var(--foreground)]">
            {title}
          </h1>
          {!isGuest && !authOffline ? (
            <button
              type="button"
              aria-label={tLists("shareList")}
              onClick={() => setShareOpen(true)}
              className="pressable flex size-10 items-center justify-center rounded-full text-[var(--foreground)] hover:bg-[var(--muted)]/80"
            >
              <ShareIcon className="size-5" />
            </button>
          ) : null}
          <ListActionsMenu
            isGuest={isGuest}
            isOwner={isOwner}
            offlineRestricted={authOffline}
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
          <div className="card-surface-bordered mx-4 mt-2 px-3 py-2.5 text-sm text-[var(--foreground)]">
            {tCommon("offlineSyncing")}
          </div>
        ) : null}
        {syncError ? (
          <div className="mx-4 mt-2 rounded-[var(--radius-card)] border border-[var(--destructive)]/30 bg-[var(--destructive)]/8 px-3 py-2.5 text-sm text-[var(--destructive)]">
            {tCommon("offlineSyncFailed")}
          </div>
        ) : null}
        {actionError ? (
          <ActionErrorBanner
            message={actionError}
            dismissLabel={tCommon("close")}
            onDismiss={() => setActionError(null)}
          />
        ) : null}
        {joinedBanner ? (
          <div className="card-surface-bordered mx-4 mt-2 px-3 py-2.5 text-sm text-[var(--foreground)]">
            {tLists("joinedBanner")}
          </div>
        ) : null}
        {categoriesError ? (
          <div className="mx-4 mt-2 rounded-[var(--radius-card)] border border-[var(--destructive)]/30 bg-[var(--destructive)]/8 px-3 py-2.5 text-sm text-[var(--destructive)]">
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
              className="px-2 py-2"
            >
              {groupByCategory ? (
                <h2 className="font-ui mb-1 px-2 text-[11px] font-medium tracking-[0.08em] text-[var(--label)] uppercase">
                  {labelFor(categoryId)}
                </h2>
              ) : null}
              <ul className="card-surface-bordered overflow-hidden">
                {sectionItems.map((item) => (
                  <li
                    key={item.id}
                    className="border-b border-[var(--border)] last:border-b-0"
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
                        onToggle={(id) => void handleToggle(id)}
                        onUpdate={(id, input) => handleUpdateItem(id, input)}
                      />
                    </SwipeRow>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
        <div
          aria-hidden
          className="pointer-events-none shrink-0"
          style={{
            height:
              "calc(var(--dock-height) + env(safe-area-inset-bottom, 0px) + 1.25rem)",
          }}
        />
        </div>
      </div>

      {!isGuest && shareOpen ? (
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
