"use client";

import { useOnline } from "@/lib/pwa/use-online";
import { useTranslations } from "next-intl";

export function OfflineBanner() {
  const online = useOnline();
  const t = useTranslations("common");

  if (online) return null;

  return (
    <div
      className="border-b border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-center text-sm text-[var(--foreground)]"
      role="status"
    >
      {t("offline")}
    </div>
  );
}
