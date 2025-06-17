import { EdgeFunctions, RESTApi, SqlEditor } from 'icons'
import { ScrollText } from 'lucide-react'

export const CRONJOB_TYPES = [
  'http_request',
  'edge_function',
  'sql_function',
  'sql_snippet',
] as const

export const CRONJOB_DEFINITIONS = [
  {
    value: 'sql_snippet',
    icon: <SqlEditor strokeWidth={1} />,
    label: 'SQL 语句',
    description: '执行 SQL 语句。',
  },
  {
    value: 'sql_function',
    icon: <ScrollText strokeWidth={1} />,
    label: '数据库函数',
    description: '执行数据库函数。',
  },

  {
    value: 'http_request',
    icon: <RESTApi strokeWidth={1} />,
    label: 'HTTP 请求',
    description: '发送 HTTP 请求。',
  },
  {
    value: 'edge_function',
    icon: <EdgeFunctions strokeWidth={1} />,
    label: '云函数',
    description: '执行云函数。',
  },
]

export type HTTPHeader = { name: string; value: string }

export type HTTPParameter = { name: string; value: string }
