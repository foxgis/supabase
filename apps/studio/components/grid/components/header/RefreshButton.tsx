import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'

import { useParams } from 'common'
import { tableRowKeys } from 'data/table-rows/keys'
import { Button } from 'ui'

export type RefreshButtonProps = {
  tableId?: number
  isRefetching?: boolean
}

const RefreshButton = ({ tableId, isRefetching }: RefreshButtonProps) => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const queryKey = tableRowKeys.tableRowsAndCount(ref, tableId)

  async function onClick() {
    await queryClient.invalidateQueries(queryKey)
  }

  return (
    <Button
      type="text"
      loading={isRefetching}
      icon={<RefreshCw className="text-foreground-muted" strokeWidth={1.5} />}
      onClick={() => onClick()}
    >
      刷新
    </Button>
  )
}
export default RefreshButton
