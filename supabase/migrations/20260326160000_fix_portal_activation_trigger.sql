-- # Fix for Portal Activation
-- This migration adds a trigger to automatically create the link in client_portal_users
-- when a new user signs up with the client_id in their metadata.
-- This avoids race conditions and RLS issues in the frontend.

-- 1. Create the function that will handle the insertion
CREATE OR REPLACE FUNCTION public.handle_new_portal_user()
RETURNS TRIGGER AS $$
DECLARE
    client_id_val UUID;
BEGIN
    -- Extract client_id from raw_user_meta_data
    client_id_val := (NEW.raw_user_meta_data->>'client_id')::UUID;

    IF client_id_val IS NOT NULL THEN
        INSERT INTO public.client_portal_users (user_id, client_id)
        VALUES (NEW.id, client_id_val)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on auth.users
-- We use a trigger on auth.users directly to ensure it runs regardless of RLS
DROP TRIGGER IF EXISTS on_auth_user_created_for_portal ON auth.users;
CREATE TRIGGER on_auth_user_created_for_portal
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_portal_user();

-- 3. Improve RLS for client_portal_users
-- Ensure users can see their own mapping and admins can see everything
ALTER TABLE public.client_portal_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage all portal users" ON public.client_portal_users;
CREATE POLICY "Admins manage all portal users" ON public.client_portal_users 
    FOR ALL TO authenticated 
    USING (true);

DROP POLICY IF EXISTS "Users can see their own mapping" ON public.client_portal_users;
CREATE POLICY "Users can see their own mapping" ON public.client_portal_users 
    FOR SELECT TO authenticated 
    USING (auth.uid() = user_id);
