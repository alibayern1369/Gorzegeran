"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ListFilter, CalendarRange, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLAYER_SEEDS } from "@/lib/constants";
import {
  MATCH_TYPE_LABELS,
  MATCH_TYPES,
  MATCH_STATUS_LABELS,
} from "@/lib/engine/types";

export function ScheduleFilters({
  view,
  nights,
}: {
  view: "list" | "calendar";
  nights: Array<{ night: number; dateIso: string; dateLabel: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="clay-sm flex flex-wrap items-center gap-3 p-4">
      <span className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-muted)]">
        <ListFilter className="size-4" aria-hidden />
        فیلترها:
      </span>

      <Select
        value={searchParams.get("date") ?? "all"}
        onValueChange={(v) => setParam("date", v)}
      >
        <SelectTrigger className="h-10 w-40 rounded-xl" aria-label="فیلتر تاریخ">
          <SelectValue placeholder="تاریخ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">همه شب‌ها</SelectItem>
          {nights.map((n) => (
            <SelectItem key={n.night} value={n.dateIso}>
              شب {n.night} — {n.dateLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("player") ?? "all"}
        onValueChange={(v) => setParam("player", v)}
      >
        <SelectTrigger className="h-10 w-36 rounded-xl" aria-label="فیلتر بازیکن">
          <SelectValue placeholder="بازیکن" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">همه بازیکنان</SelectItem>
          {PLAYER_SEEDS.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("type") ?? "all"}
        onValueChange={(v) => setParam("type", v)}
      >
        <SelectTrigger className="h-10 w-36 rounded-xl" aria-label="فیلتر نوع مسابقه">
          <SelectValue placeholder="نوع مسابقه" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">همه انواع</SelectItem>
          {MATCH_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {MATCH_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(v) => setParam("status", v)}
      >
        <SelectTrigger className="h-10 w-36 rounded-xl" aria-label="فیلتر وضعیت">
          <SelectValue placeholder="وضعیت" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">همه وضعیت‌ها</SelectItem>
          {(Object.keys(MATCH_STATUS_LABELS) as Array<keyof typeof MATCH_STATUS_LABELS>).map(
            (s) => (
              <SelectItem key={s} value={s}>
                {MATCH_STATUS_LABELS[s]}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>

      <div className="ms-auto flex items-center gap-2">
        <Button
          variant={view === "list" ? "primary" : "outline"}
          size="sm"
          onClick={() => setParam("view", "list")}
          aria-pressed={view === "list"}
        >
          <List className="size-4" aria-hidden />
          نمایش فهرستی
        </Button>
        <Button
          variant={view === "calendar" ? "primary" : "outline"}
          size="sm"
          onClick={() => setParam("view", "calendar")}
          aria-pressed={view === "calendar"}
        >
          <CalendarRange className="size-4" aria-hidden />
          نمایش تقویمی
        </Button>
      </div>
    </div>
  );
}
