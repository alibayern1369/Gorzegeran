import type { MetadataRoute } from "next";
import { APP_SHORT_NAME, TOURNAMENT_NAME, TOURNAMENT_SUBTITLE } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${TOURNAMENT_NAME} — ${TOURNAMENT_SUBTITLE}`,
    short_name: APP_SHORT_NAME,
    description:
      "پلتفرم رسمی لیگ گرز گران — جام پنج پهلوان؛ جدول، برنامه، آمار و نتایج زنده.",
    lang: "fa",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0B1020",
    theme_color: "#0B1020",
    categories: ["games", "sports"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
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
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
