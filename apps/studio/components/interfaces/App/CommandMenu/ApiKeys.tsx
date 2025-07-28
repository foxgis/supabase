import { Key } from 'lucide-react'
import { useMemo } from 'react'

import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Badge, copyToClipboard } from 'ui'
import type { ICommand } from 'ui-patterns/CommandMenu'
import {
  PageType,
  useRegisterCommands,
  useRegisterPage,
  useSetCommandMenuOpen,
  useSetPage,
} from 'ui-patterns/CommandMenu'
import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'
import { orderCommandSectionsByPriority } from './ordering'

const API_KEYS_PAGE_NAME = 'API Keys'

export function useApiKeysCommands() {
  const setIsOpen = useSetCommandMenuOpen()
  const setPage = useSetPage()

  const { data: project } = useSelectedProjectQuery()
  const ref = project?.ref || '_'

  const { data: apiKeys } = useAPIKeysQuery({ projectRef: project?.ref, reveal: true })
  const { anonKey, serviceKey, publishableKey, allSecretKeys } = getKeys(apiKeys)

  const commands = useMemo(
    () =>
      [
        project &&
          anonKey && {
            id: 'anon-key',
            name: `复制匿名密钥`,
            action: () => {
              copyToClipboard(anonKey.api_key ?? '')
              setIsOpen(false)
            },
            badge: () => (
              <span className="flex items-center gap-x-1">
                <Badge>Project: {project?.name}</Badge>
                <Badge>Public</Badge>
                <Badge className="capitalize">{anonKey.type}</Badge>
              </span>
            ),
            icon: () => <Key />,
          },
        project &&
          serviceKey && {
            id: 'service-key',
            name: `复制服务端密钥`,
            action: () => {
              copyToClipboard(serviceKey.api_key ?? '')
              setIsOpen(false)
            },
            badge: () => (
              <span className="flex items-center gap-x-1">
                <Badge>Project: {project?.name}</Badge>
                <Badge variant="destructive">Secret</Badge>
                <Badge className="capitalize">{serviceKey.type}</Badge>
              </span>
            ),
            icon: () => <Key />,
          },
        project &&
          publishableKey && {
            id: 'publishable-key',
            name: `Copy publishable key`,
            action: () => {
              copyToClipboard(publishableKey.api_key ?? '')
              setIsOpen(false)
            },
            badge: () => (
              <span className="flex items-center gap-x-1">
                <Badge>Project: {project?.name}</Badge>
                <Badge className="capitalize">{publishableKey.type}</Badge>
              </span>
            ),
            icon: () => <Key />,
          },
        ...(project && allSecretKeys
          ? allSecretKeys.map((key) => ({
              id: key.id,
              name: `Copy secret key (${key.name})`,
              action: () => {
                copyToClipboard(key.api_key ?? '')
                setIsOpen(false)
              },
              badge: () => (
                <span className="flex items-center gap-x-1">
                  <Badge>Project: {project?.name}</Badge>
                  <Badge className="capitalize">{key.type}</Badge>
                </span>
              ),
              icon: () => <Key />,
            }))
          : []),
        !(anonKey || serviceKey) && {
          id: 'api-keys-project-settings',
          name: '在设置中查看 API 密钥',
          route: `/project/${ref}/settings/api`,
          icon: () => <Key />,
        },
      ].filter(Boolean) as ICommand[],
    [anonKey, serviceKey, project, setIsOpen]
  )

  useRegisterPage(
    API_KEYS_PAGE_NAME,
    {
      type: PageType.Commands,
      sections: [
        {
          id: 'api-keys',
          name: 'API 密钥',
          commands,
        },
      ],
    },
    { deps: [commands], enabled: !!project }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'api-keys',
        name: '获取 API 密钥',
        action: () => setPage(API_KEYS_PAGE_NAME),
        icon: () => <Key />,
      },
    ],
    {
      enabled: !!project,
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )
}
