-- CHAT CONVERSATIONS
CREATE TABLE IF NOT EXISTS food_passport.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('joueur_manager','joueur_nutri','manager_cuisine',
                            'manager_hotel','nutri_cuisine','nutri_hotel')),
  participant_ids UUID[] NOT NULL,
  trip_id UUID REFERENCES food_passport.trips(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_passport.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES food_passport.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES food_passport.profiles(id),
  content TEXT NOT NULL,
  read_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_date ON food_passport.messages(conversation_id, created_at DESC);

ALTER TABLE food_passport.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_passport.messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='food_passport' AND tablename='conversations' AND policyname='participant_access_conversation'
  ) THEN
    CREATE POLICY "participant_access_conversation" ON food_passport.conversations
      FOR ALL USING (auth.uid() = ANY(participant_ids));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='food_passport' AND tablename='messages' AND policyname='participant_access_messages'
  ) THEN
    CREATE POLICY "participant_access_messages" ON food_passport.messages
      FOR ALL USING (
        EXISTS (SELECT 1 FROM food_passport.conversations
          WHERE id = conversation_id AND auth.uid() = ANY(participant_ids))
      );
  END IF;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE food_passport.messages;
EXCEPTION WHEN others THEN NULL;
END $$;

-- MEAL SCHEDULES
CREATE TABLE IF NOT EXISTS food_passport.meal_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  service TEXT NOT NULL CHECK (service IN ('breakfast','lunch','dinner','snack')),
  location TEXT NOT NULL CHECK (location IN ('centre','hotel','deplacement')),
  trip_id UUID REFERENCES food_passport.trips(id),
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  player_group TEXT NOT NULL DEFAULT 'all',
  notes TEXT,
  created_by UUID REFERENCES food_passport.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_schedules_date ON food_passport.meal_schedules(date, service);

ALTER TABLE food_passport.meal_schedules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='food_passport' AND tablename='meal_schedules' AND policyname='nutri_manager_manage_schedules'
  ) THEN
    CREATE POLICY "nutri_manager_manage_schedules" ON food_passport.meal_schedules
      FOR ALL USING (
        EXISTS (SELECT 1 FROM food_passport.profiles
          WHERE id = auth.uid()
          AND role IN ('admin_nutri','admin_team_manager','super_admin'))
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='food_passport' AND tablename='meal_schedules' AND policyname='all_read_schedules'
  ) THEN
    CREATE POLICY "all_read_schedules" ON food_passport.meal_schedules
      FOR SELECT USING (true);
  END IF;
END $$;
