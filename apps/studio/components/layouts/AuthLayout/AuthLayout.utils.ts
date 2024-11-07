import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { IS_PLATFORM } from 'lib/constants'

export const generateAuthMenu = (ref: string): ProductMenuGroup[] => {
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
              {
                name: '认证方式',
                key: 'providers',
                url: `/project/${ref}/auth/providers`,
                items: [],
              },
              {
                name: '限流',
                key: 'rate-limits',
                url: `/project/${ref}/auth/rate-limits`,
                items: [],
              },
              {
                name: '电子邮件模板',
                key: 'templates',
                url: `/project/${ref}/auth/templates`,
                items: [],
              },
              {
                name: 'URL 配置',
                key: 'url-configuration',
                url: `/project/${ref}/auth/url-configuration`,
                items: [],
              },
              {
                name: 'Hooks',
                key: 'hooks',
                url: `/project/${ref}/auth/hooks`,
                items: [],
                label: 'BETA',
              },
            ]
          : []),
      ],
    },
  ]
}
