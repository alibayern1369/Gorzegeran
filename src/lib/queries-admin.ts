/**
 * کوئری‌های ویژهٔ ناحیهٔ مدیریتی
 */
import { asc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";

export async function getDbUsersSafe(): Promise<
  Array<{ id: number; displayName: string; email: string }>
> {
  const db = getDb();
  const rows = await db
    .select({
      id: s.users.id,
      displayName: s.users.displayName,
      email: s.users.email,
    })
    .from(s.users)
    .orderBy(asc(s.users.id));
  return rows;
}

export { getRecentAuditLogs } from "@/lib/queries";
