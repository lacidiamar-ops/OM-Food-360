export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Bootstrap · Semaine 1
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            FOOD PASSPORT 360
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Interface alimentaire performance joueur — nutrition, restauration,
            hôtel. Fondations posées : stack installée, thème CSS variables prêt
            à recevoir la charte de Claude Design.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4 text-card-foreground">
            <p className="text-sm font-medium">Stack</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Next.js · TypeScript · Tailwind v4 · Supabase · next-intl ·
              Framer Motion
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-card-foreground">
            <p className="text-sm font-medium">Thème</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Variables CSS placeholder neutres — palette finale par Claude
              Design.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Prochaine étape : configuration <code className="font-mono">next-intl</code>{" "}
          (FR/EN/ES/IT/PT/AR), middleware Supabase, AppShell.
        </p>
      </div>
    </main>
  );
}
