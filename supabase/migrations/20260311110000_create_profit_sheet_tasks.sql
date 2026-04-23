-- Tabela de controle mensal de envio da planilha de distribuição de lucros
CREATE TABLE IF NOT EXISTS public.profit_sheet_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  mes_ano TEXT NOT NULL,                        -- formato: YYYY-MM
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'recebido', 'cobrado')),
  received_at TIMESTAMP WITH TIME ZONE,         -- quando marcou como recebido
  cobrado_at  TIMESTAMP WITH TIME ZONE,         -- quando enviou a recobrança
  observacoes TEXT,
  responsavel TEXT,                             -- colaborador que deu baixa
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (client_id, mes_ano)                   -- 1 registro por cliente/mês
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_profit_sheet_tasks_updated_at
  BEFORE UPDATE ON public.profit_sheet_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS desabilitado (padrão do projeto)
-- Índices
CREATE INDEX IF NOT EXISTS profit_sheet_tasks_client_id_idx ON public.profit_sheet_tasks(client_id);
CREATE INDEX IF NOT EXISTS profit_sheet_tasks_mes_ano_idx   ON public.profit_sheet_tasks(mes_ano);
