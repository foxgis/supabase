import type { PostgresPublication, PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'
import { Badge, Toggle } from 'ui'

import Table from 'components/to-be-cleaned/Table'
import { useDatabasePublicationUpdateMutation } from 'data/database-publications/database-publications-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { toast } from 'sonner'

interface PublicationsTableItemProps {
  table: PostgresTable
  selectedPublication: PostgresPublication
}

const PublicationsTableItem = ({ table, selectedPublication }: PublicationsTableItemProps) => {
  const { data: project } = useSelectedProjectQuery()
  const enabledForAllTables = selectedPublication.tables == null

  const [checked, setChecked] = useState(
    selectedPublication.tables?.find((x: any) => x.id == table.id) != undefined
  )

  const canUpdatePublications = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'publications'
  )

  const { mutate: updatePublications, isLoading } = useDatabasePublicationUpdateMutation()

  const toggleReplicationForTable = async (
    table: PostgresTable,
    publication: PostgresPublication
  ) => {
    if (project === undefined) return console.error('未找到项目')

    const originalChecked = checked
    setChecked(!checked)

    const publicationTables = publication?.tables ?? []
    const exists = publicationTables.some((x: any) => x.id == table.id)
    const tables = !exists
      ? [`${table.schema}.${table.name}`].concat(
          publicationTables.map((t: any) => `${t.schema}.${t.name}`)
        )
      : publicationTables
          .filter((x: any) => x.id != table.id)
          .map((x: any) => `${x.schema}.${x.name}`)

    updatePublications(
      {
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        id: publication.id,
        tables,
      },
      {
        onSuccess: () => {
          toast.success(
            `成功${checked ? '禁用' : '启用'}表 ${table.name} 复制`
          )
        },
        onError: (error) => {
          toast.error(`启停表 ${table.name} 复制失败：${error.message}`)
          setChecked(originalChecked)
        },
      }
    )
  }

  return (
    <Table.tr key={table.id}>
      <Table.td className="whitespace-nowrap">{table.name}</Table.td>
      <Table.td className="whitespace-nowrap">{table.schema}</Table.td>
      <Table.td className="hidden max-w-sm truncate whitespace-nowrap lg:table-cell">
        {table.comment}
      </Table.td>
      <Table.td className="px-4 py-3 pr-2">
        <div className="flex justify-end gap-2">
          {enabledForAllTables ? (
            <Badge>
              <span className="hidden lg:inline-block">&nbsp;所有表</span>
              <span>已启用</span>
            </Badge>
          ) : (
            <Toggle
              size="tiny"
              align="right"
              disabled={!canUpdatePublications || isLoading}
              className="m-0 ml-2 mt-1 -mb-1 p-0"
              checked={checked}
              onChange={() => toggleReplicationForTable(table, selectedPublication)}
            />
          )}
        </div>
      </Table.td>
    </Table.tr>
  )
}

export default PublicationsTableItem
