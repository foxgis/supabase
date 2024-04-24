import SVG from 'react-inlinesvg'
import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { IconBook, IconBookOpen } from 'ui'
import { BASE_PATH } from 'lib/constants'

export const generateDocsMenu = (
  ref: string,
  tables: string[],
  functions: string[],
  flags?: { authEnabled: boolean }
): ProductMenuGroup[] => {
  return [
    {
      title: '快速上手',
      items: [
        { name: '简介', key: 'introduction', url: `/project/${ref}/api`, items: [] },
        {
          name: '授权认证',
          key: 'auth',
          url: `/project/${ref}/api?page=auth`,
          items: [],
        },
        ...(flags?.authEnabled
          ? [
              {
                name: '用户管理',
                key: 'users',
                url: `/project/${ref}/api?page=users`,
                items: [],
              },
            ]
          : []),
      ],
    },
    {
      title: '数据表和视图',
      items: [
        {
          name: '简介',
          key: 'tables-intro',
          url: `/project/${ref}/api?page=tables-intro`,
          items: [],
        },
        ...tables.sort().map((table) => {
          return {
            name: table,
            key: table,
            url: `/project/${ref}/api?resource=${table}`,
            items: [],
          }
        }),
      ],
    },
    {
      title: '存储过程',
      items: [
        {
          name: '简介',
          key: 'rpc-intro',
          url: `/project/${ref}/api?page=rpc-intro`,
          items: [],
        },
        ...functions.map((fn) => {
          return { name: fn, key: fn, url: `/project/${ref}/api?rpc=${fn}`, items: [] }
        }),
      ],
    },
    {
      title: 'GraphQL',
      items: [
        {
          name: 'GraphiQL',
          key: 'graphiql',
          url: `/project/${ref}/api/graphiql`,
          icon: (
            <SVG
              src={`${BASE_PATH}/img/graphql.svg`}
              style={{ width: `${16}px`, height: `${16}px` }}
              className="text-foreground"
              preProcessor={(code) => code.replace(/svg/, 'svg class="m-auto text-color-inherit"')}
            />
          ),
          items: [],
        },
      ],
    },
    {
      title: '更多资料',
      items: [
        {
          name: '指南',
          key: 'guides',
          url: `https://supabase.com/docs`,
          icon: <IconBook size={14} strokeWidth={2} />,
          items: [],
          isExternal: true,
        },
        {
          name: 'API参考',
          key: 'api-reference',
          url: `https://supabase.com/docs/guides/api`,
          icon: <IconBookOpen size={14} strokeWidth={2} />,
          items: [],
          isExternal: true,
        },
      ],
    },
  ]
}
