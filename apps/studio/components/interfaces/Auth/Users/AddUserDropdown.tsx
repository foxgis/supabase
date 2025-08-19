import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronDown, Mail, UserPlus } from 'lucide-react'
import { useState } from 'react'

import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import CreateUserModal from './CreateUserModal'
import InviteUserModal from './InviteUserModal'

const AddUserDropdown = () => {
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
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuItem
                className="space-x-2 !pointer-events-auto"
                disabled={!canInviteUsers}
                onClick={() => {
                  if (canInviteUsers) setInviteVisible(true)
                }}
              >
                <Mail size={14} />
                <p>发送邀请</p>
              </DropdownMenuItem>
            </TooltipTrigger>
            {!canInviteUsers && (
              <TooltipContent side="left">
                您需要额外的权限才能邀请用户
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuItem
                className="space-x-2 !pointer-events-auto"
                disabled={!canCreateUsers}
                onClick={() => {
                  if (canCreateUsers) setCreateVisible(true)
                }}
              >
                <UserPlus size={14} />
                <p>创建新用户</p>
              </DropdownMenuItem>
            </TooltipTrigger>
            {!canCreateUsers && (
              <TooltipContent side="left">
                您需要额外的权限才能创建用户
              </TooltipContent>
            )}
          </Tooltip>
        </DropdownMenuContent>
      </DropdownMenu>

      <InviteUserModal visible={inviteVisible} setVisible={setInviteVisible} />
      <CreateUserModal visible={createVisible} setVisible={setCreateVisible} />
    </>
  )
}

export default AddUserDropdown
