import { useParams } from 'common'
import { Save } from 'lucide-react'
import Link from 'next/link'

import LogsSavedQueriesItem from 'components/interfaces/Settings/Logs/Logs.SavedQueriesItem'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import Table from 'components/to-be-cleaned/Table'
import LogsExplorerHeader from 'components/ui/Logs/LogsExplorerHeader'
import { useContentQuery } from 'data/content/content-query'
import type { NextPageWithLayout } from 'types'
import { Loading } from 'ui'

export const LogsSavedPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { data, isLoading } = useContentQuery({
    projectRef: ref,
    type: 'log_sql',
  })

  if (isLoading) {
    return <Loading active={true}>{null}</Loading>
  }

  const saved = [...(data?.content ?? [])]
    .filter((c) => c.type === 'log_sql')
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="mx-auto w-full px-5 py-6 h-full">
      <LogsExplorerHeader subtitle="保存的查询" />
      {saved.length > 0 && (
        <div className="flex flex-col gap-3 py-6">
          <Table
            headTrClasses="expandable-tr"
            head={
              <>
                <Table.th>名称</Table.th>
                <Table.th>描述</Table.th>
                <Table.th>创建时间</Table.th>
                <Table.th>更新时间</Table.th>
                <Table.th></Table.th>
              </>
            }
            body={saved.map((item) => (
              <LogsSavedQueriesItem key={item.id} item={item} />
            ))}
          />
        </div>
      )}
      {saved.length === 0 && (
        <div className="my-auto flex h-full flex-grow flex-col items-center justify-center gap-1">
          <Save className="animate-bounce" />
          <h3 className="text-lg text-foreground">暂无保存的查询</h3>
          <p className="text-sm text-foreground-lighter">
            保存的查询会在这里显示。您可以从{' '}
            <Link href={`/project/${ref}/logs/explorer`}>
              <span className="cursor-pointer font-bold underline">查询</span>
            </Link>{' '}
            标签下保存查询。
          </p>
        </div>
      )}
    </div>
  )
}

LogsSavedPage.getLayout = (page) => <LogsLayout>{page}</LogsLayout>

export default LogsSavedPage
