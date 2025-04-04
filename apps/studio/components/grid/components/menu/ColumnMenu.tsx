import { ChevronDown, Edit, Lock, Trash, Unlock } from 'lucide-react'
import type { CalculatedColumn } from 'react-data-grid'

import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

interface ColumnMenuProps {
  column: CalculatedColumn<any, unknown>
  isEncrypted?: boolean
}

const ColumnMenu = ({ column, isEncrypted }: ColumnMenuProps) => {
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()

  const columnKey = column.key

  function onFreezeColumn() {
    snap.freezeColumn(columnKey)
  }

  function onUnfreezeColumn() {
    snap.unfreezeColumn(columnKey)
  }

  function onEditColumn() {
    const pgColumn = snap.originalTable.columns.find((c) => c.name === column.name)
    if (pgColumn) {
      tableEditorSnap.onEditColumn(pgColumn)
    }
  }

  function onDeleteColumn() {
    const pgColumn = snap.originalTable.columns.find((c) => c.name === column.name)
    if (pgColumn) {
      tableEditorSnap.onDeleteColumn(pgColumn)
    }
  }

  function renderMenu() {
    return (
      <>
        {snap.editable && (
          <Tooltip>
            <TooltipTrigger asChild className={`${isEncrypted ? 'opacity-50' : ''}`}>
              <DropdownMenuItem className="space-x-2" onClick={onEditColumn} disabled={isEncrypted}>
                <Edit size={14} />
                <p>编辑列</p>
              </DropdownMenuItem>
            </TooltipTrigger>
            {isEncrypted && (
              <TooltipContent side="bottom">加密列不能被编辑</TooltipContent>
            )}
          </Tooltip>
        )}
        <DropdownMenuItem
          className="space-x-2"
          onClick={column.frozen ? onUnfreezeColumn : onFreezeColumn}
        >
          {column.frozen ? (
            <>
              <Unlock size={14} />
              <p>解冻列</p>
            </>
          ) : (
            <>
              <Lock size={14} />
              <p>冻结列</p>
            </>
          )}
        </DropdownMenuItem>
        {snap.editable && (
          <>
            <Separator />
            <DropdownMenuItem className="space-x-2" onClick={onDeleteColumn}>
              <Trash size={14} stroke="red" />
              <p>删除列</p>
            </DropdownMenuItem>
          </>
        )}
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="opacity-50 flex"
            type="text"
            style={{ padding: '3px' }}
            onClick={(e) => {
              e.stopPropagation()
            }}
            icon={<ChevronDown />}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom">
          {renderMenu()}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

export default ColumnMenu
