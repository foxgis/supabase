import { PermissionAction } from '@supabase/shared-types/out/constants'

import RateLimits from 'components/interfaces/Auth/RateLimits/RateLimits'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import { FormsContainer } from 'components/ui/Forms/FormsContainer'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="访问项目的认证限流设置" />
  } else {
    return (
      <FormsContainer>
        <RateLimits />
      </FormsContainer>
    )
  }
}

PageLayout.getLayout = (page) => {
  return <AuthLayout>{page}</AuthLayout>
}

export default PageLayout
