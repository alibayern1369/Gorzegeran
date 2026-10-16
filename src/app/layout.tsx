import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { RealtimeProvider } from "@/components/realtime-provider";
import { SwRegister } from "@/components/sw-register";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import {
  APP_SHORT_NAME,
  TOURNAMENT_NAME,
  TOURNAMENT_SUBTITLE,
} from "@/lib/constants";
import "./globals.css";
import { getAllPlayers } from "@/lib/queries";
import { visualPlayer } from "@/lib/visual-players";
import { LeagueProvider } from "@/components/league-provider";
import { getBranding } from "@/lib/branding";
import { InstallPrompt } from "@/components/install-prompt";

export const dynamic = "force-dynamic";

const vazirmatn = localFont({
  src: "./fonts/Vazirmatn-Variable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-vazirmatn",
  fallback: ["Tahoma", "Arial"],
});

const baseMetadata: Metadata = {
  manifest: "/manifest.webmanifest",
  title: {
    default: `${TOURNAMENT_NAME} — ${TOURNAMENT_SUBTITLE}`,
    template: `%s | ${TOURNAMENT_NAME}`,
  },
  description: `${TOURNAMENT_NAME}؛ ${TOURNAMENT_SUBTITLE} — پلتفرم رسمی مسابقات کلش رویال پنج پهلوان. جدول لیگ، برنامه مسابقات، آمار و دستاوردها.`,
  applicationName: APP_SHORT_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_SHORT_NAME,
  },
  openGraph: {
    title: `${TOURNAMENT_NAME} — ${TOURNAMENT_SUBTITLE}`,
    description: "جام پنج پهلوان — رقابت رسمی پنج بازیکن کلش رویال",
    type: "website",
    locale: "fa_IR",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBranding();
  return {
    ...baseMetadata,
    applicationName: branding.shortName,
    title: { default: branding.name, template: `%s | ${branding.name}` },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: branding.shortName,
    },
    openGraph: { ...baseMetadata.openGraph, title: branding.name },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B1020" },
    { media: "(prefers-color-scheme: light)", color: "#F1F5FF" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [players, branding] = await Promise.all([
    getAllPlayers(),
    getBranding(),
  ]);
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href={branding.faviconUrl ?? "/icon.svg"} />
        <link
          rel="apple-touch-icon"
          href={
            branding.appIconUrl
              ? `${branding.appIconUrl}?size=180`
              : "/icon-192.png"
          }
        />
        <script
          // جلوگیری از پرش تم هنگام بارگذاری
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('garz-theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${vazirmatn.className} min-h-dvh antialiased`}>
        <LeagueProvider players={players.map(visualPlayer)}>
          <ThemeProvider>
            <RealtimeProvider>
              <div className="flex min-h-dvh flex-col">
                <SiteHeader branding={branding} />
                <main id="main-content" className="flex-1 pb-24 pt-4 md:pb-10">
                  {children}
                </main>
                <SiteFooter />
                <BottomNav />
              </div>
            </RealtimeProvider>
            <Toaster
              position="top-center"
              dir="rtl"
              toastOptions={{
                style: {
                  fontFamily: "var(--font-vazirmatn), Tahoma, sans-serif",
                  direction: "rtl",
                  background: "var(--surface)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: "1.15rem",
                  boxShadow: "var(--shadow-clay-sm)",
                },
              }}
            />
            <SwRegister />
            <InstallPrompt
              name={branding.shortName}
              icon={branding.appIconUrl ?? "/icon-192.png"}
            />
          </ThemeProvider>
        </LeagueProvider>
      </body>
    </html>
  );
}
