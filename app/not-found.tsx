import { getTranslations } from "next-intl/server";
import { ProblemPage } from "@/components/layout/problem-page";

export default async function NotFound() {
  const tCommon = await getTranslations("common");
  const tErrors = await getTranslations("errors");

  return (
    <ProblemPage
      appName={tCommon("appName")}
      title={tErrors("pageNotFoundTitle")}
      description={tErrors("pageNotFoundDescription")}
      primaryLabel={tErrors("goHome")}
      primaryHref="/home"
    />
  );
}
