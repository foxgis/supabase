import type { PostgresPolicy } from '@supabase/postgres-meta'
import { isEmpty } from 'lodash'
import { HelpCircle } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import {
  PolicyTableRow,
  PolicyTableRowProps,
} from 'components/interfaces/Auth/Policies/PolicyTableRow'
import { ProtectedSchemaWarning } from 'components/interfaces/Database/ProtectedSchemaWarning'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import InformationBox from 'components/ui/InformationBox'
import { useDatabasePolicyDeleteMutation } from 'data/database-policies/database-policy-delete-mutation'
import { useTableUpdateMutation } from 'data/tables/table-update-mutation'
import ConfirmModal from 'ui-patterns/Dialogs/ConfirmDialog'

interface PoliciesProps {
  schema: string
  tables: PolicyTableRowProps['table'][]
  hasTables: boolean
  isLocked: boolean
  onSelectCreatePolicy: (table: string) => void
  onSelectEditPolicy: (policy: PostgresPolicy) => void
}

const Policies = ({
  schema,
  tables,
  hasTables,
  isLocked,
  onSelectCreatePolicy,
  onSelectEditPolicy: onSelectEditPolicyAI,
}: PoliciesProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { project } = useProjectContext()

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

  if (tables.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <ProductEmptyState
          size="large"
          title="行级安全性（RLS）策略"
          ctaButtonLabel="创建表"
          infoButtonLabel="什么是 RLS？"
          infoButtonUrl="https://supabase.com/docs/guides/auth/row-level-security"
          onClickCta={() => router.push(`/project/${ref}/editor`)}
        >
          <div className="space-y-4">
            <InformationBox
              title="什么是策略？"
              icon={<HelpCircle size={14} strokeWidth={2} />}
              description={
                <div className="space-y-2">
                  <p className="text-sm">
                    策略是从用户层面上限制哪些行可以通过普通查询返回，或者通过插入、更新或删除修改数据。
                  </p>
                  <p className="text-sm">
                    这也称为行级安全性（RLS）。每个策略都附加到一张表上，并且每次访问该策略时都会执行该策略。
                  </p>
                </div>
              }
            />
            <p className="text-sm text-foreground-light">
              在这个模式下先创建一张表，然后再创建策略。
            </p>
          </div>
        </ProductEmptyState>
      </div>
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
          <NoSearchResults />
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

export default Policies
