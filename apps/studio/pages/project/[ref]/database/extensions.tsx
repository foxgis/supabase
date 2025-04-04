import { PermissionAction } from '@supabase/shared-types/out/constants'

import { Extensions } from 'components/interfaces/Database'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const DatabaseExtensions: NextPageWithLayout = () => {
  const canReadExtensions = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'extensions'
  )
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadExtensions) {
    return <NoPermission isFullPage resourceText="查看数据库扩展" />
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <FormHeader title="数据库扩展" />
          <Extensions />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabaseExtensions.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseExtensions
