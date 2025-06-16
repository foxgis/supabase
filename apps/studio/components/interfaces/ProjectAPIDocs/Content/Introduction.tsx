import { useParams } from 'common'
import { Button, Input, copyToClipboard } from 'ui'

import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'
import type { ContentProps } from './Content.types'

const Introduction = ({ showKeys, language, apikey, endpoint }: ContentProps) => {
  const { ref } = useParams()
  const { data } = useProjectSettingsV2Query({ projectRef: ref })

  const [copied, setCopied] = useState<'anon' | 'service'>()

  useEffect(() => {
    if (copied !== undefined) setTimeout(() => setCopied(undefined), 2000)
  }, [copied])

  const anonApiKey = (data?.service_api_keys ?? []).find((key) => key.tags === 'anon')?.api_key
  const serviceApiKey =
    (data?.service_api_keys ?? []).find((key) => key.tags === 'service_role')?.api_key ??
    'SUPABASE_CLIENT_SERVICE_KEY'

  return (
    <>
      <ContentSnippet
        selectedLanguage={language}
        apikey={apikey}
        endpoint={endpoint}
        snippet={DOCS_CONTENT.init}
      >
        <div className="px-4 space-y-6">
          <div className="flex space-x-4 mt-8">
            <p className="text-sm w-40">项目地址</p>
            <Input disabled readOnly copy size="small" value={endpoint} className="w-full" />
          </div>
          <div className="flex space-x-4">
            <p className="text-sm w-40">客户端密钥</p>
            <Input
              disabled
              readOnly
              size="small"
              value={showKeys ? apikey : '点击菜单栏顶部的按钮显示密钥'}
              className="w-full"
              descriptionText="这个密钥可以安全地在浏览器中使用，前提是您启用行级安全（RLS）并且配置了相应的策略。"
              actions={[
                <Button
                  key="copy"
                  type="default"
                  icon={<Copy />}
                  onClick={() => {
                    setCopied('anon')
                    copyToClipboard(anonApiKey ?? 'SUPABASE_CLIENT_ANON_KEY')
                  }}
                >
                  {copied === 'anon' ? '已复制' : '复制'}
                </Button>,
              ]}
            />
          </div>
          <div className="flex space-x-4">
            <p className="text-sm w-40 mb-16">服务端密钥</p>
            <Input
              disabled
              readOnly
              size="small"
              value={
                showKeys
                  ? serviceApiKey ?? 'SUPABASE_CLIENT_SERVICE_KEY'
                  : '点击菜单栏顶部的按钮显示密钥'
              }
              className="w-full"
              descriptionText={
                <p>
                  这个密钥可以绕过行级安全策略。
                  <span className="text-amber-900">请务必不要公开它。</span>
                </p>
              }
              actions={[
                <Button
                  key="copy"
                  type="default"
                  icon={<Copy />}
                  onClick={() => {
                    setCopied('service')
                    copyToClipboard(serviceApiKey)
                  }}
                >
                  {copied === 'service' ? '已复制' : '复制'}
                </Button>,
              ]}
            />
          </div>
        </div>
      </ContentSnippet>

      <ContentSnippet
        selectedLanguage={language}
        apikey={apikey}
        endpoint={endpoint}
        snippet={DOCS_CONTENT.clientApiKeys}
      />

      <ContentSnippet
        selectedLanguage={language}
        apikey={showKeys ? serviceApiKey : 'SUPABASE_CLIENT_SERVICE_KEY'}
        endpoint={endpoint}
        snippet={DOCS_CONTENT.serviceApiKeys}
      />
    </>
  )
}

export default Introduction
