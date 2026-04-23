-- Criar tabela de disparos e envios do DP
CREATE TABLE IF NOT EXISTS public.dp_dispatches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    colaborador_nome TEXT,
    tipo_processo TEXT NOT NULL CHECK (tipo_processo IN ('admissao', 'rescisao', 'ferias', 'folha', 'beneficios', 'esocial', 'outros')),
    tipo_documento TEXT NOT NULL, -- Recibo, Aviso, Guia, etc.
    descricao TEXT,
    canal TEXT NOT NULL CHECK (canal IN ('email', 'portal', 'whatsapp', 'manual')),
    destinatario TEXT,
    data_geracao TIMESTAMPTZ DEFAULT now(),
    data_prevista DATE,
    data_efetiva TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'agendado', 'enviado', 'entregue', 'lido', 'aguardando_retorno', 'respondido', 'erro', 'vencido', 'cancelado')),
    responsavel_id UUID REFERENCES public.technicians(id) ON DELETE SET NULL,
    anexo_url TEXT,
    mensagem TEXT,
    lido BOOLEAN DEFAULT false,
    observacoes TEXT,
    error_message TEXT,
    resend_id TEXT, -- ID do disparo no Resend
    criado_em TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.dp_dispatches ENABLE ROW LEVEL SECURITY;

-- Política de acesso
CREATE POLICY "Allow authenticated full access to dp_dispatches" 
ON public.dp_dispatches FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE TRIGGER tr_update_dp_dispatches_updated_at
    BEFORE UPDATE ON public.dp_dispatches
    FOR EACH ROW
    EXECUTE FUNCTION update_dp_demands_updated_at(); -- Reutilizando a função já criada
