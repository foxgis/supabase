import type { PostgresTable } from '@supabase/postgres-meta'
import { some } from 'lodash'

import type { ForeignKeyConstraint } from 'data/database/foreign-key-constraints-query'
import {
  generateColumnField,
  generateColumnFieldFromPostgresColumn,
} from '../ColumnEditor/ColumnEditor.utils'
import type { ColumnField } from '../SidePanelEditor.types'
import { DEFAULT_COLUMNS } from './TableEditor.constants'
import type { ImportContent, TableField } from './TableEditor.types'

export const validateFields = (field: TableField) => {
  const errors = {} as any
  if (field.name.length === 0) {
    errors['name'] = '请提供表名'
  }
  if (some(field.columns, (column: ColumnField) => column.format.length === 0)) {
    errors['columns'] = '请确保所有列都已分配类型'
  }
  if (some(field.columns, (column: ColumnField) => column.name.length === 0)) {
    errors['columns'] = '请确保所有列都已命名'
  }
  return errors
}

export const generateTableField = (): TableField => {
  return {
    id: 0,
    name: '',
    comment: '',
    columns: DEFAULT_COLUMNS,
    isRLSEnabled: true,
    isRealtimeEnabled: false,
  }
}

export const generateTableFieldFromPostgresTable = (
  table: PostgresTable,
  foreignKeys: ForeignKeyConstraint[],
  isDuplicating = false,
  isRealtimeEnabled = false
): TableField => {
  return {
    id: table.id,
    name: isDuplicating ? `${table.name}（副本）` : table.name,
    comment: isDuplicating ? `这是表 ${table.name} 的副本` : table?.comment ?? '',
    columns: (table.columns ?? []).map((column) => {
      return generateColumnFieldFromPostgresColumn(column, table, foreignKeys)
    }),
    isRLSEnabled: table.rls_enabled,
    isRealtimeEnabled,
  }
}

export const formatImportedContentToColumnFields = (importContent: ImportContent) => {
  const { headers, selectedHeaders, columnTypeMap } = importContent
  const columnFields = headers
    .filter((header) => selectedHeaders.includes(header))
    .map((header) => {
      const columnType = columnTypeMap[header]
      return generateColumnField({ name: header, format: columnType })
    })
  return columnFields
}
