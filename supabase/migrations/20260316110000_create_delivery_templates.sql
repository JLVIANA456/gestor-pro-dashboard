
-- Migration: Create delivery_templates table
-- Date: 2026-03-16

create table if not exists delivery_templates (
    id uuid default gen_random_uuid() primary key,
    regime text not null, -- simples, presumido, real, domestico, all
    type text not null, -- DAS, DARF, etc.
    due_day integer not null check (due_day >= 1 and due_day <= 31),
    competency_rule text default 'previous_month' not null, -- previous_month, current_month, quarterly, annual
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table delivery_templates enable row level security;

create policy "Allow all access to delivery_templates"
  on delivery_templates for all
  using (true)
  with check (true);

-- Index
create index if not exists idx_delivery_templates_regime on delivery_templates(regime);

-- Comments
comment on table delivery_templates is 'Stores recurring task templates for different tax regimes.';
