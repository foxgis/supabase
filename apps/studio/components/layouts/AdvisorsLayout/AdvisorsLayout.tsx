import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProductMenu } from 'components/ui/ProductMenu'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { useFlag } from 'hooks/ui/useFlag'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateAdvisorsMenu } from './AdvisorsMenu.utils'

export interface AdvisorsLayoutProps {
  title?: string
}

const AdvisorsLayout = ({ children, title }: PropsWithChildren<AdvisorsLayoutProps>) => {
  const project = useSelectedProject()
  const advisorRules = useFlag('advisorRules')

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  return (
    <ProjectLayout
      title={title}
      isLoading={false}
      product="优化助手"
      productMenu={
        <ProductMenu page={page} menu={generateAdvisorsMenu(project, { advisorRules })} />
      }
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(AdvisorsLayout)
