-- ============================================================
-- FOOD PASSPORT 360 — seed de test
-- Profils fictifs, 1 par rôle + données liées
--
-- IMPORTANT : ce seed contourne auth.users (table gérée par Supabase Auth).
-- En dev local, créer d'abord les utilisateurs via le Dashboard Supabase ou
-- `supabase auth admin create-user` pour obtenir les mêmes UUID,
-- puis exécuter ce script via `supabase db reset` ou `psql`.
--
-- UUID fixes pour retrouver facilement en dev :
--   joueur       : 11111111-0000-0000-0000-000000000001
--   admin_nutri  : 22222222-0000-0000-0000-000000000002
--   cuisine      : 33333333-0000-0000-0000-000000000003
--   hotel        : 44444444-0000-0000-0000-000000000004
--   team_manager : 55555555-0000-0000-0000-000000000005
--   direction    : 66666666-0000-0000-0000-000000000006
--   article      : aa000000-0000-0000-0000-000000000001
--   menu         : bb000000-0000-0000-0000-000000000001
--   order        : cc000000-0000-0000-0000-000000000001
-- ============================================================

-- ── 0. Insérer des utilisateurs fantômes dans auth.users ────────────────────
-- (nécessaire pour la FK profiles.id → auth.users.id)
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at, role)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'joueur@test.fp',   now(), now(), now(), 'authenticated'),
  ('22222222-0000-0000-0000-000000000002', 'nutri@test.fp',    now(), now(), now(), 'authenticated'),
  ('33333333-0000-0000-0000-000000000003', 'cuisine@test.fp',  now(), now(), now(), 'authenticated'),
  ('44444444-0000-0000-0000-000000000004', 'hotel@test.fp',    now(), now(), now(), 'authenticated'),
  ('55555555-0000-0000-0000-000000000005', 'manager@test.fp',  now(), now(), now(), 'authenticated'),
  ('66666666-0000-0000-0000-000000000006', 'direction@test.fp',now(), now(), now(), 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- ── 1. Profils ───────────────────────────────────────────────────────────────
INSERT INTO food_passport.profiles
  (id, email, full_name, role, preferred_lang, active)
VALUES
  (
    '11111111-0000-0000-0000-000000000001',
    'joueur@test.fp',
    'Karim Benzara',
    'joueur',
    'fr',
    true
  ),
  (
    '22222222-0000-0000-0000-000000000002',
    'nutri@test.fp',
    'Sophie Durand',
    'admin_nutri',
    'fr',
    true
  ),
  (
    '33333333-0000-0000-0000-000000000003',
    'cuisine@test.fp',
    'Marco Ferretti',
    'cuisine',
    'it',
    true
  ),
  (
    '44444444-0000-0000-0000-000000000004',
    'hotel@test.fp',
    'Hassan El Mansouri',
    'hotel',
    'ar',
    true
  ),
  (
    '55555555-0000-0000-0000-000000000005',
    'manager@test.fp',
    'Luis García',
    'admin_team_manager',
    'es',
    true
  ),
  (
    '66666666-0000-0000-0000-000000000006',
    'direction@test.fp',
    'Nathalie Moreau',
    'direction',
    'fr',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  full_name     = EXCLUDED.full_name,
  role          = EXCLUDED.role,
  preferred_lang = EXCLUDED.preferred_lang,
  updated_at    = now();

-- ── 2. Fiche joueur (données opérationnelles — pas de données médicales) ─────
INSERT INTO food_passport.players
  (id, profile_id, first_name, last_name, jersey_number, position,
   squad_group, status, preferred_lang, weight_kg, height_cm)
VALUES
  (
    'dd000000-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'Karim',
    'Benzara',
    10,
    'attaquant',
    'Groupe A',
    'actif',
    'fr',
    78.5,
    183
  )
ON CONFLICT (profile_id) DO UPDATE SET
  jersey_number = EXCLUDED.jersey_number,
  status        = EXCLUDED.status,
  updated_at    = now();

-- ── 3. Article de test (validé nutri) ────────────────────────────────────────
INSERT INTO food_passport.articles
  (id, name, category, short_description, standard_portion_g, unit,
   is_halal, available_center, available_match_day,
   nutri_validated, nutri_validated_by, nutri_validated_at,
   created_by)
VALUES
  (
    'aa000000-0000-0000-0000-000000000001',
    'Poulet grillé citron-herbes',
    'proteine_animale',
    'Blanc de poulet Label Rouge, marinade citron-thym, cuisson vapeur-grill',
    150,
    'g',
    true,
    true,
    true,
    true,
    '22222222-0000-0000-0000-000000000002',
    now(),
    '22222222-0000-0000-0000-000000000002'
  )
ON CONFLICT (id) DO NOTHING;

-- ── 4. Menu du jour (publié, validé nutri) ───────────────────────────────────
INSERT INTO food_passport.menus
  (id, title, date, service, location_type, location_name,
   start_time, end_time, status, nutri_validated, nutri_validated_at,
   published_at, created_by)
VALUES
  (
    'bb000000-0000-0000-0000-000000000001',
    'Menu test — déjeuner centre',
    current_date,
    'dejeuner',
    'centre',
    'Centre Robert-Louis Dreyfus',
    '12:00',
    '14:00',
    'publie',
    true,
    now(),
    now(),
    '22222222-0000-0000-0000-000000000002'
  )
ON CONFLICT (id) DO NOTHING;

-- Lier l'article au menu
INSERT INTO food_passport.menu_items
  (menu_id, article_id, sort_order)
VALUES
  ('bb000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', 1)
ON CONFLICT DO NOTHING;

-- ── 5. Commande exemple (statut soumise — en attente validation nutri) ────────
INSERT INTO food_passport.orders
  (id, player_id, service, scheduled_at, status, priority,
   player_comment_original, player_comment_lang)
VALUES
  (
    'cc000000-0000-0000-0000-000000000001',
    'dd000000-0000-0000-0000-000000000001',
    'dejeuner',
    (current_date + interval '1 day' + time '12:30'),
    'soumise',
    'normal',
    'Pas de citron sur le poulet svp',
    'fr'
  )
ON CONFLICT (id) DO NOTHING;

-- Item de commande lié à l'article
INSERT INTO food_passport.order_items
  (order_id, article_id, quantity_requested, unit)
VALUES
  (
    'cc000000-0000-0000-0000-000000000001',
    'aa000000-0000-0000-0000-000000000001',
    1,
    'portion'
  )
ON CONFLICT DO NOTHING;

-- Log initial de la commande
INSERT INTO food_passport.order_validation_logs
  (order_id, actor_id, action, from_status, to_status, notes)
VALUES
  (
    'cc000000-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'soumis',
    'brouillon',
    'soumise',
    'Commande soumise par le joueur'
  )
ON CONFLICT DO NOTHING;

-- ── Résumé ───────────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Seed test FOOD PASSPORT 360';
  RAISE NOTICE '   Profils  : 6 (joueur / nutri / cuisine / hotel / manager / direction)';
  RAISE NOTICE '   Joueur   : Karim Benzara #10 — dd000000-…-0001';
  RAISE NOTICE '   Article  : Poulet grillé citron-herbes — aa000000-…-0001';
  RAISE NOTICE '   Menu     : déjeuner centre aujourd''hui — bb000000-…-0001';
  RAISE NOTICE '   Commande : statut soumise (en attente nutri) — cc000000-…-0001';
END $$;
