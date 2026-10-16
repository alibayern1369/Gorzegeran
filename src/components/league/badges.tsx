import { matchTypeLabel } from "@/lib/engine/types";
import {
  Clock,
  Radio,
  CheckCircle2,
  CalendarClock,
  XCircle,
  Crown,
  Medal,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  MATCH_STATUS_LABELS,
  MATCH_TYPE_LABELS,
  type MatchStatus,
  type MatchType,
} from "@/lib/engine/types";

const STATUS_CONFIG: Record<
  MatchStatus,
  {
    variant: "default" | "victory" | "defeat" | "live" | "muted" | "elixir";
    icon: React.ReactNode;
  }
> = {
  scheduled: {
    variant: "default",
    icon: <Clock className="size-3.5" aria-hidden />,
  },
  live: {
    variant: "live",
    icon: <Radio className="size-3.5" aria-hidden />,
  },
  completed: {
    variant: "victory",
    icon: <CheckCircle2 className="size-3.5" aria-hidden />,
  },
  postponed: {
    variant: "elixir",
    icon: <CalendarClock className="size-3.5" aria-hidden />,
  },
  cancelled: {
    variant: "muted",
    icon: <XCircle className="size-3.5" aria-hidden />,
  },
};

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant}>
      {config.icon}
      {MATCH_STATUS_LABELS[status]}
    </Badge>
  );
}

export function MatchTypeBadge({
  type,
  className,
}: {
  type: MatchType;
  className?: string;
}) {
  return (
    <Badge
      variant="royal"
      className={`max-w-full whitespace-normal break-words text-start ${className ?? ""}`}
    >
      {matchTypeLabel(type)}
    </Badge>
  );
}

export function RankBadge({
  rank,
  size = "md",
}: {
  rank: number;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "size-7 text-xs" : "size-9 text-sm";
  if (rank === 1) {
    return (
      <span
        className={`clay-sm inline-flex ${dim} items-center justify-center rounded-full bg-[linear-gradient(180deg,#fcd34d,#f5b942)] font-extrabold text-[#3d2c05] shadow-[0_6px_16px_rgba(245,185,66,0.45)]`}
        aria-label="رتبه یک"
      >
        <Crown className="size-4" aria-hidden />
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span
        className={`clay-sm inline-flex ${dim} items-center justify-center rounded-full bg-[linear-gradient(180deg,#e2e8f0,#94a3b8)] font-extrabold text-[#1e293b]`}
        aria-label="رتبه دو"
      >
        <Medal className="size-4" aria-hidden />
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span
        className={`clay-sm inline-flex ${dim} items-center justify-center rounded-full bg-[linear-gradient(180deg,#f0b27a,#c2703d)] font-extrabold text-[#3b1f0b]`}
        aria-label="رتبه سه"
      >
        <Award className="size-4" aria-hidden />
      </span>
    );
  }
  return (
    <span
      className={`clay-sm inline-flex ${dim} items-center justify-center rounded-full bg-[var(--surface-2)] font-extrabold text-[var(--text-muted)] num`}
      aria-label={`رتبه ${rank}`}
    >
      {rank}
    </span>
  );
}
