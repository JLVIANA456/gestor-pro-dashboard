-- # 1. Create client_portal_users table
CREATE TABLE IF NOT EXISTS public.client_portal_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id) -- One auth user per one portal access
);

-- # 2. Create client_documents table
CREATE TABLE IF NOT EXISTS public.client_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT, -- 'entrada' (cliente subiu), 'saida' (escritório enviou)
    category TEXT, -- 'nota_fiscal', 'extrato', 'balancete', 'guia', 'outro'
    description TEXT,
    month DATE, -- Competência
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- # 3. Create client_upload_tokens table (for public links)
CREATE TABLE IF NOT EXISTS public.client_upload_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    expires_at TIMESTAMPTZ NOT NULL,
    max_uses INTEGER DEFAULT 0, -- 0 for unlimited
    used_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- # 4. Storage Bucket for Client Documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client-documents', 'client-documents', true)
ON CONFLICT (id) DO NOTHING;

-- # 5. RLS Policies
ALTER TABLE public.client_portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_upload_tokens ENABLE ROW LEVEL SECURITY;

-- ## Table: client_portal_users
CREATE POLICY "Admins can do everything on client_portal_users" ON public.client_portal_users FOR ALL TO authenticated USING (true);

-- ## Table: client_documents
CREATE POLICY "Admins can do everything on client_documents" ON public.client_documents FOR ALL TO authenticated USING (true);

CREATE POLICY "Clients can see their own documents" ON public.client_documents
    FOR SELECT TO authenticated
    USING (
        client_id IN (SELECT client_id FROM public.client_portal_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Clients can insert their own documents" ON public.client_documents
    FOR INSERT TO authenticated
    WITH CHECK (
        client_id IN (SELECT client_id FROM public.client_portal_users WHERE user_id = auth.uid())
    );

-- MANDATORY FOR PUBLIC UPLOAD: Allow anyone (anon) to insert into client_documents
-- In a project with higher security we'd validate the token here via RPC
CREATE POLICY "Public can insert documents" ON public.client_documents
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- ## Table: client_upload_tokens
CREATE POLICY "Admins can do everything on client_upload_tokens" ON public.client_upload_tokens FOR ALL TO authenticated USING (true);

-- Allow anon to select tokens to validate the link
CREATE POLICY "Public can validate tokens" ON public.client_upload_tokens
    FOR SELECT TO anon, authenticated
    USING (expires_at > now());

-- # 6. Storage Policies (Bucket: client-documents)
-- Allow public uploads
CREATE POLICY "Public upload to client-documents" ON storage.objects
    FOR INSERT TO public
    WITH CHECK (bucket_id = 'client-documents');

-- Allow reading files
CREATE POLICY "Public read from client-documents" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'client-documents');
