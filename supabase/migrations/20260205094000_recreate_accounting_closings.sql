-- DESCARTAR a tabela incorreta antiga
DROP TABLE IF EXISTS public.accounting_closings;

-- RECRIAR a tabela com as colunas corretas
CREATE TABLE public.accounting_closings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  colaborador_responsavel TEXT NOT NULL,
  mes_ano_fechamento DATE NOT NULL,
  conciliacao_contabil BOOLEAN NOT NULL DEFAULT false,
  controle_lucros BOOLEAN NOT NULL DEFAULT false,
  controle_aplicacao_financeira BOOLEAN NOT NULL DEFAULT false,
  controle_anual BOOLEAN NOT NULL DEFAULT false,
  empresa_encerrada BOOLEAN NOT NULL DEFAULT false,
  pendencias TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Recriar as políticas de segurança (RLS)
ALTER TABLE public.accounting_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for all" ON public.accounting_closings FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON public.accounting_closings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all" ON public.accounting_closings FOR UPDATE USING (true);
CREATE POLICY "Allow delete for all" ON public.accounting_closings FOR DELETE USING (true);

-- Garantir permissões
GRANT ALL ON public.accounting_closings TO anon;
GRANT ALL ON public.accounting_closings TO authenticated;
GRANT ALL ON public.accounting_closings TO service_role;

-- Forçar recarregamento do cache (se o comando estiver habilitado no seu postgres)
NOTIFY pgrst, 'reload config';
