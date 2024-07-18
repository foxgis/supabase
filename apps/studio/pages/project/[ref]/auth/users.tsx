import { Users } from 'components/interfaces/Auth/Users'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import type { NextPageWithLayout } from 'types'

const UsersPage: NextPageWithLayout = () => {
  return <Users />
}

UsersPage.getLayout = (page) => <AuthLayout title="认证授权">{page}</AuthLayout>

export default UsersPage
