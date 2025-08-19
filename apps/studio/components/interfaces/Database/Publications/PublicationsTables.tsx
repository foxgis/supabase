import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { useParams } from 'common'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Loading } from 'components/ui/Loading'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { PublicationsTableItem } from './PublicationsTableItem'

export const PublicationsTables = () => {
  const { ref, id } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [filterString, setFilterString] = useState<string>('')

  const { can: canUpdatePublications, isLoading: isLoadingPermissions } =
    useAsyncCheckProjectPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'publications')

  const { data: publications = [] } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const selectedPublication = publications.find((pub) => pub.id === Number(id))

  const {
    data: tablesData = [],
    isLoading,
    isSuccess,
    isError,
    error,
  } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const tables = useMemo(() => {
    return tablesData.filter((table) =>
      filterString.length === 0 ? table : table.name.includes(filterString)
    )
  }, [tablesData, filterString])

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ButtonTooltip
              asChild
              type="outline"
              icon={<ChevronLeft />}
              style={{ padding: '5px' }}
              tooltip={{ content: { side: 'bottom', text: 'Go back to publications list' } }}
            >
              <Link href={`/project/${ref}/database/publications`} />
            </ButtonTooltip>
            <div>
              <Input
                size="tiny"
                placeholder="查找表"
                value={filterString}
                onChange={(e) => setFilterString(e.target.value)}
                icon={<Search size={12} />}
                className="w-48 pl-8"
              />
            </div>
          </div>
          {!isLoadingPermissions && !canUpdatePublications && (
            <Admonition
              type="note"
              className="w-[500px] m-0"
              title="您需要额外的权限才能更新数据库复制设置"
            />
          )}
        </div>
      </div>

      {(isLoading || isLoadingPermissions) && (
        <div className="mt-8">
          <Loading />
        </div>
      )}

      {isError && <AlertError error={error} subject="获取表失败" />}

      {isSuccess &&
        (tables.length === 0 ? (
          <NoSearchResults />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>表名</TableHead>
                  <TableHead>模式</TableHead>
                  <TableHead>描述</TableHead>
                  {/*
                      We've disabled All tables toggle for publications.
                      See https://github.com/supabase/supabase/pull/7233.
                    */}
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!!selectedPublication ? (
                  tables.map((table) => (
                    <PublicationsTableItem
                      key={table.id}
                      table={table}
                      selectedPublication={selectedPublication}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <p>选中的发布订阅 ID {id} 不存在</p>
                      <p className="text-foreground-light">
                        请返回发布订阅列表重新选择一个
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        ))}
    </>
  )
}
