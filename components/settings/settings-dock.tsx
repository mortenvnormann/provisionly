"use client";

import { useMemo } from "react";
import { useRegisterDock } from "@/components/layout/dock-context";

export function SettingsDock() {
  const dockHandlers = useMemo(
    () => ({
      sortVisible: false,
      addVisible: false,
      action: null,
    }),
    [],
  );

  useRegisterDock(dockHandlers);
  return null;
}
