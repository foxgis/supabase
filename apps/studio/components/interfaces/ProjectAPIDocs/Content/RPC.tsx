import { useParams } from 'common'
import { useEffect } from 'react'
import { Badge } from 'ui'

import Table from 'components/to-be-cleaned/Table'
import { useProjectJsonSchemaQuery } from 'data/docs/project-json-schema-query'
import { useOpenAPISpecQuery } from 'data/open-api/api-spec-query'
import { useAppStateSnapshot } from 'state/app-state'
import { DOCS_RESOURCE_CONTENT } from '../ProjectAPIDocs.constants'
import ResourceContent from '../ResourceContent'
import type { ContentProps } from './Content.types'

export const RPC = ({ language, apikey, endpoint }: ContentProps) => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()

  const { data: jsonSchema, refetch: refetchJsonSchema } = useProjectJsonSchemaQuery({
    projectRef: ref,
  })
  const { data, refetch: refetchOpenAPISpec } = useOpenAPISpecQuery({ projectRef: ref })
  const functions = data?.functions ?? []

  const rpcName = snap.activeDocsSection[1]
  const rpc = functions.find((fn) => fn.name === rpcName)

  const {
    post: { parameters: postParameters },
  } = rpc ?? {}
  const rpcJsonSchema = jsonSchema?.paths[rpc?.path]
  const summary = rpcJsonSchema?.post?.summary

  const rpcParamsObject =
    postParameters &&
    postParameters[0] &&
    postParameters[0].schema &&
    postParameters[0].schema.properties
      ? postParameters[0].schema.properties
      : {}
  const parameters: { name: string; format: string; type: string; required: boolean }[] =
    Object.entries(rpcParamsObject)
      .map(([k, v]: any) => ({
        name: k,
        ...v,
        required: postParameters[0].schema.required.includes(k),
      }))
      .filter((x) => !!x.name)

  useEffect(() => {
    if (rpcName !== undefined) {
      refetchJsonSchema()
      refetchOpenAPISpec()
    }
  }, [rpcName])

  if (rpc === undefined) return null

  return (
    <div className="divide-y">
      <div className="space-y-1 px-4 py-4">
        <h2 className="text-xl">{rpc.name}</h2>
        <p className="text-sm text-foreground-light">{summary ?? '无描述信息'}</p>
      </div>
      <div className="space-y-2 px-4 py-4">
        <p className="text-sm text-foreground-light">函数参数</p>
        <Table
          head={[
            <Table.th key="name">参数名</Table.th>,
            <Table.th key="format">格式</Table.th>,
            <Table.th key="type">类型</Table.th>,
            <Table.th key="required"></Table.th>,
          ]}
          body={parameters.map((parameter) => (
            <Table.tr key={parameter.name}>
              <Table.td title={parameter.name}>
                <p className="font-mono text-xs text-foreground truncate">{parameter.name}</p>
              </Table.td>
              <Table.td title={parameter.format}>{parameter.format}</Table.td>
              <Table.td title={parameter.type}>{parameter.type}</Table.td>
              <Table.td>
                {parameter.required ? (
                  <Badge variant="warning">必选</Badge>
                ) : (
                  <Badge variant="default">可选</Badge>
                )}
              </Table.td>
            </Table.tr>
          ))}
        />
      </div>
      <ResourceContent
        selectedLanguage={language}
        snippet={DOCS_RESOURCE_CONTENT.rpcSingle}
        codeSnippets={DOCS_RESOURCE_CONTENT.rpcSingle.code({
          rpcName,
          rpcParams: parameters,
          endpoint,
          apikey,
          showBearer: true,
        })}
      />
    </div>
  )
}
