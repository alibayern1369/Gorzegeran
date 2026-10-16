import { defineConfig } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { loadLocalEnv } from "./src/lib/env";
loadLocalEnv();
const local = process.env.E2E_LOCAL === "1";
if (!local && !existsSync(".env.e2e.local"))
  throw new Error(
    "Create .env.e2e.local with a disposable Neon test branch, or set E2E_LOCAL=1 for a separate local database.",
  );
const vars: Record<string, string> = local
  ? {
      DATABASE_URL: "",
      DATABASE_URL_UNPOOLED: "",
      PGLITE_DATA_DIR: ".pglite/e2e",
    }
  : Object.fromEntries(
      readFileSync(".env.e2e.local", "utf8")
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .filter((line) => line.includes("="))
        .map((line) => {
          const i = line.indexOf("=");
          return [line.slice(0, i), line.slice(i + 1)];
        }),
    );
if (
  !local &&
  (!vars.DATABASE_URL ||
    (process.env.DATABASE_URL &&
      new URL(vars.DATABASE_URL).hostname.replace("-pooler", "") ===
        new URL(process.env.DATABASE_URL).hostname.replace("-pooler", "")))
)
  throw new Error("The E2E database must differ from production.");
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  fullyParallel: false,
  timeout: 360_000,
  expect: { timeout: 20_000 },
  use: {
    channel: "chrome",
    baseURL: "http://localhost:3000",
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: local ? "npm run dev -- --port 3000" : "npm start -- --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { ...vars, NEXT_PUBLIC_APP_URL: "http://localhost:3000" },
  },
});
