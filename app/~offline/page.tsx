import { ProblemPage } from "@/components/layout/problem-page";
import { getTranslations } from "next-intl/server";

export default async function OfflinePage() {
  const tCommon = await getTranslations("common");

  return (
    <ProblemPage
      appName={tCommon("appName")}
      title={tCommon("offlineTitle")}
      description={tCommon("offlineDescription")}
      primaryLabel={tCommon("offlineRetry")}
      primaryHref="/home"
    />
  );
}
