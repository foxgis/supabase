import Link from 'next/link'

import { useParams } from 'common'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import CodeSnippet from './CodeSnippet'
import Snippets from './Snippets'

interface AuthenticationProps {
  selectedLang: 'bash' | 'js'
  showApiKey: string
}

const Authentication = ({ selectedLang, showApiKey }: AuthenticationProps) => {
  const { ref: projectRef } = useParams()
  const { data: apiKeys } = useAPIKeysQuery({ projectRef })
  const { data: settings } = useProjectSettingsV2Query({ projectRef })

  const { anonKey, serviceKey } = getKeys(apiKeys)
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
          <p>数据中间件同时使用 JWT 和 Key auth 两种认证方法。</p>
          <p>
            如果没有 <code>Authorization</code> 请求头，API 会假定您正在使用匿名用户进行请求。
          </p>
          <p>
            如果包含 <code>Authorization</code> 请求头，API 会“切换”到请求用户的角色。有关更多详细信息，请参阅用户管理部分。
          </p>
          <p>我们建议您通过环境变量设置 API 密钥。</p>
        </article>
      </div>

      <h2 className="doc-heading">客户端密钥</h2>
      <div className="doc-section">
        <article className="code-column text-foreground">
          <p>
            客户端密钥允许“匿名访问”您的数据库，直至用户完成登录。完成登录后，密钥会切换到包含用户身份的 token。
          </p>
          <p>
            在本文档中，我们将使用 <code>SUPABASE_KEY</code> 表示客户端密钥。
            .
          </p>
          <p>
            我们已经提供了一个客户端密钥供您使用，您可以添加任意数量的密钥，您可以在<Link href={`/project/${projectRef}/settings/api`}>API 设置</Link>页面查看 <code>anon</code>密钥。
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

      <h2 className="doc-heading">服务端密钥</h2>
      <div className="doc-section">
        <article className="code-column text-foreground">
          <p>
            服务端密钥具有完全的访问权限，绕过任何安全策略，请务必不要公开此密钥。它只应该在服务器端使用，切勿在客户端或浏览器上使用。
          </p>
          <p>
            在本文档中，我们将使用 <code>SERVICE_KEY</code> 表示服务端密钥。
          </p>
          <p>
            我们已经提供了一个服务端密钥供您使用，您可以添加任意数量的密钥，您可以在<Link href={`/project/${projectRef}/settings/api`}>API 设置</Link>页面查看<code>service_role</code>密钥。
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
