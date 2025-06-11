import { ChevronDown, Plus, Trash } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { getAPIKeys, useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { uuidv4 } from 'lib/helpers'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Listbox,
  SidePanel,
} from 'ui'
import { HTTPArgument } from './EditHookPanel'

interface HTTPRequestFieldsProps {
  type: 'http_request' | 'supabase_function'
  errors: any
  httpHeaders: HTTPArgument[]
  httpParameters: HTTPArgument[]
  onAddHeader: (header?: any) => void
  onUpdateHeader: (idx: number, property: string, value: string) => void
  onRemoveHeader: (idx: number) => void
  onAddParameter: () => void
  onUpdateParameter: (idx: number, property: string, value: string) => void
  onRemoveParameter: (idx: number) => void
}

const HTTPRequestFields = ({
  type,
  errors,
  httpHeaders = [],
  httpParameters = [],
  onAddHeader,
  onUpdateHeader,
  onRemoveHeader,
  onAddParameter,
  onUpdateParameter,
  onRemoveParameter,
}: HTTPRequestFieldsProps) => {
  const { project: selectedProject } = useProjectContext()
  const { ref } = useParams()
  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref })
  const { data: functions } = useEdgeFunctionsQuery({ projectRef: ref })

  const edgeFunctions = functions ?? []
  const { serviceKey } = getAPIKeys(settings)
  const apiKey = serviceKey?.api_key ?? '[YOUR API KEY]'

  return (
    <>
      <FormSection
        header={
          <FormSectionLabel className="lg:!col-span-4">
            {type === 'http_request'
              ? 'HTTP 请求'
              : type === 'supabase_function'
                ? '云函数请求'
                : ''}
          </FormSectionLabel>
        }
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <Listbox id="http_method" name="http_method" size="medium" label="方法">
            <Listbox.Option id="GET" value="GET" label="GET">
              GET
            </Listbox.Option>
            <Listbox.Option id="POST" value="POST" label="POST">
              POST
            </Listbox.Option>
          </Listbox>
          {type === 'http_request' ? (
            <Input
              id="http_url"
              name="http_url"
              label="URL"
              placeholder="http://api.com/path/resource"
              descriptionText="HTTP 请求的 URL，必须包含 HTTP/HTTPS"
            />
          ) : type === 'supabase_function' && edgeFunctions.length === 0 ? (
            <div className="space-y-1">
              <p className="text-sm text-foreground-light">选择要触发的云函数</p>
              <div className="px-4 py-4 border rounded bg-surface-300 border-strong flex items-center justify-between space-x-4">
                <p className="text-sm">还未创建任何云函数</p>
                <Button asChild>
                  <Link href={`/project/${ref}/functions`}>创建云函数</Link>
                </Button>
              </div>
              {errors.http_url && <p className="text-sm text-red-900">{errors.http_url}</p>}
            </div>
          ) : type === 'supabase_function' && edgeFunctions.length > 0 ? (
            <Listbox id="http_url" name="http_url" label="选择要触发的云函数">
              {edgeFunctions.map((fn) => {
                const restUrl = selectedProject?.restUrl
                const restUrlTld = restUrl ? new URL(restUrl).hostname.split('.').pop() : 'co'
                const functionUrl = `https://${ref}.supabase.${restUrlTld}/functions/v1/${fn.slug}`

                return (
                  <Listbox.Option key={fn.id} id={functionUrl} value={functionUrl} label={fn.name}>
                    {fn.name}
                  </Listbox.Option>
                )
              })}
            </Listbox>
          ) : null}
          <Input
            id="timeout_ms"
            name="timeout_ms"
            label="超时时间"
            labelOptional="设置在 1000ms 到 10,000ms 之间"
            type="number"
            actions={<p className="text-foreground-light pr-2">ms</p>}
          />
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <FormSection
        header={<FormSectionLabel className="lg:!col-span-4">HTTP 请求头</FormSectionLabel>}
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <div className="space-y-2">
            {httpHeaders.map((header, idx: number) => (
              <div key={header.id} className="flex items-center space-x-2">
                <Input
                  value={header.name}
                  size="small"
                  className="w-full"
                  placeholder="请求头的名称"
                  onChange={(event: any) => onUpdateHeader(idx, 'name', event.target.value)}
                />
                <Input
                  value={header.value}
                  size="small"
                  className="w-full"
                  placeholder="请求头的值"
                  onChange={(event: any) => onUpdateHeader(idx, 'value', event.target.value)}
                />
                <Button
                  type="default"
                  size="medium"
                  icon={<Trash size="14" />}
                  className="px-[10px] py-[9px]"
                  onClick={() => onRemoveHeader(idx)}
                />
              </div>
            ))}
            <div className="flex items-center">
              <Button
                type="default"
                size="tiny"
                icon={<Plus />}
                className={cn(type === 'supabase_function' && 'rounded-r-none px-3')}
                onClick={onAddHeader}
              >
                添加一个新的请求头
              </Button>
              {type === 'supabase_function' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="default" className="rounded-l-none px-[4px] py-[5px]">
                      <ChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="bottom">
                    <DropdownMenuItem
                      key="add-auth-header"
                      onClick={() =>
                        onAddHeader({
                          id: uuidv4(),
                          name: 'Authorization',
                          value: `Bearer ${apiKey}`,
                        })
                      }
                    >
                      <div className="space-y-1">
                        <p className="block text-foreground">添加一个认证头</p>
                        <p className="text-foreground-light">
                          如果云函数需要验证 JWT，则需要添加认证头
                        </p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      key="add-source-header"
                      onClick={() =>
                        onAddHeader({
                          id: uuidv4(),
                          name: 'x-supabase-webhook-source',
                          value: `[Use a secret value]`,
                        })
                      }
                    >
                      <div className="space-y-1">
                        <p className="block text-foreground">添加一个自定义来源头</p>
                        <p className="text-foreground-light">
                          用于验证云函数是否从此 Webhook 触发
                        </p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <FormSection
        header={<FormSectionLabel className="lg:!col-span-4">HTTP 参数</FormSectionLabel>}
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <div className="space-y-2">
            {httpParameters.map((parameter, idx: number) => (
              <div key={parameter.id} className="flex items-center space-x-2">
                <Input
                  size="small"
                  value={parameter.name}
                  className="w-full"
                  placeholder="参数名称"
                  onChange={(event: any) => onUpdateParameter(idx, 'name', event.target.value)}
                />
                <Input
                  size="small"
                  value={parameter.value}
                  className="w-full"
                  placeholder="参数值"
                  onChange={(event: any) => onUpdateParameter(idx, 'value', event.target.value)}
                />
                <Button
                  type="default"
                  size="medium"
                  icon={<Trash size="14" />}
                  className="px-[10px] py-[9px]"
                  onClick={() => onRemoveParameter(idx)}
                />
              </div>
            ))}
            <div>
              <Button type="default" size="tiny" icon={<Plus />} onClick={onAddParameter}>
                添加一个新的参数
              </Button>
            </div>
          </div>
        </FormSectionContent>
      </FormSection>
    </>
  )
}

export default HTTPRequestFields
