import { Monitor, MonitorDot, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { themes } from 'ui/src/components/ThemeProvider/themes'

import {
  PageType,
  useRegisterCommands,
  useRegisterPage,
  useSetCommandMenuOpen,
  useSetPage,
  type CommandOptions,
} from '..'

const THEME_SWITCHER_PAGE_NAME = 'Switch theme'

const useThemeSwitcherCommands = ({ options }: { options?: CommandOptions } = {}) => {
  const setIsOpen = useSetCommandMenuOpen()
  const setPage = useSetPage()

  const { setTheme } = useTheme()

  useRegisterPage(THEME_SWITCHER_PAGE_NAME, {
    type: PageType.Commands,
    sections: [
      {
        id: 'switch-theme',
        name: '切换主题',
        commands: themes
          .filter(({ name }) => name === 'System' || name === 'Light' || name === 'Dark')
          .map((theme) => ({
            id: `switch-theme-${theme.value}`,
            name: theme.name,
            action: () => {
              setTheme(theme.value)
              setIsOpen(false)
            },
            icon: () =>
              theme.name === '系统' ? <Monitor /> : theme.name === '明亮' ? <Sun /> : <Moon />,
          })),
      },
    ],
  })

  useRegisterCommands(
    'Theme',
    [
      {
        id: 'switch-theme',
        name: '切换主题',
        action: () => setPage(THEME_SWITCHER_PAGE_NAME),
        defaultHidden: true,
        icon: () => <MonitorDot />,
      },
    ],
    options
  )
}

export { useThemeSwitcherCommands }
