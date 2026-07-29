"use client";

import { useEffect } from "react";
import { restoreNavOrigin } from "@/lib/nav/transition";

/**
 * Restores the persisted expand origin on initial load / refresh so the
 * route mount animation clips from the last tapped point rather than the
 * default center-bottom. Soft navigations keep the live CSS vars already.
 */
export function NavOriginRestore() {
  useEffect(() => {
    restoreNavOrigin();
  }, []);

  return null;
}
