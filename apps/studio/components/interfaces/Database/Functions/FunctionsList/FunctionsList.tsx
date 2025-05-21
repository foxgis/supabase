import type { PostgresFunction } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop, partition } from 'lodash'
import { Search } from 'lucide-react'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabaseFunctionsQuery } from 'data/database-functions/database-functions-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { PROTECTED_SCHEMAS } from 'lib/constants/schemas'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { AiIconAnimation, Input } from 'ui'
import ProtectedSchemaWarning from '../../ProtectedSchemaWarning'
import FunctionList from './FunctionList'

interface FunctionsListProps {
  createFunction: () => void
  editFunction: (fn: PostgresFunction) => void
  deleteFunction: (fn: PostgresFunction) => void
}

const FunctionsList = ({
  createFunction = noop,
  editFunction = noop,
  deleteFunction = noop,
}: FunctionsListProps) => {
  const router = useRouter()
  const { search } = useParams()
  const { project } = useProjectContext()
  const aiSnap = useAiAssistantStateSnapshot()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()

  const filterString = search ?? ''

  const setFilterString = (str: string) => {
    const url = new URL(document.URL)
    if (str === '') {
      url.searchParams.delete('search')
    } else {
      url.searchParams.set('search', str)
    }
    router.push(url)
  }

  const canCreateFunctions = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'functions'
  )

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [protectedSchemas] = partition(schemas ?? [], (schema) =>
    PROTECTED_SCHEMAS.includes(schema?.name ?? '')
  )
  const foundSchema = schemas?.find((schema) => schema.name === selectedSchema)
  const isLocked = protectedSchemas.some((s) => s.id === foundSchema?.id)

  const {
    data: functions,
    error,
    isLoading,
    isError,
  } = useDatabaseFunctionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  if (isLoading) return <GenericSkeletonLoader />
  if (isError) return <AlertError error={error} subject="获取数据库函数失败" />

  return (
    <>
      {(functions ?? []).length == 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <ProductEmptyState
            title="函数"
            ctaButtonLabel="创建新函数"
            onClickCta={() => createFunction()}
            disabled={!canCreateFunctions}
            disabledMessage="您需要额外的权限才能创建函数"
          >
            <p className="text-sm text-foreground-light">
              PostgreSQL 函数，也称为存储过程，是一组 SQL 和过程命令，如声明、赋值、循环、流程控制等。
            </p>
            <p className="text-sm text-foreground-light">
              函数存储在数据库服务器上，并且可以通过 SQL 接口进行调用。
            </p>
          </ProductEmptyState>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
            <div className="flex flex-col lg:flex-row lg:items-center gap-2">
              <SchemaSelector
                className="w-full lg:w-[180px]"
                size="tiny"
                showError={false}
                selectedSchemaName={selectedSchema}
                onSelectSchema={(schema) => {
                  const url = new URL(document.URL)
                  url.searchParams.delete('search')
                  router.push(url)
                  setSelectedSchema(schema)
                }}
              />
              <Input
                placeholder="查找函数"
                size="tiny"
                icon={<Search size={14} />}
                value={filterString}
                className="w-full lg:w-52"
                onChange={(e) => setFilterString(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-x-2">
              {!isLocked && (
                <>
                  <ButtonTooltip
                    disabled={!canCreateFunctions}
                    onClick={() => createFunction()}
                    className="flex-grow"
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: !canCreateFunctions
                          ? '您需要额外的权限才能创建函数'
                          : undefined,
                      },
                    }}
                  >
                    创建函数
                  </ButtonTooltip>
                  {/* <ButtonTooltip
                    type="default"
                    disabled={!canCreateFunctions}
                    className="px-1 pointer-events-auto"
                    icon={<AiIconAnimation size={16} />}
                    onClick={() =>
                      aiSnap.newChat({
                        name: 'Create new function',
                        open: true,
                        initialInput: `Create a new function for the schema ${selectedSchema} that does ...`,
                      })
                    }
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: !canCreateFunctions
                          ? 'You need additional permissions to create functions'
                          : 'Create with Supabase Assistant',
                      },
                    }}
                  /> */}
                </>
              )}
            </div>
          </div>

          {isLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="函数" />}

          <Table
            className="table-fixed overflow-x-auto"
            head={
              <>
                <Table.th key="name">名称</Table.th>
                <Table.th key="arguments" className="table-cell">
                  参数
                </Table.th>
                <Table.th key="return_type" className="table-cell">
                  返回值类型
                </Table.th>
                <Table.th key="security" className="table-cell w-[120px]">
                  调用权限
                </Table.th>
                <Table.th key="buttons" className="w-1/6"></Table.th>
              </>
            }
            body={
              <FunctionList
                schema={selectedSchema}
                filterString={filterString}
                isLocked={isLocked}
                editFunction={editFunction}
                deleteFunction={deleteFunction}
              />
            }
          />
        </div>
      )}
    </>
  )
}

export default FunctionsList
