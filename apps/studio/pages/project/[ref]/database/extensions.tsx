import { PermissionAction } from '@supabase/shared-types/out/constants'

import { Extensions } from 'components/interfaces/Database'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const DatabaseExtensions: NextPageWithLayout = () => {
  const { can: canReadExtensions, isSuccess: isPermissionsLoaded } =
    useAsyncCheckProjectPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'extensions')

  if (isPermissionsLoaded && !canReadExtensions) {
    return <NoPermission isFullPage resourceText="查看数据库扩展" />
  }

  return (
    <PageLayout
      size="large"
      title="数据库扩展"
      subtitle="管理数据库中安装的扩展"
    >
      <ScaffoldContainer size="large">
        <ScaffoldSection isFullWidth>
          <Extensions />
        </ScaffoldSection>
      </ScaffoldContainer>
    </PageLayout>
  )
}

DatabaseExtensions.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="数据库扩展">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseExtensions
