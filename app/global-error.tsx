"use client";

import { useEffect } from "react";
import { ProblemPage } from "@/components/layout/problem-page";
import { LOCALE_COOKIE } from "@/lib/i18n/locales";
import { reportClientError } from "@/lib/monitoring/report-client-error";
import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const COPY = {
  en: {
    title: "Something went wrong",
    description:
      "An unexpected error occurred. You can try again or go back to your lists.",
    tryAgain: "Try again",
    goHome: "Go to your lists",
  },
  da: {
    title: "Noget gik galt",
    description:
      "Der opstod en uventet fejl. Du kan prøve igen eller gå tilbage til dine lister.",
    tryAgain: "Prøv igen",
    goHome: "Gå til dine lister",
  },
} as const;

function readLocale(): keyof typeof COPY {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`),
  );
  const value = match?.[1];
  return value === "da" ? "da" : "en";
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    reportClientError(error, { boundary: "global-error" });
  }, [error]);

  const locale = readLocale();
  const copy = COPY[locale];

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)] antialiased">
        <ProblemPage
          appName="Provisionly"
          title={copy.title}
          description={copy.description}
          primaryLabel={copy.tryAgain}
          onPrimaryClick={reset}
          secondaryLabel={copy.goHome}
          secondaryHref="/home"
        />
      </body>
    </html>
  );
}
