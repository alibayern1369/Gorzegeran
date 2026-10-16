"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "clay-pressed h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none transition-colors focus:border-elixir/50 disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-sm font-bold text-[var(--text-muted)]",
        className,
      )}
      {...props}
    />
  );
}
