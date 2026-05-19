-- Add preferred_language to profiles
ALTER TABLE food_passport.profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'fr'
  CHECK (preferred_language IN ('fr','en','es','pt','ar','de'));

-- Add sender_language to messages
ALTER TABLE food_passport.messages
  ADD COLUMN IF NOT EXISTS sender_language TEXT DEFAULT 'fr';

-- Store cached translations
CREATE TABLE IF NOT EXISTS food_passport.message_translations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      UUID REFERENCES food_passport.messages(id) ON DELETE CASCADE,
  language        TEXT NOT NULL,
  translated_content TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, language)
);

ALTER TABLE food_passport.message_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participant_read_translations" ON food_passport.message_translations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM food_passport.messages m
      JOIN food_passport.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id AND auth.uid() = ANY(c.participant_ids)
    )
  );

-- Service role can insert translations (called from API route with service key)
CREATE POLICY "service_insert_translations" ON food_passport.message_translations
  FOR INSERT WITH CHECK (true);
