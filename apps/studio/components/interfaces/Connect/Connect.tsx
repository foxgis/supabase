import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { ExternalLink, Plug } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'

import { DatabaseConnectionString } from 'components/interfaces/Connect/DatabaseConnectionString'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import Panel from 'components/ui/Panel'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { getAPIKeys, useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import {
  Button,
  DIALOG_PADDING_X,
  DIALOG_PADDING_Y,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import { CONNECTION_TYPES, ConnectionType, FRAMEWORKS, MOBILES, ORMS } from './Connect.constants'
import { getContentFilePath } from './Connect.utils'
import ConnectDropdown from './ConnectDropdown'
import ConnectTabContent from './ConnectTabContent'

export const Connect = () => {
  const { ref: projectRef } = useParams()
  const selectedProject = useSelectedProject()
  const isActiveHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const [showConnect, setShowConnect] = useQueryState(
    'showConnect',
    parseAsBoolean.withDefault(false)
  )

  const [connectionObject, setConnectionObject] = useState<ConnectionType[]>(FRAMEWORKS)
  const [selectedParent, setSelectedParent] = useState(connectionObject[0].key) // aka nextjs
  const [selectedChild, setSelectedChild] = useState(
    connectionObject.find((item) => item.key === selectedParent)?.children[0]?.key ?? ''
  )
  const [selectedGrandchild, setSelectedGrandchild] = useState(
    connectionObject
      .find((item) => item.key === selectedParent)
      ?.children.find((child) => child.key === selectedChild)?.children[0]?.key || ''
  )

  const { data: settings } = useProjectSettingsV2Query({ projectRef }, { enabled: showConnect })
  const canReadAPIKeys = useCheckPermissions(PermissionAction.READ, 'service_api_keys')

  const handleParentChange = (value: string) => {
    setSelectedParent(value)

    // check if parent has children
    setSelectedChild(connectionObject.find((item) => item.key === value)?.children[0]?.key ?? '')

    // check if child has grandchildren
    setSelectedGrandchild(
      connectionObject.find((item) => item.key === value)?.children[0]?.children[0]?.key ?? ''
    )
  }

  const handleChildChange = (value: string) => {
    setSelectedChild(value)

    const parent = connectionObject.find((item) => item.key === selectedParent)
    const child = parent?.children.find((child) => child.key === value)

    if (child && child.children.length > 0) {
      setSelectedGrandchild(child.children[0].key)
    } else {
      setSelectedGrandchild('')
    }
  }

  const handleGrandchildChange = (value: string) => {
    setSelectedGrandchild(value)
  }

  // reset the parent/child/grandchild when the connection type (tab) changes
  function handleConnectionTypeChange(connections: ConnectionType[]) {
    setSelectedParent(connections[0].key)

    if (connections[0]?.children.length > 0) {
      setSelectedChild(connections[0].children[0].key)

      if (connections[0].children[0]?.children.length > 0) {
        setSelectedGrandchild(connections[0].children[0].children[0].key)
      } else {
        setSelectedGrandchild('')
      }
    } else {
      setSelectedChild('')
      setSelectedGrandchild('')
    }
  }

  function handleConnectionType(type: string) {
    if (type === 'frameworks') {
      setConnectionObject(FRAMEWORKS)
      handleConnectionTypeChange(FRAMEWORKS)
    }

    if (type === 'mobiles') {
      setConnectionObject(MOBILES)
      handleConnectionTypeChange(MOBILES)
    }

    if (type === 'orms') {
      setConnectionObject(ORMS)
      handleConnectionTypeChange(ORMS)
    }
  }

  const getChildOptions = () => {
    const parent = connectionObject.find((item) => item.key === selectedParent)
    if (parent && parent.children.length > 0) {
      return parent.children
    }
    return []
  }

  const getGrandchildrenOptions = () => {
    const parent = connectionObject.find((item) => item.key === selectedParent)
    const subCategory = parent?.children.find((child) => child.key === selectedChild)
    if (subCategory && subCategory.children.length > 0) {
      return subCategory.children
    }
    return []
  }

  const { anonKey } = canReadAPIKeys ? getAPIKeys(settings) : { anonKey: null }
  const { data: apiKeys } = useAPIKeysQuery({ projectRef, reveal: false })

  const projectKeys = useMemo(() => {
    const protocol = settings?.app_config?.protocol ?? 'https'
    const endpoint = settings?.app_config?.endpoint ?? ''
    const apiHost = canReadAPIKeys ? `${protocol}://${endpoint ?? '-'}` : ''

    const apiUrl = canReadAPIKeys ? apiHost : null
    return {
      apiUrl: apiHost ?? null,
      anonKey: anonKey?.api_key ?? null,
      publishableKey: apiKeys?.find(({ type }) => type === 'publishable')?.api_key ?? null,
    }
  }, [apiKeys, anonKey, canReadAPIKeys, settings])

  const filePath = getContentFilePath({
    connectionObject,
    selectedParent,
    selectedChild,
    selectedGrandchild,
  })

  if (!isActiveHealthy) {
    return (
      <ButtonTooltip
        disabled
        type="default"
        className="rounded-full"
        icon={<Plug className="rotate-90" />}
        tooltip={{
          content: {
            side: 'bottom',
            text: '项目当前未处于活动状态，无法连接',
          },
        }}
      >
        连接
      </ButtonTooltip>
    )
  }

  return (
    <Dialog open={showConnect} onOpenChange={(open) => setShowConnect(!open ? null : open)}>
      <DialogTrigger asChild>
        <Button type="default" className="rounded-full" icon={<Plug className="rotate-90" />}>
          <span>连接</span>
        </Button>
      </DialogTrigger>
      <DialogContent className={cn('sm:max-w-5xl p-0')} centered={false}>
        <DialogHeader className={DIALOG_PADDING_X}>
          <DialogTitle>连接到项目</DialogTitle>
          <DialogDescription>
            为您的应用获取数据库连接字符串和环境变量
          </DialogDescription>
        </DialogHeader>

        <Tabs_Shadcn_ defaultValue="direct" onValueChange={(value) => handleConnectionType(value)}>
          <TabsList_Shadcn_ className={cn('flex overflow-x-scroll gap-x-4', DIALOG_PADDING_X)}>
            {CONNECTION_TYPES.map((type) => (
              <TabsTrigger_Shadcn_ key={type.key} value={type.key} className="px-0">
                {type.label}
              </TabsTrigger_Shadcn_>
            ))}
          </TabsList_Shadcn_>

          {CONNECTION_TYPES.map((type) => {
            const hasChildOptions =
              (connectionObject.find((parent) => parent.key === selectedParent)?.children.length ||
                0) > 0
            const hasGrandChildOptions =
              (connectionObject
                .find((parent) => parent.key === selectedParent)
                ?.children.find((child) => child.key === selectedChild)?.children.length || 0) > 0

            if (type.key === 'direct') {
              return (
                <TabsContent_Shadcn_
                  key="direct"
                  value="direct"
                  className={cn('!mt-0', 'p-0', 'flex flex-col gap-6')}
                >
                  <div className={DIALOG_PADDING_Y}>
                    <DatabaseConnectionString />
                  </div>
                </TabsContent_Shadcn_>
              )
            }

            return (
              <TabsContent_Shadcn_
                key={`content-${type.key}`}
                value={type.key}
                className={cn(DIALOG_PADDING_X, DIALOG_PADDING_Y, '!mt-0')}
              >
                <div className="flex flex-col md:flex-row gap-2 justify-between">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
                    <ConnectDropdown
                      state={selectedParent}
                      updateState={handleParentChange}
                      label={
                        connectionObject === FRAMEWORKS || connectionObject === MOBILES
                          ? '框架'
                          : '工具'
                      }
                      items={connectionObject}
                    />
                    {selectedParent && hasChildOptions && (
                      <ConnectDropdown
                        state={selectedChild}
                        updateState={handleChildChange}
                        label="使用"
                        items={getChildOptions()}
                      />
                    )}
                    {selectedChild && hasGrandChildOptions && (
                      <ConnectDropdown
                        state={selectedGrandchild}
                        updateState={handleGrandchildChange}
                        label="和"
                        items={getGrandchildrenOptions()}
                      />
                    )}
                  </div>
                  {connectionObject.find((item) => item.key === selectedParent)?.guideLink && (
                    <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={
                          connectionObject.find((item) => item.key === selectedParent)?.guideLink ||
                          ''
                        }
                      >
                        {connectionObject.find((item) => item.key === selectedParent)?.label} 指南
                      </a>
                    </Button>
                  )}
                </div>
                <p className="text-xs text-foreground-lighter my-3">
                  在您的应用代码中添加以下文件
                </p>
                <ConnectTabContent
                  projectKeys={projectKeys}
                  filePath={filePath}
                  className="rounded-b-none"
                />
                {/* <Panel.Notice
                  className="border border-t-0 rounded-lg rounded-t-none"
                  title="新 API 密钥"
                  description={`
\`anon\` 和 \`service_role\` API 密钥将会变更为 \`publishable\` 和 \`secret\` API 密钥。
`}
                  href="https://github.com/orgs/supabase/discussions/29260"
                  buttonText="阅读公告"
                /> */}
              </TabsContent_Shadcn_>
            )
          })}
        </Tabs_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
