import { noop } from 'lodash'

import Table from 'components/to-be-cleaned/Table'
import HookList from './HookList'

interface SchemaTableProps {
  schema: string
  filterString: string
  editHook: (hook: any) => void
  deleteHook: (hook: any) => void
}

const SchemaTable = ({
  schema,
  filterString,
  editHook = noop,
  deleteHook = noop,
}: SchemaTableProps) => {
  return (
    <div key={schema}>
      <div className="sticky top-0 backdrop-blur backdrop-filter">
        <div className="flex items-baseline space-x-1 py-2">
          <h5 className="text-foreground-light">模式</h5>
          <h4>{schema}</h4>
        </div>
      </div>
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
          <HookList
            filterString={filterString}
            schema={schema}
            editHook={editHook}
            deleteHook={deleteHook}
          />
        }
      />
    </div>
  )
}

export default SchemaTable
