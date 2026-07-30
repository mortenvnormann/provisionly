import { useTranslations } from "next-intl";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label }: LoadingStateProps) {
  const t = useTranslations("common");
  const resolvedLabel = label ?? t("loading");

  return (
    <div
      className="flex min-h-full flex-1 flex-col items-center justify-center gap-2.5 py-12"
      role="status"
      aria-live="polite"
    >
      <div
        className="size-6 animate-spin rounded-full border-2 border-[var(--muted)] border-t-[var(--accent)]"
        aria-hidden
      />
      <p className="font-ui text-xs text-[var(--muted-foreground)]">{resolvedLabel}</p>
    </div>
  );
}
