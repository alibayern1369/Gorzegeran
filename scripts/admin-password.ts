/**
 * تنظیم یا بازنشانی رمز عبور مدیر از روی متغیرهای محیطی
 * ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:password
 */
import { eq } from "drizzle-orm";
import { loadLocalEnv } from "../src/lib/env";
import { getDb } from "../src/lib/db/client";
import { runMigrations } from "../src/lib/db/migrate";
import { hashPassword } from "../src/lib/auth/password";
import * as s from "../src/lib/db/schema";

loadLocalEnv();


async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error("ADMIN_EMAIL و ADMIN_PASSWORD باید تنظیم شده باشند.");
    process.exit(1);
  }
  const db = getDb();
  await runMigrations();
  const hash = await hashPassword(password);
  const found = await db.select().from(s.users).where(eq(s.users.email, email)).limit(1);
  if (found[0]) {
    await db
      .update(s.users)
      .set({ passwordHash: hash, updatedAt: new Date() })
      .where(eq(s.users.id, found[0].id));
    console.log(`✓ رمز عبور کاربر ${email} بازنشانی شد.`);
  } else {
    await db.insert(s.users).values({
      email,
      passwordHash: hash,
      displayName: "مدیر لیگ",
      role: "admin",
    });
    console.log(`✓ کاربر مدیر ${email} ساخته شد.`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
