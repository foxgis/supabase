import type {
  ProductMenuGroup,
  ProductMenuGroupItem,
} from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'

export const generateLogsMenu = (
  project?: Project,
  features?: { auth?: boolean; storage?: boolean; realtime?: boolean }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  const authEnabled = features?.auth ?? true
  const storageEnabled = features?.storage ?? true
  const realtimeEnabled = features?.realtime ?? true

  return [
    {
      title: '日志查看器',
      items: (
        [
          { key: 'explorer', name: '查询', root: true },
          IS_PLATFORM ? { key: 'saved', name: '保存的查询' } : null,
          { key: 'recent', name: '最近的查询' },
          { key: 'templates', name: '查询模版' },
        ].filter((item) => item) as { name: string; key: string; root: boolean }[]
      ).map(({ key, name, root }) => ({
        name,
        key,
        url: `/project/${ref}/logs/explorer${root ? '' : '/' + key}`,
        items: [],
      })),
    },
    {
      title: '基础组件日志',
      items: [
        {
          name: 'API 网关',
          key: 'edge-logs',
          url: `/project/${ref}/logs/edge-logs`,
          items: [],
        },
        {
          name: '数据库',
          key: 'postgres-logs',
          url: `/project/${ref}/logs/postgres-logs`,
          items: [],
        },
        {
          name: '接口生成器',
          key: 'postgrest-logs',
          url: `/project/${ref}/logs/postgrest-logs`,
          items: [],
        },
        IS_PLATFORM
          ? {
              name: '连接池',
              key: 'pooler-logs',
              url: `/project/${ref}/logs/pooler-logs`,
              items: [],
            }
          : null,
        ,
        authEnabled
          ? {
              name: '认证授权',
              key: 'auth-logs',
              url: `/project/${ref}/logs/auth-logs`,
              items: [],
            }
          : null,
        storageEnabled
          ? {
              name: '文件存储',
              key: 'storage-logs',
              url: `/project/${ref}/logs/storage-logs`,
              items: [],
            }
          : null,
        realtimeEnabled
          ? {
              name: '实时消息',
              key: 'realtime-logs',
              url: `/project/${ref}/logs/realtime-logs`,
              items: [],
            }
          : null,
      ].filter((item) => item) as ProductMenuGroupItem[],
    },
  ]
}
