"use client";

import { useTranslations } from "next-intl";
import { useTabShell } from "@/components/layout/tab-shell-context";
import {
  prefetchListsHome,
  prefetchRecipesHome,
} from "@/lib/tabs/prefetch";

type AppNavProps = {
  isGuest?: boolean;
};

export function AppNav({ isGuest = false }: AppNavProps) {
  const t = useTranslations("nav");
  const tabShell = useTabShell();

  if (isGuest) {
    return (
      <nav className="flex gap-1 rounded-xl bg-[var(--muted)] p-1">
        <span className="flex-1 rounded-lg bg-[var(--surface)] px-3 py-2 text-center text-sm font-medium text-[var(--foreground)] shadow-sm">
          {t("lists")}
        </span>
        <span
          className="flex-1 rounded-lg px-3 py-2 text-center text-sm text-[var(--muted-foreground)]"
          title={t("guestRecipesHint")}
        >
          {t("recipes")}
        </span>
      </nav>
    );
  }

  const active = tabShell?.activeTab ?? "lists";
  const setActiveTab = tabShell?.setActiveTab;

  const tabClass = (isActive: boolean) =>
    [
      "flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors",
      isActive
        ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
    ].join(" ");

  return (
    <nav className="flex gap-1 rounded-xl bg-[var(--muted)] p-1" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={active === "lists"}
        onClick={() => setActiveTab?.("lists")}
        onPointerEnter={() => prefetchListsHome()}
        onFocus={() => prefetchListsHome()}
        className={tabClass(active === "lists")}
      >
        {t("lists")}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === "recipes"}
        onClick={() => setActiveTab?.("recipes")}
        onPointerEnter={() => prefetchRecipesHome()}
        onFocus={() => prefetchRecipesHome()}
        className={tabClass(active === "recipes")}
      >
        {t("recipes")}
      </button>
    </nav>
  );
}
