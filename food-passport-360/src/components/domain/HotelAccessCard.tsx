"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, ShieldOff, Clock, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HotelAccessWithProfile } from "@/lib/supabase/queries";
import { revokeHotelAccessAction } from "@/app/[locale]/(team-manager)/team-manager/trips/actions";

interface Props {
  access: HotelAccessWithProfile;
  tripId: string;
  rawToken?: string | null; // affiché seulement à la création (une seule fois)
}

export default function HotelAccessCard({ access, tripId, rawToken }: Props) {
  const t = useTranslations("trips");
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState(!!access.revoked_at);

  const isExpired = new Date(access.expires_at) < new Date();
  const isActive = !revoked && !isExpired;

  function handleCopy() {
    if (!rawToken) return;
    navigator.clipboard.writeText(rawToken).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleRevoke() {
    startTransition(async () => {
      const { error } = await revokeHotelAccessAction(access.id, tripId);
      if (!error) setRevoked(true);
    });
  }

  return (
    <div className={cn(
      "rounded-xl border p-3 space-y-2 text-sm",
      isActive ? "border-border bg-card" : "border-border/50 bg-muted/30"
    )}>
      {/* Header: email + status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isActive
            ? <ShieldCheck size={16} className="shrink-0 text-emerald-500" />
            : <ShieldOff size={16} className="shrink-0 text-muted-foreground" />
          }
          <span className="truncate font-medium text-sm">
            {access.profile?.email ?? "—"}
          </span>
        </div>
        <span className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
          isActive
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "bg-muted text-muted-foreground"
        )}>
          {revoked ? t("accessRevoked") : isExpired ? t("accessExpired") : t("accessActive")}
        </span>
      </div>

      {/* Expiry */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Clock size={11} />
        <span>
          {t("accessExpires")} {new Date(access.expires_at).toLocaleDateString("fr-FR", {
            day: "numeric", month: "long", year: "numeric",
            hour: "2-digit", minute: "2-digit"
          })}
        </span>
      </div>

      {/* Raw token — affiché une seule fois à la création */}
      {rawToken && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
          <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 mb-1">
            {t("tokenOnce")}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate font-mono text-[11px] text-foreground">
              {rawToken}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-md p-1.5 hover:bg-amber-500/20 transition-colors"
              aria-label="Copier"
            >
              {copied
                ? <Check size={13} className="text-emerald-500" />
                : <Copy size={13} className="text-amber-700 dark:text-amber-400" />
              }
            </button>
          </div>
        </div>
      )}

      {/* Revoke button */}
      {isActive && (
        <button
          onClick={handleRevoke}
          disabled={isPending}
          className="text-[11px] font-medium text-destructive hover:underline disabled:opacity-50"
        >
          {isPending ? t("revoking") : t("revokeAccess")}
        </button>
      )}
    </div>
  );
}
