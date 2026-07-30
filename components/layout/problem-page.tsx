"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type ProblemPageProps = {
  appName: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref?: string;
  onPrimaryClick?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
  onSecondaryClick?: () => void;
};

export function ProblemPage({
  appName,
  title,
  description,
  primaryLabel,
  primaryHref,
  onPrimaryClick,
  secondaryLabel,
  secondaryHref,
  onSecondaryClick,
}: ProblemPageProps) {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
      <p className="font-ui text-[11px] font-medium tracking-[0.12em] text-[var(--brand)] uppercase">
        {appName}
      </p>
      <h1 className="heading-editorial text-2xl text-[var(--foreground)]">{title}</h1>
      <p className="font-ui max-w-sm text-sm text-[var(--muted-foreground)]">
        {description}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        {onPrimaryClick ? (
          <Button onClick={onPrimaryClick}>{primaryLabel}</Button>
        ) : primaryHref ? (
          <Link href={primaryHref}>
            <Button>{primaryLabel}</Button>
          </Link>
        ) : null}
        {secondaryLabel && onSecondaryClick ? (
          <Button variant="secondary" onClick={onSecondaryClick}>
            {secondaryLabel}
          </Button>
        ) : secondaryLabel && secondaryHref ? (
          <Link href={secondaryHref}>
            <Button variant="secondary">{secondaryLabel}</Button>
          </Link>
        ) : null}
      </div>
    </main>
  );
}
