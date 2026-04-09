-- Add client_id to announcements for better tracking and control
alter table announcements add column if not exists client_id uuid references clients(id);

-- Add comment
comment on column announcements.client_id is 'The specific client this announcement is associated with.';
