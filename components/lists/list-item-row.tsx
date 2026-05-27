"use client";

import type { ListItemRow } from "@/lib/lists/types";

type ListItemRowProps = {
  item: ListItemRow;
  onToggle: (id: string, checked: boolean) => void;
};

function formatItemLabel(item: ListItemRow): string {
  if (item.quantity != null && item.unit) {
    return `${item.quantity} ${item.unit} ${item.name}`;
  }
  if (item.quantity != null) {
    return `${item.quantity}× ${item.name}`;
  }
  return item.name;
}

export function ListItemRowView({ item, onToggle }: ListItemRowProps) {
  return (
    <label
      className={[
        "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors active:bg-[var(--muted)]",
        item.checked ? "opacity-60" : "",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={item.checked}
        onChange={() => onToggle(item.id, !item.checked)}
        className="size-5 shrink-0 rounded border-[var(--border)] accent-[var(--primary)]"
      />
      <span
        className={[
          "flex-1 text-base text-[var(--foreground)]",
          item.checked ? "line-through decoration-[var(--muted-foreground)]" : "",
        ].join(" ")}
      >
        {formatItemLabel(item)}
      </span>
    </label>
  );
}
