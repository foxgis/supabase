import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'

export const generateDatabaseMenu = (
  project?: Project,
  flags?: { pgNetExtensionExists: boolean; pitrEnabled: boolean }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const { pgNetExtensionExists, pitrEnabled } = flags || {}

  return [
    {
      title: '数据库',
      items: [
        { name: '表结构', key: 'tables', url: `/project/${ref}/database/tables`, items: [] },
        {
          name: '模式',
          key: 'schemas',
          url: `/project/${ref}/database/schemas`,
          items: [],
        },
        {
          name: '触发器',
          key: 'triggers',
          url: `/project/${ref}/database/triggers`,
          items: [],
        },
        {
          name: '函数',
          key: 'functions',
          url: `/project/${ref}/database/functions`,
          items: [],
        },
        {
          name: '扩展',
          key: 'extensions',
          url: `/project/${ref}/database/extensions`,
          items: [],
        },
        { name: '角色', key: 'roles', url: `/project/${ref}/database/roles`, items: [] },
        {
          name: '流复制',
          key: 'replication',
          url: `/project/${ref}/database/replication`,
          items: [],
        },
        ...(!!pgNetExtensionExists
          ? [
              {
                name: 'Webhooks',
                key: 'hooks',
                url: `/project/${ref}/database/hooks`,
                items: [],
              },
            ]
          : []),
        {
          name: 'FDW',
          key: 'wrappers',
          url: `/project/${ref}/database/wrappers`,
          items: [],
        },
        ...(IS_PLATFORM
          ? [
              {
                name: '备份',
                key: 'backups',
                url: pitrEnabled
                  ? `/project/${ref}/database/backups/pitr`
                  : `/project/${ref}/database/backups/scheduled`,
                items: [],
              },
            ]
          : []),
        {
          name: '迁移',
          key: 'migrations',
          url: `/project/${ref}/database/migrations`,
          items: [],
        },
        {
          name: '索引',
          key: 'indexes',
          url: `/project/${ref}/database/indexes`,
          items: [],
        },
        {
          name: '枚举类型',
          key: 'types',
          url: `/project/${ref}/database/types`,
          items: [],
        },
        {
          name: '查询性能',
          key: 'query-performance',
          url: `/project/${ref}/database/query-performance`,
          items: [],
        },
        {
          name: '诊断',
          key: 'linter',
          url: `/project/${ref}/database/linter`,
          items: [],
        },
      ],
    },
  ]
}
