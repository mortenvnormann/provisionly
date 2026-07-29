"use client";

import { useEffect } from "react";
import type { LegalSection } from "@/lib/legal/documents";
import { useTranslations } from "next-intl";

type LegalDocumentSheetProps = {
  title: string;
  sections: LegalSection[];
  open: boolean;
  onClose: () => void;
};

export function LegalDocumentSheet({
  title,
  sections,
  open,
  onClose,
}: LegalDocumentSheetProps) {
  const tCommon = useTranslations("common");

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="presentation"
    >
      <button
        type="button"
        className="sheet-backdrop absolute inset-0 bg-[var(--overlay)]"
        aria-label={tCommon("close")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-document-title"
        className="sheet-panel relative z-10 flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)] shadow-token-md"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] p-5 pb-4">
          <h2
            id="legal-document-title"
            className="text-lg font-semibold text-[var(--foreground)]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            aria-label={tCommon("close")}
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <div className="flex flex-col gap-6 text-sm leading-relaxed text-[var(--foreground)]">
            {sections.map((section) => (
              <section key={section.id} aria-labelledby={`legal-${section.id}`}>
                <h3
                  id={`legal-${section.id}`}
                  className="mb-2 font-semibold text-[var(--foreground)]"
                >
                  {section.title}
                </h3>
                <div className="flex flex-col gap-3 text-[var(--muted-foreground)]">
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={`${section.id}-${index}`}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
