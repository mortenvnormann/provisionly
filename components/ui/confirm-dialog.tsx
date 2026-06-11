"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

type PendingConfirm = {
  message: string;
  confirmLabel: string;
  resolve: (confirmed: boolean) => void;
};

const ConfirmContext = createContext<
  ((message: string, confirmLabel?: string) => Promise<boolean>) | null
>(null);

type ConfirmDialogProps = {
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmDialog({
  message,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const t = useTranslations("common");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--overlay)] p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label={t("close")}
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-message"
        className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg"
      >
        <p
          id="confirm-dialog-message"
          className="text-sm text-[var(--foreground)]"
        >
          {message}
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" fullWidth type="button" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button variant="destructive" fullWidth type="button" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const tCommon = useTranslations("common");
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback(
    (message: string, confirmLabel = tCommon("delete")) =>
      new Promise<boolean>((resolve) => {
        setPending({ message, confirmLabel, resolve });
      }),
    [tCommon],
  );

  function close(confirmed: boolean) {
    if (!pending) return;
    pending.resolve(confirmed);
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending ? (
        <ConfirmDialog
          message={pending.message}
          confirmLabel={pending.confirmLabel}
          onCancel={() => close(false)}
          onConfirm={() => close(true)}
        />
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm must be used within ConfirmDialogProvider");
  }
  return confirm;
}
