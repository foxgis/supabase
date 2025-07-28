import SqlEditor from 'components/ui/SqlEditor'
import { useState } from 'react'
import { Button, Modal } from 'ui'

const ReviewEmptyState = () => {
  return (
    <div className="my-10 flex items-center justify-center space-x-2 opacity-50">
      <p>对此策略没有任何更改</p>
    </div>
  )
}

interface StoragePoliciesReviewProps {
  policyStatements: any[]
  onSelectBack: any
  onSelectSave: any
}

const StoragePoliciesReview = ({
  policyStatements = [],
  onSelectBack = () => {},
  onSelectSave = () => {},
}: StoragePoliciesReviewProps) => {
  const [isSaving, setIsSaving] = useState(false)
  const onSavePolicy = () => {
    setIsSaving(true)
    onSelectSave()
  }

  return (
    <>
      <Modal.Content className="space-y-6">
        <div className="flex items-center justify-between space-y-8 space-x-4">
          <div className="flex flex-col">
            <p className="text-sm text-foreground-light">
              这些是将用于创建您的策略的 SQL 语句。在您的策略名称末尾附加的后缀（<code>[哈希字符串]_[数字]</code>），
              只是用于为您的每条策略生成一个唯一标识符。
            </p>
          </div>
        </div>
        <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '25rem' }}>
          {policyStatements.length === 0 && <ReviewEmptyState />}
          {policyStatements.map((policy, idx) => {
            let formattedSQLStatement = policy.statement || ''
            return (
              <div key={`policy_${idx}`} className="space-y-2">
                <span>{policy.description}</span>
                <div className="h-40">
                  <SqlEditor readOnly defaultValue={formattedSQLStatement} />
                </div>
              </div>
            )
          })}
        </div>
      </Modal.Content>
      <Modal.Separator />
      <Modal.Content className="flex w-full items-center justify-end gap-2">
        <Button type="default" onClick={onSelectBack}>
          返回编辑
        </Button>
        {policyStatements.length > 0 && (
          <Button type="primary" onClick={onSavePolicy} loading={isSaving}>
            保存策略
          </Button>
        )}
      </Modal.Content>
    </>
  )
}

export default StoragePoliciesReview
