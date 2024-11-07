import clsx from 'clsx'
import { AlertCircle, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge, Button, Collapsible, SidePanel } from 'ui'
import type { SpreadsheetData } from './SpreadsheetImport.types'
import SpreadsheetPreviewGrid from './SpreadsheetPreviewGrid'

const MAX_ROWS = 20
const MAX_HEADERS = 20

interface SpreadsheetImportPreviewProps {
  selectedTable?: { name: string }
  spreadsheetData: SpreadsheetData
  errors?: any[]
  selectedHeaders: string[]
  incompatibleHeaders: string[]
}

const SpreadsheetImportPreview = ({
  selectedTable,
  spreadsheetData,
  errors = [],
  selectedHeaders,
  incompatibleHeaders,
}: SpreadsheetImportPreviewProps) => {
  const [expandPreview, setExpandPreview] = useState(false)
  const [expandedErrors, setExpandedErrors] = useState<string[]>([])

  const { headers, rows } = spreadsheetData
  const previewHeaders = headers
    .filter((header) => selectedHeaders.includes(header))
    .slice(0, MAX_HEADERS)
  const previewRows = rows.slice(0, MAX_ROWS)

  const isCompatible = selectedTable !== undefined ? incompatibleHeaders.length === 0 : true

  useEffect(() => {
    setExpandPreview(true)
  }, [spreadsheetData])

  const onSelectExpandError = (key: string) => {
    if (expandedErrors.includes(key)) {
      setExpandedErrors(expandedErrors.filter((error) => error !== key))
    } else {
      setExpandedErrors(expandedErrors.concat([key]))
    }
  }

  return (
    <Collapsible open={expandPreview} onOpenChange={setExpandPreview} className={''}>
      <Collapsible.Trigger asChild>
        <SidePanel.Content>
          <div className="py-1 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm">预览将要导入的数据</p>
              {!isCompatible && <Badge variant="destructive">数据不兼容</Badge>}
              发现了 {errors.length > 0 && <Badge variant="warning">{errors.length} 个问题</Badge>}
            </div>
            <Button
              type="text"
              icon={
                <ChevronDown
                  size={18}
                  strokeWidth={2}
                  className={clsx('text-foreground-light', expandPreview && 'rotate-180')}
                />
              }
              className="px-1"
              onClick={() => setExpandPreview(!expandPreview)}
            />
          </div>
        </SidePanel.Content>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <SidePanel.Content>
          <div className="mb-4">
            <p className="text-sm text-foreground-light">
              {selectedTable === undefined
                ? `Your table will have ${spreadsheetData.rowCount.toLocaleString()} rows and the
                        following ${spreadsheetData.headers.length} columns.`
                : `A total of ${spreadsheetData.rowCount.toLocaleString()} rows will be added to the table "${
                    selectedTable.name
                  }"`}
            </p>
            <p className="text-sm text-foreground-light">
              这里是将要添加的数据的预览（最多显示前 20 列和前 20 行）。
            </p>
          </div>
          <div className="mb-4">
            {previewHeaders.length > 0 && previewRows.length > 0 ? (
              <SpreadsheetPreviewGrid height={350} headers={previewHeaders} rows={previewRows} />
            ) : (
              <div className="flex items-center justify-center py-4 border border-control rounded-md space-x-2">
                <AlertCircle size={16} strokeWidth={1.5} className="text-foreground-light" />
                <p className="text-sm text-foreground-light">
                  {previewHeaders.length === 0
                    ? 'No headers have been selected'
                    : previewRows.length === 0
                      ? 'Your CSV contains no data'
                      : ''}
                </p>
              </div>
            )}
          </div>
          {(!isCompatible || errors.length > 0) && (
            <div className="space-y-2 my-4">
              <div className="flex flex-col space-y-1">
                <p className="text-sm">在表格数据中发现了问题</p>
                {isCompatible && (
                  <p className="text-sm text-foreground-light">
                    {selectedTable !== undefined
                      ? '尽管在以下行中发现了问题，仍然可以将这个 CSV 导入到您的表中。'
                      : '尽管在以下行中发现了问题，仍然可以创建您的表。'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                {!isCompatible && (
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <div className="w-[14px] h-[14px] flex items-center justify-center translate-y-[3px]">
                        <div className="w-[6px] h-[6px] rounded-full bg-foreground-lighter" />
                      </div>
                      <p className="text-sm">
                        这个 CSV <span className="text-red-900">不能</span> 被导入到您的表中，因为以下列不匹配：
                        <br />
                        您的表不存在这些列： {incompatibleHeaders.length > 1 ? '' : ''}{' '}
                        {incompatibleHeaders.map((x) => `"${x}"`).join('，')}{' '}
                        {incompatibleHeaders.length > 1 ? '' : ''}
                      </p>
                    </div>
                  </div>
                )}
                {errors.map((error: any, idx: number) => {
                  const key = `import-error-${idx}`
                  const isExpanded = expandedErrors.includes(key)

                  return (
                    <div key={key} className="space-y-2">
                      <div
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={() => onSelectExpandError(key)}
                      >
                        {error.data !== undefined ? (
                          <ChevronRight
                            size={14}
                            className={`transform ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        ) : (
                          <div className="w-[14px] h-[14px] flex items-center justify-center">
                            <div className="w-[6px] h-[6px] rounded-full bg-foreground-lighter" />
                          </div>
                        )}
                        {error.data !== undefined && (
                          <p className="text-sm w-14">Row: {error.row}</p>
                        )}
                        <p className="text-sm">{error.message}</p>
                        {error.data?.__parsed_extra && (
                          <>
                            <ArrowRight size={14} />
                            <p className="text-sm">额外的列：</p>
                            {error.data?.__parsed_extra.map((value: any, i: number) => (
                              <code key={i} className="text-xs">
                                {value}
                              </code>
                            ))}
                          </>
                        )}
                      </div>
                      {error.data !== undefined && isExpanded && (
                        <SpreadsheetPreviewGrid
                          headers={spreadsheetData.headers}
                          rows={[error.data]}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </SidePanel.Content>
      </Collapsible.Content>
    </Collapsible>
  )
}

export default SpreadsheetImportPreview
