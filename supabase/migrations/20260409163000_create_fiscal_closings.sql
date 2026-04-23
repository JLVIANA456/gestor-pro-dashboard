-- CREATE the fiscal_closings table
CREATE TABLE IF NOT EXISTS public.fiscal_closings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  colaborador_responsavel TEXT NOT NULL,
  mes_ano_fechamento DATE NOT NULL,
  escrituracao_fiscal BOOLEAN NOT NULL DEFAULT false,
  apuracao_impostos BOOLEAN NOT NULL DEFAULT false,
  entrega_obrigacoes BOOLEAN NOT NULL DEFAULT false,
  conferencia_geral BOOLEAN NOT NULL DEFAULT false,
  empresa_encerrada BOOLEAN NOT NULL DEFAULT false,
  empresa_em_andamento BOOLEAN NOT NULL DEFAULT false,
  pendencias TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fiscal_closings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow select for all" ON public.fiscal_closings FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON public.fiscal_closings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all" ON public.fiscal_closings FOR UPDATE USING (true);
CREATE POLICY "Allow delete for all" ON public.fiscal_closings FOR DELETE USING (true);

-- Permissions
GRANT ALL ON public.fiscal_closings TO anon;
GRANT ALL ON public.fiscal_closings TO authenticated;
GRANT ALL ON public.fiscal_closings TO service_role;

-- Cache reload
NOTIFY pgrst, 'reload config';
