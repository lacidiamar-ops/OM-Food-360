"use client";

import { useTranslations } from "next-intl";
import type { FPPlayer, FPOnboardingForm } from "@/lib/supabase/food-passport.types";
import { User, UtensilsCrossed, Heart, Plane, Trophy } from "lucide-react";

interface Props {
  player: FPPlayer | null;
  form: FPOnboardingForm | null;
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
    <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
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

function StatusBadge({ status }: { status: FPPlayer["status"] }) {
  const colors: Record<FPPlayer["status"], string> = {
    actif: "bg-green-500/15 text-green-700 dark:text-green-400",
    en_test: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    blesse: "bg-red-500/15 text-red-700 dark:text-red-400",
    retour_blessure: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
    inactif: "bg-muted text-muted-foreground",
  };
  const t = useTranslations("passport.status");
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}>
      {t(status)}
    </span>
  );
}

export default function PlayerPassportView({ player, form }: Props) {
  const t = useTranslations("passport");
  const tf = useTranslations("passport.field");
  const tc = useTranslations("common");

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h1 className="font-semibold text-base">{t("noPassport")}</h1>
          <p className="text-sm text-muted-foreground">{t("noPassportDesc")}</p>
        </div>
      </div>
    );
  }

  const position = player.position
    ? t(`position.${player.position}` as Parameters<typeof t>[0])
    : null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Header joueur */}
      <div className="flex items-start gap-4">
        {player.photo_url ? (
          <img
            src={player.photo_url}
            alt={`${player.first_name} ${player.last_name}`}
            className="h-16 w-16 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl">
            {player.first_name[0]}{player.last_name[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg leading-tight">
            {player.first_name} {player.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {player.jersey_number != null && `#${player.jersey_number} · `}
            {position}
          </p>
          <div className="mt-1.5">
            <StatusBadge status={player.status} />
          </div>
        </div>
      </div>

      {form && (
        <>
          {/* Alimentation */}
          <Section icon={UtensilsCrossed} title={t("section.diet")}>
            <dl className="space-y-2">
              <Field label={tf("dietType")} value={form.diet_type} />
              <Field label={tf("mealRhythm")} value={form.meal_rhythm} />
              <Field label={tf("spiceTolerance")} value={form.spice_tolerance} />
              <Field label={tf("waterType")} value={form.water_type} />
            </dl>
          </Section>

          {/* Restrictions */}
          {(form.refused_foods || form.refused_textures) && (
            <Section icon={Heart} title={t("section.allergies")}>
              <dl className="space-y-2">
                <Field label={tf("refusedFoods")} value={form.refused_foods} />
                <Field label={tf("refusedTextures")} value={form.refused_textures} />
              </dl>
            </Section>
          )}

          {/* Préférences */}
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

          {/* Déplacement */}
          {form.hotel_breakfast_pref && (
            <Section icon={Plane} title={t("section.travel")}>
              <dl className="space-y-2">
                <Field label={tf("hotelBreakfastPref")} value={form.hotel_breakfast_pref} />
              </dl>
            </Section>
          )}

          {/* Jour de match */}
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
        <p className="text-center text-sm text-muted-foreground py-8">
          {tc("noData")}
        </p>
      )}
    </div>
  );
}
