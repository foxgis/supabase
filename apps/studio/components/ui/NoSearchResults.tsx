import { Button, cn } from 'ui'

export interface NoSearchResultsProps {
  searchString: string
  onResetFilter?: () => void
  className?: string
}

const NoSearchResults = ({ searchString, onResetFilter, className }: NoSearchResultsProps) => {
  return (
    <div
      className={cn(
        'bg-surface-100 border border-default px-6 py-4 rounded flex items-center justify-between',
        className
      )}
    >
      <div className="space-y-1">
        <p className="text-sm text-foreground">为查找到结果</p>
        <p className="text-sm text-foreground-light">
          您查找的“{searchString}”没有返回任何结果
        </p>
      </div>
      {onResetFilter !== undefined && (
        <Button type="default" onClick={() => onResetFilter()}>
          重置查找条件
        </Button>
      )}
    </div>
  )
}

export default NoSearchResults
