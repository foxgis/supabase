import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { Check, ChevronLeft, Edit, MoreVertical, Plus, Search, Trash, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { PROTECTED_SCHEMAS } from 'lib/constants/schemas'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import ProtectedSchemaWarning from '../ProtectedSchemaWarning'

interface ColumnListProps {
  onAddColumn: () => void
  onEditColumn: (column: any) => void
  onDeleteColumn: (column: any) => void
}

const ColumnList = ({
  onAddColumn = noop,
  onEditColumn = noop,
  onDeleteColumn = noop,
}: ColumnListProps) => {
  const { id: _id, ref } = useParams()
  const id = _id ? Number(_id) : undefined

  const { project } = useProjectContext()
  const {
    data: selectedTable,
    error,
    isError,
    isLoading,
    isSuccess,
  } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  const [filterString, setFilterString] = useState<string>('')
  const isTableEntity = isTableLike(selectedTable)

  const columns =
    (filterString.length === 0
      ? selectedTable?.columns ?? []
      : selectedTable?.columns?.filter((column) => column.name.includes(filterString))) ?? []

  const isLocked = PROTECTED_SCHEMAS.includes(selectedTable?.schema ?? '')
  const canUpdateColumns = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'columns')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild type="outline" icon={<ChevronLeft />} style={{ padding: '5px' }}>
            <Link href={`/project/${ref}/database/tables`} />
          </Button>
          <Input
            size="small"
            placeholder="筛选列"
            value={filterString}
            onChange={(e: any) => setFilterString(e.target.value)}
            icon={<Search size={12} />}
          />
        </div>
        {!isLocked && isTableEntity && (
          <ButtonTooltip
            icon={<Plus />}
            disabled={!canUpdateColumns}
            onClick={() => onAddColumn()}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateColumns
                  ? '您需要额外的权限才能创建列'
                  : undefined,
              },
            }}
          >
            新建列
          </ButtonTooltip>
        )}
      </div>

      {isLocked && <ProtectedSchemaWarning schema={selectedTable?.schema ?? ''} entity="列" />}

      {isLoading && <GenericSkeletonLoader />}

      {isError && (
        <AlertError
          error={error as any}
          subject={`获取表 "${selectedTable?.schema}.${selectedTable?.name}" 的列失败`}
        />
      )}

      {isSuccess && (
        <>
          {columns.length === 0 ? (
            <NoSearchResults />
          ) : (
            <div>
              <Table
                head={[
                  <Table.th key="name">名称</Table.th>,
                  <Table.th key="description" className="hidden lg:table-cell">
                    描述
                  </Table.th>,
                  <Table.th key="type">数据类型</Table.th>,
                  <Table.th key="format">数据格式</Table.th>,
                  <Table.th key="format" className="text-center">
                    可空
                  </Table.th>,
                  <Table.th key="buttons"></Table.th>,
                ]}
                body={columns.map((x) => (
                  <Table.tr className="border-t" key={x.name}>
                    <Table.td>
                      <p>{x.name}</p>
                    </Table.td>
                    <Table.td className="break-all whitespace-normal hidden xl:table-cell">
                      {x.comment !== null ? (
                        <p title={x.comment}>{x.comment}</p>
                      ) : (
                        <p className="text-border-stronger">无描述信息</p>
                      )}
                    </Table.td>
                    <Table.td>
                      <code className="text-xs">{x.data_type}</code>
                    </Table.td>
                    <Table.td className="font-mono text-xs">
                      <code className="text-xs">{x.format}</code>
                    </Table.td>
                    <Table.td className="font-mono text-xs">
                      {x.is_nullable ? (
                        <Check size={16} className="mx-auto" />
                      ) : (
                        <X size={16} className="mx-auto" />
                      )}
                    </Table.td>
                    <Table.td className="text-right">
                      {!isLocked && isTableEntity && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="default" className="px-1" icon={<MoreVertical />} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="bottom" align="end" className="w-32">
                            <Tooltip>
                              <TooltipTrigger>
                                <DropdownMenuItem
                                  disabled={!canUpdateColumns}
                                  onClick={() => onEditColumn(x)}
                                  className="space-x-2"
                                >
                                  <Edit size={12} />
                                  <p>编辑列</p>
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              {!canUpdateColumns && (
                                <TooltipContent side="bottom">
                                  需要额外的权限才能编辑列
                                </TooltipContent>
                              )}
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger>
                                <DropdownMenuItem
                                  disabled={!canUpdateColumns || isLocked}
                                  onClick={() => onDeleteColumn(x)}
                                  className="space-x-2"
                                >
                                  <Trash stroke="red" size={12} />
                                  <p>删除列</p>
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              {!canUpdateColumns && (
                                <TooltipContent side="bottom">
                                  需要额外的权限才能删除列
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </Table.td>
                  </Table.tr>
                ))}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ColumnList
