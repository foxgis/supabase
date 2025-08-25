import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronDown, Mail, UserPlus } from 'lucide-react'
import { useState } from 'react'

import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from 'ui'
import CreateUserModal from './CreateUserModal'
import InviteUserModal from './InviteUserModal'

export const AddUserDropdown = () => {
  const showSendInvitation = useIsFeatureEnabled('authentication:show_send_invitation')

  const { can: canInviteUsers } = useAsyncCheckProjectPermissions(
    PermissionAction.AUTH_EXECUTE,
    'invite_user'
  )
  const { can: canCreateUsers } = useAsyncCheckProjectPermissions(
    PermissionAction.AUTH_EXECUTE,
    'create_user'
  )

  const [inviteVisible, setInviteVisible] = useState(false)
  const [createVisible, setCreateVisible] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="primary" iconRight={<ChevronDown size={14} strokeWidth={1.5} />}>
            添加用户
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" className="w-40">
          {showSendInvitation && (
            <DropdownMenuItemTooltip
              className="gap-x-2"
              disabled={!canInviteUsers}
              onClick={() => {
                if (canInviteUsers) setInviteVisible(true)
              }}
              tooltip={{
                content: { side: 'left', text: '您需要额外的权限才能邀请用户' },
              }}
            >
              <Mail size={14} />
              <p>发送邀请</p>
            </DropdownMenuItemTooltip>
          )}

          <DropdownMenuItemTooltip
            className="space-x-2 !pointer-events-auto"
            disabled={!canCreateUsers}
            onClick={() => {
              if (canCreateUsers) setCreateVisible(true)
            }}
            tooltip={{
              content: { side: 'left', text: '您需要额外的权限才能创建用户' },
            }}
          >
            <UserPlus size={14} />
            <p>创建用户</p>
          </DropdownMenuItemTooltip>
        </DropdownMenuContent>
      </DropdownMenu>

      <InviteUserModal visible={inviteVisible} setVisible={setInviteVisible} />
      <CreateUserModal visible={createVisible} setVisible={setCreateVisible} />
    </>
  )
}
