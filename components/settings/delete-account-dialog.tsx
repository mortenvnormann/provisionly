"use client";

import { useState } from "react";
import { deleteAccountAction } from "@/lib/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DELETE_CONFIRMATION = "delete my account";

type DeleteAccountDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function DeleteAccountDialog({ open, onClose }: DeleteAccountDialogProps) {
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
      setError(err instanceof Error ? err.message : "Could not delete account.");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--overlay)] p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close dialog"
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
          Delete account
        </h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          This permanently deletes your account and all lists, recipes, and
          other data. This cannot be undone.
        </p>
        <div className="mt-4">
          <Input
            label={`Type "${DELETE_CONFIRMATION}" to confirm`}
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
            Cancel
          </Button>
          <Button
            variant="destructive"
            fullWidth
            type="button"
            disabled={!deleteMatches || deleting}
            onClick={() => void handleDelete()}
          >
            {deleting ? "Deleting…" : "Delete account"}
          </Button>
        </div>
      </div>
    </div>
  );
}
