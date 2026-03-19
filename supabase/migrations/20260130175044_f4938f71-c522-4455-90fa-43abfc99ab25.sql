-- Criar enum para regime tributário
CREATE TYPE public.tax_regime AS ENUM ('simples', 'presumido', 'real');

-- Criar tabela de clientes
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  ccm TEXT,
  ie TEXT,
  regime_tributario tax_regime NOT NULL DEFAULT 'simples',
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  senha_prefeitura TEXT,
  quadro_societario JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- NOTA: RLS está desabilitado por padrão, não precisa fazer nada adicional