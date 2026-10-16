"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Ban, RotateCcw, CalendarClock, Radio } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  changeMatchStatusAction,
  type ActionState,
} from "@/lib/actions/admin";
import type { MatchStatus } from "@/lib/engine/types";

const OPTIONS: Array<{ value: MatchStatus; label: string }> = [
  { value: "scheduled", label: "زمان‌بندی‌شده" },
  { value: "live", label: "در حال برگزاری" },
  { value: "postponed", label: "به تعویق افتاده" },
  { value: "cancelled", label: "لغو شده" },
];

export function StatusForm({
  matchId,
  status,
}: {
  matchId: number;
  status: MatchStatus;
}) {
  const [selected, setSelected] = useState<MatchStatus>(status);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    changeMatchStatusAction,
    {},
  );

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="status" value={selected} />
      <Select value={selected} onValueChange={(v) => setSelected(v as MatchStatus)}>
        <SelectTrigger className="h-9 w-36 rounded-xl text-xs" aria-label="تغییر وضعیت مسابقه">
          <SelectValue placeholder="وضعیت" />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending || selected === status}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : selected === "cancelled" ? (
          <Ban className="size-4" aria-hidden />
        ) : selected === "postponed" ? (
          <CalendarClock className="size-4" aria-hidden />
        ) : selected === "live" ? (
          <Radio className="size-4" aria-hidden />
        ) : (
          <RotateCcw className="size-4" aria-hidden />
        )}
        اعمال
      </Button>
    </form>
  );
}
