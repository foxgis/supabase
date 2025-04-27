import { useEffect, useRef } from 'react'

import { useParams } from 'common'
import { ClientLibrary, ExampleProject } from 'components/interfaces/Home'
import { CLIENT_LIBRARIES, EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'
import ProjectUsageSection from 'components/interfaces/Home/ProjectUsageSection'
import { SecurityStatus } from 'components/interfaces/Home/SecurityStatus'
import ServiceStatus from 'components/interfaces/Home/ServiceStatus'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectPausedState } from 'components/layouts/ProjectLayout/PausedState/ProjectPausedState'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import { ComputeBadgeWrapper } from 'components/ui/ComputeBadgeWrapper'
import { InlineLink } from 'components/ui/InlineLink'
import { ProjectUpgradeFailedBanner } from 'components/ui/ProjectUpgradeFailedBanner'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useIsOrioleDb, useSelectedProject } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM, PROJECT_STATUS, BASE_PATH } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import type { NextPageWithLayout } from 'types'
import {
  Badge,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

const Home: NextPageWithLayout = () => {
  const organization = useSelectedOrganization()
  const project = useSelectedProject()
  const isOrioleDb = useIsOrioleDb()
  const snap = useAppStateSnapshot()
  const { enableBranching } = useParams()

  const hasShownEnableBranchingModalRef = useRef(false)
  useEffect(() => {
    if (enableBranching && !hasShownEnableBranchingModalRef.current) {
      hasShownEnableBranchingModalRef.current = true
      snap.setShowEnableBranchingModal(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableBranching])

  const projectName =
    project?.ref !== 'default' && project?.name !== undefined ? project?.name : '欢迎访问数据中间件'

  return (
    <div className="w-full mx-auto my-12 md:my-16 space-y-12 md:space-y-16 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mx-6 gap-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <h1 className="text-3xl">{projectName}</h1>
          {isOrioleDb && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="warning">OrioleDB</Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-80 text-center">
                This project is using Postgres with OrioleDB which is currently in preview and not
                suitable for production workloads. View our{' '}
                <InlineLink href="https://supabase.com/docs/guides/database/orioledb">
                  documentation
                </InlineLink>{' '}
                for all limitations.
              </TooltipContent>
            </Tooltip>
          )}
          <ComputeBadgeWrapper
            project={{
              ref: project?.ref,
              organization_slug: organization?.slug,
              cloud_provider: project?.cloud_provider,
              infra_compute_size: project?.infra_compute_size,
            }}
          />
        </div>
        <div className="flex items-center gap-x-3">
          {project?.status === PROJECT_STATUS.ACTIVE_HEALTHY && <SecurityStatus />}
          {IS_PLATFORM && project?.status === PROJECT_STATUS.ACTIVE_HEALTHY && <ServiceStatus />}
        </div>
      </div>

      <div className="space-y-4">
        <p className="mx-6 text-sm">
          数据中间件是一款高效便捷的后端即服务（BaaS）平台，旨在为开发者提供一整套后端数据服务，使开发者能够专注于业务逻辑和用户体验，而不必花费大量时间和精力在后端基础设施的搭建和维护上，简化和加速应用程序开发流程。
          数据中间件是在开源的 Supabase 基础上打造，通过集成 FoxGIS 先进的 GIS
          能力、国产数据库适配、安全加固和本地化部署等一系列深度改造，使之成为更贴合中国开发者需求的一站式数据开发服务平台。
        </p>
        <div className="flex justify-center">
          <figure className="text-center">
            <img
              className="h-96"
              src={`${BASE_PATH}/img/architecture.png`}
              alt="架构图"
            />
            <figcaption className="text-sm">数据中间件架构图</figcaption>
          </figure>
        </div>
      </div>

      <div className="mx-6">
        <ProjectUpgradeFailedBanner />
      </div>
      {project?.status === PROJECT_STATUS.INACTIVE && <ProjectPausedState />}
      <div className="mx-6">
        {IS_PLATFORM && project?.status !== PROJECT_STATUS.INACTIVE && <ProjectUsageSection />}
      </div>

      {project?.status !== PROJECT_STATUS.INACTIVE && (
        <>
          <div className="space-y-8">
            <div className="mx-6">
              <h4 className="text-lg">客户端SDK</h4>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:gap-12 mx-6 mb-12 md:grid-cols-3">
              {CLIENT_LIBRARIES.map((library) => (
                <ClientLibrary key={library.language} {...library} />
              ))}
            </div>
          </div>
          <div className="space-y-8">
            <div className="mx-6">
              <h4 className="text-lg">示例代码</h4>
            </div>
            <div className="flex justify-center mx-6">
              <Tabs_Shadcn_ defaultValue="app">
                <TabsList_Shadcn_ className="flex gap-4">
                  <TabsTrigger_Shadcn_ value="app">应用程序框架</TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_ value="mobile">移动应用框架</TabsTrigger_Shadcn_>
                </TabsList_Shadcn_>
                <TabsContent_Shadcn_ value="app">
                  <div className="grid gap-2 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {EXAMPLE_PROJECTS.filter((project) => project.type === 'app')
                      .sort((a, b) => a.title.localeCompare(b.title))
                      .map((project) => (
                        <ExampleProject key={project.url} {...project} />
                      ))}
                  </div>
                </TabsContent_Shadcn_>
                <TabsContent_Shadcn_ value="mobile">
                  <div className="grid gap-2 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {EXAMPLE_PROJECTS.filter((project) => project.type === 'mobile')
                      .sort((a, b) => a.title.localeCompare(b.title))
                      .map((project) => (
                        <ExampleProject key={project.url} {...project} />
                      ))}
                  </div>
                </TabsContent_Shadcn_>
              </Tabs_Shadcn_>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

Home.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default Home
