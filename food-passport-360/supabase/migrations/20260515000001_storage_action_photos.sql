-- Bucket action-photos : photos de preuve repas uploadées par les joueurs
-- Privé : lecture réservée aux rôles staff + joueur propriétaire
-- 5 Mo max, webp/jpg/png uniquement

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'action-photos',
  'action-photos',
  false,
  5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- ── Upload ────────────────────────────────────────────────────────────────────
-- Un utilisateur authentifié peut uploader uniquement dans son propre dossier
-- (path : <auth.uid()>/<order_id>/<timestamp>.webp)
CREATE POLICY "joueur can upload own action photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'action-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ── Suppression ───────────────────────────────────────────────────────────────
-- Un joueur ne peut supprimer que ses propres photos
CREATE POLICY "joueur can delete own action photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'action-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ── Lecture ───────────────────────────────────────────────────────────────────
-- Joueur : ses propres photos uniquement
-- Staff (nutri, resto, hôtel, team manager, admin) : toutes les photos
CREATE POLICY "joueur and staff can read action photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'action-photos'
  AND (
    -- propriétaire du fichier
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- rôle staff autorisé
    EXISTS (
      SELECT 1
      FROM food_passport.profiles
      WHERE id = auth.uid()
        AND role IN (
          'admin_nutri',
          'admin_resto',
          'hotel',
          'admin_team_manager',
          'super_admin',
          'direction',
          'cuisine'
        )
    )
  )
);

-- ── Mise à jour (remplacement) ────────────────────────────────────────────────
-- Un joueur peut remplacer son propre fichier (re-upload)
CREATE POLICY "joueur can update own action photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'action-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
