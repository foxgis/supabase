import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'
import type { ForeignKeyConstraint } from 'data/database/foreign-key-constraints-query'
import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { getForeignKeyCascadeAction } from '../ColumnEditor/ColumnEditor.utils'
import type { ForeignKey } from './ForeignKeySelector.types'

export const formatForeignKeys = (fks: ForeignKeyConstraint[]): ForeignKey[] => {
  return fks.map((x) => {
    return {
      id: x.id,
      name: x.constraint_name,
      tableId: x.target_id,
      schema: x.target_schema,
      table: x.target_table,
      columns: x.source_columns.map((y, i) => ({ source: y, target: x.target_columns[i] })),
      deletionAction: x.deletion_action,
      updateAction: x.update_action,
    }
  })
}

export const generateCascadeActionDescription = (
  action: 'update' | 'delete',
  cascadeAction: string,
  reference: string
) => {
  const actionVerb = action === 'update' ? '更新' : '删除'
  const actionName = getForeignKeyCascadeAction(cascadeAction) ?? '无操作'

  switch (cascadeAction) {
    case FOREIGN_KEY_CASCADE_ACTION.NO_ACTION:
      return (
        <>
          <span className="text-foreground-light">{actionName}</span>：{actionVerb}一条在{' '}
          <code className="text-xs text-foreground-light">{reference}</code> 中的记录，如果表中存在引用它的记录将会{' '}
          <span className="text-amber-900 opacity-75">报错</span>
        </>
      )
    case FOREIGN_KEY_CASCADE_ACTION.CASCADE:
      return (
        <>
          <span className="text-foreground-light">{actionName}</span>：{actionVerb}一条在{' '}
          <code className="text-xs text-foreground-light">{reference}</code> 中的记录， 也将会{' '}
          <span className="text-amber-900 opacity-75">{actionVerb}</span> 表中引用它的记录。
        </>
      )
    case FOREIGN_KEY_CASCADE_ACTION.RESTRICT:
      return (
        <>
          <span className="text-foreground-light">{actionName}</span>
          <Tooltip>
            <TooltipTrigger className="translate-y-[3px] mx-1">
              <HelpCircle className="text-foreground-light" size={16} strokeWidth={1.5} />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="w-80">
              此选项类似于无操作，但限制检查不能延迟到事务之后
            </TooltipContent>
          </Tooltip>
          : {actionVerb}一行在{' '}
          <code className="text-xs text-foreground-light">{reference}</code>中的记录，将会{' '}
          <span className="text-amber-900 opacity-75">阻止从表中自动{actionVerb.toLowerCase()}</span>{' '}
          引用的行。
        </>
      )
    case FOREIGN_KEY_CASCADE_ACTION.SET_DEFAULT:
      return (
        <>
          <span className="text-foreground-light">{actionName}</span>：{actionVerb}一条在{' '}
          <code className="text-xs text-foreground-light">{reference}</code>中的记录，会将表中引用它的记录设置为{' '}
          <span className="text-amber-900 opacity-75">默认值</span>
        </>
      )
    case FOREIGN_KEY_CASCADE_ACTION.SET_NULL:
      return (
        <>
          <span className="text-foreground-light">{actionName}</span>：{actionVerb}一条在{' '}
          <code className="text-xs text-foreground-light">{reference}</code> 中的记录， 会将表中引用它的记录设置为{' '}
          <span className="text-amber-900 opacity-75">NULL</span>
        </>
      )
  }
}
