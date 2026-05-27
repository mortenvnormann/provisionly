"use client";

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
import { AppNav } from "@/components/nav/app-nav";
import { SettingsLink } from "@/components/nav/settings-link";
import { SwipeRow } from "@/components/ui/swipe-row";
import { Button } from "@/components/ui/button";

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

  const greeting = profileGreeting({ firstName, lastName, displayName }, email);

  useEffect(() => {
    if (!isGuest && hasPendingGuestLists()) {
      return;
    }
    void loadLists();
  }, [loadLists, isGuest]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const title = newTitle.trim() || "Shopping list";
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
    <div className="flex min-h-full flex-1 flex-col">
      <header className="safe-area-pt sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-[var(--primary)] uppercase">
              Provisionly
            </p>
            <h1 className="text-lg font-semibold text-[var(--foreground)]">
              Hi, {greeting}
            </h1>
          </div>
          {!isGuest ? <SettingsLink /> : null}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pb-24">
        <AppNav active="lists" isGuest={isGuest} />

        {isGuest ? (
          <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3">
            <p className="text-sm text-[var(--muted-foreground)]">
              Guest mode — lists stay on this device.{" "}
              <form action={leaveGuestMode} className="inline">
                <button
                  type="submit"
                  className="font-medium text-[var(--primary)] underline-offset-2 hover:underline"
                >
                  Create account
                </button>
              </form>{" "}
              to share lists.
            </p>
          </div>
        ) : null}

        {migrationResult?.migrated ? (
          <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
            Imported {migrationResult.migrated} list
            {migrationResult.migrated === 1 ? "" : "s"} from guest mode.
          </div>
        ) : null}

        {migrationResult?.errors.length ? (
          <div className="rounded-xl border border-[var(--destructive)]/40 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
            <p className="font-medium">
              Some guest lists could not be imported. Your local copies are kept
              so we can retry.
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
            Importing guest lists…
          </p>
        ) : lists.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
            No lists yet. Create your first shopping list below.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lists.map((list) => (
              <li key={list.id}>
                <SwipeRow
                  requireConfirm
                  confirmMessage={
                    list.isOwner
                      ? `Delete "${list.title}"? This cannot be undone.`
                      : `Remove "${list.title}" from your lists?`
                  }
                  deleteLabel={list.isOwner ? "Delete" : "Remove"}
                  onDelete={() => handleDeleteList(list)}
                >
                  <button
                    type="button"
                    onClick={() => router.push(`/lists/${list.id}`)}
                    className="flex w-full items-center justify-between border border-[var(--border)] px-4 py-4 text-left transition-colors active:bg-[var(--muted)]"
                  >
                    <span className="font-medium text-[var(--foreground)]">
                      {list.title}
                    </span>
                    <span className="text-[var(--muted-foreground)]">›</span>
                  </button>
                </SwipeRow>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="safe-area-pb fixed inset-x-0 bottom-0 border-t border-[var(--border)] bg-[var(--surface)] p-4">
        {showForm ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="List name"
              autoFocus
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-base focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" fullWidth disabled={creating}>
                {creating ? "Creating…" : "Create list"}
              </Button>
            </div>
          </form>
        ) : (
          <Button fullWidth onClick={() => setShowForm(true)}>
            New list
          </Button>
        )}
      </div>
    </div>
  );
}
