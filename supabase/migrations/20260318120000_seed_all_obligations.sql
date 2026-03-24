-- =======================================================
-- SEED COMPLETO: Todas as Obrigações Fiscais e DP
-- Data: 2026-03-18
-- =======================================================

-- Limpa os registros antigos de exemplo para evitar duplicatas
DELETE FROM obligations;

-- =======================================================
-- DEPARTAMENTO FISCAL
-- =======================================================
INSERT INTO obligations (name, type, department, default_due_day, alert_recipient_email, periodicity, due_rule, tax_regimes, competency_rule) VALUES

-- Consultas e Monitoramentos
('CONSULTA AO DTE EM OSASCO',         'tarefa operacional', 'Fiscal', 1,  'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('D-SUP',                              'tarefa operacional', 'Fiscal', 10, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'previous_month'),

-- DAREs
('DARE DIFERENCIAL DE ALÍQUOTAS',      'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido,real}',                   'previous_month'),
('DARE ICMS',                          'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido,real}',                    'previous_month'),
('DARE ST',                            'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),

-- DARFs
('DARF COFINS',                        'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido,real}',                    'previous_month'),
('DARF CSLL TRIMESTRAL',               'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'trimestral', 'dia fixo', '{presumido}',                         'quarterly'),
('DARF IRPJ MENSAL',                   'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{real}',                              'previous_month'),
('DARF IRPJ TRIMESTRAL',               'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'trimestral', 'dia fixo', '{presumido}',                         'quarterly'),
('DARF IRRF ALUGUEL',                  'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),
('DARF IRRF CÓD 1708',                 'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),
('DARF PGFN',                          'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('DARF PIS',                           'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido,real}',                    'previous_month'),
('DARF IPI',                           'guia',               'Fiscal', 25, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido,real}',                    'previous_month'),
('DARF REINF',                         'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),

-- DAS
('DAS MENSAL',                         'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples}',                           'previous_month'),
('DAS PARCELAMENTO',                   'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples}',                           'current_month'),

-- DIFAL
('DIFAL',                              'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),

-- GAREs
('GARE ICMS',                          'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido,real}',                    'previous_month'),
('GARE ST',                            'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),

-- GIAs
('GIA',                                'obrigação acessória','Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido,real}',                    'previous_month'),
('GIA ST',                             'obrigação acessória','Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),

-- ICMS Variações
('ICMS ANTECIPADO',                    'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),
('ICMS COMPLEMENTAR',                  'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido,real}',                    'previous_month'),
('ICMS DIFAL CONSUMIDOR FINAL',        'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),
('ICMS DIFAL ENTRADAS',                'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido,real}',                    'previous_month'),
('ICMS GARANTIDO',                     'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),
('ICMS IMPORTAÇÃO',                    'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{presumido,real}',                    'current_month'),
('ICMS NORMAL',                        'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido,real}',                    'previous_month'),
('ICMS ST ENTRADAS',                   'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),
('ICMS ST SAÍDAS',                     'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),
('ICMS ST SUBSTITUTO',                 'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),

-- ISSQN
('ISSQN PRÓPRIO',                      'guia',               'Fiscal', 10, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido,real}',                    'previous_month'),
('ISSQN RETIDO',                       'guia',               'Fiscal', 10, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),
('ISSQN TOMADOR',                      'guia',               'Fiscal', 10, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),

-- Livros Fiscais
('LIVRO FISCAL SERVIÇOS',              'obrigação acessória','Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),
('LIVRO REGISTRO APURAÇÃO ICMS',       'obrigação acessória','Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido,real}',                    'previous_month'),
('LIVRO REGISTRO ENTRADAS',            'obrigação acessória','Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido,real}',                    'previous_month'),
('LIVRO REGISTRO INVENTÁRIO',          'obrigação acessória','Fiscal', 31, 'fiscal@jlviana.com.br', 'anual',      'dia fixo', '{presumido,real}',                    'annual'),
('LIVRO REGISTRO SAÍDAS',              'obrigação acessória','Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido,real}',                    'previous_month'),

-- Monitoramentos
('MONITORAMENTO CAIXA POSTAL E-CAC',   'tarefa operacional', 'Fiscal', 1,  'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('MONITORAMENTO DEC MUNICIPAL',        'tarefa operacional', 'Fiscal', 1,  'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('MONITORAMENTO DT-E',                 'tarefa operacional', 'Fiscal', 1,  'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('MONITORAMENTO PGFN',                 'tarefa operacional', 'Fiscal', 1,  'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),

-- Parcelamentos
('PARCELAMENTO ESTADUAL',              'guia',               'Fiscal', 25, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('PARCELAMENTO FEDERAL',               'guia',               'Fiscal', 25, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('PARCELAMENTO MUNICIPAL',             'guia',               'Fiscal', 25, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),

-- PIS/COFINS
('PIS COFINS RETENÇÃO',                'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido,real}',                    'previous_month'),
('PIS COFINS MONOFÁSICO',              'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),
('PIS COFINS CUMULATIVO',              'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido}',                         'previous_month'),
('PIS COFINS NÃO CUMULATIVO',          'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{real}',                              'previous_month'),

-- Regimes Especiais e Outros Tributos
('REGIME ESPECIAL ICMS',               'tarefa operacional', 'Fiscal', 20, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{presumido,real}',                    'previous_month'),
('SPED CONTRIBUIÇÕES',                 'obrigação acessória','Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido,real}',                    'previous_month'),
('SPED FISCAL ICMS IPI',               'obrigação acessória','Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{presumido,real}',                    'previous_month'),
('SPED REINF',                         'obrigação acessória','Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),
('SUBSTITUIÇÃO TRIBUTÁRIA',            'guia',               'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),

-- Taxas e TFEs
('TAXA DE LICENÇA',                    'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'anual',      'dia fixo', '{simples,presumido,real,domestico}', 'annual'),
('TAXA DE FISCALIZAÇÃO',               'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'anual',      'dia fixo', '{simples,presumido,real,domestico}', 'annual'),
('TAXA MUNICIPAL DIVERSAS',            'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE',                                'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'anual',      'dia fixo', '{simples,presumido,real,domestico}', 'annual'),
('TFA',                                'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'anual',      'dia fixo', '{simples,presumido,real,domestico}', 'annual'),
('TLL',                                'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'anual',      'dia fixo', '{simples,presumido,real,domestico}', 'annual'),
('TFE MEI',                            'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'anual',      'dia fixo', '{simples}',                           'annual'),
('TFE AUTÔNOMO',                       'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real}',            'current_month'),
('TFE ESTABELECIMENTO',                'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE FILIAL',                         'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real}',            'current_month'),
('TFE MATRIZ',                         'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real}',            'current_month'),
('TFE TRANSFERÊNCIA',                  'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE ALTERAÇÃO',                      'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE RENOVAÇÃO',                      'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE BAIXA',                          'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE ENCERRAMENTO',                   'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE RECADASTRO',                     'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE VISTORIA',                       'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE EVENTUAL',                       'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE PROVISÓRIA',                     'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE DEFINITIVA',                     'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE SUBSTITUIÇÃO',                   'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE REGULARIZAÇÃO',                  'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE PARCELAMENTO',                   'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE MULTA',                          'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE AUTO DE INFRAÇÃO',               'guia',               'Fiscal', 30, 'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE NOTIFICAÇÃO',                    'tarefa operacional', 'Fiscal', 5,  'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE INTIMAÇÃO',                      'tarefa operacional', 'Fiscal', 5,  'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE EXIGÊNCIA',                      'tarefa operacional', 'Fiscal', 5,  'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE DEFESA',                         'tarefa operacional', 'Fiscal', 5,  'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE RECURSO',                        'tarefa operacional', 'Fiscal', 5,  'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE JULGAMENTO',                     'tarefa operacional', 'Fiscal', 5,  'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE DÍVIDA ATIVA',                   'tarefa operacional', 'Fiscal', 5,  'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE EXECUÇÃO FISCAL',                'tarefa operacional', 'Fiscal', 5,  'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE CERTIDÃO POSITIVA',              'tarefa operacional', 'Fiscal', 5,  'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE CERTIDÃO NEGATIVA',              'tarefa operacional', 'Fiscal', 5,  'fiscal@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('TFE CERTIDÃO POSITIVA COM EFEITO DE NEGATIVA', 'tarefa operacional', 'Fiscal', 5, 'fiscal@jlviana.com.br', 'eventual', 'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),

-- =======================================================
-- DEPARTAMENTO PESSOAL
-- =======================================================
('13º SALÁRIO DOMÉSTICA 2ª PARCELA',   'guia',               'DP', 20, 'dp@jlviana.com.br', 'anual',      'dia fixo', '{domestico}',                         'current_month'),
('1ª PARCELA 13º SALÁRIO',             'guia',               'DP', 30, 'dp@jlviana.com.br', 'anual',      'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('2ª PARCELA 13º SALÁRIO',             'guia',               'DP', 20, 'dp@jlviana.com.br', 'anual',      'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('CND TRABALHISTA',                    'tarefa operacional', 'DP', 5,  'dp@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('CONTRIBUIÇÕES SINDICATO',            'guia',               'DP', 10, 'dp@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('DAE DOMÉSTICO',                      'guia',               'DP', 7,  'dp@jlviana.com.br', 'mensal',     'dia fixo', '{domestico}',                         'previous_month'),
('DIRF',                               'obrigação acessória','DP', 28, 'dp@jlviana.com.br', 'anual',      'dia fixo', '{simples,presumido,real,domestico}', 'annual'),
('E-SOCIAL',                           'tarefa operacional', 'DP', 7,  'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('E-SOCIAL EVENTOS PERIÓDICOS',        'tarefa operacional', 'DP', 7,  'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('E-SOCIAL EVENTOS NÃO PERIÓDICOS',    'tarefa operacional', 'DP', 7,  'dp@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('E-SOCIAL ADMISSÃO',                  'tarefa operacional', 'DP', 1,  'dp@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('E-SOCIAL DEMISSÃO',                  'tarefa operacional', 'DP', 1,  'dp@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('E-SOCIAL FÉRIAS',                    'tarefa operacional', 'DP', 1,  'dp@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('E-SOCIAL ALTERAÇÃO CONTRATUAL',      'tarefa operacional', 'DP', 1,  'dp@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('E-SOCIAL AFASTAMENTO',               'tarefa operacional', 'DP', 1,  'dp@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('E-SOCIAL RETORNO',                   'tarefa operacional', 'DP', 1,  'dp@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('E-SOCIAL CAT',                       'tarefa operacional', 'DP', 1,  'dp@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('E-SOCIAL PPP',                       'tarefa operacional', 'DP', 1,  'dp@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('E-SOCIAL SST',                       'tarefa operacional', 'DP', 1,  'dp@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('FGTS',                               'guia',               'DP', 7,  'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'previous_month'),
('FGTS DIGITAL',                       'guia',               'DP', 20, 'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('FGTS RESCISÓRIO',                    'guia',               'DP', 10, 'dp@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('FOLHA DE PAGAMENTO',                 'tarefa operacional', 'DP', 28, 'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('GPS',                                'guia',               'DP', 20, 'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'previous_month'),
('INSS',                               'guia',               'DP', 20, 'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'previous_month'),
('INSS RETENÇÃO',                      'guia',               'DP', 20, 'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),
('IRRF FOLHA',                         'guia',               'DP', 20, 'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'previous_month'),
('PRO LABORE',                         'tarefa operacional', 'DP', 28, 'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'current_month'),
('PRÓ-LABORE INSS',                    'guia',               'DP', 20, 'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real}',            'previous_month'),
('RAIS',                               'obrigação acessória','DP', 31, 'dp@jlviana.com.br', 'anual',      'dia fixo', '{simples,presumido,real,domestico}', 'annual'),
('SEFIP',                              'obrigação acessória','DP', 7,  'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'previous_month'),
('VALE TRANSPORTE',                    'tarefa operacional', 'DP', 25, 'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('VALE REFEIÇÃO',                      'tarefa operacional', 'DP', 25, 'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('VALE ALIMENTAÇÃO',                   'tarefa operacional', 'DP', 25, 'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('BENEFÍCIOS',                         'tarefa operacional', 'DP', 25, 'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('ADIANTAMENTO SALARIAL',              'tarefa operacional', 'DP', 20, 'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('RESCISÃO',                           'tarefa operacional', 'DP', 10, 'dp@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('HOMOLOGAÇÃO',                        'tarefa operacional', 'DP', 10, 'dp@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('AVISO PRÉVIO',                       'tarefa operacional', 'DP', 1,  'dp@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('CÁLCULO TRABALHISTA',                'tarefa operacional', 'DP', 1,  'dp@jlviana.com.br', 'eventual',   'dia fixo', '{simples,presumido,real,domestico}', 'current_month'),
('ENCARGOS TRABALHISTAS',              'guia',               'DP', 20, 'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'previous_month'),
('OBRIGAÇÕES ACESSÓRIAS DP',           'obrigação acessória','DP', 20, 'dp@jlviana.com.br', 'mensal',     'dia fixo', '{simples,presumido,real,domestico}', 'previous_month');

-- Confirmação final
DO $$
DECLARE
  total_fiscal INTEGER;
  total_dp     INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_fiscal FROM obligations WHERE department = 'Fiscal';
  SELECT COUNT(*) INTO total_dp     FROM obligations WHERE department = 'DP';
  RAISE NOTICE '✅ Obrigações cadastradas: % Fiscal | % DP | % Total',
    total_fiscal, total_dp, total_fiscal + total_dp;
END $$;
