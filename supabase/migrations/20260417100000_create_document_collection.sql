-- Tabela para armazenar as regras de cobrança
CREATE TABLE IF NOT EXISTS public.collection_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    send_day INTEGER NOT NULL CHECK (send_day BETWEEN 1 AND 31),
    follow_up_day INTEGER NOT NULL CHECK (follow_up_day BETWEEN 1 AND 31),
    template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela para vincular Clientes Específicos às suas regras (N:M)
CREATE TABLE IF NOT EXISTS public.collection_rule_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_id UUID REFERENCES public.collection_rules(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(rule_id, client_id)
);

-- Tabela para gerenciar o andamento de cada disparo de cada cliente
CREATE TABLE IF NOT EXISTS public.collection_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_id UUID REFERENCES public.collection_rules(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    reference_month DATE NOT NULL, -- O mês referente àquela cobrança
    status TEXT NOT NULL CHECK (status IN ('pending', 'received', 'overdue', 'follow_up_sent')),
    sent_at TIMESTAMP WITH TIME ZONE, -- Quando o primeiro e-mail foi disparado
    follow_up_at TIMESTAMP WITH TIME ZONE, -- Quando o de recobrança foi mandado
    received_at TIMESTAMP WITH TIME ZONE, -- Quando a secretária deu baixa
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Segurança)
ALTER TABLE public.collection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_rule_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_events ENABLE ROW LEVEL SECURITY;

-- Políticas Liberais para usuários autenticados da sua empresa
CREATE POLICY "Enable all for authenticated users (collection_rules)" ON public.collection_rules FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users (collection_rule_clients)" ON public.collection_rule_clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users (collection_events)" ON public.collection_events FOR ALL USING (auth.role() = 'authenticated');

-- Permitir leitura de eventos para clientes acessarem o portal (caso implementado no futuro)
CREATE POLICY "Enable read for public clients" ON public.collection_events FOR SELECT USING (true);

-- Ativar trigger de updated_at customizado
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ativar trigger de updated_at para collection_rules
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.collection_rules
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Ativar trigger de updated_at para collection_events
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.collection_events
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- =========================================================================
-- CONFIGURAÇÃO DO ROBO (PG_CRON) PARA RODAR SUA EDGE FUNCTION
-- Certifique-se de que a extensão pg_cron e pg_net estejam habilitadas!
-- =========================================================================

-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- Isso agenda a função para rodar todos os dias as 08:30 da manhã
-- Descomente e execute no SQL EDITOR quando tiver o link real da Edge Function:

/*
SELECT cron.schedule(
    'daily-document-collector',
    '30 8 * * *', -- Roda as 08:30 todo dia
    $$
    SELECT net.http_post(
        url:='https://[SEU_PROJETO_SUPABASE].supabase.co/functions/v1/document-collector',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer [SUA_ANON_KEY]"}'::jsonb
    )
    $$
);
*/
