import { Table2 } from 'lucide-react'

import { useParams } from 'common'
import CodeSnippet from 'components/interfaces/Docs/CodeSnippet'
import Description from 'components/interfaces/Docs/Description'
import Param from 'components/interfaces/Docs/Param'
import Snippets from 'components/interfaces/Docs/Snippets'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useProjectJsonSchemaQuery } from 'data/docs/project-json-schema-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'

interface ResourceContentProps {
  apiEndpoint: string
  resourceId: string
  resources: { [key: string]: { id: string; displayName: string; camelCase: string } }
  selectedLang: 'bash' | 'js'
  showApiKey: string
  refreshDocs: () => void
}

const ResourceContent = ({
  apiEndpoint,
  resourceId,
  resources,
  selectedLang,
  showApiKey,
  refreshDocs,
}: ResourceContentProps) => {
  const { ref } = useParams()
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef: ref })
  const { realtimeAll: realtimeEnabled } = useIsFeatureEnabled(['realtime:all'])

  const { data: jsonSchema } = useProjectJsonSchemaQuery({ projectRef: ref })
  const { paths, definitions } = jsonSchema || {}

  const endpoint =
    customDomainData?.customDomain?.status === 'active'
      ? `https://${customDomainData.customDomain.hostname}`
      : apiEndpoint

  const keyToShow = !!showApiKey ? showApiKey : 'SUPABASE_KEY'
  const resourcePaths = paths?.[`/${resourceId}`]
  const resourceDefinition = definitions?.[resourceId]
  const resourceMeta = resources[resourceId]
  const description = resourceDefinition?.description || ''

  const methods = Object.keys(resourcePaths ?? {}).map((x) => x.toUpperCase())
  const properties = Object.entries(resourceDefinition?.properties ?? []).map(([id, val]: any) => ({
    ...val,
    id,
    required: resourceDefinition?.required?.includes(id),
  }))

  if (!paths || !definitions) return null

  return (
    <>
      <h2 className="doc-section__table-name text-foreground mt-0 flex items-center px-6 gap-2">
        <span className="bg-slate-300 p-2 rounded-lg">
          <Table2 size={18} />
        </span>
        <span className="text-2xl font-bold">{resourceId}</span>
      </h2>

      <div className="doc-section">
        <article className="code-column text-foreground">
          <label className="font-mono text-xs uppercase text-foreground-lighter inline-block mb-2">
            描述
          </label>
          <Description
            content={description}
            metadata={{ table: resourceId }}
            onChange={refreshDocs}
          />
        </article>
        <article className="code"></article>
      </div>
      {properties.length > 0 && (
        <div>
          {properties.map((x) => (
            <div className="doc-section py-4" key={x.id}>
              <div className="code-column text-foreground">
                <Param
                  key={x.id}
                  name={x.id}
                  type={x.type}
                  format={x.format}
                  required={x.required}
                  description={x.description}
                  metadata={{
                    table: resourceId,
                    column: x.id,
                  }}
                  onDesciptionUpdated={refreshDocs}
                />
              </div>
              <div className="code">
                <CodeSnippet
                  selectedLang={selectedLang}
                  snippet={Snippets.readColumns({
                    title: `查询列 ${x.id}`,
                    resourceId,
                    endpoint: endpoint,
                    apiKey: keyToShow,
                    columnName: x.id,
                  })}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {methods.includes('GET') && (
        <>
          <h3 className="text-foreground mt-4 px-6">读取数据行</h3>
          <div className="doc-section">
            <article className="code-column text-foreground">
              <p>
                要在 <code>{resourceId}</code> 中读取行，请使用 <code>select</code> 方法。
              </p>
              <p>
                <a
                  href="https://supabase.com/docs/reference/javascript/select"
                  target="_blank"
                  rel="noreferrer"
                >
                  了解更多
                </a>
              </p>
            </article>
            <article className="code">
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readAll(resourceId, endpoint, keyToShow)}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readColumns({
                  resourceId,
                  endpoint: endpoint,
                  apiKey: keyToShow,
                })}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readForeignTables(resourceId, endpoint, keyToShow)}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readRange(resourceId, endpoint, keyToShow)}
              />
            </article>
          </div>
          <div className="doc-section">
            <article className="code-column text-foreground">
              <h4 className="mt-0 text-white">过滤</h4>
              <p> 数据中间件提供了丰富的过滤功能。</p>
              <p>
                <a
                  href="https://supabase.com/docs/reference/javascript/using-filters"
                  target="_blank"
                  rel="noreferrer"
                >
                  了解更多
                </a>
              </p>
            </article>
            <article className="code">
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.readFilters(resourceId, endpoint, keyToShow)}
              />
            </article>
          </div>
        </>
      )}
      {methods.includes('POST') && (
        <>
          <h3 className="text-foreground mt-4 px-6">插入行</h3>
          <div className="doc-section">
            <article className="code-column text-foreground">
              <p>
                <code>insert</code> 方法让您可以向表中插入数据。您也可以批量插入并执行 UPSERT。
              </p>
              <p>
                <code>insert</code> 方法也会返回 UPSERT 操作的所替换的数据。
              </p>
              <p>
                <a
                  href="https://supabase.com/docs/reference/javascript/insert"
                  target="_blank"
                  rel="noreferrer"
                >
                  了解更多
                </a>
              </p>
            </article>
            <article className="code">
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.insertSingle(resourceId, endpoint, keyToShow)}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.insertMany(resourceId, endpoint, keyToShow)}
              />
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.upsert(resourceId, endpoint, keyToShow)}
              />
            </article>
          </div>
        </>
      )}
      {methods.includes('PATCH') && (
        <>
          <h3 className="text-foreground mt-4 px-6">更新行</h3>
          <div className="doc-section">
            <article className="code-column text-foreground">
              <p>
                <code>update</code> 方法让您可以更新行。
                <code>update</code> 默认会更新所有行。
                您可以使用过滤条件来更新特定的行，例如 <code>eq</code>, <code>lt</code>和 <code>is</code>。
              </p>
              <p>
                <code>update</code> 也会返回 UPDATE 操作的所替换的数据。
              </p>
              <p>
                <a
                  href="https://supabase.com/docs/reference/javascript/update"
                  target="_blank"
                  rel="noreferrer"
                >
                  了解更多
                </a>
              </p>
            </article>
            <article className="code">
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.update(resourceId, endpoint, keyToShow)}
              />
            </article>
          </div>
        </>
      )}
      {methods.includes('DELETE') && (
        <>
          <h3 className="text-foreground mt-4 px-6">删除行</h3>
          <div className="doc-section">
            <article className="code-column text-foreground">
              <p>
                <code>delete</code> 方法让您可以删除行。
                <code>delete</code> 默认删除所有行，因此请记住使用过滤条件！
              </p>
              <p>
                <a
                  href="https://supabase.com/docs/reference/javascript/delete"
                  target="_blank"
                  rel="noreferrer"
                >
                  了解更多
                </a>
              </p>
            </article>
            <article className="code">
              <CodeSnippet
                selectedLang={selectedLang}
                snippet={Snippets.delete(resourceId, endpoint, keyToShow)}
              />
            </article>
          </div>
        </>
      )}
      {realtimeEnabled &&
        (methods.includes('DELETE') || methods.includes('POST') || methods.includes('PATCH')) && (
          <>
            <h3 className="text-foreground mt-4 px-6">监听数据表更新</h3>
            <div className="doc-section">
              <article className="code-column text-foreground">
                <p>
                  数据中间件提供了实时通信功能，让您可以广播数据表更新事件，并根据行级安全性（RLS）策略将其发送给授权的用户。
                </p>
                <p>
                  <a
                    href="https://supabase.com/docs/reference/javascript/subscribe"
                    target="_blank"
                    rel="noreferrer"
                  >
                    了解更多
                  </a>
                </p>
              </article>
              <article className="code">
                <CodeSnippet
                  selectedLang={selectedLang}
                  snippet={Snippets.subscribeAll(resourceMeta.camelCase, resourceId)}
                />
                <CodeSnippet
                  selectedLang={selectedLang}
                  snippet={Snippets.subscribeInserts(resourceMeta.camelCase, resourceId)}
                />
                <CodeSnippet
                  selectedLang={selectedLang}
                  snippet={Snippets.subscribeUpdates(resourceMeta.camelCase, resourceId)}
                />
                <CodeSnippet
                  selectedLang={selectedLang}
                  snippet={Snippets.subscribeDeletes(resourceMeta.camelCase, resourceId)}
                />
                <CodeSnippet
                  selectedLang={selectedLang}
                  snippet={Snippets.subscribeEq(
                    resourceMeta.camelCase,
                    resourceId,
                    'column_name',
                    'someValue'
                  )}
                />
              </article>
            </div>
          </>
        )}
    </>
  )
}

export default ResourceContent
