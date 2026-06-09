"use client";

import { useEffect, useState } from "react";
import {
  dismissInstallPrompt,
  isBeforeInstallPromptEvent,
  isInstallDismissed,
  isIos,
  isStandalonePwa,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa/install";
import { Button } from "@/components/ui/button";

export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandalonePwa() || isInstallDismissed()) return;

    if (isIos()) {
      setIosHint(true);
      setVisible(true);
      return;
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      if (!isBeforeInstallPromptEvent(event)) return;
      setPromptEvent(event);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  function handleDismiss() {
    dismissInstallPrompt();
    setVisible(false);
  }

  async function handleInstall() {
    if (!promptEvent) return;
    setInstalling(true);
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
      handleDismiss();
    } finally {
      setInstalling(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="safe-area-pb border-b border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--foreground)]">
            Install Provisionly
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            {iosHint
              ? "Tap Share, then “Add to Home Screen” for quick access."
              : "Add to your home screen for a full-screen app experience."}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {!iosHint && promptEvent ? (
            <Button
              type="button"
              onClick={() => void handleInstall()}
              disabled={installing}
            >
              {installing ? "…" : "Install"}
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={handleDismiss}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
