import dayjs from 'dayjs'
import { RefreshCw, StopCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useQueryAbortMutation } from 'data/sql/abort-query-mutation'
import { useOngoingQueriesQuery } from 'data/sql/ongoing-queries-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useUrlState } from 'hooks/ui/useUrlState'
import { IS_PLATFORM } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { ResponseError } from 'types'
import {
  Button,
  CodeBlock,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

export const OngoingQueriesPanel = () => {
  const [_, setParams] = useUrlState({ replace: true })
  const { viewOngoingQueries } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const state = useDatabaseSelectorStateSnapshot()
  const appState = useAppStateSnapshot()
  const [selectedId, setSelectedId] = useState<number>()

  const { data: databases } = useReadReplicasQuery({ projectRef: project?.ref })
  const database = (databases ?? []).find((db) => db.identifier === state.selectedDatabaseId)

  const {
    data,
    error,
    isError,
    isLoading: isLoadingOngoingQueries,
    isFetching: isFetchingOngoingQueries,
    refetch,
  } = useOngoingQueriesQuery(
    {
      projectRef: project?.ref,
      connectionString: database?.connectionString,
    },
    {
      enabled: !IS_PLATFORM || (IS_PLATFORM && database?.connectionString !== undefined),
      staleTime: 5000,
    }
  )
  const queries = data ?? []

  useEffect(() => {
    if (viewOngoingQueries) {
      appState.setOnGoingQueriesPanelOpen(true)
      setParams({ viewOngoingQueries: undefined })
    }
  }, [viewOngoingQueries])

  const { mutate: abortQuery, isLoading } = useQueryAbortMutation({
    onSuccess: () => {
      toast.success(`成功终止了查询（ID: ${selectedId}）`)
      setSelectedId(undefined)
    },
  })

  const closePanel = () => {
    setParams({ viewOngoingQueries: undefined })
    appState.setOnGoingQueriesPanelOpen(false)
  }

  return (
    <>
      <Sheet open={appState.ongoingQueriesPanelOpen} onOpenChange={() => closePanel()}>
        <SheetContent size="lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-x-2">
              查询语句正在运行在
              {!database?.identifier || database?.identifier === project?.ref ? '数据库主节点上' : '数据库只读节点上'}
              <Button
                type="default"
                className="px-1.5"
                loading={isLoadingOngoingQueries || isFetchingOngoingQueries}
                icon={<RefreshCw />}
                onClick={() => refetch()}
              />
            </SheetTitle>
            <SheetDescription>
              当前{queries.length === 1 ? '有' : '有'}{' '}
              <span className="text-foreground-light">{queries.length}</span> 条查询
              {queries.length === 1 ? '' : ''}正在运行在
              {database?.identifier && database?.identifier !== project?.ref ? `数据库只读节点 ${database?.identifier} 上` : '数据库上'}
            </SheetDescription>
          </SheetHeader>
          <div className="max-h-full h-full divide-y overflow-y-auto">
            {isError && (
              <div className="flex items-center justify-center h-full px-16">
                <AlertError
                  subject="无法检索到正在运行的查询"
                  error={error as ResponseError}
                />
              </div>
            )}
            {queries.length === 0 && (
              <div className="flex flex-col gap-y-2 items-center justify-center h-full text-foreground-light text-sm">
                <span>
                  当前没有查询运行在
                  {database?.identifier && database?.identifier !== project?.ref
                    ? `数据只读节点 ${database?.identifier} 上`
                    : (databases ?? []).length > 1
                      ? '数据库主节点上'
                      : '数据库上'}
                </span>
                <Button
                  type="default"
                  loading={isLoadingOngoingQueries || isFetchingOngoingQueries}
                  icon={<RefreshCw />}
                  onClick={() => refetch()}
                >
                  刷新
                </Button>
              </div>
            )}
            {queries.map((query) => (
              <SheetSection key={query.pid} className="flex justify-between gap-x-4">
                <div className="flex flex-col gap-y-2 w-full">
                  <CodeBlock
                    hideLineNumbers
                    value={query.query}
                    language="sql"
                    className={cn(
                      'max-w-none max-h-52 w-full',
                      '!bg-transparent !py-3 !px-3.5 prose dark:prose-dark',
                      '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap'
                    )}
                  />
                  <div className="flex items-center gap-x-2">
                    <p className="text-foreground-light text-xs">PID: {query.pid}</p>
                    <p className="text-foreground-light text-xs">•</p>
                    <p className="text-foreground-light text-xs">
                      开始于：{dayjs(query.query_start).format('YYYY/MM/DD HH:mm (ZZ)')}
                    </p>
                  </div>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="warning"
                      className="px-1.5"
                      icon={<StopCircle />}
                      onClick={() => setSelectedId(query.pid)}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">终止查询</TooltipContent>
                </Tooltip>
              </SheetSection>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmationModal
        loading={isLoading}
        variant="warning"
        title={`确定要终止查询？（ID: ${selectedId}）`}
        visible={selectedId !== undefined}
        onCancel={() => setSelectedId(undefined)}
        onConfirm={() => {
          if (selectedId !== undefined)
            abortQuery({
              pid: selectedId,
              projectRef: project?.ref,
              connectionString: database?.connectionString,
            })
        }}
      >
        <p className="text-sm">本操作将强行终止查询运行。</p>
      </ConfirmationModal>
    </>
  )
}
