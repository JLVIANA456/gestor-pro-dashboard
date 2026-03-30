-- Drop triggers and functions associated with portal activation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_portal_user() CASCADE;

-- Drop policies that depend on client_portal_users to prevent errors during table drop
DROP POLICY IF EXISTS "Clients can see their own documents" ON public.client_documents;
DROP POLICY IF EXISTS "Clients can insert their own documents" ON public.client_documents;

DROP POLICY IF EXISTS "Clients can see their own folders" ON public.client_portal_folders;
DROP POLICY IF EXISTS "Clients can see their own deliveries" ON public.client_deliveries;

-- Drop the table
DROP TABLE IF EXISTS public.client_portal_users CASCADE;

-- Add simple Public/Anon policies so the frontend can query data directly using LocalStorage Client ID
-- (This trades strict RLS for login convenience as requested)
CREATE POLICY "Public can select client documents" ON public.client_documents FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert client documents" ON public.client_documents FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Public can select client folders" ON public.client_portal_folders FOR SELECT TO public USING (true);
CREATE POLICY "Public can select client deliveries" ON public.client_deliveries FOR SELECT TO public USING (true);
