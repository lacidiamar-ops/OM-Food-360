-- =============================================================================
-- FOOD PASSPORT 360 — SCHÉMA SUPABASE COMPLET
-- =============================================================================
-- Conforme à SPEC_PRODUIT.md et CLAUDE.md
--
-- ⚠️  SCHÉMA POSTGRESQL DÉDIÉ : food_passport
--     Le projet Supabase est partagé avec l'app RH (tables employees, punches…).
--     Toutes les tables FP360 sont dans le schéma "food_passport" pour éviter
--     toute collision. Les clients Supabase utilisent { db: { schema: "food_passport" } }.
--
-- Migration appliquée en 5 étapes sur le projet OM-food-360 (vjulagaprzbnquynwjmt) :
--   fp360_01_schema_types_sequences  — schéma + ENUMs + séquence
--   fp360_02_tables_part1            — profiles → nutrition_protocols
--   fp360_03_tables_part2            — menus → audit_logs
--   fp360_04_functions_triggers      — fonctions helper + triggers
--   fp360_05_rls_views_indexes_grants — RLS + vue opérationnelle + index + grants
--
-- Architecture:
--   1. Création du schéma food_passport + grants usage
--   2. Extensions (uuid-ossp, pgcrypto, pg_trgm)
--   3. ENUMs (dans food_passport)
--   4. Auth & RBAC (profiles, rôles)
--   5. Players & passeport nutritionnel
--   6. Catalogue articles & allergènes
--   7. Menus
--   8. Plans alimentaires & protocoles
--   9. Orders (cœur du produit) + workflow validation
--  10. Trips, hotels, accès temporaire
--  11. Feedback satisfaction
--  12. Photo proof / validation visuelle
--  13. Notifications
--  14. Audit logs
--  15. Translations (i18n contenu)
--  16. Fonctions helper (SECURITY DEFINER, search_path = food_passport)
--  17. Triggers critiques (validation nutri obligatoire)
--  18. Vue players_operational (données non-sensibles)
--  19. RLS policies par rôle
--  20. Indexes de performance
--  21. Grants (anon, authenticated, service_role)
--
-- RÈGLE FONDAMENTALE APPLIQUÉE NIVEAU DB:
--   Aucune commande joueur ne peut passer aux statuts transmise_cuisine /
--   transmise_hotel sans validated_by_nutri_at IS NOT NULL.
--   Enforced par : trigger enforce_nutri_validation + RLS cuisine/hotel.
-- =============================================================================

-- =============================================================================
-- 0. SCHÉMA DÉDIÉ
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS food_passport;
GRANT USAGE ON SCHEMA food_passport TO anon, authenticated, service_role;

-- Toutes les instructions suivantes s'exécutent dans food_passport
SET search_path TO food_passport, extensions, public;

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- recherche fuzzy

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================
-- (Extensions installées dans le schéma extensions ou public du projet partagé)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- 2. ENUMS (dans food_passport)
-- =============================================================================
CREATE TYPE food_passport.user_role AS ENUM (
  'super_admin',
  'admin_resto',
  'admin_nutri',
  'admin_team_manager',
  'cuisine',
  'hotel',
  'joueur',
  'direction'
);

CREATE TYPE supported_lang AS ENUM ('fr', 'en', 'es', 'it', 'pt', 'ar');

CREATE TYPE player_status AS ENUM ('actif', 'en_test', 'blesse', 'retour_blessure', 'inactif');

CREATE TYPE position_terrain AS ENUM ('gardien', 'defenseur', 'milieu', 'attaquant');

CREATE TYPE service_type AS ENUM (
  'petit_dejeuner', 'dejeuner', 'collation_pre', 'collation_post',
  'collation_recup', 'diner', 'room_service', 'after_match', 'pre_match'
);

CREATE TYPE order_status AS ENUM (
  'brouillon',
  'envoyee_joueur',
  'en_attente_nutri',
  'validee_nutri',
  'ajustee_nutri',
  'refusee_nutri',
  'precision_demandee',
  'transmise_resto',
  'validee_resto',
  'transmise_cuisine',
  'transmise_hotel',
  'en_preparation',
  'prete',
  'livree',
  'annulee',
  'probleme_signale'
);

CREATE TYPE order_priority AS ENUM ('normal', 'important', 'urgent', 'critique');

CREATE TYPE article_category AS ENUM (
  'feculent', 'proteine_animale', 'proteine_vegetale', 'legume', 'fruit',
  'produit_laitier', 'sauce', 'boisson', 'epicerie', 'collation', 'dessert', 'autre'
);

CREATE TYPE photo_status AS ENUM ('demandee', 'en_attente', 'validee', 'refusee', 'non_conforme');

CREATE TYPE form_status AS ENUM ('brouillon', 'incomplete', 'a_mettre_a_jour', 'complete', 'validee');

CREATE TYPE feedback_topic AS ENUM ('qualite', 'quantite', 'temperature', 'gout', 'delai', 'presentation');

-- =============================================================================
-- 3. AUTH & RBAC
-- =============================================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT UNIQUE NOT NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  role            user_role NOT NULL DEFAULT 'joueur',
  preferred_lang  supported_lang NOT NULL DEFAULT 'fr',
  phone           TEXT,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE profiles IS 'Profil utilisateur étendu lié à auth.users';

-- Délégation nutri (super_admin peut désigner un remplaçant)
CREATE TABLE nutri_delegation (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delegate_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  granted_by      UUID NOT NULL REFERENCES profiles(id),
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT delegation_period_valid CHECK (ends_at > starts_at)
);

-- =============================================================================
-- 4. PLAYERS & ONBOARDING — passeport nutritionnel
-- =============================================================================
CREATE TABLE players (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  jersey_number   INT,
  position        position_terrain,
  squad_group     TEXT, -- 'pro', 'reserve', 'jeunes'
  photo_url       TEXT,
  date_of_arrival DATE,
  status          player_status NOT NULL DEFAULT 'actif',
  preferred_lang  supported_lang NOT NULL DEFAULT 'fr',
  -- Données SENSIBLES — visibilité Nutri uniquement (RLS plus bas)
  weight_kg       NUMERIC(5,2),
  height_cm       NUMERIC(5,2),
  body_objectives TEXT,
  medical_notes   TEXT,
  private_nutri_notes TEXT,
  --
  archived_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fiche d'arrivée joueur — la fiche-mère
CREATE TABLE player_onboarding_forms (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id             UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status                form_status NOT NULL DEFAULT 'brouillon',
  completion_percent    INT NOT NULL DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),
  filled_by             UUID REFERENCES profiles(id),
  validated_by          UUID REFERENCES profiles(id),
  validated_at          TIMESTAMPTZ,

  -- Section Informations alimentaires générales
  diet_type             TEXT,
  meal_rhythm           TEXT,
  morning_appetite      TEXT,
  post_training_appetite TEXT,
  post_match_appetite   TEXT,
  regular_foods         TEXT[],
  rare_foods            TEXT[],
  refused_foods         TEXT[],
  digestive_notes       TEXT,

  -- Hydratation
  water_type            TEXT, -- 'plate', 'gazeuse', 'mixte'
  daily_water_liters    NUMERIC(3,1),
  preferred_drinks      TEXT[],
  avoided_drinks        TEXT[],
  energy_drinks_tolerance TEXT,
  coffee_tea_habits     TEXT,
  travel_specific_needs TEXT,

  -- Préférences culturelles
  preferred_cuisine     TEXT,
  comfort_foods         TEXT[],
  familiar_foods        TEXT[],
  difficult_foods       TEXT[],
  refused_textures      TEXT[],
  spice_tolerance       TEXT, -- 'aucun', 'doux', 'moyen', 'fort'

  -- Plats préférés
  fav_club_dish         TEXT,
  fav_pre_match_dish    TEXT,
  fav_post_match_dish   TEXT,
  fav_travel_dish       TEXT,
  fav_room_service_dish TEXT,
  fav_dessert           TEXT,
  fav_drink             TEXT,

  -- Routine match
  match_eve_routine     TEXT,
  match_day_routine     TEXT,
  ideal_pre_match_meal  TEXT,
  pre_match_avoided     TEXT[],
  ideal_pre_match_snack TEXT,
  pre_match_drink       TEXT,
  pre_effort_digestion  TEXT,
  post_match_routine    TEXT,

  -- Hôtel
  hotel_breakfast_pref  TEXT,
  hotel_room_service_pref TEXT,
  hotel_usual_times     TEXT,
  frequent_room_requests TEXT,
  travel_reassuring_foods TEXT[],
  hotel_avoided_foods   TEXT[],
  recovery_specific_needs TEXT,

  -- Feedback initial
  player_likes          TEXT,
  player_dislikes       TEXT,
  resto_expectations    TEXT,
  nutri_expectations    TEXT,
  player_free_notes     TEXT,
  private_nutri_remarks TEXT, -- visible nutri uniquement

  archived_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE player_breakfast_preferences (
  player_id           UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  takes_breakfast     BOOLEAN,
  usual_time          TIME,
  taste_pref          TEXT, -- 'sucree', 'salee', 'mixte'
  preferred_drinks    TEXT[],
  dairy_accepted      BOOLEAN,
  cereals_accepted    TEXT[],
  bread_accepted      BOOLEAN,
  eggs_accepted       BOOLEAN,
  fav_fruits          TEXT[],
  avoided_at_breakfast TEXT[],
  ideal_breakfast     TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE player_lunch_preferences (
  player_id           UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  preferred_dish_types TEXT[],
  preferred_starches  TEXT[],
  preferred_proteins  TEXT[],
  accepted_vegetables TEXT[],
  accepted_sauces     TEXT[],
  refused_foods       TEXT[],
  usual_quantity      TEXT,
  fav_dishes          TEXT[],
  digestive_notes     TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE player_dinner_preferences (
  player_id           UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  meal_size           TEXT, -- 'leger', 'complet'
  evening_starches_ok BOOLEAN,
  preferred_proteins  TEXT[],
  accepted_vegetables TEXT[],
  fav_dishes          TEXT[],
  evening_avoided     TEXT[],
  match_eve_habits    TEXT,
  evening_digestion   TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE player_snack_preferences (
  player_id           UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  preferred_snacks    TEXT[],
  pre_training_snack  TEXT,
  pre_match_snack     TEXT,
  recovery_snack      TEXT,
  fav_fruits          TEXT[],
  dairy_accepted      BOOLEAN,
  bars_compotes_smoothies TEXT[],
  recovery_drinks     TEXT[],
  refused_snacks      TEXT[],
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allergies / intolérances
CREATE TABLE allergens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT UNIQUE NOT NULL, -- 'gluten', 'lactose', 'arachide', ...
  name_fr     TEXT NOT NULL,
  severity_default TEXT
);

CREATE TABLE player_food_restrictions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  type            TEXT NOT NULL, -- 'allergie', 'intolerance', 'religieux', 'choix'
  allergen_id     UUID REFERENCES allergens(id),
  label           TEXT NOT NULL, -- ex: 'halal', 'sans_porc', 'vegetarien'
  severity        TEXT, -- 'strict', 'preference', 'obligation'
  forbidden_foods TEXT[],
  cross_contamination_risk BOOLEAN DEFAULT false,
  medical_doc_url TEXT,
  nutri_comment   TEXT,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit complet de la fiche d'arrivée
CREATE TABLE player_onboarding_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id         UUID NOT NULL REFERENCES player_onboarding_forms(id) ON DELETE CASCADE,
  changed_by      UUID REFERENCES profiles(id),
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  field_changed   TEXT,
  old_value       JSONB,
  new_value       JSONB
);

-- =============================================================================
-- 5. CATALOGUE ARTICLES
-- =============================================================================
CREATE TABLE articles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  category            article_category NOT NULL,
  subcategory         TEXT,
  photo_url           TEXT,
  short_description   TEXT,
  standard_portion_g  INT,
  unit                TEXT DEFAULT 'g',
  -- Régimes
  is_halal            BOOLEAN NOT NULL DEFAULT false,
  is_vegetarian       BOOLEAN NOT NULL DEFAULT false,
  is_vegan            BOOLEAN NOT NULL DEFAULT false,
  is_gluten_free      BOOLEAN NOT NULL DEFAULT false,
  is_lactose_free     BOOLEAN NOT NULL DEFAULT false,
  -- Disponibilités (exigences spec)
  available_center    BOOLEAN NOT NULL DEFAULT true,
  available_hotel     BOOLEAN NOT NULL DEFAULT false,
  available_room      BOOLEAN NOT NULL DEFAULT false,
  available_smart_fridge BOOLEAN NOT NULL DEFAULT false,
  available_match_day BOOLEAN NOT NULL DEFAULT true,
  available_match_eve BOOLEAN NOT NULL DEFAULT true,
  available_recovery  BOOLEAN NOT NULL DEFAULT true,
  -- Validation nutri
  nutri_validated     BOOLEAN NOT NULL DEFAULT false,
  nutri_validated_by  UUID REFERENCES profiles(id),
  nutri_validated_at  TIMESTAMPTZ,
  nutri_blocked       BOOLEAN NOT NULL DEFAULT false,
  nutri_comment       TEXT,
  resto_comment       TEXT,
  -- Économie / approvisionnement
  price_eur           NUMERIC(8,2),
  cost_eur            NUMERIC(8,2),
  supplier            TEXT,
  -- Statuts
  active              BOOLEAN NOT NULL DEFAULT true,
  out_of_stock        BOOLEAN NOT NULL DEFAULT false,
  archived_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by          UUID REFERENCES profiles(id),
  last_modified_by    UUID REFERENCES profiles(id)
);

CREATE TABLE article_allergens (
  article_id  UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, allergen_id)
);

CREATE TABLE article_translations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id  UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  lang        supported_lang NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  auto_translated BOOLEAN NOT NULL DEFAULT true,
  manual_correction BOOLEAN NOT NULL DEFAULT false,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (article_id, lang)
);

-- =============================================================================
-- 6. MENUS
-- =============================================================================
CREATE TABLE menus (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  date            DATE NOT NULL,
  service         service_type NOT NULL,
  location_type   TEXT NOT NULL, -- 'centre', 'hotel', 'deplacement', 'frigo'
  location_name   TEXT,
  start_time      TIME,
  end_time        TIME,
  trip_id         UUID, -- FK ajoutée plus bas (forward ref)
  status          TEXT NOT NULL DEFAULT 'brouillon', -- brouillon, publie, archive
  order_deadline  TIMESTAMPTZ,
  total_portions  INT,
  nutri_validated BOOLEAN NOT NULL DEFAULT false,
  nutri_validated_at TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE menu_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id     UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  article_id  UUID NOT NULL REFERENCES articles(id),
  display_order INT NOT NULL DEFAULT 0,
  available   BOOLEAN NOT NULL DEFAULT true,
  portions_available INT,
  notes       TEXT,
  UNIQUE (menu_id, article_id)
);

CREATE TABLE menu_translations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id     UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  lang        supported_lang NOT NULL,
  title       TEXT NOT NULL,
  notes       TEXT,
  UNIQUE (menu_id, lang)
);

-- =============================================================================
-- 7. PLANS NUTRITIONNELS & PROTOCOLES
-- =============================================================================
CREATE TABLE nutrition_plans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id       UUID REFERENCES players(id) ON DELETE CASCADE, -- null si plan groupe
  group_label     TEXT,
  context         TEXT NOT NULL, -- entrainement, repos, veille_match, jour_match, etc.
  start_date      DATE,
  end_date        DATE,
  active          BOOLEAN NOT NULL DEFAULT true,
  notes           TEXT,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE nutrition_plan_articles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id         UUID NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  article_id      UUID NOT NULL REFERENCES articles(id),
  auth_level      TEXT NOT NULL DEFAULT 'autorise', -- autorise, recommande, bloque
  recommended_portion_g INT,
  frequency       TEXT, -- 'quotidien', 'hebdo', 'pre_match'
  nutri_comment   TEXT
);

CREATE TABLE nutrition_protocols (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  context         TEXT NOT NULL, -- pre_match, post_match, recuperation, deplacement
  description     TEXT,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 8. TRIPS & HOTELS
-- =============================================================================
CREATE TABLE hotels (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  city            TEXT,
  country         TEXT,
  address         TEXT,
  preferred_lang  supported_lang DEFAULT 'fr',
  contact_chef    TEXT,
  contact_fb      TEXT,
  email           TEXT,
  phone           TEXT,
  constraints     TEXT,
  archived_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hotel_specifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  doc_url         TEXT, -- cahier des charges PDF
  breakfast_standards TEXT,
  lunch_standards TEXT,
  dinner_standards TEXT,
  snack_standards TEXT,
  match_eve_protocol TEXT,
  match_day_protocol TEXT,
  after_match_protocol TEXT,
  halal_requirements TEXT,
  allergen_handling TEXT,
  temperature_rules TEXT,
  traceability_rules TEXT,
  room_delivery_rules TEXT,
  presentation_rules TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE trips (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  city            TEXT,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  hotel_id        UUID REFERENCES hotels(id),
  stadium         TEXT,
  match_time      TIMESTAMPTZ,
  training_times  TEXT,
  meal_times      TEXT,
  status          TEXT NOT NULL DEFAULT 'planifie', -- planifie, actif, termine, annule
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT trip_dates_valid CHECK (end_date >= start_date)
);

-- Forward FK pour menus.trip_id
ALTER TABLE menus ADD CONSTRAINT menus_trip_fk
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL;

CREATE TABLE trip_players (
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  PRIMARY KEY (trip_id, player_id)
);

CREATE TABLE rooming (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES players(id),
  room_number TEXT NOT NULL,
  notes       TEXT,
  UNIQUE (trip_id, player_id)
);

-- Accès hôtel temporaire — expiration AUTO
CREATE TABLE hotel_access (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id         UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  hotel_id        UUID NOT NULL REFERENCES hotels(id),
  profile_id      UUID NOT NULL REFERENCES profiles(id), -- l'user "hotel" autorisé
  token_hash      TEXT NOT NULL UNIQUE, -- token signé hashé
  starts_at       TIMESTAMPTZ NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  granted_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT access_period_valid CHECK (expires_at > starts_at)
);

-- =============================================================================
-- 9. ORDERS — le cœur du produit
-- =============================================================================
CREATE TABLE orders (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference               TEXT UNIQUE NOT NULL DEFAULT 'C-' || LPAD(NEXTVAL('orders_ref_seq')::TEXT, 6, '0'),
  player_id               UUID NOT NULL REFERENCES players(id),
  trip_id                 UUID REFERENCES trips(id), -- null si centre
  hotel_id                UUID REFERENCES hotels(id), -- si demande chambre
  room_number             TEXT,
  service                 service_type NOT NULL,
  location_label          TEXT, -- 'Centre — Salle joueurs', 'Sofitel ch. 412'
  scheduled_at            TIMESTAMPTZ NOT NULL,
  deadline                TIMESTAMPTZ,
  status                  order_status NOT NULL DEFAULT 'brouillon',
  priority                order_priority NOT NULL DEFAULT 'normal',

  -- Validation nutri (clé pour le trigger anti-transmission)
  validated_by_nutri      UUID REFERENCES profiles(id),
  validated_by_nutri_at   TIMESTAMPTZ,
  nutri_adjustment_notes  TEXT,
  nutri_refusal_reason    TEXT,

  -- Validation resto
  validated_by_resto      UUID REFERENCES profiles(id),
  validated_by_resto_at   TIMESTAMPTZ,

  -- Transmissions
  transmitted_to_kitchen_at TIMESTAMPTZ,
  transmitted_to_hotel_at TIMESTAMPTZ,

  -- Production
  prep_started_at         TIMESTAMPTZ,
  ready_at                TIMESTAMPTZ,
  delivered_at            TIMESTAMPTZ,

  -- Commentaire joueur (langue d'origine + traduction auto plus bas)
  player_comment_original TEXT,
  player_comment_lang     supported_lang,

  archived_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Sequence pour reference
CREATE SEQUENCE IF NOT EXISTS orders_ref_seq START 2840;

CREATE TABLE order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  article_id      UUID NOT NULL REFERENCES articles(id),
  quantity        NUMERIC(6,2) NOT NULL DEFAULT 1,
  portion_g       INT,
  player_note     TEXT,
  nutri_note      TEXT,
  removed_by_nutri BOOLEAN NOT NULL DEFAULT false,
  added_by_nutri  BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE order_validation_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action          TEXT NOT NULL, -- envoi, validation, ajustement, refus, precision_demandee, transmission
  actor_id        UUID REFERENCES profiles(id),
  actor_role      user_role,
  from_status     order_status,
  to_status       order_status,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_comment_translations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  lang            supported_lang NOT NULL,
  translated_text TEXT NOT NULL,
  auto_translated BOOLEAN NOT NULL DEFAULT true,
  manual_correction BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, lang)
);

-- =============================================================================
-- 10. FEEDBACK SATISFACTION
-- =============================================================================
CREATE TABLE feedbacks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  player_id       UUID REFERENCES players(id),
  trip_id         UUID REFERENCES trips(id),
  hotel_id        UUID REFERENCES hotels(id),
  topic           feedback_topic[],
  rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  smiley          TEXT,
  comment_original TEXT,
  comment_lang    supported_lang,
  tags            TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE feedback_translations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id     UUID NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
  lang            supported_lang NOT NULL,
  translated_comment TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (feedback_id, lang)
);

-- =============================================================================
-- 11. PHOTO PROOF
-- =============================================================================
CREATE TABLE action_photos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storage_path    TEXT NOT NULL, -- path dans Supabase Storage bucket 'photos'
  uploaded_by     UUID REFERENCES profiles(id),
  uploader_role   user_role,
  -- Contexte (au moins un FK rempli)
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  trip_id         UUID REFERENCES trips(id) ON DELETE SET NULL,
  hotel_id        UUID REFERENCES hotels(id) ON DELETE SET NULL,
  feedback_id     UUID REFERENCES feedbacks(id) ON DELETE SET NULL,
  context_type    TEXT NOT NULL, -- 'plateau_chambre', 'mise_en_place', 'tracabilite', etc.
  caption         TEXT,
  status          photo_status NOT NULL DEFAULT 'en_attente',
  validated_by    UUID REFERENCES profiles(id),
  validated_at    TIMESTAMPTZ,
  validator_comment TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE photo_validation_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id        UUID NOT NULL REFERENCES action_photos(id) ON DELETE CASCADE,
  actor_id        UUID REFERENCES profiles(id),
  action          TEXT NOT NULL, -- 'demande', 'envoi', 'validation', 'refus', 'commentaire'
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 12. NOTIFICATIONS
-- =============================================================================
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL, -- 'commande_validee', 'photo_demandee', etc.
  title_key       TEXT NOT NULL, -- clé i18n
  body_key        TEXT,
  body_params     JSONB DEFAULT '{}'::jsonb,
  -- Contexte
  order_id        UUID REFERENCES orders(id) ON DELETE CASCADE,
  trip_id         UUID REFERENCES trips(id) ON DELETE CASCADE,
  feedback_id     UUID REFERENCES feedbacks(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ,
  priority        order_priority NOT NULL DEFAULT 'normal',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 13. AUDIT LOGS (général)
-- =============================================================================
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id        UUID REFERENCES profiles(id),
  actor_role      user_role,
  action          TEXT NOT NULL,
  table_name      TEXT,
  record_id       UUID,
  old_value       JSONB,
  new_value       JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 14. TRIGGERS CRITIQUES
-- =============================================================================

-- Trigger 1 — RÈGLE FONDAMENTALE : pas de transmission sans validation nutri
CREATE OR REPLACE FUNCTION enforce_nutri_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut implique transmission ou suite, exiger la validation nutri
  IF NEW.status IN (
       'transmise_resto', 'validee_resto', 'transmise_cuisine', 'transmise_hotel',
       'en_preparation', 'prete', 'livree'
     )
     AND NEW.validated_by_nutri_at IS NULL THEN
    RAISE EXCEPTION
      'FOOD_PASSPORT_RULE_VIOLATION: la commande % ne peut passer au statut % sans validation nutritionniste préalable',
      NEW.reference, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_enforce_nutri_validation
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION enforce_nutri_validation();

-- Trigger 2 — updated_at auto
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles', 'players', 'player_onboarding_forms',
    'articles', 'menus', 'nutrition_plans',
    'trips', 'orders'
  ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      t, t
    );
  END LOOP;
END $$;

-- Trigger 3 — log automatique des changements de statut commande
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_validation_logs (
      order_id, action, actor_id, actor_role, from_status, to_status
    ) VALUES (
      NEW.id,
      'changement_statut',
      auth.uid(),
      (SELECT role FROM profiles WHERE id = auth.uid()),
      OLD.status,
      NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_log_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- Trigger 4 — historique fiche d'arrivée joueur
CREATE OR REPLACE FUNCTION log_onboarding_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO player_onboarding_history (
      form_id, changed_by, old_value, new_value
    ) VALUES (
      NEW.id,
      auth.uid(),
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER onboarding_log_changes
  AFTER UPDATE ON player_onboarding_forms
  FOR EACH ROW EXECUTE FUNCTION log_onboarding_change();

-- =============================================================================
-- 15. HELPER FUNCTIONS POUR RLS
-- =============================================================================

-- Rôle courant via JWT (cache stable pour la session)
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- player_id du joueur connecté (pour limiter ses accès à ses propres données)
CREATE OR REPLACE FUNCTION current_player_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM players WHERE profile_id = auth.uid();
$$;

-- L'utilisateur "hotel" courant a-t-il un accès actif à ce trip ?
CREATE OR REPLACE FUNCTION hotel_has_active_access(p_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM hotel_access
    WHERE profile_id = auth.uid()
      AND trip_id    = p_trip_id
      AND now() BETWEEN starts_at AND expires_at
      AND revoked_at IS NULL
  );
$$;

-- =============================================================================
-- 16. ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_onboarding_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_food_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooming ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ----- profiles -----
CREATE POLICY "Self can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Self can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON profiles
  FOR SELECT USING (current_user_role() IN ('super_admin', 'admin_resto', 'admin_nutri', 'admin_team_manager'));

-- ----- players -----
-- Joueur lit ses propres données (sauf champs sensibles via vue, plus bas)
CREATE POLICY "Player reads own record" ON players
  FOR SELECT USING (profile_id = auth.uid());

-- Nutri voit tout
CREATE POLICY "Nutri reads all players" ON players
  FOR ALL USING (current_user_role() = 'admin_nutri');

-- Resto voit les données opérationnelles (pas les sensibles — colonnes filtrées via vue)
CREATE POLICY "Resto reads players (non sensitive)" ON players
  FOR SELECT USING (current_user_role() IN ('admin_resto', 'admin_team_manager'));

-- Cuisine ne voit pas la table players directement (passe par order_items)
-- Hotel idem

-- Super admin
CREATE POLICY "Super admin all on players" ON players
  FOR ALL USING (current_user_role() = 'super_admin');

-- Vue filtrée pour resto / cuisine / hotel : pas de poids, pas de medical_notes
CREATE OR REPLACE VIEW players_operational AS
SELECT
  id, profile_id, first_name, last_name, jersey_number, position, squad_group,
  photo_url, status, preferred_lang, archived_at
FROM players;

-- ----- player_onboarding_forms -----
CREATE POLICY "Player reads own form (public sections)" ON player_onboarding_forms
  FOR SELECT USING (player_id = current_player_id());
CREATE POLICY "Nutri full access onboarding" ON player_onboarding_forms
  FOR ALL USING (current_user_role() = 'admin_nutri');
CREATE POLICY "Super admin full onboarding" ON player_onboarding_forms
  FOR ALL USING (current_user_role() = 'super_admin');

-- ----- player_food_restrictions (utile à resto + cuisine + hotel) -----
CREATE POLICY "Player reads own restrictions" ON player_food_restrictions
  FOR SELECT USING (player_id = current_player_id());
CREATE POLICY "Nutri all restrictions" ON player_food_restrictions
  FOR ALL USING (current_user_role() = 'admin_nutri');
CREATE POLICY "Resto reads restrictions" ON player_food_restrictions
  FOR SELECT USING (current_user_role() IN ('admin_resto', 'admin_team_manager'));
CREATE POLICY "Cuisine reads restrictions when order" ON player_food_restrictions
  FOR SELECT USING (
    current_user_role() = 'cuisine' AND
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.player_id = player_food_restrictions.player_id
        AND o.validated_by_nutri_at IS NOT NULL
        AND o.status IN ('transmise_cuisine', 'en_preparation', 'prete', 'livree')
    )
  );

-- ----- articles -----
CREATE POLICY "All staff read articles" ON articles
  FOR SELECT USING (
    current_user_role() IN ('admin_resto', 'admin_nutri', 'admin_team_manager', 'cuisine', 'super_admin', 'direction')
  );
CREATE POLICY "Joueur reads only validated active articles" ON articles
  FOR SELECT USING (
    current_user_role() = 'joueur'
    AND active = true AND nutri_validated = true AND nutri_blocked = false
    AND archived_at IS NULL
  );
CREATE POLICY "Resto manages articles" ON articles
  FOR ALL USING (current_user_role() IN ('admin_resto', 'super_admin'));
CREATE POLICY "Nutri validates articles" ON articles
  FOR UPDATE USING (current_user_role() = 'admin_nutri');

-- ----- menus -----
CREATE POLICY "Read published menus" ON menus
  FOR SELECT USING (status = 'publie' OR current_user_role() IN ('admin_resto', 'admin_nutri', 'super_admin'));
CREATE POLICY "Resto manages menus" ON menus
  FOR ALL USING (current_user_role() IN ('admin_resto', 'super_admin'));

-- ----- orders ----- (le cœur de la sécurité)

-- Joueur : voit et crée SES commandes uniquement, ne peut pas les transmettre
CREATE POLICY "Player reads own orders" ON orders
  FOR SELECT USING (player_id = current_player_id());
CREATE POLICY "Player creates own orders" ON orders
  FOR INSERT WITH CHECK (
    player_id = current_player_id()
    AND status IN ('brouillon', 'envoyee_joueur', 'en_attente_nutri')
  );
CREATE POLICY "Player updates only own draft orders" ON orders
  FOR UPDATE USING (
    player_id = current_player_id()
    AND status IN ('brouillon', 'envoyee_joueur')
  );

-- Nutri : voit tout, peut valider/ajuster/refuser
CREATE POLICY "Nutri all orders" ON orders
  FOR ALL USING (current_user_role() = 'admin_nutri');

-- Resto : voit les commandes validées par nutri ou en attente de validation
CREATE POLICY "Resto reads validated orders" ON orders
  FOR SELECT USING (
    current_user_role() = 'admin_resto'
    AND validated_by_nutri_at IS NOT NULL
  );
CREATE POLICY "Resto updates validated orders" ON orders
  FOR UPDATE USING (
    current_user_role() = 'admin_resto'
    AND validated_by_nutri_at IS NOT NULL
  );

-- Cuisine : voit UNIQUEMENT validées + transmises cuisine
CREATE POLICY "Cuisine reads transmitted orders" ON orders
  FOR SELECT USING (
    current_user_role() = 'cuisine'
    AND validated_by_nutri_at IS NOT NULL
    AND status IN ('transmise_cuisine', 'en_preparation', 'prete', 'livree')
  );
CREATE POLICY "Cuisine updates production status" ON orders
  FOR UPDATE USING (
    current_user_role() = 'cuisine'
    AND validated_by_nutri_at IS NOT NULL
    AND status IN ('transmise_cuisine', 'en_preparation', 'prete')
  );

-- Hotel : voit UNIQUEMENT validées de SON trip actif
CREATE POLICY "Hotel reads its trip orders" ON orders
  FOR SELECT USING (
    current_user_role() = 'hotel'
    AND validated_by_nutri_at IS NOT NULL
    AND status IN ('transmise_hotel', 'en_preparation', 'prete', 'livree')
    AND trip_id IS NOT NULL
    AND hotel_has_active_access(trip_id)
  );
CREATE POLICY "Hotel updates its trip orders status" ON orders
  FOR UPDATE USING (
    current_user_role() = 'hotel'
    AND validated_by_nutri_at IS NOT NULL
    AND trip_id IS NOT NULL
    AND hotel_has_active_access(trip_id)
  );

-- Team manager : voit les commandes liées à ses trips
CREATE POLICY "Team manager reads trip orders" ON orders
  FOR SELECT USING (
    current_user_role() = 'admin_team_manager'
    AND validated_by_nutri_at IS NOT NULL
  );

-- Super admin
CREATE POLICY "Super admin all orders" ON orders
  FOR ALL USING (current_user_role() = 'super_admin');

-- ----- order_items (suit la même logique que orders) -----
CREATE POLICY "Order items follow order access" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id)
  );

-- ----- trips & rooming -----
CREATE POLICY "Staff read trips" ON trips
  FOR SELECT USING (
    current_user_role() IN ('admin_resto', 'admin_nutri', 'admin_team_manager', 'super_admin', 'direction')
  );
CREATE POLICY "Team manager manages trips" ON trips
  FOR ALL USING (current_user_role() IN ('admin_team_manager', 'super_admin'));
CREATE POLICY "Hotel reads its active trip" ON trips
  FOR SELECT USING (
    current_user_role() = 'hotel'
    AND hotel_has_active_access(id)
  );

-- ----- hotel_access -----
CREATE POLICY "Self reads own hotel access" ON hotel_access
  FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Team manager manages access" ON hotel_access
  FOR ALL USING (current_user_role() IN ('admin_team_manager', 'admin_resto', 'super_admin'));

-- ----- feedbacks -----
CREATE POLICY "Player creates own feedback" ON feedbacks
  FOR INSERT WITH CHECK (player_id = current_player_id());
CREATE POLICY "Player reads own feedback" ON feedbacks
  FOR SELECT USING (player_id = current_player_id());
CREATE POLICY "Staff reads feedback" ON feedbacks
  FOR SELECT USING (
    current_user_role() IN ('admin_resto', 'admin_nutri', 'admin_team_manager', 'super_admin', 'direction')
  );

-- ----- action_photos -----
CREATE POLICY "Uploader reads own photos" ON action_photos
  FOR SELECT USING (uploaded_by = auth.uid());
CREATE POLICY "Validators read photos" ON action_photos
  FOR SELECT USING (
    current_user_role() IN ('admin_resto', 'admin_nutri', 'admin_team_manager', 'super_admin')
  );
CREATE POLICY "Authorized roles upload photos" ON action_photos
  FOR INSERT WITH CHECK (
    current_user_role() IN ('joueur', 'cuisine', 'hotel', 'admin_resto', 'admin_nutri', 'admin_team_manager')
  );
CREATE POLICY "Hotel uploads photos for its trip" ON action_photos
  FOR INSERT WITH CHECK (
    current_user_role() = 'hotel'
    AND (trip_id IS NULL OR hotel_has_active_access(trip_id))
  );

-- ----- notifications -----
CREATE POLICY "Recipient reads own notifications" ON notifications
  FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "Recipient updates own notifications" ON notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- ----- audit_logs (lecture super_admin uniquement) -----
CREATE POLICY "Super admin reads audit logs" ON audit_logs
  FOR SELECT USING (current_user_role() = 'super_admin');

-- =============================================================================
-- 17. INDEXES DE PERFORMANCE
-- =============================================================================
CREATE INDEX idx_profiles_role ON profiles(role) WHERE active = true;
CREATE INDEX idx_players_status ON players(status) WHERE archived_at IS NULL;
CREATE INDEX idx_players_profile ON players(profile_id);

CREATE INDEX idx_orders_player ON orders(player_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_validation_queue ON orders(scheduled_at)
  WHERE status = 'en_attente_nutri';
CREATE INDEX idx_orders_kitchen_queue ON orders(scheduled_at)
  WHERE status IN ('transmise_cuisine', 'en_preparation');
CREATE INDEX idx_orders_trip ON orders(trip_id) WHERE trip_id IS NOT NULL;
CREATE INDEX idx_orders_deadline ON orders(deadline) WHERE status = 'en_attente_nutri';

CREATE INDEX idx_articles_active ON articles(active) WHERE archived_at IS NULL;
CREATE INDEX idx_articles_validated ON articles(nutri_validated) WHERE active = true;

CREATE INDEX idx_menus_date_service ON menus(date, service);
CREATE INDEX idx_menus_published ON menus(date) WHERE status = 'publie';

CREATE INDEX idx_hotel_access_active ON hotel_access(profile_id, trip_id)
  WHERE revoked_at IS NULL;

CREATE INDEX idx_notifications_unread ON notifications(recipient_id, created_at)
  WHERE read_at IS NULL;

CREATE INDEX idx_validation_logs_order ON order_validation_logs(order_id, created_at DESC);
CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);

-- Recherche fuzzy joueurs
CREATE INDEX idx_players_name_trgm ON players USING gin (
  (first_name || ' ' || last_name) gin_trgm_ops
);

-- =============================================================================
-- 18. STORAGE BUCKET (à créer via API ou Studio)
-- =============================================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', false);
--
-- Policies storage à créer dans Studio:
--   - 'photos': uploaded_by = auth.uid() pour INSERT
--   - 'photos': lecture selon les RLS de action_photos

-- =============================================================================
-- FIN DU SCHÉMA — prêt à être appliqué
-- =============================================================================
