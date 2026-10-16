import type { PlayerSeed } from "./constants";

export function visualPlayer(p: {
  id: number;
  slug: string;
  name: string;
  title?: string | null;
  accentColor?: string;
  avatarStyle?: string;
  photoUrl?: string | null;
}): PlayerSeed {
  const accent = p.accentColor ?? "#2563eb";
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    title: p.title ?? "بازیکن لیگ",
    accent,
    accentDark: accent,
    accentLight: accent,
    avatarStyle: (p.avatarStyle ?? "knight") as PlayerSeed["avatarStyle"],
    photoUrl: p.photoUrl,
  };
}
