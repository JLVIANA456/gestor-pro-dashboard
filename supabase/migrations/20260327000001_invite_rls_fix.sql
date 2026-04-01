-- RLS Fix for client_portal_invites

-- Permitir que o usuário recém-registrado marque seu próprio convite como usado
DROP POLICY IF EXISTS "Users can mark their own invite as used" ON public.client_portal_invites;
CREATE POLICY "Users can mark their own invite as used" ON public.client_portal_invites
    FOR UPDATE
    TO authenticated
    USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Garantir que a tabela client_portal_invites não lance erro de Foreign Key 
-- caso admin insira algum email sem cliente, mas na verdade tem onDelete cascade
