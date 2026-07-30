"use client";

import { useEffect, useState } from "react";
import { createShareLinkAction } from "@/lib/share/actions";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

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
  const tLists = useTranslations("lists");
  const tShare = useTranslations("share");
  const tCommon = useTranslations("common");
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
        console.error(err);
        setError(tLists("couldNotCreateLink"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, listId, tLists]);

  if (!open) return null;

  async function handleCopy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEmailShare() {
    if (!url) return;
    const subject = encodeURIComponent(tShare("listEmailSubject", { title: listTitle }));
    const body = encodeURIComponent(
      tShare("listEmailBody", { title: listTitle, url }),
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="sheet-backdrop absolute inset-0 bg-[var(--overlay)]"
        aria-label={tShare("closeShare")}
        onClick={onClose}
      />
      <div className="sheet-panel font-ui relative z-10 w-full max-w-md rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-token-md">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="heading-editorial text-lg text-[var(--foreground)]">
              {tLists("shareListTitle")}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {tLists("shareListDescription")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            aria-label={tCommon("close")}
          >
            ×
          </button>
        </div>

        {loading ? (
          <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">
            {tShare("creatingLink")}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-[var(--radius-card)] border border-[var(--destructive)]/30 bg-[var(--destructive)]/8 px-3 py-2.5 text-sm text-[var(--destructive)]">
            {error}
          </p>
        ) : null}

        {url ? (
          <div className="flex flex-col gap-3">
            <div className="card-surface-bordered px-3 py-2 text-sm break-all text-[var(--foreground)]">
              {url}
            </div>
            {expiresAt ? (
              <p className="text-xs text-[var(--muted-foreground)]">
                {tShare("expiresAt", { date: formatExpiry(expiresAt) })}
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => void handleCopy()}
              >
                {copied ? tCommon("copied") : tCommon("copyLink")}
              </Button>
              <Button type="button" fullWidth onClick={handleEmailShare}>
                {tShare("emailInvite")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
