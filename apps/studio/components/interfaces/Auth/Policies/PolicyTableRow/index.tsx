import type { PostgresPolicy } from '@supabase/postgres-meta'
import { noop } from 'lodash'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Panel from 'components/ui/Panel'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { Info } from 'lucide-react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import PolicyRow from './PolicyRow'
import PolicyTableRowHeader from './PolicyTableRowHeader'

export interface PolicyTableRowProps {
  table: {
    id: number
    schema: string
    name: string
    rls_enabled: boolean
  }
  isLocked: boolean
  onSelectToggleRLS: (table: {
    id: number
    schema: string
    name: string
    rls_enabled: boolean
  }) => void
  onSelectCreatePolicy: () => void
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onSelectDeletePolicy: (policy: PostgresPolicy) => void
}

const PolicyTableRow = ({
  table,
  isLocked,
  onSelectToggleRLS = noop,
  onSelectCreatePolicy,
  onSelectEditPolicy = noop,
  onSelectDeletePolicy = noop,
}: PolicyTableRowProps) => {
  const { project } = useProjectContext()
  const { data } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const policies = (data ?? [])
    .filter((policy) => policy.schema === table.schema && policy.table === table.name)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Panel
      className="!m-0"
      title={
        <PolicyTableRowHeader
          table={table}
          isLocked={isLocked}
          onSelectToggleRLS={onSelectToggleRLS}
          onSelectCreatePolicy={onSelectCreatePolicy}
        />
      }
    >
      {!table.rls_enabled && !isLocked && (
        <div
          className={cn(
            'dark:bg-alternative-200 bg-surface-200 px-6 py-2 text-xs flex items-center gap-2',
            policies.length === 0 ? '' : 'border-b'
          )}
        >
          <div className="w-1.5 h-1.5 bg-warning-600 rounded-full" />
          <span className="font-bold text-warning-600">警告：</span>{' '}
          <span className="text-foreground-light">
            行级安全性已禁用。您的表是公开可读和可写的。
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3 h-3" />
            </TooltipTrigger>
            <TooltipContent className="w-[400px]">
              任何人都可以使用项目的匿名密钥修改或删除您的数据。请启用 RLS 并创建访问策略以保证数据安全。
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      {policies.length === 0 && (
        <div className="px-6 py-4 flex flex-col gap-y-3">
          <p className="text-foreground-lighter text-sm">还未创建策略</p>
        </div>
      )}
      {policies?.map((policy) => (
        <PolicyRow
          key={policy.id}
          isLocked={isLocked}
          policy={policy}
          onSelectEditPolicy={onSelectEditPolicy}
          onSelectDeletePolicy={onSelectDeletePolicy}
        />
      ))}
    </Panel>
  )
}

export default PolicyTableRow
