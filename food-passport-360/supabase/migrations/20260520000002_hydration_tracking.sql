-- Enrichir prescribed_meals avec hydratation détaillée
ALTER TABLE food_passport.prescribed_meals
ADD COLUMN IF NOT EXISTS water_type TEXT
  CHECK (water_type IN ('flat','st_yorre','isotonic_powerbar',
                        'isotonic_apurna','sislab_electrolyte',
                        'sislab_rego','other')),
ADD COLUMN IF NOT EXISTS water_ml_flat INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS water_ml_st_yorre INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS water_ml_isotonic INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS electrolyte_brand TEXT
  CHECK (electrolyte_brand IN ('sislab','apurna','powerbar','other')),
ADD COLUMN IF NOT EXISTS electrolyte_mg_sodium INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS electrolyte_mg_potassium INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS electrolyte_mg_magnesium INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS electrolyte_mg_calcium INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS points_hydration INT DEFAULT 2;

-- Consommation hydratation réelle
ALTER TABLE food_passport.meal_consumption
ADD COLUMN IF NOT EXISTS water_ml_flat_actual INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS water_ml_st_yorre_actual INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS water_ml_isotonic_actual INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS urine_color INT CHECK (urine_color BETWEEN 1 AND 8);

-- Table monitoring hydratation journalier
CREATE TABLE IF NOT EXISTS food_passport.hydration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES food_passport.profiles(id),
  date DATE NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  water_type TEXT CHECK (water_type IN ('flat','st_yorre','isotonic_powerbar',
                         'isotonic_apurna','sislab_electrolyte','other')),
  quantity_ml INT NOT NULL,
  context TEXT CHECK (context IN ('morning','before_training','during_training',
                      'after_training','with_meal','before_match',
                      'during_match','post_match','evening')),
  urine_color INT CHECK (urine_color BETWEEN 1 AND 8)
);

ALTER TABLE food_passport.hydration_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player_own_hydration" ON food_passport.hydration_log
  FOR ALL USING (player_id = auth.uid());
CREATE POLICY "nutri_read_hydration" ON food_passport.hydration_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM food_passport.profiles
    WHERE id = auth.uid() AND role IN ('admin_nutri','super_admin'))
  );

ALTER PUBLICATION supabase_realtime ADD TABLE food_passport.hydration_log;
