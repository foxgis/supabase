import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { useEntityTypesQuery } from 'data/entity-types/entity-types-infinite-query'
import { useCheckPermissions, useLocalStorage } from 'hooks'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { useTableEditorStateSnapshot } from 'state/table-editor'

export interface EmptyStateProps {}

const EmptyState = ({}: EmptyStateProps) => {
  const snap = useTableEditorStateSnapshot()
  const isProtectedSchema = EXCLUDED_SCHEMAS.includes(snap.selectedSchemaName)
  const canCreateTables =
    useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables') && !isProtectedSchema

  const [sort] = useLocalStorage<'alphabetical' | 'grouped-alphabetical'>(
    'table-editor-sort',
    'alphabetical'
  )

  const { project } = useProjectContext()
  const { data } = useEntityTypesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: snap.selectedSchemaName,
    sort,
  })

  const totalCount = data?.pages?.[0].data.count ?? 0

  return (
    <div className="w-full h-full flex items-center justify-center">
      {totalCount === 0 ? (
        <ProductEmptyState
          title="Table Editor"
          ctaButtonLabel={canCreateTables ? 'Create a new table' : undefined}
          onClickCta={canCreateTables ? snap.onAddTable : undefined}
        >
          <p className="text-sm text-foreground-light">
            There are no tables available in this schema.
          </p>
        </ProductEmptyState>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <ProductEmptyState
            title="数据表"
            ctaButtonLabel={canCreateTables ? '创建表' : undefined}
            onClickCta={canCreateTables ? snap.onAddTable : undefined}
          >
            <p className="text-sm text-foreground-light">
              从左侧的面版中选择一张表查看数据
              {canCreateTables && '，或者新建一张表。'}
            </p>
          </ProductEmptyState>
        </div>
      )}
    </div>
  )
}

export default EmptyState
