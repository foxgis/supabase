import { PermissionAction } from '@supabase/shared-types/out/constants'

import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const LogsPage: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const canReadAuthLogs = useCheckPermissions(PermissionAction.ANALYTICS_READ, 'logflare')

  return !canReadAuthLogs ? (
    <NoPermission isFullPage resourceText="访问认证日志" />
  ) : !!project ? (
    <LogsPreviewer condensedLayout projectRef={project!.ref} queryType="auth" />
  ) : null
}

LogsPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="认证日志">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogsPage
