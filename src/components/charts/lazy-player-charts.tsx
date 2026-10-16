"use client";

/**
 * بارگذاری تنبل نمودارها (کد اسپلیتینگ) — فقط در کلاینت
 */
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const LazyPlayerCharts = dynamic(
  () => import("./player-charts").then((m) => m.PlayerChartsPanel),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[260px]" />
        <Skeleton className="h-[260px]" />
        <Skeleton className="h-[260px]" />
        <Skeleton className="h-[260px]" />
      </div>
    ),
  },
);
