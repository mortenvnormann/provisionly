"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import { useEffect, type ReactNode } from "react";

type AppSerwistProviderProps = {
  children: ReactNode;
};

const isProduction = process.env.NODE_ENV === "production";

export function AppSerwistProvider({ children }: AppSerwistProviderProps) {
  useEffect(() => {
    if (isProduction) return;
    void navigator.serviceWorker
      ?.getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()));
  }, []);

  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={!isProduction}
      cacheOnNavigation={false}
    >
      {children}
    </SerwistProvider>
  );
}
