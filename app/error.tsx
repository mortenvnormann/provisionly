"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { ProblemPage } from "@/components/layout/problem-page";
import { reportClientError } from "@/lib/monitoring/report-client-error";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");

  useEffect(() => {
    reportClientError(error, { boundary: "error" });
  }, [error]);

  return (
    <ProblemPage
      appName={tCommon("appName")}
      title={tErrors("somethingWrongTitle")}
      description={tErrors("somethingWrongDescription")}
      primaryLabel={tErrors("tryAgain")}
      onPrimaryClick={reset}
      secondaryLabel={tErrors("goHome")}
      secondaryHref="/home"
    />
  );
}
