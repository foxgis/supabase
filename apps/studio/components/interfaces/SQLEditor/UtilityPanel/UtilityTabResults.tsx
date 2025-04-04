import { ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { forwardRef } from 'react'

import { useParams } from 'common'
import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { AiIconAnimation, Button } from 'ui'
import Results from './Results'

export type UtilityTabResultsProps = {
  id: string
  isExecuting?: boolean
  isDisabled?: boolean
  onDebug: () => void
  isDebugging?: boolean
}

const UtilityTabResults = forwardRef<HTMLDivElement, UtilityTabResultsProps>(
  ({ id, isExecuting, isDisabled, isDebugging, onDebug }, htmlRef) => {
    const { ref } = useParams()
    const state = useDatabaseSelectorStateSnapshot()
    const organization = useSelectedOrganization()
    const snapV2 = useSqlEditorV2StateSnapshot()

    const result = snapV2.results[id]?.[0]
    const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })

    // Customers on HIPAA plans should not have access to Supabase AI
    const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

    const isTimeout =
      result?.error?.message?.includes('canceling statement due to statement timeout') ||
      result?.error?.message?.includes('upstream request timeout')
    const isNetWorkError = result?.error?.message?.includes('EHOSTUNREACH')

    if (isExecuting) {
      return (
        <div className="flex items-center gap-x-4 px-6 py-4 bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark">
          <Loader2 size={14} className="animate-spin" />
          <p className="m-0 border-0 font-mono text-sm">正在运行...</p>
        </div>
      )
    } else if (result?.error) {
      const formattedError = (result.error?.formattedError?.split('\n') ?? []).filter(
        (x: string) => x.length > 0
      )
      const readReplicaError =
        state.selectedDatabaseId !== ref &&
        result.error.message.includes('in a read-only transaction')
      const payloadTooLargeError = result.error.message.includes(
        '查询语句太大了，无法在此界面中执行'
      )

      return (
        <div className="bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark overflow-y-auto">
          <div className="flex flex-row justify-between items-start py-4 px-6 gap-x-4">
            {isTimeout ? (
              <div className="flex flex-col gap-y-1">
                <p className="font-mono text-sm">SQL 查询超时</p>
                <p className="font-mono text-sm text-foreground-light">
                  您要么{' '}
                  <a
                    target="_blank"
                    rel="noreferrer"
                    className="underline transition hover:text-foreground"
                    href="https://supabase.com/docs/guides/platform/performance#examining-query-performance"
                  >
                    优化查询语句
                  </a>
                  ，或者{' '}
                  <a
                    target="_blank"
                    rel="noreferrer"
                    className="underline transition hover:text-foreground"
                    href="https://supabase.com/docs/guides/database/timeouts"
                  >
                    增加查询最大超时时间
                  </a>
                  .
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-y-1">
                {formattedError.length > 0 ? (
                  formattedError.map((x: string, i: number) => (
                    <pre key={`error-${i}`} className="font-mono text-sm text-wrap">
                      {x}
                    </pre>
                  ))
                ) : (
                  <p className="font-mono text-sm tracking-tight">错误：{result.error?.message}</p>
                )}
                {!isTimeout && !isNetWorkError && result.autoLimit && (
                  <p className="text-sm text-foreground-light">
                    注意：查询添加了最多返回 {result.autoLimit} 条的限制。
                    如果出现了语法错误，请尝试选择“无限制”，并重新运行查询。
                  </p>
                )}
                {readReplicaError && (
                  <p className="text-sm text-foreground-light">
                    注意：只读节点用于只读查询。
                    执行写操作的查询请在数据库主节点上执行。
                  </p>
                )}
                {payloadTooLargeError && (
                  <p className="text-sm text-foreground-light flex items-center gap-x-1">
                    您可以直接连接到数据{' '}
                    <Link
                      target="_blank"
                      rel="noreferrer"
                      href={`/project/${ref}/settings/database`}
                      className="underline transition hover:text-foreground flex items-center gap-x-1"
                    >
                      执行查询
                      <ExternalLink size={12} />
                    </Link>
                    .
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-x-2">
              {readReplicaError && (
                <Button
                  className="py-2"
                  type="default"
                  onClick={() => {
                    state.setSelectedDatabaseId(ref)
                    snapV2.resetResult(id)
                  }}
                >
                  切换到主数据库
                </Button>
              )}
              {/* {!hasHipaaAddon && (
                <Button
                  icon={<AiIconAnimation className="scale-75 w-3 h-3" loading={isDebugging} />}
                  disabled={!!isDisabled || isDebugging}
                  onClick={onDebug}
                >
                  使用 AI 调试
                </Button>
              )} */}
            </div>
          </div>
        </div>
      )
    } else if (!result) {
      return (
        <div className="bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark overflow-y-auto">
          <p className="m-0 border-0 px-4 py-4 text-sm text-foreground-light">
            点击<code>运行</code>执行查询语句。
          </p>
        </div>
      )
    } else if (result.rows.length <= 0) {
      return (
        <div className="bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark overflow-y-auto">
          <p className="m-0 border-0 px-6 py-4 font-mono text-sm">执行成功。无结果返回</p>
        </div>
      )
    }

    return <Results rows={result.rows} />
  }
)

UtilityTabResults.displayName = 'UtilityTabResults'
export default UtilityTabResults
