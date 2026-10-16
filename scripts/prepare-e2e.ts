import { loadLocalEnv } from "../src/lib/env";
import { getDb } from "../src/lib/db/client";
import { runMigrations } from "../src/lib/db/migrate";
import { seedDatabase } from "../src/lib/db/seed-core";
loadLocalEnv();
// Set these inside Node: older PowerShell versions remove empty environment values.
process.env.DATABASE_URL = "";
process.env.DATABASE_URL_UNPOOLED = "";
process.env.PGLITE_DATA_DIR = ".pglite/e2e";
async function main() {
  const db = getDb();
  await runMigrations(db);
  await seedDatabase(db);
  console.log("PASS isolated local E2E database prepared at .pglite/e2e");
}
main()
  .catch(() => {
    console.error("Could not prepare local E2E database");
    process.exitCode = 1;
  })
  .finally(async () => {
    await globalThis.__garzPglite?.close();
  });
