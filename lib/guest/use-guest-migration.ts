"use client";

import { useEffect, useRef, useState } from "react";
import {
  hasPendingGuestLists,
  runGuestMigration,
  type GuestMigrationResult,
} from "@/lib/guest/migrate";

type UseGuestMigrationOptions = {
  enabled: boolean;
  onComplete?: (result: GuestMigrationResult) => void;
};

export function useGuestMigrationOnLogin({
  enabled,
  onComplete,
}: UseGuestMigrationOptions) {
  const [result, setResult] = useState<GuestMigrationResult | null>(null);
  const [isMigrating, setIsMigrating] = useState(
    () => enabled && hasPendingGuestLists(),
  );
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!enabled || !hasPendingGuestLists()) {
      setIsMigrating(false);
      return;
    }

    let cancelled = false;
    setIsMigrating(true);

    async function run() {
      await new Promise((r) => setTimeout(r, 300));
      if (cancelled) return;

      const migration = await runGuestMigration();
      if (cancelled) return;

      setIsMigrating(false);

      if (migration.migrated > 0 || migration.errors.length > 0) {
        setResult(migration);
        onCompleteRef.current?.(migration);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { result, isMigrating };
}
