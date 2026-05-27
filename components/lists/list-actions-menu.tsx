"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type ListActionsMenuProps = {
  isGuest: boolean;
  isOwner: boolean;
  hasChecked: boolean;
  onShare: () => void;
  onClearChecked: () => void;
  onDelete: () => void;
};

export function ListActionsMenu({
  isGuest,
  isOwner,
  hasChecked,
  onShare,
  onClearChecked,
  onDelete,
}: ListActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <Button
        variant="ghost"
        type="button"
        aria-label="List actions"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="px-3"
      >
        ⋯
      </Button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-44 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg"
        >
          {!isGuest ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full px-4 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
              onClick={() => run(onShare)}
            >
              Share list
            </button>
          ) : null}
          {hasChecked ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full px-4 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
              onClick={() => run(onClearChecked)}
            >
              Clear done
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-4 py-2.5 text-left text-sm text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
            onClick={() => run(onDelete)}
          >
            {isGuest || isOwner ? "Delete list" : "Remove list"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
