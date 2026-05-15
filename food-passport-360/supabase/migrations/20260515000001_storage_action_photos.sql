-- Bucket action-photos : photos de preuve repas uploadées par les joueurs
-- Public (URLs publiques lisibles), 5 MB max, webp/jpg/png

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'action-photos',
  'action-photos',
  true,
  5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload
CREATE POLICY "authenticated can upload action photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'action-photos');

-- Authenticated users can update their own uploads
CREATE POLICY "authenticated can update own action photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'action-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Anyone can read (public bucket)
CREATE POLICY "public can read action photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'action-photos');

-- Authenticated users can delete their own uploads
CREATE POLICY "authenticated can delete own action photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'action-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
