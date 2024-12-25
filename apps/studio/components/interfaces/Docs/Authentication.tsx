import Link from 'next/link'

import { useParams } from 'common'
import { getAPIKeys, useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import CodeSnippet from './CodeSnippet'
import Snippets from './Snippets'

interface AuthenticationProps {
  selectedLang: 'bash' | 'js'
  showApiKey: string
}

const Authentication = ({ selectedLang, showApiKey }: AuthenticationProps) => {
  const { ref: projectRef } = useParams()
  const { data: settings } = useProjectSettingsV2Query({ projectRef })

  const { anonKey, serviceKey } = getAPIKeys(settings)
  const protocol = settings?.app_config?.protocol ?? 'https'
  const hostEndpoint = settings?.app_config?.endpoint
  const endpoint = `${protocol}://${hostEndpoint ?? ''}`

  // [Joshen] ShowApiKey should really be a boolean, its confusing
  const defaultApiKey =
    showApiKey !== 'SUPABASE_KEY'
      ? anonKey?.api_key ?? 'SUPABASE_CLIENT_API_KEY'
      : 'SUPABASE_CLIENT_API_KEY'
  const serviceApiKey =
    showApiKey !== 'SUPABASE_KEY'
      ? serviceKey?.api_key ?? 'SUPABASE_SERVICE_KEY'
      : 'SUPABASE_SERVICE_KEY'

  return (
    <>
      <h2 className="doc-heading">认证</h2>
      <div className="doc-section">
        <article className="code-column text-foreground">
          <p>Supabase 混合使用 JWT 和 Key auth。</p>
          <p>
            如果没有 <code>Authorization</code> 请求头，API 会假定您正在使用匿名用户进行请求。
          </p>
          <p>
            如果包含 <code>Authorization</code> 请求头，API 会“切换”到请求用户的角色。有关更多详细信息，请参阅用户管理部分。
          </p>
          <p>我们建议您通过环境变量设置您的 key。</p>
        </article>
      </div>

      <h2 className="doc-heading">客户端 API key</h2>
      <div className="doc-section">
        <article className="code-column text-foreground">
          <p>
            客户端 key 允许“匿名访问”您的数据库，直到用户完成登录。登录后，key 会切换到用户自己的登录 token。
          </p>
          <p>
            在本文档中，我们将使用 <code>SUPABASE_KEY</code> 表示客户端 key。
            .
          </p>
          <p>
            我们已经提供了一个客户端 key 供您使用，您可以添加任意数量的 key，您可以在<Link href={`/project/${projectRef}/settings/api`}>API 设置</Link>页面查看 <code>anon</code> key。
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authKey('CLIENT API KEY', 'SUPABASE_KEY', defaultApiKey)}
          />
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authKeyExample(defaultApiKey, endpoint, {
              showBearer: false,
            })}
          />
        </article>
      </div>

      <h2 className="doc-heading">服务端 Key</h2>
      <div className="doc-section">
        <article className="code-column text-foreground">
          <p>
            服务端 key 具有完全的访问权限，绕过任何安全策略。请务必小心暴露这些 key。它们只应该在服务器上使用，切勿在客户端或浏览器上使用。
          </p>
          <p>
            在本文档中，我们将使用 <code>SERVICE_KEY</code> 表示服务端 key。
          </p>
          <p>
            我们已经提供了一个服务端 key 供您使用，您可以添加任意数量的 key，您可以在<Link href={`/project/${projectRef}/settings/api`}>API 设置</Link>页面查看 <code>service_role</code> key。
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authKey('SERVICE KEY', 'SERVICE_KEY', serviceApiKey)}
          />
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authKeyExample(serviceApiKey, endpoint, { keyName: 'SERVICE_KEY' })}
          />
        </article>
      </div>
    </>
  )
}

export default Authentication
