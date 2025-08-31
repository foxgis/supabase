import { RealtimePolicies } from 'components/interfaces/Realtime/Policies'
import type { NextPageWithLayout } from 'types'

import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'

const RealtimePoliciesPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer size="full">
      <ScaffoldSection isFullWidth>
        <RealtimePolicies />
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

RealtimePoliciesPage.getLayout = (page) => (
  <DefaultLayout>
    <RealtimeLayout title="访问策略">
      <PageLayout
        title="访问策略"
        subtitle="控制实时通信频道的访问"
        primaryActions={
          <DocsButton href="https://supabase.com/docs/guides/realtime/authorization" />
        }
        size="large"
      >
        {page}
      </PageLayout>
    </RealtimeLayout>
  </DefaultLayout>
)

export default RealtimePoliciesPage
