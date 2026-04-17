-- Adicionar coluna empresa_em_andamento na tabela accounting_closings
ALTER TABLE public.accounting_closings 
ADD COLUMN empresa_em_andamento BOOLEAN NOT NULL DEFAULT false;

-- Forçar recarregamento do cache do PostgREST
NOTIFY pgrst, 'reload config';
