import Link from "next/link";
import {
  Camera,
  ClipboardList,
  MessageCircle,
  ShieldCheck,
  Utensils,
  Users,
} from "lucide-react";
import type { GlobalStats } from "@/lib/supabase/queries";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  variant?: "default" | "warning" | "success";
}

function StatCard({ label, value, icon, href, variant = "default" }: StatCardProps) {
  const ring =
    variant === "warning"
      ? "border-amber-500/30 bg-amber-500/5"
      : variant === "success"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : "border-border bg-card";

  return (
    <Link
      href={href}
      className={`rounded-2xl border p-4 flex flex-col gap-3 hover:opacity-80 transition-opacity ${ring}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-2xl font-bold tabular-nums">{value}</span>
      </div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </Link>
  );
}

interface Props {
  stats: GlobalStats;
}

export default function AdminDashboard({ stats }: Props) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h1 className="text-lg font-semibold">Super Admin</h1>
        <p className="text-sm text-muted-foreground">Vue globale de l&apos;application</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Joueurs actifs"
          value={stats.total_players}
          icon={<Users className="h-4 w-4" />}
          href="/nutri/players"
          variant="default"
        />
        <StatCard
          label="Commandes aujourd'hui"
          value={stats.orders_today}
          icon={<Utensils className="h-4 w-4" />}
          href="/resto"
          variant="default"
        />
        <StatCard
          label="En attente nutri"
          value={stats.orders_pending_nutri}
          icon={<ShieldCheck className="h-4 w-4" />}
          href="/nutri"
          variant={stats.orders_pending_nutri > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Photos à valider"
          value={stats.photos_pending}
          icon={<Camera className="h-4 w-4" />}
          href="/nutri/photos"
          variant={stats.photos_pending > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Feedbacks reçus"
          value={stats.feedbacks_total}
          icon={<MessageCircle className="h-4 w-4" />}
          href="/nutri/feedback"
          variant="success"
        />
        <StatCard
          label="Déplacements actifs"
          value={stats.active_trips}
          icon={<ClipboardList className="h-4 w-4" />}
          href="/team-manager/trips"
          variant={stats.active_trips > 0 ? "success" : "default"}
        />
      </div>

      <nav className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {[
          { href: "/admin/audit", label: "Audit logs", desc: "Qui a fait quoi, quand" },
          { href: "/resto/export", label: "Export commandes", desc: "Télécharger en Excel" },
          { href: "/nutri/players", label: "Fiches joueurs", desc: "Passeports nutritionnels" },
          { href: "/nutri/feedback", label: "Feedbacks joueurs", desc: "Avis satisfaction repas" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors"
          >
            <p className="font-medium text-sm">{item.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
          </Link>
        ))}
      </nav>
    </div>
  );
}
