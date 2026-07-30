"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef } from "react";
import { useDockOptional } from "@/components/layout/dock-context";
import {
  AddToListIcon,
  ClearCheckedIcon,
  ListsIcon,
  PersonOutlineIcon,
  PlusIcon,
  RecipesIcon,
  SortIcon,
} from "@/components/ui/icons";
import { useAppNavigate } from "@/lib/nav/use-app-navigate";
import { lightHaptic, setNavOrigin } from "@/lib/nav/transition";
import { prefetchListsHome, prefetchRecipesHome } from "@/lib/tabs/prefetch";

type DockItemProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: (el: HTMLButtonElement) => void;
  onPointerEnter?: () => void;
  children: React.ReactNode;
  title?: string;
};

function DockItem({
  label,
  active,
  disabled,
  onClick,
  onPointerEnter,
  children,
  title,
}: DockItemProps) {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={ref}
      type="button"
      title={title}
      disabled={disabled}
      onPointerEnter={onPointerEnter}
      onClick={() => {
        if (!ref.current || disabled) return;
        onClick(ref.current);
      }}
      className={[
        "font-ui pressable flex min-w-0 shrink flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 py-1.5 text-[10px] font-medium",
        disabled ? "cursor-not-allowed opacity-40" : "text-[var(--muted-foreground)]",
        active ? "text-[var(--foreground)]" : "",
      ].join(" ")}
    >
      <span
        className={[
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          active ? "bg-[var(--muted)]" : "",
        ].join(" ")}
      >
        {children}
      </span>
      <span className="max-w-full shrink truncate">{label}</span>
    </button>
  );
}

function isMainTabPath(pathname: string) {
  return pathname === "/home" || pathname === "/recipes";
}

function isListDetail(pathname: string) {
  return /^\/lists\/[^/]+$/.test(pathname);
}

function isRecipeDetail(pathname: string) {
  return /^\/recipes\/[^/]+$/.test(pathname) && pathname !== "/recipes/new";
}

export function FloatingBottomDock() {
  const pathname = usePathname();
  const { push } = useAppNavigate();
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tAddToList = useTranslations("addToList");
  const dock = useDockOptional();

  const showDock = useMemo(() => {
    if (pathname.startsWith("/login") || pathname.startsWith("/join")) {
      return false;
    }
    return (
      isMainTabPath(pathname) ||
      pathname === "/settings" ||
      isListDetail(pathname) ||
      isRecipeDetail(pathname)
    );
  }, [pathname]);

  const activeTab = dock?.tabNavigation?.activeTab ?? dock?.lastMainTab ?? "lists";
  const isSettings = pathname === "/settings";
  const isGuestRecipesDisabled = Boolean(dock?.isGuest && pathname === "/home");

  const handlers = dock?.handlers;
  const formActions = handlers?.formActions;
  const formActionsVisible = formActions?.visible ?? false;
  const sortVisible = !formActionsVisible && (handlers?.sortVisible ?? isMainTabPath(pathname));
  const actionSlot = handlers?.action;
  const actionVisible = !formActionsVisible && (actionSlot?.visible ?? false);
  const addVisible = !formActionsVisible && (handlers?.addVisible ?? isMainTabPath(pathname));

  const siblingLabel = useMemo(() => {
    if (isSettings) {
      return dock?.lastMainTab === "recipes" ? tNav("recipes") : tNav("lists");
    }
    if (isListDetail(pathname)) return tNav("lists");
    if (isRecipeDetail(pathname)) return tNav("recipes");
    return activeTab === "lists" ? tNav("recipes") : tNav("lists");
  }, [activeTab, dock?.lastMainTab, isSettings, pathname, tNav]);

  const siblingIconKind = useMemo((): "lists" | "recipes" => {
    if (isListDetail(pathname) || (isSettings && dock?.lastMainTab !== "recipes")) {
      return "lists";
    }
    if (isRecipeDetail(pathname) || activeTab === "recipes") {
      return "recipes";
    }
    return activeTab === "lists" ? "recipes" : "lists";
  }, [activeTab, dock?.lastMainTab, isSettings, pathname]);

  const ActionIcon =
    isRecipeDetail(pathname) || actionSlot?.label === tAddToList("addToList")
      ? AddToListIcon
      : ClearCheckedIcon;

  const handleSiblingPrefetch = useCallback(() => {
    if (isListDetail(pathname) || isRecipeDetail(pathname) || isSettings) return;
    if (activeTab === "lists") prefetchRecipesHome();
    else prefetchListsHome();
  }, [activeTab, isSettings, pathname]);

  const handleSibling = useCallback(
    (el: HTMLButtonElement) => {
      setNavOrigin(el);
      lightHaptic();

      if (isListDetail(pathname)) {
        push("/home", { element: el, transitionType: "nav-down" });
        return;
      }
      if (isRecipeDetail(pathname)) {
        push("/recipes", { element: el, transitionType: "nav-down" });
        return;
      }
      if (isSettings) {
        const target = dock?.lastMainTab === "recipes" ? "/recipes" : "/home";
        push(target, { element: el, transitionType: "nav-down" });
        return;
      }

      const nextTab = activeTab === "lists" ? "recipes" : "lists";
      dock?.setLastMainTab(nextTab);
      dock?.tabNavigation?.setActiveTab(nextTab);
    },
    [activeTab, dock, isSettings, pathname, push],
  );

  const handleSettings = useCallback(
    (el: HTMLButtonElement) => {
      if (isSettings) return;
      lightHaptic();
      if (isMainTabPath(pathname)) {
        dock?.setLastMainTab(activeTab);
      }
      push("/settings", { element: el, transitionType: "nav-up" });
    },
    [activeTab, dock, isSettings, pathname, push],
  );

  const handleSort = useCallback(
    (el: HTMLButtonElement) => {
      setNavOrigin(el);
      lightHaptic();
      dock?.handlers?.onSort?.();
    },
    [dock?.handlers],
  );

  const handleAction = useCallback(
    (el: HTMLButtonElement) => {
      setNavOrigin(el);
      lightHaptic();
      dock?.handlers?.action?.onPress();
    },
    [dock?.handlers],
  );

  const handleAdd = useCallback(
    (el: HTMLButtonElement) => {
      setNavOrigin(el);
      lightHaptic();
      dock?.handlers?.onAdd?.();
    },
    [dock?.handlers],
  );

  if (!showDock) return null;

  if (formActionsVisible && formActions) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg">
        <div className="safe-area-pb pointer-events-auto px-4 pb-3">
          <nav
            className="font-ui shadow-token-md flex gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1"
            aria-label={tCommon("appName")}
          >
            <button
              type="button"
              disabled={formActions.saving}
              onClick={() => {
                lightHaptic();
                formActions.onCancel();
              }}
              className="pressable flex min-w-0 flex-1 items-center justify-center rounded-full px-3 py-2.5 text-sm font-medium text-[var(--foreground)] disabled:opacity-50"
            >
              {formActions.cancelLabel}
            </button>
            <button
              type="button"
              disabled={formActions.saving || formActions.saveDisabled}
              onClick={() => {
                lightHaptic();
                formActions.onSave();
              }}
              className="pressable flex min-w-0 flex-1 items-center justify-center rounded-full bg-[var(--primary)] px-3 py-2.5 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-50"
            >
              {formActions.saveLabel}
            </button>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg">
      <div className="safe-area-pb pointer-events-auto flex items-end gap-2.5 px-4 pb-3">
        <nav
          className="font-ui shadow-token-md flex h-[var(--dock-action-size)] min-w-0 flex-1 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-1"
          aria-label={tCommon("appName")}
        >
          <DockItem
            label={siblingLabel}
            disabled={isGuestRecipesDisabled && siblingLabel === tNav("recipes")}
            title={
              isGuestRecipesDisabled && siblingLabel === tNav("recipes")
                ? tNav("guestRecipesHint")
                : undefined
            }
            onPointerEnter={handleSiblingPrefetch}
            onClick={handleSibling}
          >
            {siblingIconKind === "lists" ? (
              <ListsIcon className="size-5" />
            ) : (
              <RecipesIcon className="size-5" />
            )}
          </DockItem>

          {sortVisible ? (
            <DockItem
              label={tNav("sort")}
              active={handlers?.sortActive}
              onClick={handleSort}
            >
              <SortIcon className="size-5" />
            </DockItem>
          ) : null}

          {actionVisible && actionSlot ? (
            <DockItem
              label={actionSlot.label}
              disabled={actionSlot.disabled}
              onClick={handleAction}
            >
              <ActionIcon className="size-5" />
            </DockItem>
          ) : null}

          <DockItem
            label={tCommon("settings")}
            active={isSettings}
            disabled={isSettings}
            onClick={handleSettings}
          >
            <PersonOutlineIcon className="size-5" />
          </DockItem>
        </nav>

        {addVisible ? (
          <button
            type="button"
            aria-label={tCommon("add")}
            onClick={(e) => handleAdd(e.currentTarget)}
            className="font-ui pressable shadow-token-md flex size-[var(--dock-action-size)] shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]"
          >
            <PlusIcon className="size-6" />
          </button>
        ) : (
          <div
            className="size-[var(--dock-action-size)] shrink-0"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
