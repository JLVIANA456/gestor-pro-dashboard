-- Criação da tabela de configurações de Branding
CREATE TABLE IF NOT EXISTS public.branding_settings (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    primary_color TEXT DEFAULT '#e70d0d',
    sidebar_color TEXT DEFAULT '#000000',
    logo_url TEXT DEFAULT '/favicon.png',
    office_name TEXT DEFAULT 'JLVIANA Consultoria Contábil',
    company_name TEXT DEFAULT 'JLVIANA Consultoria Contábil',
    footer_text TEXT DEFAULT 'Este é um canal oficial de comunicação de seu escritório contábil.',
    header_title TEXT DEFAULT 'Comunicado Oficial',
    button_text TEXT DEFAULT 'Acesse o Documento - Clicando Aqui',
    reply_to_email TEXT DEFAULT '',
    delivery_email_body TEXT DEFAULT 'Prezado(a) Cliente {{nome_empresa}},\n\nEsta comunicação refere-se à empresa {{nome_empresa}}.\n\nEm continuidade ao nosso compromisso em garantir que todas as obrigações contábeis, fiscais e legais estejam sempre em conformidade, encaminhamos em anexo: {{nome_imposto}}, referente à competência {{competencia}}.\n\n{{link_documento}}\n\nVencimento: {{data_vencimento}}\n\nValor: R$ {{valor_guia}}\n\nAtenciosamente,\n\n{{companyName}}',
    delivery_email_subject TEXT DEFAULT 'Envio de Guia - {{nome_imposto}} - {{competencia}} - {{nome_empresa}}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT singleton_branding CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Habilita RLS
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;

-- Permite leitura para todos (visualização do dashboard e e-mails)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'branding_settings' AND policyname = 'Permitir leitura para todos') THEN
        CREATE POLICY "Permitir leitura para todos" ON public.branding_settings FOR SELECT USING (true);
    END IF;
END
$$;

-- Permite atualização para todos (como o sistema atual usa localStorage sem login, manteremos aberto ou via role se houver auth)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'branding_settings' AND policyname = 'Permitir tudo para todos') THEN
        CREATE POLICY "Permitir tudo para todos" ON public.branding_settings FOR ALL USING (true);
    END IF;
END
$$;

-- Insere o registro inicial se não existir
INSERT INTO public.branding_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000000'::uuid)
ON CONFLICT (id) DO NOTHING;
