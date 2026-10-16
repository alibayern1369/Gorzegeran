"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, LogIn, Loader2, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  useEffect(() => {
    if (state.success) {
      toast.success("ورود با موفقیت انجام شد. خوش آمدید!");
      router.replace("/admin");
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 pt-10">
      <Card className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -start-10 -top-10 size-40 rounded-full bg-royal/20 blur-3xl"
          aria-hidden
        />
        <div className="text-center">
          <span className="clay-sm mx-auto flex size-16 items-center justify-center rounded-3xl bg-[linear-gradient(145deg,#2563eb,#8b5cf6)] shadow-[0_12px_30px_rgba(37,99,235,0.4)]">
            <ShieldCheck className="size-8 text-white" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-black">ورود مدیر لیگ</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            ناحیهٔ مدیریتی لیگ گرز گران — فقط برای مدیر مسابقات
          </p>
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">ایمیل مدیر</Label>
            <Input
              id="email"
              name="email"
              type="email"
              dir="ltr"
              autoComplete="username"
              required
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password">رمز عبور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              dir="ltr"
              autoComplete="current-password"
              required
              minLength={8}
              placeholder="••••••••"
            />
          </div>

          {state.error && (
            <p
              role="alert"
              className="rounded-xl border border-defeat/30 bg-defeat/10 px-4 py-2.5 text-sm font-bold text-defeat"
            >
              {state.error}
            </p>
          )}

          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full"
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <LogIn className="size-5" aria-hidden />
            )}
            ورود به داشبورد
          </Button>
        </form>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-[var(--text-faint)]">
          <Crown className="size-3.5 text-gold" aria-hidden />
          دسترسی عمومی بدون نیاز به ورود است؛ فقط ثبت نتایج محدود به مدیر است.
        </p>
      </Card>
    </div>
  );
}
