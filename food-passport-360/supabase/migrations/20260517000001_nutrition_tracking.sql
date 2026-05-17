-- Table nutrition_tracking dans le schema food_passport
CREATE TYPE food_passport.tracking_status AS ENUM ('valide', 'a_surveiller', 'alerte');

CREATE TABLE food_passport.nutrition_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES food_passport.players(id) ON DELETE CASCADE,
  nutri_id uuid NOT NULL REFERENCES food_passport.profiles(id),
  tracking_date date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric(5,2),
  hydration smallint CHECK (hydration BETWEEN 0 AND 10),
  sleep_hours numeric(4,1),
  fatigue smallint CHECK (fatigue BETWEEN 0 AND 10),
  breakfast_quality smallint CHECK (breakfast_quality BETWEEN 0 AND 10),
  lunch_quality smallint CHECK (lunch_quality BETWEEN 0 AND 10),
  dinner_quality smallint CHECK (dinner_quality BETWEEN 0 AND 10),
  proteins_g numeric(6,1),
  carbs_g numeric(6,1),
  lipids_g numeric(6,1),
  calories integer,
  nutri_comment text,
  status food_passport.tracking_status NOT NULL DEFAULT 'a_surveiller',
  score_nutrition smallint GENERATED ALWAYS AS (
    LEAST(100, GREATEST(0,
      COALESCE(hydration, 0) * 10
      + CASE
          WHEN sleep_hours >= 8 THEN 20
          WHEN sleep_hours >= 7 THEN 15
          WHEN sleep_hours >= 6 THEN 8
          WHEN sleep_hours >= 5 THEN 4
          ELSE 0
        END
      + COALESCE(breakfast_quality, 0)
      + COALESCE(lunch_quality, 0)
      + COALESCE(dinner_quality, 0)
      - COALESCE(fatigue, 0) * 2
    ))
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON food_passport.nutrition_tracking (player_id, tracking_date DESC);
CREATE INDEX ON food_passport.nutrition_tracking (nutri_id);

-- Trigger updated_at
CREATE TRIGGER trg_nutrition_tracking_updated_at
  BEFORE UPDATE ON food_passport.nutrition_tracking
  FOR EACH ROW EXECUTE FUNCTION food_passport.set_updated_at();

-- RLS
ALTER TABLE food_passport.nutrition_tracking ENABLE ROW LEVEL SECURITY;

-- Nutritionniste: voir et modifier tout
CREATE POLICY "nutri_all" ON food_passport.nutrition_tracking
  FOR ALL TO authenticated
  USING (food_passport.current_user_role() IN ('admin_nutri', 'super_admin', 'direction'))
  WITH CHECK (food_passport.current_user_role() IN ('admin_nutri', 'super_admin', 'direction'));

-- Joueur: voir seulement sa propre fiche
CREATE POLICY "joueur_read_own" ON food_passport.nutrition_tracking
  FOR SELECT TO authenticated
  USING (
    food_passport.current_user_role() = 'joueur'
    AND player_id = (
      SELECT id FROM food_passport.players WHERE profile_id = auth.uid()
    )
  );
