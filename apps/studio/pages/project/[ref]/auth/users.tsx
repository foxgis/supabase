import { UsersV2 } from 'components/interfaces/Auth/Users/UsersV2'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import type { NextPageWithLayout } from 'types'

const UsersPage: NextPageWithLayout = () => {
  return <UsersV2 />
}

UsersPage.getLayout = (page) => <AuthLayout title="认证授权">{page}</AuthLayout>

export default UsersPage
