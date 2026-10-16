"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-elixir-light focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
  {
    variants: {
      variant: {
        primary:
          "clay-btn text-white bg-[linear-gradient(180deg,#3b82f6,#2563eb)] border-[#1d4ed8]/40 hover:brightness-110 active:translate-y-0.5",
        gold:
          "clay-btn text-[#3d2c05] bg-[linear-gradient(180deg,#fcd34d,#f5b942)] border-[#d97706]/40 hover:brightness-105 active:translate-y-0.5 shadow-[0_10px_25px_rgba(245,185,66,0.3)]",
        elixir:
          "clay-btn text-white bg-[linear-gradient(180deg,#a78bfa,#8b5cf6)] border-[#7c3aed]/40 hover:brightness-110 active:translate-y-0.5",
        success:
          "clay-btn text-white bg-[linear-gradient(180deg,#4ade80,#22c55e)] border-[#16a34a]/40 hover:brightness-110 active:translate-y-0.5",
        danger:
          "clay-btn text-white bg-[linear-gradient(180deg,#f87171,#ef4444)] border-[#dc2626]/40 hover:brightness-110 active:translate-y-0.5",
        ghost:
          "bg-transparent hover:bg-[var(--row-hover)] rounded-xl border border-transparent",
        outline:
          "clay-btn bg-transparent text-[var(--text)] hover:bg-[var(--surface-2)]",
        link: "text-royal-light underline-offset-4 hover:underline rounded-none",
      },
      size: {
        sm: "h-9 px-3.5 text-xs",
        md: "h-11 px-5 text-sm",
        lg: "h-13 px-7 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
