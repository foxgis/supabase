import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'

export const generateAdvisorsMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  return [
    {
      title: '优化助手',
      items: [
        {
          name: '安全',
          key: 'security',
          url: `/project/${ref}/advisors/security`,
          items: [],
        },
        {
          name: '性能',
          key: 'performance',
          url: `/project/${ref}/advisors/performance`,
          items: [],
        },
      ],
    },
  ]
}
