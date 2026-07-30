"use client";

import { createContext, useContext } from "react";
import type { ListSummary } from "@/lib/lists/types";
import type { RecipeSummary } from "@/lib/recipes/types";

export type TabsData = {
  isGuest: boolean;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string | null;
  initialLists: ListSummary[];
  initialRecipes: RecipeSummary[];
};

const TabsDataContext = createContext<TabsData | null>(null);

export function TabsDataProvider({
  value,
  children,
}: {
  value: TabsData;
  children: React.ReactNode;
}) {
  return (
    <TabsDataContext.Provider value={value}>{children}</TabsDataContext.Provider>
  );
}

export function useTabsData() {
  const ctx = useContext(TabsDataContext);
  if (!ctx) {
    throw new Error("useTabsData must be used within TabsDataProvider");
  }
  return ctx;
}

/** Returns null outside TabsDataProvider (e.g. recipe detail pages). */
export function useTabsDataOptional() {
  return useContext(TabsDataContext);
}
