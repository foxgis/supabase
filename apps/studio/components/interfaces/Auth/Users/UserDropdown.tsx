import { Mail, MoreHorizontal, ShieldOff, Trash, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useUserDeleteMFAFactorsMutation } from 'data/auth/user-delete-mfa-factors-mutation'
import { useUserDeleteMutation } from 'data/auth/user-delete-mutation'
import { useUserResetPasswordMutation } from 'data/auth/user-reset-password-mutation'
import { useUserSendMagicLinkMutation } from 'data/auth/user-send-magic-link-mutation'
import { useUserSendOTPMutation } from 'data/auth/user-send-otp-mutation'
import type { User } from 'data/auth/users-infinite-query'
import { timeout } from 'lib/helpers'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface UserDropdownProps {
  user: User
  permissions: {
    canRemoveUser: boolean
    canRemoveMFAFactors: boolean
    canSendMagicLink: boolean
    canSendRecovery: boolean
    canSendOtp: boolean
  }
  setSelectedUser: (user: User) => void
  setUserSidePanelOpen: (open: boolean) => void
}

const UserDropdown = ({
  user,
  permissions,
  setSelectedUser,
  setUserSidePanelOpen,
}: UserDropdownProps) => {
  const { ref } = useParams()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleteFactorsModalOpen, setIsDeleteFactorsModalOpen] = useState(false)

  const { canRemoveUser, canRemoveMFAFactors, canSendMagicLink, canSendRecovery, canSendOtp } =
    permissions

  const { mutate: resetPassword, isLoading: isResetting } = useUserResetPasswordMutation({
    onSuccess: () => {
      toast.success(`向 ${user.email} 发送密码重置邮件`)
    },
  })
  const { mutate: sendMagicLink, isLoading: isSendingLink } = useUserSendMagicLinkMutation({
    onSuccess: () => {
      toast.success(`向 ${user.email} 发送登录链接`)
    },
  })
  const { mutate: sendOTP, isLoading: isSendingOTP } = useUserSendOTPMutation({
    onSuccess: () => {
      toast.success(`向 ${user.phone} 发送验证码`)
    },
  })
  const { mutate: deleteUser, isLoading: isDeleting } = useUserDeleteMutation({
    onSuccess: () => {
      toast.success(`成功删除了 ${user.email}`)
      setIsDeleteModalOpen(false)
    },
  })
  const { mutate: deleteUserMFAFactors, isLoading: isDeletingFactors } =
    useUserDeleteMFAFactorsMutation({
      onSuccess: () => {
        toast.success("成功删除了用户的认证方式")
        setIsDeleteFactorsModalOpen(false)
      },
    })

  const isLoading = isResetting || isSendingLink || isSendingOTP || isDeleting || isDeletingFactors

  const handleResetPassword = async () => {
    if (!ref) return console.error('未找到项目号')
    resetPassword({ projectRef: ref, user })
  }

  async function handleSendMagicLink() {
    if (!ref) return console.error('未找到项目号')
    sendMagicLink({ projectRef: ref, user })
  }

  async function handleSendOtp() {
    if (!ref) return console.error('未找到项目号')
    sendOTP({ projectRef: ref, user })
  }

  async function handleDelete() {
    await timeout(200)
    if (!ref) return console.error('未找到项目号')
    if (!user.id) return console.error('未找到用户 ID')
    deleteUser({ projectRef: ref, userId: user.id })
  }

  async function handleDeleteFactors() {
    await timeout(200)
    if (!ref) return console.error('未找到项目号')
    if (!user.id) return console.error('未找到用户 ID')
    deleteUserMFAFactors({ projectRef: ref, userId: user.id })
  }

  const handleViewUserInfo = () => {
    setSelectedUser(user)
    setUserSidePanelOpen(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="text" loading={isLoading} className="px-1.5" icon={<MoreHorizontal />} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <>
            <DropdownMenuItem className="space-x-2" onClick={handleViewUserInfo}>
              <UserIcon size={14} />
              <p>查看用户信息</p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.email !== null ? (
              <>
                <Tooltip_Shadcn_>
                  <TooltipTrigger_Shadcn_ asChild>
                    <DropdownMenuItem
                      className="space-x-2 !pointer-events-auto"
                      disabled={!canSendRecovery}
                      onClick={() => {
                        if (canSendRecovery) handleResetPassword()
                      }}
                    >
                      <Mail size={14} />
                      <p>发送密码重置</p>
                    </DropdownMenuItem>
                  </TooltipTrigger_Shadcn_>
                  {!canSendRecovery && (
                    <TooltipContent_Shadcn_ side="left">
                      您需要额外的权限才能发送密码重置。
                    </TooltipContent_Shadcn_>
                  )}
                </Tooltip_Shadcn_>
                <Tooltip_Shadcn_>
                  <TooltipTrigger_Shadcn_ asChild>
                    <DropdownMenuItem
                      disabled={!canSendMagicLink}
                      className="space-x-2 !pointer-events-auto"
                      onClick={() => {
                        if (canSendMagicLink) handleSendMagicLink()
                      }}
                    >
                      <Mail size={14} />
                      <p>发送登录链接</p>
                    </DropdownMenuItem>
                  </TooltipTrigger_Shadcn_>
                  {!canSendMagicLink && (
                    <TooltipContent_Shadcn_ side="left">
                      您需要额外的权限才能发送登录链接
                    </TooltipContent_Shadcn_>
                  )}
                </Tooltip_Shadcn_>
              </>
            ) : null}
            {user.phone !== null ? (
              <Tooltip_Shadcn_>
                <TooltipTrigger_Shadcn_ asChild>
                  <DropdownMenuItem
                    disabled={!canSendOtp}
                    className="space-x-2 !pointer-events-auto"
                    onClick={() => {
                      if (canSendOtp) handleSendOtp()
                    }}
                  >
                    <Mail size={14} />
                    <p>发送验证码</p>
                  </DropdownMenuItem>
                </TooltipTrigger_Shadcn_>
                {!canSendOtp && (
                  <TooltipContent_Shadcn_ side="left">
                    您需要额外的权限才能发送验证码
                  </TooltipContent_Shadcn_>
                )}
              </Tooltip_Shadcn_>
            ) : null}
            <DropdownMenuSeparator />

            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <DropdownMenuItem
                  onClick={() => {
                    if (canRemoveMFAFactors) setIsDeleteFactorsModalOpen(true)
                  }}
                  disabled={!canRemoveMFAFactors}
                  className="space-x-2 !pointer-events-auto"
                >
                  <ShieldOff size={14} />
                  <p>移除 MFA 认证方式</p>
                </DropdownMenuItem>
              </TooltipTrigger_Shadcn_>
              {!canRemoveMFAFactors && (
                <TooltipContent_Shadcn_ side="left">
                  您需要额外的权限才能移除用户的认证方式
                </TooltipContent_Shadcn_>
              )}
            </Tooltip_Shadcn_>

            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <DropdownMenuItem
                  disabled={!canRemoveUser}
                  onClick={() => {
                    if (canRemoveUser) setIsDeleteModalOpen(true)
                  }}
                  className="space-x-2 !pointer-events-auto"
                >
                  <Trash size={14} />
                  <p>删除用户</p>
                </DropdownMenuItem>
              </TooltipTrigger_Shadcn_>
              {!canRemoveUser && (
                <TooltipContent_Shadcn_ side="left">
                  您需要额外的权限才能删除用户
                </TooltipContent_Shadcn_>
              )}
            </Tooltip_Shadcn_>
          </>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationModal
        visible={isDeleteModalOpen}
        title="确认删除"
        confirmLabel="删除"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          handleDelete()
        }}
      >
        <p className="text-sm text-foreground-light">
          这将是永久的！您确定要删除用户 {user.email}?
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        visible={isDeleteFactorsModalOpen}
        title="确认删除"
        confirmLabel="删除"
        onCancel={() => setIsDeleteFactorsModalOpen(false)}
        onConfirm={() => {
          handleDeleteFactors()
        }}
      >
        <p className="text-sm text-foreground-light">
          这将是永久的！您确定要删除用户的 MFA 认证方式？
        </p>
      </ConfirmationModal>
    </>
  )
}

export default UserDropdown
