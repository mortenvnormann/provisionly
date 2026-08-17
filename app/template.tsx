"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { hasWarmDetailForPath } from "@/lib/nav/detail-prefetch-ready";
import { restoreNavOrigin } from "@/lib/nav/transition";

function hasStoredNavOrigin() {
  try {
    const raw = sessionStorage.getItem("provisionly-nav-origin");
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { x?: string; y?: string };
    return Boolean(parsed.x && parsed.y);
  } catch {
    return false;
  }
}

let hasMountedTemplate = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    restoreNavOrigin();

    const root = document.documentElement;
    const vxRaw =
      root.style.getPropertyValue("--nav-origin-x").trim() ||
      getComputedStyle(root).getPropertyValue("--nav-origin-x").trim();
    const vyRaw =
      root.style.getPropertyValue("--nav-origin-y").trim() ||
      getComputedStyle(root).getPropertyValue("--nav-origin-y").trim();

    const elRect = el.getBoundingClientRect();
    let localX = 0;
    let localY = 0;

    if (vxRaw.endsWith("px") && vyRaw.endsWith("px")) {
      localX = parseFloat(vxRaw) - elRect.left;
      localY = parseFloat(vyRaw) - elRect.top;
      el.style.setProperty("--nav-origin-x", `${localX}px`);
      el.style.setProperty("--nav-origin-y", `${localY}px`);
    }

    const coverRadius =
      Math.max(
        Math.hypot(localX, localY),
        Math.hypot(elRect.width - localX, localY),
        Math.hypot(localX, elRect.height - localY),
        Math.hypot(elRect.width - localX, elRect.height - localY),
      ) + 8;

    el.style.setProperty("--nav-expand-radius", `${coverRadius}px`);

    const isColdStart = !hasMountedTemplate;
    hasMountedTemplate = true;
    const skipAnimation =
      isColdStart ||
      hasWarmDetailForPath(pathname) ||
      !hasStoredNavOrigin();

    el.classList.remove("route-expand");
    void el.offsetWidth;
    if (!skipAnimation) {
      el.classList.add("route-expand");
    }

    return () => {
      el.classList.remove("route-expand");
    };
  }, [pathname]);

  return (
    <div
      ref={ref}
      key={pathname}
      className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-[var(--background)]"
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
