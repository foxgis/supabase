import { useParams } from 'common'
import { useQueuesExposePostgrestStatusQuery } from 'data/database-queues/database-queues-expose-postgrest-status-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'
import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'

export const QueuesOverviewTab = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { data: isExposed } = useQueuesExposePostgrestStatusQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  return (
    <IntegrationOverviewTab
      actions={
        !isExposed ? (
          <Admonition
            type="default"
            title="消息队列可以通过客户端 SDK 或者 API 接口进行管理"
          >
            您可以在
            <Button asChild type="default">
              <Link href={`/project/${ref}/integrations/queues/settings`}>
                管理消息队列设置
              </Link>
            </Button>
            中选择是否允许使用 API 接口管理消息队列
          </Admonition>
        ) : null
      }
    />
  )
}
