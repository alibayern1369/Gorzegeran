/**
 * ثابت‌های لیگ گرز گران — هویت بصری بازیکنان و مسیرها
 */

export interface PlayerSeed {
  id: number;
  slug: string;
  name: string;
  /** رنگ تأکیدی بازیکن */
  accent: string;
  accentDark: string;
  accentLight: string;
  /** سبک آواتار خیالی */
  avatarStyle: "knight" | "mage" | "dragon" | "crown" | "guardian";
  title: string;
}

export const PLAYER_SEEDS: PlayerSeed[] = [
  {
    id: 1,
    slug: "dashli",
    name: "داشلی",
    accent: "#2563EB",
    accentDark: "#1D4ED8",
    accentLight: "#60A5FA",
    avatarStyle: "knight",
    title: "شوالیهٔ آبی",
  },
  {
    id: 2,
    slug: "hani",
    name: "هانی",
    accent: "#8B5CF6",
    accentDark: "#7C3AED",
    accentLight: "#A78BFA",
    avatarStyle: "mage",
    title: "ساحر اکسیر",
  },
  {
    id: 3,
    slug: "jaf-haf",
    name: "جاف حاف",
    accent: "#DC2626",
    accentDark: "#B91C1C",
    accentLight: "#F87171",
    avatarStyle: "dragon",
    title: "اژدهای سرخ",
  },
  {
    id: 4,
    slug: "ali-doli",
    name: "علی دولی",
    accent: "#F5B942",
    accentDark: "#D97706",
    accentLight: "#FCD34D",
    avatarStyle: "crown",
    title: "تاج‌دار طلایی",
  },
  {
    id: 5,
    slug: "ostad",
    name: "استاد",
    accent: "#22C55E",
    accentDark: "#16A34A",
    accentLight: "#4ADE80",
    avatarStyle: "guardian",
    title: "نگهبان زمردین",
  },
];

export const PLAYER_BY_ID = new Map(PLAYER_SEEDS.map((p) => [p.id, p]));
export const PLAYER_BY_SLUG = new Map(PLAYER_SEEDS.map((p) => [p.slug, p]));

export const TOURNAMENT_NAME = "لیگ گرز گران";
export const TOURNAMENT_SUBTITLE = "جام پنج پهلوان";
export const CHAMPION_TITLE = "شهریار گرز گران";
export const TOWER_LEADER_TITLE = "دژگشای برتر";

export const APP_SHORT_NAME = "گرز گران";

export const NAV_LINKS = [
  { href: "/", label: "خانه" },
  { href: "/standings", label: "جدول لیگ" },
  { href: "/schedule", label: "برنامه مسابقات" },
  { href: "/tower-leaders", label: "دژگشایان برتر" },
  { href: "/rules", label: "آیین‌نامه" },
] as const;

export const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "داشبورد" },
  { href: "/admin/results", label: "ثبت نتایج" },
  { href: "/admin/matches", label: "مدیریت مسابقات" },
  { href: "/admin/schedule", label: "برنامه زمان‌بندی" },
  { href: "/admin/players", label: "مدیریت بازیکنان" },
  { href: "/admin/audit", label: "تاریخچه تغییرات" },
] as const;
