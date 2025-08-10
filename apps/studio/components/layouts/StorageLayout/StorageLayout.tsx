import { ReactNode } from 'react'

import StorageMenu from 'components/interfaces/Storage/StorageMenu'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'

export interface StorageLayoutProps {
  title: string
  children: ReactNode
}

const StorageLayout = ({ title, children }: StorageLayoutProps) => {
  return (
    <ProjectLayout
      stickySidebarBottom
      title={title || '文件存储'}
      product="文件存储"
      productMenu={<StorageMenu />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(StorageLayout)
