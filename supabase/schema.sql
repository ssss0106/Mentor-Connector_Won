-- 시연방(공유 모드)용 표. Supabase 대시보드의 SQL Editor에서 한 번 실행한다.
create table if not exists public.app_state (
  room text primary key,
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- 공개 키로는 읽고 쓸 수 없게 막고, 서버(secret key)만 접근한다
alter table public.app_state enable row level security;

grant usage on schema public to service_role;
grant all on table public.app_state to service_role;
