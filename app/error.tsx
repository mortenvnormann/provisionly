"use client";

import { useTranslations } from "next-intl";
import { ProblemPage } from "@/components/layout/problem-page";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");

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
