import { PermissionAction } from '@supabase/shared-types/out/constants'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useHooksEnableMutation } from 'data/database/hooks-enable-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Admonition } from 'ui-patterns'
import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'

export const WebhooksOverviewTab = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const {
    data: schemas,
    isSuccess: isSchemasLoaded,
    refetch,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const isHooksEnabled = schemas?.some((schema) => schema.name === 'supabase_functions')
  const { can: canReadWebhooks, isLoading: isLoadingPermissions } = useAsyncCheckProjectPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'triggers'
  )

  const { mutate: enableHooks, isLoading: isEnablingHooks } = useHooksEnableMutation({
    onSuccess: async () => {
      await refetch()
      toast.success('成功启用了 webhooks')
    },
  })

  const enableHooksForProject = async () => {
    if (!projectRef) return console.error('未找到项目号')
    enableHooks({ ref: projectRef })
  }

  if (!isSchemasLoaded || isLoadingPermissions) {
    return (
      <div className="p-10">
        <GenericSkeletonLoader />
      </div>
    )
  }

  if (!canReadWebhooks) {
    return (
      <div className="p-10">
        <NoPermission isFullPage resourceText="查看数据库 webhooks" />
      </div>
    )
  }

  return (
    <IntegrationOverviewTab
      actions={
        isSchemasLoaded && isHooksEnabled ? null : (
          <Admonition
            showIcon={false}
            type="default"
            title="启用数据库 webhooks"
          >
            <p>
              数据库 webhooks 可以用来触发云函数或发送 HTTP 请求
            </p>
            <ButtonTooltip
              className="w-fit"
              onClick={() => enableHooksForProject()}
              disabled={isEnablingHooks}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canReadWebhooks
                    ? '您需要额外的权限才能启用 webhooks'
                    : undefined,
                },
              }}
            >
              启用 webhooks
            </ButtonTooltip>
          </Admonition>
        )
      }
    />
  )
}
