-- Add data_saida column to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS data_saida TEXT;

-- Ensure data_entrada exists (just in case)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS data_entrada TEXT;
