import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { Table2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useParams } from 'common'
import { TabsUpdateCallout } from 'components/interfaces/App/FeaturePreview/TableEditorTabs'
import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.queries'
import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
import {
  Button,
  cn,
  SQL_ICON,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { useEditorType } from '../editors/EditorsLayout.hooks'
import { useProjectContext } from '../ProjectLayout/ProjectContext'
import { ActionCard } from './ActionCard'
import { RecentItems } from './RecentItems'

export function NewTab() {
  const router = useRouter()
  const { ref } = useParams()
  const editor = useEditorType()
  const { profile } = useProfile()
  const org = useSelectedOrganization()
  const { project } = useProjectContext()

  const snap = useTableEditorStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const tabs = useTabsStateSnapshot()

  const [templates] = partition(SQL_TEMPLATES, { type: 'template' })
  const [quickstarts] = partition(SQL_TEMPLATES, { type: 'quickstart' })

  const { mutate: sendEvent } = useSendEventMutation()
  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const tableEditorActions = [
    {
      icon: <Table2 className="h-4 w-4 text-foreground" strokeWidth={1.5} />,
      title: '创建表',
      description: '设计并创建新的数据表',
      bgColor: 'bg-blue-500',
      isBeta: false,
      onClick: snap.onAddTable,
    },
  ]

  const sqlEditorActions = [
    {
      icon: <SQL_ICON className={cn('fill-foreground', 'w-4 h-4')} strokeWidth={1.5} />,
      title: '新建 SQL 查询',
      description: '执行 SQL 查询',
      bgColor: 'bg-green-500',
      isBeta: false,
      onClick: () => router.push(`/project/${ref}/sql/new`),
    },
  ]

  const actions = editor === 'sql' ? sqlEditorActions : tableEditorActions

  const handleNewQuery = async (sql: string, name: string) => {
    if (!ref) return console.error('未找到项目号')
    if (!project) return console.error('未找到项目')
    if (!profile) return console.error('未找到用户信息')

    if (!canCreateSQLSnippet) {
      return toast('由于缺少足够的权限，导致查询不能被保存')
    }

    try {
      const snippet = createSqlSnippetSkeletonV2({
        id: uuidv4(),
        name,
        sql,
        owner_id: profile?.id,
        project_id: project?.id,
      })
      snapV2.addSnippet({ projectRef: ref, snippet })
      snapV2.addNeedsSaving(snippet.id)

      const tabId = createTabId('sql', { id: snippet.id })

      tabs.addTab({
        id: tabId,
        type: 'sql',
        label: name,
        metadata: { sqlId: snippet.id },
      })

      router.push(`/project/${ref}/sql/${snippet.id}`)
    } catch (error: any) {
      toast.error(`执行新查询失败：${error.message}`)
    }
  }

  return (
    <div className="bg-surface-100 h-full overflow-y-auto py-12">
      <div className="mx-auto max-w-2xl flex flex-col gap-10 px-10">
        {/* <TabsUpdateCallout /> */}
        <div className="grid grid-cols-2 gap-4">
          {actions.map((item, i) => (
            <ActionCard key={`action-card-${i}`} {...item} />
          ))}
        </div>
        <RecentItems />
      </div>
      {editor === 'sql' && (
        <div className="flex flex-col gap-4 mx-auto py-10">
          <Tabs_Shadcn_ defaultValue="templates">
            <TabsList_Shadcn_ className="mx-auto justify-center gap-5">
              <TabsTrigger_Shadcn_ value="templates">模板</TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_ value="quickstarts">快速上手</TabsTrigger_Shadcn_>
            </TabsList_Shadcn_>
            <TabsContent_Shadcn_ value="templates" className="max-w-5xl mx-auto py-5">
              <div className="grid grid-cols-3 gap-4 px-8">
                {templates.slice(0, 9).map((item, i) => (
                  <ActionCard
                    onClick={() => {
                      handleNewQuery(item.sql, item.title)
                      sendEvent({
                        action: 'sql_editor_template_clicked',
                        properties: { templateName: item.title },
                        groups: { project: ref ?? '未知', organization: org?.slug ?? '未知' },
                      })
                    }}
                    bgColor="bg-alternative border"
                    key={`action-card-${i}`}
                    {...item}
                    icon={
                      <SQL_ICON className={cn('fill-foreground', 'w-4 h-4')} strokeWidth={1.5} />
                    }
                  />
                ))}
              </div>
              <div className="flex justify-center mt-5">
                <Button asChild type="default">
                  <Link href={`/project/${ref}/sql/templates`}>查看更多模板</Link>
                </Button>
              </div>
            </TabsContent_Shadcn_>
            <TabsContent_Shadcn_ value="quickstarts" className="max-w-5xl mx-auto py-5">
              <div className="grid grid-cols-3 gap-4 px-8">
                {quickstarts.map((item, i) => (
                  <ActionCard
                    onClick={() => {
                      handleNewQuery(item.sql, item.title)
                      sendEvent({
                        action: 'sql_editor_quickstart_clicked',
                        properties: { quickstartName: item.title },
                        groups: { project: ref ?? '未知', organization: org?.slug ?? '未知' },
                      })
                    }}
                    bgColor="bg-alternative border"
                    key={`action-card-${i}`}
                    {...item}
                    icon={
                      <SQL_ICON className={cn('fill-foreground', 'w-4 h-4')} strokeWidth={1.5} />
                    }
                  />
                ))}
              </div>
              <div className="flex justify-center mt-5">
                <Button asChild type="default">
                  <Link href={`/project/${ref}/sql/quickstarts`}>查看更多模板</Link>
                </Button>
              </div>
            </TabsContent_Shadcn_>
          </Tabs_Shadcn_>
        </div>
      )}
    </div>
  )
}
