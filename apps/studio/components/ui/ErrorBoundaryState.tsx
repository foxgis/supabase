import { isError } from 'lodash'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'

// More correct version of FallbackProps from react-error-boundary
export type FallbackProps = {
  error: unknown
  resetErrorBoundary: (...args: any[]) => void
}

export const ErrorBoundaryState = ({ error, resetErrorBoundary }: FallbackProps) => {
  const router = useRouter()
  const checkIsError = isError(error)

  const errorMessage = checkIsError ? error.message : ''
  const urlMessage = checkIsError ? `Path name: ${router.pathname}\n\n${error?.stack}` : ''
  const isRemoveChildError = checkIsError
    ? errorMessage.includes("Failed to execute 'removeChild' on 'Node'")
    : false

  return (
    <div className="w-screen h-screen flex items-center justify-center flex-col gap-y-3">
      <div className="flex items-center flex-col gap-y-1">
        <p className="text-sm">
          应用错误：发生客户端异常（请查看浏览器控制台以获取更多信息）
        </p>
        <p className="text-sm text-foreground-light">Error: {errorMessage}</p>
      </div>

      {isRemoveChildError && (
        <Alert_Shadcn_ className="w-[650px]">
          <WarningIcon />
          <AlertTitle_Shadcn_>
            错误可能由 Google 翻译或第三方浏览器扩展引起
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            您可以尝试避免使用 Google 翻译或禁用某些浏览器扩展以避免产生移除子节点错误。
          </AlertDescription_Shadcn_>
          <AlertDescription_Shadcn_ className="mt-3">
            <Button asChild type="default" icon={<ExternalLink />}>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://github.com/facebook/react/issues/17256"
              >
                更多信息
              </a>
            </Button>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}

      <div className="flex items-center justify-center gap-x-2">
        {/* <Button asChild type="default" icon={<ExternalLink />}>
          <Link
            href={`/support/new?category=dashboard_bug&subject=Client%20side%20exception%20occurred%20on%20dashboard&message=${encodeURI(urlMessage)}`}
            target="_blank"
          >
            报告错误
          </Link>
        </Button> */}
        {/* [Joshen] For local and staging, allow us to escape the error boundary */}
        {/* We could actually investigate how to make this available on prod, but without being able to reliably test this, I'm not keen to do it now */}
        {process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod' ? (
          <Button type="outline" onClick={() => resetErrorBoundary()}>
            返回首页
          </Button>
        ) : (
          <Button type="outline" onClick={() => router.reload()}>
            重新加载
          </Button>
        )}
      </div>
    </div>
  )
}
