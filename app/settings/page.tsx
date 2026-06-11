import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/settings-form";
import { BackLink } from "@/components/ui/back-link";
import { getSessionState } from "@/lib/auth/session";
import { fetchProfileForUser } from "@/lib/profile/server";
import { getTranslations } from "next-intl/server";

export default async function SettingsPage() {
  const tCommon = await getTranslations("common");
  const { user, isGuest, isAuthenticated } = await getSessionState();

  if (!isAuthenticated || isGuest || !user) {
    redirect("/login?next=/settings");
  }

  const profile = await fetchProfileForUser(user.id);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="safe-area-pt flex items-center gap-2 border-b border-[var(--border)] px-2 py-3">
        <BackLink href="/home" transitionTypes={["nav-down"]} label={tCommon("back")} />
        <h1 className="min-w-0 flex-1 text-lg font-semibold text-[var(--foreground)]">
          {tCommon("settings")}
        </h1>
      </header>
      <SettingsForm profile={profile} />
    </div>
  );
}
