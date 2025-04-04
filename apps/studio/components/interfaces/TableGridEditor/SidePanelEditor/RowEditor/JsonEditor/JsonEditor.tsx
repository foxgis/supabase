import { AlignLeft } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { useGetCellValueMutation } from 'data/table-rows/get-cell-value-mutation'
import { MAX_CHARACTERS } from '@supabase/pg-meta/src/query/table-row-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { minifyJSON, prettifyJSON, removeJSONTrailingComma, tryParseJson } from 'lib/helpers'
import { Button, SidePanel, cn } from 'ui'
import ActionBar from '../../ActionBar'
import { isValueTruncated } from '../RowEditor.utils'
import { DrilldownViewer } from './DrilldownViewer'
import JsonCodeEditor from './JsonCodeEditor'

interface JsonEditProps {
  row?: { [key: string]: any }
  column: string
  visible: boolean
  backButtonLabel?: string
  applyButtonLabel?: string
  readOnly?: boolean
  closePanel: () => void
  onSaveJSON: (value: string | number | null, resolve: () => void) => void
}

const JsonEdit = ({
  row,
  column,
  visible,
  backButtonLabel,
  applyButtonLabel,
  readOnly = false,
  closePanel,
  onSaveJSON,
}: JsonEditProps) => {
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined
  const project = useSelectedProject()

  const { data: selectedTable } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  const [view, setView] = useState<'编辑' | '查看'>('编辑')
  const [jsonStr, setJsonStr] = useState('')
  // sometimes the value is a JSON object if it was truncated, then fully loaded from the grid.
  const value = row?.[column as keyof typeof row] as unknown
  const jsonString = typeof value === 'object' ? JSON.stringify(value) : (value as string)
  const isTruncated = isValueTruncated(jsonString)

  const { mutate: getCellValue, isLoading, isSuccess, reset } = useGetCellValueMutation()

  const validateJSON = async (resolve: () => void) => {
    try {
      const newJsonStr = removeJSONTrailingComma(jsonStr)
      const minifiedJSON = minifyJSON(newJsonStr)
      if (onSaveJSON) onSaveJSON(minifiedJSON, resolve)
    } catch (error: any) {
      resolve()
      toast.error('似乎不是有效的 JSON 结构。')
    }
  }

  const prettify = () => {
    const res = prettifyJSON(jsonStr)
    setJsonStr(res)
  }

  const loadFullValue = () => {
    if (
      selectedTable === undefined ||
      project === undefined ||
      row === undefined ||
      !isTableLike(selectedTable)
    )
      return
    if (selectedTable.primary_keys.length === 0) {
      return toast('表没有主键导致不能加载值')
    }

    const pkMatch = selectedTable.primary_keys.reduce((a, b) => {
      return { ...a, [b.name]: (row as any)[b.name] }
    }, {})

    getCellValue(
      {
        table: { schema: selectedTable.schema, name: selectedTable.name },
        column: column,
        pkMatch,
        projectRef: project?.ref,
        connectionString: project?.connectionString,
      },
      {
        onSuccess: (data) => {
          setJsonStr(JSON.stringify(data))
        },
      }
    )
  }

  useEffect(() => {
    if (visible) {
      const temp = prettifyJSON(jsonString)
      setJsonStr(temp)
    }
  }, [visible])

  // reset the mutation when the panel closes. Fixes an issue where the value is truncated if you close and reopen the
  // panel again
  const onClose = useCallback(() => {
    reset()
    closePanel()
  }, [reset])

  return (
    <SidePanel
      size="large"
      header={
        <div className="flex items-center justify-between">
          {view === '编辑' ? (
            <p>
              {readOnly ? '正在查看' : '正在编辑'}JSON 字段：<code>{column}</code>
            </p>
          ) : (
            <p>
              正在查看JSON 字段：<code>{column}</code>
            </p>
          )}
          {(!isTruncated || (isTruncated && isSuccess)) && (
            <div className="flex items-center gap-x-2">
              {view === '编辑' && (
                <ButtonTooltip
                  type="default"
                  icon={<AlignLeft />}
                  className="px-1"
                  onClick={() => prettify()}
                  tooltip={{ content: { side: 'bottom', text: '格式化 JSON' } }}
                />
              )}
              <TwoOptionToggle
                options={['查看', '编辑']}
                activeOption={view}
                borderOverride="border-muted"
                onClickOption={setView}
              />
            </div>
          )}
        </div>
      }
      visible={visible}
      onCancel={onClose}
      customFooter={
        <ActionBar
          hideApply={readOnly}
          closePanel={onClose}
          backButtonLabel={backButtonLabel}
          applyButtonLabel={applyButtonLabel}
          applyFunction={readOnly ? undefined : validateJSON}
        />
      }
    >
      <div className="flex flex-auto h-full flex-col gap-y-4 relative">
        {view === '编辑' ? (
          <div className="w-full h-full flex-grow">
            <JsonCodeEditor
              key={jsonString}
              readOnly={readOnly}
              onInputChange={(val) => setJsonStr(val ?? '')}
              value={jsonStr.toString()}
            />
          </div>
        ) : (
          <DrilldownViewer jsonData={tryParseJson(jsonStr)} />
        )}
        {isTruncated && !isSuccess && (
          <div
            className={cn(
              'absolute top-0 left-0 flex items-center justify-center flex-col gap-y-3',
              'text-sm w-full h-full px-2 text-center',
              'bg-default/80 backdrop-blur-[1.5px]'
            )}
          >
            <div className="flex flex-col gap-y-1 w-80">
              <p>JSON 长度超过 {MAX_CHARACTERS.toLocaleString()} 个字符</p>
              <p className="text-foreground-light">
                您可以尝试渲染整个 JSON 数据，但您的浏览器可能会遇到性能问题
              </p>
            </div>
            <Button type="default" loading={isLoading} onClick={loadFullValue}>
              加载完整 JSON 数据
            </Button>
          </div>
        )}
      </div>
    </SidePanel>
  )
}

export default JsonEdit
