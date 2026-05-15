-- Nettoyage automatique des accès hôtel expirés
-- Supprime les records dont expires_at est dépassé depuis plus de 30 jours
-- (audit trail conservé pendant 30 j après expiration)

CREATE OR REPLACE FUNCTION food_passport.cleanup_expired_hotel_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'food_passport', 'extensions', 'public'
AS $$
BEGIN
  DELETE FROM food_passport.hotel_access
  WHERE expires_at < NOW() - INTERVAL '30 days'
    AND revoked_at IS NOT NULL OR expires_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Extension pg_cron requise (disponible sur Supabase)
-- Exécution quotidienne à 3h00 UTC
SELECT cron.schedule(
  'cleanup-expired-hotel-access',
  '0 3 * * *',
  $$SELECT food_passport.cleanup_expired_hotel_access()$$
);
