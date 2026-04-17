
-- Add parent_id to support nested folders in the client portal hub
ALTER TABLE public.client_portal_folders 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.client_portal_folders(id) ON DELETE CASCADE;

-- Index for performance when searching for subfolders
CREATE INDEX IF NOT EXISTS idx_client_portal_folders_parent_id ON public.client_portal_folders(parent_id);
