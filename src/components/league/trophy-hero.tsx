/**
 * تصویر قهرمانی جام / تاج برای صفحهٔ اصلی — SVG اصلی
 */
export function TrophyHero({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 260"
      className={className}
      role="img"
      aria-label="جام قهرمانی لیگ گرز گران"
    >
      <defs>
        <linearGradient id="trophy-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="45%" stopColor="#F5B942" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="trophy-cup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <radialGradient id="trophy-glow" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FCD34D" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="trophy-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      <circle cx="120" cy="100" r="95" fill="url(#trophy-glow)" />

      {/* دسته‌های جام */}
      <path
        d="M48 88c-18 2-28 14-26 30 2 18 18 28 34 26"
        fill="none"
        stroke="url(#trophy-gold)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M192 88c18 2 28 14 26 30-2 18-18 28-34 26"
        fill="none"
        stroke="url(#trophy-gold)"
        strokeWidth="12"
        strokeLinecap="round"
      />

      {/* کاسهٔ جام */}
      <path
        d="M66 62h108c2 44-14 76-54 88C80 138 64 106 66 62z"
        fill="url(#trophy-cup)"
      />
      <path
        d="M82 74h76c-1 30-12 52-38 62-26-10-37-32-38-62z"
        fill="#FDE68A"
        opacity="0.45"
      />

      {/* تاج کوچک روی جام */}
      <path
        d="M104 44l4-18 8 12 8-16 8 16 8-12 4 18z"
        fill="url(#trophy-gold)"
      />
      <circle cx="108" cy="26" r="3.5" fill="#FDE68A" />
      <circle cx="132" cy="22" r="3.5" fill="#FDE68A" />
      <circle cx="156" cy="26" r="3.5" fill="#FDE68A" />

      {/* ساقه و پایه */}
      <rect x="112" y="150" width="16" height="34" rx="6" fill="url(#trophy-gold)" />
      <path d="M84 184h72c3 0 5 2 5 5v8c0 3-2 5-5 5H84c-3 0-5-2-5-5v-8c0-3 2-5 5-5z" fill="#B45309" />
      <rect x="70" y="200" width="100" height="16" rx="8" fill="url(#trophy-blue)" />
      <rect x="82" y="216" width="76" height="12" rx="6" fill="#1E40AF" />

      {/* ستاره‌ها */}
      <path d="M36 46l2.4 6.6 6.6 2.4-6.6 2.4L36 64l-2.4-6.6-6.6-2.4 6.6-2.4z" fill="#FCD34D" />
      <path d="M206 54l1.8 5 5 1.8-5 1.8-1.8 5-1.8-5-5-1.8 5-1.8z" fill="#FCD34D" opacity="0.85" />
      <path d="M196 148l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#FCD34D" opacity="0.7" />
    </svg>
  );
}
