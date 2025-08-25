import { useParams } from 'common'
import { RolesList } from 'components/interfaces/Database'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const DatabaseRoles: NextPageWithLayout = () => {
  const { ref } = useParams()
  const showRoles = useIsFeatureEnabled('database:roles')

  if (!showRoles) {
    return <UnknownInterface urlBack={`/project/${ref}/database/schemas`} />
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <FormHeader
            title="数据库角色"
            description="通过用户、组和权限管理数据库的访问控制"
          />
          <RolesList />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabaseRoles.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseRoles
