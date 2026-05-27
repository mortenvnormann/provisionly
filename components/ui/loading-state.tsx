type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <div
      className="flex min-h-full flex-1 flex-col items-center justify-center gap-3 py-16"
      role="status"
      aria-live="polite"
    >
      <div
        className="size-8 animate-spin rounded-full border-2 border-[var(--muted)] border-t-[var(--primary)]"
        aria-hidden
      />
      <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
    </div>
  );
}
