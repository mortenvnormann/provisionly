"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

type AppSerwistProviderProps = {
  children: ReactNode;
};

export function AppSerwistProvider({ children }: AppSerwistProviderProps) {
  return <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>;
}
