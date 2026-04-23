-- Executar no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS public.portal_content (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL, -- 'boas_praticas', 'avisos_oficiais', 'prazos_importantes', 'videos_treinamentos', 'reforma_tributaria'
    title text NOT NULL,
    content text,
    video_url text,
    due_date date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.portal_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.portal_content FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.portal_content FOR ALL USING (auth.role() = 'authenticated');
