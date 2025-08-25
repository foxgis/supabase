import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'

export const generateRealtimeMenu = (
  project: Project,
  flags?: { enableRealtimeSettings: boolean }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const { enableRealtimeSettings } = flags || {}
  const showRealtimeSettings = IS_PLATFORM && enableRealtimeSettings

  return [
    {
      title: '工具',
      items: [
        {
          name: '监听器',
          key: 'inspector',
          url: `/project/${ref}/realtime/inspector`,
          items: [],
        },
      ],
    },
    {
      title: '配置',
      items: [
        {
          name: '策略',
          key: 'policies',
          url: `/project/${ref}/realtime/policies`,
          items: [],
        },
        ...(showRealtimeSettings
          ? [
              {
                name: 'Settings',
                key: 'settings',
                url: `/project/${ref}/realtime/settings`,
                items: [],
              },
            ]
          : []),
      ],
    },
  ]
}
