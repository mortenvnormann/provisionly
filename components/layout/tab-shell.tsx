"use client";

import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ListsHome } from "@/components/lists/lists-home";
import type { ListSummary } from "@/lib/lists/types";
import type { RecipeSummary } from "@/lib/recipes/types";
import {
  TabShellProvider,
  type TabDirection,
  type TabId,
} from "@/components/layout/tab-shell-context";
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

type TabShellProps = {
  isGuest: boolean;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string | null;
  initialLists: ListSummary[];
  initialRecipes: RecipeSummary[];
};

export function TabShell({
  isGuest,
  firstName,
  lastName,
  displayName,
  email,
  initialLists,
  initialRecipes,
}: TabShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTabState] = useState<TabId>(() =>
    tabFromPathname(pathname),
  );
  const [listsMounted, setListsMounted] = useState(
    () => tabFromPathname(pathname) === "lists",
  );
  const [recipesMounted, setRecipesMounted] = useState(
    () => tabFromPathname(pathname) === "recipes",
  );
  const [direction, setDirection] = useState<TabDirection>("forward");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [listsReady, setListsReady] = useState(initialLists.length > 0);

  const handleListsReady = useCallback(() => {
    setListsReady(true);
  }, []);

  useEffect(() => {
    if (isGuest || initialRecipes.length > 0 || !listsReady) return;
    if (tabFromPathname(pathname) !== "lists") return;

    const startPrefetch = () => {
      void import("@/components/recipes/recipes-home");
      void prefetchRecipesData();
    };

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(startPrefetch);
      return () => cancelIdleCallback(id);
    }

    startPrefetch();
  }, [isGuest, initialRecipes.length, listsReady, pathname]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    router.prefetch("/settings");
  }, [router]);

  useEffect(() => {
    setActiveTabState(tabFromPathname(pathname));
  }, [pathname]);

  useEffect(() => {
    const onPopState = () => {
      setActiveTabState(tabFromPathname(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (activeTab === "lists") setListsMounted(true);
    if (activeTab === "recipes") setRecipesMounted(true);
  }, [activeTab]);

  const setActiveTab = useCallback(
    (tab: TabId) => {
      if (tab === activeTab) return;
      if (tab === "recipes") setRecipesMounted(true);
      if (tab === "lists") setListsMounted(true);
      setDirection(tab === "recipes" ? "forward" : "back");
      setActiveTabState(tab);
      const url = tab === "lists" ? "/home" : "/recipes";
      window.history.pushState(null, "", url);
    },
    [activeTab],
  );

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

  const translateX = activeTab === "recipes" ? "-50%" : "0%";

  return (
    <TabShellProvider value={{ activeTab, setActiveTab, direction }}>
      <div className="flex min-h-full flex-1 flex-col overflow-hidden">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            className={[
              "flex h-full w-[200%]",
              reduceMotion
                ? ""
                : "transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
            ].join(" ")}
            style={{ transform: `translateX(${translateX})` }}
          >
            <div
              className={[
                "flex h-full w-1/2 flex-col overflow-hidden",
                activeTab !== "lists" ? "pointer-events-none" : "",
              ].join(" ")}
              aria-hidden={activeTab !== "lists"}
            >
              {listsMounted ? (
                <ListsHome
                  isGuest={false}
                  firstName={firstName}
                  lastName={lastName}
                  displayName={displayName}
                  email={email}
                  initialLists={initialLists}
                  onListsReady={handleListsReady}
                />
              ) : null}
            </div>
            <div
              className={[
                "flex h-full w-1/2 flex-col overflow-hidden",
                activeTab !== "recipes" ? "pointer-events-none" : "",
              ].join(" ")}
              aria-hidden={activeTab !== "recipes"}
            >
              {recipesMounted ? (
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
        </div>
      </div>
    </TabShellProvider>
  );
}
