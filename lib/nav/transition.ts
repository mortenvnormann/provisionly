export function setNavOrigin(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const xPx = `${x}px`;
  const yPx = `${y}px`;
  document.documentElement.style.setProperty("--nav-origin-x", xPx);
  document.documentElement.style.setProperty("--nav-origin-y", yPx);
  try {
    sessionStorage.setItem("provisionly-nav-origin", JSON.stringify({ x: xPx, y: yPx }));
  } catch {
    // ignore quota / private mode
  }
}

/** Restore clip-path origin after navigations (soft or hard). */
export function restoreNavOrigin() {
  try {
    const raw = sessionStorage.getItem("provisionly-nav-origin");
    if (!raw) return;
    const { x, y } = JSON.parse(raw) as { x?: string; y?: string };
    if (x) document.documentElement.style.setProperty("--nav-origin-x", x);
    if (y) document.documentElement.style.setProperty("--nav-origin-y", y);
  } catch {
    // ignore
  }
}

export function lightHaptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(8);
  }
}

const PRESS_FEEDBACK_MS = 95;

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Show press styling + haptic briefly before running a navigation callback,
 * so feedback is visible before the route unmounts.
 */
export async function pressThenNavigate(
  element: HTMLElement,
  navigate: () => void,
): Promise<void> {
  lightHaptic();
  setNavOrigin(element);
  element.dataset.pressed = "true";

  if (!prefersReducedMotion()) {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, PRESS_FEEDBACK_MS);
    });
  }

  try {
    navigate();
  } finally {
    delete element.dataset.pressed;
  }
}
