import { LoadingSkeleton, Skeleton } from "@/components/ui";

export default function RaceDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-3 pb-4 lg:px-6 lg:pt-5" aria-busy="true" aria-label="レース情報を読み込み中">
      <Skeleton className="h-5 w-48" />
      <div className="edge-silver brushed mt-3 rounded-[var(--radius-card-lg)] border border-line p-3.5 sm:p-5 lg:p-6">
        <div className="flex gap-3.5 sm:gap-5">
          <Skeleton className="h-[80px] w-[74px] rounded-[12px] sm:h-[96px] sm:w-[88px] lg:h-[104px] lg:w-[96px]" />
          <div className="flex-1 space-y-2.5 pt-1">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-6 w-3/5" />
            <Skeleton className="h-3.5 w-2/5" />
          </div>
        </div>
        <Skeleton className="mt-4 h-8 w-full" />
      </div>
      <div className="mt-5 grid gap-5 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <Skeleton className="mb-3 h-10 w-56" />
          <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
            <Skeleton className="col-span-2 h-[140px] rounded-[var(--radius-card)] sm:col-span-1 sm:h-[240px]" />
            <Skeleton className="h-[180px] rounded-[var(--radius-card)] sm:h-[240px]" />
            <Skeleton className="h-[180px] rounded-[var(--radius-card)] sm:h-[240px]" />
          </div>
          <LoadingSkeleton rows={8} />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-[var(--radius-card)]" />
          <Skeleton className="h-72 w-full rounded-[var(--radius-card-lg)]" />
        </div>
      </div>
    </div>
  );
}
