export const DOCS_MENU = [
  { name: '连接', key: 'introduction' },
  { name: '用户管理', key: 'user-management' },
  { name: '表和视图', key: 'entities' },
  { name: '存储过程', key: 'stored-procedures' },
  { name: '文件存储', key: 'storage' },
  // { name: '云函数', key: 'edge-functions' },
  { name: '实时通信', key: 'realtime' },
]

export const DOCS_CONTENT = {
  init: {
    key: 'introduction',
    category: 'introduction',
    title: `连接到项目`,
    description: `项目都有一套 RESTful API 接口，您可以通过项目的 API 密钥来查询和管理数据库。请将这些密钥放入您的 .env 文件中。`,
    js: (apikey?: string, endpoint?: string) => `
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '${endpoint}'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)`,
    bash: () => `# 无需客户端 SDK 即可在 Bash 中使用。`,
  },
  clientApiKeys: {
    key: 'client-api-keys',
    category: 'introduction',
    title: `客户端密钥`,
    description: `客户端密钥允许“匿名访问”到您的数据库，直到用户完成登录。登录后，密钥将切换到该用户的登录令牌。

在本文档中，我们将使用名称 \`SUPABASE_KEY\` 来表示密钥。您可以在 [API 设置](/project/[ref]/settings/api) 页面中找到 \`anon\` 密钥。`,
    js: (apikey?: string, endpoint?: string) => `
const SUPABASE_KEY = '${apikey}'
const SUPABASE_URL = '${endpoint}'
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_KEY);`,
    bash: (apikey?: string, endpoint?: string) => `${apikey}`,
  },
  serviceApiKeys: {
    key: 'service-keys',
    category: 'introduction',
    title: `服务端密钥`,
    description: `服务端密钥具有数据的完全访问权限，绕过任何安全策略。请务必小心暴露这些密钥。它们只应该在服务端使用，绝不应该在客户端或浏览器上使用。

在本文档中，我们将使用名称 \`SERVICE_KEY\` 来引用密钥。您可以在 [API 设置](/project/[ref]/settings/api) 页面中找到 \`service_role\` 密钥。`,
    js: (apikey?: string, endpoint?: string) => `
const SUPABASE_KEY = '${apikey}'
const SUPABASE_URL = 'https://${endpoint}'
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_KEY);`,
    bash: (apikey?: string, endpoint?: string) => `${apikey}`,
  },
  // User Management
  userManagement: {
    key: 'user-management',
    category: 'user-management',
    title: `概述`,
    description: `Supabase 使用户管理变得容易。

  Supabase 会自动为每个用户分配一个唯一的 ID。您可以在数据库中的任何位置引用此 ID。例如，您可以创建一张 \`profiles\` 表，该表使用 \`user_id\` 字段关联到用户。

  Supabase 已经内置了用户管理的路由，包括注册、登录和注销。`,
    js: undefined,
    bash: undefined,
  },
  signUp: {
    key: 'sign-up',
    category: 'user-management',
    title: `注册`,
    description: `允许用户注册以及创建账号。

  当用户完成注册后，所有使用 Supabase 客户端的交互都会被视为“该用户”。`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.signUp({
  email: 'someone@email.com',
  password: 'some-secure-password'
})`,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/signup' \\
-H "apikey: ${apikey}" \\
-H "Content-Type: application/json" \\
-d '{
  "email": "someone@email.com",
  "password": "some-secure-password"
}'`,
  },
  emailLogin: {
    key: 'email-login',
    category: 'user-management',
    title: `使用电子邮件和密码登录`,
    description: `
如果创建了账号，用户可以登录到您的应用。

当用户完成登录后，所有使用 Supabase JS 客户端的交互都会被视为“该用户”。`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'someone@email.com',
  password: 'some-secure-password'
})
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/token?grant_type=password' \\
-H "apikey: ${apikey}" \\
-H "Content-Type: application/json" \\
-d '{
  "email": "someone@email.com",
  "password": "some-secure-password"
}'
    `,
  },
  magicLinkLogin: {
    key: 'magic-link-login',
    category: 'user-management',
    title: `通过电子邮件发送登录链接登录`,
    description: `
发送用户一个无密码链接，他们可以使用该链接兑换访问令牌。

当用户点击链接后，所有使用 Supabase JS 客户端的交互都会被视为“该用户”。`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'someone@email.com'
})
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/magiclink' \\
-H "apikey: ${apikey}" \\
-H "Content-Type: application/json" \\
-d '{
  "email": "someone@email.com"
}'
    `,
  },
  phoneLogin: {
    key: 'phone-log-in',
    category: 'user-management',
    title: `使用电话号码和密码注册`,
    description: `
电话号码可以用作主要账号确认机制。

用户将收到一个短信验证码，他们可以使用该验证码验证他们是否拥有该电话号码。

您必须在身份验证设置页面上输入自己的 twilio 凭据才能启用短信确认。`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.signUp({
  phone: '+13334445555',
  password: 'some-password'
})
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/signup' \\
-H "apikey: ${apikey}" \\
-H "Content-Type: application/json" \\
-d '{
  "phone": "+13334445555",
  "password": "some-password"
}'
    `,
  },
  smsLogin: {
    key: 'sms-otp-log-in',
    category: 'user-management',
    title: `通过短信验证码登录`,
    description: `
短信验证码类似于 magic link，除了您还要提供一个界面来验证用户收到的 6 位数字验证码。

您必须在身份验证设置页面上输入自己的 twilio 凭据才能启用基于短信的登录。`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+13334445555'
})
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/otp' \\
-H "apikey: ${apikey}" \\
-H "Content-Type: application/json" \\
-d '{
  "phone": "+13334445555"
}'
    `,
  },
  smsVerify: {
    key: 'sms-verify',
    category: 'user-management',
    title: `验证短信验证码`,
    description: `
当用户收到验证码后，他们可以在表单中输入并发送验证码进行验证

您必须在身份验证设置页面上输入自己的 twilio 凭据才能启用基于短信的 OTP 验证。`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+13334445555',
  token: '123456',
  type: 'sms'
})
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/verify' \\
-H "apikey: ${apikey}" \\
-H "Content-Type: application/json" \\
-d '{
  "type": "sms",
  "phone": "+13334445555",
  "token": "123456"
}'
    `,
  },
  oauthLogin: {
    key: 'oauth-login',
    category: 'user-management',
    title: `使用第三方 OAuth 登录`,
    description: `
用户可以使用第三方 OAuth 登录，如 Google、Facebook、GitHub 等。您必须先在身份验证提供商设置中启用这些选项 [这里](https://supabase.com)。

查看所有可用的 [第三方 OAuth 提供商](https://supabase.com)。

登录后，使用 Supabase JS 客户端的所有交互都将被视为“该用户”。

从 [Google](https://console.developers.google.com/apis/credentials)、[Github](https://github.com/settings/applications/new)、[Gitlab](https://gitlab.com/oauth/applications)、[Facebook](https://developers.facebook.com/apps) 和 [Bitbucket](https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud)生成您的 Client ID 和 secret `,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github'
})
    `,
    bash: (apikey?: string, endpoint?: string) => `No available command`,
  },
  user: {
    key: 'get-user',
    category: 'user-management',
    title: `获取用户`,
    description: `获取登录用户的 JSON 对象。`,
    js: (apikey?: string, endpoint?: string) => `
const { data: { user } } = await supabase.auth.getUser()
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X GET '${endpoint}/auth/v1/user' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer USER_TOKEN"
    `,
  },
  forgotPassWordEmail: {
    key: 'forgot-password-email',
    category: 'user-management',
    title: `忘记密码或电子邮件`,
    description: `通过电子邮件向用户发送登录链接。用户一旦登录，您应该将用户导向一个新密码表单，并在下方使用“更新用户”保存新密码。`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/recover' \\
-H "apikey: ${apikey}" \\
-H "Content-Type: application/json" \\
-d '{
"email": "someone@email.com"
}'
`,
  },
  updateUser: {
    key: 'update-user',
    category: 'user-management',
    title: `更新用户`,
    description: `更新用户的电子邮件地址或密码。每个键（email、password 和 data）都是可选的。`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.updateUser({
  email: "new@email.com",
  password: "new-password",
  data: { hello: 'world' }
})
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X PUT '${endpoint}/auth/v1/user' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer <USERS-ACCESS-TOKEN>" \\
-H "Content-Type: application/json" \\
-d '{
"email": "someone@email.com",
"password": "new-password",
"data": {
  "key": "value"
}
}'
`,
  },
  logout: {
    key: 'log-out',
    category: 'user-management',
    title: `注销`,
    description: `调用注销后，使用 Supabase JS 客户端的所有交互都将被视为“匿名”。`,
    js: (apikey?: string, endpoint?: string) => `
const { error } = await supabase.auth.signOut()
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/logout' \\
-H "apikey: ${apikey}" \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer USER_TOKEN"
    `,
  },
  emailInvite: {
    key: 'email-invite',
    category: 'user-management',
    title: `通过电子邮件邀请用户`,
    description: `
向用户发送一个无密码链接，他们可以使用该链接注册和登录。

用户点击链接后，使用 Supabase JS 客户端的所有交互都将被视为“该用户”。

此接口需要在初始化客户端时使用 \`service_role_key\`，并且只能在服务端调用，不要在客户端调用。`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.api.inviteUserByEmail('someone@email.com')
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/invite' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}" \\
-H "Content-Type: application/json" \\
-d '{
  "email": "someone@email.com"
}'
    `,
  },
  // Storage
  storage: {
    key: 'storage',
    category: 'storage',
    title: `概述`,
    description: `文件存储使文件上传和文件访问控制变得简单。

您可以使用文件存储模块存储图像、视频、文档和其他任何文件类型。通过全球 CDN 为超过 285 个城市提供快速的服务。文件存储内置了图像优化器，因此您可以在不牺牲质量的情况下在运行时动态调整媒体文件的尺寸以及压缩。`,
    js: undefined,
    bash: undefined,
  },
  // Edge functions
  edgeFunctions: {
    key: 'edge-function',
    category: 'edge-functions',
    title: '概述',
    description: `
云函数是在服务器端运行的 TypeScript 函数。它们可用于侦听 webhooks 或将与第三方服务（如 Stripe）集成到项目中。云函数使用 Deno 开发，这将使开发者更容易上手。
`,
    js: undefined,
    bash: undefined,
  },
  edgeFunctionsPreReq: {
    key: 'edge-function-pre-req',
    category: 'edge-functions',
    title: '前提条件',
    description: `
按照以下步骤在本地机器上准备您的项目。

- 安装 Supabase [CLI](https://supabase.com/docs/guides/cli).
- [登录到 CLI](https://supabase.com/docs/reference/cli/usage#supabase-login) 使用命令：\`supabase login\`..
- [初始化项目](https://supabase.com/docs/guides/getting-started/local-development#getting-started) 在项目中使用命令：\`supabase init\`..
- [连接到云端项目](https://supabase.com/docs/reference/cli/usage#supabase-link) 使用命令 \`supabase link --project-ref [ref]\`..
- 设置开发环境：按照[这里](https://supabase.com/docs/guides/functions/quickstart#setting-up-your-environment)的步骤进行设置。
`,
    js: undefined,
    bash: undefined,
  },
  createEdgeFunction: {
    key: 'create-edge-function',
    category: 'edge-functions',
    title: '创建一个云函数',
    description: `
通过 Supabase CLI 在本地创建一个云函数。
`,
    js: () => `// 通过 Supabase CLI 创建一个云函数`,
    bash: () => `
supabase functions new hello-world
`,
  },
  deployEdgeFunction: {
    key: 'deploy-edge-function',
    category: 'edge-functions',
    title: '部署一个云函数',
    description: `
通过 Supabase CLI 将一个云函数部署到您的项目。
`,
    js: () => `// 通过 Supabase CLI 部署一个云函数`,
    bash: () => `supabase functions deploy hello-world --project-ref [ref]
`,
  },
  // Entities
  entitiesIntroduction: {
    key: 'entities-introduction',
    category: 'entities',
    title: '概述',
    description: `
在 \`public\` 模式下所有的视图和表，以及那些可由当前角色访问的表，都可以通过 API 查询。

如果您有不想通过 API 公开的表，只需将它们添加到不同的模式（非 \`public\` 模式）。
`,
    js: undefined,
    bash: undefined,
  },
  generatingTypes: {
    key: 'generating-types',
    category: 'entities',
    title: '生成类型',
    description: `
Supabase API 是从您的数据库生成的，这意味着我们可以使用数据库内省来生成类型安全的 API 定义。

您可以通过 [Supabase CLI](https://supabase.com/docs/guides/database/api/generating-types) 或通过右侧的下载按钮将类型文件导入到您的应用程序的 \`src/index.ts\` 文件中。
`,
    js: undefined,
    bash: undefined,
  },
//   graphql: {
//     key: 'graphql',
//     category: 'entities',
//     title: 'GraphQL vs PostgREST',
//     description: `
// 如果您有 GraphQL 使用经历，您可能会想知道是否可以在单个往返中获取您的数据。答案是肯定的！语法非常相似。这个例子展示了如何使用 Apollo GraphQL 和 Supabase 实现相同的功能。

// 仍然想使用 GraphQL？
// 如果您仍然想使用 GraphQL，可以的。Supabase 提供了一个完整的 Postgres 数据库，因此只要您的中间件可以连接到数据库，您就可以继续使用您喜爱的工具。您可以在 [设置](/project/[ref]/settings/database) 中找到数据库连接详细信息。
// `,
//     js: (apikey?: string, endpoint?: string) => `
// // 使用 Apollo GraphQL
// const { loading, error, data } = useQuery(gql\`
//   query GetDogs {
//     dogs {
//       id
//       breed
//       owner {
//         id
//         name
//       }
//     }
//   }
//     \`)

// // 使用 Supabase
// const { data, error } = await supabase
//   .from('dogs')
//   .select(\`
//       id, breed,
//       owner (id, name)
//   \`)
// `,
//     bash: (apikey?: string, endpoint?: string) => `
// // 使用 Apollo GraphQL
// const { loading, error, data } = useQuery(gql\`
//   query GetDogs {
//     dogs {
//       id
//       breed
//       owner {
//         id
//         name
//       }
//     }
//   }
//     \`)

// // 使用 Supabase
// const { data, error } = await supabase
//   .from('dogs')
//   .select(\`
//       id, breed,
//       owner (id, name)
//   \`)
//     `,
//   },
  // Stored Procedures
  storedProceduresIntroduction: {
    key: 'stored-procedures-introduction',
    category: 'stored-procedures',
    title: '概述',
    description: `
数据库中的所有存储过程都可以通过 API 直接访问。这意味着您可以直接在数据库中构建逻辑（如果您足够勇敢）！

API 接口支持 POST 方式（有些情况下是 GET 方式）调用存储过程。
`,
    js: undefined,
    bash: undefined,
  },
  // Realtime
  realtime: {
    key: 'realtime-introduction',
    category: 'realtime',
    title: '概述',
    description: `
Supabase 提供了一个全球分布的实时服务器集群，可用于以下功能：

- [广播](https://supabase.com/docs/guides/realtime/broadcast): 客户端之间发送实时通信，具有较低的延迟。
- [状态同步](https://supabase.com/docs/guides/realtime/presence): 跟踪和同步客户端之间的共享状态。
- [数据库变更](https://supabase.com/docs/guides/realtime/postgres-changes): 监听数据库变更并将其发送给授权客户端。
`,
    js: undefined,
    bash: undefined,
  },
  subscribeChannel: {
    key: 'subscribe-to-channel',
    category: 'realtime',
    title: '订阅频道',
    description: `
创建一个事件处理程序，用于侦听更改。

- 默认情况下，广播和状态同步对所有项目都是启用的。
- 默认情况下，侦听数据库更改对新项目是禁用的，因为数据库性能和安全方面的考虑。您可以通过管理实时通信 API 的 [复制](https://supabase.com/docs/guides/api#realtime-api-overview) 来打开它。
- 您可以通过将表的 \`REPLICA IDENTITY\` 设置为 \`FULL\` （例如 \`ALTER TABLE your_table REPLICA IDENTITY FULL;\`）来接收更新和删除操作的“先前”数据。
- 行级安全策略不应用于删除语句。当启用 RLS 并将复制同步标识设置为 full 时，仅发送主键给客户端。
`,
    js: () => `
supabase
  .channel('any')
  .on('broadcast', { event: 'cursor-pos' }, payload => {
    console.log('Cursor position received!', payload)
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      channel.send({
        type: 'broadcast',
        event: 'cursor-pos',
        payload: { x: Math.random(), y: Math.random() },
      })
    }
  })
    `,
    bash: () => `# 实时通信推送功能仅能通过客户端 SDK 支持`,
  },
  unsubscribeChannel: {
    key: 'unsubscribe-channel',
    category: 'realtime',
    title: '取消订阅频道',
    description: `
取消订阅并删除实时通信频道。

当您正在侦听数据库更改时，删除频道是维护您项目的实时通信服务性能以及数据库性能的好方法。Supabase 将在客户端断开连接 30 秒后自动清理未使用的频道，但多个客户端同时订阅同一频道可能会导致性能下降。
`,
    js: () => `supabase.removeChannel(myChannel)`,
    bash: () => `# 实时通信推送功能仅能通过客户端 SDK 支持`,
  },
  unsubscribeChannels: {
    key: 'unsubscribe-channels',
    category: 'realtime',
    title: '取消订阅所有频道',
    description: `
取消订阅并删除所有实时通信频道。

当您正在侦听数据库更改时，删除频道是维护您项目的实时通信服务性能以及数据库性能的好方法。Supabase 将在客户端断开连接 30 秒后自动清理未使用的频道，但多个客户端同时订阅同一频道可能会导致性能下降。
`,
    js: () => `supabase.removeChannels()`,
    bash: () => `# 实时通信推送功能仅能通过客户端 SDK 支持`,
  },
  retrieveAllChannels: {
    key: 'retrieve-all-channels',
    category: 'realtime',
    title: '获取订阅的频道',
    description: `
返回所有实时通信频道。
`,
    js: () => `const channels = supabase.getChannels()`,
    bash: () => `# 实时通信推送功能仅能通过客户端 SDK 支持`,
  },
}

export const DOCS_RESOURCE_CONTENT: {
  [key: string]: {
    key: string
    title: string
    category: string
    description?: string
    docsUrl: string
    code: (props: any) => { key: string; title?: string; bash: string; js: string }[]
  }
} = {
  rpcSingle: {
    key: 'invoke-function',
    title: '调用函数',
    category: 'stored-procedures',
    description: undefined,
    docsUrl: 'https://supabase.com/docs/reference/javascript/rpc',
    code: ({
      rpcName,
      rpcParams,
      endpoint,
      apikey,
      showBearer = true,
    }: {
      rpcName: string
      rpcParams: any[]
      endpoint: string
      apikey: string
      showBearer: boolean
    }) => {
      let rpcList = rpcParams.map((x) => `"${x.name}": "value"`).join(', ')
      let noParams = !rpcParams.length
      let bashParams = noParams ? '' : `\n-d '{ ${rpcList} }' \\`
      let jsParams = noParams
        ? ''
        : `, {${
            rpcParams.length
              ? rpcParams
                  .map((x) => `\n    ${x.name}`)
                  .join(`, `)
                  .concat('\n  ')
              : ''
          }}`
      return [
        {
          key: 'rpc-single',
          title: undefined,
          bash: `
  curl -X POST '${endpoint}/rest/v1/rpc/${rpcName}' \\${bashParams}
  -H "Content-Type: application/json" \\
  -H "apikey: ${apikey}" ${
    showBearer
      ? `\\
  -H "Authorization: Bearer ${apikey}"`
      : ''
  }
        `,
          js: `
let { data, error } = await supabase
  .rpc('${rpcName}'${jsParams})

if (error) console.error(error)
else console.log(data)
        `,
        },
      ]
    },
  },
  readRows: {
    key: 'read-rows',
    title: `读取行`,
    category: 'entities',
    docsUrl: 'https://supabase.com/docs/reference/javascript/select',
    description: `读取此表中的行，请使用 \`select\` 方法。`,
    code: ({
      resourceId,
      endpoint,
      apikey,
    }: {
      resourceId: string
      endpoint: string
      apikey: string
    }) => {
      return [
        {
          key: 'read-all-rows',
          title: '读取所有行',
          bash: `
curl '${endpoint}/rest/v1/${resourceId}?select=*' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}"
          `,
          js: `
let { data: ${resourceId}, error } = await supabase
  .from('${resourceId}')
  .select('*')
          `,
        },
        {
          key: 'read-specific-columns',
          title: '读取特定列',
          bash: `
curl '${endpoint}/rest/v1/${resourceId}?select=some_column,other_column' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}"
          `,
          js: `
let { data: ${resourceId}, error } = await supabase
  .from('${resourceId}')
  .select('some_column,other_column')
  `,
        },
        {
          key: 'read-foreign-tables',
          title: '读取关联表',
          bash: `
curl '${endpoint}/rest/v1/${resourceId}?select=some_column,other_table(foreign_key)' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}"
          `,
          js: `
let { data: ${resourceId}, error } = await supabase
  .from('${resourceId}')
  .select(\`
    some_column,
    other_table (
      foreign_key
    )
  \`)
          `,
        },
        {
          key: 'with-pagination',
          title: '使用分页',
          bash: `
curl '${endpoint}/rest/v1/${resourceId}?select=*' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}" \\
-H "Range: 0-9"
          `,
          js: `
let { data: ${resourceId}, error } = await supabase
  .from('${resourceId}')
  .select('*')
  .range(0, 9)
          `,
        },
      ]
    },
  },
  filtering: {
    key: 'filter-rows',
    category: 'entities',
    title: '过滤',
    description: `Supabase 提供了丰富的过滤方法`,
    docsUrl: 'https://supabase.com/docs/reference/javascript/using-filters',
    code: ({
      resourceId,
      endpoint,
      apikey,
    }: {
      resourceId: string
      endpoint: string
      apikey: string
    }) => {
      return [
        {
          key: 'with-filtering',
          title: '使用过滤',
          bash: `
curl --get '${endpoint}/rest/v1/${resourceId}' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}" \\
-H "Range: 0-9" \\
-d "select=*" \\
\\
\`# Filters\` \\
-d "column=eq.Equal+to" \\
-d "column=gt.Greater+than" \\
-d "column=lt.Less+than" \\
-d "column=gte.Greater+than+or+equal+to" \\
-d "column=lte.Less+than+or+equal+to" \\
-d "column=like.*CaseSensitive*" \\
-d "column=ilike.*CaseInsensitive*" \\
-d "column=is.null" \\
-d "column=in.(Array,Values)" \\
-d "column=neq.Not+equal+to" \\
\\
\`# Arrays\` \\
-d "array_column=cs.{array,contains}" \\
-d "array_column=cd.{contained,by}" \\
\\
\`# Logical operators\` \\
-d "column=not.like.Negate+filter" \\
-d "or=(some_column.eq.Some+value,other_column.eq.Other+value)"
        `,
          js: `
let { data: ${resourceId}, error } = await supabase
  .from('${resourceId}')
  .select("*")

  // 过滤条件
  .eq('column', 'Equal to')
  .gt('column', 'Greater than')
  .lt('column', 'Less than')
  .gte('column', 'Greater than or equal to')
  .lte('column', 'Less than or equal to')
  .like('column', '%CaseSensitive%')
  .ilike('column', '%CaseInsensitive%')
  .is('column', null)
  .in('column', ['Array', 'Values'])
  .neq('column', 'Not equal to')

  // 数组
  .contains('array_column', ['array', 'contains'])
  .containedBy('array_column', ['contained', 'by'])

  // Logical operators
  .not('column', 'like', 'Negate filter')
  .or('some_column.eq.Some value, other_column.eq.Other value')
          `,
        },
      ]
    },
  },
  insertRows: {
    key: 'insert-rows',
    category: 'entities',
    title: '插入行',
    description: `
\`insert\` 让您能够向表插入数据。您也可以批量插入并执行 UPSERT。

\`insert\` 也会返回 UPSERT 操作的替换值。
`,
    docsUrl: 'https://supabase.com/docs/reference/javascript/insert',
    code: ({
      resourceId,
      endpoint,
      apikey,
    }: {
      resourceId: string
      endpoint: string
      apikey: string
    }) => {
      return [
        {
          key: 'insert-a-row',
          title: '插入一行',
          bash: `
curl -X POST '${endpoint}/rest/v1/${resourceId}' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}" \\
-H "Content-Type: application/json" \\
-H "Prefer: return=minimal" \\
-d '{ "some_column": "someValue", "other_column": "otherValue" }'
          `,
          js: `
const { data, error } = await supabase
  .from('${resourceId}')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
          `,
        },
        {
          key: 'insert-many-rows',
          title: '插入多行',
          bash: `
curl -X POST '${endpoint}/rest/v1/${resourceId}' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}" \\
-H "Content-Type: application/json" \\
-d '[{ "some_column": "someValue" }, { "other_column": "otherValue" }]'
          `,
          js: `
const { data, error } = await supabase
  .from('${resourceId}')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
          `,
        },
        {
          key: 'upsert-matching-rows',
          title: '插入或更新行',
          bash: `
curl -X POST '${endpoint}/rest/v1/${resourceId}' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}" \\
-H "Content-Type: application/json" \\
-H "Prefer: resolution=merge-duplicates" \\
-d '{ "some_column": "someValue", "other_column": "otherValue" }'
          `,
          js: `
const { data, error } = await supabase
  .from('${resourceId}')
  .upsert({ some_column: 'someValue' })
  .select()
          `,
        },
      ]
    },
  },
  updateRows: {
    key: 'update-rows',
    category: 'entities',
    title: '更新行',
    description: `
\`update\` 让您能够更新行。\`update\` 将默认匹配所有行。您可以使用过滤器，例如 \`eq\`、\`lt\` 和 \`is\`，来更新特定的行。

\`update\` 也会返回 UPDATE 操作的替换值。
`,
    docsUrl: 'https://supabase.com/docs/reference/javascript/update',
    code: ({
      resourceId,
      endpoint,
      apikey,
    }: {
      resourceId: string
      endpoint: string
      apikey: string
    }) => {
      return [
        {
          key: 'update-matching-rows',
          title: '更新特定行',
          bash: `
curl -X PATCH '${endpoint}/rest/v1/${resourceId}?some_column=eq.someValue' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}" \\
-H "Content-Type: application/json" \\
-H "Prefer: return=minimal" \\
-d '{ "other_column": "otherValue" }'
          `,
          js: `
const { data, error } = await supabase
  .from('${resourceId}')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
          `,
        },
      ]
    },
  },
  deleteRows: {
    key: 'delete-rows',
    category: 'entities',
    title: '删除行',
    description: `
\`delete\` 让您能够删除行。\`delete\` 将默认匹配所有行，因此请务必指定过滤条件！
`,
    docsUrl: 'https://supabase.com/docs/reference/javascript/delete',
    code: ({
      resourceId,
      endpoint,
      apikey,
    }: {
      resourceId: string
      endpoint: string
      apikey: string
    }) => {
      return [
        {
          key: 'delete-matching-rows',
          title: '删除特定行',
          bash: `
curl -X DELETE '${endpoint}/rest/v1/${resourceId}?some_column=eq.someValue' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}"
          `,
          js: `
const { error } = await supabase
  .from('${resourceId}')
  .delete()
  .eq('some_column', 'someValue')
          `,
        },
      ]
    },
  },
  subscribeChanges: {
    key: 'subscribe-changes',
    category: 'entities',
    title: '订阅更改',
    description: `
Supabase 提供实时通信功能，根据行级安全策略（RLS），将数据库更改广播给授权用户。
`,
    docsUrl: 'https://supabase.com/docs/reference/javascript/subscribe',
    code: ({ resourceId }: { resourceId: string }) => {
      return [
        {
          key: 'subscribe-all-events',
          title: '订阅所有事件',
          bash: `# 实时通信功能只能通过客户端 SDK 支持`,
          js: `
const channels = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: '${resourceId}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
        },
        {
          key: 'subscribe-to-inserts',
          title: '订阅插入操作',
          bash: `# 实时通信功能只能通过客户端 SDK 支持`,
          js: `
const channels = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: '${resourceId}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
        },
        {
          key: 'subscribe-to-updates',
          title: '订阅更新操作',
          bash: `# 实时通信功能只能通过客户端 SDK 支持`,
          js: `
const channels = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: '${resourceId}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
        },
        {
          key: 'subscribe-to-deletes',
          title: '订阅删除操作',
          bash: `# 实时通信功能只能通过客户端 SDK 支持`,
          js: `
const channels = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: '${resourceId}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
        },
        {
          key: 'subscribe-to-specific-rows',
          title: '订阅特定行',
          bash: `# 实时通信功能只能通过客户端 SDK 支持`,
          js: `
const channels = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: '${resourceId}', filter: 'some_column=eq.some_value' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
        },
      ]
    },
  },
  uploadFile: {
    key: 'upload-file',
    category: 'storage',
    title: '上传文件',
    docsUrl: 'https://supabase.com/docs/reference/javascript/storage-from-upload',
    description: `
上传文件到已存在的存储桶。RLS 策略权限要求：
- \`buckets\` 表权限：无需权限
- \`objects\` 表权限：当您上传新文件时需 \`insert\`权限， 当您替换文件时需\`select\`， \`insert\`，和 \`update\` 权限。
`,
    code: ({ name, apikey, endpoint }: { name: string; apikey: string; endpoint: string }) => [
      {
        key: 'storage-upload-file',
        title: undefined,
        bash: `
curl -X POST '${endpoint}/storage/v1/object/${name}/folder/avatar1.png' \\
-H 'Content-Type: image/png' \\
-H "Authorization: Bearer ${apikey}" \\
--data-binary @/path/to/your/file'
-H 'Content-Type: multipart/form-data' \\
-H "Authorization: Bearer ${apikey}" \\
--data-raw $'your_file_data'
        `,
        js: `
const avatarFile = event.target.files[0]
const { data, error } = await supabase
  .storage
  .from('${name}')
  .upload('folder/avatar1.png', avatarFile, {
    cacheControl: '3600',
    upsert: false
  })
`,
      },
    ],
  },
  deleteFiles: {
    key: 'delete-files',
    category: 'storage',
    title: '删除文件',
    docsUrl: 'https://supabase.com/docs/reference/javascript/storage-from-remove',
    description: `
删除文件。RLS 策略权限要求：
- \`buckets\` 表权限：无需权限
- \`objects\` 表权限：\`delete\` 和 \`select\` 权限
`,
    code: ({ name, apikey, endpoint }: { name: string; apikey: string; endpoint: string }) => [
      {
        key: 'storage-delete-files',
        title: undefined,
        bash: `
curl -X DELETE '${endpoint}/storage/v1/object/${name}' \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer ${apikey}" \\
-d '{ "prefixes": ["file_name", "another_file_name"] }'
`,
        js: `
const { data, error } = await supabase
  .storage
  .from('${name}')
  .remove(['folder/avatar1.png'])
        `,
      },
    ],
  },
  listFiles: {
    key: 'list-files',
    category: 'storage',
    title: '列出所有文件',
    docsUrl: 'https://supabase.com/docs/reference/javascript/storage-from-list',
    description: `
列出所有文件。RLS 策略权限要求：
- \`buckets\` 表权限：无需权限
- \`objects\` 表权限：\`select\` 权限
`,
    code: ({ name, apikey, endpoint }: { name: string; apikey: string; endpoint: string }) => [
      {
        key: 'storage-list-files',
        title: undefined,
        bash: `
curl -X POST '${endpoint}/storage/v1/object/list/${name}' \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer ${apikey}" \\
-d '{ "limit": 100, "offset": 0, "prefix": "", "sortBy": { "column": "name", "order": "asc" } }'`,
        js: `
const { data, error } = await supabase
  .storage
  .from('${name}')
  .list('folder', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  })
        `,
      },
    ],
  },
  downloadFile: {
    key: 'download-file',
    category: 'storage',
    title: '下载文件',
    docsUrl: 'https://supabase.com/docs/reference/javascript/storage-from-download',
    description: `
从一个私有的存储桶下载文件。对于公开的存储桶，您可以向 getPublicUrl 返回的 URL 发出请求。RLS 策略权限要求：
- \`buckets\` 表权限：无需权限
- \`objects\` 表权限：\`select\` 权限
`,
    code: ({ name, apikey, endpoint }: { name: string; apikey: string; endpoint: string }) => [
      {
        key: 'storage-download-file',
        title: undefined,
        bash: `
curl -X GET '${endpoint}/storage/v1/object/${name}/folder/avatar1.png' \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer ${apikey}" \\
--output avatar1.png
`,
        js: `
const { data, error } = await supabase
  .storage
  .from('${name}')
  .download('folder/avatar1.png')
      `,
      },
    ],
  },
  createSignedURL: {
    key: 'create-signed-url',
    category: 'storage',
    title: '创建一个签名 URL',
    docsUrl: 'https://supabase.com/docs/reference/javascript/storage-from-createsignedurl',
    description: `
创建一个签名 URL，可用于在固定时间内共享文件。RLS 策略权限要求：
- \`buckets\` 表权限：无需权限
- \`objects\` 表权限：\`select\` 权限
`,
    code: ({ name, apikey, endpoint }: { name: string; apikey: string; endpoint: string }) => [
      {
        key: 'storage-create-signed-url',
        title: undefined,
        bash: `
curl -X POST '${endpoint}/storage/v1/object/sign/${name}/folder/avatar1.png' \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer ${apikey}" \\
-d '{ "expiresIn": 60 }'
        `,
        js: `
const { data, error } = await supabase
  .storage
  .from('${name}')
  .createSignedUrl('folder/avatar1.png', 60)
        `,
      },
    ],
  },
  retrievePublicURL: {
    key: 'retrieve-public-url',
    category: 'storage',
    title: '获取公开 URL',
    docsUrl: 'https://supabase.com/docs/reference/javascript/storage-from-getpublicurl',
    description: `
一个用于获取存储桶中文件资源的公开 URL 的简易函数。如果您不想使用这个函数，可以通过拼接存储桶的 URL 和资源路径来构造公开 URL。

此函数不验证存储桶是否公开。如果为一个非公开的存储桶创建了公开 URL，您将无法下载文件资源。

存储桶需要设置为公开，通过 \`updateBucket()\` 或在 supabase.com/dashboard 上的存储桶页面上，通过点击存储桶的弹出菜单并选择“设为公开”

RLS 策略权限要求：
- \`buckets\` 表权限：无需权限
- \`objects\` 表权限：无需权限
`,
    code: ({ name, apikey, endpoint }: { name: string; apikey: string; endpoint: string }) => [
      {
        key: 'storage-retrieve-public-url',
        title: undefined,
        bash: `
# 无可用 bash 命令。
# 您可以通过拼接存储桶的 URL 和资源路径来构造公开 URL。
# 例如 ${endpoint}/storage/v1/object/public/${name}/folder/avatar1.png`,
        js: `
const { data } = supabase
  .storage
  .from('${name}')
  .getPublicUrl('folder/avatar1.png')
        `,
      },
    ],
  },
  invokeEdgeFunction: {
    key: 'invoke-edge-function',
    category: 'edge-functions',
    title: '调用 Edge Function',
    docsUrl: 'https://supabase.com/docs/reference/javascript/functions-invoke',
    description: `
调用 Supabase Edge Function。需要一个 Authorization 头部，并且调用参数通常遵循 [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) 规范。

当您向函数传递一个请求体时，我们会自动附加 \`Blob\`、\`ArrayBuffer\`、\`File\`、\`FormData\` 和 \`String\` 的 \`Content-Type\` 请求头。如果不匹配这些类型，我们会假设负载是 \`json\`，将其序列化为 JSON 并附加 \`Content-Type\` 头部为 \`application/json\`。您可以通过传递自己的 \`Content-Type\` 头部来覆盖此行为。

响应会自动解析为 \`json\`、\`blob\` 和 \`form-data\`，根据您的函数发送的 \`Content-Type\` 请求头。默认情况下，响应会被解析为 \`text\`。
`,
    code: ({ name, endpoint, apikey }: { name: string; endpoint: string; apikey: string }) => [
      {
        key: 'invoke-edge-function',
        title: undefined,
        bash: `
curl --request POST '${endpoint}/functions/v1/${name}' \\
--header 'Authorization: Bearer ${apikey}' \\
--header 'Content-Type: application/json' \\
--data '{ "name": "Functions" }'
        `,
        js: `
const { data, error } = await supabase
  .functions
  .invoke('${name}', {
    body: { foo: 'bar' }
  })`,
      },
    ],
  },
}
