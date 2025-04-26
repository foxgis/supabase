import { Inbox } from 'lucide-react'

import { useRegisterCommands } from '..'
import { BASE_PATH } from './shared/constants'

const useChangelogCommand = ({ enabled = true }: { enabled?: boolean } = {}) => {
  useRegisterCommands(
    'Updates',
    [
      {
        id: 'changelog',
        name: '更新日志',
        route: BASE_PATH ? 'https://supabase.com/changelog' : '/changelog',
        icon: () => <Inbox />,
      },
    ],
    { enabled }
  )
}

export { useChangelogCommand }
