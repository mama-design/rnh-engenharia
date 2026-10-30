-- Estruturas exclusivas RNH. Os dados operacionais ficam fora dos schemas da API.
create schema if not exists rnh_private;
revoke all on schema rnh_private from public,anon;
grant usage on schema rnh_private to authenticated;
create table if not exists rnh_private.members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null,
 created_at timestamptz not null default now()
);
create table if not exists rnh_private.state (
 id text primary key check(id='rnh'),
 payload jsonb not null,
 revision bigint not null default 0,
 updated_at timestamptz not null default now()
);
create table if not exists rnh_private.state_history (
 revision bigint primary key,
 payload jsonb not null,
 changed_by uuid references auth.users(id) on delete set null,
 archived_at timestamptz not null default now()
);
create index if not exists rnh_state_history_changed_by_idx on rnh_private.state_history(changed_by);
alter table rnh_private.members enable row level security;
alter table rnh_private.state enable row level security;
alter table rnh_private.state_history enable row level security;
revoke all on rnh_private.members,rnh_private.state,rnh_private.state_history from public,anon,authenticated;
insert into rnh_private.state (id,payload) values ('rnh','{"employees":[],"attendance":{},"discounts":[],"payments":{}}') on conflict(id) do nothing;
create or replace function rnh_private.get_state() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from rnh_private.members where user_id=auth.uid()) then raise exception 'Acesso não autorizado para a RNH.' using errcode='42501'; end if;
 select jsonb_build_object('data',payload,'revision',revision) into result from rnh_private.state where id='rnh';
 return result;
end;$$;
create or replace function rnh_private.save_state(new_payload jsonb,expected_revision bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare current_row rnh_private.state%rowtype;
begin
 if auth.uid() is null or not exists(select 1 from rnh_private.members where user_id=auth.uid()) then raise exception 'Acesso não autorizado para a RNH.' using errcode='42501'; end if;
 if new_payload is null or jsonb_typeof(new_payload->'employees') is distinct from 'array' or jsonb_typeof(new_payload->'discounts') is distinct from 'array' or jsonb_typeof(new_payload->'attendance') is distinct from 'object' or jsonb_typeof(new_payload->'payments') is distinct from 'object' or octet_length(new_payload::text)>2000000 then raise exception 'Dados inválidos para salvar.'; end if;
 select * into current_row from rnh_private.state where id='rnh' for update;
 if current_row.revision is distinct from expected_revision then raise exception 'RNH_CONFLICT'; end if;
 insert into rnh_private.state_history(revision,payload,changed_by) values(current_row.revision,current_row.payload,auth.uid());
 update rnh_private.state set payload=new_payload,revision=revision+1,updated_at=now() where id='rnh';
 return jsonb_build_object('revision',current_row.revision+1);
end;$$;
create or replace function public.get_rnh_state() returns jsonb
language sql security invoker set search_path = '' as $$select rnh_private.get_state();$$;
create or replace function public.save_rnh_state(new_payload jsonb,expected_revision bigint) returns jsonb
language sql security invoker set search_path = '' as $$select rnh_private.save_state(new_payload,expected_revision);$$;
revoke all on function rnh_private.get_state(),rnh_private.save_state(jsonb,bigint),public.get_rnh_state(),public.save_rnh_state(jsonb,bigint) from public,anon,authenticated;
grant execute on function rnh_private.get_state(),rnh_private.save_state(jsonb,bigint),public.get_rnh_state(),public.save_rnh_state(jsonb,bigint) to authenticated;
