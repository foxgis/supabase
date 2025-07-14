import { PostgresTrigger } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop, partition } from 'lodash'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlphaPreview from 'components/to-be-cleaned/AlphaPreview'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabaseTriggersQuery } from 'data/database-triggers/database-triggers-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { PROTECTED_SCHEMAS } from 'lib/constants/schemas'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { AiIconAnimation, Input } from 'ui'
import ProtectedSchemaWarning from '../../ProtectedSchemaWarning'
import TriggerList from './TriggerList'

interface TriggersListProps {
  createTrigger: () => void
  editTrigger: (trigger: PostgresTrigger) => void
  deleteTrigger: (trigger: PostgresTrigger) => void
}

const TriggersList = ({
  createTrigger = noop,
  editTrigger = noop,
  deleteTrigger = noop,
}: TriggersListProps) => {
  const { project } = useProjectContext()
  const aiSnap = useAiAssistantStateSnapshot()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const [filterString, setFilterString] = useState<string>('')

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [protectedSchemas] = partition(schemas ?? [], (schema) =>
    PROTECTED_SCHEMAS.includes(schema?.name ?? '')
  )
  const schema = schemas?.find((schema) => schema.name === selectedSchema)
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  const { data = [], isSuccess } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const hasTables = data.filter((a) => !PROTECTED_SCHEMAS.includes(a.schema)).length > 0

  const {
    data: triggers,
    error,
    isLoading,
    isError,
  } = useDatabaseTriggersQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const canCreateTriggers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'triggers')

  if (isLoading) {
    return <GenericSkeletonLoader />
  }

  if (isError) {
    return <AlertError error={error} subject="获取数据库触发器失败" />
  }

  return (
    <>
      {(triggers ?? []).length === 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <ProductEmptyState
            title="触发器"
            ctaButtonLabel="创建新触发器"
            onClickCta={() => createTrigger()}
          >
            <AlphaPreview />
            <p className="text-sm text-foreground-light">
              PostgreSQL 触发器是一个在表发生特定事件时自动调用的函数。
            </p>
            <p className="text-sm text-foreground-light">
              事件可以是 INSERT、UPDATE、DELETE。触发器是一个与表相关的特殊用户自定义函数。
            </p>
          </ProductEmptyState>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
            <div className="flex flex-col lg:flex-row lg:items-center gap-2">
              <SchemaSelector
                className="w-full lg:w-[180px]"
                size="tiny"
                showError={false}
                selectedSchemaName={selectedSchema}
                onSelectSchema={setSelectedSchema}
              />
              <Input
                placeholder="查找触发器"
                size="tiny"
                icon={<Search size="14" />}
                value={filterString}
                className="w-full lg:w-52"
                onChange={(e) => setFilterString(e.target.value)}
              />
            </div>
            {!isLocked && (
              <div className="flex items-center gap-x-2">
                <ButtonTooltip
                  disabled={!hasTables || !canCreateTriggers}
                  icon={<Plus />}
                  onClick={() => createTrigger()}
                  className="flex-grow"
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: !hasTables
                        ? '请先创建表后再创建触发器'
                        : !canCreateTriggers
                          ? '您需要额外的权限才能创建触发器'
                          : undefined,
                    },
                  }}
                >
                  创建触发器
                </ButtonTooltip>

                {/* hasTables && (
                  <ButtonTooltip
                    type="default"
                    disabled={!hasTables || !canCreateTriggers}
                    className="px-1 pointer-events-auto"
                    icon={<AiIconAnimation size={16} />}
                    onClick={() =>
                      aiSnap.newChat({
                        name: 'Create new trigger',
                        open: true,
                        initialInput: `Create a new trigger for the schema ${selectedSchema} that does ...`,
                        suggestions: {
                          title:
                            'I can help you create a new trigger, here are a few example prompts to get you started:',
                          prompts: [
                            {
                              label: 'Log Changes',
                              description: 'Create a trigger that logs changes to the users table',
                            },
                            {
                              label: 'Update Timestamp',
                              description: 'Create a trigger that updates updated_at timestamp',
                            },
                            {
                              label: 'Validate Email',
                              description:
                                'Create a trigger that validates email format before insert',
                            },
                          ],
                        },
                      })
                    }
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: !canCreateTriggers
                          ? 'You need additional permissions to create triggers'
                          : 'Create with Supabase Assistant',
                      },
                    }}
                  />
                ) */}
              </div>
            )}
          </div>

          {isLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="触发器" />}

          <div className="w-full overflow-hidden overflow-x-auto">
            <Table
              head={
                <>
                  <Table.th key="name">名称</Table.th>
                  <Table.th key="table">表</Table.th>
                  <Table.th key="function">函数</Table.th>
                  <Table.th key="events">事件</Table.th>
                  <Table.th key="orientation">触发级别</Table.th>
                  <Table.th key="enabled" className="w-24">
                    是否启用
                  </Table.th>
                  <Table.th key="buttons" className="w-1/12"></Table.th>
                </>
              }
              body={
                <TriggerList
                  schema={selectedSchema}
                  filterString={filterString}
                  isLocked={isLocked}
                  editTrigger={editTrigger}
                  deleteTrigger={deleteTrigger}
                />
              }
            />
          </div>
        </div>
      )}
    </>
  )
}

export default TriggersList
