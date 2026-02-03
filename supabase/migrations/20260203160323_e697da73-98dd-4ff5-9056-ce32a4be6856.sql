-- Tabela para armazenar o progresso contábil dos clientes
CREATE TABLE public.accounting_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  colaborador_responsavel TEXT NOT NULL,
  mes_ano TEXT NOT NULL, -- Formato: '2024-01' para Janeiro 2024
  conciliacao_contabil BOOLEAN NOT NULL DEFAULT false,
  controle_lucros BOOLEAN NOT NULL DEFAULT false,
  controle_aplicacao_financeira BOOLEAN NOT NULL DEFAULT false,
  controle_anual BOOLEAN NOT NULL DEFAULT false,
  empresa_encerrada BOOLEAN NOT NULL DEFAULT false,
  pendencias TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, mes_ano)
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_accounting_progress_updated_at
BEFORE UPDATE ON public.accounting_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS (desabilitado por padrão conforme padrão do projeto)
ALTER TABLE public.accounting_progress ENABLE ROW LEVEL SECURITY;

-- Política permissiva (seguindo o padrão do projeto sem autenticação)
CREATE POLICY "Allow all operations on accounting_progress"
ON public.accounting_progress
FOR ALL
USING (true)
WITH CHECK (true);