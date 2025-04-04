import { useRouter } from 'next/router'

import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  return (
    <LogsPreviewer
      condensedLayout
      queryType="api"
      projectRef={ref as string}
      tableName={LogsTableName.EDGE}
    />
  )
}

LogPage.getLayout = (page) => <LogsLayout title="API 网关日志">{page}</LogsLayout>

export default LogPage
