import { RealtimePolicies } from 'components/interfaces/Realtime/Policies'
import type { NextPageWithLayout } from 'types'

import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'

const RealtimePoliciesPage: NextPageWithLayout = () => {
  return <RealtimePolicies />
}

RealtimePoliciesPage.getLayout = (page) => (
  <DefaultLayout>
    <RealtimeLayout title="实时通信安全策略">{page}</RealtimeLayout>
  </DefaultLayout>
)

export default RealtimePoliciesPage
