import Link from "next/link";
import type { ComponentProps } from "react";

type BackLinkProps = Omit<ComponentProps<typeof Link>, "className" | "children"> & {
  label: string;
  className?: string;
};

export function BackLink({ label, className = "", ...props }: BackLinkProps) {
  return (
    <Link
      {...props}
      aria-label={label}
      className={[
        "flex size-10 items-center justify-center rounded-lg text-lg text-[var(--foreground)] hover:bg-[var(--muted)]",
        className,
      ].join(" ")}
    >
      ‹
    </Link>
  );
}
