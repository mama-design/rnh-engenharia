-- RNH: executar uma vez no SQL Editor do projeto escolhido.
-- Nenhum dado do Mama Manager é alterado.
begin;
create table if not exists public.rnh_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null,
 created_at timestamptz not null default now()
);
create table if not exists public.rnh_state (
 id text primary key check(id='rnh'),
 payload jsonb not null,
 revision bigint not null default 0,
 updated_at timestamptz not null default now()
);
create table if not exists public.rnh_state_history (
 revision bigint primary key,
 payload jsonb not null,
 changed_by uuid references auth.users(id) on delete set null,
 archived_at timestamptz not null default now()
);
alter table public.rnh_members enable row level security;
alter table public.rnh_state enable row level security;
alter table public.rnh_state_history enable row level security;
revoke all on public.rnh_members, public.rnh_state, public.rnh_state_history from anon, authenticated;
insert into public.rnh_state (id,payload) values ('rnh','{"employees":[],"attendance":{},"discounts":[],"payments":{}}') on conflict(id) do nothing;
create or replace function public.get_rnh_state() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from public.rnh_members where user_id=auth.uid()) then raise exception 'Acesso não autorizado para a RNH.' using errcode='42501'; end if;
 select jsonb_build_object('data',payload,'revision',revision) into result from public.rnh_state where id='rnh';
 return result;
end;$$;
create or replace function public.save_rnh_state(new_payload jsonb,expected_revision bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare current_row public.rnh_state%rowtype;
begin
 if auth.uid() is null or not exists(select 1 from public.rnh_members where user_id=auth.uid()) then raise exception 'Acesso não autorizado para a RNH.' using errcode='42501'; end if;
 if new_payload is null or jsonb_typeof(new_payload->'employees') is distinct from 'array' or jsonb_typeof(new_payload->'discounts') is distinct from 'array' or jsonb_typeof(new_payload->'attendance') is distinct from 'object' or jsonb_typeof(new_payload->'payments') is distinct from 'object' or octet_length(new_payload::text)>2000000 then raise exception 'Dados inválidos para salvar.'; end if;
 select * into current_row from public.rnh_state where id='rnh' for update;
 if current_row.revision is distinct from expected_revision then raise exception 'RNH_CONFLICT'; end if;
 insert into public.rnh_state_history(revision,payload,changed_by) values(current_row.revision,current_row.payload,auth.uid());
 update public.rnh_state set payload=new_payload,revision=revision+1,updated_at=now() where id='rnh';
 return jsonb_build_object('revision',current_row.revision+1);
end;$$;
revoke all on function public.get_rnh_state() from public,anon;
revoke all on function public.save_rnh_state(jsonb,bigint) from public,anon;
grant execute on function public.get_rnh_state() to authenticated;
grant execute on function public.save_rnh_state(jsonb,bigint) to authenticated;
commit;
-- Após criar os usuários em Authentication > Users, autorizar cada UUID:
-- insert into public.rnh_members(user_id,display_name) values ('UUID_DO_USUARIO','Nome');
-- Só usuários criados no Auth E liberados nesta tabela acessam os dados.
