import { requireAdminPage } from "@/lib/auth/guard";
import { loadLeagueData } from "@/lib/queries";
import { getBranding } from "@/lib/branding";
import { Card } from "@/components/ui/card";
import {
  BrandingForm,
  LeagueSettingsForm,
} from "@/components/admin/settings-forms";
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  await requireAdminPage();
  const [data, branding] = await Promise.all([loadLeagueData(), getBranding()]);
  const settings = data.settings;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">تنظیمات لیگ و نرم‌افزار</h1>
        <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
          شروع رسمی مسابقات، مدل بازی‌ها و ظاهر برنامه را مدیریت کنید.
        </p>
      </div>
      <Card className="p-4 sm:p-6">
        <h2 className="mb-5 text-lg font-extrabold">برنامه و ساختار مسابقات</h2>
        <LeagueSettingsForm
          config={{
            startDate: data.tournament.startDate,
            nightIntervalDays: data.tournament.nightIntervalDays,
            startTime: settings?.startTime ?? "00:00",
            slotMinutes: settings?.slotMinutes ?? 15,
            matchTypes: settings?.matchTypes ?? [],
          }}
        />
      </Card>
      <Card className="p-4 sm:p-6">
        <h2 className="mb-5 text-lg font-extrabold">
          لوگو، فاویکن و آیکون نصب
        </h2>
        <BrandingForm branding={branding} />
      </Card>
    </div>
  );
}
