"use client";

import { motion, useReducedMotion } from "motion/react";
import { toPersianDigits } from "@/lib/jalali";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
  showPercent?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  className,
  showPercent = true,
}: ProgressBarProps) {
  const reduceMotion = useReducedMotion();
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercent) && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          {label && (
            <span className="font-bold text-[var(--text-muted)]">{label}</span>
          )}
          {showPercent && (
            <span className="num font-extrabold text-royal-light">
              {toPersianDigits(percent)}٪
            </span>
          )}
        </div>
      )}
      <div
        className="progress-track h-3"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? "پیشرفت"}
      >
        <motion.div
          className="progress-fill h-full"
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: reduceMotion ? 0 : 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
