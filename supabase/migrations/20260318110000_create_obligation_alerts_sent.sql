
-- Migration: Create obligation_alerts_sent table
-- Date: 2026-03-18

create table if not exists obligation_alerts_sent (
    id uuid default gen_random_uuid() primary key,
    obligation_id uuid references obligations(id) on delete cascade,
    alert_day integer not null, -- 10, 5, 3
    competency text not null, -- "MM/YYYY"
    sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(obligation_id, alert_day, competency)
);

-- RLS
alter table obligation_alerts_sent enable row level security;

create policy "Allow all access to obligation_alerts_sent"
  on obligation_alerts_sent for all
  using (true)
  with check (true);

-- Comments
comment on table obligation_alerts_sent is 'Tracks which alerts have already been sent to avoid duplicates.';
