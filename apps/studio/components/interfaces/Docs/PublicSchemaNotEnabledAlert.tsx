import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { Info } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { useParams } from 'common'

const PublicSchemaNotEnabledAlert = () => {
  const { ref: projectRef } = useParams()

  return (
    <Alert_Shadcn_ variant="default">
      <Info className="h-4 w-4" />
      <AlertTitle_Shadcn_ className="!-mt-4">
        <ReactMarkdown>此项目的 `public` 模式不可见</ReactMarkdown>
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_ className="grid gap-3 !-mt-7">
        <ReactMarkdown>
          您将无法通过 supabase-js 或 HTTP 客户端查询 `public` 模式中的表和视图。
        </ReactMarkdown>

        <div className="!-mt-4 inline-block">
          <Button asChild type="default">
            <Link
              href={`/project/${projectRef}/settings/api#postgrest-config`}
              className="!no-underline !hover:bg-surface-100 !text-foreground"
            >
              查看模式设置
            </Link>
          </Button>
        </div>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export default PublicSchemaNotEnabledAlert
