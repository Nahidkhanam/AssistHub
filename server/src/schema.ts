// Idempotent migration, run at startup. RLS is enabled with no policies so that if this
// database is hosted on Supabase, the public API keys cannot read any table (only the server can).
export const schemaSql = `
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  role text not null default 'user' check (role in ('user','admin')),
  prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists tools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  maker text not null,
  kind text not null,
  platforms text[] not null default '{}',
  needs text[] not null default '{}',
  cost text not null,
  summary text not null,
  url text not null,
  status text not null default 'pending' check (status in ('published','pending','rejected')),
  submitted_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tools_status_idx on tools(status);
create table if not exists favorites (
  user_id uuid not null references users(id) on delete cascade,
  tool_id uuid not null references tools(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tool_id)
);
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references tools(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 1000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  unique (tool_id, user_id)
);
create index if not exists reviews_tool_idx on reviews(tool_id, status);
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);
alter table users enable row level security;
alter table tools enable row level security;
alter table favorites enable row level security;
alter table reviews enable row level security;
alter table messages enable row level security;
`;
