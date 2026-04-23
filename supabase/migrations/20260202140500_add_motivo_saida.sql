-- Add motivo_saida column to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS motivo_saida TEXT;
