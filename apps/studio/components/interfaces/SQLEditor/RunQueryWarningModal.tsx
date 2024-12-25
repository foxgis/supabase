import { Separator } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface RunQueryWarningModalProps {
  visible: boolean
  hasDestructiveOperations: boolean
  hasUpdateWithoutWhere: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const RunQueryWarningModal = ({
  visible,
  hasDestructiveOperations,
  hasUpdateWithoutWhere,
  onCancel,
  onConfirm,
}: RunQueryWarningModalProps) => {
  return (
    <ConfirmationModal
      visible={visible}
      size="large"
      title={`在您的查询语句中检测到潜在的危险操作${hasDestructiveOperations && hasUpdateWithoutWhere ? '' : ''}`}
      confirmLabel="执行此查询"
      variant="warning"
      alert={{
        base: {
          variant: 'warning',
        },
        title:
          hasDestructiveOperations && hasUpdateWithoutWhere
            ? '检测到以下潜在的危险操作：'
            : '检测到以下潜在的危险操作：',
        description: '执行此查询前请确认您是有意执行这些操作的',
      }}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <div className="text-sm">
        <ul className="border rounded-md grid bg-surface-200">
          {hasDestructiveOperations && (
            <li className="grid pt-3 pb-2 px-4">
              <span className="font-bold">具有破坏性操作的查询</span>
              <span className="text-foreground-lighter">
                请确认不会意外删除任何重要内容。
              </span>
            </li>
          )}
          {hasDestructiveOperations && hasUpdateWithoutWhere && <Separator />}
          {hasUpdateWithoutWhere && (
            <li className="grid pt-2 pb-3 px-4 gap-1">
              <span className="font-bold">Update 操作未指定 where 子句</span>
              <span className="text-foreground-lighter">
                不指定 <code className="text-xs">where</code> 子句，此操作将更新表中所有行。
              </span>
            </li>
          )}
        </ul>
      </div>
      <p className="mt-4 text-sm text-foreground-light">
        请确认您确实要执行此查询。
      </p>
    </ConfirmationModal>
  )
}
