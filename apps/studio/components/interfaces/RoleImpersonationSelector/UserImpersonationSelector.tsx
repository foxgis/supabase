import { useDebounce } from '@uidotdev/usehooks'
import { ChevronDown, ExternalLink, User as IconUser, Loader2, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { User, useUsersInfiniteQuery } from 'data/auth/users-infinite-query'
import { useCustomAccessTokenHookDetails } from 'hooks/misc/useCustomAccessTokenHookDetails'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { ResponseError } from 'types'
import {
  Button,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Input,
  Switch,
} from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { getAvatarUrl, getDisplayName } from '../Auth/Users/Users.utils'

type AuthenticatorAssuranceLevels = 'aal1' | 'aal2'

const UserImpersonationSelector = () => {
  const [searchText, setSearchText] = useState('')
  const [aal, setAal] = useState<AuthenticatorAssuranceLevels>('aal1')
  const [externalUserId, setExternalUserId] = useState('')
  const [additionalClaims, setAdditionalClaims] = useState('')
  const [showExternalAuth, setShowExternalAuth] = useState(false)
  const state = useRoleImpersonationStateSnapshot()
  const debouncedSearchText = useDebounce(searchText, 300)

  const { project } = useProjectContext()

  const { data, isSuccess, isLoading, isError, error, isFetching, isPreviousData } =
    useUsersInfiniteQuery(
      {
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        keywords: debouncedSearchText.trim().toLocaleLowerCase(),
      },
      {
        keepPreviousData: true,
      }
    )
  const users = useMemo(() => data?.pages.flatMap((page) => page.result) ?? [], [data?.pages])
  const isSearching = isPreviousData && isFetching
  const impersonatingUser =
    state.role?.type === 'postgrest' &&
    state.role.role === 'authenticated' &&
    state.role.userType === 'native' &&
    state.role.user

  // Check if we're currently impersonating an external auth user (e.g. OAuth, SAML)
  // This is used to show the correct UI state and impersonation details
  const isExternalAuthImpersonating =
    state.role?.type === 'postgrest' &&
    state.role.role === 'authenticated' &&
    state.role.userType === 'external' &&
    state.role.externalAuth

  const customAccessTokenHookDetails = useCustomAccessTokenHookDetails(project?.ref)

  const [isImpersonateLoading, setIsImpersonateLoading] = useState(false)

  async function impersonateUser(user: User) {
    setIsImpersonateLoading(true)

    if (customAccessTokenHookDetails?.type === 'https') {
      toast.info(
        'Please note that HTTPS custom access token hooks are not yet supported in the dashboard.'
      )
    }

    try {
      await state.setRole(
        {
          type: 'postgrest',
          role: 'authenticated',
          userType: 'native',
          user,
          aal,
        },
        customAccessTokenHookDetails
      )
    } catch (error) {
      toast.error(`Failed to impersonate user: ${(error as ResponseError).message}`)
    }

    setIsImpersonateLoading(false)
  }

  // Impersonates an external auth user (e.g. OAuth, SAML) by setting the sub and any additional claims
  // This allows testing RLS policies for external auth users without needing to set up the full OAuth/SAML flow
  async function impersonateExternalUser() {
    setIsImpersonateLoading(true)

    let parsedClaims = {}
    try {
      parsedClaims = additionalClaims ? JSON.parse(additionalClaims) : {}
    } catch (e) {
      toast.error('Invalid JSON in additional claims')
      return
    }
    try {
      await state.setRole(
        {
          type: 'postgrest',
          role: 'authenticated',
          userType: 'external',
          externalAuth: {
            sub: externalUserId,
            additionalClaims: parsedClaims,
          },
          aal,
        },
        customAccessTokenHookDetails
      )
    } catch (error) {
      toast.error(`Failed to impersonate user: ${(error as ResponseError).message}`)
    }

    setIsImpersonateLoading(false)
  }

  function stopImpersonating() {
    state.setRole(undefined)
    setShowExternalAuth(false) // Reset external auth impersonation when stopping impersonation
  }

  function toggleAalState() {
    setAal((prev) => (prev === 'aal2' ? 'aal1' : 'aal2'))
  }

  const displayName = impersonatingUser
    ? getDisplayName(
        impersonatingUser,
        impersonatingUser.email ?? impersonatingUser.phone ?? impersonatingUser.id ?? '未知用户'
      )
    : isExternalAuthImpersonating
      ? state.role.externalAuth.sub
      : undefined

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-foreground text-sm">
        {displayName ? `切换到用户 ${displayName}` : '切换用户'}
      </h2>
      <p className="text-sm text-foreground-light">
        {!impersonatingUser && !isExternalAuthImpersonating
          ? "选择一个受数据库行级安全策略限制的用户。"
          : "查询结果将按照此用户的行级安全策略返回。"}
      </p>

      {/* Check for both regular user and external auth impersonation since they use different data structures but both need to be handled for displaying impersonation UI */}
      {!impersonatingUser && !isExternalAuthImpersonating ? (
        <div className="flex flex-col gap-2 mt-2">
          <Input
            className="table-editor-search border-none"
            icon={
              isSearching ? (
                <Loader2
                  className="animate-spin text-foreground-lighter"
                  size={16}
                  strokeWidth={1.5}
                />
              ) : (
                <Search className="text-foreground-lighter" size={16} strokeWidth={1.5} />
              )
            }
            placeholder="查找用户.."
            onChange={(e) => setSearchText(e.target.value)}
            value={searchText}
            size="small"
            actions={
              searchText && (
                <Button size="tiny" type="text" className="px-1" onClick={() => setSearchText('')}>
                  <X size={12} strokeWidth={2} />
                </Button>
              )
            }
          />

          <Collapsible_Shadcn_>
            <CollapsibleTrigger_Shadcn_ className="group font-normal p-0 [&[data-state=open]>div>svg]:!-rotate-180">
              <div className="flex items-center gap-x-1 w-full">
                <p className="text-xs text-foreground-light group-hover:text-foreground transition">
                  高级选项
                </p>
                <ChevronDown
                  className="transition-transform duration-200"
                  strokeWidth={1.5}
                  size={14}
                />
              </div>
            </CollapsibleTrigger_Shadcn_>
            <CollapsibleContent_Shadcn_ className="mt-1 flex flex-col gap-y-4">
              <div className="flex flex-row items-center gap-x-4 text-sm text-foreground-light">
                <div className="flex items-center gap-x-1">
                  <h3>MFA 认证级别</h3>
                  <InfoTooltip side="top" className="flex flex-col gap-1 max-w-96">
                    <p>
                      AAL1 级别通过标准登录方法验证用户，而 AAL2 添加了第二身份验证因素。
                      <br />
                      如果您没有使用 MFA，您可以将此设置为 AAL1。
                    </p>
                    <a
                      href="/docs/guides/auth/auth-mfa"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-x-1 opacity-50 hover:opacity-100 transition"
                    >
                      了解更多有关 MFA 的信息 <ExternalLink size={14} strokeWidth={2} />
                    </a>
                  </InfoTooltip>
                </div>

                <div className="flex flex-row items-center gap-x-2 text-xs font-bold">
                  <p className={aal === 'aal1' ? undefined : 'text-foreground-lighter'}>AAL1</p>
                  <Switch checked={aal === 'aal2'} onCheckedChange={toggleAalState} />
                  <p className={aal === 'aal2' ? undefined : 'text-foreground-lighter'}>AAL2</p>
                </div>
              </div>

              <div className="flex flex-col gap-y-2">
                <div className="flex items-center gap-x-1">
                  <h3 className="text-sm text-foreground-light">通过外部身份验证切换</h3>
                  <InfoTooltip side="top" className="flex flex-col gap-1 max-w-96">
                    <p>
                      通过提供用户 ID 和可选声明，测试与 Clerk 或 Auth0 等外部身份验证提供商的行级安全策略。
                    </p>
                  </InfoTooltip>
                </div>

                <div className="flex flex-row items-center gap-x-2">
                  <Switch checked={showExternalAuth} onCheckedChange={setShowExternalAuth} />
                  <p className="text-xs text-foreground-light">
                    启用外部身份验证切换
                  </p>
                </div>

                {showExternalAuth && (
                  <div className="flex flex-col gap-y-4 mt-2 border rounded-md p-4 bg-surface-100">
                    <Input
                      className="border-strong"
                      label="外部用户 ID"
                      descriptionText="来自外部身份验证提供商的用户 ID"
                      placeholder="例如：user_abc123"
                      value={externalUserId}
                      onChange={(e) => setExternalUserId(e.target.value)}
                      size="small"
                    />
                    <Input
                      className="border-strong"
                      label="附加信息（JSON）"
                      descriptionText="可选：添加自定义信息如 org_id 或 role"
                      placeholder='例如：{"app_metadata": {"org_id": "org_456"}}'
                      value={additionalClaims}
                      onChange={(e) => setAdditionalClaims(e.target.value)}
                      size="small"
                    />
                    <div className="flex items-center justify-between">
                      <div />
                      <Button
                        type="default"
                        disabled={!externalUserId}
                        onClick={impersonateExternalUser}
                      >
                        切换用户
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent_Shadcn_>
          </Collapsible_Shadcn_>

          {!showExternalAuth && (
            <>
              {isLoading && (
                <div className="flex flex-col gap-2 items-center justify-center h-24">
                  <Loader2 className="animate-spin" size={24} />
                  <span>加载用户列表...</span>
                </div>
              )}

              {isError && <AlertError error={error} subject="获取用户列表失败" />}

              {isSuccess &&
                (users.length > 0 ? (
                  <ul className="divide-y max-h-[150px] overflow-y-scroll" role="list">
                    {users.map((user) => (
                      <li key={user.id} role="listitem">
                        <UserRow
                          user={user}
                          onClick={impersonateUser}
                          isLoading={isImpersonateLoading}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col gap-2 items-center justify-center h-24">
                    <p className="text-foreground-light text-xs" role="status">
                      未找到任何用户
                    </p>
                  </div>
                ))}
            </>
          )}
        </div>
      ) : (
        <>
          {impersonatingUser && (
            <UserImpersonatingRow
              user={impersonatingUser}
              onClick={stopImpersonating}
              isImpersonating={true}
              aal={aal}
              isLoading={isImpersonateLoading}
            />
          )}
          {isExternalAuthImpersonating && (
            <ExternalAuthImpersonatingRow
              sub={state.role.externalAuth.sub}
              onClick={stopImpersonating}
              aal={aal}
              isLoading={isImpersonateLoading}
            />
          )}
        </>
      )}
    </div>
  )
}

export default UserImpersonationSelector

// Base interface for shared impersonation row props to reduce
// duplication between user and external auth impersonation displays
interface BaseImpersonatingRowProps {
  onClick: () => void
  aal: AuthenticatorAssuranceLevels
  displayName: string
  avatarUrl?: string
  isImpersonating: boolean
  isLoading?: boolean
}

const BaseImpersonatingRow = ({
  onClick,
  aal,
  displayName,
  avatarUrl,
  isImpersonating = false,
  isLoading = false,
}: BaseImpersonatingRowProps) => {
  return (
    <div className="flex items-center gap-3 py-2 text-foreground">
      <div className="flex items-center gap-4 bg-surface-200 pr-4 pl-0.5 py-0.5 border rounded-full max-w-l">
        {avatarUrl ? (
          <img className="rounded-full w-5 h-5" src={avatarUrl} alt={displayName} />
        ) : (
          <div className="rounded-full w-[21px] h-[21px] bg-surface-300 border border-strong flex items-center justify-center">
            <IconUser size={12} strokeWidth={2} />
          </div>
        )}

        <span className="text-sm truncate">
          {displayName}{' '}
          <span className="ml-2 text-foreground-lighter text-xs font-light">
            {aal === 'aal2' ? 'AAL2' : 'AAL1'}
          </span>
        </span>
      </div>

      <Button type="default" onClick={onClick} disabled={isLoading} loading={isLoading}>
        {isImpersonating ? '停止切换' : '切换'}
      </Button>
    </div>
  )
}

const UserImpersonatingRow = ({
  user,
  onClick,
  isImpersonating = false,
  isLoading = false,
  aal,
}: UserRowProps & { aal: AuthenticatorAssuranceLevels }) => {
  const avatarUrl = getAvatarUrl(user)
  const displayName =
    getDisplayName(user, user.email ?? user.phone ?? user.id ?? '未知用户') +
    (user.is_anonymous ? ' (匿名用户)' : '')

  return (
    <BaseImpersonatingRow
      onClick={() => onClick(user)}
      aal={aal}
      displayName={displayName}
      avatarUrl={avatarUrl}
      isImpersonating={isImpersonating}
      isLoading={isLoading}
    />
  )
}

interface ExternalAuthImpersonatingRowProps {
  sub: string
  onClick: () => void
  aal: AuthenticatorAssuranceLevels
  isLoading?: boolean
}

const ExternalAuthImpersonatingRow = ({
  sub,
  onClick,
  aal,
  isLoading = false,
}: ExternalAuthImpersonatingRowProps) => {
  return (
    <BaseImpersonatingRow
      onClick={onClick}
      aal={aal}
      displayName={sub}
      isImpersonating={true}
      isLoading={isLoading}
    />
  )
}

interface UserRowProps {
  user: User
  onClick: (user: User) => void
  isImpersonating?: boolean
  isLoading?: boolean
}

const UserRow = ({ user, onClick, isImpersonating = false, isLoading = false }: UserRowProps) => {
  const avatarUrl = getAvatarUrl(user)
  const displayName =
    getDisplayName(user, user.email ?? user.phone ?? user.id ?? '未知用户') +
    (user.is_anonymous ? ' (匿名用户)' : '')

  return (
    <div className="flex items-center justify-between py-1 text-foreground">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img className="rounded-full w-5 h-5" src={avatarUrl} alt={displayName} />
        ) : (
          <div className="rounded-full w-[21px] h-[21px] bg-surface-300 border text-muted flex items-center justify-center text-background">
            <IconUser size={12} strokeWidth={2} />
          </div>
        )}

        <span className="text-sm">{displayName}</span>
      </div>

      <Button type="default" onClick={() => onClick(user)} disabled={isLoading} loading={isLoading}>
        {isImpersonating ? '停止切换' : '切换'}
      </Button>
    </div>
  )
}
