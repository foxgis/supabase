import { Lock } from 'lucide-react'

import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { useParams } from 'common'

export function useAuthGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    'Actions',
    [
      {
        id: 'create-rls-policy',
        name: '创建 RLS 策略',
        value: '创建 RLS（行级安全性）策略',
        route: `/project/${ref}/auth/policies`,
        icon: () => <Lock />,
      },
    ],
    {
      ...options,
      deps: [ref],
      enabled: (options?.enabled ?? true) && ref !== '_',
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-auth-users',
        name: '用户',
        value: '认证授权：用户管理',
        route: `/project/${ref}/auth/users`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-policies',
        name: '策略',
        value: '认证授权：策略（RLS）管理',
        route: `/project/${ref}/auth/policies`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-providers',
        name: '第三方认证',
        value: '认证授权：第三方认证（社交账号登录，SSO）',
        route: `/project/${ref}/auth/providers`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-templates',
        name: '电子邮件模板',
        value: '认证授权：电子邮件模板',
        route: `/project/${ref}/auth/templates`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-url-configuration',
        name: 'URL 配置',
        value: '认证授权：URL配置（站点 URL，重定向 URL）',
        route: `/project/${ref}/auth/url-configuration`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}
