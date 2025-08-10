import { Lightbulb } from 'lucide-react'
import { useEffect, useState } from 'react'

import { formatSql } from 'lib/formatSql'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CodeBlock,
  cn,
} from 'ui'
import { QueryPanelContainer, QueryPanelSection } from './QueryPanel'
import {
  QUERY_PERFORMANCE_REPORTS,
  QUERY_PERFORMANCE_REPORT_TYPES,
} from './QueryPerformance.constants'

interface QueryDetailProps {
  reportType: QUERY_PERFORMANCE_REPORT_TYPES
  selectedRow: any
  onClickViewSuggestion: () => void
}

export const QueryDetail = ({
  reportType,
  selectedRow,
  onClickViewSuggestion,
}: QueryDetailProps) => {
  // [Joshen] TODO implement this logic once the linter rules are in
  const isLinterWarning = false
  const report = QUERY_PERFORMANCE_REPORTS[reportType]
  const [query, setQuery] = useState(selectedRow?.['query'])

  useEffect(() => {
    if (selectedRow !== undefined) {
      const formattedQuery = formatSql(selectedRow['query'])
      setQuery(formattedQuery)
    }
  }, [selectedRow])

  return (
    <QueryPanelContainer>
      <QueryPanelSection>
        <p className="text-sm">查询语句</p>
        <CodeBlock
          hideLineNumbers
          value={query}
          language="sql"
          className={cn(
            'max-w-full max-h-[310px]',
            '!py-3 !px-3.5 prose dark:prose-dark transition',
            '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap'
          )}
        />
        {isLinterWarning && (
          <Alert_Shadcn_
            variant="default"
            className="mt-2 border-brand-400 bg-alternative [&>svg]:p-0.5 [&>svg]:bg-transparent [&>svg]:text-brand"
          >
            <Lightbulb />
            <AlertTitle_Shadcn_>优化建议：添加索引</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              添加索引可以帮助此查询更快地执行
            </AlertDescription_Shadcn_>
            <AlertDescription_Shadcn_>
              <Button className="mt-3" onClick={() => onClickViewSuggestion()}>
                查看建议
              </Button>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )}
      </QueryPanelSection>
      <div className="border-t" />
      <QueryPanelSection className="gap-y-1">
        {report
          .filter((x) => x.id !== 'query')
          .map((x) => {
            const rawValue = selectedRow?.[x.id]
            const isTime = x.name.includes('时间')

            const formattedValue = isTime
              ? typeof rawValue === 'number' && !isNaN(rawValue) && isFinite(rawValue)
                ? `${rawValue.toFixed(2)} 毫秒`
                : 'N/A'
              : rawValue != null
                ? String(rawValue)
                : 'N/A'

            return (
              <div key={x.id} className="flex gap-x-2">
                <p className="text-foreground-lighter text-sm w-32">{x.name}</p>
                <p className="text-sm w-32">{formattedValue}</p>
              </div>
            )
          })}
      </QueryPanelSection>
    </QueryPanelContainer>
  )
}
