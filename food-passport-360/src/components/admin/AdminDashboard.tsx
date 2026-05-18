"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  ShieldCheck,
  User,
  ChefHat,
  Building2,
  UtensilsCrossed,
  Briefcase,
  BarChart2,
  Users,
  Utensils,
  Camera,
  MessageCircle,
  ClipboardList,
  FileText,
  BookOpen,
} from "lucide-react";
import type { GlobalStats } from "@/lib/supabase/queries";

interface Props {
  stats: GlobalStats;
}

/* ── Stat card ────────────────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  href: string;
  variant?: "default" | "warning" | "success";
  index: number;
}

function StatCard({ label, value, icon: Icon, href, variant = "default", index }: StatCardProps) {
  const ring =
    variant === "warning"
      ? "border-warning/30 bg-warning/5"
      : variant === "success"
      ? "border-success/30 bg-success/5"
      : "border-border bg-card";

  const textColor =
    variant === "warning" ? "text-warning" : variant === "success" ? "text-success" : "text-active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={href}
        className={`group block rounded-2xl border p-4 transition-opacity hover:opacity-75 ${ring}`}
      >
        <div className="flex items-start justify-between gap-2">
          <span className={`mt-0.5 ${textColor}`}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-2xl font-bold tabular-nums text-foreground">{value}</span>
        </div>
        <p className="mt-3 text-xs font-medium text-muted-foreground">{label}</p>
      </Link>
    </motion.div>
  );
}

/* ── Role nav card ────────────────────────────────────────────────── */
interface RoleCardProps {
  href: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  accentClass: string;
  index: number;
}

function RoleCard({ href, label, desc, icon: Icon, accentClass, index }: RoleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 + index * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={href}
        className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-border/60 hover:bg-card/80 active:scale-[0.98]"
      >
        {/* Icon bubble */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-card/60 ${accentClass} transition-transform duration-150 group-hover:scale-105`}
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{label}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{desc}</p>
        </div>

        {/* Arrow */}
        <span className="shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5">
          →
        </span>
      </Link>
    </motion.div>
  );
}

/* ── Main component ───────────────────────────────────────────────── */
export default function AdminDashboard({ stats }: Props) {
  const t = useTranslations("admin");
  const tr = useTranslations("roles");

  const statItems: Omit<StatCardProps, "index">[] = [
    {
      label: t("statsPlayers"),
      value: stats.total_players,
      icon: Users,
      href: "/nutri/players",
      variant: "default",
    },
    {
      label: t("statsOrdersToday"),
      value: stats.orders_today,
      icon: Utensils,
      href: "/resto",
      variant: "default",
    },
    {
      label: t("statsPendingNutri"),
      value: stats.orders_pending_nutri,
      icon: ShieldCheck,
      href: "/nutri",
      variant: stats.orders_pending_nutri > 0 ? "warning" : "default",
    },
    {
      label: t("statsPhotos"),
      value: stats.photos_pending,
      icon: Camera,
      href: "/nutri/photos",
      variant: stats.photos_pending > 0 ? "warning" : "default",
    },
    {
      label: t("statsFeedbacks"),
      value: stats.feedbacks_total,
      icon: MessageCircle,
      href: "/nutri/feedback",
      variant: "success",
    },
    {
      label: t("statsTrips"),
      value: stats.active_trips,
      icon: ClipboardList,
      href: "/team-manager/trips",
      variant: stats.active_trips > 0 ? "success" : "default",
    },
  ];

  const roleLinks: Omit<RoleCardProps, "index">[] = [
    {
      href: "/nutri",
      label: tr("admin_nutri"),
      desc: t("navNutriDesc"),
      icon: ShieldCheck,
      accentClass: "text-active",
    },
    {
      href: "/joueur",
      label: tr("joueur"),
      desc: t("navJoueurDesc"),
      icon: User,
      accentClass: "text-energy",
    },
    {
      href: "/cuisine",
      label: tr("cuisine"),
      desc: t("navCuisineDesc"),
      icon: ChefHat,
      accentClass: "text-gold",
    },
    {
      href: "/hotel",
      label: tr("hotel"),
      desc: t("navHotelDesc"),
      icon: Building2,
      accentClass: "text-om",
    },
    {
      href: "/resto",
      label: tr("admin_resto"),
      desc: t("navRestoDesc"),
      icon: UtensilsCrossed,
      accentClass: "text-active",
    },
    {
      href: "/team-manager",
      label: tr("admin_team_manager"),
      desc: t("navManagerDesc"),
      icon: Briefcase,
      accentClass: "text-gold",
    },
    {
      href: "/admin",
      label: tr("direction"),
      desc: t("navDirectionDesc"),
      icon: BarChart2,
      accentClass: "text-energy",
    },
  ];

  const quickLinks = [
    { href: "/admin/audit", label: t("audit.title"), desc: t("audit.subtitle"), icon: FileText },
    { href: "/nutri/players", label: "Fiches joueurs", desc: t("navNutriDesc"), icon: BookOpen },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
      </motion.div>

      {/* Stats grid */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("statsTitle")}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {statItems.map((item, i) => (
            <StatCard key={item.href} {...item} index={i} />
          ))}
        </div>
      </section>

      {/* Role navigation */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("navTitle")}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {roleLinks.map((item, i) => (
            <RoleCard key={item.href} {...item} index={i} />
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("quickLinks")}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {quickLinks.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.55 + i * 0.06 }}
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:opacity-75"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
