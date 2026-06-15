create table if not exists playbook_videos (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text not null default '',
  category     text not null check (category in ('selling','buying','process','market','tips')),
  duration     text not null default '',
  thumbnail    text not null default '',
  video_url    text not null default '',
  featured     boolean not null default false,
  published_at date not null default current_date,
  tags         text[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table playbook_videos enable row level security;

create policy "Public can read playbook_videos"
  on playbook_videos for select using (true);

create policy "Authenticated users can manage playbook_videos"
  on playbook_videos for all using (auth.role() = 'authenticated');
