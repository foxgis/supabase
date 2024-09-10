import { ExternalLink } from 'lucide-react'
import { Button } from 'ui'

const NoChannelEmptyState = () => {
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
      <div className="w-full px-5 py-4 items-center gap-4 inline-flex rounded-b-md">
        <div className="grow flex-col flex">
          <p className="text-foreground">不确定要怎么做？</p>
          <p className="text-foreground-lighter text-xs">请浏览我们的文档</p>
        </div>
        <Button type="default" iconRight={<ExternalLink />}>
          <a href="https://supabase.com/docs/guides/realtime" target="_blank" rel="noreferrer">
            文档
          </a>
        </Button>
      </div>
    </div>
  )
}

export default NoChannelEmptyState
