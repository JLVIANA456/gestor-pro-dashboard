-- ================================================================
-- MIGRAÇÃO: Tabela de Tokens para Upload Público de Documentos
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ================================================================

-- 1. Criar extensão UUID caso não exista
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Criar tabela de tokens de upload público
CREATE TABLE IF NOT EXISTS public.client_upload_tokens (
    id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    token        uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    client_id    uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    created_at   timestamptz DEFAULT now() NOT NULL,
    expires_at   timestamptz NOT NULL,
    used_count   integer DEFAULT 0 NOT NULL
);

-- 3. Index para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_client_upload_tokens_token ON public.client_upload_tokens(token);

-- 4. Habilitar Row Level Security
ALTER TABLE public.client_upload_tokens ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de acesso
-- Escritório autenticado pode criar e ver tokens
CREATE POLICY "Authenticated users can manage tokens"
    ON public.client_upload_tokens
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Qualquer pessoa pode ler um token pelo valor (para validar o link público)
CREATE POLICY "Public can read tokens for validation"
    ON public.client_upload_tokens
    FOR SELECT
    TO anon
    USING (true);

-- 6. Criar tabela de documentos enviados pelos clientes (se não existir)
CREATE TABLE IF NOT EXISTS public.client_documents (
    id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id    uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    file_name    text NOT NULL,
    file_url     text NOT NULL,
    file_type    text NOT NULL DEFAULT 'entrada', -- 'entrada' = cliente enviou | 'saida' = escritório enviou
    category     text NOT NULL DEFAULT 'outro',
    description  text,
    month        date,
    is_read      boolean DEFAULT false NOT NULL,
    uploaded_by  uuid REFERENCES auth.users(id),
    created_at   timestamptz DEFAULT now() NOT NULL
);

-- 7. Habilitar RLS em client_documents
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- 8. Políticas para client_documents
CREATE POLICY "Authenticated users can manage documents"
    ON public.client_documents
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Usuários anônimos podem inserir documentos (via link público)
CREATE POLICY "Anon users can insert documents"
    ON public.client_documents
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- ================================================================
-- STORAGE: Criar bucket para os documentos (se não existir)
-- Execute também no SQL Editor do Supabase
-- ================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Política de storage: qualquer pessoa pode fazer upload (para links públicos)
CREATE POLICY "Public upload allowed"
    ON storage.objects
    FOR INSERT
    TO anon
    WITH CHECK (bucket_id = 'client-documents');

-- Política de storage: qualquer pessoa pode ler documentos
CREATE POLICY "Public read allowed"
    ON storage.objects
    FOR SELECT
    TO anon
    USING (bucket_id = 'client-documents');

-- Política de storage: autenticados têm acesso total
CREATE POLICY "Authenticated full access"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (bucket_id = 'client-documents')
    WITH CHECK (bucket_id = 'client-documents');
