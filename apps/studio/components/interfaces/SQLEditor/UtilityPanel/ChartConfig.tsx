import dayjs from 'dayjs'
import { ArrowUpDown, X } from 'lucide-react'
import { useMemo } from 'react'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import BarChart from 'components/ui/Charts/BarChart'
import NoDataPlaceholder from 'components/ui/Charts/NoDataPlaceholder'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import Link from 'next/link'
import {
  Badge,
  Button,
  Checkbox_Shadcn_,
  Label_Shadcn_,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  Select_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns'

type Results = { rows: readonly any[] }

export type ChartConfig = {
  view?: 'table' | 'chart'
  type: 'bar' | 'line'
  cumulative: boolean
  xKey: string
  yKey: string
  showLabels?: boolean
  showGrid?: boolean
}

const getCumulativeResults = (results: Results, config: ChartConfig) => {
  if (!results?.rows?.length) {
    return []
  }

  const cumulativeResults = results.rows.reduce((acc, row) => {
    const prev = acc[acc.length - 1] || {}
    const next = {
      ...row,
      [config.yKey]: (prev[config.yKey] || 0) + row[config.yKey],
    }
    return [...acc, next]
  }, [])
  return cumulativeResults
}
const VALID_RESULT_KEY_TYPES = ['number', 'string', 'date']

type ChartConfigProps = {
  results: Results
  config: ChartConfig
  onConfigChange: (config: ChartConfig) => void
}

export const ChartConfig = ({
  results = { rows: [] },
  config,
  onConfigChange,
}: ChartConfigProps) => {
  const { ref } = useParams()

  const [acknowledged, setAcknowledged] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_SQL_BLOCK_ACKNOWLEDGED(ref as string),
    false
  )

  // If a result key is not valid, it will be filtered out
  const resultKeys = useMemo(() => {
    return Object.keys(results.rows[0] || {}).filter((key) => {
      const type = typeof results.rows[0][key]
      return VALID_RESULT_KEY_TYPES.includes(type)
    })
  }, [results])

  // Only allow Y-axis keys that are numbers
  const yAxisKeys = useMemo(() => {
    if (!results.rows[0]) return []
    return Object.keys(results.rows[0]).filter((key) => {
      const value = results.rows[0][key]
      return typeof value === 'number' || !isNaN(Number(value))
    })
  }, [results])

  const hasConfig = config.xKey && config.yKey

  const canFlip = useMemo(() => {
    if (!hasConfig) return false
    const xKeyType = typeof results.rows[0]?.[config.xKey]
    const yKeyType = typeof results.rows[0]?.[config.yKey]
    return xKeyType === 'number' && yKeyType === 'number'
  }, [hasConfig, results.rows, config.xKey, config.yKey])

  // Compute cumulative results only if necessary
  const cumulativeResults = useMemo(() => getCumulativeResults(results, config), [results, config])

  const resultToRender = config.cumulative ? cumulativeResults : results.rows

  const getDateFormat = (key: any) => {
    const value = resultToRender?.[0]?.[key] || ''
    if (typeof value === 'number') return 'number'
    if (dayjs(value).isValid()) return 'date'
    return 'string'
  }

  const xKeyDateFormat = getDateFormat(config.xKey)

  const onFlip = () => {
    const newY = config.xKey
    const newX = config.yKey
    onConfigChange({ ...config, xKey: newX, yKey: newY })
  }

  if (!resultKeys.length) {
    return (
      <div className="p-2">
        <NoDataPlaceholder
          size="normal"
          description="执行查询后配置图表选项。"
        />
      </div>
    )
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-grow h-full">
      <ResizablePanel className="p-4 h-full" defaultSize={75}>
        {!hasConfig ? (
          <ResizablePanel className="p-4 h-full" defaultSize={75}>
            <NoDataPlaceholder
              size="normal"
              title="配置图表"
              description="在图表选项面版中选择 X 和 Y 轴"
            />
          </ResizablePanel>
        ) : config.type === 'bar' ? (
          <BarChart
            showLegend
            size="normal"
            xAxisIsDate={xKeyDateFormat === 'date'}
            data={resultToRender}
            xAxisKey={config.xKey}
            yAxisKey={config.yKey}
            showGrid={config.showGrid}
            XAxisProps={{
              angle: 0,
              interval: 'preserveStart',
              hide: !config.showLabels,
              tickFormatter: (idx: string) => {
                const value = resultToRender[+idx][config.xKey]
                if (xKeyDateFormat === 'date') {
                  return dayjs(value).format('YYYY/MM/DD HH:mm')
                }
                return value
              },
            }}
            YAxisProps={{
              tickFormatter: (value: number) => value.toLocaleString(),
              hide: !config.showLabels,
              domain: [0, 'dataMax'],
            }}
          />
        ) : null}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        defaultSize={25}
        minSize={15}
        className="px-3 py-3 space-y-4 !overflow-y-auto"
      >
        <div className="flex justify-between items-center h-5">
          <h2 className="text-sm text-foreground-lighter">图表选项</h2>
          {config.xKey && config.yKey && (
            <ButtonTooltip
              type="text"
              size="tiny"
              onClick={onFlip}
              disabled={!canFlip}
              icon={<ArrowUpDown size="15" className="text-foreground-lighter" />}
              tooltip={{
                content: {
                  side: 'bottom',
                  className: 'w-64 text-center',
                  text: canFlip
                    ? '交换 X 和 Y 轴'
                    : '无法交换 X 和 Y 轴——XY轴必须包含数值型数据',
                },
              }}
            >
              翻转
            </ButtonTooltip>
          )}
        </div>

        {/* {!acknowledged && (
          <Admonition showIcon={false} type="tip" className="p-2 relative group">
            <Tooltip>
              <TooltipTrigger
                onClick={() => setAcknowledged(true)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} className="text-foreground-light" />
              </TooltipTrigger>
              <TooltipContent side="bottom">Dismiss</TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-x-2">
              <Badge variant="success" className="text-xs rounded px-1">
                NEW
              </Badge>
              <p className="text-xs">Add this chart to custom reports</p>
            </div>
            <p className="text-xs text-foreground-light mt-1">
              SQL snippets can now be added and saved to your custom reports. Try it out now!
            </p>
            <Button asChild size="tiny" type="default" className="mt-2">
              <Link href={`/project/${ref}/reports`}>Head to Reports</Link>
            </Button>
          </Admonition>
        )} */}

        <div>
          <Label_Shadcn_ className="text-xs text-foreground-light">X 轴</Label_Shadcn_>
          <Select_Shadcn_
            value={config.xKey}
            onValueChange={(value) => {
              onConfigChange({ ...config, xKey: value })
            }}
          >
            <SelectTrigger_Shadcn_>{config.xKey || '选择 X 轴'}</SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectGroup_Shadcn_>
                {resultKeys.map((key) => (
                  <SelectItem_Shadcn_ value={key} key={key}>
                    {key}
                  </SelectItem_Shadcn_>
                ))}
              </SelectGroup_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </div>

        <div>
          <Label_Shadcn_ className="text-xs text-foreground-light">Y 轴</Label_Shadcn_>
          <Select_Shadcn_
            value={config.yKey}
            onValueChange={(value) => {
              onConfigChange({ ...config, yKey: value })
            }}
          >
            <SelectTrigger_Shadcn_>{config.yKey || '选择 Y 轴'}</SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectGroup_Shadcn_>
                {yAxisKeys.map((key) => (
                  <SelectItem_Shadcn_ value={key} key={key}>
                    {key}
                  </SelectItem_Shadcn_>
                ))}
              </SelectGroup_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </div>
        <div className="*:flex *:gap-2 *:items-center grid gap-2 *:text-foreground-light *:p-1.5 *:pl-0">
          <Label_Shadcn_ className="" htmlFor="cumulative">
            <Checkbox_Shadcn_
              id="cumulative"
              name="cumulative"
              checked={config.cumulative}
              onClick={() => onConfigChange({ ...config, cumulative: !config.cumulative })}
            />
            显示合计
          </Label_Shadcn_>

          <Label_Shadcn_ htmlFor="showLabels">
            <Checkbox_Shadcn_
              id="showLabels"
              name="showLabels"
              checked={config.showLabels}
              onClick={() => onConfigChange({ ...config, showLabels: !config.showLabels })}
            />
            显示标签
          </Label_Shadcn_>

          <Label_Shadcn_ htmlFor="showGrid">
            <Checkbox_Shadcn_
              id="showGrid"
              name="showGrid"
              checked={config.showGrid}
              onClick={() => onConfigChange({ ...config, showGrid: !config.showGrid })}
            />
            显示格网
          </Label_Shadcn_>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
