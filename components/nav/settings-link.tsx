import Link from "next/link";
import { useTranslations } from "next-intl";
import { PersonOutlineIcon } from "@/components/ui/icons";

export function SettingsLink() {
  const t = useTranslations("common");

  return (
    <Link
      href="/settings"
      transitionTypes={["nav-up"]}
      aria-label={t("settings")}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
    >
      <PersonOutlineIcon className="h-5 w-5" />
    </Link>
  );
}
