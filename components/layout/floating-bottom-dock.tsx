"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef } from "react";
import { useDockOptional } from "@/components/layout/dock-context";
import {
  AddToListIcon,
  BackIcon,
  ClearCheckedIcon,
  ListsIcon,
  PersonOutlineIcon,
  PlusIcon,
  RecipesIcon,
  SortIcon,
} from "@/components/ui/icons";
import { useAppNavigate } from "@/lib/nav/use-app-navigate";
import { lightHaptic, pressThenNavigate, setNavOrigin } from "@/lib/nav/transition";
import { prefetchListsHome, prefetchRecipesHome } from "@/lib/tabs/prefetch";

type DockItemProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: (el: HTMLButtonElement) => void | Promise<void>;
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
      aria-label={label}
      title={title}
      disabled={disabled}
      onPointerEnter={onPointerEnter}
      onClick={() => {
        if (!ref.current || disabled) return;
        void onClick(ref.current);
      }}
      className={[
        "font-ui pressable flex min-w-0 shrink flex-1 items-center justify-center rounded-full px-2 py-1.5",
        disabled ? "cursor-not-allowed opacity-40" : "text-[var(--muted-foreground)]",
        active ? "text-[var(--foreground)]" : "",
      ].join(" ")}
    >
      <span
        className={[
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          active ? "bg-[var(--muted)]" : "",
        ].join(" ")}
      >
        {children}
      </span>
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
  const isBackSibling =
    isSettings || isListDetail(pathname) || isRecipeDetail(pathname);
  const isGuestRecipesDisabled = Boolean(dock?.isGuest && pathname === "/home");

  const handlers = dock?.handlers;
  const formActions = handlers?.formActions;
  const formActionsVisible = formActions?.visible ?? false;
  const sortVisible = !formActionsVisible && (handlers?.sortVisible ?? isMainTabPath(pathname));
  const actionSlot = handlers?.action;
  const actionVisible = !formActionsVisible && (actionSlot?.visible ?? false);
  const addVisible = !formActionsVisible && (handlers?.addVisible ?? isMainTabPath(pathname));

  const siblingLabel = useMemo(() => {
    if (isBackSibling) return tCommon("back");
    return activeTab === "lists" ? tNav("recipes") : tNav("lists");
  }, [activeTab, isBackSibling, tCommon, tNav]);

  const siblingIconKind = useMemo((): "lists" | "recipes" => {
    return activeTab === "lists" ? "recipes" : "lists";
  }, [activeTab]);

  const ActionIcon =
    isRecipeDetail(pathname) || actionSlot?.label === tAddToList("addToList")
      ? AddToListIcon
      : ClearCheckedIcon;

  const handleSiblingPrefetch = useCallback(() => {
    if (isBackSibling) return;
    if (activeTab === "lists") prefetchRecipesHome();
    else prefetchListsHome();
  }, [activeTab, isBackSibling]);

  const handleSibling = useCallback(
    async (el: HTMLButtonElement) => {
      if (isListDetail(pathname)) {
        await pressThenNavigate(el, () => {
          push("/home", { element: el, transitionType: "nav-down" });
        });
        return;
      }
      if (isRecipeDetail(pathname)) {
        await pressThenNavigate(el, () => {
          push("/recipes", { element: el, transitionType: "nav-down" });
        });
        return;
      }
      if (isSettings) {
        const target = dock?.lastMainTab === "recipes" ? "/recipes" : "/home";
        await pressThenNavigate(el, () => {
          push(target, { element: el, transitionType: "nav-down" });
        });
        return;
      }

      lightHaptic();
      setNavOrigin(el);
      const nextTab = activeTab === "lists" ? "recipes" : "lists";
      dock?.setLastMainTab(nextTab);
      dock?.tabNavigation?.setActiveTab(nextTab);
    },
    [activeTab, dock, isSettings, pathname, push],
  );

  const handleSettings = useCallback(
    async (el: HTMLButtonElement) => {
      if (isSettings) return;
      if (isMainTabPath(pathname)) {
        dock?.setLastMainTab(activeTab);
      }
      await pressThenNavigate(el, () => {
        push("/settings", { element: el, transitionType: "nav-up" });
      });
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
            disabled={
              !isBackSibling &&
              isGuestRecipesDisabled &&
              siblingLabel === tNav("recipes")
            }
            title={
              !isBackSibling &&
              isGuestRecipesDisabled &&
              siblingLabel === tNav("recipes")
                ? tNav("guestRecipesHint")
                : undefined
            }
            onPointerEnter={handleSiblingPrefetch}
            onClick={handleSibling}
          >
            {isBackSibling ? (
              <BackIcon className="size-6" />
            ) : siblingIconKind === "lists" ? (
              <ListsIcon className="size-6" />
            ) : (
              <RecipesIcon className="size-6" />
            )}
          </DockItem>

          {sortVisible ? (
            <DockItem
              label={tNav("sort")}
              active={handlers?.sortActive}
              onClick={handleSort}
            >
              <SortIcon className="size-6" />
            </DockItem>
          ) : null}

          {actionVisible && actionSlot ? (
            <DockItem
              label={actionSlot.label}
              disabled={actionSlot.disabled}
              onClick={handleAction}
            >
              <ActionIcon className="size-6" />
            </DockItem>
          ) : null}

          <DockItem
            label={tCommon("settings")}
            active={isSettings}
            disabled={isSettings}
            onClick={handleSettings}
          >
            <PersonOutlineIcon className="size-6" />
          </DockItem>
        </nav>

        {addVisible ? (
          <button
            type="button"
            aria-label={tCommon("add")}
            data-dock-add
            onClick={(e) => handleAdd(e.currentTarget)}
            className="font-ui pressable shadow-token-md flex size-[var(--dock-action-size)] shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]"
          >
            <PlusIcon className="size-7" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
