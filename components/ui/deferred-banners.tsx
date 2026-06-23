"use client";

import dynamic from "next/dynamic";

const OfflineBanner = dynamic(
  () =>
    import("@/components/ui/offline-banner").then((m) => ({
      default: m.OfflineBanner,
    })),
  { ssr: false },
);

const InstallBanner = dynamic(
  () =>
    import("@/components/pwa/install-banner").then((m) => ({
      default: m.InstallBanner,
    })),
  { ssr: false },
);

export function DeferredBanners() {
  return (
    <>
      <OfflineBanner />
      <InstallBanner />
    </>
  );
}
