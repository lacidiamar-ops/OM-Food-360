-- Storage bucket for player photos
-- Bucket is public (photos shown to cuisine/hotel as operational data)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'player-photos',
  'player-photos',
  true,
  2097152,  -- 2 MB max after client-side resize
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users (nutri / admin_resto / super_admin) can upload
CREATE POLICY "Authenticated users can upload player photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'player-photos');

-- Authenticated users can update (re-upload same path)
CREATE POLICY "Authenticated users can update player photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'player-photos');

-- Public read — photos are operational (shown to cuisine, hotel)
CREATE POLICY "Player photos are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'player-photos');

-- Authenticated users can delete (for cleanup on re-upload)
CREATE POLICY "Authenticated users can delete player photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'player-photos');
