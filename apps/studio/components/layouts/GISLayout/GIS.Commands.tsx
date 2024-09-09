import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useGISGoToCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-gis-maps',
        name: '地图服务',
        route: `/project/${ref}/gis/maps`,
        defaultHidden: true,
      },
      {
        id: 'nav-gis-tiles',
        name: '瓦片服务',
        route: `/project/${ref}/gis/tiles`,
        defaultHidden: true,
      },
      {
        id: 'nav-gis-features',
        name: '要素服务',
        route: `/project/${ref}/gis/features`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}
