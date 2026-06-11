"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ListItemRow } from "@/lib/lists/types";
import { useTranslations } from "next-intl";

const TAP_SLOP = 8;

type ListItemRowProps = {
  item: ListItemRow;
  editing: boolean;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onToggle: (id: string, checked: boolean) => void;
  onUpdate: (
    id: string,
    input: { name: string; quantity?: number; unit?: string },
  ) => void | Promise<void>;
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

export function ListItemRowView({
  item,
  editing,
  onStartEdit,
  onCancelEdit,
  onToggle,
  onUpdate,
}: ListItemRowProps) {
  const tLists = useTranslations("lists");
  const tCommon = useTranslations("common");
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(
    item.quantity != null ? String(item.quantity) : "",
  );
  const [unit, setUnit] = useState(item.unit ?? "");
  const [saving, setSaving] = useState(false);
  const tapStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!editing) {
      setName(item.name);
      setQuantity(item.quantity != null ? String(item.quantity) : "");
      setUnit(item.unit ?? "");
    }
  }, [item.name, item.quantity, item.unit, editing]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      await onUpdate(item.id, {
        name: trimmed,
        quantity: quantity ? Number.parseFloat(quantity) : undefined,
        unit: unit.trim() || undefined,
      });
      onCancelEdit();
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="flex flex-col gap-2 px-2 py-2"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
          className="h-11 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-base focus:border-[var(--focus-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]/25"
          autoComplete="off"
        />
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder={tLists("qty")}
            className="h-9 w-20 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 text-sm focus:border-[var(--focus-ring)] focus:outline-none"
          />
          <input
            type="text"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            placeholder={tLists("unitPlaceholder")}
            className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 text-sm focus:border-[var(--focus-ring)] focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving || !name.trim()} className="flex-1">
            {saving ? tCommon("pleaseWait") : tCommon("save")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={onCancelEdit}
            className="flex-1"
          >
            {tCommon("cancel")}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={[
        "flex min-h-11 items-center gap-1 rounded-lg px-1 py-2 transition-colors",
        item.checked ? "opacity-60" : "",
      ].join(" ")}
    >
      <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={item.checked}
          onChange={() => onToggle(item.id, !item.checked)}
          className="size-5 rounded border-[var(--border)] accent-[var(--accent)]"
        />
      </label>
      <div
        role="button"
        tabIndex={0}
        aria-label={tLists("editItem", { name: item.name })}
        onPointerDown={(event) => {
          tapStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          const dx = Math.abs(event.clientX - tapStart.current.x);
          const dy = Math.abs(event.clientY - tapStart.current.y);
          if (dx < TAP_SLOP && dy < TAP_SLOP) {
            onStartEdit(item.id);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onStartEdit(item.id);
          }
        }}
        className={[
          "min-w-0 flex-1 touch-pan-y rounded-lg px-2 py-1 text-left text-base text-[var(--foreground)] transition-colors active:bg-[var(--muted)]",
          item.checked ? "line-through decoration-[var(--muted-foreground)]" : "",
        ].join(" ")}
      >
        {formatItemLabel(item)}
      </div>
    </div>
  );
}
