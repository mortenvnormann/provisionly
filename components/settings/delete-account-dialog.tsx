"use client";

import { useState } from "react";
import { deleteAccountAction } from "@/lib/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

const DELETE_CONFIRMATION = "delete my account";

type DeleteAccountDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function DeleteAccountDialog({ open, onClose }: DeleteAccountDialogProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMatches = confirmation === DELETE_CONFIRMATION;

  if (!open) return null;

  async function handleDelete() {
    if (!deleteMatches) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteAccountAction(confirmation);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("couldNotDelete"));
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--overlay)] p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label={tCommon("close")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-dialog-title"
        className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg"
      >
        <h2
          id="delete-account-dialog-title"
          className="text-base font-semibold text-[var(--foreground)]"
        >
          {t("deleteAccountTitle")}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {t("deleteAccountBody")}
        </p>
        <div className="mt-4">
          <Input
            label={t("deleteConfirmInput", { phrase: DELETE_CONFIRMATION })}
            name="deleteConfirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            autoFocus
          />
        </div>
        {error ? (
          <p className="mt-3 text-sm text-[var(--destructive)]" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <Button
            variant="secondary"
            fullWidth
            type="button"
            disabled={deleting}
            onClick={onClose}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            variant="destructive"
            fullWidth
            type="button"
            disabled={!deleteMatches || deleting}
            onClick={() => void handleDelete()}
          >
            {deleting ? t("deleting") : t("deleteAccount")}
          </Button>
        </div>
      </div>
    </div>
  );
}
