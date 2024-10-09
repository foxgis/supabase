import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'
import { ArrowUpRight } from 'lucide-react'

export const generateDatabaseMenu = (
  project?: Project,
  flags?: {
    pgNetExtensionExists: boolean
    pitrEnabled: boolean
    columnLevelPrivileges: boolean
    cronUiEnabled: boolean
  }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const { pgNetExtensionExists, pitrEnabled, columnLevelPrivileges, cronUiEnabled } = flags || {}

  return [
    {
      title: '数据库管理',
      items: [
        { name: '表', key: 'tables', url: `/project/${ref}/database/tables`, items: [] },
        {
          name: '函数',
          key: 'functions',
          url: `/project/${ref}/database/functions`,
          items: [],
        },
        {
          name: '触发器',
          key: 'triggers',
          url: `/project/${ref}/database/triggers`,
          items: [],
        },
        {
          name: '枚举类型',
          key: 'types',
          url: `/project/${ref}/database/types`,

          items: [],
        },
        {
          name: '扩展',
          key: 'extensions',
          url: `/project/${ref}/database/extensions`,
          items: [],
        },
        {
          name: '索引',
          key: 'indexes',
          url: `/project/${ref}/database/indexes`,
          items: [],
        },
        {
          name: '事件发布',
          key: 'publications',
          url: `/project/${ref}/database/publications`,
          items: [],
        },
      ],
    },
    {
      title: '访问控制',
      items: [
        { name: '角色', key: 'roles', url: `/project/${ref}/database/roles`, items: [] },
        ...(columnLevelPrivileges
          ? [
              {
                name: '列权限',
                key: 'column-privileges',
                url: `/project/${ref}/database/column-privileges`,
                items: [],
                label: 'ALPHA',
              },
            ]
          : []),
        {
          name: '策略',
          key: 'policies',
          url: `/project/${ref}/auth/policies`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
      ],
    },
    // {
    //   title: 'Platform',
    //   items: [
    //     ...(IS_PLATFORM
    //       ? [
    //           {
    //             name: 'Backups',
    //             key: 'backups',
    //             url: pitrEnabled
    //               ? `/project/${ref}/database/backups/pitr`
    //               : `/project/${ref}/database/backups/scheduled`,
    //             items: [],
    //           },
    //         ]
    //       : []),
    //     {
    //       name: 'Wrappers',
    //       key: 'wrappers',
    //       url: `/project/${ref}/database/wrappers`,
    //       items: [],
    //     },
    //     {
    //       name: 'Migrations',
    //       key: 'migrations',
    //       url: `/project/${ref}/database/migrations`,
    //       items: [],
    //     },
    //     ...(!!pgNetExtensionExists
    //       ? [
    //           {
    //             name: 'Webhooks',
    //             key: 'hooks',
    //             url: `/project/${ref}/database/hooks`,
    //             items: [],
    //           },
    //         ]
    //       : []),
    //     ...(!!cronUiEnabled
    //       ? [
    //           {
    //             name: 'Cron Jobs',
    //             key: 'cron-jobs',
    //             url: `/project/${ref}/database/cron-jobs`,
    //             items: [],
    //           },
    //         ]
    //       : []),
    //   ],
    // },
    {
      title: '工具',
      items: [
        {
          name: '表结构查看器',
          key: 'schemas',
          url: `/project/${ref}/database/schemas`,
          items: [],
        },
        {
          name: '查询优化',
          key: 'query-performance',
          url: `/project/${ref}/database/query-performance`,
          items: [],
        },
        {
          name: '安全助手',
          key: 'security-advisor',
          url: `/project/${ref}/advisors/security`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
        {
          name: '性能助手',
          key: 'performance-advisor',
          url: `/project/${ref}/advisors/performance`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
      ],
    },
  ]
}
