"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export const ADD_ITEM_INPUT_ID = "add-item-name-input";

type AddItemBarProps = {
  onAdd: (input: {
    name: string;
    quantity?: number;
    unit?: string;
  }) => Promise<void>;
  disabled?: boolean;
};

function refocusNameInput(input: HTMLInputElement | null) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      input?.focus();
    });
  });
}

export function AddItemBar({ onAdd, disabled }: AddItemBarProps) {
  const tLists = useTranslations("lists");
  const tCommon = useTranslations("common");
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitItem() {
    const trimmed = name.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    try {
      await onAdd({
        name: trimmed,
        quantity: quantity ? Number.parseFloat(quantity) : undefined,
        unit: unit.trim() || undefined,
      });
      setName("");
      setQuantity("");
      setUnit("");
      refocusNameInput(nameRef.current);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await submitItem();
  }

  function handleNameKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void submitItem();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card-surface-bordered mx-3 my-2 px-3 py-2.5"
    >
      <div className="flex gap-2">
        <input
          ref={nameRef}
          id={ADD_ITEM_INPUT_ID}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleNameKeyDown}
          placeholder={tLists("addItem")}
          disabled={disabled}
          enterKeyHint="next"
          className="font-ui h-10 min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--background)] px-3 text-base focus:border-[var(--focus-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]/20"
          autoComplete="off"
        />
        <Button type="submit" disabled={disabled || loading || !name.trim()}>
          {tCommon("add")}
        </Button>
      </div>
      <div className="mt-2 flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={tLists("qty")}
          disabled={disabled}
          className="font-ui h-9 w-20 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--background)] px-2 text-sm focus:border-[var(--focus-ring)] focus:outline-none"
        />
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder={tLists("unitPlaceholder")}
          disabled={disabled}
          className="font-ui h-9 min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--background)] px-2 text-sm focus:border-[var(--focus-ring)] focus:outline-none"
        />
      </div>
    </form>
  );
}
