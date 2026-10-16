/**
 * بازنشانی کامل پایگاه دادهٔ محلی (PGlite) — فقط برای توسعه
 * npm run db:reset
 */
import { loadLocalEnv } from "../src/lib/env";
import { rm } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_PGLITE_DIR, isProductionDriver } from "../src/lib/db/client";

loadLocalEnv();


async function main() {
  if (isProductionDriver()) {
    console.error(
      "این اسکریپت فقط برای توسعهٔ محلی (PGlite) است. برای تولید، دیتابیس را دستی مدیریت کنید.",
    );
    process.exit(1);
  }
  const dir = path.join(process.cwd(), process.env.PGLITE_DATA_DIR ?? DEFAULT_PGLITE_DIR);
  await rm(dir, { recursive: true, force: true });
  console.log(`✓ پایگاه دادهٔ محلی حذف شد: ${dir}`);
  console.log("اکنون npm run db:seed را اجرا کنید.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
