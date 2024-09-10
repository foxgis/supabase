import Panel from 'components/ui/Panel'
import { Archive } from 'lucide-react'

const StoragePoliciesPlaceholder = () => (
  <Panel
    title={[
      <div key="storagePlaceholder" className="flex w-full items-center justify-between">
        <div className="flex items-center space-x-4">
          <Archive size="18" />
          <h4>存储桶策略</h4>
        </div>
      </div>,
    ]}
  >
    <div className="p-4 px-6">
      <p className="text-sm text-foreground-light">
        请先创建一个存储桶再开始编写策略！
      </p>
    </div>
  </Panel>
)

export default StoragePoliciesPlaceholder
