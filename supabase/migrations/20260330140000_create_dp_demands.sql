-- Criar tabela de demandas diárias do DP (Centro de Comando)
CREATE TABLE IF NOT EXISTS public.dp_demands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    colaborador_nome TEXT NOT NULL,
    tipo_processo TEXT NOT NULL CHECK (tipo_processo IN ('admissao', 'rescisao', 'ferias', 'rescisao_complementar', 'recalculo', 'levantamento_debitos')),
    data_base DATE NOT NULL,
    data_envio DATE,
    prazo DATE NOT NULL,
    data_pagamento DATE,
    responsavel_id UUID REFERENCES public.technicians(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'CONCLUIDO')),
    criado_em TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.dp_demands ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso total para usuários autenticados
CREATE POLICY "Allow authenticated full access to dp_demands" 
ON public.dp_demands 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Trigger para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_dp_demands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_update_dp_demands_updated_at
    BEFORE UPDATE ON public.dp_demands
    FOR EACH ROW
    EXECUTE FUNCTION update_dp_demands_updated_at();
