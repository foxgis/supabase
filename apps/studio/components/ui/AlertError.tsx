import Link from 'next/link'

import type { ResponseError } from 'types'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'

export interface AlertErrorProps {
  projectRef?: string
  subject?: string
  error?: { message: string } | null
  className?: string
  showIcon?: boolean
}

// [Joshen] To standardize the language for all error UIs

const AlertError = ({
  projectRef,
  subject,
  error,
  className,
  showIcon = true,
}: AlertErrorProps) => {
  const subjectString = subject?.replace(/ /g, '%20')
  let href = `/support/new?category=dashboard_bug`

  if (projectRef) href += `&ref=${projectRef}`
  if (subjectString) href += `&subject=${subjectString}`
  if (error) href += `&error=${error.message}`

  const formattedErrorMessage = error?.message?.includes('503')
    ? '503 服务暂时不可用'
    : error?.message

  return (
    <Alert_Shadcn_ className={className} variant="warning" title={subject}>
      {showIcon && <WarningIcon className="h-4 w-4" strokeWidth={2} />}
      <AlertTitle_Shadcn_ className="text-foreground">{subject}</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_ className="flex flex-col gap-3 break-words">
        <div>
          {error?.message && <p className="text-left">错误：{formattedErrorMessage}</p>}
          <p className="text-left">
            请尝试刷新浏览器，如果问题仍然存在，请联系技术支持。
          </p>
        </div>
        {/* <div>
          <Button asChild type="warning">
            <Link href={href}>联系技术支持</Link>
          </Button>
        </div> */}
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export default AlertError
