"use client";

import { createContext, useContext } from "react";

export type TabId = "lists" | "recipes";
export type TabDirection = "forward" | "back";

type TabShellContextValue = {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  direction: TabDirection;
};

const TabShellContext = createContext<TabShellContextValue | null>(null);

export function TabShellProvider({
  value,
  children,
}: {
  value: TabShellContextValue;
  children: React.ReactNode;
}) {
  return (
    <TabShellContext.Provider value={value}>{children}</TabShellContext.Provider>
  );
}

export function useTabShell() {
  return useContext(TabShellContext);
}
