import { Loader, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from 'ui'

export interface PaginationProps {
  page: number
  setPage: (setter: (prev: number) => number) => void
  rowsPerPage: number
  currentPageRowsCount?: number
  isLoading?: boolean
}

const Pagination = ({
  page,
  setPage,
  rowsPerPage,
  currentPageRowsCount = 0,
  isLoading = false,
}: PaginationProps) => {
  const onPreviousPage = () => {
    setPage((prev) => prev - 1)
  }

  const onNextPage = () => {
    setPage((prev) => prev + 1)
  }

  const hasRunOutOfRows = currentPageRowsCount < rowsPerPage

  return (
    <div className="flex items-center gap-2">
      {isLoading && <Loader size={14} className="animate-spin" />}

      <Button
        icon={<ArrowLeft />}
        type="outline"
        disabled={page <= 1 || isLoading}
        onClick={onPreviousPage}
        title="上一页"
        style={{ padding: '3px 10px' }}
      />

      <Button
        icon={<ArrowRight />}
        type="outline"
        disabled={hasRunOutOfRows || isLoading}
        onClick={onNextPage}
        title="下一页"
        style={{ padding: '3px 10px' }}
      />
    </div>
  )
}

export default Pagination
