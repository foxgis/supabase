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
                name: '登录 / 第三方登录',
                key: 'sign-in-up',
                pages: ['providers', 'third-party'],
                url: `/project/${ref}/auth/providers`,
                items: [],
              },
              {
                name: '会话',
                key: 'sessions',
                url: `/project/${ref}/auth/sessions`,
                items: [],
              },
              {
                name: '限流',
                key: 'rate-limits',
                url: `/project/${ref}/auth/rate-limits`,
                items: [],
              },
              {
                name: '电子邮件',
                key: 'emails',
                pages: ['templates', 'smtp'],
                url: `/project/${ref}/auth/templates`,
                items: [],
              },
              {
                name: '多因素认证',
                key: 'mfa',
                url: `/project/${ref}/auth/mfa`,
                items: [],
              },
              {
                name: 'URL 配置',
                key: 'url-configuration',
                url: `/project/${ref}/auth/url-configuration`,
                items: [],
              },
              {
                name: '防攻击',
                key: 'protection',
                url: `/project/${ref}/auth/protection`,
                items: [],
              },
              {
                name: '认证钩子s',
                key: 'hooks',
                url: `/project/${ref}/auth/hooks`,
                items: [],
                label: 'BETA',
              },
              {
                name: '高级设置',
                key: 'advanced',
                url: `/project/${ref}/auth/advanced`,
                items: [],
              },
            ]
          : []),
      ],
    },
  ]
}
