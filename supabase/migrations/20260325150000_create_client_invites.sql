-- Tabela para gerir os convites de primeiro acesso dos clientes
CREATE TABLE IF NOT EXISTS client_portal_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token UUID DEFAULT gen_random_uuid() UNIQUE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    is_used BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas RLS para convites
ALTER TABLE client_portal_invites ENABLE ROW LEVEL SECURITY;

-- Admins podem fazer tudo
CREATE POLICY "Admins can manage invites" ON client_portal_invites
    FOR ALL USING (true);

-- Público pode ler o convite pelo token para validar na tela de ativação
CREATE POLICY "Public can view active invite by token" ON client_portal_invites
    FOR SELECT USING (is_used = false AND expires_at > NOW());

-- Tabela para vincular o User do Auth com o Client_id da empresa
CREATE TABLE IF NOT EXISTS client_portal_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas RLS para usuários do portal
ALTER TABLE client_portal_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all portal users" ON client_portal_users FOR ALL USING (true);
CREATE POLICY "Users can see their own mapping" ON client_portal_users FOR SELECT USING (auth.uid() = user_id);
