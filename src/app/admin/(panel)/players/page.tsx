import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/guard";
import { loadLeagueData } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/league/player-avatar";
import { PlayerEditor, DeletePlayer } from "@/components/admin/settings-forms";
export const dynamic = "force-dynamic";
export default async function AdminPlayersPage() {
  await requireAdminPage();
  const data = await loadLeagueData();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">مدیریت بازیکنان</h1>
        <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
          بازیکن اضافه کنید، نام و عکس او را تغییر دهید یا بازیکن و مسابقات
          وابسته را حذف کنید.
        </p>
      </div>
      <Card className="p-4 sm:p-6">
        <h2 className="mb-5 text-lg font-extrabold">بازیکن جدید</h2>
        <PlayerEditor />
      </Card>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        {data.visualPlayers.map((player) => (
          <Card key={player.id} className="min-w-0 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <PlayerAvatar player={player} size={48} />
              <div className="min-w-0 flex-1">
                <h2 className="break-words font-extrabold">{player.name}</h2>
                <Link
                  href={`/players/${player.slug}`}
                  className="text-xs text-royal-light"
                >
                  مشاهده پروفایل
                </Link>
              </div>
            </div>
            <PlayerEditor player={player} />
            <DeletePlayer player={player} />
          </Card>
        ))}
      </div>
    </div>
  );
}
