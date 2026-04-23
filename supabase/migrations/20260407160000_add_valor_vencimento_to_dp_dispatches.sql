-- Adicionar colunas valor e data_vencimento à tabela dp_dispatches
ALTER TABLE public.dp_dispatches
    ADD COLUMN IF NOT EXISTS valor NUMERIC(15,2),
    ADD COLUMN IF NOT EXISTS data_vencimento DATE;
