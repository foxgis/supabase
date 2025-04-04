import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { Dispatch, SetStateAction, useState } from 'react'

import { useParams } from 'common'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import {
  Badge,
  Button,
  IconBroadcast,
  IconDatabaseChanges,
  IconPresence,
  Input,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Toggle,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { RealtimeConfig } from '../useRealtimeMessages'
import { FilterSchema } from './FilterSchema'
import { FilterTable } from './FilterTable'

interface RealtimeFilterPopoverProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
}

export const RealtimeFilterPopover = ({ config, onChangeConfig }: RealtimeFilterPopoverProps) => {
  const [open, setOpen] = useState(false)
  const [applyConfigOpen, setApplyConfigOpen] = useState(false)
  const [tempConfig, setTempConfig] = useState(config)

  const { ref } = useParams()
  const org = useSelectedOrganization()
  const { mutate: sendEvent } = useSendEventMutation()

  const onOpen = (v: boolean) => {
    // when opening, copy the outside config into the intermediate one
    if (v === true) {
      setTempConfig(config)
    }
    setOpen(v)
  }

  // [Joshen] Restricting the schemas to only public as any other schema won’t work out of the box due to missing permissions
  // Consequently, SchemaSelector here will also be disabled
  const isFiltered = config.table !== '*'

  return (
    <>
      <Popover_Shadcn_ open={open} onOpenChange={onOpen}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            icon={<PlusCircle size="16" />}
            type={isFiltered ? 'primary' : 'dashed'}
            className={cn('rounded-full px-1.5 text-xs', isFiltered ? '!py-0.5' : '!py-1')}
            size="small"
          >
            {isFiltered ? (
              <>
                <span className="mr-1">通过</span>
                <Badge variant="brand">表：{config.table}</Badge>
                <span className="mr-1">过滤</span>
              </>
            ) : (
              <span className="mr-1">过滤消息</span>
            )}
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0 w-[365px]" align="start">
          <div className="border-b border-overlay text-xs px-4 py-3 text-foreground">
            监听的事件类型
          </div>
          <div className="py-3 px-4 border-b border-overlay">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2.5 items-center">
                <IconPresence
                  size="xlarge"
                  className="bg-foreground rounded text-background-muted"
                />
                <label htmlFor="toggle-presence" className="text-sm">
                  状态同步
                </label>
              </div>
              <Toggle
                id="toggle-presence"
                size="tiny"
                checked={tempConfig.enablePresence}
                onChange={() =>
                  setTempConfig({ ...tempConfig, enablePresence: !tempConfig.enablePresence })
                }
              />
            </div>
            <p className="text-xs text-foreground-light pt-1">
              在客户端之间保存和同步用户状态
            </p>
          </div>
          <div className="py-3 px-4 border-b border-overlay">
            <div className="flex items-center justify-between">
              <div className="flex gap-2.5 items-center">
                <IconBroadcast
                  size="xlarge"
                  className="bg-foreground rounded text-background-muted"
                />
                <label htmlFor="toggle-broadcast" className="text-sm">
                  广播
                </label>
              </div>
              <Toggle
                id="toggle-broadcast"
                size="tiny"
                checked={tempConfig.enableBroadcast}
                onChange={() =>
                  setTempConfig({ ...tempConfig, enableBroadcast: !tempConfig.enableBroadcast })
                }
              />
            </div>
            <p className="text-xs  text-foreground-light pt-1">
              向订阅同一频道的客户端发送数据
            </p>
          </div>
          <div className="py-3 px-4 border-b border-overlay">
            <div className="flex items-center justify-between">
              <div className="flex gap-2.5 items-center">
                <IconDatabaseChanges
                  size="xlarge"
                  className="bg-foreground rounded text-background-muted"
                />
                <label htmlFor="toggle-db-changes" className="text-sm">
                  数据库变更
                </label>
              </div>
              <Toggle
                id="toggle-db-changes"
                size="tiny"
                checked={tempConfig.enableDbChanges}
                onChange={() =>
                  setTempConfig({ ...tempConfig, enableDbChanges: !tempConfig.enableDbChanges })
                }
              />
            </div>
            <p className="text-xs text-foreground-light pt-1">
              监听数据库的插入、更新、删除等操作
            </p>
          </div>

          {tempConfig.enableDbChanges && (
            <>
              <div className="border-b border-overlay text-xs px-4 py-3 text-foreground">
                从数据库变更中过滤消息
              </div>
              <div className="flex border-b border-overlay p-4 gap-y-2 flex-col">
                <FilterSchema
                  value={tempConfig.schema}
                  onChange={(v) => setTempConfig({ ...tempConfig, schema: v, table: '*' })}
                />

                <FilterTable
                  value={tempConfig.table}
                  schema={tempConfig.schema}
                  onChange={(table) => setTempConfig({ ...tempConfig, table })}
                />
              </div>
              <div className="border-b border-overlay p-4 flex flex-col gap-2">
                <div className="flex flex-row gap-4 items-center">
                  <p className="w-[60px] flex justify-end text-sm">AND</p>
                  <Input
                    size="tiny"
                    className="flex-grow"
                    placeholder="body=eq.hey"
                    value={tempConfig.filter}
                    onChange={(v) => setTempConfig({ ...tempConfig, filter: v.target.value })}
                  />
                </div>
                <p className="text-xs text-foreground-light pl-[80px]">
                  到{' '}
                  <Link
                    className="underline"
                    target="_blank"
                    rel="noreferrer"
                    href="https://supabase.com/docs/guides/realtime/postgres-changes#available-filters"
                  >
                    文档
                  </Link>{' '}
                  中了解更多关于实时通信过滤的内容
                </p>
              </div>
            </>
          )}
          <div className="px-4 py-2 gap-2 flex justify-end">
            <Button type="default" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={() => setApplyConfigOpen(true)}>应用</Button>
          </div>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
      <ConfirmationModal
        title="先前找到的消息将会消失。"
        variant="destructive"
        confirmLabel="确定"
        size="small"
        visible={applyConfigOpen}
        onCancel={() => setApplyConfigOpen(false)}
        onConfirm={() => {
          sendEvent({
            action: 'realtime_inspector_filters_applied',
            groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
          })
          onChangeConfig(tempConfig)
          setApplyConfigOpen(false)
          setOpen(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          实时通信探查器将会清除当前收集的消息，并开始监听符合更新过滤器的新消息。
        </p>
      </ConfirmationModal>
    </>
  )
}
