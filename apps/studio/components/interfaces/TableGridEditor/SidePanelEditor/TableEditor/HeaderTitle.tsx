interface HeaderTitleProps {
  schema: string
  table?: { name: string }
  isDuplicating: boolean
}

const HeaderTitle = ({ schema, table, isDuplicating }: HeaderTitleProps) => {
  if (!table) {
    return (
      <>
        在<code className="text-sm">{schema}</code>模式下创建表
      </>
    )
  }
  if (isDuplicating) {
    return (
      <>
        复制表<code className="text-sm">{table?.name}</code>
      </>
    )
  }
  return (
    <>
      更新表<code className="text-sm">{table?.name}</code>
    </>
  )
}

export default HeaderTitle
