"use client";

import { useEffect, useRef, useState } from "react";
import type { ListMemberRow } from "@/lib/share/types";
import { useTranslations } from "next-intl";

type ListMembersProps = {
  members: ListMemberRow[];
  currentUserId?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

export function ListMembers({ members, currentUserId }: ListMembersProps) {
  const tLists = useTranslations("lists");
  const [openId, setOpenId] = useState<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openId) return;

    function onPointerDown(event: PointerEvent) {
      if (!rowRef.current?.contains(event.target as Node)) {
        setOpenId(null);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenId(null);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openId]);

  if (members.length <= 1) return null;

  return (
    <div ref={rowRef} className="px-4 pb-1.5">
      <ul className="flex items-center">
        {members.map((member, index) => {
          const isYou = member.userId === currentUserId;
          const name = isYou ? tLists("you") : member.displayName;
          const ariaLabel = member.isOwner
            ? `${name} · ${tLists("owner")}`
            : name;
          const open = openId === member.userId;

          return (
            <li
              key={member.userId}
              className={["relative", index > 0 ? "-ml-1.5" : ""].join(" ")}
              style={{ zIndex: open ? 20 : members.length - index }}
            >
              <button
                type="button"
                aria-label={ariaLabel}
                aria-expanded={open}
                onClick={() =>
                  setOpenId((current) =>
                    current === member.userId ? null : member.userId,
                  )
                }
                className={[
                  "pressable flex size-7 items-center justify-center rounded-full border bg-[var(--surface)] text-[10px] font-semibold text-[var(--foreground)]",
                  member.isOwner
                    ? "border-[var(--brand)]"
                    : "border-[var(--border)]",
                ].join(" ")}
              >
                {initials(member.displayName)}
              </button>
              {open ? (
                <div
                  role="tooltip"
                  className="card-surface-bordered font-ui absolute top-full left-1/2 z-20 mt-1.5 w-max max-w-48 -translate-x-1/2 px-2.5 py-1.5 text-xs shadow-token-sm"
                >
                  <span className="text-[var(--foreground)]">{name}</span>
                  {member.isOwner ? (
                    <span className="text-[var(--muted-foreground)]">
                      {` · ${tLists("owner")}`}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
