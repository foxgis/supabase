import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProductMenu } from 'components/ui/ProductMenu'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateGISMenu } from './GISMenu.utils'

export interface GISLayoutProps {
  title?: string
}

const GISLayout = ({ children, title }: PropsWithChildren<GISLayoutProps>) => {
  const { data: project } = useSelectedProjectQuery()

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  return (
    <ProjectLayout
      title={title}
      isLoading={false}
      product="GIS 服务"
      productMenu={<ProductMenu page={page} menu={generateGISMenu(project)} />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(GISLayout)
