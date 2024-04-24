import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { IS_PLATFORM } from 'lib/constants'

export const generateAuthMenu = (
  ref: string,
  options: { columnLevelPrivileges?: boolean } = {}
): ProductMenuGroup[] => {
  return [
    {
      title: '管理',
      items: [{ name: '用户', key: 'users', url: `/project/${ref}/auth/users`, items: [] }],
    },
    {
      title: '配置',
      items: [
        {
          name: '策略',
          key: 'policies',
          url: `/project/${ref}/auth/policies`,
          items: [],
        },
        ...(options?.columnLevelPrivileges
          ? [
              {
                name: '列权限',
                key: 'column-privileges',
                url: `/project/${ref}/auth/column-privileges`,
                items: [],
                label: 'ALPHA',
              },
            ]
          : []),
        ...(IS_PLATFORM
          ? [
              {
                name: 'Providers',
                key: 'providers',
                url: `/project/${ref}/auth/providers`,
                items: [],
              },
              {
                name: 'Rate Limits',
                key: 'rate-limits',
                url: `/project/${ref}/auth/rate-limits`,
                items: [],
              },
              {
                name: 'Email Templates',
                key: 'templates',
                url: `/project/${ref}/auth/templates`,
                items: [],
              },
              {
                name: 'URL Configuration',
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
