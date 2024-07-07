import { Button, cn } from 'ui'
import { Markdown } from '../Markdown'

interface LinterPageFooterProps {
  isLoading: boolean
  isRefetching: boolean
  refetch: () => void
  hideDbInspectCTA?: boolean
}

const LinterPageFooter = ({
  isLoading,
  isRefetching,
  refetch,
  hideDbInspectCTA,
}: LinterPageFooterProps) => {
  return (
    <div className="px-6 py-6 flex gap-x-4 border-t ">
      <div
        className={cn(hideDbInspectCTA ? 'w-[35%]' : 'w-[33%]', 'flex flex-col gap-y-1 text-sm')}
      >
        <p>重置优化建议</p>
        <p className="text-xs text-foreground-light">
          在做出更改后建议重置分析
        </p>

        <Button
          type="default"
          className="!mt-3 w-min"
          disabled={isLoading || isRefetching}
          loading={isLoading || isRefetching}
          onClick={() => refetch()}
        >
          重新运行检查器
        </Button>
      </div>

      <div
        className={cn(hideDbInspectCTA ? 'w-[35%]' : 'w-[33%]', 'flex flex-col gap-y-1 text-sm')}
      >
        <p>这些建议是如何生成的？</p>
        <Markdown
          className="text-xs"
          content="这些建议使用[splinter (Supabase Postgres LINTER)](https://github.com/supabase/splinter)生成。"
        />
      </div>

      {!hideDbInspectCTA && (
        <div className="w-[33%] flex flex-col gap-y-1 text-sm">
          <p>检查您的数据库以查找潜在问题</p>
          <Markdown
            className="text-xs"
            content="Supabase CLI 提供了一系列工具，可帮助您检查 Postgres 实例中的潜在问题。[从这里了解更多](https://supabase.com/docs/guides/database/inspect)."
          />
        </div>
      )}
    </div>
  )
}

export default LinterPageFooter
