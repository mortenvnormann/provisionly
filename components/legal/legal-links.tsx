"use client";

import { useState } from "react";
import { LegalDocumentSheet } from "@/components/legal/legal-document-sheet";
import {
  privacyPolicy,
  termsOfUse,
} from "@/lib/legal/documents";
import { useTranslations } from "next-intl";

type LegalDoc = "privacy" | "terms";

type LegalLinksProps = {
  variant?: "settings" | "footer";
};

export function LegalLinks({ variant = "settings" }: LegalLinksProps) {
  const t = useTranslations("settings");
  const [openDoc, setOpenDoc] = useState<LegalDoc | null>(null);

  const linkClass =
    variant === "footer"
      ? "text-sm text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
      : "text-left text-sm text-[var(--accent)] underline-offset-2 hover:underline";

  function openPrivacy() {
    setOpenDoc("privacy");
  }

  function openTerms() {
    setOpenDoc("terms");
  }

  if (variant === "footer") {
    return (
      <>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
          <button type="button" onClick={openPrivacy} className={linkClass}>
            {t("privacyPolicy")}
          </button>
          <span className="text-sm text-[var(--muted-foreground)]" aria-hidden>
            ·
          </span>
          <button type="button" onClick={openTerms} className={linkClass}>
            {t("termsOfUse")}
          </button>
        </div>
        <LegalDocumentSheet
          title={t("privacyPolicy")}
          sections={privacyPolicy}
          open={openDoc === "privacy"}
          onClose={() => setOpenDoc(null)}
        />
        <LegalDocumentSheet
          title={t("termsOfUse")}
          sections={termsOfUse}
          open={openDoc === "terms"}
          onClose={() => setOpenDoc(null)}
        />
      </>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          {t("legal")}
        </h2>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={openPrivacy} className={linkClass}>
            {t("privacyPolicy")}
          </button>
          <button type="button" onClick={openTerms} className={linkClass}>
            {t("termsOfUse")}
          </button>
        </div>
      </section>
      <LegalDocumentSheet
        title={t("privacyPolicy")}
        sections={privacyPolicy}
        open={openDoc === "privacy"}
        onClose={() => setOpenDoc(null)}
      />
      <LegalDocumentSheet
        title={t("termsOfUse")}
        sections={termsOfUse}
        open={openDoc === "terms"}
        onClose={() => setOpenDoc(null)}
      />
    </>
  );
}
