import { redirect } from "next/navigation";
import { ProblemPage } from "@/components/layout/problem-page";
import { getSessionState } from "@/lib/auth/session";
import { joinViaShareToken } from "@/lib/share/server";
import { joinErrorMessage } from "@/lib/share/join-error-message";
import { getTranslations } from "next-intl/server";

type JoinPageProps = {
  params: Promise<{ token: string }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const tCommon = await getTranslations("common");
  const tJoin = await getTranslations("join");
  const { token } = await params;
  const { user } = await getSessionState();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/join/${token}`)}`);
  }

  let result;
  try {
    result = await joinViaShareToken(user.id, token);
  } catch (err) {
    const message = joinErrorMessage(err, tJoin);

    return (
      <ProblemPage
        appName={tCommon("appName")}
        title={tJoin("couldNotOpenLink")}
        description={message}
        primaryLabel={tJoin("goToLists")}
        primaryHref="/home"
      />
    );
  }

  if (result.type === "list") {
    redirect(`/lists/${result.id}?joined=1`);
  }

  redirect(`/recipes/${result.id}?joined=1`);
}
