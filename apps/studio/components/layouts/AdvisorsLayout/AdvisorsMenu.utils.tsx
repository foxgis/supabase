import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'

export const generateAdvisorsMenu = (
  project?: Project,
  features?: { advisorRules: boolean }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  return [
    {
      title: '优化助手',
      items: [
        {
          name: '安全助手',
          key: 'security',
          url: `/project/${ref}/advisors/security`,
          items: [],
        },
        {
          name: '性能助手',
          key: 'performance',
          url: `/project/${ref}/advisors/performance`,
          items: [],
        },
        {
          name: '查询优化',
          key: 'query-performance',
          url: `/project/${ref}/advisors/query-performance`,
          items: [],
        },
      ],
    },
    ...(IS_PLATFORM && features?.advisorRules
      ? [
          {
            title: 'Configuration',
            items: [
              {
                name: 'Advisor Rules',
                key: 'rules',
                url: `/project/${ref}/advisors/rules/security`,
                items: [],
              },
            ],
          },
        ]
      : []),
  ]
}
