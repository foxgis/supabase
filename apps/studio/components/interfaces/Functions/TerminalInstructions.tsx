import { ExternalLink, Maximize2, Minimize2, Terminal } from 'lucide-react'
import { useRouter } from 'next/router'
import { ComponentPropsWithoutRef, ElementRef, forwardRef, useState } from 'react'

import { useParams } from 'common'
import CommandRender from 'components/interfaces/Functions/CommandRender'
import { DocsButton } from 'components/ui/DocsButton'
import { useAccessTokensQuery } from 'data/access-tokens/access-tokens-query'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import {
  Button,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
} from 'ui'
import type { Commands } from './Functions.types'

interface TerminalInstructionsProps extends ComponentPropsWithoutRef<typeof Collapsible_Shadcn_> {
  closable?: boolean
  removeBorder?: boolean
}

export const TerminalInstructions = forwardRef<
  ElementRef<typeof Collapsible_Shadcn_>,
  TerminalInstructionsProps
>(({ closable = false, removeBorder = false, ...props }, ref) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const [showInstructions, setShowInstructions] = useState(!closable)

  const { data: tokens } = useAccessTokensQuery()
  const { data: apiKeys } = useAPIKeysQuery({ projectRef })
  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef })

  const { anonKey, publishableKey } = getKeys(apiKeys)
  const apiKey = publishableKey?.api_key ?? anonKey?.api_key ?? '[YOUR ANON KEY]'

  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint ?? ''
  const functionsEndpoint =
    customDomainData?.customDomain?.status === 'active'
      ? `https://${customDomainData.customDomain.hostname}/functions/v1`
      : `${protocol}://${endpoint}/functions/v1`

  // get the .co or .net TLD from the restUrl
  const restUrl = `https://${endpoint}`
  const restUrlTld = !!endpoint ? new URL(restUrl).hostname.split('.').pop() : 'co'

  const commands: Commands[] = [
    {
      command: 'supabase functions new hello-world',
      description: '在 ./functions/hello-world/index.ts 路径下创建云函数',
      jsx: () => {
        return (
          <>
            <span className="text-brand-600">supabase</span> functions new hello-world
          </>
        )
      },
      comment: '创建云函数',
    },
    {
      command: `supabase functions deploy hello-world --project-ref ${projectRef}`,
      description: '部署 ./functions/hello-world/index.ts 路径下的云函数',
      jsx: () => {
        return (
          <>
            <span className="text-brand-600">supabase</span> functions deploy hello-world
            --project-ref {projectRef}
          </>
        )
      },
      comment: '部署云函数',
    },
    {
      command: `curl -L -X POST 'https://${projectRef}.supabase.${restUrlTld}/functions/v1/hello-world' -H 'Authorization: Bearer ${apiKey}'${anonKey?.type === 'publishable' ? ` -H 'apikey: ${apiKey}'` : ''} --data '{"name":"Functions"}'`,
      description: '调用 hello-world 云函数',
      jsx: () => {
        return (
          <>
            <span className="text-brand-600">curl</span> -L -X POST '{functionsEndpoint}
            /hello-world' -H 'Authorization: Bearer [YOUR ANON KEY]' s
            {anonKey?.type === 'publishable' ? " -H 'apikey: [YOUR ANON KEY]' " : ''}
            {`--data '{"name":"Functions"}'`}
          </>
        )
      },
      comment: '调用云函数',
    },
  ]

  return (
    <Collapsible_Shadcn_
      ref={ref}
      open={showInstructions}
      className="w-full"
      onOpenChange={() => setShowInstructions(!showInstructions)}
      {...props}
    >
      <CollapsibleTrigger_Shadcn_ className="flex w-full justify-between" disabled={!closable}>
        <div className="flex items-center gap-x-3">
          <div className="flex items-center justify-center w-8 h-8 p-2 border rounded bg-alternative">
            <Terminal strokeWidth={2} />
          </div>
          <h4>通过 CLI 创建第一个云函数</h4>
        </div>
        {closable && (
          <div className="cursor-pointer" onClick={() => setShowInstructions(!showInstructions)}>
            {showInstructions ? (
              <Minimize2 size={16} strokeWidth={1.5} />
            ) : (
              <Maximize2 size={16} strokeWidth={1.5} />
            )}
          </div>
        )}
      </CollapsibleTrigger_Shadcn_>
      <CollapsibleContent_Shadcn_ className="w-full transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <CommandRender commands={commands} className="my-4" />
        {tokens && tokens.length === 0 ? (
          <div className="px-8 py-4 space-y-3 border-t">
            <div>
              <p className="text-sm text-foreground">你可能需要创建一个访问令牌</p>
              <p className="text-sm text-foreground-light">
                您可以在账户这种中创建一个安全的访问令牌
              </p>
            </div>
            <Button type="default" onClick={() => router.push('/account/tokens')}>
              访问令牌
            </Button>
          </div>
        ) : (
          <div className="py-4 space-y-3 border-t">
            <div>
              <h3 className="text-base text-foreground">需要帮助？</h3>
              <p className="text-sm text-foreground-light">
                阅读文档，或浏览一些示例代码。
              </p>
            </div>
            <div className="flex gap-2">
              <DocsButton href="https://supabase.com/docs/guides/functions" />
              <Button asChild type="default" icon={<ExternalLink />}>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions"
                >
                  示例
                </a>
              </Button>
            </div>
          </div>
        )}
      </CollapsibleContent_Shadcn_>
    </Collapsible_Shadcn_>
  )
})

TerminalInstructions.displayName = 'TerminalInstructions'
