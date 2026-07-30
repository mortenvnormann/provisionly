type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return (
    <div
      className={`animate-pulse rounded-[var(--radius-card)] bg-[var(--muted)] ${className}`}
      aria-hidden
    />
  );
}

export function HomePageSkeleton() {
  return (
    <div className="flex min-h-full flex-1 flex-col overflow-hidden">
      <div className="safe-area-pt border-b border-[var(--border)] px-4 py-3">
        <SkeletonBlock className="mb-2 h-3 w-24" />
        <SkeletonBlock className="h-6 w-40" />
      </div>
      <div className="flex flex-col gap-2.5 p-4">
        <SkeletonBlock className="h-10 w-full" />
        <div className="flex flex-col gap-2">
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export function ListDetailSkeleton() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="safe-area-pt border-b border-[var(--border)] px-4 py-3">
        <SkeletonBlock className="mb-3 h-6 w-48" />
        <SkeletonBlock className="h-11 w-full" />
      </div>
      <div className="flex flex-col gap-2 p-2 pt-3">
        <SkeletonBlock className="h-12 w-full" />
        <SkeletonBlock className="h-12 w-full" />
        <SkeletonBlock className="h-12 w-full" />
        <SkeletonBlock className="h-12 w-full" />
      </div>
    </div>
  );
}

export function RecipeDetailSkeleton() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <SkeletonBlock className="h-6 w-56" />
      </div>
      <div className="flex flex-col gap-4 p-4">
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-24 w-full" />
        <SkeletonBlock className="h-32 w-full" />
      </div>
    </div>
  );
}
