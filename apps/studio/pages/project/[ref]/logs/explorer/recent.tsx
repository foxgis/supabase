import Link from 'next/link'

import { useParams } from 'common'
import RecentQueriesItem from 'components/interfaces/Settings/Logs/RecentQueriesItem'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import Table from 'components/to-be-cleaned/Table'
import LogsExplorerHeader from 'components/ui/Logs/LogsExplorerHeader'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import type { LogSqlSnippets, NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { Clock } from 'lucide-react'
import DefaultLayout from 'components/layouts/DefaultLayout'

export const LogsSavedPage: NextPageWithLayout = () => {
  const { ref } = useParams()

  const [recentLogSnippets, setRecentLogSnippets] = useLocalStorage<LogSqlSnippets.Content[]>(
    `project-content-${ref}-recent-log-sql`,
    []
  )
  const recent = recentLogSnippets.slice().reverse()

  return (
    <div className="mx-auto w-full px-5 py-6 h-full">
      <LogsExplorerHeader subtitle="最近的查询" />
      {recent.length > 0 && (
        <Table
          head={
            <>
              <Table.th>代码段</Table.th>
              <Table.th className="w-24">
                <Button size="tiny" type="default" onClick={() => setRecentLogSnippets([])}>
                  清除历史
                </Button>
              </Table.th>
            </>
          }
          body={recent.map((item: LogSqlSnippets.Content) => (
            <RecentQueriesItem key={item.sql} item={item} />
          ))}
        />
      )}
      {recent.length === 0 && (
        <>
          <div className="my-auto flex h-full flex-grow flex-col items-center justify-center gap-1">
            <Clock className="animate-bounce" />
            <h3 className="text-lg text-foreground">暂无查询历史</h3>
            <p className="text-sm text-foreground-lighter">
              在{' '}
              <Link href={`/project/${ref}/logs/explorer`}>
                <span className="cursor-pointer font-bold underline">查询</span>
              </Link>{' '}
              标签下最近执行的查询将会显示在这里。
            </p>
          </div>
        </>
      )}
    </div>
  )
}

LogsSavedPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout>{page}</LogsLayout>
  </DefaultLayout>
)

export default LogsSavedPage
