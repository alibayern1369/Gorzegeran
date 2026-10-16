import { eq } from "drizzle-orm";
import { getDb, type AppDatabase } from "./db/client";
import { meta } from "./db/schema";

export interface Branding {
  name: string;
  shortName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  appIconUrl: string | null;
}
export const DEFAULT_BRANDING: Branding = {
  name: "گرز گران",
  shortName: "گرز گران",
  logoUrl: null,
  faviconUrl: null,
  appIconUrl: null,
};
export async function getBranding(
  db: AppDatabase = getDb(),
): Promise<Branding> {
  const [row] = await db.select().from(meta).where(eq(meta.key, "branding"));
  return { ...DEFAULT_BRANDING, ...((row?.value as Partial<Branding>) ?? {}) };
}
