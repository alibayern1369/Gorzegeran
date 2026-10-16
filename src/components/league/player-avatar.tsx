/**
 * آواتارهای خیالی بازیکنان — SVG اصلی با الهام از فضای فانتزی نبرد
 * (بدون استفاده از آثار کپی‌رایت‌دار کلش رویال)
 */
import { cn } from "@/lib/utils";
import type { PlayerSeed } from "@/lib/constants";

interface AvatarProps {
  player: PlayerSeed;
  size?: number;
  className?: string;
}

export function PlayerAvatar({ player, size = 48, className }: AvatarProps) {
  if (player.photoUrl)
    return (
      <img
        src={player.photoUrl}
        width={size}
        height={size}
        alt={`عکس ${player.name}`}
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  const id = `av-${player.slug}`;
  return (
    <span
      className={cn(
        "clay-sm inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 25%, ${player.accentLight}, ${player.accent} 55%, ${player.accentDark})`,
        boxShadow: `0 6px 16px ${player.accent}55, inset 0 2px 0 rgba(255,255,255,0.25)`,
      }}
      role="img"
      aria-label={`آواتار ${player.name}`}
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        aria-hidden
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {player.avatarStyle === "knight" && <KnightArt id={id} />}
        {player.avatarStyle === "mage" && <MageArt id={id} />}
        {player.avatarStyle === "dragon" && <DragonArt id={id} />}
        {player.avatarStyle === "crown" && <CrownArt id={id} />}
        {player.avatarStyle === "guardian" && <GuardianArt id={id} />}
        <rect width="64" height="64" fill={`url(#${id}-g)`} rx="32" />
      </svg>
    </span>
  );
}

function KnightArt({ id }: { id: string }) {
  return (
    <g>
      <ellipse cx="32" cy="52" rx="18" ry="12" fill="#0f2c6c" opacity="0.55" />
      <path
        d="M20 30c0-9 5-16 12-16s12 7 12 16v10c0 6-5 10-12 10s-12-4-12-10z"
        fill="#dbeafe"
      />
      <path d="M18 26h28v6c0 2-2 3-4 3H22c-2 0-4-1-4-3z" fill="#93c5fd" />
      <rect
        x="22"
        y="34"
        width="20"
        height="3.5"
        rx="1.75"
        fill="#1e3a8a"
        opacity="0.8"
      />
      <circle cx="26" cy="30" r="2.2" fill="#1e3a8a" />
      <circle cx="38" cy="30" r="2.2" fill="#1e3a8a" />
      <path d="M30 12l2-6 2 6z" fill="#f8fafc" />
      <path d="M14 46c2-8 8-12 18-12s16 4 18 12v6H14z" fill="#3b82f6" />
      <path d="M28 40h8v12h-8z" fill="#f5b942" opacity="0.9" />
    </g>
  );
}

function MageArt({ id }: { id: string }) {
  return (
    <g>
      <ellipse cx="32" cy="54" rx="17" ry="10" fill="#3b0764" opacity="0.5" />
      <path d="M32 8L46 34H18z" fill="#a78bfa" />
      <path d="M32 8l4 10h-8z" fill="#ddd6fe" />
      <circle cx="32" cy="22" r="3" fill="#f5b942" />
      <path d="M22 34h20l4 20H18z" fill="#7c3aed" />
      <circle cx="32" cy="42" r="5" fill="#ede9fe" opacity="0.9" />
      <circle cx="26" cy="38" r="1.8" fill="#2e1065" />
      <circle cx="38" cy="38" r="1.8" fill="#2e1065" />
      <path
        d="M28 46c1.5 1.5 6.5 1.5 8 0"
        stroke="#2e1065"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="50" cy="26" r="4" fill="#c4b5fd" opacity="0.9" />
      <circle cx="52" cy="18" r="2.2" fill="#a78bfa" />
    </g>
  );
}

function DragonArt({ id }: { id: string }) {
  return (
    <g>
      <ellipse cx="32" cy="54" rx="17" ry="9" fill="#7f1d1d" opacity="0.5" />
      <path
        d="M16 30c0-10 7-18 16-18s16 8 16 18c0 12-7 22-16 22s-16-10-16-22z"
        fill="#f87171"
      />
      <path d="M12 16l8 8-6 2z" fill="#fca5a5" />
      <path d="M52 16l-8 8 6 2z" fill="#fca5a5" />
      <path d="M24 30c0-4 3-7 8-7s8 3 8 7-3 8-8 8-8-4-8-8z" fill="#fee2e2" />
      <circle cx="26" cy="28" r="2.5" fill="#7f1d1d" />
      <circle cx="38" cy="28" r="2.5" fill="#7f1d1d" />
      <path
        d="M28 36c1 2 2 3 4 3s3-1 4-3"
        stroke="#b91c1c"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M22 12l4 8-8-2z" fill="#dc2626" />
      <path d="M42 12l-4 8 8-2z" fill="#dc2626" />
      <path d="M24 48h16v6H24z" fill="#991b1b" opacity="0.7" />
    </g>
  );
}

function CrownArt({ id }: { id: string }) {
  return (
    <g>
      <ellipse cx="32" cy="55" rx="17" ry="8" fill="#92400e" opacity="0.45" />
      <path d="M14 22l6 10 6-14 6 12 6-12 6 14 6-10-4 24H18z" fill="#fcd34d" />
      <circle cx="14" cy="20" r="3.2" fill="#fde68a" />
      <circle cx="32" cy="16" r="3.2" fill="#fde68a" />
      <circle cx="50" cy="20" r="3.2" fill="#fde68a" />
      <rect x="18" y="44" width="28" height="8" rx="3" fill="#d97706" />
      <circle cx="24" cy="48" r="2" fill="#b45309" />
      <circle cx="32" cy="48" r="2" fill="#b45309" />
      <circle cx="40" cy="48" r="2" fill="#b45309" />
      <circle cx="26" cy="36" r="2" fill="#78350f" />
      <circle cx="38" cy="36" r="2" fill="#78350f" />
    </g>
  );
}

function GuardianArt({ id }: { id: string }) {
  return (
    <g>
      <ellipse cx="32" cy="55" rx="17" ry="8" fill="#064e3b" opacity="0.5" />
      <path
        d="M32 10c8 4 14 8 14 18v12c0 10-6 16-14 20-8-4-14-10-14-20V28c0-10 6-14 14-18z"
        fill="#34d399"
      />
      <path
        d="M32 16c6 3 10 6 10 13v10c0 8-4 12-10 15-6-3-10-7-10-15V29c0-7 4-10 10-13z"
        fill="#6ee7b7"
        opacity="0.6"
      />
      <circle cx="26" cy="30" r="2.4" fill="#065f46" />
      <circle cx="38" cy="30" r="2.4" fill="#065f46" />
      <path
        d="M27 38c1.5 2 8.5 2 10 0"
        stroke="#065f46"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M32 20l2 4h-4z" fill="#a7f3d0" />
      <rect
        x="28"
        y="42"
        width="8"
        height="8"
        rx="2"
        fill="#059669"
        opacity="0.8"
      />
    </g>
  );
}
