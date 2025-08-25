import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import RateLimits from 'components/interfaces/Auth/RateLimits/RateLimits'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const RateLimitsPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const showRateLimits = useIsFeatureEnabled('authentication:rate_limits')

  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (!showRateLimits) {
    return <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
  }

  return (
    <PageLayout
      title="限流"
      subtitle="防止传入突发流量导致服务中断，优化认证服务的稳定性"
      primaryActions={
        <DocsButton href="https://supabase.com/docs/guides/platform/going-into-prod#rate-limiting-resource-allocation--abuse-prevention" />
      }
    >
      {isPermissionsLoaded && !canReadAuthSettings ? (
        <NoPermission isFullPage resourceText="访问认证限流设置" />
      ) : (
        <ScaffoldContainer>
          {!isPermissionsLoaded ? (
            <ScaffoldSection isFullWidth>
              <GenericSkeletonLoader />
            </ScaffoldSection>
          ) : (
            <RateLimits />
          )}
        </ScaffoldContainer>
      )}
    </PageLayout>
  )
}

RateLimitsPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default RateLimitsPage
