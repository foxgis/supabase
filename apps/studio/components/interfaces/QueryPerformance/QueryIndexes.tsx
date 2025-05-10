import { Check, Lightbulb, Table2 } from 'lucide-react'
import { useState } from 'react'

import { AccordionTrigger } from '@ui/components/shadcn/ui/accordion'
import { useIsIndexAdvisorAvailable } from 'components/interfaces/QueryPerformance/hooks/useIsIndexAdvisorAvailable'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useGetIndexAdvisorResult } from 'data/database/retrieve-index-advisor-result-query'
import { useGetIndexesFromSelectQuery } from 'data/database/retrieve-index-from-select-query'
import {
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  Accordion_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CodeBlock,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  cn,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { IndexAdvisorDisabledState } from './IndexAdvisorDisabledState'
import { IndexImprovementText } from './IndexImprovementText'
import { QueryPanelContainer, QueryPanelScoreSection, QueryPanelSection } from './QueryPanel'
import { useIndexInvalidation } from './hooks/useIndexInvalidation'
import { calculateImprovement, createIndexes, hasIndexRecommendations } from './index-advisor.utils'

interface QueryIndexesProps {
  selectedRow: any
}

// [Joshen] There's several more UX things we can do to help ease the learning curve of indexes I think
// e.g understanding "costs", what numbers of "costs" are actually considered insignificant

export const QueryIndexes = ({ selectedRow }: QueryIndexesProps) => {
  // [Joshen] TODO implement this logic once the linter rules are in
  const isLinterWarning = false
  const { project } = useProjectContext()
  const [showStartupCosts, setShowStartupCosts] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

  const {
    data: usedIndexes,
    isSuccess,
    isLoading,
    isError,
    error,
  } = useGetIndexesFromSelectQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    query: selectedRow?.['query'],
  })

  const { data: extensions, isLoading: isLoadingExtensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const isAdvisorAvailable = useIsIndexAdvisorAvailable()

  const {
    data: indexAdvisorResult,
    error: indexAdvisorError,
    refetch,
    isError: isErrorIndexAdvisorResult,
    isSuccess: isSuccessIndexAdvisorResult,
    isLoading: isLoadingIndexAdvisorResult,
  } = useGetIndexAdvisorResult(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      query: selectedRow?.['query'],
    },
    { enabled: isAdvisorAvailable }
  )

  const {
    index_statements,
    startup_cost_after,
    startup_cost_before,
    total_cost_after,
    total_cost_before,
  } = indexAdvisorResult ?? { index_statements: [], total_cost_after: 0, total_cost_before: 0 }
  const hasIndexRecommendation = hasIndexRecommendations(
    indexAdvisorResult,
    isSuccessIndexAdvisorResult
  )
  const totalImprovement = calculateImprovement(total_cost_before, total_cost_after)

  const invalidateQueries = useIndexInvalidation()

  const createIndex = async () => {
    if (index_statements.length === 0) return

    setIsExecuting(true)

    try {
      await createIndexes({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        indexStatements: index_statements,
        onSuccess: () => refetch(),
      })

      // Only invalidate queries if index creation was successful
      invalidateQueries()
    } catch (error) {
      // Error is already handled by createIndexes with a toast notification
      // But we could add component-specific error handling here if needed
      console.error('Failed to create index:', error)
      setIsExecuting(false)
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <QueryPanelContainer className="h-full">
      <QueryPanelSection>
        <div>
          <p className="text-sm">正在使用的索引</p>
          <p className="text-sm text-foreground-light">
            此查询正在使用以下索引{(usedIndexes ?? []).length > 1 ? '' : ''}：
          </p>
        </div>
        {isLoading && <GenericSkeletonLoader />}
        {isError && (
          <AlertError
            projectRef={project?.ref}
            error={error}
            subject="Failed to retrieve indexes in use"
          />
        )}
        {isSuccess && (
          <div>
            {usedIndexes.length === 0 && (
              <div className="border rounded border-dashed flex flex-col items-center justify-center py-4 px-20 gap-y-1">
                <p className="text-sm text-foreground-light">
                  此查询没有涉及索引
                </p>
                <p className="text-center text-xs text-foreground-lighter">
                  索引可能在执行查询时会产生更高的时间成本，因此不一定会被使用
                </p>
              </div>
            )}
            {usedIndexes.map((index) => {
              return (
                <div
                  key={index.name}
                  className="flex items-center gap-x-4 bg-surface-100 border first:rounded-tl first:rounded-tr border-b-0 last:border-b last:rounded-b px-2 py-2"
                >
                  <div className="flex items-center gap-x-2">
                    <Table2 size={14} className="text-foreground-light" />
                    <span className="text-xs font-mono text-foreground-light">
                      {index.schema}.{index.table}
                    </span>
                  </div>
                  <span className="text-xs font-mono">{index.name}</span>
                </div>
              )
            })}
          </div>
        )}
      </QueryPanelSection>

      <div className="border-t" />

      <QueryPanelSection className="flex flex-col gap-y-6">
        <div className="flex flex-col gap-y-2">
          <p className="text-sm">新的索引建议</p>
          {isLoadingExtensions ? (
            <GenericSkeletonLoader />
          ) : !isAdvisorAvailable ? (
            <IndexAdvisorDisabledState />
          ) : (
            <>
              {isLoadingIndexAdvisorResult && <GenericSkeletonLoader />}
              {isErrorIndexAdvisorResult && (
                <AlertError
                  projectRef={project?.ref}
                  error={indexAdvisorError}
                  subject="无法从索引助手中获取结果"
                />
              )}
              {isSuccessIndexAdvisorResult && (
                <>
                  {(index_statements ?? []).length === 0 ? (
                    <Alert_Shadcn_ className="[&>svg]:rounded-full">
                      <Check />
                      <AlertTitle_Shadcn_>此查询已经优化</AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_>
                        索引建议会在这里显示
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
                  ) : (
                    <>
                      {isLinterWarning ? (
                        <Alert_Shadcn_
                          variant="default"
                          className="border-brand-400 bg-alternative [&>svg]:p-0.5 [&>svg]:bg-transparent [&>svg]:text-brand"
                        >
                          <Lightbulb />
                          <AlertTitle_Shadcn_>
                            我们有 {index_statements.length} 条索引建议
                            {index_statements.length > 1 ? '' : ''}
                          </AlertTitle_Shadcn_>
                          <AlertDescription_Shadcn_>
                            通过添加以下
                            {index_statements.length > 1 ? '索引' : '索引'}，
                            此查询的性能可以提高{' '}
                            <span className="text-brand">{totalImprovement.toFixed(2)}%</span>
                          </AlertDescription_Shadcn_>
                        </Alert_Shadcn_>
                      ) : (
                        <IndexImprovementText
                          indexStatements={index_statements}
                          totalCostBefore={total_cost_before}
                          totalCostAfter={total_cost_after}
                          className="text-sm text-foreground-light"
                        />
                      )}
                      <CodeBlock
                        hideLineNumbers
                        value={index_statements.join(';\n') + ';'}
                        language="sql"
                        className={cn(
                          'max-w-full max-h-[310px]',
                          '!py-3 !px-3.5 prose dark:prose-dark transition',
                          '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap'
                        )}
                      />
                      <p className="text-sm text-foreground-light">
                        此建议旨在防止查询随着表数据增加而变慢，因此创建的索引可能不会被立即使用
                        （例如，如果您的表在此时仍很小）
                      </p>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
        {isAdvisorAvailable && hasIndexRecommendation && (
          <>
            <div className="flex flex-col gap-y-2">
              <p className="text-sm">查询成本</p>
              <div className="border rounded-md flex flex-col bg-surface-100">
                <QueryPanelScoreSection
                  name="查询的总成本"
                  description="一个用于衡量查询返回所有行所需时长（包括启动成本）的估算值"
                  before={total_cost_before}
                  after={total_cost_after}
                />
                <Collapsible_Shadcn_ open={showStartupCosts} onOpenChange={setShowStartupCosts}>
                  <CollapsibleContent_Shadcn_ asChild className="pb-3">
                    <QueryPanelScoreSection
                      hideArrowMarkers
                      className="border-t"
                      name="启动成本"
                      description="一个用于衡量开始拉取第一行数据所需时长的估算值"
                      before={startup_cost_before}
                      after={startup_cost_after}
                    />
                  </CollapsibleContent_Shadcn_>
                  <CollapsibleTrigger_Shadcn_ className="text-xs py-1.5 border-t text-foreground-light bg-studio w-full rounded-b-md">
                    查看{showStartupCosts ? '更少' : '更多'}
                  </CollapsibleTrigger_Shadcn_>
                </Collapsible_Shadcn_>
              </div>
            </div>
            <div className="flex flex-col gap-y-2">
              <p className="text-sm">常见问题解答</p>
              <Accordion_Shadcn_ collapsible type="single" className="border rounded-md">
                <AccordionItem_Shadcn_ value="1">
                  <AccordionTrigger className="px-4 py-3 text-sm font-normal text-foreground-light hover:text-foreground transition [&[data-state=open]]:text-foreground">
                    成本的单位是什么？
                  </AccordionTrigger>
                  <AccordionContent_Shadcn_ className="px-4 text-foreground-light">
                    成本是一个相对单位，并不代表时间单位。单位（默认情况下）是以单个连续的页面读取成本为1.0单位。
                    即使如此，它们仍然可以作为预测查询执行时间长短的指标。
                  </AccordionContent_Shadcn_>
                </AccordionItem_Shadcn_>
                <AccordionItem_Shadcn_ value="2" className="border-b-0">
                  <AccordionTrigger className="px-4 py-3 text-sm font-normal text-foreground-light hover:text-foreground transition [&[data-state=open]]:text-foreground">
                    如何优先考虑启动成本和总成本？
                  </AccordionTrigger>
                  <AccordionContent_Shadcn_ className="px-4 text-foreground-light [&>div]:space-y-2">
                    <p>这取决于查询返回的结果集的大小。</p>
                    <p>
                      对于返回少量行的查询，启动成本更为关键，最小化启动成本可以导致更快的响应时间，
                      尤其对于交互式应用程序。
                    </p>
                    <p>
                      对于返回大量行的查询，总成本变得更加重要，优化它可以帮助资源的高效利用和
                      减少整体查询执行时间。
                    </p>
                  </AccordionContent_Shadcn_>
                </AccordionItem_Shadcn_>
              </Accordion_Shadcn_>
            </div>
          </>
        )}
      </QueryPanelSection>

      {isAdvisorAvailable && hasIndexRecommendation && (
        <div className="bg-studio sticky bottom-0 border-t py-3 flex items-center justify-between px-5">
          <div className="flex flex-col gap-y-1 text-sm">
            <span>为数据库应用索引</span>
            <span className="text-xs text-foreground-light">
              这将执行上面显示的 SQL
            </span>
          </div>
          <Button
            disabled={isExecuting}
            loading={isExecuting}
            type="primary"
            onClick={() => createIndex()}
          >
            创建索引
          </Button>
        </div>
      )}
    </QueryPanelContainer>
  )
}
