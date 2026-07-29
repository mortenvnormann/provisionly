"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ListsHome } from "@/components/lists/lists-home";
import {
  TabShellProvider,
  type TabDirection,
  type TabId,
} from "@/components/layout/tab-shell-context";
import { useDockOptional } from "@/components/layout/dock-context";
import { useTabsData } from "@/components/layout/tabs-data-context";
import {
  prefetchListsHome,
  prefetchRecipesHome,
} from "@/lib/tabs/prefetch";
import { prefetchRecipesData } from "@/lib/tabs/recipes-prefetch-cache";

const RecipesHome = dynamic(
  () =>
    import("@/components/recipes/recipes-home").then((m) => ({
      default: m.RecipesHome,
    })),
  { ssr: false },
);

function tabFromPathname(pathname: string): TabId {
  return pathname.startsWith("/recipes") ? "recipes" : "lists";
}

export function TabShell() {
  const {
    isGuest,
    firstName,
    lastName,
    displayName,
    email,
    initialLists,
    initialRecipes,
  } = useTabsData();
  const pathname = usePathname();
  const dock = useDockOptional();
  const [activeTab, setActiveTabState] = useState<TabId>(() =>
    tabFromPathname(pathname),
  );
  const [recipesMounted, setRecipesMounted] = useState(
    () => tabFromPathname(pathname) === "recipes",
  );
  const [direction, setDirection] = useState<TabDirection>("forward");
  const [listsReady, setListsReady] = useState(initialLists.length > 0);

  const handleListsReady = useCallback(() => {
    setListsReady(true);
  }, []);

  useEffect(() => {
    if (isGuest || initialRecipes.length > 0 || !listsReady) return;
    if (tabFromPathname(pathname) !== "lists") return;

    const startPrefetch = () => {
      prefetchRecipesHome();
    };

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(startPrefetch);
      return () => cancelIdleCallback(id);
    }

    startPrefetch();
  }, [isGuest, initialRecipes.length, listsReady, pathname]);

  const setDockIsGuest = dock?.setIsGuest;
  useEffect(() => {
    if (!setDockIsGuest) return;
    setDockIsGuest(isGuest);
  }, [isGuest, setDockIsGuest]);

  useEffect(() => {
    setActiveTabState(tabFromPathname(pathname));
  }, [pathname]);

  useEffect(() => {
    if (activeTab === "recipes") setRecipesMounted(true);
  }, [activeTab]);

  useEffect(() => {
    const onPopState = () => {
      const tab = tabFromPathname(window.location.pathname);
      setActiveTabState(tab);
      if (tab === "recipes") setRecipesMounted(true);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const setActiveTab = useCallback(
    (tab: TabId) => {
      if (tab === activeTab) return;
      if (tab === "recipes") {
        setRecipesMounted(true);
        prefetchRecipesHome();
        void prefetchRecipesData();
      } else {
        prefetchListsHome();
      }
      setDirection(tab === "recipes" ? "forward" : "back");
      setActiveTabState(tab);
      const url = tab === "lists" ? "/home" : "/recipes";
      window.history.replaceState(window.history.state, "", url);
    },
    [activeTab],
  );

  const setDockTabNavigation = dock?.setTabNavigation;
  useEffect(() => {
    if (isGuest || !setDockTabNavigation) return;
    setDockTabNavigation({ activeTab, setActiveTab });
    return () => setDockTabNavigation(null);
  }, [isGuest, setDockTabNavigation, activeTab, setActiveTab]);

  if (isGuest) {
    return (
      <ListsHome
        isGuest
        firstName={firstName}
        lastName={lastName}
        displayName={displayName}
        email={email}
        initialLists={initialLists}
      />
    );
  }

  return (
    <TabShellProvider value={{ activeTab, setActiveTab, direction }}>
      <div className="flex min-h-full flex-1 flex-col overflow-hidden">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {activeTab === "lists" ? (
            <ListsHome
              isGuest={false}
              firstName={firstName}
              lastName={lastName}
              displayName={displayName}
              email={email}
              initialLists={initialLists}
              onListsReady={handleListsReady}
            />
          ) : recipesMounted ? (
            <RecipesHome
              firstName={firstName}
              lastName={lastName}
              displayName={displayName}
              email={email}
              initialRecipes={initialRecipes}
            />
          ) : null}
        </div>
      </div>
    </TabShellProvider>
  );
}
