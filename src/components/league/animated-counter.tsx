"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { toPersianDigits } from "@/lib/jalali";

interface AnimatedCounterProps {
  value: number;
  durationMs?: number;
  className?: string;
}

/** شمارندهٔ متحرک آمار (با احترام به prefers-reduced-motion) */
export function AnimatedCounter({
  value,
  durationMs = 900,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, durationMs, reduceMotion]);

  return (
    <span ref={ref} className={className} aria-label={String(value)}>
      {toPersianDigits(display)}
    </span>
  );
}
