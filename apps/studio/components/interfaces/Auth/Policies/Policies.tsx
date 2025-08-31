import type { PostgresPolicy } from '@supabase/postgres-meta'
import { isEmpty } from 'lodash'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import {
  PolicyTableRow,
  PolicyTableRowProps,
} from 'components/interfaces/Auth/Policies/PolicyTableRow'
import { ProtectedSchemaWarning } from 'components/interfaces/Database/ProtectedSchemaWarning'
import { NoSearchResults } from 'components/ui/NoSearchResults'
import { useDatabasePolicyDeleteMutation } from 'data/database-policies/database-policy-delete-mutation'
import { useTableUpdateMutation } from 'data/tables/table-update-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Button, Card, CardContent } from 'ui'
import ConfirmModal from 'ui-patterns/Dialogs/ConfirmDialog'

interface PoliciesProps {
  search?: string
  schema: string
  tables: PolicyTableRowProps['table'][]
  hasTables: boolean
  isLocked: boolean
  onSelectCreatePolicy: (table: string) => void
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onResetSearch?: () => void
}

export const Policies = ({
  search,
  schema,
  tables,
  hasTables,
  isLocked,
  onSelectCreatePolicy,
  onSelectEditPolicy: onSelectEditPolicyAI,
  onResetSearch,
}: PoliciesProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [selectedTableToToggleRLS, setSelectedTableToToggleRLS] = useState<{
    id: number
    schema: string
    name: string
    rls_enabled: boolean
  }>()
  const [selectedPolicyToDelete, setSelectedPolicyToDelete] = useState<any>({})

  const { mutate: updateTable } = useTableUpdateMutation({
    onError: (error) => {
      toast.error(`启停 RLS 失败: ${error.message}`)
    },
    onSettled: () => {
      closeConfirmModal()
    },
  })
  const { mutate: deleteDatabasePolicy } = useDatabasePolicyDeleteMutation({
    onSuccess: () => {
      toast.success('成功删除了策略！')
    },
    onSettled: () => {
      closeConfirmModal()
    },
  })

  const closeConfirmModal = () => {
    setSelectedPolicyToDelete({})
    setSelectedTableToToggleRLS(undefined)
  }

  const onSelectToggleRLS = (table: {
    id: number
    schema: string
    name: string
    rls_enabled: boolean
  }) => {
    setSelectedTableToToggleRLS(table)
  }

  const onSelectEditPolicy = (policy: any) => {
    onSelectEditPolicyAI(policy)
  }

  const onSelectDeletePolicy = (policy: any) => {
    setSelectedPolicyToDelete(policy)
  }

  // Methods that involve some API
  const onToggleRLS = async () => {
    if (!selectedTableToToggleRLS) return console.error('Table is required')

    const payload = {
      id: selectedTableToToggleRLS.id,
      rls_enabled: !selectedTableToToggleRLS.rls_enabled,
    }

    updateTable({
      projectRef: project?.ref!,
      connectionString: project?.connectionString,
      id: selectedTableToToggleRLS.id,
      name: selectedTableToToggleRLS.name,
      schema: selectedTableToToggleRLS.schema,
      payload: payload,
    })
  }

  const onDeletePolicy = async () => {
    if (!project) return console.error('未找到项目')
    deleteDatabasePolicy({
      projectRef: project.ref,
      connectionString: project.connectionString,
      originalPolicy: selectedPolicyToDelete,
    })
  }

  if (!hasTables) {
    return (
      <Card className="w-full bg-transparent">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <h2 className="heading-default">暂无表可以用来创建访问策略</h2>

          <p className="text-sm text-foreground-light text-center mb-4">
            RLS 策略用来控制用户对表中数据行的访问权限。在创建策略之前，请先在模式下创建一张表。
          </p>
          <Button asChild type="default">
            <Link href={`/project/${ref}/editor`}>创建表</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-y-4 pb-4">
        {isLocked && <ProtectedSchemaWarning schema={schema} entity="策略" />}
        {tables.length > 0 ? (
          tables.map((table) => (
            <section key={table.id}>
              <PolicyTableRow
                table={table}
                isLocked={schema === 'realtime' ? true : isLocked}
                onSelectToggleRLS={onSelectToggleRLS}
                onSelectCreatePolicy={() => onSelectCreatePolicy(table.name)}
                onSelectEditPolicy={onSelectEditPolicy}
                onSelectDeletePolicy={onSelectDeletePolicy}
              />
            </section>
          ))
        ) : hasTables ? (
          <NoSearchResults searchString={search ?? ''} onResetFilter={onResetSearch} />
        ) : null}
      </div>

      <ConfirmModal
        danger
        visible={!isEmpty(selectedPolicyToDelete)}
        title="确认删除策略"
        description={`这是永久性的！您确定要删除策略 "${selectedPolicyToDelete.name}"`}
        buttonLabel="删除"
        buttonLoadingLabel="正在删除"
        onSelectCancel={closeConfirmModal}
        onSelectConfirm={onDeletePolicy}
      />

      <ConfirmModal
        danger={selectedTableToToggleRLS?.rls_enabled}
        visible={selectedTableToToggleRLS !== undefined}
        title={`确定要${
          selectedTableToToggleRLS?.rls_enabled ? '禁用' : '启用'
        }行级安全性`}
        description={`您确定想要${
          selectedTableToToggleRLS?.rls_enabled ? '禁用' : '启用'
        }表 "${selectedTableToToggleRLS?.name}" 的行级安全性吗？`}
        buttonLabel="确认"
        buttonLoadingLabel="正在保存"
        onSelectCancel={closeConfirmModal}
        onSelectConfirm={onToggleRLS}
      />
    </>
  )
}
