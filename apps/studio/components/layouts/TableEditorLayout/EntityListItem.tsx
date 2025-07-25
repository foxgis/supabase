import saveAs from 'file-saver'
import { Clipboard, Copy, Download, Edit, Lock, MoreHorizontal, Trash, Unlock } from 'lucide-react'
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
import { EntityTypeIcon } from 'components/ui/EntityTypeIcon'
import type { ItemRenderer } from 'components/ui/InfiniteList'
import { getTableDefinition } from 'data/database/table-definition-query'
import { ENTITY_TYPE, ENTITY_TYPE_LABELS } from 'data/entity-types/entity-type-constants'
import { Entity } from 'data/entity-types/entity-types-infinite-query'
import { useProjectLintsQuery } from 'data/lint/lint-query'
import { EditorTablePageLink } from 'data/prefetchers/project.$ref.editor.$id'
import { getTableEditor } from 'data/table-editor/table-editor-query'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { fetchAllTableRows } from 'data/table-rows/table-rows-query'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { formatSql } from 'lib/formatSql'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
import {
  cn,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TreeViewItemVariant,
} from 'ui'
import { useProjectContext } from '../ProjectLayout/ProjectContext'

export interface EntityListItemProps {
  id: number | string
  projectRef: string
  isLocked: boolean
  isActive?: boolean
}

// [jordi] Used to determine the entity is a table and not a view or other unsupported entity type
function isTableLikeEntityListItem(entity: { type?: string }) {
  return entity?.type === ENTITY_TYPE.TABLE || entity?.type === ENTITY_TYPE.PARTITIONED_TABLE
}

const EntityListItem: ItemRenderer<Entity, EntityListItemProps> = ({
  id,
  projectRef,
  item: entity,
  isLocked,
  isActive: _isActive,
}) => {
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()
  const { selectedSchema } = useQuerySchemaState()

  const tabId = createTabId(entity.type, { id: entity.id })
  const tabs = useTabsStateSnapshot()
  const isPreview = tabs.previewTabId === tabId

  const isOpened = Object.values(tabs.tabsMap).some((tab) => tab.metadata?.tableId === entity.id)
  const isActive = Number(id) === entity.id
  const canEdit = isActive && !isLocked

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
      return console.error('数据库连接字符串是必需的')
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
      return console.error('未找到数据库连接字符串')
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

  return (
    <EditorTablePageLink
      title={entity.name}
      id={String(entity.id)}
      href={`/project/${projectRef}/editor/${entity.id}?schema=${entity.schema}`}
      role="button"
      aria-label={`查看 ${entity.name}`}
      className={cn(
        TreeViewItemVariant({
          isSelected: isActive && !isPreview,
          isOpened: isOpened && !isPreview,
          isPreview,
        }),
        'px-4'
      )}
      onDoubleClick={(e) => {
        e.preventDefault()
        const tabId = createTabId(entity.type, { id: entity.id })
        tabs.makeTabPermanent(tabId)
      }}
    >
      <>
        {isActive && <div className="absolute left-0 h-full w-0.5 bg-foreground" />}
        <Tooltip disableHoverableContent={true}>
          <TooltipTrigger className="min-w-4">
            <EntityTypeIcon type={entity.type}  geometryType={entity.geometry_type} isActive={isActive} />
          </TooltipTrigger>
          <TooltipContent side="bottom">{formatTooltipText(entity.type)}</TooltipContent>
        </Tooltip>
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
            <span className="block text-muted">{entity.comment}</span>
          </span>
          <EntityTooltipTrigger
            entity={entity}
            isActive={isActive}
            tableHasLints={tableHasLints}
            viewHasLints={viewHasLints}
            materializedViewHasLints={materializedViewHasLints}
          />
        </div>

        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger className="text-foreground-lighter transition-all text-transparent group-hover:text-foreground data-[state=open]:text-foreground">
              <MoreHorizontal size={14} strokeWidth={2} />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start" className="w-44">
              <DropdownMenuItem
                key="copy-name"
                className="space-x-2"
                onClick={(e) => {
                  e.stopPropagation()
                  copyToClipboard(entity.name)
                }}
              >
                <Clipboard size={12} />
                <span>复制表名</span>
              </DropdownMenuItem>

              {isTableLikeEntityListItem(entity) && (
                <DropdownMenuItem
                  key="copy-schema"
                  className="space-x-2"
                  onClick={async (e) => {
                    e.stopPropagation()
                    const toastId = toast.loading('获取表结构...')

                    const tableDefinition = await getTableDefinition({
                      id: entity.id,
                      projectRef: project?.ref,
                      connectionString: project?.connectionString,
                    })
                    if (!tableDefinition) {
                      return toast.error('获取表结构失败', { id: toastId })
                    }

                    try {
                      const formatted = formatSql(tableDefinition)
                      await copyToClipboard(formatted)
                      toast.success('表结构已复制到剪贴板', { id: toastId })
                    } catch (err: any) {
                      toast.error('复制表结构失败：' + (err.message || err), {
                        id: toastId,
                      })
                    }
                  }}
                >
                  <Clipboard size={12} />
                  <span>复制表结构</span>
                </DropdownMenuItem>
              )}

              {entity.type === ENTITY_TYPE.TABLE && (
                <>
                  <DropdownMenuSeparator />

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
                      <span>查看 RLS 策略</span>
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
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </>
    </EditorTablePageLink>
  )
}

const EntityTooltipTrigger = ({
  entity,
  isActive,
  tableHasLints,
  viewHasLints,
  materializedViewHasLints,
}: {
  entity: Entity
  isActive: boolean
  tableHasLints: boolean
  viewHasLints: boolean
  materializedViewHasLints: boolean
}) => {
  let tooltipContent = ''

  switch (entity.type) {
    case ENTITY_TYPE.TABLE:
      if (tableHasLints) {
        tooltipContent = 'RLS disabled'
      }
      break
    case ENTITY_TYPE.VIEW:
      if (viewHasLints) {
        tooltipContent = 'Security definer view'
      }
      break
    case ENTITY_TYPE.MATERIALIZED_VIEW:
      if (materializedViewHasLints) {
        tooltipContent = 'Security definer view'
      }
      break
    case ENTITY_TYPE.FOREIGN_TABLE:
      tooltipContent = 'RLS is not enforced on foreign tables'
      break
    default:
      break
  }

  if (tooltipContent) {
    return (
      <Tooltip disableHoverableContent={true}>
        <TooltipTrigger className="min-w-4">
          <Unlock
            size={14}
            strokeWidth={2}
            className={cn('min-w-4', isActive ? 'text-warning-600' : 'text-warning-500')}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span>{tooltipContent}</span>
        </TooltipContent>
      </Tooltip>
    )
  }

  return null
}

export default EntityListItem
