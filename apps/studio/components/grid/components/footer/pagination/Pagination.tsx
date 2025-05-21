import { ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { useTableFilter } from 'components/grid/hooks/useTableFilter'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTable } from 'data/table-editor/table-editor-types'
import { THRESHOLD_COUNT, useTableRowsCountQuery } from 'data/table-rows/table-rows-count-query'
import { RoleImpersonationState } from 'lib/role-impersonation'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { DropdownControl } from '../../common/DropdownControl'
import { formatEstimatedCount } from './Pagination.utils'

const rowsPerPageOptions = [
  { value: 100, label: '100 条/页' },
  { value: 500, label: '500 条/页' },
  { value: 1000, label: '1000 条/页' },
]

const Pagination = () => {
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined

  const { project } = useProjectContext()
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()

  const { data: selectedTable } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  // rowsCountEstimate is only applicable to table entities
  const rowsCountEstimate = isTable(selectedTable) ? selectedTable.live_rows_estimate : null

  const { filters } = useTableFilter()
  const page = snap.page

  const roleImpersonationState = useRoleImpersonationStateSnapshot()
  const [isConfirmNextModalOpen, setIsConfirmNextModalOpen] = useState(false)
  const [isConfirmPreviousModalOpen, setIsConfirmPreviousModalOpen] = useState(false)
  const [isConfirmFetchExactCountModalOpen, setIsConfirmFetchExactCountModalOpen] = useState(false)

  const [value, setValue] = useState<string>(page.toString())

  // keep input value in-sync with actual page
  useEffect(() => {
    setValue(String(page))
  }, [page])

  const { data, isLoading, isSuccess, isError, isFetching, error } = useTableRowsCountQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      tableId: snap.table.id,
      filters,
      enforceExactCount: snap.enforceExactCount,
      roleImpersonationState: roleImpersonationState as RoleImpersonationState,
    },
    {
      keepPreviousData: true,
    }
  )

  const count = data?.is_estimate ? formatEstimatedCount(data.count) : data?.count.toLocaleString()
  const maxPages = Math.ceil((data?.count ?? 0) / tableEditorSnap.rowsPerPage)
  const totalPages = (data?.count ?? 0) > 0 ? maxPages : 1

  const onPreviousPage = () => {
    if (page > 1) {
      if (snap.selectedRows.size >= 1) {
        setIsConfirmPreviousModalOpen(true)
      } else {
        goToPreviousPage()
      }
    }
  }

  const onConfirmPreviousPage = () => {
    goToPreviousPage()
  }

  const onNextPage = () => {
    if (page < maxPages) {
      if (snap.selectedRows.size >= 1) {
        setIsConfirmNextModalOpen(true)
      } else {
        goToNextPage()
      }
    }
  }

  const onConfirmNextPage = () => {
    goToNextPage()
  }

  const goToPreviousPage = () => {
    const previousPage = page - 1
    snap.setPage(previousPage)
  }

  const goToNextPage = () => {
    const nextPage = page + 1
    snap.setPage(nextPage)
  }

  const onPageChange = (page: number) => {
    const pageNum = page > maxPages ? maxPages : page
    snap.setPage(pageNum || 1)
  }

  const onRowsPerPageChange = (value: string | number) => {
    const rowsPerPage = Number(value)
    tableEditorSnap.setRowsPerPage(isNaN(rowsPerPage) ? 100 : rowsPerPage)
  }

  useEffect(() => {
    if (page && page > totalPages) {
      snap.setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    if (id !== undefined) {
      snap.setEnforceExactCount(rowsCountEstimate !== null && rowsCountEstimate <= THRESHOLD_COUNT)
    }
  }, [id])

  useEffect(() => {
    // If the count query encountered a timeout error with exact count
    // turn off the exact count to rely on approximate
    if (isError && snap.enforceExactCount && error?.code === 408) {
      snap.setEnforceExactCount(false)
    }
  }, [isError, snap.enforceExactCount, error?.code])

  return (
    <div className="flex items-center gap-x-4">
      {isLoading && <p className="text-sm text-foreground-light">正在加载记录...</p>}

      {isSuccess && (
        <>
          <div className="flex items-center gap-x-2">
            <Button
              icon={<ArrowLeft />}
              type="outline"
              className="px-1.5"
              disabled={page <= 1 || isLoading}
              onClick={onPreviousPage}
            />
            <p className="text-xs text-foreground-light">第</p>
            <Input
              className="w-12"
              size="tiny"
              min={1}
              max={maxPages}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                const parsedValue = Number(value)
                if (
                  e.code === 'Enter' &&
                  !Number.isNaN(parsedValue) &&
                  parsedValue >= 1 &&
                  parsedValue <= maxPages
                ) {
                  onPageChange(parsedValue)
                }
              }}
            />

            <p className="text-xs text-foreground-light">页，共计 {totalPages.toLocaleString()} 页</p>

            <Button
              icon={<ArrowRight />}
              type="outline"
              className="px-1.5"
              disabled={page >= maxPages || isLoading}
              onClick={onNextPage}
            />

            <DropdownControl
              options={rowsPerPageOptions}
              onSelect={onRowsPerPageChange}
              side="top"
              align="start"
            >
              <Button asChild type="outline" style={{ padding: '3px 10px' }}>
                <span>{`${tableEditorSnap.rowsPerPage} 行/页`}</span>
              </Button>
            </DropdownControl>
          </div>

          <div className="flex items-center gap-x-2">
            <p className="text-xs text-foreground-light">
              {`${count} 条${data.count === 0 || data.count > 1 ? `记录` : '记录'}`}{' '}
              {data.is_estimate ? '（估计）' : ''}
            </p>

            {data.is_estimate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="tiny"
                    type="text"
                    className="px-1.5"
                    loading={isFetching}
                    icon={<HelpCircle />}
                    onClick={() => {
                      // Show warning if either NOT a table entity, or table rows estimate is beyond threshold
                      if (rowsCountEstimate === null || data.count > THRESHOLD_COUNT) {
                        setIsConfirmFetchExactCountModalOpen(true)
                      } else snap.setEnforceExactCount(true)
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="w-72">
                  由于您的这张表超过{' '}
                  {THRESHOLD_COUNT.toLocaleString()} 行，这是一个估计的行数。 <br />
                  <span className="text-brand">
                    点击获取表精确的行数。
                  </span>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </>
      )}

      {isError && (
        <p className="text-sm text-foreground-light">
          加载记录失败，请刷新页面重试。
        </p>
      )}

      <ConfirmationModal
        visible={isConfirmPreviousModalOpen}
        title="确认前往上一页"
        confirmLabel="确定"
        onCancel={() => setIsConfirmPreviousModalOpen(false)}
        onConfirm={() => {
          onConfirmPreviousPage()
          setIsConfirmPreviousModalOpen(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          您当前选中的行会被取消选中，是否继续？
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        visible={isConfirmNextModalOpen}
        title="确认前往下一页"
        confirmLabel="确定"
        onCancel={() => setIsConfirmNextModalOpen(false)}
        onConfirm={() => {
          onConfirmNextPage()
          setIsConfirmNextModalOpen(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          您当前选中的行会被取消选中，是否继续？
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        variant="warning"
        visible={isConfirmFetchExactCountModalOpen}
        title="确定获取表的精确行数"
        confirmLabel="获取精确行数"
        onCancel={() => setIsConfirmFetchExactCountModalOpen(false)}
        onConfirm={() => {
          snap.setEnforceExactCount(true)
          setIsConfirmFetchExactCountModalOpen(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          {rowsCountEstimate === null
            ? `如果您的表有超过 ${THRESHOLD_COUNT.toLocaleString()} 行，
          获取表的精确行数可能会导致数据库性能问题。`
            : `您的表有超过 ${THRESHOLD_COUNT.toLocaleString()} 行，
          获取表的精确行数可能会导致数据库性能问题。`}
        </p>
      </ConfirmationModal>
    </div>
  )
}
export default Pagination
