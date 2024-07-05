import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'

export const generateRealtimeMenu = (
  project: Project,
  { authzEnabled }: { authzEnabled: boolean }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  return [
    {
      title: '工具',
      items: [
        {
          name: '调试器',
          key: 'inspector',
          url: `/project/${ref}/realtime/inspector`,
          items: [],
        },
      ],
    },
    ...(authzEnabled
      ? [
          {
            title: '配置',
            items: [
              {
                name: '策略',
                key: 'policies',
                url: `/project/${ref}/realtime/policies`,
                items: [],
              },
            ],
          },
        ]
      : []),
  ]
}
