import { LifeBuoy } from 'lucide-react'
import { useMemo } from 'react'

import { IS_PLATFORM } from 'common'
import type { ICommand } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'

const useSupportCommands = () => {
  const commands = useMemo(
    () =>
      [
        {
          id: 'support',
          name: '支持',
          route: 'https://www.supabase.com/support',
          icon: () => <LifeBuoy />,
        },
        {
          id: 'system-status',
          name: '系统状态',
          value: 'Support: System Status',
          route: 'https://status.supabase.com',
          icon: () => <LifeBuoy />,
        },
        {
          id: 'github-discussions',
          name: 'GitHub 讨论',
          value: 'Support: GitHub Discussions',
          route: 'https://github.com/orgs/supabase/discussions',
          icon: () => <LifeBuoy />,
          defaultHidden: true,
        },
      ] as Array<ICommand>,
    []
  )

  useRegisterCommands(COMMAND_MENU_SECTIONS.SUPPORT, commands, { enabled: IS_PLATFORM })
}

export { useSupportCommands }
