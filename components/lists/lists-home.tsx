"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
import type { ListSummary } from "@/lib/lists/types";
import { profileGreeting } from "@/lib/profile/types";
import { useGuestMigrationOnLogin } from "@/lib/guest/use-guest-migration";
import {
  FloatingCreateDock,
  floatingDockScrollPadding,
} from "@/components/layout/floating-create-dock";
import { HomeHeader } from "@/components/layout/home-header";
import { AppNav } from "@/components/nav/app-nav";
import { SwipeRow } from "@/components/ui/swipe-row";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { useTranslations } from "next-intl";

type ListsHomeProps = {
  isGuest: boolean;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string | null;
  initialLists?: ListSummary[];
};

export function ListsHome({
  isGuest,
  firstName,
  lastName,
  displayName,
  email,
  initialLists = [],
}: ListsHomeProps) {
  const router = useRouter();
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");
  const [lists, setLists] = useState<ListSummary[]>(initialLists);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

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
      return;
    }
    const data = await fetchListsAction();
    setLists(data);
  }, [isGuest]);

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

  useEffect(() => {
    if (!isGuest && hasPendingGuestLists()) {
      return;
    }
    if (isGuest || initialLists.length === 0) {
      void loadLists();
    }
  }, [loadLists, isGuest, initialLists.length]);

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
      <HomeHeader greetingName={greetingName} showSettings={!isGuest} />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div
            className={`flex flex-col gap-4 p-4 ${floatingDockScrollPadding(showForm)}`}
          >
            <AppNav isGuest={isGuest} />

        {isGuest ? (
          <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3">
            <p className="text-sm text-[var(--muted-foreground)]">
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
            </p>
          </div>
        ) : null}

        {migrationResult?.migrated ? (
          <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
            {tHome("importedLists", { count: migrationResult.migrated })}
          </div>
        ) : null}

        {migrationResult?.errors.length ? (
          <div className="rounded-xl border border-[var(--destructive)]/40 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
            <p className="font-medium">
              {tHome("importErrorsTitle")}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {migrationResult.errors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {isMigrating ? (
          <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">
            {tHome("importing")}
          </p>
        ) : lists.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
            {tHome("noLists")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lists.map((list) => (
              <li key={list.id}>
                <SwipeRow
                  requireConfirm
                  confirmMessage={
                    list.isOwner
                      ? tHome("deleteListConfirm", { title: list.title })
                      : tHome("removeListConfirm", { title: list.title })
                  }
                  deleteLabel={list.isOwner ? tCommon("delete") : tCommon("remove")}
                  onDelete={() => handleDeleteList(list)}
                >
                  <Link
                    href={`/lists/${list.id}`}
                    className="flex w-full items-center justify-between border border-[var(--border)] px-4 py-4 text-left transition-colors active:bg-[var(--muted)]"
                  >
                    <span className="font-medium text-[var(--foreground)]">
                      {list.title}
                    </span>
                    <span className="text-[var(--muted-foreground)]">›</span>
                  </Link>
                </SwipeRow>
              </li>
            ))}
          </ul>
        )}
          </div>
        </div>
      </div>

      <FloatingCreateDock>
        {showForm ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={tHome("listName")}
              autoFocus
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-base focus:border-[var(--focus-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]/25"
            />
            <div className="flex gap-2">
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
        ) : (
          <Button fullWidth onClick={() => setShowForm(true)}>
            <PlusIcon className="h-4 w-4 shrink-0" />
            {tHome("newList")}
          </Button>
        )}
      </FloatingCreateDock>
    </div>
  );
}
