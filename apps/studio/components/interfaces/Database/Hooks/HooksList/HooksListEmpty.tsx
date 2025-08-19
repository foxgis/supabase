import Table from 'components/to-be-cleaned/Table'

export const HooksListEmpty = () => {
  return (
    <Table
      className="table-fixed"
      head={
        <>
          <Table.th key="name" className="w-[20%]">
            <p className="translate-x-[36px]">名称</p>
          </Table.th>
          <Table.th key="table" className="w-[15%] hidden lg:table-cell">
            数据表
          </Table.th>
          <Table.th key="events" className="w-[24%] hidden xl:table-cell">
            事件
          </Table.th>
          <Table.th key="webhook" className="hidden xl:table-cell">
            Webhook
          </Table.th>
          <Table.th key="buttons" className="w-[5%]"></Table.th>
        </>
      }
      body={
        <Table.tr>
          <Table.td colSpan={5}>
            <p className="text-sm text-foreground">还未创建任何 webhook</p>
            <p className="text-sm text-foreground-light">
              点击“新建 webhook”创建一个新的 webhook
            </p>
          </Table.td>
        </Table.tr>
      }
    />
  )
}
