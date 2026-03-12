-- Create a specific migration for the new inactivate logic
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS inactivated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS inactivation_reason TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS inactivation_details TEXT;

-- Create a function to clean up clients that have been inactive for more than 12 months
CREATE OR REPLACE FUNCTION public.cleanup_expired_inactive_clients()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.clients
  WHERE is_active = false
  AND inactivated_at < now() - INTERVAL '12 months';
END;
$$ LANGUAGE plpgsql;

-- In a real Supabase environment, you would enable pg_cron and schedule this:
-- SELECT cron.schedule('0 0 * * *', 'SELECT public.cleanup_expired_inactive_clients()');
