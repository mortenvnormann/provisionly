"use client";

import { useEffect, useState } from "react";
import { createShareLinkAction } from "@/lib/share/actions";
import { Button } from "@/components/ui/button";

type ShareListSheetProps = {
  listId: string;
  listTitle: string;
  open: boolean;
  onClose: () => void;
};

function formatExpiry(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function ShareListSheet({
  listId,
  listTitle,
  open,
  onClose,
}: ShareListSheetProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setUrl(null);
      setExpiresAt(null);
      setError(null);
      setCopied(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void createShareLinkAction(listId)
      .then((result) => {
        if (cancelled) return;
        setUrl(result.url);
        setExpiresAt(result.expiresAt);
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
  }, [open, listId]);

  if (!open) return null;

  async function handleCopy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEmailShare() {
    if (!url) return;
    const subject = encodeURIComponent(`Join my grocery list: ${listTitle}`);
    const body = encodeURIComponent(
      `Hi,\n\nJoin my shopping list "${listTitle}" on Provisionly:\n\n${url}\n\nThis link expires in 7 days.`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)] p-4 sm:items-center">
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
              Share list
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Anyone with the link can edit this list. Links expire after 7 days.
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
            {expiresAt ? (
              <p className="text-xs text-[var(--muted-foreground)]">
                Expires {formatExpiry(expiresAt)}
              </p>
            ) : null}
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
