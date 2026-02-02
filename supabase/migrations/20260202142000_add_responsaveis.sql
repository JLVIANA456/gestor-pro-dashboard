ALTER TABLE clients
ADD COLUMN IF NOT EXISTS responsavel_dp text,
ADD COLUMN IF NOT EXISTS responsavel_fiscal text,
ADD COLUMN IF NOT EXISTS responsavel_contabil text,
ADD COLUMN IF NOT EXISTS responsavel_financeiro text,
ADD COLUMN IF NOT EXISTS responsavel_qualidade text;
