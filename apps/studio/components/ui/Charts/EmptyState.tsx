import { BarChart2 } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  message?: string
}

const EmptyState = ({
  title = '无可展示的数据',
  message = '可等待 24 小时后生成供展示的数据',
}: EmptyStateProps) => (
  <div
    className="
      flex h-full
      w-full flex-col items-center
      justify-center space-y-2 border
      border-dashed border-control py-4 text-center
    "
  >
    <BarChart2 size={20} className="text-foreground-light" />
    <div>
      <p className="text-xs text-foreground-light">{title}</p>
      <p className="text-xs text-foreground-light">{message}</p>
    </div>
  </div>
)

export default EmptyState
