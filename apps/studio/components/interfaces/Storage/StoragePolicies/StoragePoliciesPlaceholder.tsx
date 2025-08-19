import { CardContent, Card } from 'ui'

const StoragePoliciesPlaceholder = () => (
  <Card>
    <CardContent>
      <p className="text-sm text-foreground-light">
        请先创建一个存储桶再开始编写访问策略！
      </p>
    </CardContent>
  </Card>
)

export default StoragePoliciesPlaceholder
