"use client";

import { useTranslations } from "next-intl";
import { User, UtensilsCrossed, Heart, Plane, Trophy, Activity } from "lucide-react";
import type { FPPlayer, FPOnboardingForm, FPNutritionTracking } from "@/lib/supabase/food-passport.types";
import AvatarEvolution from "./AvatarEvolution";
import { PageHeader, StatCard, EmptyState } from "@/components/ui";

interface Props {
  player: FPPlayer | null;
  form: FPOnboardingForm | null;
  tracking?: FPNutritionTracking | null;
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="p-4 space-y-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center"
          style={{ background: "rgba(77,255,180,0.08)", borderRadius: "10px" }}
        >
          <Icon className="h-4 w-4 text-active" />
        </div>
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

function PlayerStatusPill({ status }: { status: FPPlayer["status"] }) {
  const t = useTranslations("passport.status");
  const styles: Record<FPPlayer["status"], { bg: string; color: string }> = {
    actif:           { bg: "rgba(77,255,180,0.10)",  color: "var(--color-active)" },
    en_test:         { bg: "rgba(0,91,172,0.15)",    color: "var(--color-om)" },
    blesse:          { bg: "rgba(255,77,106,0.10)",  color: "var(--danger)" },
    retour_blessure: { bg: "rgba(255,215,0,0.10)",   color: "var(--warning)" },
    inactif:         { bg: "var(--muted)",           color: "var(--muted-foreground)" },
  };
  const s = styles[status];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: "999px",
        padding: "2px 10px",
        fontSize: "11px",
        fontWeight: 600,
      }}
    >
      {t(status)}
    </span>
  );
}

function scoreVariant(score: number | null): "default" | "success" | "warning" | "danger" {
  if (score == null) return "default";
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

function hydrationVariant(h: number | null): "default" | "success" | "warning" {
  if (h == null) return "default";
  if (h >= 8) return "success";
  if (h < 5) return "warning";
  return "default";
}

function caloriesVariant(c: number | null): "default" | "success" | "warning" {
  if (c == null) return "default";
  if (c >= 2200 && c <= 3500) return "success";
  return "warning";
}

export default function PlayerPassportView({ player, form, tracking }: Props) {
  const t = useTranslations("passport");
  const tf = useTranslations("passport.field");
  const tc = useTranslations("common");
  const tt = useTranslations("tracking");

  if (!player) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <EmptyState
          icon={<User className="h-7 w-7" />}
          title={t("noPassport")}
          description={t("noPassportDesc")}
        />
      </div>
    );
  }

  const position = player.position
    ? t(`position.${player.position}` as Parameters<typeof t>[0])
    : null;

  const subtitle = [
    player.jersey_number != null ? `#${player.jersey_number}` : null,
    position,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        {player.photo_url ? (
          <img
            src={player.photo_url}
            alt={`${player.first_name} ${player.last_name}`}
            className="h-16 w-16 object-cover flex-shrink-0"
            style={{ borderRadius: "16px" }}
          />
        ) : (
          <div
            className="flex h-16 w-16 items-center justify-center text-active font-bold text-xl flex-shrink-0"
            style={{ background: "rgba(77,255,180,0.08)", borderRadius: "16px" }}
          >
            {player.first_name[0]}{player.last_name[0]}
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1.5">
          <PageHeader
            label={t("myPassport")}
            title={`${player.first_name} ${player.last_name}`}
            subtitle={subtitle || undefined}
          />
          <PlayerStatusPill status={player.status} />
        </div>
      </div>

      {/* Stats row */}
      {tracking && (
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            label={tt("calories")}
            value={tracking.calories != null ? `${tracking.calories} kcal` : "—"}
            variant={caloriesVariant(tracking.calories)}
            icon={<Activity className="h-4 w-4" />}
          />
          <StatCard
            label={tt("hydration")}
            value={tracking.hydration != null ? `${tracking.hydration} L` : "—"}
            variant={hydrationVariant(tracking.hydration)}
          />
          <StatCard
            label={tt("scoreNutrition")}
            value={tracking.score_nutrition != null ? tracking.score_nutrition : "—"}
            variant={scoreVariant(tracking.score_nutrition)}
          />
        </div>
      )}

      {/* AvatarEvolution */}
      {tracking ? (
        <section
          className="p-4 space-y-3"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "0.5px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center"
              style={{ background: "rgba(77,255,180,0.08)", borderRadius: "10px" }}
            >
              <Activity className="h-4 w-4 text-active" />
            </div>
            <h2 className="font-semibold text-sm">{tt("title")}</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {new Date(tracking.tracking_date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
              })}
            </span>
          </div>
          <AvatarEvolution score={tracking.score_nutrition} size="sm" />
          {tracking.nutri_comment && (
            <div
              className="px-3 py-2"
              style={{ background: "var(--muted)", borderRadius: "12px" }}
            >
              <p className="text-xs font-medium text-muted-foreground mb-0.5">
                {tt("recommendations")}
              </p>
              <p className="text-sm">{tracking.nutri_comment}</p>
            </div>
          )}
        </section>
      ) : (
        <div
          className="p-4 text-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "0.5px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
          }}
        >
          <p className="text-sm text-muted-foreground">{tt("noTracking")}</p>
        </div>
      )}

      {form && (
        <>
          <Section icon={UtensilsCrossed} title={t("section.diet")}>
            <dl className="space-y-2">
              <Field label={tf("dietType")} value={form.diet_type} />
              <Field label={tf("mealRhythm")} value={form.meal_rhythm} />
              <Field label={tf("spiceTolerance")} value={form.spice_tolerance} />
              <Field label={tf("waterType")} value={form.water_type} />
            </dl>
          </Section>

          {(form.refused_foods || form.refused_textures) && (
            <Section icon={Heart} title={t("section.allergies")}>
              <dl className="space-y-2">
                <Field label={tf("refusedFoods")} value={form.refused_foods} />
                <Field label={tf("refusedTextures")} value={form.refused_textures} />
              </dl>
            </Section>
          )}

          {(form.preferred_cuisine || form.comfort_foods || form.player_likes || form.player_dislikes) && (
            <Section icon={Heart} title={t("section.preferences")}>
              <dl className="space-y-2">
                <Field label={tf("preferredCuisine")} value={form.preferred_cuisine} />
                <Field label={tf("comfortFoods")} value={form.comfort_foods} />
                <Field label={tf("preferredDrinks")} value={form.preferred_drinks} />
                <Field label={tf("avoidedDrinks")} value={form.avoided_drinks} />
                <Field label={tf("playerLikes")} value={form.player_likes} />
                <Field label={tf("playerDislikes")} value={form.player_dislikes} />
              </dl>
            </Section>
          )}

          {form.hotel_breakfast_pref && (
            <Section icon={Plane} title={t("section.travel")}>
              <dl className="space-y-2">
                <Field label={tf("hotelBreakfastPref")} value={form.hotel_breakfast_pref} />
              </dl>
            </Section>
          )}

          {(form.fav_pre_match_dish || form.fav_post_match_dish) && (
            <Section icon={Trophy} title={t("section.matchDay")}>
              <dl className="space-y-2">
                <Field label={tf("favPreMatchDish")} value={form.fav_pre_match_dish} />
                <Field label={tf("favPostMatchDish")} value={form.fav_post_match_dish} />
              </dl>
            </Section>
          )}
        </>
      )}

      {!form && (
        <p className="text-center text-sm text-muted-foreground py-8">{tc("noData")}</p>
      )}
    </div>
  );
}
