CREATE TABLE IF NOT EXISTS public.accounting_closings (
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

-- Criar função para atualizar timestamp se não existir (já criada em migração anterior, mas good practice verificar ou reusar)
-- Assumindo que public.update_updated_at_column() já existe.

CREATE TRIGGER update_accounting_closings_updated_at
  BEFORE UPDATE ON public.accounting_closings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
