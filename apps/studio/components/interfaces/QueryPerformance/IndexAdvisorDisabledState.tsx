import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { Markdown } from '../Markdown'

export const IndexAdvisorDisabledState = () => {
  const { ref } = useParams()
  const { project } = useProjectContext()
  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const hypopgExtension = (extensions ?? []).find((ext) => ext.name === 'hypopg')
  const indexAdvisorExtension = (extensions ?? []).find((ext) => ext.name === 'index_advisor')

  const { mutateAsync: enableExtension, isLoading: isEnablingExtension } =
    useDatabaseExtensionEnableMutation()

  const onEnableIndexAdvisor = async () => {
    if (project === undefined) return console.error('Project is required')

    try {
      if (hypopgExtension?.installed_version === null) {
        await enableExtension({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: hypopgExtension.name,
          schema: hypopgExtension?.schema ?? 'extensions',
          version: hypopgExtension.default_version,
        })
      }
      if (indexAdvisorExtension?.installed_version === null) {
        await enableExtension({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: indexAdvisorExtension.name,
          schema: indexAdvisorExtension?.schema ?? 'extensions',
          version: indexAdvisorExtension.default_version,
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
            indexAdvisorExtension === undefined
              ? '需要更新的 Postgres 版本'
              : '需要安装 Postgres 扩展 `index_advisor` 和 `hypopg`'
          }
        />
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        <Markdown
          content={
            indexAdvisorExtension === undefined
              ? '升级到最新版本的 Postgres 可以获取对您查询的索引建议'
              : '这些扩展可以通过提出数据库索引建议来降低查询的成本。'
          }
        />
      </AlertDescription_Shadcn_>

      <AlertDescription_Shadcn_ className="mt-3">
        <div className="flex items-center gap-x-2">
          {indexAdvisorExtension === undefined ? (
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
          <Button asChild type="outline" icon={<ExternalLink />}>
            <a
              target="_blank"
              rel="noreferrer"
              href="https://supabase.com/docs/guides/database/extensions/index_advisor"
            >
              文档
            </a>
          </Button>
        </div>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
