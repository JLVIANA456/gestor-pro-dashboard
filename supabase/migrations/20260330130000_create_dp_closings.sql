-- CREATE the dp_closings table
CREATE TABLE IF NOT EXISTS public.dp_closings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  colaborador_responsavel TEXT NOT NULL,
  mes_ano_fechamento DATE NOT NULL,
  folha_pagamento BOOLEAN NOT NULL DEFAULT false,
  encargos_sociais BOOLEAN NOT NULL DEFAULT false,
  e_social BOOLEAN NOT NULL DEFAULT false,
  dctf_web BOOLEAN NOT NULL DEFAULT false,
  fgts_digital BOOLEAN NOT NULL DEFAULT false,
  empresa_encerrada BOOLEAN NOT NULL DEFAULT false,
  empresa_em_andamento BOOLEAN NOT NULL DEFAULT false,
  pendencias TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dp_closings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow select for all" ON public.dp_closings FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON public.dp_closings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all" ON public.dp_closings FOR UPDATE USING (true);
CREATE POLICY "Allow delete for all" ON public.dp_closings FOR DELETE USING (true);

-- Permissions
GRANT ALL ON public.dp_closings TO anon;
GRANT ALL ON public.dp_closings TO authenticated;
GRANT ALL ON public.dp_closings TO service_role;

-- Cache reload
NOTIFY pgrst, 'reload config';
