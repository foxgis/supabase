import { NextApiRequest, NextApiResponse } from 'next'

import { paths } from 'api-types'
import { constructHeaders } from 'lib/api/apiHelpers'
import apiWrapper from 'lib/api/apiWrapper'
import { post } from 'lib/common/fetch'
import { PG_META_URL } from 'lib/constants'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

type ResponseData =
  paths['/platform/projects/{ref}/run-lints']['get']['responses']['200']['content']['application/json']

const handleGet = async (req: NextApiRequest, res: NextApiResponse<ResponseData>) => {
  const headers = constructHeaders(req.headers)
  const response = await post(`${PG_META_URL}/query`, { query: enrichQuery(LINT_SQL) }, { headers })
  if (response.error) {
    return res.status(400).json(response.error)
  } else {
    return res.status(200).json(response)
  }
}

const enrichQuery = (query: string) => `
-- source: dashboard
-- user: ${'self host'}
-- date: ${new Date().toISOString()}

${query}
`

export const LINT_SQL = /* SQL */ `set local search_path = '';

(
with foreign_keys as (
    select
        cl.relnamespace::regnamespace::text as schema_name,
        cl.relname as table_name,
        cl.oid as table_oid,
        ct.conname as fkey_name,
        ct.conkey as col_attnums
    from
        pg_catalog.pg_constraint ct
        join pg_catalog.pg_class cl -- fkey owning table
            on ct.conrelid = cl.oid
        left join pg_catalog.pg_depend d
            on d.objid = cl.oid
            and d.deptype = 'e'
    where
        ct.contype = 'f' -- foreign key constraints
        and d.objid is null -- exclude tables that are dependencies of extensions
        and cl.relnamespace::regnamespace::text not in (
            'pg_catalog', 'information_schema', 'auth', 'storage', 'vault', 'extensions'
        )
),
index_ as (
    select
        pi.indrelid as table_oid,
        indexrelid::regclass as index_,
        string_to_array(indkey::text, ' ')::smallint[] as col_attnums
    from
        pg_catalog.pg_index pi
    where
        indisvalid
)
select
    'unindexed_foreign_keys' as name,
    '未索引的外键' as title,
    'INFO' as level,
    'EXTERNAL' as facing,
    array['PERFORMANCE'] as categories,
    '识别没有包含索引的外键约束，这可能会影响数据库性能。' as description,
    format(
        '表\`%s.%s\`存在没有包含索引的外键 \`%s\`。这可能导致查询性能下降。',
        fk.schema_name,
        fk.table_name,
        fk.fkey_name
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys' as remediation,
    jsonb_build_object(
        'schema', fk.schema_name,
        'name', fk.table_name,
        'type', 'table',
        'fkey_name', fk.fkey_name,
        'fkey_columns', fk.col_attnums
    ) as metadata,
    format('unindexed_foreign_keys_%s_%s_%s', fk.schema_name, fk.table_name, fk.fkey_name) as cache_key
from
    foreign_keys fk
    left join index_ idx
        on fk.table_oid = idx.table_oid
        and fk.col_attnums = idx.col_attnums
    left join pg_catalog.pg_depend dep
        on idx.table_oid = dep.objid
        and dep.deptype = 'e'
where
    idx.index_ is null
    and fk.schema_name not in (
        '_timescaledb_cache', '_timescaledb_catalog', '_timescaledb_config', '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    and dep.objid is null -- exclude tables owned by extensions
order by
    fk.schema_name,
    fk.table_name,
    fk.fkey_name)
union all
(
select
    'auth_users_exposed' as name,
    '暴露的认证用户' as title,
    'ERROR' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    '检测是否在暴露给 PostgREST 的模式中，通过视图或物化视图将 auth.users 暴露给 anon 或 authenticated 角色，可能会危及用户数据安全性。' as description,
    format(
        '视图/物化视图 "%s" 在公共模式中可能会将 \`auth.users\` 的数据暴露给 anon 或 authenticated 角色。',
        c.relname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0002_auth_users_exposed' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', c.relname,
        'type', 'view',
        'exposed_to', array_remove(array_agg(DISTINCT case when pg_catalog.has_table_privilege('anon', c.oid, 'SELECT') then 'anon' when pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT') then 'authenticated' end), null)
    ) as metadata,
    format('auth_users_exposed_%s_%s', n.nspname, c.relname) as cache_key
from
    -- Identify the oid for auth.users
    pg_catalog.pg_class auth_users_pg_class
    join pg_catalog.pg_namespace auth_users_pg_namespace
        on auth_users_pg_class.relnamespace = auth_users_pg_namespace.oid
        and auth_users_pg_class.relname = 'users'
        and auth_users_pg_namespace.nspname = 'auth'
    -- Depends on auth.users
    join pg_catalog.pg_depend d
        on d.refobjid = auth_users_pg_class.oid
    join pg_catalog.pg_rewrite r
        on r.oid = d.objid
    join pg_catalog.pg_class c
        on c.oid = r.ev_class
    join pg_catalog.pg_namespace n
        on n.oid = c.relnamespace
    join pg_catalog.pg_class pg_class_auth_users
        on d.refobjid = pg_class_auth_users.oid
where
    d.deptype = 'n'
    and (
      pg_catalog.has_table_privilege('anon', c.oid, 'SELECT')
      or pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT')
    )
    and n.nspname = any(array(select trim(unnest(string_to_array(current_setting('pgrst.db_schemas', 't'), ',')))))
    -- Exclude self
    and c.relname <> '0002_auth_users_exposed'
    -- There are 3 insecure configurations
    and
    (
        -- Materialized views don't support RLS so this is insecure by default
        (c.relkind in ('m')) -- m for materialized view
        or
        -- Standard View, accessible to anon or authenticated that is security_definer
        (
            c.relkind = 'v' -- v for view
            -- Exclude security invoker views
            and not (
                lower(coalesce(c.reloptions::text,'{}'))::text[]
                && array[
                    'security_invoker=1',
                    'security_invoker=true',
                    'security_invoker=yes',
                    'security_invoker=on'
                ]
            )
        )
        or
        -- Standard View, security invoker, but no RLS enabled on auth.users
        (
            c.relkind in ('v') -- v for view
            -- is security invoker
            and (
                lower(coalesce(c.reloptions::text,'{}'))::text[]
                && array[
                    'security_invoker=1',
                    'security_invoker=true',
                    'security_invoker=yes',
                    'security_invoker=on'
                ]
            )
            and not pg_class_auth_users.relrowsecurity
        )
    )
group by
    n.nspname,
    c.relname,
    c.oid)
union all
(
with policies as (
    select
        nsp.nspname as schema_name,
        pb.tablename as table_name,
        pc.relrowsecurity as is_rls_active,
        polname as policy_name,
        polpermissive as is_permissive, -- if not, then restrictive
        (select array_agg(r::regrole) from unnest(polroles) as x(r)) as roles,
        case polcmd
            when 'r' then 'SELECT'
            when 'a' then 'INSERT'
            when 'w' then 'UPDATE'
            when 'd' then 'DELETE'
            when '*' then 'ALL'
        end as command,
        qual,
        with_check
    from
        pg_catalog.pg_policy pa
        join pg_catalog.pg_class pc
            on pa.polrelid = pc.oid
        join pg_catalog.pg_namespace nsp
            on pc.relnamespace = nsp.oid
        join pg_catalog.pg_policies pb
            on pc.relname = pb.tablename
            and nsp.nspname = pb.schemaname
            and pa.polname = pb.policyname
)
select
    'auth_rls_initplan' as name,
    '认证 RLS 初始化计划' as title,
    'WARN' as level,
    'EXTERNAL' as facing,
    array['PERFORMANCE'] as categories,
    '检测在行级安全（RLS）策略中，对\`auth.<function>()\`的调用是否每行都进行了不必要的重复取值。' as description,
    format(
        '表\`%s.%s\`具有一个行级安全策略\`%s\`，该策略为每一行重复执行 auth.<function>()。在大量数据时，这会导致查询性能不佳。通过用\`(select auth.<function>())\`替换\`auth.<function>()\`来解决此问题。更多信息请参见[文档](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)。',
        schema_name,
        table_name,
        policy_name
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan' as remediation,
    jsonb_build_object(
        'schema', schema_name,
        'name', table_name,
        'type', 'table'
    ) as metadata,
    format('auth_rls_init_plan_%s_%s_%s', schema_name, table_name, policy_name) as cache_key
from
    policies
where
    is_rls_active
    -- NOTE: does not include realtime in support of monitoring policies on realtime.messages
    and schema_name not in (
        '_timescaledb_cache', '_timescaledb_catalog', '_timescaledb_config', '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    and (
        -- Example: auth.uid()
        (
            qual like '%auth.uid()%'
            and lower(qual) not like '%select auth.uid()%'
        )
        or (
            qual like '%auth.jwt()%'
            and lower(qual) not like '%select auth.jwt()%'
        )
        or (
            qual like '%auth.role()%'
            and lower(qual) not like '%select auth.role()%'
        )
        or (
            qual like '%auth.email()%'
            and lower(qual) not like '%select auth.email()%'
        )
        or (
            with_check like '%auth.uid()%'
            and lower(with_check) not like '%select auth.uid()%'
        )
        or (
            with_check like '%auth.jwt()%'
            and lower(with_check) not like '%select auth.jwt()%'
        )
        or (
            with_check like '%auth.role()%'
            and lower(with_check) not like '%select auth.role()%'
        )
        or (
            with_check like '%auth.email()%'
            and lower(with_check) not like '%select auth.email()%'
        )
    ))
union all
(
select
    'no_primary_key' as name,
    '没有主键' as title,
    'INFO' as level,
    'EXTERNAL' as facing,
    array['PERFORMANCE'] as categories,
    '检测表是否没有主键。没有主键的表在大量数据交互时可能会效率低下。' as description,
    format(
        '表\`%s.%s\`没有主键。',
        pgns.nspname,
        pgc.relname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0004_no_primary_key' as remediation,
     jsonb_build_object(
        'schema', pgns.nspname,
        'name', pgc.relname,
        'type', 'table'
    ) as metadata,
    format(
        'no_primary_key_%s_%s',
        pgns.nspname,
        pgc.relname
    ) as cache_key
from
    pg_catalog.pg_class pgc
    join pg_catalog.pg_namespace pgns
        on pgns.oid = pgc.relnamespace
    left join pg_catalog.pg_index pgi
        on pgi.indrelid = pgc.oid
    left join pg_catalog.pg_depend dep
        on pgc.oid = dep.objid
        and dep.deptype = 'e'
where
    pgc.relkind = 'r' -- regular tables
    and pgns.nspname not in (
        '_timescaledb_cache', '_timescaledb_catalog', '_timescaledb_config', '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    and dep.objid is null -- exclude tables owned by extensions
group by
    pgc.oid,
    pgns.nspname,
    pgc.relname
having
    max(coalesce(pgi.indisprimary, false)::int) = 0)
union all
(
select
    'unused_index' as name,
    '未使用的索引' as title,
    'INFO' as level,
    'EXTERNAL' as facing,
    array['PERFORMANCE'] as categories,
    '检测索引是否从未被使用过，可能是移除的候选对象。' as description,
    format(
        '在表\`%s.%s\`中的索引\`%s\`从未被使用过。',
        psui.indexrelname,
        psui.schemaname,
        psui.relname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index' as remediation,
    jsonb_build_object(
        'schema', psui.schemaname,
        'name', psui.relname,
        'type', 'table'
    ) as metadata,
    format(
        'unused_index_%s_%s_%s',
        psui.schemaname,
        psui.relname,
        psui.indexrelname
    ) as cache_key

from
    pg_catalog.pg_stat_user_indexes psui
    join pg_catalog.pg_index pi
        on psui.indexrelid = pi.indexrelid
    left join pg_catalog.pg_depend dep
        on psui.relid = dep.objid
        and dep.deptype = 'e'
where
    psui.idx_scan = 0
    and not pi.indisunique
    and not pi.indisprimary
    and dep.objid is null -- exclude tables owned by extensions
    and psui.schemaname not in (
        '_timescaledb_cache', '_timescaledb_catalog', '_timescaledb_config', '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    ))
union all
(
select
    'multiple_permissive_policies' as name,
    '多个允许性行级安全策略' as title,
    'WARN' as level,
    'EXTERNAL' as facing,
    array['PERFORMANCE'] as categories,
    '检测表中是否对同一\`role\`（角色）和\`action\`（操作，例如插入）存在多个允许性行级安全策略。多个允许性策略对性能来说不是最优的，因为每个相关查询都必须执行所有策略。' as description,
    format(
        '表\`%s.%s\`对于角色\`%s\`在操作\`%s\`上有多个允许性策略。这些策略包括\`%s\。',
        n.nspname,
        c.relname,
        r.rolname,
        act.cmd,
        array_agg(p.polname order by p.polname)
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', c.relname,
        'type', 'table'
    ) as metadata,
    format(
        'multiple_permissive_policies_%s_%s_%s_%s',
        n.nspname,
        c.relname,
        r.rolname,
        act.cmd
    ) as cache_key
from
    pg_catalog.pg_policy p
    join pg_catalog.pg_class c
        on p.polrelid = c.oid
    join pg_catalog.pg_namespace n
        on c.relnamespace = n.oid
    join pg_catalog.pg_roles r
        on p.polroles @> array[r.oid]
        or p.polroles = array[0::oid]
    left join pg_catalog.pg_depend dep
        on c.oid = dep.objid
        and dep.deptype = 'e',
    lateral (
        select x.cmd
        from unnest((
            select
                case p.polcmd
                    when 'r' then array['SELECT']
                    when 'a' then array['INSERT']
                    when 'w' then array['UPDATE']
                    when 'd' then array['DELETE']
                    when '*' then array['SELECT', 'INSERT', 'UPDATE', 'DELETE']
                    else array['ERROR']
                end as actions
        )) x(cmd)
    ) act(cmd)
where
    c.relkind = 'r' -- regular tables
    and p.polpermissive -- policy is permissive
    and n.nspname not in (
        '_timescaledb_cache', '_timescaledb_catalog', '_timescaledb_config', '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    and r.rolname not like 'pg_%'
    and r.rolname not like 'supabase%admin'
    and not r.rolbypassrls
    and dep.objid is null -- exclude tables owned by extensions
group by
    n.nspname,
    c.relname,
    r.rolname,
    act.cmd
having
    count(1) > 1)
union all
(
select
    'policy_exists_rls_disabled' as name,
    '策略存在但 RLS 未启用' as title,
    'ERROR' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    '检测已创建行级安全（RLS）策略但相关表未启用 RLS 的情况。' as description,
    format(
        '表\`%s.%s\`有RLS策略但表上未启用 RLS。策略包括 %s。',
        n.nspname,
        c.relname,
        array_agg(p.polname order by p.polname)
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0007_policy_exists_rls_disabled' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', c.relname,
        'type', 'table'
    ) as metadata,
    format(
        'policy_exists_rls_disabled_%s_%s',
        n.nspname,
        c.relname
    ) as cache_key
from
    pg_catalog.pg_policy p
    join pg_catalog.pg_class c
        on p.polrelid = c.oid
    join pg_catalog.pg_namespace n
        on c.relnamespace = n.oid
    left join pg_catalog.pg_depend dep
        on c.oid = dep.objid
        and dep.deptype = 'e'
where
    c.relkind = 'r' -- regular tables
    and n.nspname not in (
        '_timescaledb_cache', '_timescaledb_catalog', '_timescaledb_config', '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    -- RLS is disabled
    and not c.relrowsecurity
    and dep.objid is null -- exclude tables owned by extensions
group by
    n.nspname,
    c.relname)
union all
(
select
    'rls_enabled_no_policy' as name,
    'RLS 已启用但无策略' as title,
    'INFO' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    '检测在表上启用了行级安全（RLS）但未创建任何 RLS 策略的情况。' as description,
    format(
        '表\`%s.%s\`已启用 RLS，但未定义任何策略。',
        n.nspname,
        c.relname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', c.relname,
        'type', 'table'
    ) as metadata,
    format(
        'rls_enabled_no_policy_%s_%s',
        n.nspname,
        c.relname
    ) as cache_key
from
    pg_catalog.pg_class c
    left join pg_catalog.pg_policy p
        on p.polrelid = c.oid
    join pg_catalog.pg_namespace n
        on c.relnamespace = n.oid
    left join pg_catalog.pg_depend dep
        on c.oid = dep.objid
        and dep.deptype = 'e'
where
    c.relkind = 'r' -- regular tables
    and n.nspname not in (
        '_timescaledb_cache', '_timescaledb_catalog', '_timescaledb_config', '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    -- RLS is enabled
    and c.relrowsecurity
    and p.polname is null
    and dep.objid is null -- exclude tables owned by extensions
group by
    n.nspname,
    c.relname)
union all
(
select
    'duplicate_index' as name,
    '重复索引' as title,
    'WARN' as level,
    'EXTERNAL' as facing,
    array['PERFORMANCE'] as categories,
    '检测存在两个或更多相同索引的情况。' as description,
    format(
        '表\`%s.%s\`拥有相同的索引 %s。请只保留一个索引删除其他相同的索引。',
        n.nspname,
        c.relname,
        array_agg(pi.indexname order by pi.indexname)
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', c.relname,
        'type', case
            when c.relkind = 'r' then 'table'
            when c.relkind = 'm' then 'materialized view'
            else 'ERROR'
        end,
        'indexes', array_agg(pi.indexname order by pi.indexname)
    ) as metadata,
    format(
        'duplicate_index_%s_%s_%s',
        n.nspname,
        c.relname,
        array_agg(pi.indexname order by pi.indexname)
    ) as cache_key
from
    pg_catalog.pg_indexes pi
    join pg_catalog.pg_namespace n
        on n.nspname  = pi.schemaname
    join pg_catalog.pg_class c
        on pi.tablename = c.relname
        and n.oid = c.relnamespace
    left join pg_catalog.pg_depend dep
        on c.oid = dep.objid
        and dep.deptype = 'e'
where
    c.relkind in ('r', 'm') -- tables and materialized views
    and n.nspname not in (
        '_timescaledb_cache', '_timescaledb_catalog', '_timescaledb_config', '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    and dep.objid is null -- exclude tables owned by extensions
group by
    n.nspname,
    c.relkind,
    c.relname,
    replace(pi.indexdef, pi.indexname, '')
having
    count(*) > 1)
union all
(
select
    'security_definer_view' as name,
    'Security Definer 视图' as title,
    'ERROR' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    '检测使用 SECURITY DEFINER 属性定义的视图。这些视图强制执行视图创建者的 PostgreSQL 权限和行级安全策略（RLS），而不是查询用户的权限和策略。' as description,
    format(
        '视图\`%s.%s\`定义了 SECURITY DEFINER 属性。',
        n.nspname,
        c.relname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', c.relname,
        'type', 'view'
    ) as metadata,
    format(
        'security_definer_view_%s_%s',
        n.nspname,
        c.relname
    ) as cache_key
from
    pg_catalog.pg_class c
    join pg_catalog.pg_namespace n
        on n.oid = c.relnamespace
    left join pg_catalog.pg_depend dep
        on c.oid = dep.objid
        and dep.deptype = 'e'
where
    c.relkind = 'v'
    and (
        pg_catalog.has_table_privilege('anon', c.oid, 'SELECT')
        or pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT')
    )
    and substring(pg_catalog.version() from 'PostgreSQL ([0-9]+)') >= '15' -- security invoker was added in pg15
    and n.nspname = any(array(select trim(unnest(string_to_array(current_setting('pgrst.db_schemas', 't'), ',')))))
    and n.nspname not in (
        '_timescaledb_cache', '_timescaledb_catalog', '_timescaledb_config', '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    and dep.objid is null -- exclude views owned by extensions
    and not (
        lower(coalesce(c.reloptions::text,'{}'))::text[]
        && array[
            'security_invoker=1',
            'security_invoker=true',
            'security_invoker=yes',
            'security_invoker=on'
        ]
    ))
union all
(
select
    'function_search_path_mutable' as name,
    '函数搜索路径可变' as title,
    'WARN' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    '检测未将 search_path 设置为空字符串的函数。' as description,
    format(
        '函数\`%s.%s\`拥有一个可随角色变化的 search_path。',
        n.nspname,
        p.proname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', p.proname,
        'type', 'function'
    ) as metadata,
    format(
        'function_search_path_mutable_%s_%s_%s',
        n.nspname,
        p.proname,
        md5(p.prosrc) -- required when function is polymorphic
    ) as cache_key
from
    pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n
        on p.pronamespace = n.oid
    left join pg_catalog.pg_depend dep
        on p.oid = dep.objid
        and dep.deptype = 'e'
where
    n.nspname not in (
        '_timescaledb_cache', '_timescaledb_catalog', '_timescaledb_config', '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    and dep.objid is null -- exclude functions owned by extensions
    -- Search path not set to ''
    and not coalesce(p.proconfig, '{}') && array['search_path=""'])
union all
(
select
    'rls_disabled_in_public' as name,
    '在 public 模式中未启用 RLS' as title,
    'ERROR' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    '检测在暴露给 PostgREST 的模式中，哪些表的行级安全（RLS）未被启用。' as description,
    format(
        '表\`%s.%s\`在 public 中，但 RLS 未被启用。',
        n.nspname,
        c.relname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', c.relname,
        'type', 'table'
    ) as metadata,
    format(
        'rls_disabled_in_public_%s_%s',
        n.nspname,
        c.relname
    ) as cache_key
from
    pg_catalog.pg_class c
    join pg_catalog.pg_namespace n
        on c.relnamespace = n.oid
where
    c.relkind = 'r' -- regular tables
    -- RLS is disabled
    and not c.relrowsecurity
    and (
        pg_catalog.has_table_privilege('anon', c.oid, 'SELECT')
        or pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT')
    )
    and n.nspname = any(array(select trim(unnest(string_to_array(current_setting('pgrst.db_schemas', 't'), ',')))))
    and n.nspname not in (
        '_timescaledb_cache', '_timescaledb_catalog', '_timescaledb_config', '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    ))
union all
(
select
    'extension_in_public' as name,
    'public 模式中的扩展' as title,
    'WARN' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    '检测安装在\`public\`模式下的扩展。' as description,
    format(
        '\`%s\` 扩展安装在 public 模式下，建议安装到其他模式。',
        pe.extname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public' as remediation,
    jsonb_build_object(
        'schema', pe.extnamespace::regnamespace,
        'name', pe.extname,
        'type', 'extension'
    ) as metadata,
    format(
        'extension_in_public_%s',
        pe.extname
    ) as cache_key
from
    pg_catalog.pg_extension pe
where
    -- plpgsql is installed by default in public and outside user control
    -- confirmed safe
    pe.extname not in ('plpgsql')
    -- Scoping this to public is not optimal. Ideally we would use the postgres
    -- search path. That currently isn't available via SQL. In other lints
    -- we have used has_schema_privilege('anon', 'extensions', 'USAGE') but that
    -- is not appropriate here as it would evaluate true for the extensions schema
    and pe.extnamespace::regnamespace::text = 'public')
union all
(
with policies as (
    select
        nsp.nspname as schema_name,
        pb.tablename as table_name,
        polname as policy_name,
        qual,
        with_check
    from
        pg_catalog.pg_policy pa
        join pg_catalog.pg_class pc
            on pa.polrelid = pc.oid
        join pg_catalog.pg_namespace nsp
            on pc.relnamespace = nsp.oid
        join pg_catalog.pg_policies pb
            on pc.relname = pb.tablename
            and nsp.nspname = pb.schemaname
            and pa.polname = pb.policyname
)
select
    'rls_references_user_metadata' as name,
    'RLS 引用用户元数据' as title,
    'ERROR' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    '检测在行级安全（RLS）策略中是否以不安全的方式引用了 Supabase Auth 的 user_metadata。' as description,
    format(
        '表\`%s.%s\`有一个行级安全策略\`%s\`，该策略引用了 Supabase Auth 的\`user_metadata\`。\`user_metadata\`是可由最终用户编辑的，因此绝不应在安全上下文中使用。',
        schema_name,
        table_name,
        policy_name
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0015_rls_references_user_metadata' as remediation,
    jsonb_build_object(
        'schema', schema_name,
        'name', table_name,
        'type', 'table'
    ) as metadata,
    format('rls_references_user_metadata_%s_%s_%s', schema_name, table_name, policy_name) as cache_key
from
    policies
where
    schema_name not in (
        '_timescaledb_cache', '_timescaledb_catalog', '_timescaledb_config', '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    and (
        -- Example: auth.jwt() -> 'user_metadata'
        -- False positives are possible, but it isn't practical to string match
        -- If false positive rate is too high, this expression can iterate
        qual like '%auth.jwt()%user_metadata%'
        or qual like '%current_setting(%request.jwt.claims%)%user_metadata%'
        or with_check like '%auth.jwt()%user_metadata%'
        or with_check like '%current_setting(%request.jwt.claims%)%user_metadata%'
    ))
union all
(
select
    'materialized_view_in_api' as name,
    'API 中的物化视图' as title,
    'WARN' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    '检测可通过数据 API 访问的物化视图。' as description,
    format(
        '物化视图\`%s.%s\`可被匿名角色或已认证角色查看。',
        n.nspname,
        c.relname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0016_materialized_view_in_api' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', c.relname,
        'type', 'materialized view'
    ) as metadata,
    format(
        'materialized_view_in_api_%s_%s',
        n.nspname,
        c.relname
    ) as cache_key
from
    pg_catalog.pg_class c
    join pg_catalog.pg_namespace n
        on n.oid = c.relnamespace
    left join pg_catalog.pg_depend dep
        on c.oid = dep.objid
        and dep.deptype = 'e'
where
    c.relkind = 'm'
    and (
        pg_catalog.has_table_privilege('anon', c.oid, 'SELECT')
        or pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT')
    )
    and n.nspname = any(array(select trim(unnest(string_to_array(current_setting('pgrst.db_schemas', 't'), ',')))))
    and n.nspname not in (
        '_timescaledb_cache', '_timescaledb_catalog', '_timescaledb_config', '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    and dep.objid is null)
union all
(
select
    'foreign_table_in_api' as name,
    'API 中的外部表' as title,
    'WARN' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    '检测可通过 API 访问的外部表。外部表不遵守行级安全策略。' as description,
    format(
        '外部表\`%s.%s\`可通过API访问。',
        n.nspname,
        c.relname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=0017_foreign_table_in_api' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', c.relname,
        'type', 'foreign table'
    ) as metadata,
    format(
        'foreign_table_in_api_%s_%s',
        n.nspname,
        c.relname
    ) as cache_key
from
    pg_catalog.pg_class c
    join pg_catalog.pg_namespace n
        on n.oid = c.relnamespace
    left join pg_catalog.pg_depend dep
        on c.oid = dep.objid
        and dep.deptype = 'e'
where
    c.relkind = 'f'
    and (
        pg_catalog.has_table_privilege('anon', c.oid, 'SELECT')
        or pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT')
    )
    and n.nspname = any(array(select trim(unnest(string_to_array(current_setting('pgrst.db_schemas', 't'), ',')))))
    and n.nspname not in (
        '_timescaledb_cache', '_timescaledb_catalog', '_timescaledb_config', '_timescaledb_internal', 'auth', 'cron', 'extensions', 'graphql', 'graphql_public', 'information_schema', 'net', 'pgroonga', 'pgsodium', 'pgsodium_masks', 'pgtle', 'pgbouncer', 'pg_catalog', 'pgtle', 'realtime', 'repack', 'storage', 'supabase_functions', 'supabase_migrations', 'tiger', 'topology', 'vault'
    )
    and dep.objid is null)
union all
(
select
    'unsupported_reg_types' as name,
    'Unsupported reg types' as title,
    'WARN' as level,
    'EXTERNAL' as facing,
    array['SECURITY'] as categories,
    'Identifies columns using unsupported reg* types outside pg_catalog schema, which prevents database upgrades using pg_upgrade.' as description,
    format(
        'Table \`%s.%s\` has a column \`%s\` with unsupported reg* type \`%s\`.',
        n.nspname,
        c.relname,
        a.attname,
        t.typname
    ) as detail,
    'https://supabase.com/docs/guides/database/database-linter?lint=unsupported_reg_types' as remediation,
    jsonb_build_object(
        'schema', n.nspname,
        'name', c.relname,
        'column', a.attname,
        'type', 'table'
    ) as metadata,
    format(
        'unsupported_reg_types_%s_%s_%s',
        n.nspname,
        c.relname,
        a.attname
    ) AS cache_key
from
    pg_catalog.pg_attribute a
    join pg_catalog.pg_class c
        on a.attrelid = c.oid
    join pg_catalog.pg_namespace n
        on c.relnamespace = n.oid
    join pg_catalog.pg_type t
        on a.atttypid = t.oid
    join pg_catalog.pg_namespace tn
        on t.typnamespace = tn.oid
where
    tn.nspname = 'pg_catalog'
    and t.typname in ('regcollation', 'regconfig', 'regdictionary', 'regnamespace', 'regoper', 'regoperator', 'regproc', 'regprocedure')
    and n.nspname not in ('pg_catalog', 'information_schema', 'pgsodium'))`.trim()
