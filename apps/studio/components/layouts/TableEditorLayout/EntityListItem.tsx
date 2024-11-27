import * as Tooltip from '@radix-ui/react-tooltip'
import saveAs from 'file-saver'
import {
  Copy,
  Download,
  Edit,
  Eye,
  Lock,
  MoreHorizontal,
  Table2,
  Trash,
  Unlock,
  Shapes,
  Waypoints,
  MapPin,
} from 'lucide-react'
import Link from 'next/link'
import Papa from 'papaparse'
import { toast } from 'sonner'

import { IS_PLATFORM } from 'common'
import {
  MAX_EXPORT_ROW_COUNT,
  MAX_EXPORT_ROW_COUNT_MESSAGE,
} from 'components/grid/components/header/Header'
import { parseSupaTable } from 'components/grid/SupabaseGrid.utils'
import {
  formatTableRowsToSQL,
  getEntityLintDetails,
} from 'components/interfaces/TableGridEditor/TableEntity.utils'
import type { ItemRenderer } from 'components/ui/InfiniteList'
import { ENTITY_TYPE, ENTITY_TYPE_LABELS } from 'data/entity-types/entity-type-constants'
import { Entity } from 'data/entity-types/entity-types-infinite-query'
import { useProjectLintsQuery } from 'data/lint/lint-query'
import { EditorTablePageLink } from 'data/prefetchers/project.$ref.editor.$id'
import { getTableEditor } from 'data/table-editor/table-editor-query'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { fetchAllTableRows } from 'data/table-rows/table-rows-query'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'ui'
import { useProjectContext } from '../ProjectLayout/ProjectContext'

export interface EntityListItemProps {
  id: number
  projectRef: string
  isLocked: boolean
}

const EntityListItem: ItemRenderer<Entity, EntityListItemProps> = ({
  id,
  projectRef,
  item: entity,
  isLocked,
}) => {
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()
  const { selectedSchema } = useQuerySchemaState()

  const isActive = Number(id) === entity.id

  const { data: lints = [] } = useProjectLintsQuery({
    projectRef: project?.ref,
  })

  const tableHasLints: boolean = getEntityLintDetails(
    entity.name,
    'rls_disabled_in_public',
    ['ERROR'],
    lints,
    selectedSchema
  ).hasLint

  const viewHasLints: boolean = getEntityLintDetails(
    entity.name,
    'security_definer_view',
    ['ERROR', 'WARN'],
    lints,
    selectedSchema
  ).hasLint

  const materializedViewHasLints: boolean = getEntityLintDetails(
    entity.name,
    'materialized_view_in_api',
    ['ERROR', 'WARN'],
    lints,
    selectedSchema
  ).hasLint

  const formatTooltipText = (entityType: string) => {
    return ENTITY_TYPE_LABELS[entityType as ENTITY_TYPE]
  }

  const exportTableAsCSV = async () => {
    if (IS_PLATFORM && !project?.connectionString) {
      return console.error('连接字符串是必需的')
    }
    const toastId = toast.loading(`导出 ${entity.name} 为 CSV...`)

    try {
      const table = await getTableEditor({
        id: entity.id,
        projectRef,
        connectionString: project?.connectionString,
      })
      if (isTableLike(table) && table.live_rows_estimate > MAX_EXPORT_ROW_COUNT) {
        return toast.error(
          <div className="text-foreground prose text-sm">{MAX_EXPORT_ROW_COUNT_MESSAGE}</div>,
          { id: toastId }
        )
      }

      const supaTable = table && parseSupaTable(table)

      if (!supaTable) {
        return toast.error(`导出表失败：${entity.name}`, { id: toastId })
      }

      const rows = await fetchAllTableRows({
        projectRef,
        connectionString: project?.connectionString,
        table: supaTable,
      })
      const formattedRows = rows.map((row) => {
        const formattedRow = row
        Object.keys(row).map((column) => {
          if (typeof row[column] === 'object' && row[column] !== null)
            formattedRow[column] = JSON.stringify(formattedRow[column])
        })
        return formattedRow
      })

      if (formattedRows.length > 0) {
        const csv = Papa.unparse(formattedRows, {
          columns: supaTable.columns.map((column) => column.name),
        })
        const csvData = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        saveAs(csvData, `${entity!.name}_rows.csv`)
      }

      toast.success(`成功导出 ${entity.name} 为 CSV`, { id: toastId })
    } catch (error: any) {
      toast.error(`导出表失败：${error.message}`, { id: toastId })
    }
  }

  const exportTableAsSQL = async () => {
    if (IS_PLATFORM && !project?.connectionString) {
      return console.error('未找到连接字符串')
    }
    const toastId = toast.loading(`正在将 ${entity.name} 导出为SQL...`)

    try {
      const table = await getTableEditor({
        id: entity.id,
        projectRef,
        connectionString: project?.connectionString,
      })

      if (isTableLike(table) && table.live_rows_estimate > MAX_EXPORT_ROW_COUNT) {
        return toast.error(
          <div className="text-foreground prose text-sm">{MAX_EXPORT_ROW_COUNT_MESSAGE}</div>,
          { id: toastId }
        )
      }

      const supaTable = table && parseSupaTable(table)

      if (!supaTable) {
        return toast.error(`导出实体失败：${entity.name}`, { id: toastId })
      }

      const rows = await fetchAllTableRows({
        projectRef,
        connectionString: project?.connectionString,
        table: supaTable,
      })
      const formattedRows = rows.map((row) => {
        const formattedRow = row
        Object.keys(row).map((column) => {
          if (typeof row[column] === 'object' && row[column] !== null)
            formattedRow[column] = JSON.stringify(formattedRow[column])
        })
        return formattedRow
      })

      if (formattedRows.length > 0) {
        const sqlStatements = formatTableRowsToSQL(supaTable, formattedRows)
        const sqlData = new Blob([sqlStatements], { type: 'text/sql;charset=utf-8;' })
        saveAs(sqlData, `${entity!.name}_rows.sql`)
      }

      toast.success(`成功将 ${entity.name} 导出为 SQL`, { id: toastId })
    } catch (error: any) {
      toast.error(`导出表失败：${error.message}`, { id: toastId })
    }
  }

  const EntityTooltipTrigger = ({ entity }: { entity: Entity }) => {
    let tooltipContent = null

    switch (entity.type) {
      case ENTITY_TYPE.TABLE:
        if (tableHasLints) {
          tooltipContent = 'RLS 已禁用'
        }
        break
      case ENTITY_TYPE.VIEW:
        if (viewHasLints) {
          tooltipContent = 'Security Definer 视图'
        }
        break
      case ENTITY_TYPE.MATERIALIZED_VIEW:
        if (materializedViewHasLints) {
          tooltipContent = 'Security Definer 视图'
        }

        break
      case ENTITY_TYPE.FOREIGN_TABLE:
        tooltipContent = 'RLS 不在外部表上生效'

        break
      default:
        break
    }

    if (tooltipContent) {
      return (
        <Tooltip.Root delayDuration={0} disableHoverableContent={true}>
          <Tooltip.Trigger className="min-w-4" asChild>
            <Unlock
              size={14}
              strokeWidth={2}
              className={cn('min-w-4', isActive ? 'text-warning-600' : 'text-warning-500')}
            />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              side="bottom"
              className={[
                'rounded bg-alternative py-1 px-2 leading-none shadow',
                'border border-background',
                'text-xs text-foreground',
              ].join(' ')}
            >
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              {tooltipContent}
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      )
    }

    return null
  }

  return (
    <EditorTablePageLink
      title={entity.name}
      id={String(entity.id)}
      href={`/project/${projectRef}/editor/${entity.id}?schema=${selectedSchema}`}
      role="button"
      aria-label={`View ${entity.name}`}
      className={cn(
        'w-full',
        'flex items-center gap-2',
        'py-1 px-2',
        'text-light',
        'rounded-md',
        isActive ? 'bg-selection' : 'hover:bg-surface-200 focus:bg-surface-200',
        'group',
        'transition'
      )}
    >
      <Tooltip.Root delayDuration={0} disableHoverableContent={true}>
        <Tooltip.Trigger className="min-w-4" asChild>
          {entity.geometry_type?.toLowerCase().includes('point') ? (
            <MapPin
              size={15}
              strokeWidth={1.5}
              className={cn(
                'text-foreground-muted group-hover:text-foreground-lighter',
                isActive && 'text-foreground-lighter',
                'transition-colors'
              )}
            />
          ) : entity.geometry_type?.toLowerCase().includes('linestring') ? (
            <Waypoints
              size={15}
              strokeWidth={1.5}
              className={cn(
                'text-foreground-muted group-hover:text-foreground-lighter',
                isActive && 'text-foreground-lighter',
                'transition-colors'
              )}
            />
          ) : entity.geometry_type?.toLowerCase().includes('polygon') ? (
            <Shapes
              size={15}
              strokeWidth={1.5}
              className={cn(
                'text-foreground-muted group-hover:text-foreground-lighter',
                isActive && 'text-foreground-lighter',
                'transition-colors'
              )}
            />
          ) : entity.type === ENTITY_TYPE.TABLE ? (
            <Table2
              size={15}
              strokeWidth={1.5}
              className={cn(
                'text-foreground-muted group-hover:text-foreground-lighter',
                isActive && 'text-foreground-lighter',
                'transition-colors'
              )}
            />
          ) : entity.type === ENTITY_TYPE.VIEW ? (
            <Eye
              size={15}
              strokeWidth={1.5}
              className={cn(
                'text-foreground-muted group-hover:text-foreground-lighter',
                isActive && 'text-foreground-lighter',
                'transition-colors'
              )}
            />
          ) : (
            <div
              className={cn(
                'flex items-center justify-center text-xs h-4 w-4 rounded-[2px] font-bold',
                entity.type === ENTITY_TYPE.FOREIGN_TABLE && 'text-yellow-900 bg-yellow-500',
                entity.type === ENTITY_TYPE.MATERIALIZED_VIEW && 'text-purple-1000 bg-purple-500',
                entity.type === ENTITY_TYPE.PARTITIONED_TABLE &&
                  'text-foreground-light bg-border-stronger'
              )}
            >
              {Object.entries(ENTITY_TYPE)
                .find(([, value]) => value === entity.type)?.[0]?.[0]
                ?.toUpperCase()}
            </div>
          )}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="bottom"
            className={[
              'rounded bg-alternative py-1 px-2 leading-none shadow',
              'border border-background',
              'text-xs text-foreground capitalize',
            ].join(' ')}
          >
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            {formatTooltipText(entity.type)}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
      <div
        className={cn(
          'truncate',
          'overflow-hidden text-ellipsis whitespace-nowrap flex items-center gap-2 relative w-full',
          isActive && 'text-foreground'
        )}
      >
        <span
          className={cn(
            isActive ? 'text-foreground' : 'text-foreground-light group-hover:text-foreground',
            'text-sm',
            'transition',
            'truncate'
          )}
        >
          {entity.name}
          <span className="block text-muted font-normal truncate">{entity.comment}</span>
        </span>
        <EntityTooltipTrigger entity={entity} />
      </div>

      {entity.type === ENTITY_TYPE.TABLE && isActive && !isLocked && (
        <DropdownMenu>
          <DropdownMenuTrigger className="text-foreground-lighter transition-all hover:text-foreground data-[state=open]:text-foreground">
            <MoreHorizontal size={14} strokeWidth={2} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start" className="w-44">
            <DropdownMenuItem
              key="edit-table"
              className="space-x-2"
              onClick={(e) => {
                e.stopPropagation()
                snap.onEditTable()
              }}
            >
              <Edit size={12} />
              <span>编辑表</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              key="duplicate-table"
              className="space-x-2"
              onClick={(e) => {
                e.stopPropagation()
                snap.onDuplicateTable()
              }}
            >
              <Copy size={12} />
              <span>复制表</span>
            </DropdownMenuItem>
            <DropdownMenuItem key="view-policies" className="space-x-2" asChild>
              <Link
                key="view-policies"
                href={`/project/${projectRef}/auth/policies?schema=${selectedSchema}&search=${entity.id}`}
              >
                <Lock size={12} />
                <span>查看策略</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-x-2">
                <Download size={12} />
                导出数据
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  key="download-table-csv"
                  className="space-x-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    exportTableAsCSV()
                  }}
                >
                  <span>导出表为 CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  key="download-table-sql"
                  className="gap-x-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    exportTableAsSQL()
                  }}
                >
                  <span>导出表为 SQL</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              key="delete-table"
              className="gap-x-2"
              onClick={(e) => {
                e.stopPropagation()
                snap.onDeleteTable()
              }}
            >
              <Trash size={12} />
              <span>删除表</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </EditorTablePageLink>
  )
}

export default EntityListItem
