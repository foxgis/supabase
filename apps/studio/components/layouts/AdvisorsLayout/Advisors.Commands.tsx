import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useAdvisorsGoToCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-advisors-security',
        name: '安全助手',
        route: `/project/${ref}/advisors/security`,
        defaultHidden: true,
      },
      {
        id: 'nav-advisors-performance',
        name: '性能助手',
        route: `/project/${ref}/advisors/performance`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}
