
-- Migration: Create accounting_guides table
-- Date: 2026-03-16

create table if not exists accounting_guides (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  type text not null, -- DAS, DARF, DCTF, GPS, FGTS, etc.
  reference_month text not null, -- format: YYYY-MM
  due_date date,
  amount numeric(15, 2),
  status text default 'pending' not null check (status in ('pending', 'sent', 'scheduled', 'expired')),
  file_url text, -- Public URL for the guide PDF
  scheduled_for timestamp with time zone,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  opened_at timestamp with time zone,
  competency text, -- format: MM/YYYY
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table accounting_guides enable row level security;

create policy "Allow all access to accounting_guides"
  on accounting_guides for all
  using (true)
  with check (true);

-- Index for performance
create index if not exists idx_accounting_guides_client_id on accounting_guides(client_id);
create index if not exists idx_accounting_guides_reference_month on accounting_guides(reference_month);

-- Comments
comment on table accounting_guides is 'Stores accounting tax guides and their delivery status.';
comment on column accounting_guides.type is 'Type of tax: DAS, DARF, DCTF, etc.';
comment on column accounting_guides.status is 'Delivery status: pending, sent, scheduled, expired.';
