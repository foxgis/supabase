import { ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PostgresTable } from '@supabase/postgres-meta'

import { formatFilterURLParams } from 'components/grid/SupabaseGrid.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { THRESHOLD_COUNT, useTableRowsCountQuery } from 'data/table-rows/table-rows-count-query'
import useTable from 'hooks/misc/useTable'
import { useUrlState } from 'hooks/ui/useUrlState'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import {
  Button,
  InputNumber,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useParams } from 'common'
import { useDispatch, useTrackedState } from '../../../store/Store'
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

  const state = useTrackedState()
  const dispatch = useDispatch()
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()

  const { data: selectedTable } = useTable(id)
  // [Joshen] Only applicable to table entities
  const rowsCountEstimate = (selectedTable as PostgresTable)?.live_rows_estimate ?? null

  const [{ filter }] = useUrlState({ arrayKeys: ['filter'] })
  const filters = formatFilterURLParams(filter as string[])
  const page = snap.page
  const table = state.table ?? undefined

  const roleImpersonationState = useRoleImpersonationStateSnapshot()
  const [isConfirmNextModalOpen, setIsConfirmNextModalOpen] = useState(false)
  const [isConfirmPreviousModalOpen, setIsConfirmPreviousModalOpen] = useState(false)
  const [isConfirmFetchExactCountModalOpen, setIsConfirmFetchExactCountModalOpen] = useState(false)

  const { data, isLoading, isSuccess, isError, isFetching } = useTableRowsCountQuery(
    {
      queryKey: [table?.schema, table?.name, 'count-estimate'],
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      table,
      filters,
      enforceExactCount: snap.enforceExactCount,
      impersonatedRole: roleImpersonationState.role,
    },
    {
      keepPreviousData: true,
      onSuccess(data) {
        dispatch({
          type: 'SET_ROWS_COUNT',
          payload: data.count,
        })
      },
    }
  )

  const count = data?.is_estimate ? formatEstimatedCount(data.count) : data?.count.toLocaleString()
  const maxPages = Math.ceil((data?.count ?? 0) / snap.rowsPerPage)
  const totalPages = (data?.count ?? 0) > 0 ? maxPages : 1

  const onPreviousPage = () => {
    if (page > 1) {
      if (state.selectedRows.size >= 1) {
        setIsConfirmPreviousModalOpen(true)
      } else {
        goToPreviousPage()
      }
    }
  }

  const onConfirmPreviousPage = () => {
    goToPreviousPage()
    dispatch({
      type: 'SELECTED_ROWS_CHANGE',
      payload: { selectedRows: new Set() },
    })
  }

  const onNextPage = () => {
    if (page < maxPages) {
      if (state.selectedRows.size >= 1) {
        setIsConfirmNextModalOpen(true)
      } else {
        goToNextPage()
      }
    }
  }

  const onConfirmNextPage = () => {
    goToNextPage()
    dispatch({
      type: 'SELECTED_ROWS_CHANGE',
      payload: { selectedRows: new Set() },
    })
  }

  const goToPreviousPage = () => {
    const previousPage = page - 1
    snap.setPage(previousPage)
  }

  const goToNextPage = () => {
    const nextPage = page + 1
    snap.setPage(nextPage)
  }

  const onPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    const pageNum = Number(value) > maxPages ? maxPages : Number(value)
    snap.setPage(pageNum || 1)
  }

  const onRowsPerPageChange = (value: string | number) => {
    const rowsPerPage = Number(value)
    snap.setRowsPerPage(isNaN(rowsPerPage) ? 100 : rowsPerPage)
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
            <div className="w-12">
              <InputNumber
                size="tiny"
                value={page}
                onChange={onPageChange}
                style={{ width: '3rem' }}
                min={1}
                max={maxPages}
              />
            </div>

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
                <span>{`${snap.rowsPerPage} 条/页`}</span>
              </Button>
            </DropdownControl>
          </div>

          <div className="flex items-center gap-x-2">
            <p className="text-xs text-foreground-light">
              {`${count} ${data.count === 0 || data.count > 1 ? `记录` : '记录'}`}{' '}
              {data.is_estimate ? '（估计）' : ''}
            </p>

            {data.is_estimate && (
              <Tooltip_Shadcn_>
                <TooltipTrigger_Shadcn_ asChild>
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
                </TooltipTrigger_Shadcn_>
                <TooltipContent_Shadcn_ side="top" className="w-72">
                  由于您的这张表超过{' '}
                  {THRESHOLD_COUNT.toLocaleString()} 行，这是一个估计的行数。 <br />
                  <span className="text-brand">
                    点击获取表精确的行数。
                  </span>
                </TooltipContent_Shadcn_>
              </Tooltip_Shadcn_>
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
        title="确定前往上一页"
        confirmLabel="确定"
        onCancel={() => setIsConfirmPreviousModalOpen(false)}
        onConfirm={() => {
          onConfirmPreviousPage()
        }}
      >
        <p className="text-sm text-foreground-light">
          您当前选中的行会被取消选中，是否继续？
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        visible={isConfirmNextModalOpen}
        title="确定前往下一页"
        confirmLabel="确定"
        onCancel={() => setIsConfirmNextModalOpen(false)}
        onConfirm={() => {
          onConfirmNextPage()
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
