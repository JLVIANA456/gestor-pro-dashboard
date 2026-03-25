
-- # 1. Table for Client Portal Folders (The structural categories)
CREATE TABLE IF NOT EXISTS public.client_portal_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'Folder', -- Lucide icon name
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- # 2. Table for Client Deliveries (Files the office sends to client)
CREATE TABLE IF NOT EXISTS public.client_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES public.client_portal_folders(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    category TEXT, -- 'imposto', 'folha', 'contabil', 'documento_fixo'
    competency TEXT, -- Format 'YYYY-MM'
    due_date DATE,
    description TEXT,
    is_viewed BOOLEAN DEFAULT false,
    viewed_at TIMESTAMPTZ,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- # 3. RLS Policies
ALTER TABLE public.client_portal_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_deliveries ENABLE ROW LEVEL SECURITY;

-- ## Table: client_portal_folders
CREATE POLICY "Admins can do everything on client_portal_folders" ON public.client_portal_folders FOR ALL TO authenticated USING (true);
CREATE POLICY "Clients can see their own folders" ON public.client_portal_folders 
    FOR SELECT TO authenticated 
    USING (
        client_id IN (SELECT client_id FROM public.client_portal_users WHERE user_id = auth.uid())
    );

-- ## Table: client_deliveries
CREATE POLICY "Admins can do everything on client_deliveries" ON public.client_deliveries FOR ALL TO authenticated USING (true);
CREATE POLICY "Clients can see their own deliveries" ON public.client_deliveries 
    FOR SELECT TO authenticated 
    USING (
        client_id IN (SELECT client_id FROM public.client_portal_users WHERE user_id = auth.uid())
    );

-- # 4. Default Folders Trigger / Migration Seed
-- Function to create default folders for a new client
CREATE OR REPLACE FUNCTION public.create_default_client_folders()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.client_portal_folders (client_id, name, icon, sort_order)
    VALUES 
        (NEW.id, 'Impostos e Guias', 'Receipt', 1),
        (NEW.id, 'Folha de Pagamento', 'Users', 2),
        (NEW.id, 'Documentos Contábeis', 'BarChart3', 3),
        (NEW.id, 'Contrato e Alvarás', 'FileCheck', 4),
        (NEW.id, 'Outros Documentos', 'MoreHorizontal', 5);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_client_created_gen_folders
    AFTER INSERT ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_client_folders();

-- Seed for existing clients
DO $$
DECLARE
    client_record RECORD;
BEGIN
    FOR client_record IN SELECT id FROM public.clients LOOP
        -- Check if folders already exist to avoid duplicates
        IF NOT EXISTS (SELECT 1 FROM public.client_portal_folders WHERE client_id = client_record.id) THEN
            INSERT INTO public.client_portal_folders (client_id, name, icon, sort_order)
            VALUES 
                (client_record.id, 'Impostos e Guias', 'Receipt', 1),
                (client_record.id, 'Folha de Pagamento', 'Users', 2),
                (client_record.id, 'Documentos Contábeis', 'BarChart3', 3),
                (client_record.id, 'Contrato e Alvarás', 'FileCheck', 4),
                (client_record.id, 'Outros Documentos', 'MoreHorizontal', 5);
        END IF;
    END LOOP;
END $$;
