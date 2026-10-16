/**
 * اجرای مهاجرت‌ها روی دیتابیس (PGlite یا PostgreSQL)
 */
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { getDb, isProductionDriver, DEFAULT_PGLITE_DIR, type AppDatabase } from "./client";

export const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

export async function runMigrations(db?: AppDatabase): Promise<void> {
  if (isProductionDriver() && !db) {
    const client = postgres(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!, {
      max: 1,
      prepare: false,
      connect_timeout: 15,
    });
    try {
      await migratePostgres(drizzle(client), { migrationsFolder: MIGRATIONS_FOLDER });
    } finally {
      await client.end();
    }
  } else {
    const database = db ?? getDb();
    await migratePglite(database as never, { migrationsFolder: MIGRATIONS_FOLDER });
  }
}

export { DEFAULT_PGLITE_DIR };
