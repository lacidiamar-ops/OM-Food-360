import { getTranslations } from "next-intl/server";
import FadeIn from "@/components/motion/FadeIn";
import LoginForm from "./LoginForm";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("loginTitle") };
}

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const t = await getTranslations("auth");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <FadeIn>
          <div className="space-y-2 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <span className="text-lg font-bold text-primary-foreground">
                FP
              </span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              FOOD PASSPORT 360
            </h1>
            <p className="text-sm text-muted-foreground">{t("loginTitle")}</p>
          </div>
        </FadeIn>

        {/* Auth error from callback */}
        {error && (
          <FadeIn delay={0.04}>
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <p className="font-medium mb-1">{t("authError")}</p>
              <p className="font-mono text-xs break-all opacity-80">{decodeURIComponent(error)}</p>
            </div>
          </FadeIn>
        )}

        {/* Formulaire */}
        <FadeIn delay={0.08}>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <LoginForm />
          </div>
        </FadeIn>

        {/* Footer */}
        <FadeIn delay={0.14}>
          <p className="text-center text-xs text-muted-foreground">
            API Restauration · OM PRO
          </p>
        </FadeIn>
      </div>
    </main>
  );
}
