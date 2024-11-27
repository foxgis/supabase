import type { PostgresPolicy } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import Panel from 'components/ui/Panel'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Edit, MoreVertical, Trash } from 'lucide-react'
import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import { useIsAssistantV2Enabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useAppStateSnapshot } from 'state/app-state'
import { generatePolicyCreateSQL } from './PolicyTableRow.utils'

interface PolicyRowProps {
  policy: PostgresPolicy
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onSelectDeletePolicy: (policy: PostgresPolicy) => void
  isLocked: boolean
}

const PolicyRow = ({
  policy,
  isLocked: isLockedDefault,
  onSelectEditPolicy = noop,
  onSelectDeletePolicy = noop,
}: PolicyRowProps) => {
  const { setAiAssistantPanel } = useAppStateSnapshot()
  const isAssistantV2Enabled = useIsAssistantV2Enabled()
  const canUpdatePolicies = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'policies')

  const { project } = useProjectContext()
  const { data: authConfig } = useAuthConfigQuery({ projectRef: project?.ref })

  // override islocked for Realtime messages table
  const isLocked =
    policy.schema === 'realtime' && policy.table === 'messages' ? false : isLockedDefault

  // TODO(km): Simple check for roles that allow authenticated access.
  // In the future, we'll use splinter to return proper warnings for policies that allow anonymous user access.
  const appliesToAnonymousUsers =
    authConfig?.EXTERNAL_ANONYMOUS_USERS_ENABLED &&
    (policy.roles.includes('authenticated') || policy.roles.includes('public'))

  return (
    <Panel.Content
      className={cn(
        'flex border-overlay',
        'w-full last:border-0 space-x-4 border-b py-4 lg:items-center'
      )}
    >
      <div className="flex grow flex-col gap-y-1">
        <div className="flex items-start gap-x-4">
          <p className="font-mono text-xs text-foreground-light translate-y-[2px] min-w-12">
            {policy.command}
          </p>

          <div className="flex flex-col gap-y-1">
            <p className="text-sm text-foreground">{policy.name}</p>
            <div className="flex items-center gap-x-1">
              <div className="text-foreground-lighter text-sm">
                应用于：
                {policy.roles.slice(0, 3).map((role, i) => (
                  <code key={`policy-${role}-${i}`} className="text-foreground-light text-xs">
                    {role}
                  </code>
                ))}{' '}
                角色
              </div>
              {policy.roles.length > 3 && (
                <Tooltip_Shadcn_>
                  <TooltipTrigger_Shadcn_ asChild>
                    <code key="policy-etc" className="text-foreground-light text-xs">
                      和其他 {policy.roles.length - 3} 个角色
                    </code>
                  </TooltipTrigger_Shadcn_>
                  <TooltipContent_Shadcn_ side="bottom" align="center">
                    {policy.roles.slice(3).join('，')}
                  </TooltipContent_Shadcn_>
                </Tooltip_Shadcn_>
              )}
            </div>
          </div>

          {appliesToAnonymousUsers ? (
            <Badge color="yellow">应用于匿名用户</Badge>
          ) : null}
        </div>
      </div>
      <div>
        {!isLocked && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="default" className="px-1.5" icon={<MoreVertical />} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="bottom"
              align="end"
              className={cn(isAssistantV2Enabled ? 'w-52' : 'w-40')}
            >
              <DropdownMenuItem className="gap-x-2" onClick={() => onSelectEditPolicy(policy)}>
                <Edit size={14} />
                <p>编辑策略</p>
              </DropdownMenuItem>
              {isAssistantV2Enabled && (
                <DropdownMenuItem
                  className="space-x-2"
                  onClick={() => {
                    const sql = generatePolicyCreateSQL(policy)
                    setAiAssistantPanel({
                      open: true,
                      sqlSnippets: [sql],
                      initialInput: `Update the policy with name "${policy.name}" in the ${policy.schema} schema on the ${policy.table} table. It should...`,
                      suggestions: {
                        title: `I can help you make a change to the policy "${policy.name}" in the ${policy.schema} schema on the ${policy.table} table, here are a few example prompts to get you started:`,
                        prompts: [
                          'Tell me how I can improve this policy...',
                          'Duplicate this policy for another table...',
                          'Add extra conditions to this policy...',
                        ],
                      },
                    })
                  }}
                >
                  <Edit size={14} />
                  <p>使用 AI 编辑策略</p>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItemTooltip
                className="gap-x-2"
                disabled={!canUpdatePolicies}
                onClick={() => onSelectDeletePolicy(policy)}
                tooltip={{
                  content: {
                    side: 'left',
                    text: '您需要额外的权限才能删除策略',
                  },
                }}
              >
                <Trash size={14} />
                <p>删除策略</p>
              </DropdownMenuItemTooltip>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Panel.Content>
  )
}

export default PolicyRow
