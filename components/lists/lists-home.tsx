"use client";

import { useAppNavigate } from "@/lib/nav/use-app-navigate";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { leaveGuestMode } from "@/lib/auth/actions";
import { hasPendingGuestLists } from "@/lib/guest/migrate";
import {
  createGuestList,
  deleteGuestList,
  getGuestLists,
} from "@/lib/guest/storage";
import {
  createListAction,
  deleteListAction,
  fetchListsAction,
  leaveListAction,
} from "@/lib/lists/actions";
import { prefetchListDetailData } from "@/lib/lists/list-detail-prefetch-cache";
import type { ListSummary } from "@/lib/lists/types";
import { profileGreeting } from "@/lib/profile/types";
import { useGuestMigrationOnLogin } from "@/lib/guest/use-guest-migration";
import { migrationErrorMessage } from "@/lib/guest/migration-error-message";
import { useRegisterDock } from "@/components/layout/dock-context";
import { HomeHeader } from "@/components/layout/home-header";
import { SwipeRow } from "@/components/ui/swipe-row";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon } from "@/components/ui/icons";
import {
  getSortPreference,
  setSortPreference,
  type SortMode,
} from "@/lib/ui/sort-preference";
import { useTranslations } from "next-intl";

type ListsHomeProps = {
  isGuest: boolean;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string | null;
  initialLists?: ListSummary[];
  onListsReady?: () => void;
};

export function ListsHome({
  isGuest,
  firstName,
  lastName,
  displayName,
  email,
  initialLists = [],
  onListsReady,
}: ListsHomeProps) {
  const router = useRouter();
  const { push } = useAppNavigate();
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const [lists, setLists] = useState<ListSummary[]>(initialLists);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>(() =>
    getSortPreference("lists"),
  );
  const prefetchedListsRef = useRef(new Set<string>());

  const prefetchListDetail = useCallback(
    (listId: string) => {
      if (isGuest || prefetchedListsRef.current.has(listId)) return;
      prefetchedListsRef.current.add(listId);
      router.prefetch(`/lists/${listId}`);
      void prefetchListDetailData(listId);
    },
    [isGuest, router],
  );

  const loadLists = useCallback(async () => {
    if (isGuest) {
      setLists(
        getGuestLists().map((g) => ({
          id: g.id,
          title: g.title,
          updatedAt: g.updatedAt,
          isOwner: true,
        })),
      );
      onListsReady?.();
      return;
    }
    const data = await fetchListsAction();
    setLists(data);
    onListsReady?.();
  }, [isGuest, onListsReady]);

  const { result: migrationResult, isMigrating } = useGuestMigrationOnLogin({
    enabled: !isGuest,
    onComplete: (migration) => {
      if (migration.migrated > 0 && migration.lists.length > 0) {
        setLists(migration.lists);
      } else {
        void loadLists();
      }
      router.refresh();
    },
  });

  const greetingName = profileGreeting({ firstName, lastName, displayName }, email);

  const sortedLists = useMemo(() => {
    const copy = [...lists];
    if (sortMode === "alpha") {
      copy.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    return copy;
  }, [lists, sortMode]);

  const handleSort = useCallback(() => {
    setSortMode((mode) => {
      const next = mode === "recent" ? "alpha" : "recent";
      setSortPreference("lists", next);
      return next;
    });
  }, []);

  const handleAdd = useCallback(() => {
    setShowForm(true);
  }, []);

  const dockHandlers = useMemo(
    () => ({
      sortVisible: true,
      sortActive: sortMode === "alpha",
      onSort: handleSort,
      addVisible: true,
      onAdd: handleAdd,
      createFormOpen: showForm,
    }),
    [handleAdd, handleSort, showForm, sortMode],
  );

  useRegisterDock(dockHandlers);

  useEffect(() => {
    if (!isGuest && hasPendingGuestLists()) {
      return;
    }
    if (isGuest || initialLists.length === 0) {
      void loadLists();
    } else {
      onListsReady?.();
    }
  }, [loadLists, isGuest, initialLists.length, onListsReady]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const title = newTitle.trim() || tHome("defaultListTitle");
    setCreating(true);
    try {
      if (isGuest) {
        const list = createGuestList(title);
        setLists((prev) => [
          {
            id: list.id,
            title: list.title,
            updatedAt: list.updatedAt,
            isOwner: true,
          },
          ...prev,
        ]);
      } else {
        const list = await createListAction(title);
        setLists((prev) => [list, ...prev]);
      }
      setNewTitle("");
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteList(list: ListSummary) {
    if (isGuest) {
      deleteGuestList(list.id);
    } else if (list.isOwner) {
      await deleteListAction(list.id);
    } else {
      await leaveListAction(list.id);
    }
    setLists((prev) => prev.filter((entry) => entry.id !== list.id));
    router.refresh();
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <HomeHeader greetingName={greetingName} />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="flex flex-col gap-3 px-4 pt-4">
            {isGuest ? (
              <div className="card-surface-bordered font-ui px-3 py-2.5 text-sm text-[var(--muted-foreground)]">
                  {tHome("guestBanner")}{" "}
                  <form action={leaveGuestMode} className="inline">
                    <button
                      type="submit"
                      className="font-medium text-[var(--brand)] underline-offset-2 hover:underline"
                    >
                      {tHome("createAccount")}
                    </button>
                  </form>{" "}
                  {tHome("guestShareHint")}
              </div>
            ) : null}

            {migrationResult?.migrated ? (
              <div className="card-surface-bordered font-ui px-3 py-2.5 text-sm text-[var(--foreground)]">
                {tHome("importedLists", { count: migrationResult.migrated })}
              </div>
            ) : null}

            {migrationResult?.errors.length ? (
              <div className="font-ui rounded-[var(--radius-card)] border border-[var(--destructive)]/30 bg-[var(--destructive)]/8 px-3 py-2.5 text-sm text-[var(--destructive)]">
                <p className="font-medium">{tHome("importErrorsTitle")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {migrationResult.errors.map((code) => (
                    <li key={code}>{migrationErrorMessage(code, tHome)}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {isMigrating ? (
              <p className="font-ui py-4 text-center text-sm text-[var(--muted-foreground)]">
                {tHome("importing")}
              </p>
            ) : lists.length === 0 ? (
              <p className="font-ui py-8 text-center text-sm text-[var(--muted-foreground)]">
                {tHome("noLists")}
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {sortedLists.map((list) => (
                  <li key={list.id}>
                    <SwipeRow
                      requireConfirm
                      confirmMessage={
                        list.isOwner
                          ? tHome("deleteListConfirm", { title: list.title })
                          : tHome("removeListConfirm", { title: list.title })
                      }
                      deleteLabel={
                        list.isOwner ? tCommon("delete") : tCommon("remove")
                      }
                      onDelete={() => handleDeleteList(list)}
                    >
                      <button
                        type="button"
                        onPointerEnter={() => prefetchListDetail(list.id)}
                        onTouchStart={() => prefetchListDetail(list.id)}
                        onClick={(event) =>
                          push(`/lists/${list.id}`, {
                            element: event.currentTarget,
                            transitionType: "nav-up",
                          })
                        }
                        className="font-ui card-surface pressable flex w-full items-center justify-between px-3.5 py-3 text-left"
                      >
                        <span className="text-[15px] font-medium text-[var(--foreground)]">
                          {list.title}
                        </span>
                        <ChevronRightIcon className="size-4 shrink-0 text-[var(--muted-foreground)]" />
                      </button>
                    </SwipeRow>
                  </li>
                ))}
              </ul>
            )}

            {sortMode === "alpha" ? (
              <p className="font-ui text-center text-xs text-[var(--muted-foreground)]">
                {tNav("sortAlpha")}
              </p>
            ) : null}

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
      </div>

      {showForm ? (
        <div className="font-ui safe-area-pb fixed inset-x-0 bottom-[var(--dock-height)] z-20 mx-auto w-full max-w-lg px-4 pb-2">
          <form
            onSubmit={handleCreate}
            className="card-surface-bordered font-ui p-3"
          >
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={tHome("listName")}
              autoFocus
              className="font-ui h-10 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--background)] px-3 text-base focus:border-[var(--focus-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]/20"
            />
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => setShowForm(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" fullWidth disabled={creating}>
                {creating ? tHome("creating") : tHome("createList")}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
