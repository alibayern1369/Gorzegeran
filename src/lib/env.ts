/**
 * بارگذاری متغیرهای محیطی محلی برای اسکریپت‌ها (Next.js خودش .env را می‌خواند)
 */
import { readFileSync } from "node:fs";
import path from "node:path";

export function loadLocalEnv(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      const text = readFileSync(path.resolve(process.cwd(), file), "utf8");
      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq <= 0) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    } catch {
      /* فایل وجود ندارد */
    }
  }
}
