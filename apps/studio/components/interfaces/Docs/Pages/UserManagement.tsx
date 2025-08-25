import Link from 'next/link'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { makeRandomString } from 'lib/helpers'
import CodeSnippet from '../CodeSnippet'
import Snippets from '../Snippets'

const randomPassword = makeRandomString(20)

interface UserManagementProps {
  selectedLang: 'bash' | 'js'
  showApiKey: string
}

export const UserManagement = ({ selectedLang, showApiKey }: UserManagementProps) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const keyToShow = showApiKey ? showApiKey : 'SUPABASE_KEY'

  const { authenticationSignInProviders } = useIsFeatureEnabled([
    'authentication:sign_in_providers',
  ])

  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const protocol = settings?.app_config?.protocol ?? 'https'
  const hostEndpoint = settings?.app_config?.endpoint ?? ''
  const endpoint = `${protocol}://${hostEndpoint ?? ''}`

  return (
    <>
      <h2 className="doc-heading">用户管理</h2>
      <div className="doc-section">
        <article className="code-column text-foreground">
          <p>使用数据中间件轻松管理用户。</p>
          <p>
            数据中间件会自动为每个用户分配一个唯一的 ID。您可以在数据库的任何位置关联这个 ID。例如，您可以会创建一个<code>profiles</code>表，
            该表使用 <code>user_id</code> 字段关联用户 ID。
          </p>
          <p>
            数据中间件已经有内置的路由，用于在您的应用和网站中管理用户的注册、登录和注销。
          </p>
        </article>
      </div>

      <h2 className="doc-heading">注册</h2>
      <div className="doc-section ">
        <article className="code-column text-foreground">
          <p>允许用户注册并创建新账户。</p>
          <p>
            完成注册后，通过客户端 SDK 的所有交互都会被视为“该用户”。
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authSignup(endpoint, keyToShow, randomPassword)}
          />
        </article>
      </div>

      <h2 className="doc-heading">使用电子邮件和密码登录</h2>
      <div className="doc-section ">
        <article className="code-column text-foreground">
          <p>如果创建了账户，用户可以登录到您的应用中。</p>
          <p>
            完成登录后，通过客户端 SDK 的所有交互都会被视为“该用户”。
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authLogin(endpoint, keyToShow, randomPassword)}
          />
        </article>
      </div>

      <h2 className="doc-heading">通过电子邮件发送的登录链接进行登录</h2>
      <div className="doc-section ">
        <article className="code-column text-foreground">
          <p>发送用户一个无密码链接，他们可以使用该链接兑换访问令牌。</p>
          <p>
            点击链接后，通过客户端 SDK 的所有交互都会被视为“该用户”。
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authMagicLink(endpoint, keyToShow)}
          />
        </article>
      </div>

      <h2 className="doc-heading">使用电话号码和密码注册</h2>
      <div className="doc-section ">
        <article className="code-column text-foreground">
          <p>
            可以使用电话号码代替电子邮件作为账户的确认机制。
          </p>
          <p>
            用户将会通过短信收到一个验证码，用来验证该用户是否控制该电话号码。
          </p>
          <p>
            您必须在身份验证设置页面上输入自己的 twilio 凭据才能启用短信确认。
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authPhoneSignUp(endpoint, keyToShow)}
          />
        </article>
      </div>

      <h2 className="doc-heading">通过验证码短信登录</h2>
      <div className="doc-section ">
        <article className="code-column text-foreground">
          <p>
            验证码（OTP）短信类似于登录链接，除了您必须为用户提供一个验证6位数字的界面。
          </p>
          <p>
            您必须在身份验证设置页面上输入自己的 twilio 凭据才能启用短信登录。
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authMobileOTPLogin(endpoint, keyToShow)}
          />
        </article>
      </div>

      <h2 className="doc-heading">验证短信验证码短信</h2>
      <div className="doc-section ">
        <article className="code-column text-foreground">
          <p>
            一旦用户收到验证码，需要让用户在表单中输入并发送它以进行验证。
          </p>
          <p>
            您必须在身份验证设置页面上输入自己的 twilio 凭据才能启用验证码短信登录。
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authMobileOTPVerify(endpoint, keyToShow)}
          />
        </article>
      </div>

      {authenticationSignInProviders && (
        <>
          <h2 className="doc-heading">使用第三方 OAuth 登录</h2>
          <div className="doc-section ">
            <article className="code-column text-foreground">
              <p>
                用户可以使用第三方 OAuth 登录，如 Google、Facebook、GitHub 等。您必须先在{' '}
                <span className="text-green-500">
                  <Link key={'AUTH'} href={`/project/${router.query.ref}/auth/providers`}>
                    这里
                  </Link>
                </span>{' '}
                设置第三方 OAuth 登录方式。
              </p>
              <p>
                查看所有可用的{' '}
                <a
                  href="https://supabase.com/docs/guides/auth#providers"
                  target="_blank"
                  rel="noreferrer"
                >
                  第三方 OAuth 登录方式
                </a>
              </p>
              <p>
                完成登录后，通过客户端 SDK 的所有交互都会被视为“该用户”。
              </p>
              <p>
                从{` `}
                <a
                  href="https://console.developers.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                >
                  Google
                </a>
                ,{` `}
                <a
                  href="https://github.com/settings/applications/new"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
                ,{` `}
                <a href="https://gitlab.com/oauth/applications" target="_blank" rel="noreferrer">
                  GitLab
                </a>
                ,{` `}
                <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer">
                  Facebook
                </a>
                ,{` `}
                <a
                  href="https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Bitbucket
                </a>
                生成客户端 ID 和密钥。
              </p>
            </article>
            <article className="code">
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.authThirdPartyLogin(endpoint, keyToShow)}
              />
            </article>
          </div>
        </>
      )}

      <h2 className="doc-heading">用户</h2>
      <div className="doc-section ">
        <article className="code-column text-foreground">
          <p>获取登录用户的 JSON 对象。</p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authUser(endpoint, keyToShow)}
          />
        </article>
      </div>

      <h2 className="doc-heading">忘记了密码</h2>
      <div className="doc-section ">
        <article className="code-column text-foreground">
          <p>
            通过电子邮件向用户发送一个登录链接。
            一旦用户登录，您应该将用户导向一个新密码表单。并使用“更新用户”下方的按钮保存新密码。
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authRecover(endpoint, keyToShow)}
          />
        </article>
      </div>

      <h2 className="doc-heading">更新用户</h2>
      <div className="doc-section ">
        <article className="code-column text-foreground">
          <p>
            更新用户的电子邮件或密码。每个键（电子邮件、密码和数据）都是可选的
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authUpdate(endpoint, keyToShow)}
          />
        </article>
      </div>

      <h2 className="doc-heading">注销</h2>
      <div className="doc-section ">
        <article className="code-column text-foreground">
          <p>
            完成注销后，通过客户端 SDK 的所有交互都会被视为“匿名”。
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authLogout(endpoint, keyToShow)}
          />
        </article>
      </div>

      <h2 className="doc-heading">通过电子邮件向用户发送邀请</h2>
      <div className="doc-section ">
        <article className="code-column text-foreground">
          <p>
            通过电子邮件向用户发送一个无密码链接，他们可以使用该链接注册和登录。
          </p>
          <p>
            一旦用户点击了链接，之后通过客户端 SDK 的所有交互都会被视为“该用户”。
          </p>
          <p>
            此接口需要在初始化客户端时使用<code>service_role_key</code>，并且只能在服务器端调用，切勿在客户端调用。
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authInvite(endpoint, keyToShow)}
          />
        </article>
      </div>
    </>
  )
}
