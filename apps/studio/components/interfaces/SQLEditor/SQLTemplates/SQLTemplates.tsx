import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

import { useTelemetryProps } from 'common'
import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.queries'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import type { SqlSnippet } from 'data/content/sql-snippets-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import Telemetry from 'lib/telemetry'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { createSqlSnippetSkeleton } from '../SQLEditor.utils'
import SQLCard from './SQLCard'

const SQLTemplates = () => {
  const router = useRouter()
  const { profile } = useProfile()
  const { project } = useProjectContext()
  const [sql] = partition(SQL_TEMPLATES, { type: 'template' })

  const telemetryProps = useTelemetryProps()
  const snap = useSqlEditorStateSnapshot()
  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const handleNewQuery = async (sql: string, name: string) => {
    if (!project) return console.error('未找到项目')
    if (!profile) return console.error('未找到用户')
    if (!canCreateSQLSnippet) {
      return toast('您的查询不会被保存，因为您没有足够的权限')
    }

    try {
      const snippet = createSqlSnippetSkeleton({
        id: uuidv4(),
        name,
        sql,
        owner_id: profile.id,
        project_id: project.id,
      })

      snap.addSnippet(snippet as SqlSnippet, project.ref)
      snap.addNeedsSaving(snippet.id!)
      router.push(`/project/${project.ref}/sql/${snippet.id}`)
    } catch (error: any) {
      toast.error(`创建新查询失败: ${error.message}`)
    }
  }

  return (
    <div className="block h-full space-y-8 overflow-y-auto p-6">
      <div>
        <div className="mb-4">
          <h1 className="text-foreground mb-3 text-xl">脚本</h1>
          <p className="text-foreground-light text-sm">能够立即在数据库上运行的脚本。</p>
          <p className="text-foreground-light text-sm">
            点击任意脚本即可填充查询框，修改脚本，然后点击
            <span className="text-code">执行</span>。
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 ">
          {sql.map((x) => (
            <SQLCard
              key={x.title}
              title={x.title}
              description={x.description}
              sql={x.sql}
              onClick={(sql, title) => {
                handleNewQuery(sql, title)
                Telemetry.sendEvent(
                  {
                    category: 'scripts',
                    action: 'script_clicked',
                    label: x.title,
                  },
                  telemetryProps,
                  router
                )
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default SQLTemplates
