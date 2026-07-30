import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionState } from "@/lib/auth/session";
import { joinViaShareToken } from "@/lib/share/server";
import { joinErrorMessage } from "@/lib/share/join-error-message";
import { Button } from "@/components/ui/button";
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
      <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <p className="text-sm font-medium tracking-wide text-[var(--brand)] uppercase">
          {tCommon("appName")}
        </p>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          {tJoin("couldNotOpenLink")}
        </h1>
        <p className="max-w-sm text-sm text-[var(--muted-foreground)]">
          {message}
        </p>
        <Link href="/home">
          <Button>{tJoin("goToLists")}</Button>
        </Link>
      </main>
    );
  }

  if (result.type === "list") {
    redirect(`/lists/${result.id}?joined=1`);
  }

  redirect(`/recipes/${result.id}?joined=1`);
}
