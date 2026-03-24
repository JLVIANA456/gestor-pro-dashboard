
-- Migration: Create obligations table
-- Date: 2026-03-18

do $$ begin
    create type obligation_type as enum (
        'guia',
        'imposto',
        'tarefa operacional',
        'obrigação acessória',
        'envio de documento',
        'conferência interna'
    );
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type obligation_competency_rule as enum (
        'previous_month',
        'current_month',
        'quarterly',
        'annual'
    );
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type obligation_periodicity as enum (
        'mensal',
        'trimestral',
        'anual',
        'eventual'
    );
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type obligation_due_rule as enum (
        'dia fixo',
        'regra especial'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists obligations (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    type obligation_type not null default 'guia',
    department text not null, -- 'DP', 'Fiscal', etc.
    default_due_day integer not null check (default_due_day >= 1 and default_due_day <= 31),
    is_user_editable boolean default true not null,
    alert_days integer[] default '{10, 5, 3}' not null, -- array of days before
    alert_recipient_email text not null,
    periodicity obligation_periodicity not null default 'mensal',
    is_active boolean default true not null,
    internal_note text,
    competency text, 
    due_rule obligation_due_rule not null default 'dia fixo',
    anticipate_on_weekend boolean default false not null,
    tax_regimes text[] default '{simples, presumido, real, domestico}' not null,
    competency_rule obligation_competency_rule not null default 'previous_month',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table obligations enable row level security;

create policy "Allow all access to obligations"
  on obligations for all
  using (true)
  with check (true);

-- Index
create index if not exists idx_obligations_department on obligations(department);
create index if not exists idx_obligations_type on obligations(type);

-- Seed some examples
insert into obligations (name, type, department, default_due_day, alert_recipient_email, periodicity, due_rule, tax_regimes, competency_rule)
values 
('DAS Simples', 'imposto', 'Fiscal', 20, 'fiscal@jlviana.com.br', 'mensal', 'dia fixo', '{simples}', 'previous_month'),
('FGTS Digital', 'guia', 'DP', 20, 'dp@jlviana.com.br', 'mensal', 'dia fixo', '{simples, presumido, real, domestico}', 'current_month'),
('Envio de folha para cliente', 'tarefa operacional', 'DP', 5, 'dp@jlviana.com.br', 'mensal', 'dia fixo', '{simples, presumido, real, domestico}', 'current_month'),
('DCTFWeb', 'obrigação acessória', 'Fiscal', 15, 'fiscal@jlviana.com.br', 'mensal', 'dia fixo', '{simples, presumido, real}', 'previous_month')
on conflict do nothing;

-- Comments
comment on table obligations is 'Stores master list of obligations and their alert settings.';
