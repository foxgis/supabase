import { PermissionAction } from '@supabase/shared-types/out/constants'
import { PropsWithChildren, useMemo } from 'react'

import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { ProjectLayoutWithAuth } from '../ProjectLayout/ProjectLayout'
import TableEditorMenu from './TableEditorMenu'

const TableEditorLayout = ({ children }: PropsWithChildren<{}>) => {
  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'tables')

  const tableEditorMenu = useMemo(() => <TableEditorMenu />, [])

  if (isPermissionsLoaded && !canReadTables) {
    return (
      <ProjectLayoutWithAuth isBlocking={false}>
        <NoPermission isFullPage resourceText="查看本项目中的表" />
      </ProjectLayoutWithAuth>
    )
  }

  return (
    <ProjectLayoutWithAuth
      product="数据表"
      productMenu={tableEditorMenu}
      isBlocking={false}
      resizableSidebar
    >
      {children}
    </ProjectLayoutWithAuth>
  )
}

export default TableEditorLayout
