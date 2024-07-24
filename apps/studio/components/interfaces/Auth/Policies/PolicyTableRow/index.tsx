import type { PostgresPolicy, PostgresTable } from '@supabase/postgres-meta'
import { noop } from 'lodash'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_ } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { WarningIcon } from 'ui'
import Panel from 'components/ui/Panel'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import PolicyRow from './PolicyRow'
import PolicyTableRowHeader from './PolicyTableRowHeader'

interface PolicyTableRowProps {
  table: PostgresTable
  isLocked: boolean
  onSelectToggleRLS: (table: PostgresTable) => void
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
      {(!table.rls_enabled || policies.length === 0) && (
        <div className="px-6 py-4 flex flex-col gap-y-3">
          {table.rls_enabled && policies.length === 0 && (
            <Alert_Shadcn_>
              <WarningIcon />
              <AlertTitle_Shadcn_>
                这张表已启用行级安全性，但尚未设置策略
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                查询将返回一个 <span className="text-foreground underline">空数组</span> 的结果。
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}
          {!table.rls_enabled && (
            <Alert_Shadcn_ variant="warning">
              <WarningIcon />
              <AlertTitle_Shadcn_>
                警告：行级安全性已禁用。您的表是公开可读和可写的。
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                任何人都可以使用项目的匿名密钥修改或删除您的数据。启用 RLS 并创建访问策略以保证数据安全。
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}
          {policies.length === 0 && (
            <p className="text-foreground-light text-sm">还未创建策略</p>
          )}
        </div>
      )}

      {policies?.map((policy) => (
        <PolicyRow
          key={policy.id}
          policy={policy}
          onSelectEditPolicy={onSelectEditPolicy}
          onSelectDeletePolicy={onSelectDeletePolicy}
        />
      ))}
    </Panel>
  )
}

export default PolicyTableRow
