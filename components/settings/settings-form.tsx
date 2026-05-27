"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { signOut } from "@/lib/auth/actions";
import { updateProfileAction } from "@/lib/profile/actions";
import type { UserProfile } from "@/lib/profile/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SettingsFormProps = {
  profile: UserProfile;
};

export function SettingsForm({ profile }: SettingsFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(profile.firstName ?? "");
  const [lastName, setLastName] = useState(profile.lastName ?? "");
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
      await updateProfileAction({ firstName, lastName });
      setSaveMessage("Profile saved.");
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-4 pb-24">
        <section className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Profile</h2>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <Input
              label="First name"
              name="firstName"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
            />
            <Input
              label="Last name"
              name="lastName"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
            />
            <Input
              label="Email"
              name="email"
              value={profile.email}
              readOnly
              className="opacity-80"
            />
            {saveError ? (
              <p className="text-sm text-[var(--destructive)]" role="alert">
                {saveError}
              </p>
            ) : null}
            {saveMessage ? (
              <p className="text-sm text-[var(--primary)]">{saveMessage}</p>
            ) : null}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Account</h2>
          <form action={signOut}>
            <Button type="submit" variant="secondary" fullWidth>
              Sign out
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
            Delete account
          </Button>
        </section>

        <Link
          href="/home"
          className="text-center text-sm font-medium text-[var(--primary)] underline-offset-2 hover:underline"
        >
          Back to lists
        </Link>
      </div>

      <DeleteAccountDialog
        key={deleteDialogKey}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      />
    </>
  );
}
