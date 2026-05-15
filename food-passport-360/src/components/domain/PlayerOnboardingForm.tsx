"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ChevronLeft, Save, Lock, User, Utensils, Heart, Plane, Trophy } from "lucide-react";
import type { FPPlayer, FPOnboardingForm } from "@/lib/supabase/food-passport.types";
import { savePlayerAction, saveFormAction } from "@/app/[locale]/(nutri)/nutri/players/[id]/actions";
import PlayerPhotoUpload from "./PlayerPhotoUpload";

interface Props {
  player: FPPlayer;
  form: FPOnboardingForm | null;
}

type Tab = "identity" | "operational" | "sensitive";

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
      className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  children,
  required,
  optional,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
        {optional && <span className="text-muted-foreground/60 text-[10px]">(optionnel)</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50";
const TEXTAREA = `${INPUT} resize-none`;
const SELECT = `${INPUT} cursor-pointer`;

export default function PlayerOnboardingForm({ player, form }: Props) {
  const t = useTranslations("nutri");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<Tab>("identity");
  const [toast, setToast] = useState<string | null>(null);

  // Player fields
  const [photoUrl, setPhotoUrl] = useState<string | null>(player.photo_url);
  const [firstName, setFirstName] = useState(player.first_name);
  const [lastName, setLastName] = useState(player.last_name);
  const [jerseyNumber, setJerseyNumber] = useState(String(player.jersey_number ?? ""));
  const [position, setPosition] = useState(player.position ?? "");
  const [squadGroup, setSquadGroup] = useState(player.squad_group ?? "");
  const [status, setStatus] = useState(player.status);
  const [preferredLang, setPreferredLang] = useState(player.preferred_lang);

  // Sensitive fields (nutri only)
  const [weightKg, setWeightKg] = useState(String(player.weight_kg ?? ""));
  const [heightCm, setHeightCm] = useState(String(player.height_cm ?? ""));
  const [bodyObjectives, setBodyObjectives] = useState(player.body_objectives ?? "");
  const [medicalNotes, setMedicalNotes] = useState(player.medical_notes ?? "");
  const [privateNutriNotes, setPrivateNutriNotes] = useState(player.private_nutri_notes ?? "");

  // Form fields (operational)
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
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
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
      <div className="flex gap-1 p-1 rounded-xl bg-muted">
        <TabButton active={activeTab === "identity"} onClick={() => setActiveTab("identity")}>
          <span className="flex items-center justify-center gap-1"><User className="h-3 w-3" />Identité</span>
        </TabButton>
        <TabButton active={activeTab === "operational"} onClick={() => setActiveTab("operational")}>
          <span className="flex items-center justify-center gap-1"><Utensils className="h-3 w-3" />Alimentation</span>
        </TabButton>
        <TabButton active={activeTab === "sensitive"} onClick={() => setActiveTab("sensitive")}>
          <span className="flex items-center justify-center gap-1"><Lock className="h-3 w-3" />Nutri seul</span>
        </TabButton>
      </div>

      {/* Tab: Identity */}
      {activeTab === "identity" && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("field.firstName")} required>
              <input className={INPUT} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label={t("field.lastName")} required>
              <input className={INPUT} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("field.jerseyNumber")}>
              <input type="number" className={INPUT} value={jerseyNumber} onChange={(e) => setJerseyNumber(e.target.value)} min={1} max={99} />
            </Field>
            <Field label={t("field.position")}>
              <select className={SELECT} value={position} onChange={(e) => setPosition(e.target.value)}>
                <option value="">—</option>
                <option value="gardien">Gardien</option>
                <option value="defenseur">Défenseur</option>
                <option value="milieu">Milieu</option>
                <option value="attaquant">Attaquant</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("field.squadGroup")}>
              <input className={INPUT} value={squadGroup} onChange={(e) => setSquadGroup(e.target.value)} placeholder="A, B, U21…" />
            </Field>
            <Field label={t("field.status")}>
              <select className={SELECT} value={status} onChange={(e) => setStatus(e.target.value as FPPlayer["status"])}>
                <option value="actif">Actif</option>
                <option value="en_test">En test</option>
                <option value="blesse">Blessé</option>
                <option value="retour_blessure">Retour blessure</option>
                <option value="inactif">Inactif</option>
              </select>
            </Field>
          </div>
          <Field label={t("field.preferredLang")}>
            <select className={SELECT} value={preferredLang} onChange={(e) => setPreferredLang(e.target.value as FPPlayer["preferred_lang"])}>
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="it">Italiano</option>
              <option value="pt">Português</option>
              <option value="ar">العربية</option>
            </select>
          </Field>
        </div>
      )}

      {/* Tab: Operational (alimentaire) */}
      {activeTab === "operational" && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-border">
            <Utensils className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alimentation générale</span>
          </div>
          <Field label="Type d'alimentation">
            <input className={INPUT} value={dietType} onChange={(e) => setDietType(e.target.value)} placeholder="Omnivore, végétarien, halal…" />
          </Field>
          <Field label="Rythme des repas">
            <input className={INPUT} value={mealRhythm} onChange={(e) => setMealRhythm(e.target.value)} placeholder="3 repas / jour, collations…" />
          </Field>

          <div className="flex items-center gap-2 pb-1 border-b border-border pt-2">
            <Heart className="h-4 w-4 text-destructive" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Restrictions</span>
          </div>
          <Field label="Aliments refusés">
            <textarea className={TEXTAREA} rows={2} value={refusedFoods} onChange={(e) => setRefusedFoods(e.target.value)} placeholder="Lait de vache, fruits de mer…" />
          </Field>
          <Field label="Textures évitées">
            <input className={INPUT} value={refusedTextures} onChange={(e) => setRefusedTextures(e.target.value)} placeholder="Très épicé, trop gras…" />
          </Field>
          <Field label="Tolérance épices">
            <input className={INPUT} value={spiceTolerance} onChange={(e) => setSpiceTolerance(e.target.value)} placeholder="Faible / Moyenne / Élevée" />
          </Field>

          <div className="flex items-center gap-2 pb-1 border-b border-border pt-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Boissons</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type d'eau">
              <input className={INPUT} value={waterType} onChange={(e) => setWaterType(e.target.value)} placeholder="Plate, gazeuse…" />
            </Field>
            <Field label="Boissons préférées">
              <input className={INPUT} value={preferredDrinks} onChange={(e) => setPreferredDrinks(e.target.value)} />
            </Field>
          </div>
          <Field label="Boissons à éviter">
            <input className={INPUT} value={avoidedDrinks} onChange={(e) => setAvoidedDrinks(e.target.value)} />
          </Field>

          <div className="flex items-center gap-2 pb-1 border-b border-border pt-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Préférences</span>
          </div>
          <Field label="Cuisines préférées">
            <input className={INPUT} value={preferredCuisine} onChange={(e) => setPreferredCuisine(e.target.value)} placeholder="Méditerranéenne, africaine…" />
          </Field>
          <Field label="Plats réconfort">
            <textarea className={TEXTAREA} rows={2} value={comfortFoods} onChange={(e) => setComfortFoods(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="J'aime">
              <textarea className={TEXTAREA} rows={2} value={playerLikes} onChange={(e) => setPlayerLikes(e.target.value)} />
            </Field>
            <Field label="Je n'aime pas">
              <textarea className={TEXTAREA} rows={2} value={playerDislikes} onChange={(e) => setPlayerDislikes(e.target.value)} />
            </Field>
          </div>

          <div className="flex items-center gap-2 pb-1 border-b border-border pt-2">
            <Plane className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">En déplacement</span>
          </div>
          <Field label="Petit-déjeuner hôtel">
            <textarea className={TEXTAREA} rows={2} value={hotelBreakfastPref} onChange={(e) => setHotelBreakfastPref(e.target.value)} />
          </Field>

          <div className="flex items-center gap-2 pb-1 border-b border-border pt-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Jour de match</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plat pré-match">
              <input className={INPUT} value={favPreMatchDish} onChange={(e) => setFavPreMatchDish(e.target.value)} />
            </Field>
            <Field label="Plat post-match">
              <input className={INPUT} value={favPostMatchDish} onChange={(e) => setFavPostMatchDish(e.target.value)} />
            </Field>
          </div>

          <Field label="Notes libres joueur">
            <textarea className={TEXTAREA} rows={3} value={playerFreeNotes} onChange={(e) => setPlayerFreeNotes(e.target.value)} placeholder="Remarques du joueur…" />
          </Field>
        </div>
      )}

      {/* Tab: Sensitive (nutri only) */}
      {activeTab === "sensitive" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2">
            <Lock className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-xs text-destructive">{t("sensitiveData")}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("field.weightKg")}>
                <input type="number" className={INPUT} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="75" step="0.1" />
              </Field>
              <Field label={t("field.heightCm")}>
                <input type="number" className={INPUT} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="180" />
              </Field>
            </div>
            <Field label={t("field.bodyObjectives")}>
              <textarea className={TEXTAREA} rows={2} value={bodyObjectives} onChange={(e) => setBodyObjectives(e.target.value)} placeholder="Prise de masse, sèche, maintien…" />
            </Field>
            <Field label={t("field.medicalNotes")}>
              <textarea className={TEXTAREA} rows={3} value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)} placeholder="Antécédents médicaux, contre-indications…" />
            </Field>
            <Field label={t("field.privateNutriNotes")}>
              <textarea className={TEXTAREA} rows={3} value={privateNutriNotes} onChange={(e) => setPrivateNutriNotes(e.target.value)} placeholder="Notes internes nutritionniste…" />
            </Field>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-foreground text-background text-sm px-4 py-2.5 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
