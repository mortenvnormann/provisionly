"use client";

import { useRef, useState } from "react";
import { useConfirm } from "@/components/ui/confirm-dialog";

const ACTION_WIDTH = 76;
/** Partial or full swipe — snap open; user taps Delete to confirm */
const OPEN_THRESHOLD = 36;
/** List items: swipe this far deletes immediately (no confirm) */
const DELETE_THRESHOLD = 56;
const TAP_SLOP = 8;

type SwipeRowProps = {
  children: React.ReactNode;
  onDelete: () => void | Promise<void>;
  /** When true, swipe snaps open; user taps Delete. When false, long swipe deletes immediately. */
  requireConfirm?: boolean;
  /** When false, tapping Delete runs onDelete without a confirm dialog. */
  confirmOnDelete?: boolean;
  confirmMessage?: string;
  deleteLabel?: string;
  className?: string;
};

export function SwipeRow({
  children,
  onDelete,
  requireConfirm = false,
  confirmOnDelete = true,
  confirmMessage,
  deleteLabel,
  className = "",
}: SwipeRowProps) {
  const resolvedConfirmMessage = confirmMessage ?? "Delete this item?";
  const resolvedDeleteLabel = deleteLabel ?? "Delete";
  const confirm = useConfirm();
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const liveOffset = useRef(0);
  const lockedAxis = useRef<"x" | "y" | null>(null);
  const swipedHorizontally = useRef(false);
  const suppressClickRef = useRef(false);
  const pointerDown = useRef(false);

  function reset() {
    setOffset(0);
    setOpen(false);
    liveOffset.current = 0;
    setDragging(false);
    lockedAxis.current = null;
    swipedHorizontally.current = false;
    pointerDown.current = false;
  }

  function snapOpen() {
    setOffset(-ACTION_WIDTH);
    setOpen(true);
    liveOffset.current = -ACTION_WIDTH;
    suppressClickRef.current = true;
  }

  function onPointerDown(event: React.PointerEvent) {
    if (event.button !== 0) return;
    startX.current = event.clientX;
    startY.current = event.clientY;
    startOffset.current = offset;
    liveOffset.current = offset;
    lockedAxis.current = null;
    swipedHorizontally.current = false;
    pointerDown.current = true;
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!pointerDown.current) return;

    const deltaX = event.clientX - startX.current;
    const deltaY = event.clientY - startY.current;

    if (!lockedAxis.current) {
      if (Math.abs(deltaX) < TAP_SLOP && Math.abs(deltaY) < TAP_SLOP) return;
      lockedAxis.current = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
    }

    if (lockedAxis.current === "y") return;

    const absX = Math.abs(deltaX);
    if (absX < TAP_SLOP) return;

    const next = Math.min(
      0,
      Math.max(-ACTION_WIDTH, startOffset.current + deltaX),
    );
    liveOffset.current = next;
    setOffset(next);

    if (absX < OPEN_THRESHOLD) return;

    swipedHorizontally.current = true;
    if (!dragging) setDragging(true);
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
  }

  function onPointerUp(event: React.PointerEvent) {
    if (!pointerDown.current) return;
    pointerDown.current = false;
    setDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const finalOffset = liveOffset.current;
    const wasOpen = startOffset.current <= -OPEN_THRESHOLD;

    if (!swipedHorizontally.current) {
      lockedAxis.current = null;
      if (liveOffset.current !== 0) {
        liveOffset.current = 0;
        setOffset(0);
      }
      return;
    }

    lockedAxis.current = null;
    swipedHorizontally.current = false;

    if (requireConfirm) {
      if (finalOffset <= -OPEN_THRESHOLD) {
        snapOpen();
        return;
      }

      if (wasOpen && finalOffset > -OPEN_THRESHOLD / 2) {
        reset();
        return;
      }

      if (wasOpen) {
        snapOpen();
        return;
      }

      reset();
      return;
    }

    if (finalOffset <= -DELETE_THRESHOLD) {
      reset();
      void onDelete();
      return;
    }

    reset();
  }

  async function handleDeleteClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (confirmOnDelete) {
      const ok = await confirm(resolvedConfirmMessage, resolvedDeleteLabel);
      if (!ok) return;
    }
    reset();
    await onDelete();
  }

  function onContentClick(event: React.MouseEvent) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (!open && offset >= 0) return;

    event.preventDefault();
    event.stopPropagation();
    reset();
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <div
        className="absolute inset-y-0 right-0 flex items-stretch"
        style={{ width: ACTION_WIDTH }}
      >
        <button
          type="button"
          onClick={(event) => void handleDeleteClick(event)}
          className="flex h-full w-full items-center justify-center bg-[var(--destructive)] px-2 text-sm font-medium text-[var(--destructive-foreground)] hover:opacity-90"
        >
          {resolvedDeleteLabel}
        </button>
      </div>
      <div
        className={[
          "relative bg-[var(--surface)] transition-transform touch-pan-y",
          dragging ? "" : "duration-200 ease-out",
        ].join(" ")}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={reset}
        onClick={onContentClick}
      >
        {children}
      </div>
    </div>
  );
}
