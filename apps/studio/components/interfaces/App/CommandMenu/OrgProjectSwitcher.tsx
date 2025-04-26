import { Forward, Wrench, Building } from 'lucide-react'
import { useMemo } from 'react'

import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { PageType, useRegisterCommands, useRegisterPage, useSetPage } from 'ui-patterns/CommandMenu'
import { IS_PLATFORM } from 'common'
import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'

const PROJECT_SWITCHER_PAGE_NAME = 'Switch project'
const ORGANIZATION_SWITCHER_PAGE_NAME = 'Configure organization'

export function useProjectSwitchCommand() {
  const setPage = useSetPage()

  const { data: _projects } = useProjectsQuery({ enabled: IS_PLATFORM })
  const projects = useMemo(
    () => (_projects ?? []).map(({ name, ref }) => ({ name, ref })),
    [_projects]
  )

  useRegisterPage(
    PROJECT_SWITCHER_PAGE_NAME,
    {
      type: PageType.Commands,
      sections: [
        {
          id: 'switch-project',
          name: '切换项目',
          commands: projects.map(({ name, ref }) => ({
            id: `project-${ref}`,
            name,
            value: `${name} (${ref})`,
            route: `/project/${ref}`,
            icon: () => <Forward />,
          })),
        },
      ],
    },
    { deps: [projects], enabled: !!projects && projects.length > 0 }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'switch-project',
        name: '切换项目',
        value: '切换项目，变更项目，选择项目',
        action: () => setPage(PROJECT_SWITCHER_PAGE_NAME),
        icon: () => <Wrench />,
      },
    ],
    { enabled: !!projects && projects.length > 0 }
  )
}

export function useConfigureOrganizationCommand() {
  const setPage = useSetPage()

  const { data: organizations } = useOrganizationsQuery({ enabled: IS_PLATFORM })

  useRegisterPage(
    ORGANIZATION_SWITCHER_PAGE_NAME,
    {
      type: PageType.Commands,
      sections: [
        {
          id: 'configure-organization',
          name: '配置组织',
          commands:
            organizations?.map(({ name, slug }) => ({
              id: `organization-${slug}`,
              name,
              value: `${name} (${slug})`,
              route: `/org/${slug}/general`,
              icon: () => <Building />,
            })) ?? [],
        },
      ],
    },
    { deps: [organizations], enabled: !!organizations && organizations.length > 0 }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'configure-organization',
        name: '配置组织',
        value: '配置组织，变更组织，选择组织',
        action: () => setPage(ORGANIZATION_SWITCHER_PAGE_NAME),
        icon: () => <Building />,
      },
    ],
    { enabled: !!organizations && organizations.length > 0 }
  )
}
