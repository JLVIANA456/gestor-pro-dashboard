-- Create announcements table for tracking communications by department
create table if not exists announcements (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  department text not null, -- fiscal, pessoal, contabil, financeiro, geral
  recipient text not null,
  subject text not null,
  content text not null,
  status text default 'sent' not null check (status in ('sent', 'delivered', 'read')),
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table announcements enable row level security;

-- Create policy for all access (assuming simple internal dashboard)
-- In a production environment, you should refine this to specific roles/users
create policy "Allow all access to announcements"
  on announcements for all
  using (true)
  with check (true);

-- Add comments for documentation
comment on table announcements is 'Stores email announcements and their tracking status.';
comment on column announcements.department is 'The department responsible for or topic of the announcement.';
comment on column announcements.status is 'Tracking status: sent, delivered, or read.';
