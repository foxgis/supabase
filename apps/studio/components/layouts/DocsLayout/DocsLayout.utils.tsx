import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { BASE_PATH } from 'lib/constants'
import { ArrowUpRight, Book, BookOpen } from 'lucide-react'
import SVG from 'react-inlinesvg'

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
        { name: '概述', key: 'introduction', url: `/project/${ref}/api`, items: [] },
        {
          name: '认证授权',
          key: 'auth',
          url: `/project/${ref}/api?page=auth`,
          items: [],
        },
        ...(flags?.authEnabled
          ? [
              {
                name: '用户管理',
                key: 'users-management',
                url: `/project/${ref}/api?page=users-management`,
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
          name: '概述',
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
          name: '概述',
          key: 'rpc-intro',
          url: `/project/${ref}/api?page=rpc-intro`,
          items: [],
        },
        ...functions.map((fn) => {
          return { name: fn, key: fn, url: `/project/${ref}/api?rpc=${fn}`, items: [] }
        }),
      ],
    },
    // {
    //   title: '更多资料',
    //   items: [
    //     {
    //       name: 'GraphiQL',
    //       key: 'graphiql',
    //       url: `/project/${ref}/integrations/graphiql`,
    //       icon: (
    //         <SVG
    //           src={`${BASE_PATH}/img/graphql.svg`}
    //           style={{ width: `${16}px`, height: `${16}px` }}
    //           className="text-foreground"
    //           preProcessor={(code) => code.replace(/svg/, 'svg class="m-auto text-color-inherit"')}
    //         />
    //       ),
    //       items: [],
    //       rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
    //     },
    //   ],
    // },
    // {
    //   title: '更多资料',
    //   items: [
    //     {
    //       name: 'Guides',
    //       key: 'guides',
    //       url: `https://supabase.com/docs`,
    //       icon: <Book size={14} strokeWidth={2} />,
    //       items: [],
    //       isExternal: true,
    //     },
    //     {
    //       name: 'API 参考',
    //       key: 'api-reference',
    //       url: `https://supabase.com/docs/guides/api`,
    //       icon: <BookOpen size={14} strokeWidth={2} />,
    //       items: [],
    //       isExternal: true,
    //     },
    //   ],
    // },
  ]
}
