import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'

export const generateRealtimeMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  return [
    {
      title: '实时消息',
      items: [
        {
          name: '调试器',
          key: 'inspector',
          url: `/project/${ref}/realtime/inspector`,
          items: [],
        },
      ],
    },
  ]
}
