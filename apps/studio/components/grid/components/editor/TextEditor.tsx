import { Maximize } from 'lucide-react'
import { useCallback, useState } from 'react'
import type { RenderEditCellProps } from 'react-data-grid'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { useGetCellValueMutation } from 'data/table-rows/get-cell-value-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { Button, Popover, Tooltip, TooltipContent, TooltipTrigger, cn } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { BlockKeys } from '../common/BlockKeys'
import { EmptyValue } from '../common/EmptyValue'
import { MonacoEditor } from '../common/MonacoEditor'
import { NullValue } from '../common/NullValue'
import { TruncatedWarningOverlay } from './TruncatedWarningOverlay'
import { isValueTruncated } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'

export const TextEditor = <TRow, TSummaryRow = unknown>({
  row,
  column,
  isNullable,
  isEditable,
  onRowChange,
  onExpandEditor,
}: RenderEditCellProps<TRow, TSummaryRow> & {
  isNullable?: boolean
  isEditable?: boolean
  onExpandEditor: (column: string, row: TRow) => void
}) => {
  const snap = useTableEditorTableStateSnapshot()
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined
  const project = useSelectedProject()

  const { data: selectedTable } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  const gridColumn = snap.gridColumns.find((x) => x.name == column.key)
  const rawValue = row[column.key as keyof TRow] as unknown
  const initialValue = rawValue || rawValue === '' ? String(rawValue) : null
  const [isPopoverOpen, setIsPopoverOpen] = useState(true)
  const [value, setValue] = useState<string | null>(initialValue)
  const [isConfirmNextModalOpen, setIsConfirmNextModalOpen] = useState(false)

  const { mutate: getCellValue, isLoading, isSuccess } = useGetCellValueMutation()

  const isTruncated = isValueTruncated(initialValue)

  const loadFullValue = () => {
    if (selectedTable === undefined || project === undefined || !isTableLike(selectedTable)) return
    if (selectedTable.primary_keys.length === 0) {
      return toast('无法加载值，因为表没有主键')
    }

    const pkMatch = selectedTable.primary_keys.reduce((a, b) => {
      return { ...a, [b.name]: (row as any)[b.name] }
    }, {})

    getCellValue(
      {
        table: { schema: selectedTable.schema, name: selectedTable.name },
        column: column.name as string,
        pkMatch,
        projectRef: project?.ref,
        connectionString: project?.connectionString,
      },
      { onSuccess: (data) => setValue(data) }
    )
  }

  const cancelChanges = useCallback(() => {
    if (isEditable) onRowChange(row, true)
    setIsPopoverOpen(false)
  }, [])

  const saveChanges = useCallback(
    (newValue: string | null) => {
      if (isEditable && newValue !== value) {
        onRowChange({ ...row, [column.key]: newValue }, true)
      }
      setIsPopoverOpen(false)
    },
    [isSuccess]
  )

  const onSelectExpand = () => {
    cancelChanges()
    onExpandEditor(column.key, {
      ...row,
      [column.key]: value || (row as any)[column.key],
    })
  }

  const onChange = (_value: string | undefined) => {
    if (!isEditable) return
    if (!_value) setValue('')
    else setValue(_value)
  }

  return (
    <>
      <Popover
        open={isPopoverOpen}
        side="bottom"
        align="start"
        sideOffset={-35}
        className="rounded-none"
        overlay={
          isTruncated && !isSuccess ? (
            <div
              style={{ width: `${gridColumn?.width || column.width}px` }}
              className="flex items-center justify-center flex-col relative"
            >
              <MonacoEditor
                readOnly
                onChange={() => {}}
                width={`${gridColumn?.width || column.width}px`}
                value={value ?? ''}
                language="markdown"
              />
              <TruncatedWarningOverlay isLoading={isLoading} loadFullValue={loadFullValue} />
            </div>
          ) : (
            <BlockKeys
              value={value}
              onEscape={cancelChanges}
              onEnter={saveChanges}
              ignoreOutsideClicks={isConfirmNextModalOpen}
            >
              <MonacoEditor
                width={`${gridColumn?.width || column.width}px`}
                value={value ?? ''}
                readOnly={!isEditable}
                onChange={onChange}
              />
              {isEditable && (
                <div className="flex items-start justify-between p-2 bg-surface-200 space-x-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="px-1.5 py-[2.5px] rounded bg-surface-300 border border-strong flex items-center justify-center">
                        <span className="text-[10px]">⏎</span>
                      </div>
                      <p className="text-xs text-foreground-light">保存修改</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="px-1 py-[2.5px] rounded bg-surface-300 border border-strong flex items-center justify-center">
                        <span className="text-[10px]">Esc</span>
                      </div>
                      <p className="text-xs text-foreground-light">取消修改</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-y-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="default"
                          className="px-1"
                          onClick={() => onSelectExpand()}
                          icon={<Maximize size={12} strokeWidth={2} />}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="bottom">展开编辑器</TooltipContent>
                    </Tooltip>
                    {isNullable && (
                      <Button
                        size="tiny"
                        type="default"
                        htmlType="button"
                        onClick={() => setIsConfirmNextModalOpen(true)}
                      >
                        设为 NULL
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </BlockKeys>
          )
        }
      >
        <div
          className={cn(
            !!value && value.toString().trim().length === 0 && 'sb-grid-fill-container',
            'sb-grid-text-editor__trigger'
          )}
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        >
          {value === null ? <NullValue /> : value === '' ? <EmptyValue /> : value}
        </div>
      </Popover>
      <ConfirmationModal
        visible={isConfirmNextModalOpen}
        title="确认将值设为 NULL"
        confirmLabel="确认"
        onCancel={() => setIsConfirmNextModalOpen(false)}
        onConfirm={() => {
          saveChanges(null)
        }}
      >
        <p className="text-sm text-foreground-light">
          您确定想要将值设为 NULL 吗？本操作无法撤销。
        </p>
      </ConfirmationModal>
    </>
  )
}
