import Link from "next/link";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/settings-form";
import { getSessionState } from "@/lib/auth/session";
import { fetchProfileForUser } from "@/lib/profile/server";

export default async function SettingsPage() {
  const { user, isGuest, isAuthenticated } = await getSessionState();

  if (!isAuthenticated || isGuest || !user) {
    redirect("/login?next=/settings");
  }

  const profile = await fetchProfileForUser(user.id);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="safe-area-pt flex items-center gap-2 border-b border-[var(--border)] px-2 py-3">
        <Link
          href="/home"
          className="flex size-10 items-center justify-center rounded-lg text-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          aria-label="Back"
        >
          ‹
        </Link>
        <h1 className="min-w-0 flex-1 text-lg font-semibold text-[var(--foreground)]">
          Settings
        </h1>
      </header>
      <SettingsForm profile={profile} />
    </div>
  );
}
