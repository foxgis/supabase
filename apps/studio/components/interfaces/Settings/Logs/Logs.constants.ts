import dayjs from 'dayjs'

import type { DatetimeHelper, FilterTableSet, LogTemplate } from './Logs.types'

export const LOGS_EXPLORER_DOCS_URL =
  'https://supabase.com/docs/guides/platform/logs#querying-with-the-logs-explorer'

export const LOGS_LARGE_DATE_RANGE_DAYS_THRESHOLD = 2 // IN DAYS

export const TEMPLATES: LogTemplate[] = [
  {
    label: '最近的错误',
    mode: 'simple',
    searchString: '[Ee]rror|\\s[45][0-9][0-9]\\s',
    for: ['api'],
  },
  {
    label: '提交',
    mode: 'simple',
    searchString: 'COMMIT',
    for: ['database'],
  },
  {
    label: '用户的提交',
    description: '数据库上用户的提交数量',
    mode: 'custom',
    searchString: `select
  p.user_name,
  count(*) as count
from postgres_logs
  left join unnest(metadata) as m on true
  left join unnest(m.parsed) as p on true
where
  regexp_contains(event_message, 'COMMIT')
group by
  p.user_name
  `,
    for: ['database'],
  },
  {
    label: 'IP 元数据',
    description: '列出使用数据中间件 API 的所有 IP 地址',
    mode: 'custom',
    searchString: `select
  cast(timestamp as datetime) as timestamp,
  h.x_real_ip
from edge_logs
  left join unnest(metadata) as m on true
  left join unnest(m.request) as r on true
  left join unnest(r.headers) as h on true
where h.x_real_ip is not null
`,
    for: ['api'],
  },
  {
    label: '国家/地区的请求',
    description: '列出使用数据中间件 API 的所有 ISO 3166-1 alpha-2 国家/地区代码',
    mode: 'custom',
    searchString: `select
  cf.country,
  count(*) as count
from edge_logs
  left join unnest(metadata) as m on true
  left join unnest(m.request) as r on true
  left join unnest(r.cf) as cf on true
group by
  cf.country
order by
  count desc
`,
    for: ['api'],
  },
  {
    label: '缓慢的响应时间',
    mode: 'custom',
    description: '列出缓慢的数据中间件 API 请求',
    searchString: `select
  cast(timestamp as datetime) as timestamp,
  event_message,
  r.origin_time
from edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.response) as r
where
  r.origin_time > 1000
order by
  timestamp desc
limit 100
`,
    for: ['api'],
  },
  {
    label: '500 请求代码',
    description: '列出响应 5XX 状态码的所有数据中间件 API 请求',
    mode: 'custom',
    searchString: `select
  cast(timestamp as datetime) as timestamp,
  event_message,
  r.status_code
from edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.response) as r
where
  r.status_code >= 500
order by
  timestamp desc
limit 100
`,
    for: ['api'],
  },
  {
    label: '最多请求的路径',
    description: '列出最多请求的数据中间件 API 路径',
    mode: 'custom',
    searchString: `select
  r.path as path,
  r.search as params,
  count(timestamp) as c
from edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.request) as r
group by
  path,
  params
order by
  c desc
limit 100
`,
    for: ['api'],
  },
  {
    label: 'REST 请求',
    description: '列出所有 PostgREST 请求',
    mode: 'custom',
    searchString: `select
  cast(timestamp as datetime) as timestamp,
  event_message
from edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.request) as r
where
  path like '%rest/v1%'
order by
  timestamp desc
limit 100
`,
    for: ['api'],
  },
  {
    label: '错误',
    description: '列出所有 Postgres 错误消息，包括 ERROR、FATAL 或 PANIC 日志级别',
    mode: 'custom',
    searchString: `select
  cast(t.timestamp as datetime) as timestamp,
  p.error_severity,
  event_message
from postgres_logs as t
  cross join unnest(metadata) as m
  cross join unnest(m.parsed) as p
where
  p.error_severity in ('ERROR', 'FATAL', 'PANIC')
order by
  timestamp desc
limit 100
`,
    for: ['database'],
  },
  {
    label: '按用户统计错误数',
    description: '按用户统计错误数',
    mode: 'custom',
    searchString: `select
  count(t.timestamp) as count,
  p.user_name,
  p.error_severity
from postgres_logs as t
  cross join unnest(metadata) as m
  cross join unnest(m.parsed) as p
where
  p.error_severity in ('ERROR', 'FATAL', 'PANIC')
group by
  p.user_name,
  p.error_severity
order by
  count desc
limit 100
`,
    for: ['database'],
  },
  {
    label: 'Auth 接口事件',
    description: '根据路径过滤接口事件',
    mode: 'custom',
    searchString: `select
  t.timestamp,
  event_message
from auth_logs as t
where
  regexp_contains(event_message,"level.{3}(info|warning||error|fatal)")
  -- and regexp_contains(event_message,"path.{3}(/token|/recover|/signup|/otp)")
limit 100
`,
    for: ['database'],
  },
  {
    label: '文件对象的请求数',
    description: '对文件对象执行的请求数',
    mode: 'custom',
    searchString: `select
  r.method as http_verb,
  r.path as filepath,
  count(*) as num_requests
from edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.request) AS r
  cross join unnest(r.headers) AS h
where
  path like '%storage/v1/object/%'
group by
  r.path, r.method
order by
  num_requests desc
limit 100
`,
    for: ['api'],
  },
  {
    label: 'Storage Egress 请求数',
    description: '检查在 Storage Affecting Egress 上的请求数',
    mode: 'custom',
    searchString: `select
  request.method as http_verb,
  request.path as filepath,
  (responseHeaders.cf_cache_status = 'HIT') as cached,
  count(*) as num_requests
from
  edge_logs
  cross join unnest(metadata) as metadata
  cross join unnest(metadata.request) as request
  cross join unnest(metadata.response) as response
  cross join unnest(response.headers) as responseHeaders
where
  (path like '%storage/v1/object/%' or path like '%storage/v1/render/%')
  and request.method = 'GET'
group by 1, 2, 3
order by num_requests desc
limit 100;
`,
    for: ['api'],
  },
  {
    label: '未命中缓存的文件存储',
    description: '未命中缓存次数最多的文件存储请求',
    mode: 'custom',
    searchString: `select
  r.path as path,
  r.search as search,
  count(id) as count
from edge_logs f
  cross join unnest(f.metadata) as m
  cross join unnest(m.request) as r
  cross join unnest(m.response) as res
  cross join unnest(res.headers) as h
where starts_with(r.path, '/storage/v1/object')
  and r.method = 'GET'
  and h.cf_cache_status in ('MISS', 'NONE/UNKNOWN', 'EXPIRED', 'BYPASS', 'DYNAMIC')
group by path, search
order by count desc
limit 100;
`,
    for: ['api'],
  },
]

const _SQL_FILTER_COMMON = {
  search_query: (value: string) => `regexp_contains(event_message, '${value}')`,
}

export const SQL_FILTER_TEMPLATES: any = {
  postgres_logs: {
    ..._SQL_FILTER_COMMON,
    database: (value: string) => `identifier = '${value}'`,
    'severity.error': `parsed.error_severity in ('ERROR', 'FATAL', 'PANIC')`,
    'severity.noError': `parsed.error_severity not in ('ERROR', 'FATAL', 'PANIC')`,
    'severity.log': `parsed.error_severity = 'LOG'`,
  },
  edge_logs: {
    ..._SQL_FILTER_COMMON,
    database: (value: string) => `identifier = '${value}'`,
    'status_code.error': `response.status_code between 500 and 599`,
    'status_code.success': `response.status_code between 200 and 299`,
    'status_code.warning': `response.status_code between 400 and 499`,

    'product.database': `request.path like '/rest/%' or request.path like '/graphql/%'`,
    'product.storage': `request.path like '/storage/%'`,
    'product.auth': `request.path like '/auth/%'`,
    'product.realtime': `request.path like '/realtime/%'`,

    'method.get': `request.method = 'GET'`,
    'method.post': `request.method = 'POST'`,
    'method.put': `request.method = 'PUT'`,
    'method.patch': `request.method = 'PATCH'`,
    'method.delete': `request.method = 'DELETE'`,
    'method.options': `request.method = 'OPTIONS'`,
  },
  function_edge_logs: {
    ..._SQL_FILTER_COMMON,
    'status_code.error': `response.status_code between 500 and 599`,
    'status_code.success': `response.status_code between 200 and 299`,
    'status_code.warning': `response.status_code between 400 and 499`,
  },
  function_logs: {
    ..._SQL_FILTER_COMMON,
    'severity.error': `metadata.level = 'error'`,
    'severity.notError': `metadata.level != 'error'`,
    'severity.log': `metadata.level = 'log'`,
    'severity.info': `metadata.level = 'info'`,
    'severity.debug': `metadata.level = 'debug'`,
    'severity.warn': `metadata.level = 'warn'`,
  },
  auth_logs: {
    ..._SQL_FILTER_COMMON,
    'severity.error': `metadata.level = 'error' or metadata.level = 'fatal'`,
    'severity.warning': `metadata.level = 'warning'`,
    'severity.info': `metadata.level = 'info'`,
    'status_code.server_error': `cast(metadata.status as int64) between 500 and 599`,
    'status_code.client_error': `cast(metadata.status as int64) between 400 and 499`,
    'status_code.redirection': `cast(metadata.status as int64) between 300 and 399`,
    'status_code.success': `cast(metadata.status as int64) between 200 and 299`,
    'endpoints.admin': `REGEXP_CONTAINS(metadata.path, "/admin")`,
    'endpoints.signup': `REGEXP_CONTAINS(metadata.path, "/signup|/invite|/verify")`,
    'endpoints.authentication': `REGEXP_CONTAINS(metadata.path, "/token|/authorize|/callback|/otp|/magiclink")`,
    'endpoints.recover': `REGEXP_CONTAINS(metadata.path, "/recover")`,
    'endpoints.user': `REGEXP_CONTAINS(metadata.path, "/user")`,
    'endpoints.logout': `REGEXP_CONTAINS(metadata.path, "/logout")`,
  },
  realtime_logs: {
    ..._SQL_FILTER_COMMON,
  },
  storage_logs: {
    ..._SQL_FILTER_COMMON,
  },
  postgrest_logs: {
    ..._SQL_FILTER_COMMON,
    database: (value: string) => `identifier = '${value}'`,
  },
  pgbouncer_logs: {
    ..._SQL_FILTER_COMMON,
  },
  supavisor_logs: {
    ..._SQL_FILTER_COMMON,
    database: (value: string) => `m.project like '${value}%'`,
  },
  pg_upgrade_logs: {
    ..._SQL_FILTER_COMMON,
  },
  pg_cron_logs: {
    ..._SQL_FILTER_COMMON,
  },
}

export enum LogsTableName {
  EDGE = 'edge_logs',
  POSTGRES = 'postgres_logs',
  FUNCTIONS = 'function_logs',
  FN_EDGE = 'function_edge_logs',
  AUTH = 'auth_logs',
  REALTIME = 'realtime_logs',
  STORAGE = 'storage_logs',
  POSTGREST = 'postgrest_logs',
  SUPAVISOR = 'supavisor_logs',
  PGBOUNCER = 'pgbouncer_logs',
  PG_UPGRADE = 'pg_upgrade_logs',
  PG_CRON = 'pg_cron_logs',
  ETL = 'etl_replication_logs',
}

export const LOGS_TABLES = {
  api: LogsTableName.EDGE,
  database: LogsTableName.POSTGRES,
  functions: LogsTableName.FUNCTIONS,
  fn_edge: LogsTableName.FN_EDGE,
  auth: LogsTableName.AUTH,
  realtime: LogsTableName.REALTIME,
  storage: LogsTableName.STORAGE,
  postgrest: LogsTableName.POSTGREST,
  supavisor: LogsTableName.SUPAVISOR,
  pg_upgrade: LogsTableName.PG_UPGRADE,
  pg_cron: LogsTableName.POSTGRES,
  pgbouncer: LogsTableName.PGBOUNCER,
  etl: LogsTableName.ETL,
}

export const LOGS_SOURCE_DESCRIPTION = {
  [LogsTableName.EDGE]: '网关日志，包含所有 API 请求',
  [LogsTableName.POSTGRES]: '数据库日志',
  [LogsTableName.FUNCTIONS]: '函数执行日志',
  [LogsTableName.FN_EDGE]: '函数调用日志，包含请求和响应',
  [LogsTableName.AUTH]: '身份认证日志',
  [LogsTableName.REALTIME]: '数据库逻辑复制日志',
  [LogsTableName.STORAGE]: '文件存储日志',
  [LogsTableName.POSTGREST]: 'REST 接口服务日志',
  [LogsTableName.SUPAVISOR]: '数据库连接池（supavisor）日志',
  [LogsTableName.PGBOUNCER]: '数据库连接池（pgbouncer）日志',
  [LogsTableName.PG_UPGRADE]: '数据库升级日志',
  [LogsTableName.PG_CRON]: '定时任务日志',
  [LogsTableName.ETL]: 'ETL 日志',
}

export const FILTER_OPTIONS: FilterTableSet = {
  // Postgres logs
  postgres_logs: {
    severity: {
      label: '日志级别',
      key: 'severity',
      options: [
        {
          key: 'error',
          label: '错误',
          description: '显示所有 ERROR、PANIC 或 FATAL 级别的事件',
        },
        {
          key: 'noError',
          label: '无错误',
          description: '显示所有非错误级别的事件',
        },
        {
          key: 'log',
          label: '日志',
          description: '显示所有日志级别的事件',
        },
      ],
    },
  },

  // Edge logs
  edge_logs: {
    status_code: {
      label: '状态',
      key: 'status_code',
      options: [
        {
          key: 'error',
          label: '错误',
          description: '500 错误码',
        },
        {
          key: 'success',
          label: '成功',
          description: '200 响应码',
        },
        {
          key: 'warning',
          label: '警告',
          description: '400 响应码',
        },
      ],
    },
    product: {
      label: '产品',
      key: 'product',
      options: [
        {
          key: 'database',
          label: '数据库',
          description: '',
        },
        {
          key: 'auth',
          label: '认证授权',
          description: '',
        },
        {
          key: 'storage',
          label: '文件存储',
          description: '',
        },
        {
          key: 'realtime',
          label: '实时通信',
          description: '',
        },
      ],
    },
    method: {
      label: '方法',
      key: 'method',
      options: [
        {
          key: 'get',
          label: 'GET',
          description: '',
        },
        {
          key: 'options',
          label: 'OPTIONS',
          description: '',
        },
        {
          key: 'put',
          label: 'PUT',
          description: '',
        },
        {
          key: 'post',
          label: 'POST',
          description: '',
        },
        {
          key: 'patch',
          label: 'PATCH',
          description: '',
        },
        {
          key: 'delete',
          label: 'DELETE',
          description: '',
        },
      ],
    },
  },
  // function_edge_logs
  function_edge_logs: {
    status_code: {
      label: '状态码',
      key: 'status_code',
      options: [
        {
          key: 'error',
          label: 'Error',
          description: '500 error codes',
        },
        {
          key: 'success',
          label: 'Success',
          description: '200 codes',
        },
        {
          key: 'warning',
          label: 'Warning',
          description: '400 codes',
        },
      ],
    },
  },
  // function_logs
  function_logs: {
    severity: {
      label: '日志级别',
      key: 'severity',
      options: [
        {
          key: 'error',
          label: '错误',
          description: '显示所有 "error" 级别的事件',
        },
        {
          key: 'warn',
          label: '警告',
          description: '显示所有 "warn" 级别的事件',
        },
        {
          key: 'info',
          label: '信息',
          description: '显示所有 "info" 级别的事件',
        },
        {
          key: 'debug',
          label: '调试',
          description: '显示所有 "debug" 级别的事件',
        },
        {
          key: 'log',
          label: '日志',
          description: '显示所有 "log" 级别的事件',
        },
      ],
    },
  },

  // auth logs
  auth_logs: {
    severity: {
      label: '日志级别',
      key: 'severity',
      options: [
        {
          key: 'error',
          label: '错误',
          description: '显示所有 "error" 级别的事件',
        },
        {
          key: 'warning',
          label: '警告',
          description: '显示所有 "warning" 级别的事件',
        },
        {
          key: 'info',
          label: '信息',
          description: '显示所有 "info" 级别的事件',
        },
      ],
    },
    status_code: {
      label: '状态码',
      key: 'status_code',
      options: [
        {
          key: 'server_error',
          label: '服务器错误',
          description: '显示所有 "server_error" 级别的事件',
        },
        {
          key: 'client_error',
          label: '客户端错误',
          description: '显示所有 "client_error" 级别的事件',
        },
        {
          key: 'redirection',
          label: '重定向',
          description: '显示所有 "redirection" 级别的事件',
        },
        {
          key: 'success',
          label: '成功',
          description: '显示所有 "success" 级别的事件',
        },
      ],
    },
    endpoints: {
      label: '接口',
      key: 'endpoints',
      options: [
        {
          key: 'admin',
          label: '管理员',
          description: '显示 admin 的所有请求',
        },
        {
          key: 'signup',
          label: '注册',
          description: '显示所有注册和授权请求',
        },
        {
          key: 'recover',
          label: '密码找回',
          description: '显示所有密码找回请求',
        },
        {
          key: 'authentication',
          label: '认证',
          description: '显示所有认证流程请求（登录、OTP 和 OAuth2）',
        },
        {
          key: 'user',
          label: '用户',
          description: '显示所有用户数据请求',
        },
        {
          key: 'logout',
          label: '登出',
          description: '显示所有登出请求',
        },
      ],
    },
  },
}

export const LOGS_TAILWIND_CLASSES = {
  log_selection_x_padding: 'px-8',
  space_y: 'px-6',
}

export const PREVIEWER_DATEPICKER_HELPERS: DatetimeHelper[] = [
  {
    text: '最近 15 分钟',
    calcFrom: () => dayjs().subtract(15, 'minute').toISOString(),
    calcTo: () => '',
  },
  {
    text: '最近 30 分钟',
    calcFrom: () => dayjs().subtract(30, 'minute').toISOString(),
    calcTo: () => '',
  },
  {
    text: '最近 1 小时',
    calcFrom: () => dayjs().subtract(1, 'hour').toISOString(),
    calcTo: () => '',
    default: true,
  },
  {
    text: '最近 3 小时',
    calcFrom: () => dayjs().subtract(3, 'hour').toISOString(),
    calcTo: () => '',
  },
  {
    text: '最近 24 小时',
    calcFrom: () => dayjs().subtract(1, 'day').toISOString(),
    calcTo: () => '',
  },
  {
    text: '最近 2 天',
    calcFrom: () => dayjs().subtract(2, 'day').toISOString(),
    calcTo: () => '',
  },
  {
    text: '最近 3 天',
    calcFrom: () => dayjs().subtract(3, 'day').toISOString(),
    calcTo: () => '',
  },
  {
    text: '最近 5 天',
    calcFrom: () => dayjs().subtract(5, 'day').toISOString(),
    calcTo: () => '',
  },
]
export const EXPLORER_DATEPICKER_HELPERS: DatetimeHelper[] = [
  {
    text: '最近 1 小时',
    calcFrom: () => dayjs().subtract(1, 'hour').toISOString(),
    calcTo: () => '',
    default: true,
  },
  {
    text: '最近 3 小时',
    calcFrom: () => dayjs().subtract(3, 'hour').toISOString(),
    calcTo: () => '',
  },
  {
    text: '最近 24 小时',
    calcFrom: () => dayjs().subtract(1, 'day').toISOString(),
    calcTo: () => '',
  },
  {
    text: '最近 3 天',
    calcFrom: () => dayjs().subtract(3, 'day').toISOString(),
    calcTo: () => '',
  },
  {
    text: '最近 7 天',
    calcFrom: () => dayjs().subtract(7, 'day').toISOString(),
    calcTo: () => '',
  },
]

export const getDefaultHelper = (helpers: DatetimeHelper[]) =>
  helpers.find((helper) => helper.default) || helpers[0]

export const TIER_QUERY_LIMITS: {
  [x: string]: { text: string; value: 1 | 7 | 28 | 90; unit: 'day'; promptUpgrade: boolean }
} = {
  FREE: { text: '1 天', value: 1, unit: 'day', promptUpgrade: true },
  PRO: { text: '7 天', value: 7, unit: 'day', promptUpgrade: true },
  PAYG: { text: '7 天', value: 7, unit: 'day', promptUpgrade: true },
  TEAM: { text: '28 天', value: 28, unit: 'day', promptUpgrade: true },
  ENTERPRISE: { text: '90 天', value: 90, unit: 'day', promptUpgrade: false },
}

export const LOG_ROUTES_WITH_REPLICA_SUPPORT = [
  '/project/[ref]/logs/edge-logs',
  '/project/[ref]/logs/pooler-logs',
  '/project/[ref]/logs/postgres-logs',
  '/project/[ref]/logs/postgrest-logs',
]
