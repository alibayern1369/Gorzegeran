import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { getDataVersion } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** نسخهٔ داده برای به‌روزرسانی بلادرنگ صفحات عمومی */
export async function GET() {
  try {
    const version = await getDataVersion(getDb());
    return NextResponse.json({ version }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ version: 0 }, { headers: { "Cache-Control": "no-store" } });
  }
}
