-- Adicionar regime 'domestico' ao enum tax_regime
ALTER TYPE public.tax_regime ADD VALUE IF NOT EXISTS 'domestico';
