import { PermissionAction } from '@supabase/shared-types/out/constants'
import type { NextPageWithLayout } from 'types'

import { RealtimeInspector } from 'components/interfaces/Realtime/Inspector'
import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

export const InspectorPage: NextPageWithLayout = () => {
  const canReadAPIKeys = useCheckPermissions(PermissionAction.READ, 'service_api_keys')

  if (!canReadAPIKeys) {
    return <NoPermission isFullPage resourceText="访问项目的实时通信功能" />
  }

  return <RealtimeInspector />
}

InspectorPage.getLayout = (page) => (
  <DefaultLayout>
    <RealtimeLayout title="实时通信检视器">{page}</RealtimeLayout>
  </DefaultLayout>
)

export default InspectorPage
