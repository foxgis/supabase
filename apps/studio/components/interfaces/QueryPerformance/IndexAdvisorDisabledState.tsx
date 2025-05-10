import Link from 'next/link'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { DocsButton } from 'components/ui/DocsButton'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { getIndexAdvisorExtensions } from './index-advisor.utils'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { Markdown } from '../Markdown'

export const IndexAdvisorDisabledState = () => {
  const { ref } = useParams()
  const { project } = useProjectContext()
  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { hypopg, indexAdvisor } = getIndexAdvisorExtensions(extensions)

  const { mutateAsync: enableExtension, isLoading: isEnablingExtension } =
    useDatabaseExtensionEnableMutation()

  const onEnableIndexAdvisor = async () => {
    if (project === undefined) return console.error('Project is required')

    try {
      if (hypopg?.installed_version === null) {
        await enableExtension({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: hypopg.name,
          schema: hypopg?.schema ?? 'extensions',
          version: hypopg.default_version,
        })
      }
      if (indexAdvisor?.installed_version === null) {
        await enableExtension({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: indexAdvisor.name,
          schema: indexAdvisor?.schema ?? 'extensions',
          version: indexAdvisor.default_version,
        })
      }
      toast.success('成功启用了索引向导！')
    } catch (error: any) {
      toast.error(`启用索引向导失败: ${error.message}`)
    }
  }

  return (
    <Alert_Shadcn_ className="mb-6">
      <AlertTitle_Shadcn_>
        <Markdown
          className="text-foreground"
          content={
            indexAdvisor === undefined
              ? '需要更新的 Postgres 版本'
              : '需要安装 Postgres 扩展 `index_advisor` 和 `hypopg`'
          }
        />
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        <Markdown
          content={
            indexAdvisor === undefined
              ? '升级到最新版本的 Postgres 可以获取对您查询的索引建议'
              : '这些扩展可以通过提出数据库索引建议来降低查询的成本。'
          }
        />
      </AlertDescription_Shadcn_>

      <AlertDescription_Shadcn_ className="mt-3">
        <div className="flex items-center gap-x-2">
          {indexAdvisor === undefined ? (
            <Button asChild type="default">
              <Link href={`/project/${ref}/settings/infrastructure`}>升级 Postgres 版本</Link>
            </Button>
          ) : (
            <Button
              type="default"
              disabled={isEnablingExtension}
              loading={isEnablingExtension}
              onClick={() => onEnableIndexAdvisor()}
            >
              启用扩展
            </Button>
          )}
          <DocsButton href="https://supabase.com/docs/guides/database/extensions/index_advisor" />
        </div>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
