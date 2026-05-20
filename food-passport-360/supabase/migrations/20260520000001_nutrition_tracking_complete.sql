-- ═══════════════════════════════════════════════════════════
-- NUTRITION TRACKING COMPLETE — periodization, supplements, scores
-- ═══════════════════════════════════════════════════════════

-- Nutrition programs with periodization
CREATE TABLE IF NOT EXISTS food_passport.nutrition_programs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  type          TEXT CHECK (type IN ('individual','collective')),
  player_ids    UUID[],
  created_by    UUID REFERENCES food_passport.profiles(id),
  match_date    DATE,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  training_load JSONB DEFAULT '[]',
  status        TEXT DEFAULT 'active' CHECK (status IN ('draft','active','completed','archived')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Daily nutrition plan per program/player/date
CREATE TABLE IF NOT EXISTS food_passport.daily_nutrition_plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id          UUID REFERENCES food_passport.nutrition_programs(id) ON DELETE CASCADE,
  player_id           UUID REFERENCES food_passport.profiles(id),
  date                DATE NOT NULL,
  day_type            TEXT CHECK (day_type IN ('j-6','j-5','j-4','j-3','j-2','j-1','match','j+1','j+2','normal')),
  target_calories     INT,
  target_protein_g    DECIMAL,
  target_carbs_g      DECIMAL,
  target_fat_g        DECIMAL,
  target_water_ml     INT,
  target_fiber_g      DECIMAL,
  meal_priorities     JSONB DEFAULT '{}',
  notes_from_nutri    TEXT,
  nutri_message       TEXT,
  nutri_message_lang  TEXT DEFAULT 'fr',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, player_id, date)
);

-- Prescribed meals per daily plan
CREATE TABLE IF NOT EXISTS food_passport.prescribed_meals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_plan_id       UUID REFERENCES food_passport.daily_nutrition_plans(id) ON DELETE CASCADE,
  service             TEXT CHECK (service IN ('breakfast','snack_am','lunch','snack_pm','dinner','pre_match','post_match')),
  vegetables_g        INT DEFAULT 0,
  starch_g            INT DEFAULT 0,
  protein_g           INT DEFAULT 0,
  water_ml            INT DEFAULT 0,
  points_vegetables   INT DEFAULT 1,
  points_starch       INT DEFAULT 1,
  points_protein      INT DEFAULT 1,
  points_water        INT DEFAULT 1,
  points_supplements  INT DEFAULT 1,
  sort_order          INT DEFAULT 0,
  notes               TEXT
);

-- Prescribed supplements
CREATE TABLE IF NOT EXISTS food_passport.prescribed_supplements (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_plan_id                 UUID REFERENCES food_passport.daily_nutrition_plans(id) ON DELETE CASCADE,
  meal_service                  TEXT CHECK (meal_service IN ('breakfast','snack_am','lunch','snack_pm','dinner','pre_match','post_match','any')),
  brand                         TEXT CHECK (brand IN ('nutrition_x','apurna','sislab','powerbar','beet_it','other')),
  brand_other                   TEXT,
  product_name                  TEXT NOT NULL,
  product_type                  TEXT CHECK (product_type IN ('protein_shake','gel','bar','recovery_drink','isotonic','beetroot_shot','bcaa','omega3','vitamin','other')),
  quantity_g                    DECIMAL,
  quantity_ml                   DECIMAL,
  quantity_units                INT,
  water_ml                      INT DEFAULT 0,
  timing_minutes_before_effort  INT,
  timing_minutes_after_effort   INT,
  timing_note                   TEXT,
  points                        INT DEFAULT 2,
  sort_order                    INT DEFAULT 0
);

-- Actual meal consumption logged by player
CREATE TABLE IF NOT EXISTS food_passport.meal_consumption (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_plan_id       UUID REFERENCES food_passport.daily_nutrition_plans(id) ON DELETE CASCADE,
  player_id           UUID REFERENCES food_passport.profiles(id),
  service             TEXT,
  vegetables_g_actual INT,
  starch_g_actual     INT,
  protein_g_actual    INT,
  water_ml_actual     INT,
  consumed_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Supplement consumption logged by player
CREATE TABLE IF NOT EXISTS food_passport.supplement_consumption (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescribed_supplement_id    UUID REFERENCES food_passport.prescribed_supplements(id) ON DELETE CASCADE,
  player_id                   UUID REFERENCES food_passport.profiles(id),
  taken                       BOOLEAN DEFAULT false,
  taken_at                    TIMESTAMPTZ,
  notes                       TEXT
);

-- Daily score and avatar color
CREATE TABLE IF NOT EXISTS food_passport.daily_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID REFERENCES food_passport.profiles(id),
  program_id      UUID REFERENCES food_passport.nutrition_programs(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  score_percent   DECIMAL,
  avatar_color    TEXT CHECK (avatar_color IN ('red','orange','yellow','green','blue','gold')),
  points_earned   INT DEFAULT 0,
  points_possible INT DEFAULT 0,
  streak_days     INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, program_id, date)
);

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE food_passport.nutrition_programs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_passport.daily_nutrition_plans   ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_passport.prescribed_meals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_passport.prescribed_supplements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_passport.meal_consumption        ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_passport.supplement_consumption  ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_passport.daily_scores            ENABLE ROW LEVEL SECURITY;

-- Nutri + super_admin manage programs
CREATE POLICY "nutri_manage_programs" ON food_passport.nutrition_programs
  FOR ALL USING (EXISTS (
    SELECT 1 FROM food_passport.profiles
    WHERE id = auth.uid() AND role IN ('admin_nutri','super_admin')
  ));

-- Player reads own plan; nutri reads all
CREATE POLICY "player_read_own_plan" ON food_passport.daily_nutrition_plans
  FOR SELECT USING (
    player_id = auth.uid() OR
    EXISTS (SELECT 1 FROM food_passport.profiles WHERE id = auth.uid() AND role IN ('admin_nutri','super_admin'))
  );

CREATE POLICY "nutri_manage_plans" ON food_passport.daily_nutrition_plans
  FOR ALL USING (EXISTS (
    SELECT 1 FROM food_passport.profiles WHERE id = auth.uid() AND role IN ('admin_nutri','super_admin')
  ));

-- Prescribed meals/supplements visible to plan participants + nutri
CREATE POLICY "plan_participants_read_meals" ON food_passport.prescribed_meals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM food_passport.daily_nutrition_plans dnp
      WHERE dnp.id = daily_plan_id
        AND (dnp.player_id = auth.uid() OR
             EXISTS (SELECT 1 FROM food_passport.profiles WHERE id = auth.uid() AND role IN ('admin_nutri','super_admin')))
    )
  );

CREATE POLICY "nutri_manage_meals" ON food_passport.prescribed_meals
  FOR ALL USING (EXISTS (
    SELECT 1 FROM food_passport.profiles WHERE id = auth.uid() AND role IN ('admin_nutri','super_admin')
  ));

CREATE POLICY "plan_participants_read_supplements" ON food_passport.prescribed_supplements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM food_passport.daily_nutrition_plans dnp
      WHERE dnp.id = daily_plan_id
        AND (dnp.player_id = auth.uid() OR
             EXISTS (SELECT 1 FROM food_passport.profiles WHERE id = auth.uid() AND role IN ('admin_nutri','super_admin')))
    )
  );

CREATE POLICY "nutri_manage_supplements" ON food_passport.prescribed_supplements
  FOR ALL USING (EXISTS (
    SELECT 1 FROM food_passport.profiles WHERE id = auth.uid() AND role IN ('admin_nutri','super_admin')
  ));

-- Player logs own consumption
CREATE POLICY "player_manage_consumption" ON food_passport.meal_consumption
  FOR ALL USING (player_id = auth.uid());

CREATE POLICY "player_manage_supplement_consumption" ON food_passport.supplement_consumption
  FOR ALL USING (player_id = auth.uid());

-- Score readable by player + nutri + team manager
CREATE POLICY "score_read_policy" ON food_passport.daily_scores
  FOR SELECT USING (
    player_id = auth.uid() OR
    EXISTS (SELECT 1 FROM food_passport.profiles
      WHERE id = auth.uid() AND role IN ('admin_nutri','super_admin','admin_team_manager'))
  );

CREATE POLICY "score_write_policy" ON food_passport.daily_scores
  FOR ALL USING (
    player_id = auth.uid() OR
    EXISTS (SELECT 1 FROM food_passport.profiles WHERE id = auth.uid() AND role IN ('admin_nutri','super_admin'))
  );
