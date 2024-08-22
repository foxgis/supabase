import { RealtimePolicies } from 'components/interfaces/Realtime/Policies'
import type { NextPageWithLayout } from 'types'

import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'

const RealtimePoliciesPage: NextPageWithLayout = () => {
  return <RealtimePolicies />
}

RealtimePoliciesPage.getLayout = (page) => <RealtimeLayout title="实时通信策略">{page}</RealtimeLayout>

export default RealtimePoliciesPage
