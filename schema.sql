-- Схема базы данных LinkShort для Supabase.
-- Выполните этот скрипт целиком в SQL Editor: https://supabase.com/dashboard → ваш проект → SQL Editor → New query

create extension if not exists pgcrypto;

-- Таблица коротких ссылок
create table if not exists links (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  url text not null,
  created_at timestamptz not null default now()
);

-- Таблица переходов (кликов)
create table if not exists clicks (
  id bigint generated always as identity primary key,
  link_id uuid not null references links(id) on delete cascade,
  ip text,
  country text,
  region text,
  city text,
  latitude text,
  longitude text,
  timezone text,
  device text,
  browser text,
  os text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_clicks_link_id on clicks (link_id);
create index if not exists idx_clicks_link_created on clicks (link_id, created_at desc);

-- Глобальные счётчики для главной страницы (вызывается через supabase.rpc('site_stats'))
create or replace function site_stats()
returns json
language sql
stable
as $$
  select json_build_object(
    'total_links',  (select count(*)::bigint from links),
    'total_clicks', (select count(*)::bigint from clicks),
    'links_24h',    (select count(*)::bigint from links where created_at > now() - interval '24 hours')
  );
$$;

-- Агрегированная статистика по ссылке (вызывается через supabase.rpc('link_stats', { p_link_id }))
create or replace function link_stats(p_link_id uuid)
returns json
language sql
stable
as $$
  with d as (
    select ip, country, region, city, device, browser, os, referrer, created_at
    from clicks
    where link_id = p_link_id
  )
  select json_build_object(
    'total_clicks',     (select count(*)::bigint from d),
    'unique_visitors',  (select count(distinct ip)::bigint from d),
    'clicks_by_country',(select coalesce(json_agg(t order by t.cnt desc, t.name nulls last), '[]'::json) from (select country as name, count(*)::bigint as cnt from d group by country) t),
    'clicks_by_region', (select coalesce(json_agg(t order by t.cnt desc, t.name nulls last), '[]'::json) from (select region as name, count(*)::bigint as cnt from d group by region) t),
    'clicks_by_city',   (select coalesce(json_agg(t order by t.cnt desc, t.name nulls last), '[]'::json) from (select city as name, count(*)::bigint as cnt from d group by city) t),
    'clicks_by_device', (select coalesce(json_agg(t order by t.cnt desc), '[]'::json) from (select device as name, count(*)::bigint as cnt from d group by device) t),
    'clicks_by_browser',(select coalesce(json_agg(t order by t.cnt desc, t.name nulls last), '[]'::json) from (select browser as name, count(*)::bigint as cnt from d group by browser) t),
    'clicks_by_os',     (select coalesce(json_agg(t order by t.cnt desc, t.name nulls last), '[]'::json) from (select os as name, count(*)::bigint as cnt from d group by os) t),
    'clicks_by_referrer',(select coalesce(json_agg(t order by t.cnt desc, t.name nulls last), '[]'::json) from (select referrer as name, count(*)::bigint as cnt from d group by referrer) t),
    'clicks_by_day',    (select coalesce(json_agg(t order by t.day), '[]'::json) from (select (created_at at time zone 'utc')::date as day, count(*)::bigint as cnt from d group by day) t),
    'clicks_by_hour',   (select coalesce(json_agg(t order by t.hour), '[]'::json) from (select extract(hour from created_at at time zone 'utc')::int as hour, count(*)::bigint as cnt from d group by hour) t)
  )
  from (select 1) as one;
$$;
