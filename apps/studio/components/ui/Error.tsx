import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from 'ui'

export default function EmptyPageState({ error }: any) {
  useEffect(() => {
    console.error('Error', error)
  }, [])

  return (
    <div className="mx-auto flex h-full w-full flex-col items-center justify-center space-y-6">
      <div className="flex w-[320px] flex-col items-center justify-center space-y-3">
        <h4 className="text-lg">出错了 🤕</h4>
        <p className="text-center text-sm text-foreground-light">
          抱歉，出了点问题，请稍后再试，或者如果问题持续存在，请随时联系我们。
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <Button asChild>
          <Link href="/projects">回到上一页</Link>
        </Button>
        <Button asChild type="secondary">
          <Link href="/support/new">请求技术支持</Link>
        </Button>
      </div>
      <p className="text-sm text-foreground-light">
        错误：[{error?.code}] {error?.message}
      </p>
    </div>
  )
}
