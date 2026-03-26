
-- 1. Add fields to clients
alter table clients add column if not exists has_employees boolean default false;
alter table clients add column if not exists is_service_taker boolean default false;

-- 2. Seed Master List of Templates based on User Requirements
-- Clear existing to ensure clean seed
truncate table delivery_templates;

-- DIA 05 - FGTS (Employees)
insert into delivery_templates (regime, type, due_day, competency_rule) values
('employees', 'FGTS Mensal (Digital)', 05, 'previous_month'),
('employees', 'FGTS Rescisório', 05, 'current_month');

-- DIA 07 - DAE Doméstico (Removido conforme solicitação)
-- insert into delivery_templates (regime, type, due_day, competency_rule) values
-- ('domestico', 'DAE Doméstico', 07, 'previous_month');

-- DIA 10 - Tomadores (Takers)
insert into delivery_templates (regime, type, due_day, competency_rule) values
('service_taker', 'ISS Retido na Fonte', 10, 'previous_month'),
('service_taker', 'INSS Retenção 11% (Cessão Mão de Obra)', 10, 'previous_month'),
('service_taker', 'DARF Previdenciário (Retenção)', 10, 'previous_month');

-- DIA 15 - Simples Nacional
insert into delivery_templates (regime, type, due_day, competency_rule) values
('simples', 'DAS Simples Nacional', 15, 'previous_month'),
('simples', 'DIFAL Simples Nacional', 15, 'previous_month');

-- DIA 20 - Tributos Gerais, Folha e Lucro Real
insert into delivery_templates (regime, type, due_day, competency_rule) values
-- Folha
('employees', 'INSS Folha – DCTFWeb', 20, 'previous_month'),
('employees', 'IRRF Folha de Pagamento', 20, 'previous_month'),
-- Tomadores (2º lote)
('service_taker', 'IRRF Serviços Tomados (1708/5952)', 20, 'previous_month'),
('service_taker', 'PCC – Retenções Federais (4,65%)', 20, 'previous_month'),
-- Lucro Real / Presumido
('presumido', 'IRPJ Lucro Presumido', 20, 'quarterly'),
('presumido', 'CSLL Lucro Presumido', 20, 'quarterly'),
('real', 'PIS Mensal', 20, 'previous_month'),
('real', 'COFINS Mensal', 20, 'previous_month'),
('real', 'IRPJ Mensal Estimativa', 20, 'previous_month'),
('real', 'CSLL Mensal Estimativa', 20, 'previous_month'),
-- ICMS / ISS
('presumido', 'ICMS Próprio', 20, 'previous_month'),
('real', 'ICMS Próprio', 20, 'previous_month'),
('simples', 'ICMS Antecipação / ST', 20, 'previous_month'),
('presumido', 'ISS Próprio', 20, 'previous_month'),
('real', 'ISS Próprio', 20, 'previous_month');

-- DIA 23/24 - ISS Retido
insert into delivery_templates (regime, type, due_day, competency_rule) values
('service_taker', 'ISS Retido Prestadores', 24, 'current_month');

-- DIA 25 - Parcelamentos
insert into delivery_templates (regime, type, due_day, competency_rule) values
('all', 'Parcelamento (Feral, Estadual ou Municipal)', 25, 'current_month');

-- DIA 28 / 30 - IPI e Outros
insert into delivery_templates (regime, type, due_day, competency_rule) values
('real', 'IPI Mensal', 30, 'previous_month'),
('presumido', 'ICMS Diferencial de Alíquota', 30, 'previous_month'),
('real', 'ICMS Diferencial de Alíquota', 30, 'previous_month');

-- TAXAS (Custom) - Honorários Contábeis removido conforme solicitação
insert into delivery_templates (regime, type, due_day, competency_rule) values
('all', 'Taxa de Fiscalização (TFE/TFA)', 30, 'annual');
