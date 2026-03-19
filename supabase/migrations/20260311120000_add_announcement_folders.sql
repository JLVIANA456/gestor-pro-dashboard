-- Add folders and missing columns to announcements
create table if not exists announcement_folders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  department text not null, -- fiscal, pessoal, contabil, financeiro, geral
  icon text,
  color text
);

-- Enable Row Level Security for folders
alter table announcement_folders enable row level security;
create policy "Allow all access to announcement_folders"
  on announcement_folders for all
  using (true)
  with check (true);

-- Add folder_id to announcements
alter table announcements add column if not exists folder_id uuid references announcement_folders(id);

-- Add scheduling columns if they don't exist
alter table announcements add column if not exists scheduled_for timestamp with time zone;
alter table announcements add column if not exists is_scheduled boolean default false;

-- Add comments
comment on table announcement_folders is 'Categories/folders for organizing announcements.';
comment on column announcement_folders.department is 'The department this folder belongs to.';
comment on column announcements.folder_id is 'The folder/category this announcement belongs to.';
