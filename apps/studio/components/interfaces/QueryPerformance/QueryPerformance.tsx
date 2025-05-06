import { InformationCircleIcon } from '@heroicons/react/16/solid'
import { X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { formatDatabaseID } from 'data/read-replicas/replicas.utils'
import { executeSql } from 'data/sql/execute-sql-query'
import { DbQueryHook } from 'hooks/analytics/useDbQuery'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { IS_PLATFORM } from 'lib/constants'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import {
  Button,
  LoadingLine,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { Markdown } from '../Markdown'
import { useQueryPerformanceQuery } from '../Reports/Reports.queries'
import { PresetHookResult } from '../Reports/Reports.utils'
import { QUERY_PERFORMANCE_REPORT_TYPES } from './QueryPerformance.constants'
import { QueryPerformanceFilterBar } from './QueryPerformanceFilterBar'
import { QueryPerformanceGrid } from './QueryPerformanceGrid'

interface QueryPerformanceProps {
  queryHitRate: PresetHookResult
  queryPerformanceQuery: DbQueryHook<any>
}

export const QueryPerformance = ({
  queryHitRate,
  queryPerformanceQuery,
}: QueryPerformanceProps) => {
  const router = useRouter()
  const { ref, preset } = useParams()
  const { project } = useProjectContext()
  const state = useDatabaseSelectorStateSnapshot()

  const { isLoading, isRefetching } = queryPerformanceQuery
  const isPrimaryDatabase = state.selectedDatabaseId === ref
  const formattedDatabaseId = formatDatabaseID(state.selectedDatabaseId ?? '')

  const [page, setPage] = useState<QUERY_PERFORMANCE_REPORT_TYPES>(
    (preset as QUERY_PERFORMANCE_REPORT_TYPES) ?? QUERY_PERFORMANCE_REPORT_TYPES.MOST_TIME_CONSUMING
  )
  const [showResetgPgStatStatements, setShowResetgPgStatStatements] = useState(false)

  const [showBottomSection, setShowBottomSection] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.QUERY_PERF_SHOW_BOTTOM_SECTION,
    true
  )

  const handleRefresh = () => {
    queryPerformanceQuery.runQuery()
    queryHitRate.runQuery()
  }

  const { data: databases } = useReadReplicasQuery({ projectRef: ref })

  const { data: mostTimeConsumingQueries, isLoading: isLoadingMTC } = useQueryPerformanceQuery({
    preset: 'mostTimeConsuming',
  })
  const { data: mostFrequentlyInvoked, isLoading: isLoadingMFI } = useQueryPerformanceQuery({
    preset: 'mostFrequentlyInvoked',
  })
  const { data: slowestExecutionTime, isLoading: isLoadingMMF } = useQueryPerformanceQuery({
    preset: 'slowestExecutionTime',
  })

  const QUERY_PERFORMANCE_TABS = useMemo(() => {
    return [
      {
        id: QUERY_PERFORMANCE_REPORT_TYPES.MOST_TIME_CONSUMING,
        label: '最消耗时间',
        description: '按照累计执行时间对查询进行排序。',
        isLoading: isLoadingMTC,
        max:
          (mostTimeConsumingQueries ?? []).length > 0
            ? Math.max(...(mostTimeConsumingQueries ?? []).map((x: any) => x.total_time)).toFixed(2)
            : undefined,
      },
      {
        id: QUERY_PERFORMANCE_REPORT_TYPES.MOST_FREQUENT,
        label: '最频繁调用',
        description: '按照执行次数对查询进行排序',
        isLoading: isLoadingMFI,
        max:
          (mostFrequentlyInvoked ?? []).length > 0
            ? Math.max(...(mostFrequentlyInvoked ?? []).map((x: any) => x.calls)).toFixed(2)
            : undefined,
      },
      {
        id: QUERY_PERFORMANCE_REPORT_TYPES.SLOWEST_EXECUTION,
        label: '最慢执行',
        description: '按照最大执行事件对查询进行排序。',
        isLoading: isLoadingMMF,
        max:
          (slowestExecutionTime ?? []).length > 0
            ? Math.max(...(slowestExecutionTime ?? []).map((x: any) => x.max_time)).toFixed(2)
            : undefined,
      },
    ]
  }, [
    isLoadingMFI,
    isLoadingMMF,
    isLoadingMTC,
    mostFrequentlyInvoked,
    mostTimeConsumingQueries,
    slowestExecutionTime,
  ])

  useEffect(() => {
    state.setSelectedDatabaseId(ref)
  }, [ref])

  return (
    <>
      <Tabs_Shadcn_
        defaultValue={page}
        onValueChange={(value) => {
          setPage(value as QUERY_PERFORMANCE_REPORT_TYPES)
          const { sort, search, ...rest } = router.query
          router.push({ ...router, query: { ...rest, preset: value } })
        }}
      >
        <TabsList_Shadcn_ className={cn('flex gap-0 border-0 items-end z-10')}>
          {QUERY_PERFORMANCE_TABS.map((tab) => {
            const tabMax = Number(tab.max)
            const maxValue =
              tab.id !== QUERY_PERFORMANCE_REPORT_TYPES.MOST_FREQUENT
                ? tabMax > 1000
                  ? (tabMax / 1000).toFixed(2)
                  : tabMax.toFixed(0)
                : tabMax.toLocaleString()

            return (
              <TabsTrigger_Shadcn_
                key={tab.id}
                value={tab.id}
                className={cn(
                  'group relative',
                  'px-6 py-3 border-b-0 flex flex-col items-start !shadow-none border-default border-t',
                  'even:border-x last:border-r even:!border-x-strong last:!border-r-strong',
                  tab.id === page ? '!bg-surface-200' : '!bg-surface-200/[33%]',
                  'hover:!bg-surface-100',
                  'data-[state=active]:!bg-surface-200',
                  'hover:text-foreground-light',
                  'transition'
                )}
              >
                {tab.id === page && (
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-foreground" />
                )}

                <div className="flex items-center gap-x-2">
                  <span className="">{tab.label}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InformationCircleIcon className="transition text-foreground-muted w-3 h-3 data-[state=delayed-open]:text-foreground-light" />
                    </TooltipTrigger>
                    <TooltipContent side="top">{tab.description}</TooltipContent>
                  </Tooltip>
                </div>
                {tab.isLoading ? (
                  <ShimmeringLoader className="w-32 pt-1" />
                ) : tab.max === undefined ? (
                  <span className="text-xs text-foreground-muted group-hover:text-foreground-lighter group-data-[state=active]:text-foreground-lighter transition">
                    暂无数据
                  </span>
                ) : (
                  <span className="text-xs text-foreground-muted group-hover:text-foreground-lighter group-data-[state=active]:text-foreground-lighter transition">
                    {maxValue}
                    {tab.id !== QUERY_PERFORMANCE_REPORT_TYPES.MOST_FREQUENT
                      ? tabMax > 1000
                        ? 's'
                        : 'ms'
                      : ' calls'}
                  </span>
                )}

                {tab.id === page && (
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-surface-200"></div>
                )}
              </TabsTrigger_Shadcn_>
            )
          })}
        </TabsList_Shadcn_>
      </Tabs_Shadcn_>

      <QueryPerformanceFilterBar
        queryPerformanceQuery={queryPerformanceQuery}
        onResetReportClick={() => setShowResetgPgStatStatements(true)}
      />
      <LoadingLine loading={isLoading || isRefetching} />

      <QueryPerformanceGrid queryPerformanceQuery={queryPerformanceQuery} />

      <div
        className={cn('px-6 py-6 flex gap-x-4 border-t relative', {
          hidden: showBottomSection === false,
        })}
      >
        <Button
          className="absolute top-1.5 right-3 px-1.5"
          type="text"
          size="tiny"
          onClick={() => setShowBottomSection(false)}
        >
          <X size="14" />
        </Button>
        <div className="w-[33%] flex flex-col gap-y-1 text-sm">
          <p>重置报告</p>
          <p className="text-xs text-foreground-light">
            考虑在优化查询后重置分析。
          </p>
          <Button
            type="default"
            className="!mt-3 w-min"
            onClick={() => setShowResetgPgStatStatements(true)}
          >
            重置报告
          </Button>
        </div>

        <div className="w-[33%] flex flex-col gap-y-1 text-sm">
          <p>报告是怎么生成的？</p>
          <Markdown
            className="text-xs"
            content="此报告使用了 pg_stat_statements 表和 pg_stat_statements 扩展。[从这里了解更多](https://supabase.com/docs/guides/platform/performance#examining-query-performance)."
          />
        </div>

        <div className="w-[33%] flex flex-col gap-y-1 text-sm">
          <p>检查数据库是否存在潜在问题</p>
          <Markdown
            className="text-xs"
            content="数据中间件附带了一系列工具，可帮助您检查数据库实例是否存在潜在问题。[从这里了解更多](https://supabase.com/docs/guides/database/inspect)."
          />
        </div>
      </div>

      <ConfirmationModal
        visible={showResetgPgStatStatements}
        size="medium"
        variant="destructive"
        title="重置查询性能分析"
        confirmLabel="重置报告"
        confirmLabelLoading="正在重置报告"
        onCancel={() => setShowResetgPgStatStatements(false)}
        onConfirm={async () => {
          const connectionString = databases?.find(
            (db) => db.identifier === state.selectedDatabaseId
          )?.connectionString

          if (IS_PLATFORM && !connectionString) {
            return toast.error('无法执行查询：缺少数据库连接字符串')
          }

          try {
            await executeSql({
              projectRef: project?.ref,
              connectionString,
              sql: `SELECT pg_stat_statements_reset();`,
            })
            handleRefresh()
            setShowResetgPgStatStatements(false)
          } catch (error: any) {
            toast.error(`重置分析失败: ${error.message}`)
          }
        }}
      >
        <p className="text-foreground-light text-sm">
          本操作将清空表 `pg_stat_statements`。数据将在之后重新生成。
        </p>
      </ConfirmationModal>
    </>
  )
}
