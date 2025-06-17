import { PermissionAction } from '@supabase/shared-types/out/constants'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useHooksEnableMutation } from 'data/database/hooks-enable-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { Admonition } from 'ui-patterns'
import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'

export const WebhooksOverviewTab = () => {
  const { project } = useProjectContext()
  const { ref: projectRef } = useParams()

  const {
    data: schemas,
    isSuccess: isSchemasLoaded,
    refetch,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const isHooksEnabled = schemas?.some((schema) => schema.name === 'supabase_functions')
  const canReadWebhooks = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'triggers')
  const isPermissionsLoaded = usePermissionsLoaded()

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

  if (isPermissionsLoaded && !canReadWebhooks) {
    return (
      <div className="p-10">
        <NoPermission isFullPage resourceText="查看数据库 webhooks" />
      </div>
    )
  }

  if (!isSchemasLoaded) {
    return (
      <div className="p-10">
        <GenericSkeletonLoader />
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
              disabled={!isPermissionsLoaded || isEnablingHooks}
              tooltip={{
                content: {
                  side: 'bottom',
                  text:
                    isPermissionsLoaded && !canReadWebhooks
                      ? '您需要额外权限才能启用 webhooks'
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
