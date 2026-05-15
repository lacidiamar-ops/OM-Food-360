-- ============================================================
-- FOOD PASSPORT 360 — Schéma complet
-- Reconstitué depuis vjulagaprzbnquynwjmt (état migrations 01→08)
-- À appliquer sur sbkewkpemakactzfvbzz via supabase db push
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Schema
CREATE SCHEMA IF NOT EXISTS food_passport;

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE food_passport.article_category AS ENUM (
  'feculent','proteine_animale','proteine_vegetale','legume','fruit',
  'produit_laitier','sauce','boisson','epicerie','collation','dessert','autre'
);
CREATE TYPE food_passport.feedback_topic AS ENUM (
  'qualite','quantite','temperature','gout','delai','presentation'
);
CREATE TYPE food_passport.form_status AS ENUM (
  'brouillon','incomplete','a_mettre_a_jour','complete','validee'
);
CREATE TYPE food_passport.order_priority AS ENUM (
  'normal','important','urgent','critique'
);
CREATE TYPE food_passport.order_status AS ENUM (
  'brouillon','envoyee_joueur','en_attente_nutri','validee_nutri','ajustee_nutri',
  'refusee_nutri','precision_demandee','transmise_resto','validee_resto',
  'transmise_cuisine','transmise_hotel','en_preparation','prete','livree',
  'annulee','probleme_signale'
);
CREATE TYPE food_passport.photo_status AS ENUM (
  'demandee','en_attente','validee','refusee','non_conforme'
);
CREATE TYPE food_passport.player_status AS ENUM (
  'actif','en_test','blesse','retour_blessure','inactif'
);
CREATE TYPE food_passport.position_terrain AS ENUM (
  'gardien','defenseur','milieu','attaquant'
);
CREATE TYPE food_passport.service_type AS ENUM (
  'petit_dejeuner','dejeuner','collation_pre','collation_post','collation_recup',
  'diner','room_service','after_match','pre_match'
);
CREATE TYPE food_passport.supported_lang AS ENUM (
  'fr','en','es','it','pt','ar'
);
CREATE TYPE food_passport.user_role AS ENUM (
  'super_admin','admin_resto','admin_nutri','admin_team_manager',
  'cuisine','hotel','joueur','direction'
);

-- ============================================================
-- SEQUENCES
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS food_passport.orders_ref_seq START 1;

-- ============================================================
-- TABLES (dependency order)
-- ============================================================

-- profiles (references auth.users)
CREATE TABLE food_passport.profiles (
  id              uuid         NOT NULL,
  email           text         NOT NULL,
  full_name       text,
  avatar_url      text,
  role            food_passport.user_role NOT NULL DEFAULT 'joueur',
  preferred_lang  food_passport.supported_lang NOT NULL DEFAULT 'fr',
  phone           text,
  active          boolean      NOT NULL DEFAULT true,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_email_key UNIQUE (email),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- allergens
CREATE TABLE food_passport.allergens (
  id                uuid   NOT NULL DEFAULT uuid_generate_v4(),
  code              text   NOT NULL,
  name_fr           text   NOT NULL,
  severity_default  text,
  CONSTRAINT allergens_pkey PRIMARY KEY (id),
  CONSTRAINT allergens_code_key UNIQUE (code)
);

-- hotels
CREATE TABLE food_passport.hotels (
  id             uuid         NOT NULL DEFAULT uuid_generate_v4(),
  name           text         NOT NULL,
  city           text,
  country        text,
  address        text,
  preferred_lang food_passport.supported_lang DEFAULT 'fr',
  contact_chef   text,
  contact_fb     text,
  email          text,
  phone          text,
  constraints    text,
  archived_at    timestamptz,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT hotels_pkey PRIMARY KEY (id)
);

-- players
CREATE TABLE food_passport.players (
  id                  uuid                        NOT NULL DEFAULT uuid_generate_v4(),
  profile_id          uuid,
  first_name          text                        NOT NULL,
  last_name           text                        NOT NULL,
  jersey_number       integer,
  position            food_passport.position_terrain,
  squad_group         text,
  photo_url           text,
  date_of_arrival     date,
  status              food_passport.player_status NOT NULL DEFAULT 'actif',
  preferred_lang      food_passport.supported_lang NOT NULL DEFAULT 'fr',
  weight_kg           numeric,
  height_cm           numeric,
  body_objectives     text,
  medical_notes       text,
  private_nutri_notes text,
  archived_at         timestamptz,
  created_at          timestamptz                 NOT NULL DEFAULT now(),
  updated_at          timestamptz                 NOT NULL DEFAULT now(),
  CONSTRAINT players_pkey PRIMARY KEY (id),
  CONSTRAINT players_profile_id_key UNIQUE (profile_id),
  CONSTRAINT players_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES food_passport.profiles(id) ON DELETE SET NULL
);

-- articles
CREATE TABLE food_passport.articles (
  id                   uuid                         NOT NULL DEFAULT uuid_generate_v4(),
  name                 text                         NOT NULL,
  category             food_passport.article_category NOT NULL,
  subcategory          text,
  photo_url            text,
  short_description    text,
  standard_portion_g   integer,
  unit                 text                         DEFAULT 'g',
  is_halal             boolean                      NOT NULL DEFAULT false,
  is_vegetarian        boolean                      NOT NULL DEFAULT false,
  is_vegan             boolean                      NOT NULL DEFAULT false,
  is_gluten_free       boolean                      NOT NULL DEFAULT false,
  is_lactose_free      boolean                      NOT NULL DEFAULT false,
  available_center     boolean                      NOT NULL DEFAULT true,
  available_hotel      boolean                      NOT NULL DEFAULT false,
  available_room       boolean                      NOT NULL DEFAULT false,
  available_smart_fridge boolean                   NOT NULL DEFAULT false,
  available_match_day  boolean                      NOT NULL DEFAULT true,
  available_match_eve  boolean                      NOT NULL DEFAULT true,
  available_recovery   boolean                      NOT NULL DEFAULT true,
  nutri_validated      boolean                      NOT NULL DEFAULT false,
  nutri_validated_by   uuid,
  nutri_validated_at   timestamptz,
  nutri_blocked        boolean                      NOT NULL DEFAULT false,
  nutri_comment        text,
  resto_comment        text,
  price_eur            numeric,
  cost_eur             numeric,
  supplier             text,
  active               boolean                      NOT NULL DEFAULT true,
  out_of_stock         boolean                      NOT NULL DEFAULT false,
  archived_at          timestamptz,
  created_at           timestamptz                  NOT NULL DEFAULT now(),
  updated_at           timestamptz                  NOT NULL DEFAULT now(),
  created_by           uuid,
  last_modified_by     uuid,
  CONSTRAINT articles_pkey PRIMARY KEY (id),
  CONSTRAINT articles_nutri_validated_by_fkey FOREIGN KEY (nutri_validated_by) REFERENCES food_passport.profiles(id),
  CONSTRAINT articles_created_by_fkey FOREIGN KEY (created_by) REFERENCES food_passport.profiles(id),
  CONSTRAINT articles_last_modified_by_fkey FOREIGN KEY (last_modified_by) REFERENCES food_passport.profiles(id)
);

-- trips
CREATE TABLE food_passport.trips (
  id             uuid        NOT NULL DEFAULT uuid_generate_v4(),
  name           text        NOT NULL,
  city           text,
  start_date     date        NOT NULL,
  end_date       date        NOT NULL,
  hotel_id       uuid,
  stadium        text,
  match_time     timestamptz,
  training_times text,
  meal_times     text,
  status         text        NOT NULL DEFAULT 'planifie',
  created_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trips_pkey PRIMARY KEY (id),
  CONSTRAINT trips_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES food_passport.hotels(id),
  CONSTRAINT trips_created_by_fkey FOREIGN KEY (created_by) REFERENCES food_passport.profiles(id)
);

-- menus
CREATE TABLE food_passport.menus (
  id               uuid                       NOT NULL DEFAULT uuid_generate_v4(),
  title            text                       NOT NULL,
  date             date                       NOT NULL,
  service          food_passport.service_type NOT NULL,
  location_type    text                       NOT NULL,
  location_name    text,
  start_time       time,
  end_time         time,
  trip_id          uuid,
  status           text                       NOT NULL DEFAULT 'brouillon',
  order_deadline   timestamptz,
  total_portions   integer,
  nutri_validated  boolean                    NOT NULL DEFAULT false,
  nutri_validated_at timestamptz,
  published_at     timestamptz,
  created_by       uuid,
  created_at       timestamptz                NOT NULL DEFAULT now(),
  updated_at       timestamptz                NOT NULL DEFAULT now(),
  CONSTRAINT menus_pkey PRIMARY KEY (id),
  CONSTRAINT menus_trip_fk FOREIGN KEY (trip_id) REFERENCES food_passport.trips(id) ON DELETE SET NULL,
  CONSTRAINT menus_created_by_fkey FOREIGN KEY (created_by) REFERENCES food_passport.profiles(id)
);

-- orders
CREATE TABLE food_passport.orders (
  id                       uuid                          NOT NULL DEFAULT uuid_generate_v4(),
  reference                text                          NOT NULL DEFAULT ('C-' || lpad(nextval('food_passport.orders_ref_seq'::regclass)::text, 6, '0')),
  player_id                uuid                          NOT NULL,
  trip_id                  uuid,
  hotel_id                 uuid,
  room_number              text,
  service                  food_passport.service_type    NOT NULL,
  location_label           text,
  scheduled_at             timestamptz                   NOT NULL,
  deadline                 timestamptz,
  status                   food_passport.order_status    NOT NULL DEFAULT 'brouillon',
  priority                 food_passport.order_priority  NOT NULL DEFAULT 'normal',
  validated_by_nutri       uuid,
  validated_by_nutri_at    timestamptz,
  nutri_adjustment_notes   text,
  nutri_refusal_reason     text,
  validated_by_resto       uuid,
  validated_by_resto_at    timestamptz,
  transmitted_to_kitchen_at timestamptz,
  transmitted_to_hotel_at  timestamptz,
  prep_started_at          timestamptz,
  ready_at                 timestamptz,
  delivered_at             timestamptz,
  player_comment_original  text,
  player_comment_lang      food_passport.supported_lang,
  archived_at              timestamptz,
  created_at               timestamptz                   NOT NULL DEFAULT now(),
  updated_at               timestamptz                   NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_reference_key UNIQUE (reference),
  CONSTRAINT orders_player_id_fkey FOREIGN KEY (player_id) REFERENCES food_passport.players(id),
  CONSTRAINT orders_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES food_passport.trips(id),
  CONSTRAINT orders_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES food_passport.hotels(id),
  CONSTRAINT orders_validated_by_nutri_fkey FOREIGN KEY (validated_by_nutri) REFERENCES food_passport.profiles(id),
  CONSTRAINT orders_validated_by_resto_fkey FOREIGN KEY (validated_by_resto) REFERENCES food_passport.profiles(id)
);

-- order_items
CREATE TABLE food_passport.order_items (
  id              uuid    NOT NULL DEFAULT uuid_generate_v4(),
  order_id        uuid    NOT NULL,
  article_id      uuid    NOT NULL,
  quantity        numeric NOT NULL DEFAULT 1,
  portion_g       integer,
  player_note     text,
  nutri_note      text,
  removed_by_nutri boolean NOT NULL DEFAULT false,
  added_by_nutri  boolean NOT NULL DEFAULT false,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES food_passport.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_article_id_fkey FOREIGN KEY (article_id) REFERENCES food_passport.articles(id)
);

-- order_validation_logs
CREATE TABLE food_passport.order_validation_logs (
  id          uuid                        NOT NULL DEFAULT uuid_generate_v4(),
  order_id    uuid                        NOT NULL,
  action      text                        NOT NULL,
  actor_id    uuid,
  actor_role  food_passport.user_role,
  from_status food_passport.order_status,
  to_status   food_passport.order_status,
  notes       text,
  created_at  timestamptz                 NOT NULL DEFAULT now(),
  CONSTRAINT order_validation_logs_pkey PRIMARY KEY (id),
  CONSTRAINT order_validation_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES food_passport.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_validation_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES food_passport.profiles(id)
);

-- order_comment_translations
CREATE TABLE food_passport.order_comment_translations (
  id                uuid                        NOT NULL DEFAULT uuid_generate_v4(),
  order_id          uuid                        NOT NULL,
  lang              food_passport.supported_lang NOT NULL,
  translated_text   text                        NOT NULL,
  auto_translated   boolean                     NOT NULL DEFAULT true,
  manual_correction boolean                     NOT NULL DEFAULT false,
  created_at        timestamptz                 NOT NULL DEFAULT now(),
  CONSTRAINT order_comment_translations_pkey PRIMARY KEY (id),
  CONSTRAINT order_comment_translations_order_id_lang_key UNIQUE (order_id, lang),
  CONSTRAINT order_comment_translations_order_id_fkey FOREIGN KEY (order_id) REFERENCES food_passport.orders(id) ON DELETE CASCADE
);

-- menu_items
CREATE TABLE food_passport.menu_items (
  id                uuid    NOT NULL DEFAULT uuid_generate_v4(),
  menu_id           uuid    NOT NULL,
  article_id        uuid    NOT NULL,
  display_order     integer NOT NULL DEFAULT 0,
  available         boolean NOT NULL DEFAULT true,
  portions_available integer,
  notes             text,
  CONSTRAINT menu_items_pkey PRIMARY KEY (id),
  CONSTRAINT menu_items_menu_id_article_id_key UNIQUE (menu_id, article_id),
  CONSTRAINT menu_items_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES food_passport.menus(id) ON DELETE CASCADE,
  CONSTRAINT menu_items_article_id_fkey FOREIGN KEY (article_id) REFERENCES food_passport.articles(id)
);

-- menu_translations
CREATE TABLE food_passport.menu_translations (
  id      uuid                        NOT NULL DEFAULT uuid_generate_v4(),
  menu_id uuid                        NOT NULL,
  lang    food_passport.supported_lang NOT NULL,
  title   text                        NOT NULL,
  notes   text,
  CONSTRAINT menu_translations_pkey PRIMARY KEY (id),
  CONSTRAINT menu_translations_menu_id_lang_key UNIQUE (menu_id, lang),
  CONSTRAINT menu_translations_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES food_passport.menus(id) ON DELETE CASCADE
);

-- article_translations
CREATE TABLE food_passport.article_translations (
  id                uuid                        NOT NULL DEFAULT uuid_generate_v4(),
  article_id        uuid                        NOT NULL,
  lang              food_passport.supported_lang NOT NULL,
  name              text                        NOT NULL,
  description       text,
  auto_translated   boolean                     NOT NULL DEFAULT true,
  manual_correction boolean                     NOT NULL DEFAULT false,
  updated_at        timestamptz                 NOT NULL DEFAULT now(),
  CONSTRAINT article_translations_pkey PRIMARY KEY (id),
  CONSTRAINT article_translations_article_id_lang_key UNIQUE (article_id, lang),
  CONSTRAINT article_translations_article_id_fkey FOREIGN KEY (article_id) REFERENCES food_passport.articles(id) ON DELETE CASCADE
);

-- article_allergens
CREATE TABLE food_passport.article_allergens (
  article_id  uuid NOT NULL,
  allergen_id uuid NOT NULL,
  CONSTRAINT article_allergens_pkey PRIMARY KEY (article_id, allergen_id),
  CONSTRAINT article_allergens_article_id_fkey FOREIGN KEY (article_id) REFERENCES food_passport.articles(id) ON DELETE CASCADE,
  CONSTRAINT article_allergens_allergen_id_fkey FOREIGN KEY (allergen_id) REFERENCES food_passport.allergens(id) ON DELETE CASCADE
);

-- hotel_access
CREATE TABLE food_passport.hotel_access (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4(),
  trip_id     uuid        NOT NULL,
  hotel_id    uuid        NOT NULL,
  profile_id  uuid        NOT NULL,
  token_hash  text        NOT NULL,
  starts_at   timestamptz NOT NULL,
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  granted_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hotel_access_pkey PRIMARY KEY (id),
  CONSTRAINT hotel_access_token_hash_key UNIQUE (token_hash),
  CONSTRAINT hotel_access_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES food_passport.trips(id) ON DELETE CASCADE,
  CONSTRAINT hotel_access_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES food_passport.hotels(id),
  CONSTRAINT hotel_access_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES food_passport.profiles(id),
  CONSTRAINT hotel_access_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES food_passport.profiles(id)
);

-- hotel_specifications
CREATE TABLE food_passport.hotel_specifications (
  id                   uuid        NOT NULL DEFAULT uuid_generate_v4(),
  hotel_id             uuid        NOT NULL,
  doc_url              text,
  breakfast_standards  text,
  lunch_standards      text,
  dinner_standards     text,
  snack_standards      text,
  match_eve_protocol   text,
  match_day_protocol   text,
  after_match_protocol text,
  halal_requirements   text,
  allergen_handling    text,
  temperature_rules    text,
  traceability_rules   text,
  room_delivery_rules  text,
  presentation_rules   text,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hotel_specifications_pkey PRIMARY KEY (id),
  CONSTRAINT hotel_specifications_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES food_passport.hotels(id) ON DELETE CASCADE
);

-- player_onboarding_forms
CREATE TABLE food_passport.player_onboarding_forms (
  id                      uuid                       NOT NULL DEFAULT uuid_generate_v4(),
  player_id               uuid                       NOT NULL,
  status                  food_passport.form_status  NOT NULL DEFAULT 'brouillon',
  completion_percent      integer                    NOT NULL DEFAULT 0,
  filled_by               uuid,
  validated_by            uuid,
  validated_at            timestamptz,
  diet_type               text, meal_rhythm text, morning_appetite text,
  post_training_appetite  text, post_match_appetite text,
  regular_foods           text[], rare_foods text[], refused_foods text[],
  digestive_notes         text, water_type text,
  daily_water_liters      numeric,
  preferred_drinks        text[], avoided_drinks text[],
  energy_drinks_tolerance text, coffee_tea_habits text,
  travel_specific_needs   text, preferred_cuisine text,
  comfort_foods           text[], familiar_foods text[],
  difficult_foods         text[], refused_textures text[],
  spice_tolerance         text, fav_club_dish text,
  fav_pre_match_dish      text, fav_post_match_dish text,
  fav_travel_dish         text, fav_room_service_dish text,
  fav_dessert             text, fav_drink text,
  match_eve_routine       text, match_day_routine text,
  ideal_pre_match_meal    text, pre_match_avoided text[],
  ideal_pre_match_snack   text, pre_match_drink text,
  pre_effort_digestion    text, post_match_routine text,
  hotel_breakfast_pref    text, hotel_room_service_pref text,
  hotel_usual_times       text, frequent_room_requests text,
  travel_reassuring_foods text[], hotel_avoided_foods text[],
  recovery_specific_needs text, player_likes text,
  player_dislikes         text, resto_expectations text,
  nutri_expectations      text, player_free_notes text,
  private_nutri_remarks   text,
  archived_at             timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT player_onboarding_forms_pkey PRIMARY KEY (id),
  CONSTRAINT player_onboarding_forms_player_id_fkey FOREIGN KEY (player_id) REFERENCES food_passport.players(id) ON DELETE CASCADE,
  CONSTRAINT player_onboarding_forms_filled_by_fkey FOREIGN KEY (filled_by) REFERENCES food_passport.profiles(id),
  CONSTRAINT player_onboarding_forms_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES food_passport.profiles(id)
);

-- player_onboarding_history
CREATE TABLE food_passport.player_onboarding_history (
  id            uuid        NOT NULL DEFAULT uuid_generate_v4(),
  form_id       uuid        NOT NULL,
  changed_by    uuid,
  changed_at    timestamptz NOT NULL DEFAULT now(),
  field_changed text,
  old_value     jsonb,
  new_value     jsonb,
  CONSTRAINT player_onboarding_history_pkey PRIMARY KEY (id),
  CONSTRAINT player_onboarding_history_form_id_fkey FOREIGN KEY (form_id) REFERENCES food_passport.player_onboarding_forms(id) ON DELETE CASCADE,
  CONSTRAINT player_onboarding_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES food_passport.profiles(id)
);

-- player_food_restrictions
CREATE TABLE food_passport.player_food_restrictions (
  id                      uuid    NOT NULL DEFAULT uuid_generate_v4(),
  player_id               uuid    NOT NULL,
  type                    text    NOT NULL,
  allergen_id             uuid,
  label                   text    NOT NULL,
  severity                text,
  forbidden_foods         text[],
  cross_contamination_risk boolean DEFAULT false,
  medical_doc_url         text,
  nutri_comment           text,
  active                  boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT player_food_restrictions_pkey PRIMARY KEY (id),
  CONSTRAINT player_food_restrictions_player_id_fkey FOREIGN KEY (player_id) REFERENCES food_passport.players(id) ON DELETE CASCADE,
  CONSTRAINT player_food_restrictions_allergen_id_fkey FOREIGN KEY (allergen_id) REFERENCES food_passport.allergens(id)
);

-- player_breakfast_preferences
CREATE TABLE food_passport.player_breakfast_preferences (
  player_id           uuid   NOT NULL,
  takes_breakfast     boolean,
  usual_time          time,
  taste_pref          text,
  preferred_drinks    text[],
  dairy_accepted      boolean,
  cereals_accepted    text[],
  bread_accepted      boolean,
  eggs_accepted       boolean,
  fav_fruits          text[],
  avoided_at_breakfast text[],
  ideal_breakfast     text,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT player_breakfast_preferences_pkey PRIMARY KEY (player_id),
  CONSTRAINT player_breakfast_preferences_player_id_fkey FOREIGN KEY (player_id) REFERENCES food_passport.players(id) ON DELETE CASCADE
);

-- player_lunch_preferences
CREATE TABLE food_passport.player_lunch_preferences (
  player_id           uuid NOT NULL,
  preferred_dish_types text[],
  preferred_starches  text[],
  preferred_proteins  text[],
  accepted_vegetables text[],
  accepted_sauces     text[],
  refused_foods       text[],
  usual_quantity      text,
  fav_dishes          text[],
  digestive_notes     text,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT player_lunch_preferences_pkey PRIMARY KEY (player_id),
  CONSTRAINT player_lunch_preferences_player_id_fkey FOREIGN KEY (player_id) REFERENCES food_passport.players(id) ON DELETE CASCADE
);

-- player_dinner_preferences
CREATE TABLE food_passport.player_dinner_preferences (
  player_id            uuid NOT NULL,
  meal_size            text,
  evening_starches_ok  boolean,
  preferred_proteins   text[],
  accepted_vegetables  text[],
  fav_dishes           text[],
  evening_avoided      text[],
  match_eve_habits     text,
  evening_digestion    text,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT player_dinner_preferences_pkey PRIMARY KEY (player_id),
  CONSTRAINT player_dinner_preferences_player_id_fkey FOREIGN KEY (player_id) REFERENCES food_passport.players(id) ON DELETE CASCADE
);

-- player_snack_preferences
CREATE TABLE food_passport.player_snack_preferences (
  player_id               uuid NOT NULL,
  preferred_snacks        text[],
  pre_training_snack      text,
  pre_match_snack         text,
  recovery_snack          text,
  fav_fruits              text[],
  dairy_accepted          boolean,
  bars_compotes_smoothies text[],
  recovery_drinks         text[],
  refused_snacks          text[],
  updated_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT player_snack_preferences_pkey PRIMARY KEY (player_id),
  CONSTRAINT player_snack_preferences_player_id_fkey FOREIGN KEY (player_id) REFERENCES food_passport.players(id) ON DELETE CASCADE
);

-- nutrition_plans
CREATE TABLE food_passport.nutrition_plans (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4(),
  player_id   uuid,
  group_label text,
  context     text        NOT NULL,
  start_date  date,
  end_date    date,
  active      boolean     NOT NULL DEFAULT true,
  notes       text,
  created_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nutrition_plans_pkey PRIMARY KEY (id),
  CONSTRAINT nutrition_plans_player_id_fkey FOREIGN KEY (player_id) REFERENCES food_passport.players(id) ON DELETE CASCADE,
  CONSTRAINT nutrition_plans_created_by_fkey FOREIGN KEY (created_by) REFERENCES food_passport.profiles(id)
);

-- nutrition_plan_articles
CREATE TABLE food_passport.nutrition_plan_articles (
  id                   uuid NOT NULL DEFAULT uuid_generate_v4(),
  plan_id              uuid NOT NULL,
  article_id           uuid NOT NULL,
  auth_level           text NOT NULL DEFAULT 'autorise',
  recommended_portion_g integer,
  frequency            text,
  nutri_comment        text,
  CONSTRAINT nutrition_plan_articles_pkey PRIMARY KEY (id),
  CONSTRAINT nutrition_plan_articles_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES food_passport.nutrition_plans(id) ON DELETE CASCADE,
  CONSTRAINT nutrition_plan_articles_article_id_fkey FOREIGN KEY (article_id) REFERENCES food_passport.articles(id)
);

-- nutrition_protocols
CREATE TABLE food_passport.nutrition_protocols (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4(),
  name        text        NOT NULL,
  context     text        NOT NULL,
  description text,
  active      boolean     NOT NULL DEFAULT true,
  created_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nutrition_protocols_pkey PRIMARY KEY (id),
  CONSTRAINT nutrition_protocols_created_by_fkey FOREIGN KEY (created_by) REFERENCES food_passport.profiles(id)
);

-- nutri_delegation
CREATE TABLE food_passport.nutri_delegation (
  id           uuid        NOT NULL DEFAULT uuid_generate_v4(),
  delegate_id  uuid        NOT NULL,
  granted_by   uuid        NOT NULL,
  starts_at    timestamptz NOT NULL,
  ends_at      timestamptz NOT NULL,
  active       boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nutri_delegation_pkey PRIMARY KEY (id),
  CONSTRAINT nutri_delegation_delegate_id_fkey FOREIGN KEY (delegate_id) REFERENCES food_passport.profiles(id) ON DELETE CASCADE,
  CONSTRAINT nutri_delegation_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES food_passport.profiles(id)
);

-- trip_players
CREATE TABLE food_passport.trip_players (
  trip_id   uuid NOT NULL,
  player_id uuid NOT NULL,
  CONSTRAINT trip_players_pkey PRIMARY KEY (trip_id, player_id),
  CONSTRAINT trip_players_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES food_passport.trips(id) ON DELETE CASCADE,
  CONSTRAINT trip_players_player_id_fkey FOREIGN KEY (player_id) REFERENCES food_passport.players(id) ON DELETE CASCADE
);

-- rooming
CREATE TABLE food_passport.rooming (
  id          uuid NOT NULL DEFAULT uuid_generate_v4(),
  trip_id     uuid NOT NULL,
  player_id   uuid NOT NULL,
  room_number text NOT NULL,
  notes       text,
  CONSTRAINT rooming_pkey PRIMARY KEY (id),
  CONSTRAINT rooming_trip_id_player_id_key UNIQUE (trip_id, player_id),
  CONSTRAINT rooming_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES food_passport.trips(id) ON DELETE CASCADE,
  CONSTRAINT rooming_player_id_fkey FOREIGN KEY (player_id) REFERENCES food_passport.players(id)
);

-- feedbacks
CREATE TABLE food_passport.feedbacks (
  id               uuid                         NOT NULL DEFAULT uuid_generate_v4(),
  order_id         uuid,
  player_id        uuid,
  trip_id          uuid,
  hotel_id         uuid,
  topic            food_passport.feedback_topic[],
  rating           integer                      NOT NULL,
  smiley           text,
  comment_original text,
  comment_lang     food_passport.supported_lang,
  tags             text[],
  created_at       timestamptz                  NOT NULL DEFAULT now(),
  CONSTRAINT feedbacks_pkey PRIMARY KEY (id),
  CONSTRAINT feedbacks_order_id_fkey FOREIGN KEY (order_id) REFERENCES food_passport.orders(id) ON DELETE SET NULL,
  CONSTRAINT feedbacks_player_id_fkey FOREIGN KEY (player_id) REFERENCES food_passport.players(id),
  CONSTRAINT feedbacks_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES food_passport.trips(id),
  CONSTRAINT feedbacks_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES food_passport.hotels(id)
);

-- feedback_translations
CREATE TABLE food_passport.feedback_translations (
  id                 uuid                        NOT NULL DEFAULT uuid_generate_v4(),
  feedback_id        uuid                        NOT NULL,
  lang               food_passport.supported_lang NOT NULL,
  translated_comment text,
  created_at         timestamptz                 NOT NULL DEFAULT now(),
  CONSTRAINT feedback_translations_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_translations_feedback_id_lang_key UNIQUE (feedback_id, lang),
  CONSTRAINT feedback_translations_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES food_passport.feedbacks(id) ON DELETE CASCADE
);

-- notifications
CREATE TABLE food_passport.notifications (
  id           uuid                         NOT NULL DEFAULT uuid_generate_v4(),
  recipient_id uuid                         NOT NULL,
  type         text                         NOT NULL,
  title_key    text                         NOT NULL,
  body_key     text,
  body_params  jsonb                        DEFAULT '{}',
  order_id     uuid,
  trip_id      uuid,
  feedback_id  uuid,
  read_at      timestamptz,
  priority     food_passport.order_priority NOT NULL DEFAULT 'normal',
  created_at   timestamptz                  NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES food_passport.profiles(id) ON DELETE CASCADE,
  CONSTRAINT notifications_order_id_fkey FOREIGN KEY (order_id) REFERENCES food_passport.orders(id) ON DELETE CASCADE,
  CONSTRAINT notifications_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES food_passport.trips(id) ON DELETE CASCADE,
  CONSTRAINT notifications_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES food_passport.feedbacks(id) ON DELETE CASCADE
);

-- action_photos
CREATE TABLE food_passport.action_photos (
  id                uuid                        NOT NULL DEFAULT uuid_generate_v4(),
  storage_path      text                        NOT NULL,
  uploaded_by       uuid,
  uploader_role     food_passport.user_role,
  order_id          uuid,
  trip_id           uuid,
  hotel_id          uuid,
  feedback_id       uuid,
  context_type      text                        NOT NULL,
  caption           text,
  status            food_passport.photo_status  NOT NULL DEFAULT 'en_attente',
  validated_by      uuid,
  validated_at      timestamptz,
  validator_comment text,
  created_at        timestamptz                 NOT NULL DEFAULT now(),
  CONSTRAINT action_photos_pkey PRIMARY KEY (id),
  CONSTRAINT action_photos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES food_passport.profiles(id),
  CONSTRAINT action_photos_order_id_fkey FOREIGN KEY (order_id) REFERENCES food_passport.orders(id) ON DELETE SET NULL,
  CONSTRAINT action_photos_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES food_passport.trips(id) ON DELETE SET NULL,
  CONSTRAINT action_photos_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES food_passport.hotels(id) ON DELETE SET NULL,
  CONSTRAINT action_photos_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES food_passport.feedbacks(id) ON DELETE SET NULL,
  CONSTRAINT action_photos_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES food_passport.profiles(id)
);

-- photo_validation_logs
CREATE TABLE food_passport.photo_validation_logs (
  id         uuid        NOT NULL DEFAULT uuid_generate_v4(),
  photo_id   uuid        NOT NULL,
  actor_id   uuid,
  action     text        NOT NULL,
  comment    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT photo_validation_logs_pkey PRIMARY KEY (id),
  CONSTRAINT photo_validation_logs_photo_id_fkey FOREIGN KEY (photo_id) REFERENCES food_passport.action_photos(id) ON DELETE CASCADE,
  CONSTRAINT photo_validation_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES food_passport.profiles(id)
);

-- audit_logs
CREATE TABLE food_passport.audit_logs (
  id         uuid                    NOT NULL DEFAULT uuid_generate_v4(),
  actor_id   uuid,
  actor_role food_passport.user_role,
  action     text                    NOT NULL,
  table_name text,
  record_id  uuid,
  old_value  jsonb,
  new_value  jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz             NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES food_passport.profiles(id)
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION food_passport.current_user_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'food_passport', 'extensions', 'public' AS $$
  SELECT role::text FROM food_passport.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION food_passport.current_player_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'food_passport', 'extensions', 'public' AS $$
  SELECT id FROM food_passport.players WHERE profile_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION food_passport.hotel_has_active_access()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'food_passport', 'extensions', 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM food_passport.hotel_access ha
    WHERE ha.profile_id = auth.uid()
      AND ha.expires_at > NOW()
      AND ha.revoked_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION food_passport.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'food_passport', 'extensions', 'public' AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION food_passport.enforce_nutri_validation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'food_passport', 'extensions', 'public' AS $$
BEGIN
  IF NEW.status IN (
       'transmise_resto',
       'validee_resto',
       'transmise_cuisine',
       'transmise_hotel',
       'en_preparation',
       'prete',
       'livree'
     )
     AND NEW.validated_by_nutri_at IS NULL THEN
    RAISE EXCEPTION
      'RÈGLE FONDAMENTALE: la commande % ne peut pas passer au statut "%" sans validation nutritionniste préalable.',
      NEW.reference, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION food_passport.log_order_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'food_passport', 'extensions', 'public' AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO food_passport.order_validation_logs (
      order_id, action, actor_id, from_status, to_status, notes
    ) VALUES (
      NEW.id, 'status_change', auth.uid(), OLD.status, NEW.status, NULL
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION food_passport.log_onboarding_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'food_passport', 'extensions', 'public' AS $$
BEGIN
  INSERT INTO food_passport.audit_logs (
    actor_id, action, table_name, record_id, old_data, new_data
  ) VALUES (
    auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id,
    CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
    row_to_json(NEW)::jsonb
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- set_updated_at on all relevant tables
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','players','articles','article_translations','menus',
    'orders','player_onboarding_forms','player_breakfast_preferences',
    'player_lunch_preferences','player_dinner_preferences',
    'player_snack_preferences','nutrition_plans','hotel_specifications','trips'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON food_passport.%I
       FOR EACH ROW EXECUTE FUNCTION food_passport.set_updated_at()', t
    );
  END LOOP;
END;
$$;

CREATE TRIGGER trg_enforce_nutri_validation
  BEFORE INSERT OR UPDATE ON food_passport.orders
  FOR EACH ROW EXECUTE FUNCTION food_passport.enforce_nutri_validation();

CREATE TRIGGER trg_log_order_status
  AFTER UPDATE ON food_passport.orders
  FOR EACH ROW EXECUTE FUNCTION food_passport.log_order_status_change();

CREATE TRIGGER trg_log_onboarding
  AFTER INSERT OR UPDATE ON food_passport.player_onboarding_forms
  FOR EACH ROW EXECUTE FUNCTION food_passport.log_onboarding_change();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_profiles_role ON food_passport.profiles USING btree (role);
CREATE INDEX idx_players_profile_id ON food_passport.players USING btree (profile_id);
CREATE INDEX idx_orders_player_id ON food_passport.orders USING btree (player_id);
CREATE INDEX idx_orders_status ON food_passport.orders USING btree (status);
CREATE INDEX idx_orders_scheduled_at ON food_passport.orders USING btree (scheduled_at);
CREATE INDEX idx_orders_validated_at ON food_passport.orders USING btree (validated_by_nutri_at) WHERE validated_by_nutri_at IS NOT NULL;
CREATE INDEX idx_order_items_order_id ON food_passport.order_items USING btree (order_id);
CREATE INDEX idx_hotel_access_profile ON food_passport.hotel_access USING btree (profile_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX idx_notifications_recipient ON food_passport.notifications USING btree (recipient_id, read_at) WHERE read_at IS NULL;

-- ============================================================
-- VIEW
-- ============================================================

CREATE VIEW food_passport.players_operational AS
  SELECT p.id, p.profile_id, p.first_name, p.last_name, p.jersey_number,
    p.position, p.squad_group, p.photo_url, p.preferred_lang, p.status,
    o.diet_type, o.preferred_cuisine, o.comfort_foods, o.familiar_foods,
    o.refused_foods, o.refused_textures, o.spice_tolerance, o.water_type,
    o.preferred_drinks, o.avoided_drinks, o.travel_specific_needs,
    o.hotel_breakfast_pref, o.hotel_room_service_pref, o.frequent_room_requests,
    o.fav_pre_match_dish, o.fav_post_match_dish, o.fav_travel_dish, o.fav_room_service_dish
  FROM food_passport.players p
  LEFT JOIN food_passport.player_onboarding_forms o ON o.player_id = p.id;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','players','articles','article_translations','article_allergens',
    'allergens','menus','menu_items','menu_translations','orders','order_items',
    'order_validation_logs','order_comment_translations','hotel_access',
    'hotel_specifications','hotels','trips','trip_players','rooming',
    'feedbacks','feedback_translations','notifications','action_photos',
    'photo_validation_logs','audit_logs','nutri_delegation','nutrition_plans',
    'nutrition_plan_articles','nutrition_protocols','player_onboarding_forms',
    'player_onboarding_history','player_food_restrictions',
    'player_breakfast_preferences','player_lunch_preferences',
    'player_dinner_preferences','player_snack_preferences'
  ] LOOP
    EXECUTE format('ALTER TABLE food_passport.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END;
$$;

-- profiles
CREATE POLICY "profiles: own read" ON food_passport.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles: own update" ON food_passport.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles: nutri/admin read all" ON food_passport.profiles FOR SELECT
  USING (food_passport.current_user_role() = ANY (ARRAY['super_admin','admin_nutri','admin_resto','admin_team_manager','direction']));

-- players
CREATE POLICY "players: own read" ON food_passport.players FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "players: staff read all" ON food_passport.players FOR SELECT
  USING (food_passport.current_user_role() = ANY (ARRAY['super_admin','admin_nutri','admin_resto','admin_team_manager','cuisine','direction']));
CREATE POLICY "players: nutri write" ON food_passport.players FOR ALL
  USING (food_passport.current_user_role() = ANY (ARRAY['super_admin','admin_nutri']));
CREATE POLICY "players: hotel read active trip" ON food_passport.players FOR SELECT
  USING (food_passport.current_user_role() = 'hotel' AND food_passport.hotel_has_active_access());

-- articles
CREATE POLICY "articles: all read" ON food_passport.articles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "articles: resto/nutri write" ON food_passport.articles FOR ALL
  USING (food_passport.current_user_role() = ANY (ARRAY['super_admin','admin_nutri','admin_resto']));

-- menus
CREATE POLICY "menus: all read" ON food_passport.menus FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "menus: resto/nutri write" ON food_passport.menus FOR ALL
  USING (food_passport.current_user_role() = ANY (ARRAY['super_admin','admin_nutri','admin_resto']));

-- menu_items
CREATE POLICY "menu_items: all read" ON food_passport.menu_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "menu_items: resto/nutri write" ON food_passport.menu_items FOR ALL
  USING (food_passport.current_user_role() = ANY (ARRAY['super_admin','admin_nutri','admin_resto']));

-- orders
CREATE POLICY "orders: player read own" ON food_passport.orders FOR SELECT
  USING (player_id = food_passport.current_player_id());
CREATE POLICY "orders: player insert own" ON food_passport.orders FOR INSERT
  WITH CHECK (player_id = food_passport.current_player_id());
CREATE POLICY "orders: nutri all" ON food_passport.orders FOR ALL
  USING (food_passport.current_user_role() = ANY (ARRAY['super_admin','admin_nutri']));
CREATE POLICY "orders: resto read all" ON food_passport.orders FOR SELECT
  USING (food_passport.current_user_role() = ANY (ARRAY['admin_resto','admin_team_manager','direction']));
CREATE POLICY "orders: cuisine read validated" ON food_passport.orders FOR SELECT
  USING (food_passport.current_user_role() = 'cuisine' AND validated_by_nutri_at IS NOT NULL);
CREATE POLICY "orders: cuisine update validated" ON food_passport.orders FOR UPDATE
  USING (food_passport.current_user_role() = 'cuisine' AND validated_by_nutri_at IS NOT NULL);
CREATE POLICY "orders: hotel read validated" ON food_passport.orders FOR SELECT
  USING (food_passport.current_user_role() = 'hotel' AND validated_by_nutri_at IS NOT NULL AND food_passport.hotel_has_active_access());

-- order_validation_logs
CREATE POLICY "order_logs: player read own" ON food_passport.order_validation_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM food_passport.orders o WHERE o.id = order_id AND o.player_id = food_passport.current_player_id()));
CREATE POLICY "order_logs: staff read" ON food_passport.order_validation_logs FOR SELECT
  USING (food_passport.current_user_role() = ANY (ARRAY['super_admin','admin_nutri','admin_resto','admin_team_manager','direction']));

-- hotel_access
CREATE POLICY "hotel_access: hotel read own" ON food_passport.hotel_access FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "hotel_access: team manager all" ON food_passport.hotel_access FOR ALL
  USING (food_passport.current_user_role() = ANY (ARRAY['super_admin','admin_team_manager']));

-- player_onboarding_forms
CREATE POLICY "onboarding: player read own" ON food_passport.player_onboarding_forms FOR SELECT
  USING (player_id = food_passport.current_player_id());
CREATE POLICY "onboarding: nutri all" ON food_passport.player_onboarding_forms FOR ALL
  USING (food_passport.current_user_role() = ANY (ARRAY['super_admin','admin_nutri']));
CREATE POLICY "onboarding: resto/cuisine read" ON food_passport.player_onboarding_forms FOR SELECT
  USING (food_passport.current_user_role() = ANY (ARRAY['admin_resto','cuisine']));

-- notifications
CREATE POLICY "notifications: read own" ON food_passport.notifications FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "notifications: update own" ON food_passport.notifications FOR UPDATE USING (recipient_id = auth.uid());

-- audit_logs
CREATE POLICY "audit_logs: super admin read" ON food_passport.audit_logs FOR SELECT
  USING (food_passport.current_user_role() = 'super_admin');

-- trips
CREATE POLICY "trips: team manager all" ON food_passport.trips FOR ALL
  USING (food_passport.current_user_role() = ANY (ARRAY['super_admin','admin_team_manager']));
CREATE POLICY "trips: staff read" ON food_passport.trips FOR SELECT
  USING (food_passport.current_user_role() = ANY (ARRAY['admin_nutri','admin_resto','cuisine','direction']));
CREATE POLICY "trips: player read own" ON food_passport.trips FOR SELECT
  USING (EXISTS (SELECT 1 FROM food_passport.trip_players tp WHERE tp.trip_id = id AND tp.player_id = food_passport.current_player_id()));

-- ============================================================
-- REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE food_passport.orders;

-- ============================================================
-- GRANTS
-- ============================================================

GRANT USAGE ON SCHEMA food_passport TO authenticated, anon;
GRANT USAGE ON SEQUENCE food_passport.orders_ref_seq TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA food_passport TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA food_passport TO anon;
