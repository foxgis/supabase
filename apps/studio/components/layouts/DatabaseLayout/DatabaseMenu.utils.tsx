import { ArrowUpRight } from 'lucide-react'

import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'

export const generateDatabaseMenu = (
  project?: Project,
  flags?: {
    pgNetExtensionExists: boolean
    pitrEnabled: boolean
    columnLevelPrivileges: boolean
    enablePgReplicate: boolean
    showPgReplicate: boolean
    showRoles: boolean
  }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const {
    pgNetExtensionExists,
    pitrEnabled,
    columnLevelPrivileges,
    enablePgReplicate,
    showPgReplicate,
    showRoles,
  } = flags || {}

  return [
    {
      title: '数据库管理',
      items: [
        {
          name: '表关系',
          key: 'schemas',
          url: `/project/${ref}/database/schemas`,
          items: [],
        },
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
          name: '发布订阅',
          key: 'publications',
          url: `/project/${ref}/database/publications`,
          items: [],
        },
        // ...(showPgReplicate
        //   ? [
        //       {
        //         name: 'Replication',
        //         key: 'replication',
        //         url: `/project/${ref}/database/replication`,
        //         label: !enablePgReplicate ? 'Coming soon' : undefined,
        //         items: [],
        //       },
        //     ]
        //   : []),
      ],
    },
    {
      title: '配置',
      items: [
        ...(showRoles
          ? [{ name: '角色', key: 'roles', url: `/project/${ref}/database/roles`, items: [] }]
          : []),
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
        { name: 'Settings', key: 'settings', url: `/project/${ref}/database/settings`, items: [] },
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
    //       name: 'Migrations',
    //       key: 'migrations',
    //       url: `/project/${ref}/database/migrations`,
    //       items: [],
    //     },
    //     {
    //       name: 'Wrappers',
    //       key: 'wrappers',
    //       url: `/project/${ref}/integrations?category=wrapper`,
    //       rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
    //       items: [],
    //     },
    //     ...(!!pgNetExtensionExists
    //       ? [
    //           {
    //             name: 'Webhooks',
    //             key: 'hooks',
    //             url: `/project/${ref}/integrations/webhooks/overview`,
    //             rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
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
        {
          name: '查询优化',
          key: 'query-performance',
          url: `/project/${ref}/advisors/query-performance`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
      ],
    },
  ]
}
