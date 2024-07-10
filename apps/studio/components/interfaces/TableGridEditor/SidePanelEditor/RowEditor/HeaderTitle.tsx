interface HeaderTitleProps {
  isNewRecord: boolean
  tableName?: string
}

const HeaderTitle = ({ isNewRecord, tableName }: HeaderTitleProps) => {
  let header = `${isNewRecord ? '添加新行' : '更新行'}`

  return (
    <>
      {tableName && <span className="text-code font-mono">{tableName}</span>}
      {header}
    </>
  )
}

export default HeaderTitle
