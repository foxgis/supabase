import { MAX_CHARACTERS } from '@supabase/pg-meta/src/query/table-row-query'
import { Button, cn } from 'ui'

export const TruncatedWarningOverlay = ({
  isLoading,
  loadFullValue,
}: {
  isLoading: boolean
  loadFullValue: () => void
}) => {
  return (
    <div
      className={cn(
        'absolute top-0 left-0 flex items-center justify-center flex-col gap-y-3',
        'text-xs w-full h-full px-3 text-center',
        'bg-default/80 backdrop-blur-[1.5px]'
      )}
    >
      <div className="flex flex-col gap-y-1">
        <p>值的长度超过了 {MAX_CHARACTERS.toLocaleString()} 个字符</p>
        <p className="text-foreground-light">
          您可以尝试渲染整个值，但您的浏览器可能会遇到性能问题
        </p>
      </div>
      <Button type="default" loading={isLoading} onClick={loadFullValue}>
        加载完整值
      </Button>
    </div>
  )
}
