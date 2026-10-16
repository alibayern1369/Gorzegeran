/**
 * کلاینت پایگاه داده — پشتیبانی هم‌زمان از PGlite (توسعه/تست) و PostgreSQL (تولید)
 *
 * - اگر DATABASE_URL تنظیم شده باشد از رانندهٔ postgres-js استفاده می‌شود (سازگار با Neon).
 * - در غیر این صورت PGlite (PostgreSQL کامل به‌صورت WASM) روی دیسک محلی استفاده می‌شود.
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { mkdirSync } from "node:fs";
import path from "node:path";
import * as schema from "./schema";

export type AppDatabase = PgliteDatabase<typeof schema> | PostgresJsDatabase<typeof schema>;

export const DEFAULT_PGLITE_DIR = ".pglite/data";

declare global {
  // eslint-disable-next-line no-var
  var __garzDb: AppDatabase | undefined;
  // eslint-disable-next-line no-var
  var __garzPgClient: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __garzPglite: PGlite | undefined;
}

export function isProductionDriver(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): AppDatabase {
  if (globalThis.__garzDb) return globalThis.__garzDb;

  if (isProductionDriver()) {
    const client = postgres(process.env.DATABASE_URL!, {
      max: 5,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 15,
    });
    globalThis.__garzPgClient = client;
    const db = drizzlePostgres(client, { schema });
    globalThis.__garzDb = db;
    return db;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL must be set in production; local PGlite storage is for development only.");
  }

  const dir = path.resolve(
    /*turbopackIgnore: true*/ process.cwd(),
    process.env.PGLITE_DATA_DIR ?? DEFAULT_PGLITE_DIR,
  );
  mkdirSync(dir, { recursive: true });
  const pglite = new PGlite(dir);
  globalThis.__garzPglite = pglite;
  const db = drizzlePglite(pglite, { schema });
  globalThis.__garzDb = db;
  return db;
}

/** ایجاد دیتابیس تازه در حافظه برای تست‌ها */
export async function createTestDb(): Promise<{
  db: PgliteDatabase<typeof schema>;
  pglite: PGlite;
}> {
  const pglite = new PGlite(); // در حافظه
  await pglite.waitReady;
  const db = drizzlePglite(pglite, { schema });
  return { db, pglite };
}

/** دیتابیس جاری (lazy — در زمان import ساخته نمی‌شود) */
export function db(): AppDatabase {
  return getDb();
}
