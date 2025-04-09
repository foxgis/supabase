import Link from 'next/link'

import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { Button, Modal } from 'ui'
import { TIER_QUERY_LIMITS } from './Logs.constants'

interface Props {
  show: boolean
  setShowUpgradePrompt: (value: boolean) => void
}

const UpgradePrompt: React.FC<Props> = ({ show, setShowUpgradePrompt }) => {
  const organization = useSelectedOrganization()

  return (
    <Modal
      hideFooter
      visible={show}
      size="medium"
      header="Log retention"
      onCancel={() => setShowUpgradePrompt(false)}
    >
      <Modal.Content>
        <div className="space-y-4">
          <p className="text-sm">
            取决于您的项目所在的订阅方案，日志可以保留长达 3 个月的时间。
          </p>
          <div className="border-control bg-surface-300 rounded border">
            <div className="flex items-center px-4 pt-2 pb-1">
              <p className="text-foreground-light w-[40%] text-sm">方案</p>
              <p className="text-foreground-light w-[60%] text-sm">保留时长</p>
            </div>
            <div className="py-1">
              <div className="flex items-center px-4 py-1">
                <p className="w-[40%] text-sm">免费版</p>
                <p className="w-[60%] text-sm">{TIER_QUERY_LIMITS.FREE.text}</p>
              </div>
              <div className="flex items-center px-4 py-1">
                <p className="w-[40%] text-sm">专业版</p>
                <p className="w-[60%] text-sm">{TIER_QUERY_LIMITS.PRO.text}</p>
              </div>
              <div className="flex items-center px-4 py-1">
                <p className="w-[40%] text-sm">团队版</p>
                <p className="w-[60%] text-sm">{TIER_QUERY_LIMITS.TEAM.text}</p>
              </div>
              <div className="flex items-center px-4 py-1">
                <p className="w-[40%] text-sm">企业版</p>
                <p className="w-[60%] text-sm">{TIER_QUERY_LIMITS.ENTERPRISE.text}</p>
              </div>
            </div>
          </div>
        </div>
      </Modal.Content>
      <Modal.Separator />
      <Modal.Content className="flex justify-end gap-3">
        <Button type="default" onClick={() => setShowUpgradePrompt(false)}>
          关闭
        </Button>
        <Button asChild size="tiny">
          <Link
            href={`/org/${organization?.slug}/billing?panel=subscriptionPlan&source=logsRetentionUpgradePrompt`}
          >
            升级
          </Link>
        </Button>
      </Modal.Content>
    </Modal>
  )
}

export default UpgradePrompt
