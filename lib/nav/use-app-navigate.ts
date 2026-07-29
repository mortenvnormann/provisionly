"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import {
  navigateWithTransition,
  type NavTransitionType,
} from "@/lib/nav/navigate";

export function useAppNavigate() {
  const router = useRouter();

  const push = useCallback(
    (
      href: string,
      options?: {
        element?: HTMLElement | null;
        transitionType?: NavTransitionType;
      },
    ) => {
      navigateWithTransition(
        router,
        options?.element ?? null,
        href,
        options?.transitionType ?? "nav-up",
        "push",
      );
    },
    [router],
  );

  const replace = useCallback(
    (
      href: string,
      options?: {
        element?: HTMLElement | null;
        transitionType?: NavTransitionType;
      },
    ) => {
      navigateWithTransition(
        router,
        options?.element ?? null,
        href,
        options?.transitionType ?? "page-expand",
        "replace",
      );
    },
    [router],
  );

  return { push, replace, router };
}
