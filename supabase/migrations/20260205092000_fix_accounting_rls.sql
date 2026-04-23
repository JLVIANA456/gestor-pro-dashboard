-- Enable RLS (just in case)
ALTER TABLE public.accounting_closings ENABLE ROW LEVEL SECURITY;

-- Allow select for authenticated users (or anon if needed)
CREATE POLICY "Allow select for all" ON public.accounting_closings
    FOR SELECT USING (true);

-- Allow insert for authenticated users (or anon if needed)
CREATE POLICY "Allow insert for all" ON public.accounting_closings
    FOR INSERT WITH CHECK (true);

-- Allow update for authenticated users (or anon if needed)
CREATE POLICY "Allow update for all" ON public.accounting_closings
    FOR UPDATE USING (true);

-- Allow delete for authenticated users (or anon if needed)
CREATE POLICY "Allow delete for all" ON public.accounting_closings
    FOR DELETE USING (true);

-- Grant permissions to public/anon/authenticated roles just to be sure
GRANT ALL ON public.accounting_closings TO anon;
GRANT ALL ON public.accounting_closings TO authenticated;
GRANT ALL ON public.accounting_closings TO service_role;
