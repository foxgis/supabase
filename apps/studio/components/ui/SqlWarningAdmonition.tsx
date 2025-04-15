import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

export interface SqlWarningAdmonitionProps {
  warningType: 'hasWriteOperation' | 'hasUnknownFunctions'
  onCancel: () => void
  onConfirm: () => void
  disabled?: boolean
  className?: string
}

const SqlWarningAdmonition = ({
  warningType,
  onCancel,
  onConfirm,
  disabled = false,
  className,
}: SqlWarningAdmonitionProps) => {
  return (
    <Admonition
      type="warning"
      className={`mb-0 rounded-none border-0 shrink-0 bg-background-100 ${className}`}
    >
      <p className="text-xs !mb-1">
        {warningType === 'hasWriteOperation'
          ? '查询包含写操作，'
          : '查询需要执行函数，'}{' '}
        您确定想要执行吗？
      </p>
      <p className="text-foreground-light text-xs">
        请确保不会误删重要数据。
      </p>
      <div className="flex justify-stretch mt-2 gap-2">
        <Button type="outline" size="tiny" className="w-full flex-1" onClick={onCancel}>
          取消
        </Button>
        <Button
          type="danger"
          size="tiny"
          disabled={disabled}
          className="w-full flex-1"
          onClick={onConfirm}
        >
          执行
        </Button>
      </div>
    </Admonition>
  )
}

export default SqlWarningAdmonition
