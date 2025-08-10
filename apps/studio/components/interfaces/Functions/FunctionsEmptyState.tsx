import { Code, Github, Lock, Play, Server, Terminal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import { ResourceItem } from 'components/ui/Resource/ResourceItem'
import { ResourceList } from 'components/ui/Resource/ResourceList'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import {
  AiIconAnimation,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  CodeBlock,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogTitle,
  DialogTrigger,
  Separator,
} from 'ui'
import { EDGE_FUNCTION_TEMPLATES } from './Functions.templates'
import { TerminalInstructions } from './TerminalInstructions'

export const FunctionsEmptyState = () => {
  const { ref } = useParams()
  const router = useRouter()
  const aiSnap = useAiAssistantStateSnapshot()

  const { mutate: sendEvent } = useSendEventMutation()
  const { data: org } = useSelectedOrganizationQuery()

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>创建第一个云函数</CardTitle>
        </CardHeader>
        <CardContent className="p-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
          {/* Editor Option */}
          <div className="p-8">
            <div className="flex items-center gap-2">
              <Code strokeWidth={1.5} size={20} />
              <h4 className="text-base text-foreground">通过编辑器</h4>
            </div>
            <p className="text-sm text-foreground-light mb-4 mt-1">
              直接在浏览器中创建云函数，随时下载到本地。
            </p>
            <Button
              type="default"
              onClick={() => {
                router.push(`/project/${ref}/functions/new`)
                sendEvent({
                  action: 'edge_function_via_editor_button_clicked',
                  properties: { origin: 'no_functions_block' },
                  groups: { project: ref ?? '未知项目', organization: org?.slug ?? '未知组织' },
                })
              }}
            >
              打开编辑器
            </Button>
          </div>

          {/* AI Assistant Option */}
          {/* <div className="p-8">
            <div className="flex items-center gap-2">
              <AiIconAnimation size={20} />
              <h4 className="text-base text-foreground">AI Assistant</h4>
            </div>
            <p className="text-sm text-foreground-light mb-4 mt-1">
              Let our AI assistant help you create functions. Perfect for kickstarting a function.
            </p>
            <Button
              type="default"
              onClick={() => {
                aiSnap.newChat({
                  name: 'Create new edge function',
                  open: true,
                  initialInput: 'Create a new edge function that ...',
                  suggestions: {
                    title:
                      'I can help you create a new edge function. Here are a few example prompts to get you started:',
                    prompts: [
                      {
                        label: 'Stripe Payments',
                        description:
                          'Create a new edge function that processes payments with Stripe',
                      },
                      {
                        label: 'Email with Resend',
                        description: 'Create a new edge function that sends emails with Resend',
                      },
                      {
                        label: 'PDF Generator',
                        description:
                          'Create a new edge function that generates PDFs from HTML templates',
                      },
                    ],
                  },
                })
                sendEvent({
                  action: 'edge_function_ai_assistant_button_clicked',
                  properties: { origin: 'no_functions_block' },
                  groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
                })
              }}
            >
              Open Assistant
            </Button>
          </div> */}

          {/* CLI Option */}
          <div className="p-8">
            <div className="flex items-center gap-2">
              <Terminal strokeWidth={1.5} size={20} />
              <h4 className="text-base text-foreground">通过 CLI</h4>
            </div>
            <p className="text-sm text-foreground-light mb-4 mt-1">
              使用 CLI 创建和部署云函数，适用于本地开发和版本控制。
            </p>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  type="default"
                  onClick={() =>
                    sendEvent({
                      action: 'edge_function_via_cli_button_clicked',
                      properties: { origin: 'no_functions_block' },
                      groups: { project: ref ?? '未知项目', organization: org?.slug ?? '未知组织' },
                    })
                  }
                >
                  查看 CLI 指令
                </Button>
              </DialogTrigger>
              <DialogContent size="large">
                <DialogSection padding="small">
                  <TerminalInstructions />
                </DialogSection>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
      <ScaffoldSectionTitle className="text-xl mb-4 mt-12">
        从模板开始
      </ScaffoldSectionTitle>
      <ResourceList>
        {EDGE_FUNCTION_TEMPLATES.map((template) => (
          <ResourceItem
            key={template.name}
            media={<Code strokeWidth={1.5} size={16} className="-translate-y-[9px]" />}
            onClick={() => {
              sendEvent({
                action: 'edge_function_template_clicked',
                properties: { templateName: template.name, origin: 'functions_page' },
                groups: { project: ref ?? '未知项目', organization: org?.slug ?? '未知组织' },
              })
            }}
          >
            <Link href={`/project/${ref}/functions/new?template=${template.value}`}>
              <p>{template.name}</p>
              <p className="text-sm text-foreground-lighter">{template.description}</p>
            </Link>
          </ResourceItem>
        ))}
      </ResourceList>
    </>
  )
}

export const FunctionsEmptyStateLocal = () => {
  return (
    <>
      <div className="flex flex-col gap-y-4">
        <Card>
          <CardHeader>
            <CardTitle>本地开发云函数</CardTitle>
          </CardHeader>
          <CardContent
            className={cn(
              'p-0 flex flex-col',
              '2xl:grid 2xl:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] 2xl:divide-y-0 2xl:divide-x',
              'divide-y divide-default items-stretch'
            )}
          >
            <div className="p-8">
              <div className="flex items-center gap-2">
                <Code size={20} />
                <h4 className="text-base text-foreground">创建云函数</h4>
              </div>
              <p className="text-sm text-foreground-light mt-1 mb-4 prose [&>code]:text-xs text-sm max-w-full">
                通过 CLI创建一个 <code>hello-world</code> 的云函数。
              </p>
              <div className="mb-4">
                <CodeBlock
                  language="bash"
                  hideLineNumbers={true}
                  className={cn(
                    'px-3.5 max-w-full prose dark:prose-dark [&>code]:m-0 2xl:min-h-28'
                  )}
                  value="supabase functions new hello-world"
                />
              </div>
              <DocsButton href="https://supabase.com/docs/guides/functions/local-quickstart#create-an-edge-function" />
            </div>

            <div className="p-8">
              <div className="flex items-center gap-2">
                <Play size={20} />
                <h4 className="text-base text-foreground">本地运行云函数</h4>
              </div>
              <p className="text-sm text-foreground-light mt-1 mb-4 prose [&>code]:text-xs text-sm max-w-full">
                您可以在本地使用 <code>supabase functions serve</code> 运行云函数。
              </p>
              <div className="mb-4">
                <CodeBlock
                  language="bash"
                  hideLineNumbers={true}
                  className={cn(
                    'px-3.5 max-w-full prose dark:prose-dark [&>code]:m-0 2xl:min-h-28'
                  )}
                  value={`
supabase start # start the supabase stack
supabase functions serve # start the Functions watcher`.trim()}
                />
              </div>
              <DocsButton href="https://supabase.com/docs/guides/functions/local-quickstart#running-edge-functions-locally" />
            </div>

            <div className="p-8">
              <div className="flex items-center gap-2">
                <Terminal strokeWidth={1.5} size={20} />
                <h4 className="text-base text-foreground">本地调用云函数</h4>
              </div>
              <p className="text-sm text-foreground-light mt-1 mb-4">
                当您在本地运行云函数时，您可以使用 cURL 或其他客户端库调用它。
              </p>
              <div className="mb-4">
                <CodeBlock
                  language="bash"
                  hideLineNumbers={true}
                  className={cn(
                    'px-3.5 max-w-full prose dark:prose-dark [&>code]:m-0 2xl:min-h-28'
                  )}
                  value={`
curl --request POST 'http://localhost:54321/functions/v1/hello-world' \\
  --header 'Authorization: Bearer SUPABASE_ANON_KEY' \\
  --header 'Content-Type: application/json' \\
  --data '{ "name":"Functions" }'`.trim()}
                />
              </div>
              <DocsButton href="https://supabase.com/docs/guides/functions/local-quickstart#invoking-edge-functions-locally" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>自托管云函数</CardTitle>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
            <div className="p-8">
              <div className="flex items-center gap-2">
                <Server size={20} />
                <h4 className="text-base text-foreground">自托管云函数</h4>
              </div>
              <p className="text-sm text-foreground-light mt-1 mb-4 max-w-3xl">
                云函数的运行时包含一个基于 Deno 运行时的 web 服务器，能够运行Javascript、Typescript 和 WASM 开发的服务。
                您可以在 Fly.io、Digital Ocean 或 AWS 上自托管云函数。
              </p>
              <div className="flex items-center gap-x-2">
                <DocsButton href="https://supabase.com/docs/reference/self-hosting-functions/introduction" />
                <Button asChild type="default" icon={<Github />}>
                  <a href="https://github.com/supabase/edge-runtime/">GitHub</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <ScaffoldSectionTitle className="text-xl mt-12">探索模板</ScaffoldSectionTitle>
        <ResourceList>
          {EDGE_FUNCTION_TEMPLATES.map((template) => (
            <Dialog>
              <DialogTrigger asChild>
                <ResourceItem
                  key={template.name}
                  media={<Code strokeWidth={1.5} size={16} className="-translate-y-[9px]" />}
                >
                  <div>
                    <p>{template.name}</p>
                    <p className="text-sm text-foreground-lighter">{template.description}</p>
                  </div>
                </ResourceItem>
              </DialogTrigger>
              <DialogContent size="large">
                <DialogHeader>
                  <DialogTitle>{template.name}</DialogTitle>
                  <DialogDescription>{template.description}</DialogDescription>
                </DialogHeader>
                <Separator />
                <DialogSection className="!p-0">
                  <CodeBlock
                    language="ts"
                    hideLineNumbers={true}
                    className={cn(
                      'border-0 rounded-none px-3.5 max-w-full prose dark:prose-dark [&>code]:m-0 max-h-[420px]'
                    )}
                    value={template.content}
                  />
                </DialogSection>
              </DialogContent>
            </Dialog>
          ))}
        </ResourceList>
      </div>
    </>
  )
}

export const FunctionsSecretsEmptyStateLocal = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>管理本地的密钥和环境变量</CardTitle>
      </CardHeader>
      <CardContent className="p-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
        <div className="p-8">
          <div className="flex items-center gap-2">
            <Lock size={20} />
            <h4 className="text-base text-foreground">管理密钥</h4>
          </div>
          <div className="text-sm text-foreground-light mt-1 mb-4 max-w-3xl">
            <p>
              本地密钥和环境变量可以通过以下两种方式加载：
            </p>
            <ul className="list-disc pl-6">
              <li className="prose [&>code]:text-xs text-sm max-w-full">
                通过放置在 <code>supabase/functions/.env</code> 路径下的<code>.env</code> 文件，
                该文件将在执行 <code>supabase start</code> 时自动加载。
              </li>
              <li className="prose [&>code]:text-xs text-sm max-w-full">
                通过 <code>supabase functions serve</code> 的 <code>--env-file</code> 选项，
                例如：<code>supabase functions serve --env-file ./path/to/.env-file</code>
              </li>
            </ul>
          </div>
          <DocsButton href="https://supabase.com/docs/guides/functions/secrets#using-the-cli" />
        </div>
      </CardContent>
    </Card>
  )
}
