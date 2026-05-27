"use client";

import { useEffect, useState } from "react";
import { createRecipeShareLinkAction } from "@/lib/share/actions";
import { Button } from "@/components/ui/button";

type ShareRecipeSheetProps = {
  recipeId: string;
  recipeTitle: string;
  open: boolean;
  onClose: () => void;
};

export function ShareRecipeSheet({
  recipeId,
  recipeTitle,
  open,
  onClose,
}: ShareRecipeSheetProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setUrl(null);
      setError(null);
      setCopied(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void createRecipeShareLinkAction(recipeId)
      .then((result) => {
        if (cancelled) return;
        setUrl(result.url);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not create link");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, recipeId]);

  if (!open) return null;

  async function handleCopy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEmailShare() {
    if (!url) return;
    const subject = encodeURIComponent(`Recipe: ${recipeTitle}`);
    const body = encodeURIComponent(
      `Hi,\n\nCheck out this recipe "${recipeTitle}" on Provisionly:\n\n${url}\n\nThis link does not expire.`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close share dialog"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Share recipe
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              View-only access. Recipients can add ingredients to their lists or
              clone the recipe. Link never expires.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {loading ? (
          <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">
            Creating link…
          </p>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-[var(--destructive)]/40 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
            {error}
          </p>
        ) : null}

        {url ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm break-all text-[var(--foreground)]">
              {url}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => void handleCopy()}
              >
                {copied ? "Copied!" : "Copy link"}
              </Button>
              <Button type="button" fullWidth onClick={handleEmailShare}>
                Email
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
