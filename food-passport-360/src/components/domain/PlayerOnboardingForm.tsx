"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ChevronLeft, Save, Lock, User, Utensils, Plane, Trophy } from "lucide-react";
import type { FPPlayer, FPOnboardingForm } from "@/lib/supabase/food-passport.types";
import { savePlayerAction, saveFormAction } from "@/app/[locale]/(nutri)/nutri/players/[id]/actions";
import PlayerPhotoUpload from "./PlayerPhotoUpload";

interface Props {
  player: FPPlayer;
  form: FPOnboardingForm | null;
}

type Tab = "identity" | "operational" | "sensitive";

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "0.5px solid rgba(255,255,255,0.10)",
  borderRadius: "12px",
  color: "var(--foreground)",
  padding: "8px 12px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
};

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "0.5px solid rgba(255,255,255,0.07)",
  borderRadius: "20px",
  padding: "16px",
};

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 py-2 text-xs font-medium transition-colors"
      style={{
        borderBottom: active
          ? "2px solid var(--color-active)"
          : "2px solid transparent",
        color: active ? "var(--color-active)" : "rgba(255,255,255,0.40)",
        background: "transparent",
      }}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        {label}
        {required && <span style={{ color: "var(--danger)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionDivider({ icon: Icon, label }: { icon?: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 pt-2" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
}

export default function PlayerOnboardingForm({ player, form }: Props) {
  const t = useTranslations("nutri");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<Tab>("identity");
  const [toast, setToast] = useState<string | null>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(player.photo_url);
  const [firstName, setFirstName] = useState(player.first_name);
  const [lastName, setLastName] = useState(player.last_name);
  const [jerseyNumber, setJerseyNumber] = useState(String(player.jersey_number ?? ""));
  const [position, setPosition] = useState(player.position ?? "");
  const [squadGroup, setSquadGroup] = useState(player.squad_group ?? "");
  const [status, setStatus] = useState(player.status);
  const [preferredLang, setPreferredLang] = useState(player.preferred_lang);

  const [weightKg, setWeightKg] = useState(String(player.weight_kg ?? ""));
  const [heightCm, setHeightCm] = useState(String(player.height_cm ?? ""));
  const [bodyObjectives, setBodyObjectives] = useState(player.body_objectives ?? "");
  const [medicalNotes, setMedicalNotes] = useState(player.medical_notes ?? "");
  const [privateNutriNotes, setPrivateNutriNotes] = useState(player.private_nutri_notes ?? "");

  const [dietType, setDietType] = useState(form?.diet_type ?? "");
  const [mealRhythm, setMealRhythm] = useState(form?.meal_rhythm ?? "");
  const [refusedFoods, setRefusedFoods] = useState(form?.refused_foods ?? "");
  const [refusedTextures, setRefusedTextures] = useState(form?.refused_textures ?? "");
  const [spiceTolerance, setSpiceTolerance] = useState(form?.spice_tolerance ?? "");
  const [waterType, setWaterType] = useState(form?.water_type ?? "");
  const [preferredDrinks, setPreferredDrinks] = useState(form?.preferred_drinks ?? "");
  const [avoidedDrinks, setAvoidedDrinks] = useState(form?.avoided_drinks ?? "");
  const [preferredCuisine, setPreferredCuisine] = useState(form?.preferred_cuisine ?? "");
  const [comfortFoods, setComfortFoods] = useState(form?.comfort_foods ?? "");
  const [playerLikes, setPlayerLikes] = useState(form?.player_likes ?? "");
  const [playerDislikes, setPlayerDislikes] = useState(form?.player_dislikes ?? "");
  const [hotelBreakfastPref, setHotelBreakfastPref] = useState(form?.hotel_breakfast_pref ?? "");
  const [favPreMatchDish, setFavPreMatchDish] = useState(form?.fav_pre_match_dish ?? "");
  const [favPostMatchDish, setFavPostMatchDish] = useState(form?.fav_post_match_dish ?? "");
  const [playerFreeNotes, setPlayerFreeNotes] = useState(form?.player_free_notes ?? "");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleSave() {
    startTransition(async () => {
      const [pErr, fErr] = await Promise.all([
        savePlayerAction(player.id, {
          first_name: firstName,
          last_name: lastName,
          jersey_number: jerseyNumber ? Number(jerseyNumber) : null,
          position: position as FPPlayer["position"] || null,
          squad_group: squadGroup || null,
          status: status,
          preferred_lang: preferredLang,
          weight_kg: weightKg ? Number(weightKg) : null,
          height_cm: heightCm ? Number(heightCm) : null,
          body_objectives: bodyObjectives || null,
          medical_notes: medicalNotes || null,
          private_nutri_notes: privateNutriNotes || null,
        }),
        saveFormAction(player.id, {
          diet_type: dietType || null,
          meal_rhythm: mealRhythm || null,
          refused_foods: refusedFoods || null,
          refused_textures: refusedTextures || null,
          spice_tolerance: spiceTolerance || null,
          water_type: waterType || null,
          preferred_drinks: preferredDrinks || null,
          avoided_drinks: avoidedDrinks || null,
          preferred_cuisine: preferredCuisine || null,
          comfort_foods: comfortFoods || null,
          player_likes: playerLikes || null,
          player_dislikes: playerDislikes || null,
          hotel_breakfast_pref: hotelBreakfastPref || null,
          fav_pre_match_dish: favPreMatchDish || null,
          fav_post_match_dish: favPostMatchDish || null,
          player_free_notes: playerFreeNotes || null,
        }),
      ]);

      if (pErr.error || fErr.error) {
        showToast(pErr.error ?? fErr.error ?? tc("error"));
      } else {
        showToast(tc("saved"));
      }
    });
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Back + Save header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push(`/${locale}/nutri`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {tc("back")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="btn-primary flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          <Save className="h-3.5 w-3.5" />
          {isPending ? tc("saving") : tc("save")}
        </button>
      </div>

      {/* Player header */}
      <div className="flex items-center gap-4">
        <PlayerPhotoUpload
          playerId={player.id}
          currentPhotoUrl={photoUrl}
          initials={`${player.first_name[0]}${player.last_name[0]}`}
          onSuccess={(url) => setPhotoUrl(url)}
        />
        <div>
          <h1 className="font-bold text-base">
            {firstName} {lastName}
          </h1>
          <p className="text-xs text-muted-foreground">{t("onboardingForm")}</p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex"
        style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}
      >
        <TabButton active={activeTab === "identity"} onClick={() => setActiveTab("identity")}>
          <span className="flex items-center justify-center gap-1">
            <User className="h-3 w-3" />
            {t("tabIdentity")}
          </span>
        </TabButton>
        <TabButton active={activeTab === "operational"} onClick={() => setActiveTab("operational")}>
          <span className="flex items-center justify-center gap-1">
            <Utensils className="h-3 w-3" />
            {t("tabFood")}
          </span>
        </TabButton>
        <TabButton active={activeTab === "sensitive"} onClick={() => setActiveTab("sensitive")}>
          <span className="flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />
            {t("tabSensitive")}
          </span>
        </TabButton>
      </div>

      {/* Tab: Identity */}
      {activeTab === "identity" && (
        <div style={CARD} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("field.firstName")} required>
              <input style={INPUT_STYLE} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label={t("field.lastName")} required>
              <input style={INPUT_STYLE} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("field.jerseyNumber")}>
              <input type="number" style={INPUT_STYLE} value={jerseyNumber} onChange={(e) => setJerseyNumber(e.target.value)} min={1} max={99} />
            </Field>
            <Field label={t("field.position")}>
              <select style={{ ...INPUT_STYLE, cursor: "pointer" }} value={position} onChange={(e) => setPosition(e.target.value)}>
                <option value="" style={{ background: "#07080f" }}>—</option>
                <option value="gardien" style={{ background: "#07080f" }}>{t("position.gardien")}</option>
                <option value="defenseur" style={{ background: "#07080f" }}>{t("position.defenseur")}</option>
                <option value="milieu" style={{ background: "#07080f" }}>{t("position.milieu")}</option>
                <option value="attaquant" style={{ background: "#07080f" }}>{t("position.attaquant")}</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("field.squadGroup")}>
              <input style={INPUT_STYLE} value={squadGroup} onChange={(e) => setSquadGroup(e.target.value)} placeholder="A, B, U21…" />
            </Field>
            <Field label={t("field.status")}>
              <select style={{ ...INPUT_STYLE, cursor: "pointer" }} value={status} onChange={(e) => setStatus(e.target.value as FPPlayer["status"])}>
                <option value="actif" style={{ background: "#07080f" }}>{t("playerStatus.actif")}</option>
                <option value="en_test" style={{ background: "#07080f" }}>{t("playerStatus.en_test")}</option>
                <option value="blesse" style={{ background: "#07080f" }}>{t("playerStatus.blesse")}</option>
                <option value="retour_blessure" style={{ background: "#07080f" }}>{t("playerStatus.retour_blessure")}</option>
                <option value="inactif" style={{ background: "#07080f" }}>{t("playerStatus.inactif")}</option>
              </select>
            </Field>
          </div>
          <Field label={t("field.preferredLang")}>
            <select style={{ ...INPUT_STYLE, cursor: "pointer" }} value={preferredLang} onChange={(e) => setPreferredLang(e.target.value as FPPlayer["preferred_lang"])}>
              <option value="fr" style={{ background: "#07080f" }}>Français</option>
              <option value="en" style={{ background: "#07080f" }}>English</option>
              <option value="es" style={{ background: "#07080f" }}>Español</option>
              <option value="it" style={{ background: "#07080f" }}>Italiano</option>
              <option value="pt" style={{ background: "#07080f" }}>Português</option>
              <option value="ar" style={{ background: "#07080f" }}>العربية</option>
            </select>
          </Field>
        </div>
      )}

      {/* Tab: Operational */}
      {activeTab === "operational" && (
        <div style={CARD} className="space-y-4">
          <SectionDivider icon={Utensils} label={t("section.generalFood")} />
          <Field label={t("field.dietType")}>
            <input style={INPUT_STYLE} value={dietType} onChange={(e) => setDietType(e.target.value)} placeholder={t("placeholder.dietType")} />
          </Field>
          <Field label={t("field.mealRhythm")}>
            <input style={INPUT_STYLE} value={mealRhythm} onChange={(e) => setMealRhythm(e.target.value)} placeholder={t("placeholder.mealRhythm")} />
          </Field>

          <SectionDivider label={t("section.restrictions")} />
          <Field label={t("field.refusedFoods")}>
            <textarea style={{ ...INPUT_STYLE, resize: "none" }} rows={2} value={refusedFoods} onChange={(e) => setRefusedFoods(e.target.value)} placeholder={t("placeholder.refusedFoods")} />
          </Field>
          <Field label={t("field.refusedTextures")}>
            <input style={INPUT_STYLE} value={refusedTextures} onChange={(e) => setRefusedTextures(e.target.value)} />
          </Field>
          <Field label={t("field.spiceTolerance")}>
            <input style={INPUT_STYLE} value={spiceTolerance} onChange={(e) => setSpiceTolerance(e.target.value)} placeholder={t("placeholder.spiceTolerance")} />
          </Field>

          <SectionDivider label={t("section.drinks")} />
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("field.waterType")}>
              <input style={INPUT_STYLE} value={waterType} onChange={(e) => setWaterType(e.target.value)} placeholder={t("placeholder.waterType")} />
            </Field>
            <Field label={t("field.preferredDrinks")}>
              <input style={INPUT_STYLE} value={preferredDrinks} onChange={(e) => setPreferredDrinks(e.target.value)} />
            </Field>
          </div>
          <Field label={t("field.avoidedDrinks")}>
            <input style={INPUT_STYLE} value={avoidedDrinks} onChange={(e) => setAvoidedDrinks(e.target.value)} />
          </Field>

          <SectionDivider label={t("section.preferences")} />
          <Field label={t("field.preferredCuisine")}>
            <input style={INPUT_STYLE} value={preferredCuisine} onChange={(e) => setPreferredCuisine(e.target.value)} placeholder={t("placeholder.preferredCuisine")} />
          </Field>
          <Field label={t("field.comfortFoods")}>
            <textarea style={{ ...INPUT_STYLE, resize: "none" }} rows={2} value={comfortFoods} onChange={(e) => setComfortFoods(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("field.playerLikes")}>
              <textarea style={{ ...INPUT_STYLE, resize: "none" }} rows={2} value={playerLikes} onChange={(e) => setPlayerLikes(e.target.value)} />
            </Field>
            <Field label={t("field.playerDislikes")}>
              <textarea style={{ ...INPUT_STYLE, resize: "none" }} rows={2} value={playerDislikes} onChange={(e) => setPlayerDislikes(e.target.value)} />
            </Field>
          </div>

          <SectionDivider icon={Plane} label={t("section.travel")} />
          <Field label={t("field.hotelBreakfastPref")}>
            <textarea style={{ ...INPUT_STYLE, resize: "none" }} rows={2} value={hotelBreakfastPref} onChange={(e) => setHotelBreakfastPref(e.target.value)} />
          </Field>

          <SectionDivider icon={Trophy} label={t("section.matchDay")} />
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("field.favPreMatchDish")}>
              <input style={INPUT_STYLE} value={favPreMatchDish} onChange={(e) => setFavPreMatchDish(e.target.value)} />
            </Field>
            <Field label={t("field.favPostMatchDish")}>
              <input style={INPUT_STYLE} value={favPostMatchDish} onChange={(e) => setFavPostMatchDish(e.target.value)} />
            </Field>
          </div>

          <Field label={t("field.playerFreeNotes")}>
            <textarea style={{ ...INPUT_STYLE, resize: "none" }} rows={3} value={playerFreeNotes} onChange={(e) => setPlayerFreeNotes(e.target.value)} placeholder={t("placeholder.playerFreeNotes")} />
          </Field>
        </div>
      )}

      {/* Tab: Sensitive (nutri only) */}
      {activeTab === "sensitive" && (
        <div className="space-y-4">
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{
              background: "rgba(255,77,106,0.06)",
              border: "0.5px solid rgba(255,77,106,0.20)",
              borderRadius: "12px",
            }}
          >
            <Lock className="h-4 w-4 flex-shrink-0" style={{ color: "var(--danger)" }} />
            <p className="text-xs" style={{ color: "var(--danger)" }}>{t("sensitiveData")}</p>
          </div>

          <div style={CARD} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("field.weightKg")}>
                <input type="number" style={INPUT_STYLE} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="75" step="0.1" />
              </Field>
              <Field label={t("field.heightCm")}>
                <input type="number" style={INPUT_STYLE} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="180" />
              </Field>
            </div>
            <Field label={t("field.bodyObjectives")}>
              <textarea style={{ ...INPUT_STYLE, resize: "none" }} rows={2} value={bodyObjectives} onChange={(e) => setBodyObjectives(e.target.value)} placeholder={t("placeholder.bodyObjectives")} />
            </Field>
            <Field label={t("field.medicalNotes")}>
              <textarea style={{ ...INPUT_STYLE, resize: "none" }} rows={3} value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)} placeholder={t("placeholder.medicalNotes")} />
            </Field>
            <Field label={t("field.privateNutriNotes")}>
              <textarea style={{ ...INPUT_STYLE, resize: "none" }} rows={3} value={privateNutriNotes} onChange={(e) => setPrivateNutriNotes(e.target.value)} placeholder={t("placeholder.privateNutriNotes")} />
            </Field>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 text-sm px-4 py-2.5 shadow-lg"
          style={{
            background: "var(--foreground)",
            color: "var(--background)",
            borderRadius: "12px",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
