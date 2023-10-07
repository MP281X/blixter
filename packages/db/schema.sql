-- drop previous schema and recreate it
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

create table users (
  id uuid primary key default gen_random_uuid() not null,
  username varchar(20) unique not null,
  email varchar(50) unique not null,
  password text not null,
  verified boolean default false not null,
  created_at timestamp default CURRENT_TIMESTAMP not null
);

create table subscribers (
  user_id uuid not null,
  channel_id uuid not null,
  created_at timestamp default CURRENT_TIMESTAMP not null,

  primary key (user_id, channel_id),
  foreign key (user_id) references users(id) on delete cascade,
  foreign key (channel_id) references users(id) on delete cascade
  
);

create type resolutions as enum ('360p', '720p', '1080p');
create type conversion_status as enum ('to_upload', 'uploaded', 'converting', 'converted', 'categorized', 'failed');
create table videos (
  id uuid primary key default gen_random_uuid() not null,
  user_id uuid not null,
  title text default '' not null,
  description text default '' not null,
  duration integer default 0 not null,
  status conversion_status default 'to_upload' not null,
  created_at timestamp default CURRENT_TIMESTAMP not null,

  foreign key (user_id) references users(id) on delete cascade
);

create table views (
  user_id uuid not null,
  video_id uuid not null,
  watch_time integer default 0 not null,
  liked boolean,
  created_at timestamp default CURRENT_TIMESTAMP not null,

  primary key (user_id, video_id),
  foreign key (user_id) references users(id) on delete cascade,
  foreign key (video_id) references videos(id) on delete cascade
);

create table comments (
  id uuid primary key default gen_random_uuid() not null,
  user_id uuid not null,
  video_id uuid not null,
  comment text not null,
  created_at timestamp default CURRENT_TIMESTAMP not null,

  foreign key (user_id) references users(id) on delete cascade,
  foreign key (video_id) references videos(id) on delete cascade
);
