-- ===================================================
-- Profit Withdrawals Module Table
-- ===================================================

CREATE TABLE IF NOT EXISTS public.profit_withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  partner_cpf TEXT NOT NULL,
  withdrawal_date DATE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  bank TEXT,
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profit_withdrawals_client ON public.profit_withdrawals(client_id);
CREATE INDEX IF NOT EXISTS idx_profit_withdrawals_date ON public.profit_withdrawals(withdrawal_date);

-- Trigger para atualizar updated_at automaticamente
-- Assumindo que a função update_updated_at_column já existe das migrações anteriores
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profit_withdrawals_updated_at') THEN
        CREATE TRIGGER update_profit_withdrawals_updated_at
          BEFORE UPDATE ON public.profit_withdrawals
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Habilitar Row Level Security
ALTER TABLE public.profit_withdrawals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso total para usuários autenticados)
CREATE POLICY "Allow all for authenticated users" ON public.profit_withdrawals
  FOR ALL USING (true) WITH CHECK (true);
