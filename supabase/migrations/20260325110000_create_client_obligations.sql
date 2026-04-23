CREATE TABLE IF NOT EXISTS client_obligations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    obligation_id UUID REFERENCES obligations(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('enabled', 'disabled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(client_id, obligation_id)
);

-- Habilitar RLS
ALTER TABLE client_obligations ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso total para usuários autenticados
CREATE POLICY "Permitir acesso total para autenticados em client_obligations" 
ON client_obligations 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
