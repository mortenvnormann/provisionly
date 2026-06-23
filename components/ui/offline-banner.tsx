"use client";

import { useOnline } from "@/lib/pwa/use-online";
import { countPendingMutations } from "@/lib/lists/offline-queue-count";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const online = useOnline();
  const t = useTranslations("common");
  const [pending, setPending] = useState(0);

  useEffect(() => {
    function refresh() {
      setPending(countPendingMutations());
    }
    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("provisionly-offline-queue", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("provisionly-offline-queue", refresh);
    };
  }, [online]);

  if (online) return null;

  return (
    <div
      className="border-b border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-center text-sm text-[var(--foreground)]"
      role="status"
    >
      {pending > 0
        ? t("offlineSyncPendingCount", { count: pending })
        : t("offlineSyncPending")}
    </div>
  );
}
