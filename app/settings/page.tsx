import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/settings-form";
import { SettingsDock } from "@/components/settings/settings-dock";
import { BackLink } from "@/components/ui/back-link";
import { getSessionState } from "@/lib/auth/session";
import { fetchProfileForUser } from "@/lib/profile/server";
import { getTranslations } from "next-intl/server";

export default async function SettingsPage() {
  const tCommon = await getTranslations("common");
  const { user, isAuthenticated } = await getSessionState();

  if (!isAuthenticated || !user) {
    redirect("/login?next=/settings");
  }

  const profile = await fetchProfileForUser(user.id, { email: user.email });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SettingsDock />
      <header className="safe-area-pt font-ui flex shrink-0 items-center gap-2 px-2 py-3">
        <BackLink href="/home" label={tCommon("back")} />
        <h1 className="min-w-0 flex-1 text-lg font-semibold text-[var(--foreground)]">
          {tCommon("settings")}
        </h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-dock">
        <SettingsForm profile={profile} />
      </div>
    </div>
  );
}
