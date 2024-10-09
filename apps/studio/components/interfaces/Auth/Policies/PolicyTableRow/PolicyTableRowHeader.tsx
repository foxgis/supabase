import type { PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { noop } from 'lodash'
import { Lock, Unlock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useQueryState } from 'nuqs'
import {
  AiIconAnimation,
  Badge,
  Button,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'

interface PolicyTableRowHeaderProps {
  table: PostgresTable
  isLocked: boolean
  onSelectToggleRLS: (table: PostgresTable) => void
  onSelectCreatePolicy: () => void
}

const PolicyTableRowHeader = ({
  table,
  isLocked,
  onSelectToggleRLS = noop,
  onSelectCreatePolicy,
}: PolicyTableRowHeaderProps) => {
  const router = useRouter()
  const { ref } = router.query

  const canToggleRLS = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  const isRealtimeSchema = table.schema === 'realtime'
  const isRealtimeMessagesTable = isRealtimeSchema && table.name === 'messages'
  const isTableLocked = isRealtimeSchema ? !isRealtimeMessagesTable : isLocked
  const [_, setEditView] = useQueryState('view', { defaultValue: '' })

  return (
    <div id={table.id.toString()} className="flex w-full items-center justify-between">
      <div className="flex gap-x-4 text-left">
        <Link href={`/project/${ref}/editor/${table.id}`} className="flex items-center gap-x-2">
          {table.rls_enabled ? (
            <div className="flex items-center gap-x-1 text-xs">
              <Lock size={14} strokeWidth={2} className="text-brand" />
            </div>
          ) : (
            <div className="flex items-center gap-x-1 text-xs">
              <Unlock size={14} strokeWidth={2} className="text-warning-600" />
            </div>
          )}
          <h4 className="m-0">{table.name}</h4>
        </Link>
        <div className="flex items-center gap-x-2">
          {isTableLocked && (
            <Badge>
              <span className="flex gap-2 items-center text-xs uppercase text-foreground-lighter">
                <Lock size={12} /> 被锁定
              </span>
            </Badge>
          )}
        </div>
      </div>
      {!isTableLocked && (
        <div className="flex-1">
          <div className="flex flex-row justify-end gap-x-2">
            {!isRealtimeMessagesTable && (
              <ButtonTooltip
                type="default"
                disabled={!canToggleRLS}
                onClick={() => onSelectToggleRLS(table)}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: '您需要额外的权限才能启停 RLS',
                  },
                }}
              >
                {table.rls_enabled ? '禁用 RLS' : '启用 RLS'}
              </ButtonTooltip>
            )}
            <ButtonTooltip
              type="default"
              disabled={!canToggleRLS}
              onClick={() => onSelectCreatePolicy()}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canToggleRLS
                    ? '您需要额外的权限才能创建 RLS 策略'
                    : undefined,
                },
              }}
            >
              Create policy
            </ButtonTooltip>

            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <Button
                  type="default"
                  className="px-1"
                  onClick={() => {
                    onSelectCreatePolicy()
                    setEditView('conversation')
                  }}
                >
                  <AiIconAnimation className="scale-75 [&>div>div]:border-black dark:[&>div>div]:border-white" />
                </Button>
              </TooltipTrigger_Shadcn_>
              <TooltipContent_Shadcn_ side="top">
                {!canToggleRLS
                  ? '您需要额外的权限才能创建 RLS 策略'
                  : '使用 AI 助手创建'}
              </TooltipContent_Shadcn_>
            </Tooltip_Shadcn_>
          </div>
        </div>
      )}
    </div>
  )
}

export default PolicyTableRowHeader
