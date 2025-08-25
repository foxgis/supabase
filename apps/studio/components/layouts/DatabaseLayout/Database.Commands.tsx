import { Blocks, Code, Database, History, Search } from 'lucide-react'

import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { IRouteCommand } from 'ui-patterns/CommandMenu/internal/types'

export function useDatabaseGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  const { databaseReplication, databaseRoles } = useIsFeatureEnabled([
    'database:replication',
    'database:roles',
  ])

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.QUERY,
    [
      {
        id: 'run-sql',
        name: '执行 SQL',
        route: `/project/${ref}/sql/new`,
        icon: () => <Code />,
      },
    ],
    {
      ...options,
      deps: [ref],
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 2 },
    }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-database-tables',
        name: '表',
        value: '数据库：表',
        route: `/project/${ref}/database/tables`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-triggers',
        name: '触发器',
        value: '数据库：触发器',
        route: `/project/${ref}/database/triggers`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-functions',
        name: '函数',
        value: '数据库：函数',
        route: `/project/${ref}/database/functions`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-extensions',
        name: '扩展',
        value: '数据库：扩展',
        route: `/project/${ref}/database/extensions`,
        defaultHidden: true,
      },
      ...(databaseRoles
        ? [
            {
              id: 'nav-database-roles',
              name: '角色',
              value: '数据库：角色',
              route: `/project/${ref}/database/roles`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      ...(databaseReplication
        ? [
            {
              id: 'nav-database-replication',
              name: '复制',
              value: '数据库：复制',
              route: `/project/${ref}/database/replication`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-database-hooks',
        name: 'Webhooks',
        value: '数据库：Webhooks',
        route: `/project/${ref}/integrations/hooks`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-backups',
        name: '备份',
        value: '数据：备份',
        route: `/project/${ref}/database/backups/scheduled`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-wrappers',
        name: '包装器',
        value: '数据库：包装器',
        route: `/project/${ref}/integrations/wrappers`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-migrations',
        name: '迁移',
        value: '数据库：迁移',
        route: `/project/${ref}/database/migrations`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.DATABASE,
    [
      {
        id: 'run-schema-visualizer',
        name: '查看模式',
        route: `/project/${ref}/database/schemas`,
        icon: () => <Search />,
      },
      {
        id: 'run-view-database-functions',
        name: '查看和创建函数',
        route: `/project/${ref}/database/functions`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-triggers',
        name: '查看和创建触发器',
        route: `/project/${ref}/database/triggers`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-enumerated-types',
        name: '查看和创建枚举类型',
        route: `/project/${ref}/database/types`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-extensions',
        name: '查看扩展',
        route: `/project/${ref}/database/extensions`,
        icon: () => <Blocks />,
      },
      {
        id: 'run-view-database-indexes',
        name: '查看和创建索引',
        route: `/project/${ref}/database/indexes`,
        icon: () => <Database />,
      },
      ...(databaseRoles
        ? [
            {
              id: 'run-view-database-roles',
              name: '查看角色',
              route: `/project/${ref}/database/roles`,
              icon: () => <Database />,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'run-view-database-backups',
        name: '查看备份',
        route: `/project/${ref}/database/backups/scheduled`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-migrations',
        name: '查看迁移',
        route: `/project/${ref}/database/migrations`,
        icon: () => <History />,
      },
    ],
    {
      ...options,
      deps: [ref],
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )
}
