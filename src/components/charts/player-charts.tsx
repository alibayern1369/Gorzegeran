"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { toPersianDigits, formatJalaliDate } from "@/lib/jalali";
import { MATCH_TYPE_LABELS, type MatchType } from "@/lib/engine/types";

export interface TimelinePoint {
  at: string;
  cumulativePoints: number;
  cumulativeTowers: number;
  opponentName: string;
  won: boolean;
}

export interface MatchTypeStat {
  type: MatchType;
  won: number;
  lost: number;
}

const GOLD = "#F5B942";
const BLUE = "#2563EB";
const PURPLE = "#8B5CF6";
const GREEN = "#22C55E";
const RED = "#EF4444";

function faTick(value: number | string): string {
  return toPersianDigits(Number(value));
}

export function PointsTimelineChart({ data }: { data: TimelinePoint[] }) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="at"
          tickFormatter={(v: string) => formatJalaliDate(v).split(" ").slice(0, 2).join(" ")}
          stroke="var(--text-faint)"
          tick={{ fontSize: 10 }}
        />
        <YAxis tickFormatter={faTick} stroke="var(--text-faint)" tick={{ fontSize: 10 }} width={28} />
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "1rem",
            direction: "rtl",
            fontFamily: "var(--font-vazirmatn), Tahoma",
            color: "var(--text)",
          }}
          formatter={(value, name) => [toPersianDigits(Number(value)), String(name)]}
          labelFormatter={(label) => formatJalaliDate(String(label))}
        />
        <Line
          type="monotone"
          dataKey="cumulativePoints"
          name="امتیاز تجمعی"
          stroke={GOLD}
          strokeWidth={3}
          dot={{ r: 4, fill: GOLD }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TowersTimelineChart({ data }: { data: TimelinePoint[] }) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="at"
          tickFormatter={(v: string) => formatJalaliDate(v).split(" ").slice(0, 2).join(" ")}
          stroke="var(--text-faint)"
          tick={{ fontSize: 10 }}
        />
        <YAxis tickFormatter={faTick} stroke="var(--text-faint)" tick={{ fontSize: 10 }} width={28} />
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "1rem",
            direction: "rtl",
            fontFamily: "var(--font-vazirmatn), Tahoma",
            color: "var(--text)",
          }}
          formatter={(value, name) => [toPersianDigits(Number(value)), String(name)]}
          labelFormatter={(label) => formatJalaliDate(String(label))}
        />
        <Line
          type="monotone"
          dataKey="cumulativeTowers"
          name="برج‌های تخریب‌شده"
          stroke={PURPLE}
          strokeWidth={3}
          dot={{ r: 4, fill: PURPLE }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function WinLossChart({ won, lost }: { won: number; lost: number }) {
  if (won + lost === 0) return <EmptyChart />;
  const data = [
    { name: "برد", value: won, color: GREEN },
    { name: "باخت", value: lost, color: RED },
  ];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={82}
          paddingAngle={4}
          label={(entry: { name?: string | number; value?: string | number }) => `${String(entry.name)} ${toPersianDigits(Number(entry.value))}`}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "1rem",
            direction: "rtl",
            fontFamily: "var(--font-vazirmatn), Tahoma",
            color: "var(--text)",
          }}
          formatter={(value, name) => [toPersianDigits(Number(value)), String(name)]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MatchTypeChart({ data }: { data: MatchTypeStat[] }) {
  const chartData = data.map((d) => ({
    name: MATCH_TYPE_LABELS[d.type],
    برد: d.won,
    باخت: d.lost,
  }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" stroke="var(--text-faint)" tick={{ fontSize: 10 }} />
        <YAxis tickFormatter={faTick} stroke="var(--text-faint)" tick={{ fontSize: 10 }} width={28} />
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "1rem",
            direction: "rtl",
            fontFamily: "var(--font-vazirmatn), Tahoma",
            color: "var(--text)",
          }}
          formatter={(value, name) => [toPersianDigits(Number(value)), String(name)]}
        />
        <Legend
          formatter={(value: string) => (
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{value}</span>
          )}
        />
        <Bar dataKey="برد" fill={BLUE} radius={[8, 8, 0, 0]} />
        <Bar dataKey="باخت" fill={PURPLE} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-[var(--text-faint)]">
      هنوز داده‌ای برای نمایش وجود ندارد.
    </div>
  );
}

/** پنل کامل نمودارهای پروفایل بازیکن */
export function PlayerChartsPanel({
  timeline,
  won,
  lost,
  byType,
}: {
  timeline: TimelinePoint[];
  won: number;
  lost: number;
  byType: MatchTypeStat[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="clay-sm p-4">
        <h3 className="mb-3 text-sm font-extrabold text-[var(--text-muted)]">
          روند امتیاز تجمعی
        </h3>
        <PointsTimelineChart data={timeline} />
      </div>
      <div className="clay-sm p-4">
        <h3 className="mb-3 text-sm font-extrabold text-[var(--text-muted)]">
          روند برج‌های تخریب‌شده
        </h3>
        <TowersTimelineChart data={timeline} />
      </div>
      <div className="clay-sm p-4">
        <h3 className="mb-3 text-sm font-extrabold text-[var(--text-muted)]">
          توزیع برد و باخت
        </h3>
        <WinLossChart won={won} lost={lost} />
      </div>
      <div className="clay-sm p-4">
        <h3 className="mb-3 text-sm font-extrabold text-[var(--text-muted)]">
          عملکرد به تفکیک نوع مسابقه
        </h3>
        <MatchTypeChart data={byType} />
      </div>
    </div>
  );
}
