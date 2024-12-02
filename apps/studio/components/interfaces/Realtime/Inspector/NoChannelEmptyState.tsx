import { DocsButton } from 'components/ui/DocsButton'
import { useIsOrioleDb } from 'hooks/misc/useSelectedProject'
import { cn } from 'ui'
import { Admonition } from 'ui-patterns'

const NoChannelEmptyState = () => {
  const isOrioleDb = useIsOrioleDb()

  return (
    <div className="border bg-studio border-border rounded-md justify-start items-center flex flex-col w-10/12 relative">
      <div className="w-full px-5 py-4 items-center gap-4 inline-flex border-b rounded-t-md">
        <div className="grow flex-col flex gap-y-1">
          <p className="text-foreground">加入一个频道开始监听消息</p>
          <p className="text-foreground-lighter text-xs">
            频道是实时通信的基础构件，客户端在频道内进行双向发送和接收消息。
          </p>
        </div>
      </div>
      <div
        className={cn(
          'w-full px-5 py-4 items-center gap-4 inline-flex',
          isOrioleDb ? '' : 'rounded-b-md'
        )}
      >
        <div className="grow flex-col flex">
          <p className="text-foreground">不确定要怎么做？</p>
          <p className="text-foreground-lighter text-xs">请浏览我们的文档</p>
        </div>
        <DocsButton href="https://supabase.com/docs/guides/realtime" />
      </div>
      {/* [Joshen] This is temporary as a bug was identified that might not be patched on time for release */}
      {/* [Joshen] Just making a simple callout as this is intended to be patched soon either way, not a long term limitation */}
      {isOrioleDb && (
        <Admonition
          type="warning"
          className="mb-0 rounded-none border-0 border-t rounded-b-md [&>div]:text-xs"
          title="Realtime database changes are not available"
          description="This is only a temporary limitation for projects that are using Postgres with OrioleDB."
        />
      )}
    </div>
  )
}

export default NoChannelEmptyState
