import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop, partition } from 'lodash'
import { useState } from 'react'
import { Button, Input } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlphaPreview from 'components/to-be-cleaned/AlphaPreview'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabaseTriggersQuery } from 'data/database-triggers/database-triggers-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { Search } from 'lucide-react'
import ProtectedSchemaWarning from '../../ProtectedSchemaWarning'
import TriggerList from './TriggerList'

interface TriggersListProps {
  createTrigger: () => void
  editTrigger: (trigger: any) => void
  deleteTrigger: (trigger: any) => void
}

const TriggersList = ({
  createTrigger = noop,
  editTrigger = noop,
  deleteTrigger = noop,
}: TriggersListProps) => {
  const { project } = useProjectContext()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const [filterString, setFilterString] = useState<string>('')

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [protectedSchemas] = partition(schemas ?? [], (schema) =>
    EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
  )
  const schema = schemas?.find((schema) => schema.name === selectedSchema)
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

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
          <div className="flex items-center gap-2 flex-wrap">
            <SchemaSelector
              className="w-[260px]"
              size="small"
              showError={false}
              selectedSchemaName={selectedSchema}
              onSelectSchema={setSelectedSchema}
            />
            <Input
              placeholder="查找触发器"
              size="small"
              icon={<Search size="14" />}
              value={filterString}
              className="w-64"
              onChange={(e) => setFilterString(e.target.value)}
            />
            {!isLocked && (
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger asChild>
                  <Button
                    className="ml-auto"
                    disabled={!canCreateTriggers}
                    onClick={() => createTrigger()}
                  >
                    创建新触发器
                  </Button>
                </Tooltip.Trigger>
                {!canCreateTriggers && (
                  <Tooltip.Portal>
                    <Tooltip.Content side="bottom">
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                      <div
                        className={[
                          'rounded bg-alternative py-1 px-2 leading-none shadow',
                          'border border-background',
                        ].join(' ')}
                      >
                        <span className="text-xs text-foreground">
                          您需要额外的权限才能创建触发器
                        </span>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>
            )}
          </div>

          {isLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="触发器" />}

          <Table
            head={
              <>
                <Table.th key="name">名称</Table.th>
                <Table.th key="table">表</Table.th>
                <Table.th key="function">函数</Table.th>
                <Table.th key="events">事件</Table.th>
                <Table.th key="orientation">触发方式</Table.th>
                <Table.th key="enabled" className="w-20">
                  Enabled
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
      )}
    </>
  )
}

export default TriggersList
