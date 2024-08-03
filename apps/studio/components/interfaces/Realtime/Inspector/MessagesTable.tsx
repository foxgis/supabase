import { useParams, useTelemetryProps } from 'common'
import { isEqual } from 'lodash'
import { Loader2, MegaphoneIcon } from 'lucide-react'
import Link from 'next/link'
import { Key, useEffect, useState } from 'react'
import DataGrid, { RenderRowProps, Row } from 'react-data-grid'
import { Button, IconBroadcast, IconDatabaseChanges, IconExternalLink, IconPresence, cn } from 'ui'

import ShimmerLine from 'components/ui/ShimmerLine'
import Telemetry from 'lib/telemetry'
import { useRouter } from 'next/router'
import MessageSelection from './MessageSelection'
import type { LogData } from './Messages.types'
import NoChannelEmptyState from './NoChannelEmptyState'
import { ColumnRenderer } from './RealtimeMessageColumnRenderer'

export const isErrorLog = (l: LogData) => {
  return l.message === 'SYSTEM' && l.metadata?.status === 'error'
}

const NoResultAlert = ({
  enabled,
  hasChannelSet,
  showSendMessage,
}: {
  enabled: boolean
  hasChannelSet: boolean
  showSendMessage: () => void
}) => {
  const { ref } = useParams()

  return (
    <div className="w-full max-w-md flex items-center flex-col">
      {!hasChannelSet ? (
        <NoChannelEmptyState />
      ) : (
        <>
          {enabled && <p className="text-foreground">未找到实时消息</p>}
          <p className="text-foreground-lighter">实时消息日志会显示在这里</p>

          <div className="mt-4 border bg-surface-100 border-border rounded-md justify-start items-center flex flex-col w-full">
            <div className="w-full px-5 py-4 items-center gap-4 inline-flex border-b">
              <IconBroadcast size="xlarge" className="text-background bg-foreground rounded w-6" />
              <div className="grow flex-col flex">
                <p className="text-foreground">创建广播消息</p>
                <p className="text-foreground-lighter text-xs">在频道中发送一条消息</p>
              </div>
              <Button type="default" onClick={showSendMessage}>
                广播消息
              </Button>
            </div>
            <div className="w-full px-5 py-4 items-center gap-4 inline-flex border-b">
              <IconPresence size="xlarge" className="text-background bg-foreground rounded w-6" />
              <div className="grow flex-col flex">
                <p className="text-foreground">从浏览器的另一标签页加入</p>
                <p className="text-foreground-lighter text-xs">
                  在多个客户端之间发送消息
                </p>
              </div>
              <Link href={`/project/${ref}/realtime/inspector`} target="_blank" rel="noreferrer">
                <Button type="default" iconRight={<IconExternalLink />}>
                  打开检视器
                </Button>
              </Link>
            </div>

            <div className="w-full px-5 py-4 items-center gap-4 inline-flex border-b">
              <IconDatabaseChanges
                size="xlarge"
                className="text-background bg-foreground rounded w-6"
              />
              <div className="grow flex-col flex">
                <p className="text-foreground">监听一张表的变更</p>
                <p className="text-foreground-lighter text-xs">表必须已启用实时消息</p>
              </div>
              <Link href={`/project/${ref}/database/publications`} target="_blank" rel="noreferrer">
                <Button type="default" iconRight={<IconExternalLink />}>
                  数据库事件发布设置
                </Button>
              </Link>
            </div>
            <div className="w-full px-5 py-4 items-center gap-4 inline-flex rounded-b-md bg-studio">
              <div className="grow flex-col flex">
                <p className="text-foreground">不确定要怎么做？</p>
                <p className="text-foreground-lighter text-xs">请浏览我们的文档</p>
              </div>
              <Button type="default" iconRight={<IconExternalLink />}>
                <a
                  href="https://supabase.com/docs/guides/realtime"
                  target="_blank"
                  rel="noreferrer"
                >
                  文档
                </a>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const RowRenderer = (key: Key, props: RenderRowProps<LogData, unknown>) => {
  return <Row key={key} {...props} isRowSelected={false} selectedCellIdx={undefined} />
}

interface MessagesTableProps {
  enabled: boolean
  data?: LogData[]
  hasChannelSet: boolean
  showSendMessage: () => void
}

const MessagesTable = ({
  enabled,
  hasChannelSet,
  data = [],
  showSendMessage,
}: MessagesTableProps) => {
  const [focusedLog, setFocusedLog] = useState<LogData | null>(null)
  const stringData = JSON.stringify(data)
  const telemetryProps = useTelemetryProps()
  const router = useRouter()

  useEffect(() => {
    if (!data) return
    const found = data.find((datum) => datum.id === focusedLog?.id)
    if (!found) {
      setFocusedLog(null)
    }
  }, [stringData])

  if (!data) return null

  return (
    <>
      <section className="flex w-full flex-col" style={{ maxHeight: 'calc(100vh - 42px - 3rem)' }}>
        <ShimmerLine active={enabled} />
        <div className={cn('flex h-full flex-row', enabled ? 'border-brand-400' : null)}>
          <div className="flex flex-grow flex-col">
            {enabled && (
              <div className="w-full h-9 px-4 bg-surface-100 border-b items-center inline-flex justify-between text-foreground-light">
                <div className="inline-flex gap-2.5 text-xs">
                  <Loader2 size="16" className="animate-spin" />
                  <div>Listening</div>
                  <div>•</div>
                  <div>
                    {data.length > 0
                      ? data.length >= 100
                        ? `Found a large number of messages, showing only the latest 100...`
                        : `Found ${data.length} messages...`
                      : `No message found yet...`}
                  </div>
                </div>
                <Button
                  type="default"
                  onClick={showSendMessage}
                  icon={<MegaphoneIcon size={14} strokeWidth={1.5} />}
                >
                  <span>Broadcast a message</span>
                </Button>
              </div>
            )}

            <DataGrid
              className="data-grid--simple-logs h-full border-b-0"
              rowHeight={40}
              headerRowHeight={0}
              onSelectedCellChange={({ rowIdx }) => {
                Telemetry.sendEvent(
                  {
                    category: 'realtime_inspector',
                    action: 'focused-specific-message',
                    label: 'realtime_inspector_results',
                  },
                  telemetryProps,
                  router
                )

                setFocusedLog(data[rowIdx])
              }}
              selectedRows={new Set([])}
              columns={ColumnRenderer}
              rowClass={(row) => {
                return cn([
                  'font-mono tracking-tight',
                  isEqual(row, focusedLog)
                    ? 'bg-scale-800 rdg-row--focused'
                    : ' bg-200 hover:bg-scale-300 cursor-pointer',
                  isErrorLog(row) && '!bg-warning-300',
                ])
              }}
              rows={data}
              rowKeyGetter={(row) => row.id}
              renderers={{
                renderRow: RowRenderer,
                noRowsFallback: (
                  <div className="mx-auto flex h-full w-full items-center justify-center space-y-12 py-4 transition-all delay-200 duration-500">
                    <NoResultAlert
                      enabled={enabled}
                      hasChannelSet={hasChannelSet}
                      showSendMessage={showSendMessage}
                    />
                  </div>
                ),
              }}
            />
          </div>
          <div className="flex w-1/2 flex-col">
            <MessageSelection onClose={() => setFocusedLog(null)} log={focusedLog} />
          </div>
        </div>
      </section>
    </>
  )
}
export default MessagesTable
