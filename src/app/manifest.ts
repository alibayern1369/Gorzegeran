import type { MetadataRoute } from "next";
import { getBranding } from "@/lib/branding";
export const dynamic = "force-dynamic";
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const branding = await getBranding();
  return {
    id: "/",
    name: branding.name,
    short_name: branding.shortName,
    description: "جدول، برنامه و نتایج لیگ کلش رویال",
    lang: "fa",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0B1020",
    theme_color: "#0B1020",
    icons: branding.appIconUrl
      ? [
          {
            src: `${branding.appIconUrl}?size=192`,
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: `${branding.appIconUrl}?size=512`,
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ]
      : [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
  };
}
