import { useParams } from 'common'
import Snippets from 'components/interfaces/Docs/Snippets'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'

import { InlineLink } from 'components/ui/InlineLink'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import CodeSnippet from './CodeSnippet'
import PublicSchemaNotEnabledAlert from './PublicSchemaNotEnabledAlert'

interface Props {
  selectedLang: 'bash' | 'js'
}

export default function Introduction({ selectedLang }: Props) {
  const { ref: projectRef } = useParams()

  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: config, isSuccess } = useProjectPostgrestConfigQuery({ projectRef })

  const protocol = settings?.app_config?.protocol ?? 'https'
  const hostEndpoint = settings?.app_config?.endpoint
  const endpoint = `${protocol}://${hostEndpoint ?? ''}`

  const isPublicSchemaEnabled = config?.db_schema
    .split(',')
    .map((name) => name.trim())
    .includes('public')

  return (
    <>
      <h2 className="doc-heading">连接到项目</h2>
      <div className="doc-section">
        <article className="code-column text-foreground">
          <p>
            您可以通过 RESTful API 查询和管理数据库。API 地址和 API 密钥可以从{' '}
            <InlineLink href={`/project/${projectRef}/settings/api`}>API 设置</InlineLink> 中获取。
          </p>
          <p>
            您可以通过<code>createClient()</code>方法初始化一个新的连接客户端。
            这个客户端是数据中间件所有功能的入口点，是与我们提供的一切交互的最简单的方式。
          </p>
        </article>
        <article className="code flex flex-col gap-y-2">
          <CodeSnippet selectedLang={selectedLang} snippet={Snippets.init(endpoint)} />
          {isSuccess && !isPublicSchemaEnabled && <PublicSchemaNotEnabledAlert />}
        </article>
      </div>
    </>
  )
}
