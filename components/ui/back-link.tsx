"use client";

import { useAppNavigate } from "@/lib/nav/use-app-navigate";

type BackLinkProps = {
  href: string;
  label: string;
  className?: string;
};

export function BackLink({ href, label, className = "" }: BackLinkProps) {
  const { push } = useAppNavigate();

  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) =>
        push(href, {
          element: event.currentTarget,
          transitionType: "nav-down",
        })
      }
      className={[
        "font-ui pressable flex size-10 items-center justify-center rounded-full text-lg text-[var(--foreground)] hover:bg-[var(--muted)]/80",
        className,
      ].join(" ")}
    >
      ‹
    </button>
  );
}
