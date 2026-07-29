"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

type ListActionsMenuProps = {
  isOwner: boolean;
  isGuest: boolean;
  offlineRestricted?: boolean;
  onDelete: () => void;
};

export function ListActionsMenu({
  isOwner,
  isGuest,
  offlineRestricted = false,
  onDelete,
}: ListActionsMenuProps) {
  const t = useTranslations("lists");
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

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <Button
        variant="ghost"
        type="button"
        aria-label={t("listActions")}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="px-3 text-[var(--foreground)]"
      >
        ⋯
      </Button>
      {open ? (
        <div
          role="menu"
          className="shadow-token-md absolute right-0 top-full z-20 mt-1 min-w-44 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1"
        >
          <button
            type="button"
            role="menuitem"
            disabled={offlineRestricted}
            className={[
              "font-ui flex w-full px-4 py-2.5 text-left text-sm text-[var(--destructive)]",
              offlineRestricted
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-[var(--destructive)]/10",
            ].join(" ")}
            onClick={() => {
              if (!offlineRestricted) {
                setOpen(false);
                onDelete();
              }
            }}
          >
            {isGuest || isOwner ? t("deleteList") : t("removeList")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
