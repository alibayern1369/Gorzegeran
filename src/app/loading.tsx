import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

/** وضعیت بارگذاری مسیرها — جلوگیری از جابه‌جایی چیدمان */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <Skeleton className="h-64 w-full" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="mt-8">
        <TableSkeleton rows={5} />
      </div>
    </div>
  );
}
