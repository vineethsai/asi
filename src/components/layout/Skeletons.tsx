import { cn } from "@/lib/utils";

/** One shimmer block. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

/** Card-shaped placeholder. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-5", className)} aria-hidden="true">
      <SkeletonBlock className="mb-3 h-5 w-2/3" />
      <SkeletonBlock className="mb-2 h-3.5 w-full" />
      <SkeletonBlock className="mb-2 h-3.5 w-11/12" />
      <SkeletonBlock className="h-3.5 w-3/5" />
    </div>
  );
}

/**
 * Route-chunk fallback shaped like a page (PageHeader bar + three cards), so the layout does
 * not jump when the page arrives. The Header stays mounted above it (AppShell).
 */
export function PageSkeleton() {
  return (
    <div
      className="container max-w-7xl px-4 py-8 md:px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading page…</span>
      <SkeletonBlock className="mb-3 h-3 w-24" />
      <SkeletonBlock className="mb-3 h-8 w-72 max-w-full" />
      <SkeletonBlock className="mb-6 h-4 w-[32rem] max-w-full" />
      <div className="mb-8 flex flex-wrap gap-2">
        <SkeletonBlock className="h-7 w-28 rounded-full" />
        <SkeletonBlock className="h-7 w-32 rounded-full" />
        <SkeletonBlock className="h-7 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

/** Fallback for full-screen routes (Threat Modeler). */
export function FullscreenSkeleton() {
  return (
    <div className="flex h-screen w-screen flex-col" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="flex h-10 shrink-0 items-center gap-3 border-b px-4">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-3 w-48" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-60 shrink-0 space-y-2 border-r p-3 md:block">
          {Array.from({ length: 8 }, (_, i) => (
            <SkeletonBlock key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="flex-1 bg-muted/20" />
      </div>
    </div>
  );
}

export default PageSkeleton;
