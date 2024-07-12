import type { PostgresTable, PostgresColumn } from '@supabase/postgres-meta'

interface Props {
  table: PostgresTable
  column: PostgresColumn
}

// Need to fix for new column later
const HeaderTitle: React.FC<Props> = ({ table, column }) => {
  if (!column) {
    return (
      <>
        向 <code>{table.name}</code> 添加列
      </>
    )
  }
  return (
    <>
      更新表 <code>{column.table}</code> 的 <code>{column.name}</code> 列
    </>
  )
}

export default HeaderTitle
