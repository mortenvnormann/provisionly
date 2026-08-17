import { iconAssetUrl } from "@/lib/pwa/icon-url";

export function BootMark() {
  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col items-center justify-center bg-[var(--background)]"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={iconAssetUrl("/icons/icon-192.png")}
        alt=""
        width={96}
        height={96}
        className="boot-mark-pulse size-24 rounded-[1.35rem]"
      />
    </div>
  );
}
