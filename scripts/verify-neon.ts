import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { loadLocalEnv } from "../src/lib/env";
import { getDb } from "../src/lib/db/client";
import { loadLeagueData } from "../src/lib/queries";
import { meta } from "../src/lib/db/schema";

loadLocalEnv();

async function main() {
  assert(process.env.DATABASE_URL, "DATABASE_URL is required; this check must use Neon.");
  const db = getDb();
  const data = await loadLeagueData(db);
  assert.equal(data.players.length, 5);
  assert.equal(data.encounters.length, 10);
  assert.equal(data.matches.length, 40);
  console.log("PASS Neon read: 5 players, 10 encounters, 40 matches");

  const key = `smoke-${randomUUID()}`;
  const rollback = new Error("smoke rollback");
  try {
    await db.transaction(async (tx) => {
      await tx.insert(meta).values({ key, value: { smoke: true } });
      const rows = await tx.select().from(meta).where(eq(meta.key, key));
      assert.equal(rows.length, 1);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
  assert.equal((await db.select().from(meta).where(eq(meta.key, key))).length, 0);
  console.log("PASS Neon write/read/rollback: no test data retained");

  const base = process.env.SMOKE_APP_URL ?? "http://localhost:3000";
  for (const route of ["/", "/standings", "/schedule", "/tower-leaders", "/players/dashli", `/matches/${data.matches[0]!.id}`, "/admin/login"]) {
    const response = await fetch(new URL(route, base));
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert(html.includes("گرز") || html.includes("لیگ"), `${route}: missing app content`);
    assert(!html.includes('"digest":"') && !html.includes('\\"digest\\":\\"'), `${route}: server rendering failed`);
    console.log(`PASS HTTP 200 ${route}`);
  }
  const response = await fetch(new URL("/api/data-version", base));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.version, data.dataVersion);
  assert(body.version > 0, "API must read a seeded database, not its error fallback");
  console.log(`PASS API data-version=${body.version} matches Neon`);

  assert(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD, "Admin credentials are required for the login check");
  const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8"));
  const entry = Object.entries(manifest.node).find(([, value]) => (value as { exportedName?: string }).exportedName === "loginAction");
  assert(entry, "Built login server action was not found");
  const form = new FormData();
  form.set("_1_email", process.env.ADMIN_EMAIL);
  form.set("_1_password", process.env.ADMIN_PASSWORD);
  form.set("0", JSON.stringify([{}, "$K1"]));
  const login = await fetch(new URL("/admin/login", base), {
    method: "POST",
    headers: { "Next-Action": entry[0], Origin: base },
    body: form,
    redirect: "manual",
  });
  const cookie = login.headers.getSetCookie().find((value) => value.startsWith("garz_admin_session="));
  const loginBody = await login.text();
  const loginError = loginBody.match(/"error":"([^"\r\n]+)"/)?.[1];
  assert(cookie, `Login did not return a session cookie (HTTP ${login.status}${loginError ? `: ${loginError}` : ""})`);
  const admin = await fetch(new URL("/admin", base), {
    headers: { Cookie: cookie.split(";")[0]! }, redirect: "manual",
  });
  assert.equal(admin.status, 200, "Authenticated dashboard");
  assert((await admin.text()).includes("داشبورد"));
  console.log("PASS admin login Server Action + authenticated dashboard backed by Neon");
}

main().catch((error) => {
  console.error("FAIL Neon smoke check; inspect the app logs and database configuration.");
  if (error instanceof assert.AssertionError) console.error(error.message);
  process.exitCode = 1;
}).finally(async () => {
  await globalThis.__garzPgClient?.end();
});
