import { Lock } from 'lucide-react'

import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { IRouteCommand } from 'ui-patterns/CommandMenu/internal/types'

export function useAuthGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  const {
    authenticationSignInProviders,
    authenticationThirdPartyAuth,
    authenticationRateLimits,
    authenticationEmails,
    authenticationMultiFactor,
    authenticationAttackProtection,
    authenticationAdvanced,
  } = useIsFeatureEnabled([
    'authentication:sign_in_providers',
    'authentication:third_party_auth',
    'authentication:rate_limits',
    'authentication:emails',
    'authentication:multi_factor',
    'authentication:attack_protection',
    'authentication:advanced',
  ])

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
      ...(authenticationSignInProviders
        ? [
            {
              id: 'nav-auth-providers',
              name: '认证方式',
              value: '认证授权：认证方式（社交账号，SSO）',
              route: `/project/${ref}/auth/providers`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      ...(authenticationThirdPartyAuth
        ? [
            {
              id: 'nav-auth-providers',
              name: '第三方认证',
              value: '认证授权：第三方认证服务提供方',
              route: `/project/${ref}/auth/third-party`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-auth-sessions',
        name: '会话',
        value: '认证授权：会话（用户会话）',
        route: `/project/${ref}/auth/sessions`,
        defaultHidden: true,
      },
      ...(authenticationRateLimits
        ? [
            {
              id: 'nav-auth-rate-limits',
              name: '限流',
              value: '认证授权：限流',
              route: `/project/${ref}/auth/rate-limits`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      ...(authenticationEmails
        ? [
            {
              id: 'nav-auth-templates',
              name: '邮件模板',
              value: '认证授权：邮件模板',
              route: `/project/${ref}/auth/templates`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      ...(authenticationMultiFactor
        ? [
            {
              id: 'nav-auth-mfa',
              name: '多因素认证',
              value: '认证授权：多因素认证（MFA）',
              route: `/project/${ref}/auth/mfa`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-auth-url-configuration',
        name: 'URL 配置',
        value: '认证授权：URL配置（站点 URL，重定向 URL）',
        route: `/project/${ref}/auth/url-configuration`,
        defaultHidden: true,
      },
      ...(authenticationAttackProtection
        ? [
            {
              id: 'nav-auth-attack-protection',
              name: '攻击防护',
              value: '认证授权：攻击防护',
              route: `/project/${ref}/auth/protection`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-auth-auth-hooks',
        name: '认证钩子',
        value: '认证授权：认证钩子',
        route: `/project/${ref}/auth/hooks`,
        defaultHidden: true,
      },
      ...(authenticationAdvanced
        ? [
            {
              id: 'nav-auth-advanced-settings',
              name: '认证高级设置',
              value: '认证授权：高级设置',
              route: `/project/${ref}/auth/advanced`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
    ],
    { ...options, deps: [ref] }
  )
}
