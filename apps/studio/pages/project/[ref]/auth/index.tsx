import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import type { NextPageWithLayout } from 'types'

const Authentication: NextPageWithLayout = () => {
  return <>{/* <h1>Use this as a template for authentication pages</h1> */}</>
}

Authentication.getLayout = (page) => <AuthLayout title="认证授权">{page}</AuthLayout>

export default Authentication
