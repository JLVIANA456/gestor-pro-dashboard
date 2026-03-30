-- Força o Supabase (PostgREST) a recarregar o cache do esquema do banco de dados
-- Isso é necessário quando você cria novas tabelas ou colunas e a API ainda não as "enxerga"

NOTIFY pgrst, 'reload config';
