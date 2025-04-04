import Link from 'next/link'

import { useParams } from 'common'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

const PublicSchemaNotEnabledAlert = () => {
  const { ref: projectRef } = useParams()

  return (
    <Admonition type="default">
      <p className="!mt-0 !mb-1.5">此项目的 `public` 模式不可见</p>
      <p className="!mt-0 !mb-1.5 text-foreground-light">
        您将无法通过 supabase-js 或 HTTP 客户端查询 `public` 模式中的表和视图。
        在 API 设置中可以设置此选项。
      </p>
      <Button asChild type="default" className="mt-1">
        <Link
          href={`/project/${projectRef}/settings/api#postgrest-config`}
          className="!no-underline"
        >
          查看 API 设置
        </Link>
      </Button>
    </Admonition>
  )
}

export default PublicSchemaNotEnabledAlert
