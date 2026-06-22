"use client";

import { useEffect } from "react";
import { ProblemPage } from "@/components/layout/problem-page";
import { reportClientError } from "@/lib/monitoring/report-client-error";
import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    reportClientError(error, { boundary: "global-error" });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)] antialiased">
        <ProblemPage
          appName="Provisionly"
          title="Something went wrong"
          description="An unexpected error occurred. You can try again or go back to your lists."
          primaryLabel="Try again"
          onPrimaryClick={reset}
          secondaryLabel="Go to your lists"
          secondaryHref="/home"
        />
      </body>
    </html>
  );
}
