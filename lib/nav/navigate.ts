"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { setNavOrigin } from "@/lib/nav/transition";

const TAB_SHELL_PATHS = new Set(["/home", "/recipes"]);

export type NavTransitionType = "nav-up" | "nav-down" | "page-expand";

export function isTabShellPath(pathname: string) {
  return TAB_SHELL_PATHS.has(pathname);
}

function pathOnly(href: string) {
  return href.split("?")[0] ?? href;
}

/**
 * Soft navigate, recording the tapped element as the expand origin so the
 * destination route can play a clip-path expand from that point on mount.
 */
export function navigateWithTransition(
  router: AppRouterInstance,
  element: HTMLElement | null,
  href: string,
  _transitionType: NavTransitionType,
  method: "push" | "replace" = "push",
) {
  if (element) {
    setNavOrigin(element);
  }

  const startPath = window.location.pathname;
  const targetPath = pathOnly(href);

  if (startPath === targetPath) return;

  if (method === "replace") {
    router.replace(href);
  } else {
    router.push(href);
  }
}
