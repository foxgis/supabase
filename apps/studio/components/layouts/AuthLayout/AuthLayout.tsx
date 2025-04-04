import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { useIsColumnLevelPrivilegesEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useAuthConfigPrefetch } from 'data/auth/auth-config-query'
import { withAuth } from 'hooks/misc/withAuth'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateAuthMenu } from './AuthLayout.utils'

const AuthProductMenu = () => {
  const router = useRouter()
  const { ref: projectRef = 'default' } = useParams()
  const columnLevelPrivileges = useIsColumnLevelPrivilegesEnabled()

  useAuthConfigPrefetch({ projectRef })
  const page = router.pathname.split('/')[4]

  return (
    <>
      <ProductMenu page={page} menu={generateAuthMenu(projectRef)} />
      {columnLevelPrivileges && (
        <div className="px-3">
          <Alert_Shadcn_>
            <AlertTitle_Shadcn_ className="text-sm">
              列权限已经被移出
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_ className="text-xs">
              <p className="mb-2">现在可以在数据库选项卡的菜单中找到它。</p>
              <Button asChild type="default" size="tiny">
                <Link href={`/project/${projectRef}/database/column-privileges`}>
                  前往数据库
                </Link>
              </Button>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </div>
      )}
    </>
  )
}

const AuthLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <ProjectLayout
      title="认证授权"
      product="认证授权"
      productMenu={<AuthProductMenu />}
      isBlocking={false}
    >
      {children}
    </ProjectLayout>
  )
}

/**
 * Layout for all auth pages on the dashboard, wrapped with withAuth to verify logged in state
 *
 * Handles rendering the navigation for each section under the auth pages.
 */
export default withAuth(AuthLayout)
