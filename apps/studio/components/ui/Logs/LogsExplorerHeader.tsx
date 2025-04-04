import { BookOpen, Check, Clipboard, ExternalLink, List, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { LOGS_EXPLORER_DOCS_URL } from 'components/interfaces/Settings/Logs/Logs.constants'
import Table from 'components/to-be-cleaned/Table'
import { copyToClipboard } from 'lib/helpers'
import { logConstants } from 'shared-data'
import { Button, SidePanel, Tabs, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { DocsButton } from '../DocsButton'

export interface LogsExplorerHeaderProps {
  subtitle?: string
}

const LogsExplorerHeader = ({ subtitle }: LogsExplorerHeaderProps) => {
  const [showReference, setShowReference] = useState(false)

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 transition-all pb-6 justify-between">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex flex-row items-center gap-3">
          <div
            className="flex h-6 w-6 items-center justify-center rounded border
              border-brand-600 bg-brand-300 text-brand
            "
          >
            <List size={14} strokeWidth={3} />
          </div>

          <h1 className="text-2xl text-foreground">日志查看器</h1>
        </div>
        {subtitle && <span className="text-2xl text-foreground-light">{subtitle}</span>}
      </div>
      <div className="flex flex-row gap-2">
        <DocsButton href={LOGS_EXPLORER_DOCS_URL} />

        <SidePanel
          size="large"
          header={
            <div className="flex flex-row justify-between items-center">
              <h3>字段参考</h3>
              <Button
                type="text"
                className="px-1"
                onClick={() => setShowReference(false)}
                icon={<X size={18} strokeWidth={1.5} />}
              />
            </div>
          }
          visible={showReference}
          cancelText="关闭"
          onCancel={() => setShowReference(false)}
          hideFooter
          triggerElement={
            <Button
              type="default"
              onClick={() => setShowReference(true)}
              icon={<BookOpen strokeWidth={1.5} />}
            >
              字段参考
            </Button>
          }
        >
          <SidePanel.Content>
            <div className="pt-4 pb-2 space-y-1">
              <p className="text-sm">
                下面的表显示了每种数据源所有可查询的字段。请注意，要访问嵌套的键，您需要使用必要的{' '}
                <Link
                  href="https://supabase.com/docs/guides/platform/logs#unnesting-arrays"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand"
                >
                  解嵌连接
                  <ExternalLink
                    size={14}
                    className="ml-1 inline -translate-y-[2px]"
                    strokeWidth={1.5}
                  />
                </Link>
              </p>
            </div>
          </SidePanel.Content>
          <SidePanel.Separator />
          <Tabs
            scrollable
            size="small"
            type="underlined"
            defaultActiveId="edge_logs"
            listClassNames="px-2"
          >
            {logConstants.schemas.map((schema) => (
              <Tabs.Panel
                key={schema.reference}
                id={schema.reference}
                label={schema.name}
                className="px-4 pb-4"
              >
                <Table
                  head={[
                    <Table.th className="text-xs !p-2" key="path">
                      字段
                    </Table.th>,
                    <Table.th key="type" className="text-xs !p-2">
                      类型
                    </Table.th>,
                  ]}
                  body={schema.fields
                    .sort((a: any, b: any) => a.path - b.path)
                    .map((field) => (
                      <Field key={field.path} field={field} />
                    ))}
                />
              </Tabs.Panel>
            ))}
          </Tabs>
        </SidePanel>
      </div>
    </div>
  )
}

export default LogsExplorerHeader

const Field = ({
  field,
}: {
  field: {
    path: string
    type: string
  }
}) => {
  const [isCopied, setIsCopied] = useState(false)

  return (
    <Table.tr>
      <Table.td
        className="font-mono text-xs !p-2 cursor-pointer hover:text-foreground transition flex items-center space-x-2"
        onClick={() =>
          copyToClipboard(field.path, () => {
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 3000)
          })
        }
      >
        <span>{field.path}</span>
        {isCopied ? (
          <Tooltip>
            <TooltipTrigger>
              <Check size={14} strokeWidth={3} className="text-brand" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans">
              已复制
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger>
              <Clipboard size={14} strokeWidth={1.5} />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans">
              复制值
            </TooltipContent>
          </Tooltip>
        )}
      </Table.td>
      <Table.td className="font-mono text-xs !p-2">{field.type}</Table.td>
    </Table.tr>
  )
}
