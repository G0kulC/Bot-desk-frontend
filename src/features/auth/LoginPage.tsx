import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";

import { useAuthToken } from "@/api/auth-store";
import { errorMessage } from "@/api/client";
import { useLogin } from "@/api/useAuth";
import { Field, Input } from "@/components/Field";
import { BorderBeam } from "@/components/magicui/border-beam";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { WordRotate } from "@/components/magicui/word-rotate";
import { Logo } from "@/components/Logo";
import { usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().trim().min(1, "Enter your email").email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
type Values = z.infer<typeof schema>;

/** Only allow same-app redirects after login. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function LoginPage() {
  const token = useAuthToken();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const login = useLogin();
  const reduced = usePrefersReducedMotion();
  const next = safeNext(params.get("next"));
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  if (token) return <Navigate to={next} replace />;

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, { onSuccess: () => navigate(next, { replace: true }) }),
  );

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <DotPattern
        className="text-line [mask-image:radial-gradient(520px_circle_at_center,white,transparent)]"
        width={20}
        height={20}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo />
          <div className="mt-2 flex items-center gap-1.5 text-sm text-ink-2">
            <span>WhatsApp assistants that reply in</span>
            {reduced ? (
              <span className="font-medium text-brand">English · தமிழ் · Tanglish</span>
            ) : (
              <WordRotate
                className="font-medium text-brand"
                words={["English", "தமிழ்", "Tanglish", "हिन्दी", "తెలుగు"]}
              />
            )}
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate className="card relative overflow-hidden p-6 shadow-sm">
          {!reduced && (
            <BorderBeam size={90} duration={9} colorFrom="hsl(var(--brand))" colorTo="hsl(var(--ok))" />
          )}
          <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
          <div className="space-y-4">
            <Field label="Email" error={errors.email?.message}>
              {(p) => (
                <Input {...p} type="email" autoComplete="username" inputMode="email" {...register("email")} />
              )}
            </Field>
            <Field label="Password" error={errors.password?.message}>
              {(p) => (
                <Input {...p} type="password" autoComplete="current-password" {...register("password")} />
              )}
            </Field>
            {login.isError && (
              <p role="alert" className="rounded-md bg-bad/10 px-3 py-2 text-sm text-bad">
                {errorMessage(login.error)}
              </p>
            )}
            <ShimmerButton
              type="submit"
              disabled={login.isPending}
              background="hsl(var(--brand))"
              shimmerColor="hsl(var(--brand-soft))"
              borderRadius="10px"
              className={cn("h-11 w-full text-[15px] font-semibold text-brand-ink dark:text-brand-ink")}
            >
              {login.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-label="Signing in" />
              ) : (
                "Sign in"
              )}
            </ShimmerButton>
          </div>
        </form>
      </div>
    </div>
  );
}
