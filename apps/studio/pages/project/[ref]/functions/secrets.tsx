import EdgeFunctionSecrets from 'components/interfaces/Functions/EdgeFunctionSecrets/EdgeFunctionSecrets'
import { FunctionsSecretsEmptyStateLocal } from 'components/interfaces/Functions/FunctionsEmptyState'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { IS_PLATFORM } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

const SecretsPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer size="large" className="pt-6">
      {IS_PLATFORM ? <EdgeFunctionSecrets /> : <FunctionsSecretsEmptyStateLocal />}
    </ScaffoldContainer>
  )
}

SecretsPage.getLayout = (page) => {
  return (
    <DefaultLayout>
      <EdgeFunctionsLayout>
        <PageLayout
          size="large"
          title="云函数密钥"
          subtitle="管理云函数的密钥"
        >
          {page}
        </PageLayout>
      </EdgeFunctionsLayout>
    </DefaultLayout>
  )
}

export default SecretsPage
