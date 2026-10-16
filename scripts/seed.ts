/**
 * Seed کامل پایگاه داده — بازیکنان، تورنمنت، برنامهٔ ۱۰ شبته، مدیر
 * npm run db:seed
 */
import { loadLocalEnv } from "../src/lib/env";
import { getDb, isProductionDriver } from "../src/lib/db/client";
import { runMigrations } from "../src/lib/db/migrate";
import { seedDatabase } from "../src/lib/db/seed-core";

loadLocalEnv();


async function main() {
  const db = getDb();
  console.log(
    isProductionDriver()
      ? "Seed روی PostgreSQL (DATABASE_URL)…"
      : "Seed روی PGlite محلی…",
  );
  await runMigrations();
  const result = await seedDatabase(db);
  console.log("✓ Seed کامل شد:");
  console.log(`  - تورنمنت #${result.tournamentId}`);
  console.log(`  - ${result.playerIds.length} بازیکن`);
  console.log(`  - ${result.encounterIds.length} رویارویی`);
  console.log(`  - ${result.matchIds.length} مسابقه`);
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.log(
      "  ⚠ برای ساخت حساب مدیر، ADMIN_EMAIL و ADMIN_PASSWORD را در .env تنظیم کنید و دوباره اجرا کنید.",
    );
  } else {
    console.log("  - حساب مدیر آماده است.");
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("خطا در Seed:", err);
  process.exit(1);
});
