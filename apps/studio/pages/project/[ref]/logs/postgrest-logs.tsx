import { useRouter } from 'next/router'

import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'
import { LogsTableEmptyState } from 'components/interfaces/Settings/Logs/LogsTableEmptyState'
import DefaultLayout from 'components/layouts/DefaultLayout'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  return (
    <LogsPreviewer
      condensedLayout
      queryType="postgrest"
      projectRef={ref as string}
      tableName={LogsTableName.POSTGREST}
      EmptyState={
        <LogsTableEmptyState
          title="未找到结果"
          description="默认只捕获接口引擎的错误日志，HTTP 请求日志请到 API 网关中查看。"
        />
      }
    />
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="接口引擎日志">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
