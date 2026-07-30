"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { signOut } from "@/lib/auth/actions";
import { LOCALE_LABELS, type AppLocale } from "@/lib/i18n/locales";
import { updateProfileAction } from "@/lib/profile/actions";
import type { UserProfile } from "@/lib/profile/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

type SettingsFormProps = {
  profile: UserProfile;
};

export function SettingsForm({ profile }: SettingsFormProps) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [firstName, setFirstName] = useState(profile.firstName ?? "");
  const [lastName, setLastName] = useState(profile.lastName ?? "");
  const [locale, setLocale] = useState<AppLocale>(profile.locale);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDialogKey, setDeleteDialogKey] = useState(0);

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      await updateProfileAction({ firstName, lastName, locale });
      setSaveMessage(t("profileSaved"));
      router.refresh();
    } catch (err) {
      console.error(err);
      setSaveError(t("couldNotSave"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="font-ui flex flex-1 flex-col gap-4 p-4">
        <section className="card-surface-bordered flex flex-col gap-3 p-3">
          <h2 className="heading-editorial text-base text-[var(--foreground)]">{t("profile")}</h2>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <Input
              label={t("firstName")}
              name="firstName"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
            />
            <Input
              label={t("lastName")}
              name="lastName"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
            />
            <Input
              label={t("email")}
              name="email"
              value={profile.email}
              readOnly
              className="opacity-80"
            />
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[var(--foreground)]">
                {t("language")}
              </span>
              <select
                name="locale"
                value={locale}
                onChange={(event) => setLocale(event.target.value as AppLocale)}
                className="font-ui h-10 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 text-base focus:border-[var(--focus-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]/20"
              >
                {Object.entries(LOCALE_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {saveError ? (
              <p className="text-sm text-[var(--destructive)]" role="alert">
                {saveError}
              </p>
            ) : null}
            {saveMessage ? (
              <p className="text-sm text-[var(--accent)]">{saveMessage}</p>
            ) : null}
            <Button type="submit" disabled={saving}>
              {saving ? t("saving") : t("saveProfile")}
            </Button>
          </form>
        </section>

        <section className="card-surface-bordered flex flex-col gap-3 p-3">
          <h2 className="heading-editorial text-base text-[var(--foreground)]">{t("account")}</h2>
          <form action={signOut}>
            <Button type="submit" variant="secondary" fullWidth>
              {t("signOut")}
            </Button>
          </form>
          <Button
            type="button"
            variant="destructive"
            fullWidth
            onClick={() => {
              setDeleteDialogKey((key) => key + 1);
              setDeleteDialogOpen(true);
            }}
          >
            {t("deleteAccount")}
          </Button>
        </section>
      </div>

      <DeleteAccountDialog
        key={deleteDialogKey}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      />
    </>
  );
}
