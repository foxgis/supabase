import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useParams } from 'common'
import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.queries'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ActionCard } from 'components/layouts/Tabs/ActionCard'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { cn, SQL_ICON } from 'ui'
import { createSqlSnippetSkeletonV2 } from '../SQLEditor.utils'

const SQLTemplates = () => {
  const router = useRouter()
  const { ref } = useParams()
  const org = useSelectedOrganization()
  const { profile } = useProfile()
  const { project } = useProjectContext()
  const [sql] = partition(SQL_TEMPLATES, { type: 'template' })

  const snapV2 = useSqlEditorV2StateSnapshot()

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const { mutate: sendEvent } = useSendEventMutation()

  const handleNewQuery = async (sql: string, name: string) => {
    if (!ref) return console.error('未找到项目号')
    if (!project) return console.error('未找到项目')
    if (!profile) return console.error('未找到用户资料')

    if (!canCreateSQLSnippet) {
      return toast('您的查询不会被保存，因为您没有足够的权限')
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

      router.push(`/project/${ref}/sql/${snippet.id}`)
    } catch (error: any) {
      toast.error(`创建新查询失败: ${error.message}`)
    }
  }

  return (
    <div className="block h-full space-y-8 overflow-y-auto p-6 px-10 bg-dash-sidebar dark:bg-surface-100">
      <div>
        <div className="mb-6">
          <h1 className="text-foreground mb-1 text-xl">SQL 脚本</h1>
          <p className="text-foreground-light text-sm">能够立即在数据库上运行的 SQL 脚本。</p>
          <p className="text-foreground-light text-sm">
            点击任意脚本即可填充查询框，修改脚本，然后点击
            <span className="text-code">执行</span>。
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 ">
          {sql.map((x, i) => (
            <ActionCard
              key={`action-card-${i}`}
              title={x.title}
              description={x.description}
              bgColor="bg-alternative border"
              icon={<SQL_ICON className={cn('fill-foreground', 'w-4 h-4')} strokeWidth={1.5} />}
              onClick={() => {
                handleNewQuery(x.sql, x.title)
                sendEvent({
                  action: 'sql_editor_template_clicked',
                  properties: { templateName: x.title },
                  groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
                })
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default SQLTemplates
