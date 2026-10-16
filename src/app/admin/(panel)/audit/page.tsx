import { History, ShieldCheck, PencilLine, CheckCircle2, XCircle, LogIn, LogOut, Ban } from "lucide-react";
import { requireAdminPage } from "@/lib/auth/guard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRecentAuditLogs, getDbUsersSafe } from "@/lib/queries-admin";
import { formatJalaliDateTime, toPersianDigits } from "@/lib/jalali";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; variant: "victory" | "defeat" | "royal" | "elixir" | "gold" | "muted" }> = {
  result_recorded: {
    label: "ثبت نتیجه",
    icon: <CheckCircle2 className="size-3.5" />,
    variant: "victory",
  },
  result_updated: {
    label: "ویرایش نتیجه",
    icon: <PencilLine className="size-3.5" />,
    variant: "royal",
  },
  result_cleared: {
    label: "حذف نتیجه",
    icon: <XCircle className="size-3.5" />,
    variant: "defeat",
  },
  match_status_changed: {
    label: "تغییر وضعیت مسابقه",
    icon: <Ban className="size-3.5" />,
    variant: "elixir",
  },
  player_updated: {
    label: "ویرایش بازیکن",
    icon: <PencilLine className="size-3.5" />,
    variant: "royal",
  },
  tournament_updated: {
    label: "ویرایش تورنمنت",
    icon: <PencilLine className="size-3.5" />,
    variant: "royal",
  },
  login_success: {
    label: "ورود موفق",
    icon: <LogIn className="size-3.5" />,
    variant: "muted",
  },
  login_failed: {
    label: "تلاش ناموفق ورود",
    icon: <LogOut className="size-3.5" />,
    variant: "defeat",
  },
};

export default async function AdminAuditPage() {
  await requireAdminPage();
  const logs = await getRecentAuditLogs(100);
  const users = await getDbUsersSafe();

  return (
    <div>
      <div className="mb-5">
        <h1 className="flex items-center gap-2.5 text-2xl font-black">
          <History className="size-6 text-elixir-light" aria-hidden />
          تاریخچه تغییرات
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          گزارش کامل ثبت‌ها، ویرایش‌ها و تغییرات مدیر — فقط برای مدیر قابل مشاهده است.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {logs.map((log) => {
          const config = ACTION_LABELS[log.action] ?? {
            label: log.action,
            icon: <ShieldCheck className="size-3.5" />,
            variant: "muted" as const,
          };
          const user = users.find((u) => u.id === log.userId);
          return (
            <Card key={log.id} className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={config.variant}>
                  {config.icon}
                  {config.label}
                </Badge>
                <span className="num text-xs text-[var(--text-faint)]">
                  {log.entityType} #{toPersianDigits(log.entityId ?? 0)}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  <ShieldCheck className="inline size-3" aria-hidden />{" "}
                  {user?.displayName ?? "سیستم"}
                </span>
                <span className="num ms-auto text-[11px] text-[var(--text-faint)]">
                  {formatJalaliDateTime(log.createdAt)}
                </span>
              </div>
              {(Boolean(log.previousValue) || Boolean(log.newValue)) && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {Boolean(log.previousValue) && (
                    <div className="rounded-xl border border-defeat/20 bg-defeat/5 p-2.5">
                      <p className="text-[10px] text-defeat">مقدار قبلی</p>
                      <pre
                        dir="ltr"
                        className="mt-1 overflow-x-auto text-[10px] text-[var(--text-muted)]"
                      >
                        {String(JSON.stringify(log.previousValue ?? null, null, 1))}
                      </pre>
                    </div>
                  )}
                  {Boolean(log.newValue) && (
                    <div className="rounded-xl border border-victory/20 bg-victory/5 p-2.5">
                      <p className="text-[10px] text-victory">مقدار جدید</p>
                      <pre
                        dir="ltr"
                        className="mt-1 overflow-x-auto text-[10px] text-[var(--text-muted)]"
                      >
                        {String(JSON.stringify(log.newValue ?? null, null, 1))}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              {log.note && (
                <p className="mt-2 text-xs text-[var(--text-faint)]">یادداشت: {log.note}</p>
              )}
            </Card>
          );
        })}
        {logs.length === 0 && (
          <Card className="p-10 text-center text-sm text-[var(--text-faint)]">
            هنوز تغییری ثبت نشده است.
          </Card>
        )}
      </div>
    </div>
  );
}
