import { BASE_PATH, IS_PLATFORM } from 'lib/constants'

export const HOOK_EVENTS = [
  {
    label: '插入',
    value: 'INSERT',
    description: '数据表上任何插入操作',
  },
  {
    label: '更新',
    value: 'UPDATE',
    description: '数据表的任何列的更新操作',
  },
  {
    label: '删除',
    value: 'DELETE',
    description: '任何删除数据行的操作',
  },
]

export const AVAILABLE_WEBHOOK_TYPES = [
  {
    value: 'http_request',
    icon: `${BASE_PATH}/img/function-providers/http-request.png`,
    label: 'HTTP 请求',
    description: '向任意 URL 发送 HTTP 请求',
  },
  ...(IS_PLATFORM
    ? [
        {
          value: 'supabase_function',
          icon: `${BASE_PATH}/img/function-providers/supabase-severless-function.png`,
          label: 'Supabase Edge Functions',
          description: 'Choose a Supabase edge function to run.',
        },
      ]
    : []),
]
