"use client";

import { DockProvider } from "@/components/layout/dock-context";
import { FloatingBottomDock } from "@/components/layout/floating-bottom-dock";

export function DockHost({ children }: { children: React.ReactNode }) {
  return (
    <DockProvider>
      <div className="relative flex min-h-0 flex-1 flex-col">
        {children}
        <FloatingBottomDock />
      </div>
    </DockProvider>
  );
}
