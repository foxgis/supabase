import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'

export const generateGISMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  return [
    {
      title: 'GIS 服务',
      items: [
        {
          name: '地图服务',
          key: 'maps',
          url: `/project/${ref}/gis/maps`,
          items: [],
        },
        {
          name: '瓦片服务',
          key: 'tiles',
          url: `/project/${ref}/gis/tiles`,
          items: [],
        },
        {
          name: '要素服务',
          key: 'features',
          url: `/project/${ref}/gis/features`,
          items: [],
        },
      ],
    },
  ]
}
