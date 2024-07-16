import { useEffect, useRef } from 'react'

import { useParams } from 'common'
import { ClientLibrary, ExampleProject } from 'components/interfaces/Home'
import Connect from 'components/interfaces/Home/Connect/Connect'
import { CLIENT_LIBRARIES, EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'
import ProjectUsageSection from 'components/interfaces/Home/ProjectUsageSection'
import ServiceStatus from 'components/interfaces/Home/ServiceStatus'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import ProjectPausedState from 'components/layouts/ProjectLayout/ProjectPausedState'
import ProjectUpgradeFailedBanner from 'components/ui/ProjectUpgradeFailedBanner'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM, PROJECT_STATUS, BASE_PATH } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import type { NextPageWithLayout } from 'types'

const Home: NextPageWithLayout = () => {
  const project = useSelectedProject()

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
    project?.ref !== 'default' && project?.name !== undefined ? project?.name : '欢迎使用数据中间件'

  return (
    <div className="w-full mx-auto my-16 space-y-8 max-w-7xl">
      <div className="flex items-center justify-between mx-6 space-x-6">
        <h1 className="text-3xl">{projectName}</h1>
        <div className="flex items-center gap-x-3">
          {IS_PLATFORM && project?.status === PROJECT_STATUS.ACTIVE_HEALTHY && <ServiceStatus />}
          {IS_PLATFORM && project?.status === PROJECT_STATUS.ACTIVE_HEALTHY && <Connect />}
        </div>
      </div>

      <div className="space-y-4">
        <div className="mx-6">
          <h4 className="text-lg">关于数据中间件</h4>
        </div>
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
            <div className="grid gap-12 mx-6 mb-12 md:grid-cols-3">
              {CLIENT_LIBRARIES.map((library) => (
                <ClientLibrary key={library.language} {...library} />
              ))}
            </div>
          </div>
          <div className="space-y-8">
            <div className="mx-6">
              <h4 className="text-lg">示例代码</h4>
            </div>
            <div className="grid gap-8 mx-6 md:grid-cols-2 lg:grid-cols-3">
              {EXAMPLE_PROJECTS.sort((a, b) => a.title.localeCompare(b.title)).map((project) => (
                <ExampleProject key={project.url} {...project} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

Home.getLayout = (page) => (
  <ProjectLayoutWithAuth>
    <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
      {page}
    </main>
  </ProjectLayoutWithAuth>
)

export default Home
