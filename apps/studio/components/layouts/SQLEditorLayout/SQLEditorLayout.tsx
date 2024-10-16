import { OngoingQueriesPanel } from 'components/interfaces/SQLEditor/OngoingQueriesPanel'
import { withAuth } from 'hooks/misc/withAuth'
import { ReactNode, useMemo, useState } from 'react'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { SQLEditorMenu } from './SQLEditorMenu'

export interface SQLEditorLayoutProps {
  title: string
  children: ReactNode
}

const SQLEditorLayout = ({ title, children }: SQLEditorLayoutProps) => {
  const [showOngoingQueries, setShowOngoingQueries] = useState(false)
  const productMenu = useMemo(
    () => (
      <SQLEditorMenu
        key="sql-editor-menu"
        onViewOngoingQueries={() => setShowOngoingQueries(true)}
      />
    ),
    []
  )

  return (
    <ProjectLayout
      title={title || 'SQL 查询'}
      product="SQL 查询"
      productMenu={productMenu}
      isBlocking={false}
      resizableSidebar
    >
      {children}
      <OngoingQueriesPanel
        visible={showOngoingQueries}
        onClose={() => setShowOngoingQueries(false)}
      />
    </ProjectLayout>
  )
}

export default withAuth(SQLEditorLayout)
