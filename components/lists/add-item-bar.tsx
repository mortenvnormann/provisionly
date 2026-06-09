"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type AddItemBarProps = {
  onAdd: (input: {
    name: string;
    quantity?: number;
    unit?: string;
  }) => Promise<void>;
  disabled?: boolean;
};

export function AddItemBar({ onAdd, disabled }: AddItemBarProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
      nameRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3"
    >
      <div className="flex gap-2">
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add item…"
          disabled={disabled || loading}
          enterKeyHint="done"
          className="h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-base focus:border-[var(--focus-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]/25"
          autoComplete="off"
        />
        <Button type="submit" disabled={disabled || loading || !name.trim()}>
          Add
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
          placeholder="Qty"
          disabled={disabled || loading}
          className="h-9 w-20 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 text-sm focus:border-[var(--focus-ring)] focus:outline-none"
        />
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Unit (kg, pcs)"
          disabled={disabled || loading}
          className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 text-sm focus:border-[var(--focus-ring)] focus:outline-none"
        />
      </div>
    </form>
  );
}
