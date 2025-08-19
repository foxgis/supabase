import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { StoragePolicies } from 'components/interfaces/Storage'
import type { NextPageWithLayout } from 'types'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'

const StoragePoliciesPage: NextPageWithLayout = () => {
  return <StoragePolicies />
}

StoragePoliciesPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="存储桶安全策略">
      <PageLayout
        title="存储桶安全策略"
        subtitle="在存储桶级别编写允许用户执行的操作的访问策略以保护您的文件"
      >
        <ScaffoldContainer>{page}</ScaffoldContainer>
      </PageLayout>
    </StorageLayout>
  </DefaultLayout>
)

export default StoragePoliciesPage
