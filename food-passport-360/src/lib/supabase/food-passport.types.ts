// Manual types for the food_passport PostgreSQL schema
// Tables introspected from project vjulagaprzbnquynwjmt

import type { Database } from "./database.types"

export type UserRole = Database["public"]["Enums"]["user_role"]
export type OrderStatus = Database["public"]["Enums"]["order_status"]
export type OrderPriority = Database["public"]["Enums"]["order_priority"]
export type ServiceType = Database["public"]["Enums"]["service_type"]
export type PlayerStatus = Database["public"]["Enums"]["player_status"]
export type PositionTerrain = Database["public"]["Enums"]["position_terrain"]
export type FormStatus = Database["public"]["Enums"]["form_status"]
export type SupportedLang = Database["public"]["Enums"]["supported_lang"]
export type ArticleCategory = Database["public"]["Enums"]["article_category"]
export type PhotoStatus = Database["public"]["Enums"]["photo_status"]
export type FeedbackTopic = Database["public"]["Enums"]["feedback_topic"]

// ── profiles ──────────────────────────────────────────────
export interface FPProfile {
  id: string
  role: UserRole
  full_name: string
  preferred_lang: SupportedLang | null
  avatar_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

// ── players ───────────────────────────────────────────────
export interface FPPlayer {
  id: string
  profile_id: string
  first_name: string
  last_name: string
  jersey_number: number | null
  position: PositionTerrain | null
  squad_group: string | null
  photo_url: string | null
  date_of_arrival: string | null
  status: PlayerStatus
  preferred_lang: SupportedLang
  // Sensitive — nutri only:
  weight_kg: number | null
  height_cm: number | null
  body_objectives: string | null
  medical_notes: string | null
  private_nutri_notes: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export type FPPlayerOperational = Pick<
  FPPlayer,
  | "id"
  | "profile_id"
  | "first_name"
  | "last_name"
  | "jersey_number"
  | "position"
  | "squad_group"
  | "photo_url"
  | "preferred_lang"
  | "status"
>

// ── player_onboarding_forms ───────────────────────────────
export interface FPOnboardingForm {
  id: string
  player_id: string
  status: FormStatus
  completion_percent: number
  filled_by: string | null
  validated_by: string | null
  validated_at: string | null
  diet_type: string | null
  meal_rhythm: string | null
  regular_foods: string | null
  rare_foods: string | null
  refused_foods: string | null
  refused_textures: string | null
  spice_tolerance: string | null
  water_type: string | null
  preferred_drinks: string | null
  avoided_drinks: string | null
  preferred_cuisine: string | null
  comfort_foods: string | null
  familiar_foods: string | null
  travel_specific_needs: string | null
  hotel_breakfast_pref: string | null
  hotel_room_service_pref: string | null
  frequent_room_requests: string | null
  fav_pre_match_dish: string | null
  fav_post_match_dish: string | null
  fav_travel_dish: string | null
  fav_room_service_dish: string | null
  fav_dessert: string | null
  fav_drink: string | null
  player_likes: string | null
  player_dislikes: string | null
  player_free_notes: string | null
  // Sensitive — nutri only:
  private_nutri_remarks: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

// ── orders ────────────────────────────────────────────────
export interface FPOrder {
  id: string
  reference: string
  player_id: string
  trip_id: string | null
  hotel_id: string | null
  room_number: string | null
  service: ServiceType
  location_label: string | null
  scheduled_at: string
  deadline: string | null
  status: OrderStatus
  priority: OrderPriority
  validated_by_nutri: string | null
  validated_by_nutri_at: string | null
  nutri_adjustment_notes: string | null
  nutri_refusal_reason: string | null
  validated_by_resto: string | null
  validated_by_resto_at: string | null
  transmitted_to_kitchen_at: string | null
  transmitted_to_hotel_at: string | null
  prep_started_at: string | null
  ready_at: string | null
  delivered_at: string | null
  player_comment_original: string | null
  player_comment_lang: SupportedLang | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

// ── order_items ───────────────────────────────────────────
export interface FPOrderItem {
  id: string
  order_id: string
  article_id: string
  quantity: number
  portion_g: number | null
  player_note: string | null
  nutri_note: string | null
  removed_by_nutri: boolean
  added_by_nutri: boolean
}

export interface FPOrderItemInput {
  article_id: string
  quantity: number
  portion_g?: number | null
  player_note?: string | null
}

// ── article filter for nutri queue ────────────────────────
export interface ArticleFilter {
  category?: ArticleCategory
  validated?: boolean | null   // null = pending (not validated, not blocked)
  blocked?: boolean
  active?: boolean
  search?: string
}

// ── order_validation_logs ─────────────────────────────────
export interface FPOrderValidationLog {
  id: string
  order_id: string
  action: string
  actor_id: string | null
  actor_role: UserRole | null
  from_status: string | null
  to_status: string | null
  notes: string | null
  created_at: string
}

// ── articles ──────────────────────────────────────────────
export interface FPArticle {
  id: string
  name: string
  category: ArticleCategory
  subcategory: string | null
  photo_url: string | null
  short_description: string | null
  standard_portion_g: number | null
  unit: string | null
  // diet flags
  is_halal: boolean
  is_vegetarian: boolean
  is_vegan: boolean
  is_gluten_free: boolean
  is_lactose_free: boolean
  // availability
  available_center: boolean
  available_hotel: boolean
  available_room: boolean
  available_smart_fridge: boolean
  available_match_day: boolean
  available_match_eve: boolean
  available_recovery: boolean
  // validation nutri
  nutri_validated: boolean
  nutri_validated_by: string | null
  nutri_validated_at: string | null
  nutri_blocked: boolean
  nutri_comment: string | null
  // resto
  resto_comment: string | null
  price_eur: number | null
  cost_eur: number | null
  supplier: string | null
  active: boolean
  out_of_stock: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  last_modified_by: string | null
}

export interface FPArticleTranslation {
  id: string
  article_id: string
  lang: SupportedLang
  name: string
  description: string | null
  auto_translated: boolean
  manual_correction: boolean
  updated_at: string
}

// ── menus ─────────────────────────────────────────────────
export type MenuStatus = "draft" | "validated" | "published" | "archived"

export interface FPMenu {
  id: string
  title: string
  date: string
  service: ServiceType
  location_type: string
  location_name: string | null
  start_time: string | null
  end_time: string | null
  trip_id: string | null
  status: MenuStatus
  order_deadline: string | null
  total_portions: number | null
  nutri_validated: boolean
  nutri_validated_at: string | null
  published_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface FPMenuItem {
  id: string
  menu_id: string
  article_id: string
  display_order: number
  available: boolean
  portions_available: number | null
  notes: string | null
}

// ── trips ─────────────────────────────────────────────────
export interface FPTrip {
  id: string
  name: string
  city: string | null
  start_date: string       // date ISO YYYY-MM-DD
  end_date: string         // date ISO YYYY-MM-DD
  hotel_id: string | null
  stadium: string | null
  match_time: string | null
  training_times: string | null
  meal_times: string | null
  status: string           // planifie | en_cours | termine | annule
  created_by: string | null
  created_at: string
  updated_at: string
}

// ── hotels ────────────────────────────────────────────────
export interface FPHotel {
  id: string
  name: string
  city: string | null
  country: string | null
  address: string | null
  preferred_lang: string | null
  contact_chef: string | null
  contact_fb: string | null
  email: string | null
  phone: string | null
  constraints: string | null
  archived_at: string | null
  created_at: string
}

// ── hotel_access ──────────────────────────────────────────
export interface FPHotelAccess {
  id: string
  trip_id: string
  hotel_id: string
  profile_id: string
  token_hash: string
  starts_at: string
  expires_at: string
  revoked_at: string | null
  granted_by: string | null
  created_at: string
}

// ── notifications ─────────────────────────────────────────
export interface FPNotification {
  id: string
  recipient_id: string
  type: string
  title_fr: string
  body_fr: string
  data: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

// ── Utility: Insert types (id/timestamps optional) ────────
export type FPOrderInsert = Omit<FPOrder, "id" | "reference" | "created_at" | "updated_at">
export type FPPlayerInsert = Omit<FPPlayer, "id" | "created_at" | "updated_at">
export type FPOnboardingFormInsert = Omit<FPOnboardingForm, "id" | "created_at" | "updated_at">

// ── Nutrition Tracking ────────────────────────────────────
export type TrackingStatus = 'valide' | 'a_surveiller' | 'alerte';

export interface FPNutritionTracking {
  id: string;
  player_id: string;
  nutri_id: string;
  tracking_date: string;
  weight_kg: number | null;
  hydration: number | null;
  sleep_hours: number | null;
  fatigue: number | null;
  breakfast_quality: number | null;
  lunch_quality: number | null;
  dinner_quality: number | null;
  proteins_g: number | null;
  carbs_g: number | null;
  lipids_g: number | null;
  calories: number | null;
  nutri_comment: string | null;
  status: TrackingStatus;
  score_nutrition: number | null;
  created_at: string;
  updated_at: string;
}

export interface FPNutritionTrackingInsert {
  player_id: string;
  nutri_id: string;
  tracking_date?: string;
  weight_kg?: number | null;
  hydration?: number | null;
  sleep_hours?: number | null;
  fatigue?: number | null;
  breakfast_quality?: number | null;
  lunch_quality?: number | null;
  dinner_quality?: number | null;
  proteins_g?: number | null;
  carbs_g?: number | null;
  lipids_g?: number | null;
  calories?: number | null;
  nutri_comment?: string | null;
  status?: TrackingStatus;
}

// ── chat ──────────────────────────────────────────────────
export interface FPConversation {
  id: string
  type: string
  participant_ids: string[]
  trip_id: string | null
  created_at: string
  updated_at: string
}

export interface FPMessage {
  id: string
  conversation_id: string
  sender_id: string | null
  content: string
  read_by: string[]
  created_at: string
}

export type FPMessageWithSender = FPMessage & {
  sender: { id: string; full_name: string | null; role: string } | null
}

export type FPConversationWithPreview = FPConversation & {
  last_message: FPMessage | null
  other_participant: { id: string; full_name: string | null; role: string } | null
}

// ── meal schedule ─────────────────────────────────────────
export type MealService = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type MealLocation = 'centre' | 'hotel' | 'deplacement'

export interface FPMealSchedule {
  id: string
  date: string
  service: MealService
  location: MealLocation
  trip_id: string | null
  time_start: string
  time_end: string
  player_group: string
  notes: string | null
  created_by: string | null
  created_at: string
}

// ── nutrition tracking complete ───────────────────────────

export type TrainingLoad = 'rest' | 'light' | 'medium' | 'high' | 'double' | 'match'
export type DayType = 'j-6' | 'j-5' | 'j-4' | 'j-3' | 'j-2' | 'j-1' | 'match' | 'j+1' | 'j+2' | 'normal'
export type SupplementBrand = 'nutrition_x' | 'apurna' | 'sislab' | 'powerbar' | 'beet_it' | 'other'
export type SupplementType = 'protein_shake' | 'gel' | 'bar' | 'recovery_drink' | 'isotonic' | 'beetroot_shot' | 'bcaa' | 'omega3' | 'vitamin' | 'other'
export type MealService2 = 'breakfast' | 'snack_am' | 'lunch' | 'snack_pm' | 'dinner' | 'pre_match' | 'post_match'
export type AvatarColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'gold'
export type ProgramStatus = 'draft' | 'active' | 'completed' | 'archived'

export interface TrainingLoadEntry {
  date: string
  load: TrainingLoad
}

export interface FPNutritionProgram {
  id: string
  name: string
  type: 'individual' | 'collective'
  player_ids: string[]
  created_by: string | null
  match_date: string | null
  start_date: string
  end_date: string
  training_load: TrainingLoadEntry[]
  status: ProgramStatus
  created_at: string
}

export interface FPDailyNutritionPlan {
  id: string
  program_id: string
  player_id: string
  date: string
  day_type: DayType
  target_calories: number | null
  target_protein_g: number | null
  target_carbs_g: number | null
  target_fat_g: number | null
  target_water_ml: number | null
  target_fiber_g: number | null
  meal_priorities: Record<string, number>
  notes_from_nutri: string | null
  nutri_message: string | null
  nutri_message_lang: string
  created_at: string
}

export interface FPPrescribedMeal {
  id: string
  daily_plan_id: string
  service: MealService2
  vegetables_g: number
  starch_g: number
  protein_g: number
  water_ml: number
  points_vegetables: number
  points_starch: number
  points_protein: number
  points_water: number
  points_supplements: number
  sort_order: number
  notes: string | null
}

export interface FPPrescribedSupplement {
  id: string
  daily_plan_id: string
  meal_service: MealService2 | 'any'
  brand: SupplementBrand
  brand_other: string | null
  product_name: string
  product_type: SupplementType
  quantity_g: number | null
  quantity_ml: number | null
  quantity_units: number | null
  water_ml: number
  timing_minutes_before_effort: number | null
  timing_minutes_after_effort: number | null
  timing_note: string | null
  points: number
  sort_order: number
}

export interface FPMealConsumption {
  id: string
  daily_plan_id: string
  player_id: string
  service: string
  vegetables_g_actual: number | null
  starch_g_actual: number | null
  protein_g_actual: number | null
  water_ml_actual: number | null
  consumed_at: string
}

export interface FPSupplementConsumption {
  id: string
  prescribed_supplement_id: string
  player_id: string
  taken: boolean
  taken_at: string | null
  notes: string | null
}

export interface FPDailyScore {
  id: string
  player_id: string
  program_id: string
  date: string
  score_percent: number | null
  avatar_color: AvatarColor | null
  points_earned: number
  points_possible: number
  streak_days: number
  created_at: string
}

// Enriched types for UI
export interface FPDailyPlanFull extends FPDailyNutritionPlan {
  meals: FPPrescribedMeal[]
  supplements: FPPrescribedSupplement[]
  consumption: FPMealConsumption[]
  supplement_consumption: FPSupplementConsumption[]
  score: FPDailyScore | null
}

export interface FPProgramWithStats extends FPNutritionProgram {
  player_count: number
  avg_score: number | null
}
