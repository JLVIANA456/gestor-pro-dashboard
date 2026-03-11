-- ===================================================
-- Honorários Module Tables
-- ===================================================

-- Tabela de configuração dos honorários por cliente
-- Armazena o valor base mensal de cada cliente para fins de honorários
CREATE TABLE IF NOT EXISTS public.honorarios_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  standard_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id)
);

-- Tabela de pagamentos/honorários mensais
CREATE TABLE IF NOT EXISTS public.honorarios_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  year INTEGER NOT NULL,
  amount_billed NUMERIC(10, 2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PAID', 'PENDING', 'LATE')),
  payment_date DATE,
  payment_method TEXT CHECK (payment_method IN ('PIX', 'BOLETO', 'TRANSFER', 'CARD', 'OTHER')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, month, year)
);

-- Tabela de recálculos / serviços avulsos
CREATE TABLE IF NOT EXISTS public.honorarios_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PAID', 'PENDING', 'LATE')),
  paid_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_honorarios_payments_client ON public.honorarios_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_honorarios_payments_period ON public.honorarios_payments(month, year);
CREATE INDEX IF NOT EXISTS idx_honorarios_tickets_client ON public.honorarios_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_honorarios_tickets_period ON public.honorarios_tickets(month, year);
CREATE INDEX IF NOT EXISTS idx_honorarios_config_client ON public.honorarios_config(client_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_honorarios_payments_updated_at
  BEFORE UPDATE ON public.honorarios_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_honorarios_config_updated_at
  BEFORE UPDATE ON public.honorarios_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE public.honorarios_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honorarios_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honorarios_tickets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso total para usuários autenticados, igual ao restante do sistema)
CREATE POLICY "Allow all for authenticated users" ON public.honorarios_config
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON public.honorarios_payments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON public.honorarios_tickets
  FOR ALL USING (true) WITH CHECK (true);
