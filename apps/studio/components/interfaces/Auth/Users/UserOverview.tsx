import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { Ban, Check, Copy, Mail, ShieldOff, Trash, X } from 'lucide-react'
import Link from 'next/link'
import { ComponentProps, ReactNode, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import CopyButton from 'components/ui/CopyButton'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useUserDeleteMFAFactorsMutation } from 'data/auth/user-delete-mfa-factors-mutation'
import { useUserResetPasswordMutation } from 'data/auth/user-reset-password-mutation'
import { useUserSendMagicLinkMutation } from 'data/auth/user-send-magic-link-mutation'
import { useUserSendOTPMutation } from 'data/auth/user-send-otp-mutation'
import { useUserUpdateMutation } from 'data/auth/user-update-mutation'
import { User } from 'data/auth/users-infinite-query'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { BASE_PATH } from 'lib/constants'
import { timeout } from 'lib/helpers'
import { Button, cn, Separator } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { PROVIDERS_SCHEMAS } from '../AuthProvidersFormValidation'
import { BanUserModal } from './BanUserModal'
import { DeleteUserModal } from './DeleteUserModal'
import { UserHeader } from './UserHeader'
import { PANEL_PADDING } from './Users.constants'
import { providerIconMap } from './Users.utils'

const DATE_FORMAT = 'YYYY/MM/DD HH:mm'
const CONTAINER_CLASS = cn(
  'bg-surface-100 border-default text-foreground flex items-center justify-between',
  'gap-x-4 border px-5 py-4 text-sm first:rounded-tr first:rounded-tl last:rounded-br last:rounded-bl'
)

interface UserOverviewProps {
  user: User
  onDeleteSuccess: () => void
}

export const UserOverview = ({ user, onDeleteSuccess }: UserOverviewProps) => {
  const { ref: projectRef } = useParams()
  const isEmailAuth = user.email !== null
  const isPhoneAuth = user.phone !== null
  const isBanned = user.banned_until !== null

  const providers = ((user.raw_app_meta_data?.providers as string[]) ?? []).map(
    (provider: string) => {
      return {
        name: provider.startsWith('sso') ? 'SAML' : provider,
        icon:
          provider === 'email'
            ? `${BASE_PATH}/img/icons/email-icon2.svg`
            : providerIconMap[provider]
              ? `${BASE_PATH}/img/icons/${providerIconMap[provider]}.svg`
              : undefined,
      }
    }
  )

  const { can: canUpdateUser } = useAsyncCheckProjectPermissions(PermissionAction.AUTH_EXECUTE, '*')
  const { can: canSendMagicLink } = useAsyncCheckProjectPermissions(
    PermissionAction.AUTH_EXECUTE,
    'send_magic_link'
  )
  const { can: canSendRecovery } = useAsyncCheckProjectPermissions(
    PermissionAction.AUTH_EXECUTE,
    'send_recovery'
  )
  const { can: canSendOtp } = useAsyncCheckProjectPermissions(
    PermissionAction.AUTH_EXECUTE,
    'send_otp'
  )
  const { can: canRemoveUser } = useAsyncCheckProjectPermissions(
    PermissionAction.TENANT_SQL_DELETE,
    'auth.users'
  )
  const { can: canRemoveMFAFactors } = useAsyncCheckProjectPermissions(
    PermissionAction.TENANT_SQL_DELETE,
    'auth.mfa_factors'
  )

  const [successAction, setSuccessAction] = useState<
    'send_magic_link' | 'send_recovery' | 'send_otp'
  >()
  const [isBanModalOpen, setIsBanModalOpen] = useState(false)
  const [isUnbanModalOpen, setIsUnbanModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleteFactorsModalOpen, setIsDeleteFactorsModalOpen] = useState(false)

  const { data } = useAuthConfigQuery({ projectRef })

  const mailerOtpExpiry = data?.MAILER_OTP_EXP ?? 0
  const minutes = Math.floor(mailerOtpExpiry / 60)
  const seconds = Math.floor(mailerOtpExpiry % 60)
  const formattedExpiry = `${mailerOtpExpiry > 60 ? `${minutes} 分${minutes > 1 ? '' : ''} ${seconds > 0 ? '' : ''} ` : ''}${seconds > 0 ? `${seconds} 秒${seconds > 1 ? '' : ''}` : ''}`

  const { mutate: resetPassword, isLoading: isResettingPassword } = useUserResetPasswordMutation({
    onSuccess: (_, vars) => {
      setSuccessAction('send_recovery')
      toast.success(`向 ${vars.user.email} 发送密码重置邮件`)
    },
    onError: (err) => {
      toast.error(`发送密码重置邮件失败：${err.message}`)
    },
  })
  const { mutate: sendMagicLink, isLoading: isSendingMagicLink } = useUserSendMagicLinkMutation({
    onSuccess: (_, vars) => {
      setSuccessAction('send_magic_link')
      toast.success(`向 ${vars.user.email} 发送登录链接`)
    },
    onError: (err) => {
      toast.error(`发送登录链接失败：${err.message}`)
    },
  })
  const { mutate: sendOTP, isLoading: isSendingOTP } = useUserSendOTPMutation({
    onSuccess: (_, vars) => {
      setSuccessAction('send_otp')
      toast.success(`向 ${vars.user.phone} 发送验证码`)
    },
    onError: (err) => {
      toast.error(`发送验证码失败：${err.message}`)
    },
  })
  const { mutate: deleteUserMFAFactors } = useUserDeleteMFAFactorsMutation({
    onSuccess: () => {
      toast.success("成功删除了该用户的认证因素")
      setIsDeleteFactorsModalOpen(false)
    },
  })
  const { mutate: updateUser, isLoading: isUpdatingUser } = useUserUpdateMutation({
    onSuccess: () => {
      toast.success('成功解禁了用户')
      setIsUnbanModalOpen(false)
    },
  })

  const handleDeleteFactors = async () => {
    await timeout(200)
    if (!projectRef) return console.error('未找到项目号')
    deleteUserMFAFactors({ projectRef, userId: user.id as string })
  }

  const handleUnban = () => {
    if (projectRef === undefined) return console.error('未找到项目号')
    if (user.id === undefined) {
      return toast.error(`封禁用户失败：未找到用户 ID`)
    }

    updateUser({
      projectRef,
      userId: user.id,
      banDuration: 'none',
    })
  }

  useEffect(() => {
    if (successAction !== undefined) {
      const timer = setTimeout(() => setSuccessAction(undefined), 5000)
      return () => clearTimeout(timer)
    }
  }, [successAction])

  return (
    <>
      <div>
        <UserHeader user={user} />

        {isBanned ? (
          <Admonition
            type="warning"
            label={`User banned until ${dayjs(user.banned_until).format(DATE_FORMAT)}`}
            className="border-r-0 border-l-0 rounded-none -mt-px [&_svg]:ml-0.5 mb-0"
          />
        ) : (
          <Separator />
        )}

        <div className={cn('flex flex-col gap-y-1', PANEL_PADDING)}>
          <RowData property="User UID" value={user.id} />
          <RowData
            property="创建时间"
            value={user.created_at ? dayjs(user.created_at).format(DATE_FORMAT) : undefined}
          />
          <RowData
            property="更新时间"
            value={user.updated_at ? dayjs(user.updated_at).format(DATE_FORMAT) : undefined}
          />
          <RowData property="邀请时间" value={user.invited_at} />
          <RowData property="确认邮件发送时间" value={user.confirmation_sent_at} />
          <RowData
            property="邮件确认时间"
            value={user.confirmed_at ? dayjs(user.confirmed_at).format(DATE_FORMAT) : undefined}
          />
          <RowData
            property="最近登录时间"
            value={
              user.last_sign_in_at ? dayjs(user.last_sign_in_at).format(DATE_FORMAT) : undefined
            }
          />
          <RowData property="SSO" value={user.is_sso_user} />
        </div>

        <div className={cn('flex flex-col !pt-0', PANEL_PADDING)}>
          <p>第三方认证信息</p>
          <p className="text-sm text-foreground-light">该用户设置了以下第三方认证</p>
        </div>

        <div className={cn('flex flex-col -space-y-1 !pt-0', PANEL_PADDING)}>
          {providers.map((provider) => {
            const providerMeta = PROVIDERS_SCHEMAS.find(
              (x) =>
                ('key' in x && x.key === provider.name) || x.title.toLowerCase() === provider.name
            )
            const enabledProperty = Object.keys(providerMeta?.properties ?? {}).find((x) =>
              x.toLowerCase().endsWith('_enabled')
            )
            const providerName =
              provider.name === 'email'
                ? provider.name.toLowerCase()
                : providerMeta?.title ?? provider.name
            const isActive = data?.[enabledProperty as keyof typeof data] ?? false

            return (
              <div key={provider.name} className={cn(CONTAINER_CLASS, 'items-start justify-start')}>
                {provider.icon && (
                  <img
                    width={16}
                    src={provider.icon}
                    alt={`${provider.name} auth icon`}
                    className={cn('mt-1.5', provider.name === 'github' ? 'dark:invert' : '')}
                  />
                )}
                <div className="flex-grow mt-0.5">
                  <p className="capitalize">{providerName}</p>
                  <p className="text-xs text-foreground-light">
                    通过{' '}
                    {providerName === 'SAML' ? 'SSO' : 'OAuth'}
                    方式使用 {providerName} 账号登录
                  </p>
                  <Button asChild type="default" className="mt-2">
                    <Link
                      href={`/project/${projectRef}/auth/providers?provider=${provider.name === 'SAML' ? 'SAML 2.0' : provider.name}`}
                    >
                      配置 {providerName} 认证
                    </Link>
                  </Button>
                </div>
                {isActive ? (
                  <div className="flex items-center gap-1 rounded-full border border-brand-400 bg-brand-200 py-1 px-1 text-xs text-brand">
                    <span className="rounded-full bg-brand p-0.5 text-xs text-brand-200">
                      <Check strokeWidth={2} size={12} />
                    </span>
                    <span className="px-1">已启用</span>
                  </div>
                ) : (
                  <div className="rounded-md border border-strong bg-surface-100 py-1 px-3 text-xs text-foreground-lighter">
                    已禁用
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <Separator />

        <div className={cn('flex flex-col -space-y-1', PANEL_PADDING)}>
          {isEmailAuth && (
            <>
              <RowAction
                title="重置密码"
                description="给用户发送密码重置邮件"
                button={{
                  icon: <Mail />,
                  text: '发送密码重置邮件',
                  isLoading: isResettingPassword,
                  disabled: !canSendRecovery,
                  onClick: () => {
                    if (projectRef) resetPassword({ projectRef, user })
                  },
                }}
                success={
                  successAction === 'send_recovery'
                    ? {
                        title: '密码重置邮件已发送',
                        description: `邮件中的重置链接在 ${formattedExpiry}之内有效`,
                      }
                    : undefined
                }
              />
              <RowAction
                title="发送登录链接"
                description="通过电子邮件向用户发送无密码登录链接"
                button={{
                  icon: <Mail />,
                  text: '发送登录链接',
                  isLoading: isSendingMagicLink,
                  disabled: !canSendMagicLink,
                  onClick: () => {
                    if (projectRef) sendMagicLink({ projectRef, user })
                  },
                }}
                success={
                  successAction === 'send_magic_link'
                    ? {
                        title: '登录链接已发送',
                        description: `邮件中的登录链接在 ${formattedExpiry}之内有效`,
                      }
                    : undefined
                }
              />
            </>
          )}
          {isPhoneAuth && (
            <RowAction
              title="发送验证码"
              description="通过电话发送登录验证码"
              button={{
                icon: <Mail />,
                text: '发送验证码',
                isLoading: isSendingOTP,
                disabled: !canSendOtp,
                onClick: () => {
                  if (projectRef) sendOTP({ projectRef, user })
                },
              }}
              success={
                successAction === 'send_otp'
                  ? {
                      title: '验证码已发送',
                      description: `短信验证码在 ${formattedExpiry}之内有效`,
                    }
                  : undefined
              }
            />
          )}
        </div>

        <Separator />

        <div className={cn('flex flex-col', PANEL_PADDING)}>
          <p>谨慎操作区</p>
          <p className="text-sm text-foreground-light">
            请注意以下操作将不能撤销。
          </p>
        </div>

        <div className={cn('flex flex-col -space-y-1 !pt-0', PANEL_PADDING)}>
          <RowAction
            title="移除多因素认证"
            description="移除此用户相关的所有多因素认证"
            button={{
              icon: <ShieldOff />,
              text: '移除多因素认证',
              disabled: !canRemoveMFAFactors,
              onClick: () => setIsDeleteFactorsModalOpen(true),
            }}
            className="!bg border-destructive-400"
          />
          <RowAction
            title={
              isBanned
                ? `已封禁用户直到 ${dayjs(user.banned_until).format(DATE_FORMAT)}`
                : '封禁用户'
            }
            description={
              isBanned
                ? '在此日期之前用户将不能访问本项目'
                : '设置用户不能访问本项目的持续时间'
            }
            button={{
              icon: <Ban />,
              text: isBanned ? '解禁用户' : '封禁用户',
              disabled: !canUpdateUser,
              onClick: () => {
                if (isBanned) {
                  setIsUnbanModalOpen(true)
                } else {
                  setIsBanModalOpen(true)
                }
              },
            }}
            className="!bg border-destructive-400"
          />
          <RowAction
            title="删除用户"
            description="用户将永远不能访问本项目"
            button={{
              icon: <Trash />,
              type: 'danger',
              text: '删除用户',
              disabled: !canRemoveUser,
              onClick: () => setIsDeleteModalOpen(true),
            }}
            className="!bg border-destructive-400"
          />
        </div>
      </div>

      <DeleteUserModal
        visible={isDeleteModalOpen}
        selectedUser={user}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleteSuccess={() => {
          setIsDeleteModalOpen(false)
          onDeleteSuccess()
        }}
      />

      <ConfirmationModal
        visible={isDeleteFactorsModalOpen}
        variant="warning"
        title="确认移除多因素认证"
        confirmLabel="移除认证因子"
        confirmLabelLoading="正在移除"
        onCancel={() => setIsDeleteFactorsModalOpen(false)}
        onConfirm={() => handleDeleteFactors()}
        alert={{
          base: { variant: 'warning' },
          title:
            "移除多因素认证将会导致用户的认证安全级别（AAL）降低到 AAL1",
          description: '注意此操作不会使用户登出',
        }}
      >
        <p className="text-sm text-foreground-light">
          您确定想要移除用户{' '}
          <span className="text-foreground">{user.email ?? user.phone ?? ''}</span>的多因素认证吗?
        </p>
      </ConfirmationModal>

      <BanUserModal visible={isBanModalOpen} user={user} onClose={() => setIsBanModalOpen(false)} />

      <ConfirmationModal
        variant="warning"
        visible={isUnbanModalOpen}
        title="确认解禁用户"
        loading={isUpdatingUser}
        confirmLabel="解禁用户"
        confirmLabelLoading="正在解禁"
        onCancel={() => setIsUnbanModalOpen(false)}
        onConfirm={() => handleUnban()}
      >
        <p className="text-sm text-foreground-light">
          一旦解禁，用户将再次能够访问本项目。您确定想要解禁此用户吗？
        </p>
      </ConfirmationModal>
    </>
  )
}

export const RowData = ({ property, value }: { property: string; value?: string | boolean }) => {
  return (
    <>
      <div className="flex items-center gap-x-2 group justify-between">
        <p className=" text-foreground-lighter text-xs">{property}</p>
        {typeof value === 'boolean' ? (
          <div className="h-[26px] flex items-center justify-center min-w-[70px]">
            {value ? (
              <div className="rounded-full w-4 h-4 dark:bg-white bg-black flex items-center justify-center">
                <Check size={10} className="text-contrast" strokeWidth={4} />
              </div>
            ) : (
              <div className="rounded-full w-4 h-4 dark:bg-white bg-black flex items-center justify-center">
                <X size={10} className="text-contrast" strokeWidth={4} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-x-2 h-[26px] font-mono min-w-[40px]">
            <p className="text-xs">{!value ? '-' : value}</p>
            {!!value && (
              <CopyButton
                iconOnly
                type="text"
                icon={<Copy />}
                className="transition opacity-0 group-hover:opacity-100 px-1"
                text={value}
              />
            )}
          </div>
        )}
      </div>
      <Separator />
    </>
  )
}

export const RowAction = ({
  title,
  description,
  button,
  success,
  className,
}: {
  title: string
  description: string
  button: {
    icon: ReactNode
    type?: ComponentProps<typeof Button>['type']
    text: string
    disabled?: boolean
    isLoading?: boolean
    onClick: () => void
  }
  success?: {
    title: string
    description: string
  }
  className?: string
}) => {
  const disabled = button?.disabled ?? false

  return (
    <div className={cn(CONTAINER_CLASS, className)}>
      <div>
        <p>{success ? success.title : title}</p>
        <p className="text-xs text-foreground-light">
          {success ? success.description : description}
        </p>
      </div>

      <ButtonTooltip
        type={button?.type ?? 'default'}
        icon={success ? <Check className="text-brand" /> : button.icon}
        loading={button.isLoading ?? false}
        onClick={button.onClick}
        disabled={disabled}
        tooltip={{
          content: {
            side: 'bottom',
            text: disabled
              ? `您需要额外的权限才能${button.text.toLowerCase()}`
              : undefined,
          },
        }}
      >
        {button.text}
      </ButtonTooltip>
    </div>
  )
}
