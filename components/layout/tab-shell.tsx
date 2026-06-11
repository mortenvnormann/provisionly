"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ListsHome } from "@/components/lists/lists-home";
import { RecipesHome } from "@/components/recipes/recipes-home";
import type { ListSummary } from "@/lib/lists/types";
import type { RecipeSummary } from "@/lib/recipes/types";
import {
  TabShellProvider,
  type TabDirection,
  type TabId,
} from "@/components/layout/tab-shell-context";

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
  const [direction, setDirection] = useState<TabDirection>("forward");
  const [reduceMotion, setReduceMotion] = useState(false);

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

  const setActiveTab = useCallback(
    (tab: TabId) => {
      if (tab === activeTab) return;
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
              reduceMotion ? "" : "transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
            ].join(" ")}
            style={{ transform: `translateX(${translateX})` }}
          >
            <div
              className="flex h-full w-1/2 flex-col overflow-hidden"
              aria-hidden={activeTab !== "lists"}
            >
              <ListsHome
                isGuest={false}
                firstName={firstName}
                lastName={lastName}
                displayName={displayName}
                email={email}
                initialLists={initialLists}
              />
            </div>
            <div
              className="flex h-full w-1/2 flex-col overflow-hidden"
              aria-hidden={activeTab !== "recipes"}
            >
              <RecipesHome
                firstName={firstName}
                lastName={lastName}
                displayName={displayName}
                email={email}
                initialRecipes={initialRecipes}
              />
            </div>
          </div>
        </div>
      </div>
    </TabShellProvider>
  );
}
