"use client";

type ActionErrorBannerProps = {
  message: string;
  onDismiss: () => void;
  dismissLabel: string;
};

export function ActionErrorBanner({
  message,
  onDismiss,
  dismissLabel,
}: ActionErrorBannerProps) {
  return (
    <div className="mx-4 mt-3 flex items-start justify-between gap-3 rounded-xl border border-[var(--destructive)]/40 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
      <p className="min-w-0 flex-1">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 font-medium underline-offset-2 hover:underline"
        aria-label={dismissLabel}
      >
        {dismissLabel}
      </button>
    </div>
  );
}
