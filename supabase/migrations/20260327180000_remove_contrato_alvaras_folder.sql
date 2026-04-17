
-- # 1. Update the function for future clients
CREATE OR REPLACE FUNCTION public.create_default_client_folders()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.client_portal_folders (client_id, name, icon, sort_order)
    VALUES 
        (NEW.id, 'Impostos e Guias', 'Receipt', 1),
        (NEW.id, 'Folha de Pagamento', 'Users', 2),
        (NEW.id, 'Documentos Contábeis', 'BarChart3', 3),
        (NEW.id, 'Outros Documentos', 'MoreHorizontal', 4);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- # 2. Move files from 'Contrato e Alvarás' to 'Outros Documentos' for all clients
UPDATE public.client_deliveries cd
SET folder_id = (SELECT id FROM public.client_portal_folders WHERE client_id = cd.client_id AND name = 'Outros Documentos' LIMIT 1)
WHERE folder_id IN (SELECT id FROM public.client_portal_folders WHERE name = 'Contrato e Alvarás');

-- # 3. Delete existing 'Contrato e Alvarás' folders for all clients
DELETE FROM public.client_portal_folders 
WHERE name = 'Contrato e Alvarás';

-- # 4. Update sort_order for 'Outros Documentos' to fill the gap
UPDATE public.client_portal_folders
SET sort_order = 4
WHERE name = 'Outros Documentos' AND sort_order = 5;
