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
    '操作',
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
        id: 'nav-auth-providers',
        name: 'Providers (Third Party)',
        value: 'Auth: Providers (Third Party)',
        route: `/project/${ref}/auth/third-party`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-sessions',
        name: 'Sessions',
        value: 'Auth: Sessions (User Sessions)',
        route: `/project/${ref}/auth/sessions`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-rate-limits',
        name: 'Rate Limits',
        value: 'Auth: Rate Limits',
        route: `/project/${ref}/auth/rate-limits`,
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
        id: 'nav-auth-mfa',
        name: 'Multi Factor Authentication (MFA)',
        value: 'Auth: Multi Factor Authenticaiton (MFA)',
        route: `/project/${ref}/auth/mfa`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-url-configuration',
        name: 'URL 配置',
        value: '认证授权：URL配置（站点 URL，重定向 URL）',
        route: `/project/${ref}/auth/url-configuration`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-attack-protection',
        name: 'Attack Protection',
        value: 'Auth: Attack Protection',
        route: `/project/${ref}/auth/protection`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-auth-hooks',
        name: 'Auth Hooks',
        value: 'Auth: Auth Hooks',
        route: `/project/${ref}/auth/hooks`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-advanced-settings',
        name: 'Auth Advanced Settings',
        value: 'Auth: Advanced Settings',
        route: `/project/${ref}/auth/advanced`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}
