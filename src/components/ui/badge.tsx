import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]",
        gold: "bg-[linear-gradient(180deg,#fcd34d,#f5b942)] text-[#3d2c05] shadow-[0_4px_12px_rgba(245,185,66,0.35)]",
        silver: "bg-[linear-gradient(180deg,#e2e8f0,#94a3b8)] text-[#1e293b]",
        bronze: "bg-[linear-gradient(180deg,#f0b27a,#c2703d)] text-[#3b1f0b]",
        victory: "bg-victory/15 text-victory border border-victory/30",
        defeat: "bg-defeat/15 text-defeat border border-defeat/30",
        elixir: "bg-elixir/15 text-elixir-light border border-elixir/30",
        royal: "bg-royal/15 text-royal-light border border-royal/30",
        live: "bg-defeat/15 text-defeat border border-defeat/40 animate-pulse-soft",
        muted: "bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
