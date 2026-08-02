"use client";

import { BackIcon } from "@/components/ui/icons";
import { useAppNavigate } from "@/lib/nav/use-app-navigate";
import { pressThenNavigate } from "@/lib/nav/transition";

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
      onClick={(event) => {
        const el = event.currentTarget;
        void pressThenNavigate(el, () => {
          push(href, {
            element: el,
            transitionType: "nav-down",
          });
        });
      }}
      className={[
        "font-ui pressable flex size-10 items-center justify-center rounded-full text-[var(--foreground)] hover:bg-[var(--muted)]/80",
        className,
      ].join(" ")}
    >
      <BackIcon className="size-6" />
    </button>
  );
}
