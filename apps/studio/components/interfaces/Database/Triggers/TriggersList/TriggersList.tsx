import { PostgresTrigger } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'

import AlphaPreview from 'components/to-be-cleaned/AlphaPreview'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabaseTriggersQuery } from 'data/database-triggers/database-triggers-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIsProtectedSchema, useProtectedSchemas } from 'hooks/useProtectedSchemas'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import {
  AiIconAnimation,
  Input,
  Card,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from 'ui'
import { ProtectedSchemaWarning } from '../../ProtectedSchemaWarning'
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
  const { data: project } = useSelectedProjectQuery()
  const aiSnap = useAiAssistantStateSnapshot()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const [filterString, setFilterString] = useState<string>('')

  const { data: protectedSchemas } = useProtectedSchemas()
  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

  const { data = [] } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const hasTables =
    data.filter((a) => !protectedSchemas.find((s) => s.name === a.schema)).length > 0

  const {
    data: triggers,
    error,
    isLoading,
    isError,
  } = useDatabaseTriggersQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { can: canCreateTriggers } = useAsyncCheckProjectPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'triggers'
  )

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
            {!isSchemaLocked && (
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

          {isSchemaLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="触发器" />}

          <div className="w-full overflow-hidden overflow-x-auto">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead key="name">名称</TableHead>
                    <TableHead key="table">表</TableHead>
                    <TableHead key="function">函数</TableHead>
                    <TableHead key="events">事件</TableHead>
                    <TableHead key="orientation">触发级别</TableHead>
                    <TableHead key="enabled" className="w-20">
                      已启用
                    </TableHead>
                    <TableHead key="buttons" className="w-1/12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TriggerList
                    schema={selectedSchema}
                    filterString={filterString}
                    isLocked={isSchemaLocked}
                    editTrigger={editTrigger}
                    deleteTrigger={deleteTrigger}
                  />
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}

export default TriggersList
