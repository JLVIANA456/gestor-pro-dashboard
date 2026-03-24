-- Criar tabela de responsáveis técnicos
CREATE TABLE public.technicians (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL, -- 'dp', 'fiscal', 'contabil', 'financeiro', 'qualidade'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir dados iniciais (baseados no que estava hardcoded)
INSERT INTO public.technicians (name, department) VALUES
('Nathalie Correia', 'dp'),
('Ana Vitória', 'dp'),
('Fernanda A. Francisco', 'fiscal'),
('Beatriz Paterlini', 'fiscal'),
('Atila Mayara', 'fiscal'),
('Natiele M. Santos', 'contabil'),
('Lucas S. Pereira', 'contabil'),
('Filipe B. Oliveira', 'contabil'),
('Gabriel Tenani', 'qualidade'),
('Juliana Borim Viana', 'financeiro');
