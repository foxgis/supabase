import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { IS_PLATFORM } from 'lib/constants'

export const generateAuthMenu = (
  ref: string,
  flags?: {
    authenticationSignInProviders: boolean
    authenticationRateLimits: boolean
    authenticationEmails: boolean
    authenticationMultiFactor: boolean
    authenticationAttackProtection: boolean
    authenticationAdvanced: boolean
  }
): ProductMenuGroup[] => {
  const {
    authenticationSignInProviders,
    authenticationRateLimits,
    authenticationEmails,
    authenticationMultiFactor,
    authenticationAttackProtection,
    authenticationAdvanced,
  } = flags ?? {}

  return [
    {
      title: '管理',
      items: [{ name: '用户', key: 'users', url: `/project/${ref}/auth/users`, items: [] }],
    },
    {
      title: '配置',
      items: [
        {
          name: '认证策略',
          key: 'policies',
          url: `/project/${ref}/auth/policies`,
          items: [],
        },
        ...(IS_PLATFORM
          ? [
              ...(authenticationSignInProviders
                ? [
                    {
                      name: '登录 / 第三方登录',
                      key: 'sign-in-up',
                      pages: ['providers', 'third-party'],
                      url: `/project/${ref}/auth/providers`,
                      items: [],
                    },
                  ]
                : []),
              {
                name: '会话',
                key: 'sessions',
                url: `/project/${ref}/auth/sessions`,
                items: [],
              },
              ...(authenticationRateLimits
                ? [
                    {
                      name: '限流',
                      key: 'rate-limits',
                      url: `/project/${ref}/auth/rate-limits`,
                      items: [],
                    },
                  ]
                : []),
              ...(authenticationEmails
                ? [
                    {
                      name: '邮箱',
                      key: 'emails',
                      pages: ['templates', 'smtp'],
                      url: `/project/${ref}/auth/templates`,
                      items: [],
                    },
                  ]
                : []),
              ...(authenticationMultiFactor
                ? [
                    {
                      name: '多因素认证',
                      key: 'mfa',
                      url: `/project/${ref}/auth/mfa`,
                      items: [],
                    },
                  ]
                : []),
              {
                name: 'URL 配置',
                key: 'url-configuration',
                url: `/project/${ref}/auth/url-configuration`,
                items: [],
              },
              ...(authenticationAttackProtection
                ? [
                    {
                      name: '攻击防护',
                      key: 'protection',
                      url: `/project/${ref}/auth/protection`,
                      items: [],
                    },
                  ]
                : []),
              {
                name: '认证钩子',
                key: 'hooks',
                url: `/project/${ref}/auth/hooks`,
                items: [],
                label: 'BETA',
              },
              ...(authenticationAdvanced
                ? [
                    {
                      name: '高级设置',
                      key: 'advanced',
                      url: `/project/${ref}/auth/advanced`,
                      items: [],
                    },
                  ]
                : []),
            ]
          : []),
      ],
    },
  ]
}
