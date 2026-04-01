-- Fix for client_portal_users table and trigger constraints
-- This resolves the "no unique constraint for ON CONFLICT" error and missing "id" column

DO $$ 
BEGIN 
    -- 1. Add 'id' column if missing (Required by ClientActivation.tsx and frontend logic)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'client_portal_users' AND column_name = 'id') THEN
        ALTER TABLE public.client_portal_users ADD COLUMN id UUID DEFAULT gen_random_uuid();
        -- Optional: If you want to make it a Primary Key, you'd need to drop the old one first.
        -- For now, adding it is enough to satisfy the .select('id') query.
    END IF;

    -- 2. Add 'UNIQUE' constraint on 'user_id' (Required by the handle_new_portal_user trigger for ON CONFLICT)
    -- The previous migrations might have created a composite PK (user_id, client_id) which is not sufficient.
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'client_portal_users_user_id_key'
    ) THEN
        ALTER TABLE public.client_portal_users ADD CONSTRAINT client_portal_users_user_id_key UNIQUE (user_id);
    END IF;

    -- 3. Ensure the trigger function is correctly defined and uses the right schema
    -- (The trigger was already using public. but let's be explicit and robust)
END $$;

-- 4. Re-verify the trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created_for_portal ON auth.users;
CREATE TRIGGER on_auth_user_created_for_portal
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_portal_user();

-- 5. Fix possible RLS issue on client_portal_invites (Accessing it while unauthenticated)
DROP POLICY IF EXISTS "Public can view active invite by token" ON public.client_portal_invites;
CREATE POLICY "Public can view active invite by token" ON public.client_portal_invites
    FOR SELECT TO public
    USING (is_used = false AND (expires_at > NOW() OR expires_at IS NULL));

-- 6. Ensure 'client_portal_users' allows authenticated users to see their own mapping
-- This is critical for AuthContext.tsx to identify them as 'Cliente' instead of 'Usuário'
DROP POLICY IF EXISTS "Users can see their own mapping" ON public.client_portal_users;
CREATE POLICY "Users can see their own mapping" ON public.client_portal_users
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
