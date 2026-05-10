import { getTranslations } from "next-intl/server";
import AppShell from "@/components/shell/AppShell";
import FadeIn from "@/components/motion/FadeIn";
import {
  CheckCircle,
  Clock,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";

export default async function Home() {
  const t = await getTranslations("navigation");
  const tStatus = await getTranslations("orderStatus");

  return (
    <AppShell title={t("home")} role="joueur">
      <div className="px-4 py-6 lg:px-8 lg:py-8">
        <FadeIn>
          <div className="mb-6 space-y-1">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Bootstrap · Semaine 1
            </p>
            <h2 className="text-2xl font-semibold tracking-tight lg:text-3xl">
              FOOD PASSPORT 360
            </h2>
          </div>
        </FadeIn>

        {/* Prochaine commande — carte démo */}
        <FadeIn delay={0.05}>
          <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Prochaine commande
              </p>
              <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                <CheckCircle size={12} />
                {tStatus("validee_nutri")}
              </span>
            </div>
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <UtensilsCrossed size={20} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Dîner</p>
                <p className="text-sm text-muted-foreground">19h30 · 3 articles</p>
              </div>
              <Clock size={16} className="text-muted-foreground" />
            </div>
          </div>
        </FadeIn>

        {/* Statuts de commande — démo des variables CSS */}
        <FadeIn delay={0.1}>
          <div className="mb-6 rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Statuts (CSS variables)
              </p>
            </div>
            <div className="flex flex-wrap gap-2 p-4">
              {[
                { key: "en_attente_nutri", variant: "warning" },
                { key: "validee_nutri", variant: "success" },
                { key: "refusee_nutri", variant: "danger" },
                { key: "en_preparation", variant: "primary" },
                { key: "prete", variant: "success" },
                { key: "annulee", variant: "muted" },
              ].map(({ key, variant }) => (
                <span
                  key={key}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium
                    bg-${variant}/15 text-${variant}`}
                >
                  {tStatus(key as Parameters<typeof tStatus>[0])}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Stack cards */}
        <FadeIn delay={0.15}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <ShoppingBag size={16} className="text-muted-foreground" />
                <p className="text-sm font-medium">Stack</p>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Next.js 16 · TypeScript · Tailwind v4 · Supabase · next-intl v4
                · Framer Motion
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle size={16} className="text-muted-foreground" />
                <p className="text-sm font-medium">Shell prêt</p>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                AppShell · TopBar · BottomNav · Sidebar · LanguageSwitcher ·
                FadeIn
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </AppShell>
  );
}
