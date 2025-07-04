import { Maximize } from 'lucide-react'
import { useCallback, useState } from 'react'
import type { RenderEditCellProps } from 'react-data-grid'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { useGetCellValueMutation } from 'data/table-rows/get-cell-value-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { prettifyJSON, removeJSONTrailingComma, tryParseJson } from 'lib/helpers'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { Popover, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { BlockKeys } from '../common/BlockKeys'
import { MonacoEditor } from '../common/MonacoEditor'
import { NullValue } from '../common/NullValue'
import { TruncatedWarningOverlay } from './TruncatedWarningOverlay'
import { isValueTruncated } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'

const verifyJSON = (value: string) => {
  try {
    JSON.parse(value)
    return true
  } catch (err) {
    return false
  }
}

interface JsonEditorProps<TRow, TSummaryRow = unknown>
  extends RenderEditCellProps<TRow, TSummaryRow> {
  isEditable: boolean
  onExpandEditor: (column: string, row: TRow) => void
}

const tryFormatInitialValue = (value: string) => {
  try {
    const jsonValue = JSON.parse(value)
    return JSON.stringify(jsonValue)
  } catch (err) {
    if (typeof value === 'string') {
      return value.replaceAll(`\"`, `"`)
    } else {
      return JSON.stringify(value)
    }
  }
}

export const JsonEditor = <TRow, TSummaryRow = unknown>({
  row,
  column,
  isEditable = true,
  onRowChange,
  onExpandEditor,
}: JsonEditorProps<TRow, TSummaryRow>) => {
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

  const rawInitialValue = row[column.key as keyof TRow] as unknown
  const initialValue =
    rawInitialValue === null || rawInitialValue === undefined || typeof rawInitialValue === 'string'
      ? rawInitialValue
      : JSON.stringify(rawInitialValue)

  const jsonString = prettifyJSON(initialValue ? tryFormatInitialValue(initialValue) : '')

  const isTruncated = isValueTruncated(initialValue)
  const [isPopoverOpen, setIsPopoverOpen] = useState(true)
  const [value, setValue] = useState<string | null>(jsonString)

  const { mutate: getCellValue, isLoading, isSuccess } = useGetCellValueMutation()

  const loadFullValue = () => {
    if (selectedTable === undefined || project === undefined || !isTableLike(selectedTable)) return
    if (selectedTable.primary_keys.length === 0) {
      return toast('Unable to load value as table has no primary keys')
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
      {
        onSuccess: (data) => {
          setValue(JSON.stringify(data))
        },
      }
    )
  }

  const cancelChanges = useCallback(() => {
    if (isEditable) onRowChange(row, true)
    setIsPopoverOpen(false)
  }, [])

  const saveChanges = useCallback(
    (newValue: string | null) => {
      const updatedValue = newValue !== null ? removeJSONTrailingComma(newValue) : newValue
      if (updatedValue !== value) {
        commitChange(newValue)
      } else {
        setIsPopoverOpen(false)
      }
    },
    [isSuccess]
  )

  const onChange = (_value: string | undefined) => {
    if (!isEditable) return
    if (!_value || _value == '') setValue(null)
    else setValue(_value)
  }

  const onSelectExpand = () => {
    cancelChanges()
    onExpandEditor(column.key, {
      ...row,
      [column.key]: tryParseJson(value) || (row as any)[column.key],
    })
  }

  const commitChange = (newValue: string | null) => {
    if (!isEditable) return

    if (!newValue) {
      onRowChange({ ...row, [column.key]: null }, true)
      setIsPopoverOpen(false)
    } else if (verifyJSON(newValue)) {
      const jsonValue = JSON.parse(newValue)
      onRowChange({ ...row, [column.key]: jsonValue }, true)
      setIsPopoverOpen(false)
    } else {
      toast.error('请输入有效的 JSON')
    }
  }

  return (
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
          <BlockKeys value={value} onEscape={cancelChanges} onEnter={saveChanges}>
            <MonacoEditor
              width={`${gridColumn?.width || column.width}px`}
              value={value ?? ''}
              language="json"
              readOnly={!isEditable}
              onChange={onChange}
            />
            <div className="flex items-start justify-between p-2 bg-surface-200 gap-x-2">
              {isEditable && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="px-1.5 py-[2.5px] rounded bg-selection border border-strong flex items-center justify-center">
                      <span className="text-[10px]">⏎</span>
                    </div>
                    <p className="text-xs text-foreground-light">保存变更</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="px-1 py-[2.5px] rounded bg-selection border border-strong flex items-center justify-center">
                      <span className="text-[10px]">Esc</span>
                    </div>
                    <p className="text-xs text-foreground-light">取消变更</p>
                  </div>
                </div>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={[
                      'border border-strong rounded p-1 flex items-center justify-center',
                      'transition cursor-pointer bg-selection hover:bg-border-strong',
                    ].join(' ')}
                    onClick={() => onSelectExpand()}
                  >
                    <Maximize size={12} strokeWidth={2} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center">
                  <span>展开编辑器</span>
                </TooltipContent>
              </Tooltip>
            </div>
          </BlockKeys>
        )
      }
    >
      <div
        className={`${
          !!value && jsonString.trim().length == 0 ? 'sb-grid-fill-container' : ''
        } sb-grid-json-editor__trigger`}
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
      >
        {value === null || value === '' ? <NullValue /> : jsonString}
      </div>
    </Popover>
  )
}
