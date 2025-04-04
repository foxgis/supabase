import { useParams } from 'common'
import Link from 'next/link'

import CodeSnippet from 'components/interfaces/Docs/CodeSnippet'
import GeneratingTypes from 'components/interfaces/Docs/GeneratingTypes'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import PublicSchemaNotEnabledAlert from '../../PublicSchemaNotEnabledAlert'

interface IntroductionProps {
  selectedLang: 'bash' | 'js'
}

const Introduction = ({ selectedLang }: IntroductionProps) => {
  const { ref: projectRef } = useParams()

  const { data: config, isSuccess } = useProjectPostgrestConfigQuery({ projectRef })

  const isPublicSchemaEnabled = config?.db_schema
    .split(',')
    .map((name) => name.trim())
    .includes('public')

  return (
    <>
      <h2 className="doc-heading">概述</h2>
      <div className="doc-section">
        <article className="code-column text-foreground flex flex-col gap-y-2">
          <p>
            数据库中 <code>public</code> 模式下所有可被活动角色访问的视图和表都可以通过 API 访问。
          </p>
        </article>
        <article className="code">
          {isSuccess && !isPublicSchemaEnabled && <PublicSchemaNotEnabledAlert />}
        </article>
      </div>

      <h2 className="doc-heading">不公开的表</h2>
      <div className="doc-section">
        <article className="code-column text-foreground">
          <p>
            如果您不想通过 API 公开表，只需将它们添加到不同的模式中（非 <code>public</code> 模式）。
          </p>
        </article>
        <article className="code"></article>
      </div>

      <GeneratingTypes selectedLang={selectedLang} />

      {/* <h2 className="doc-heading">
        GraphQL <span className="lowercase">vs</span> Supabase
      </h2>
      <div className="doc-section">
        <article className="code-column text-foreground">
          <p>
            如果您有使用 GraphQL 的背景，您可能会想知道是否可以在单个往返中获取您的数据。答案是肯定的！
          </p>
          <p>
            语法非常相似。这个例子展示了如何使用 Apollo GraphQL 和 Supabase 实现相同的功能。
            <br />
            <br />
          </p>
          <h4>仍然想使用 GraphQL？</h4>
          <p>
            如果您仍然想使用 GraphQL，可以的。Supabase 提供了一个完整的 Postgres 数据库，因此只要确保您的中间件可以连接到数据库，您就可以继续您喜欢的工具。
            您可以在{' '}
            <Link href={`/project/${projectRef}/settings/database`}>数据库设置</Link>{' '}
            中找到数据库连接信息。
          </p>
        </article>
        <article className="code">
          <CodeSnippet selectedLang={selectedLang} snippet={localSnippets.withApollo()} />
          <CodeSnippet selectedLang={selectedLang} snippet={localSnippets.withSupabase()} />
        </article>
      </div> */}
    </>
  )
}

const localSnippets = {
  withApollo: () => ({
    title: '使用 Apollo GraphQL',
    bash: {
      language: 'js',
      code: `
const { loading, error, data } = useQuery(gql\`
  query GetDogs {
    dogs {
      id
      breed
      owner {
        id
        name
      }
    }
  }
\`)`,
    },
    js: {
      language: 'js',
      code: `
const { loading, error, data } = useQuery(gql\`
  query GetDogs {
    dogs {
      id
      breed
      owner {
        id
        name
      }
    }
  }
\`)`,
    },
  }),
  withSupabase: () => ({
    title: '使用 Supabase',
    bash: {
      language: 'js',
      code: `
const { data, error } = await supabase
  .from('dogs')
  .select(\`
      id, breed,
      owner (id, name)
  \`)
`,
    },
    js: {
      language: 'js',
      code: `
const { data, error } = await supabase
  .from('dogs')
  .select(\`
      id, breed,
      owner (id, name)
  \`)
`,
    },
  }),
}

export default Introduction
