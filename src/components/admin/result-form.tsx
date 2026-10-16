"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Check, Loader2, PencilLine, Trash2, AlertTriangle, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlayerAvatar } from "@/components/league/player-avatar";
import { PLAYER_BY_ID, type PlayerSeed } from "@/lib/constants";
import {
  submitResultAction,
  editResultAction,
  deleteResultAction,
  type ActionState,
} from "@/lib/actions/admin";
import { toPersianDigits } from "@/lib/jalali";
import type { MatchType, MatchStatus } from "@/lib/engine/types";
import { MATCH_TYPE_LABELS } from "@/lib/engine/types";

interface MatchLike {
  id: number;
  playerAId: number;
  playerBId: number;
  matchType: MatchType;
  status: MatchStatus;
  towersA: number | null;
  towersB: number | null;
  winnerId: number | null;
  scheduledAt: string;
}

const SCORE_OPTIONS = [0, 1, 2, 3];

/** پیش‌نمایش زندهٔ نتیجه: برنده، امتیاز، تغییر تفاضل */
type ScorePreview =
  | { valid: false; error: string }
  | {
      valid: true;
      winnerIsA: boolean;
      diffA: number;
      diffB: number;
    };

function useScorePreview(
  towersA: number | null,
  towersB: number | null,
): ScorePreview | null {
  return useMemo(() => {
    if (towersA === null || towersB === null) return null;
    if (!Number.isInteger(towersA) || !Number.isInteger(towersB)) {
      return { valid: false, error: "امتیاز برج باید عدد صحیح باشد." };
    }
    if (towersA < 0 || towersB < 0 || towersA > 3 || towersB > 3) {
      return { valid: false, error: "امتیاز برج باید بین ۰ تا ۳ باشد." };
    }
    if (towersA === towersB) {
      return {
        valid: false,
        error: "نتیجهٔ مساوی پذیرفته نمی‌شود؛ هر مسابقه یک برنده دارد.",
      };
    }
    if ((towersA === 3 && towersB > 0) || (towersB === 3 && towersA > 0)) {
      return {
        valid: false,
        error: "پیروزی سه‌تاجی فقط با صفر بودن تاج حریف معتبر است.",
      };
    }
    return {
      valid: true,
      winnerIsA: towersA > towersB,
      diffA: towersA - towersB,
      diffB: towersB - towersA,
    };
  }, [towersA, towersB]);
}

function ScorePicker({
  label,
  value,
  onChange,
  accent,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  accent: string;
}) {
  return (
    <div>
      <p className="mb-2 text-center text-xs font-bold text-[var(--text-muted)]">{label}</p>
      <div className="flex justify-center gap-2" role="radiogroup" aria-label={label}>
        {SCORE_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onClick={() => onChange(n)}
            className={`clay-btn flex size-12 items-center justify-center rounded-2xl text-lg font-black transition-all ${
              value === n
                ? "text-white"
                : "text-[var(--text-muted)]"
            }`}
            style={
              value === n
                ? {
                    background: `linear-gradient(180deg, ${accent}, ${accent}cc)`,
                    borderColor: `${accent}66`,
                    boxShadow: `0 8px 20px ${accent}44`,
                  }
                : undefined
            }
          >
            <span className="num">{toPersianDigits(n)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ResultForm({
  match,
  mode = "record",
  compact = false,
}: {
  match: MatchLike;
  mode?: "record" | "edit";
  compact?: boolean;
}) {
  const action = mode === "record" ? submitResultAction : editResultAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const [towersA, setTowersA] = useState<number | null>(
    mode === "edit" ? match.towersA : null,
  );
  const [towersB, setTowersB] = useState<number | null>(
    mode === "edit" ? match.towersB : null,
  );
  const [open, setOpen] = useState(false);

  const preview = useScorePreview(towersA, towersB);
  const a = PLAYER_BY_ID.get(match.playerAId) as PlayerSeed;
  const b = PLAYER_BY_ID.get(match.playerBId) as PlayerSeed;

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message);
      if (mode === "edit") setOpen(false);
      setTowersA(mode === "record" ? null : towersA);
      setTowersB(mode === "record" ? null : towersB);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, mode, towersA, towersB]);

  const form = (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="matchId" value={match.id} />
      <input type="hidden" name="towersA" value={towersA ?? ""} />
      <input type="hidden" name="towersB" value={towersB ?? ""} />

      {/* بازیکنان */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2.5">
          <PlayerAvatar player={a} size={44} />
          <div>
            <p className="text-sm font-extrabold">{a.name}</p>
            <p className="text-[10px] text-[var(--text-faint)]">بازیکن اول</p>
          </div>
        </div>
        <span className="text-lg font-black text-[var(--text-faint)]">VS</span>
        <div className="flex flex-1 flex-row-reverse items-center gap-2.5 text-end">
          <PlayerAvatar player={b} size={44} />
          <div>
            <p className="text-sm font-extrabold">{b.name}</p>
            <p className="text-[10px] text-[var(--text-faint)]">بازیکن دوم</p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-[var(--text-faint)]">
        {MATCH_TYPE_LABELS[match.matchType]} — مسابقهٔ شمارهٔ {toPersianDigits(match.id)}
      </p>

      <ScorePicker
        label={`تاج‌های ${a.name}`}
        value={towersA}
        onChange={setTowersA}
        accent={a.accent}
      />
      <ScorePicker
        label={`تاج‌های ${b.name}`}
        value={towersB}
        onChange={setTowersB}
        accent={b.accent}
      />

      {/* پیش‌نمایش */}
      {preview && !preview.valid && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-defeat/30 bg-defeat/10 px-4 py-2.5 text-xs font-bold text-defeat"
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          {preview.error}
        </p>
      )}

      {preview?.valid && (
        <div className="clay-sm space-y-2 border-victory/30 p-4">
          <p className="flex items-center gap-2 text-sm font-extrabold">
            <Trophy className="size-4 text-gold" aria-hidden />
            برنده:{" "}
            <span className="text-gradient-gold">
              {preview.winnerIsA ? a.name : b.name}
            </span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
            <div className="rounded-lg bg-[var(--surface-2)] px-2.5 py-1.5">
              امتیاز لیگ: <strong className="text-victory">۲</strong> برای برنده،{" "}
              <strong className="text-defeat">۰</strong> برای بازنده
            </div>
            <div className="rounded-lg bg-[var(--surface-2)] px-2.5 py-1.5">
              تفاضل برج:{" "}
              <strong>
                {a.name} {preview.diffA > 0 ? "+" : ""}
                {toPersianDigits(preview.diffA)}
              </strong>{" "}
              ·{" "}
              <strong>
                {b.name} {preview.diffB > 0 ? "+" : ""}
                {toPersianDigits(preview.diffB)}
              </strong>
            </div>
          </div>
        </div>
      )}

      <Button
        type="submit"
        variant={mode === "record" ? "success" : "primary"}
        size="lg"
        className="w-full"
        disabled={pending || !preview?.valid}
      >
        {pending ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <Check className="size-5" aria-hidden />
        )}
        {mode === "record" ? "ثبت نتیجه" : "ذخیرهٔ ویرایش"}
      </Button>
    </form>
  );

  if (compact) return form;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === "record" ? "success" : "outline"} size="sm">
          {mode === "record" ? (
            <>
              <Check className="size-4" aria-hidden />
              ثبت نتیجه
            </>
          ) : (
            <>
              <PencilLine className="size-4" aria-hidden />
              ویرایش
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "record" ? "ثبت نتیجهٔ مسابقه" : "ویرایش نتیجه"}
          </DialogTitle>
          <DialogDescription>
            {mode === "record"
              ? "امتیازهای برج را انتخاب کنید؛ سامانه برنده و امتیازها را خودکار محاسبه می‌کند."
              : "تغییر نتیجه با بازمحاسبهٔ کامل آمار همراه است."}
          </DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}

export function DeleteResultButton({ matchId }: { matchId: number }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    deleteResultAction,
    {},
  );

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="matchId" value={matchId} />
      <Button
        type="submit"
        variant="danger"
        size="sm"
        disabled={pending}
        aria-label="حذف نتیجه"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Trash2 className="size-4" aria-hidden />
        )}
        حذف نتیجه
      </Button>
    </form>
  );
}
