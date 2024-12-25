import { useDebounce } from '@uidotdev/usehooks'
import { ChevronDown, ExternalLink, User as IconUser, Loader2, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { User, useUsersInfiniteQuery } from 'data/auth/users-infinite-query'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
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
    state.role?.type === 'postgrest' && state.role.role === 'authenticated' && state.role.user

  function impersonateUser(user: User) {
    state.setRole({
      type: 'postgrest',
      role: 'authenticated',
      user,
      aal,
    })
  }

  function stopImpersonating() {
    state.setRole(undefined)
  }

  function toggleAalState() {
    setAal((prev) => (prev === 'aal2' ? 'aal1' : 'aal2'))
  }

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-foreground text-sm">
        {impersonatingUser
          ? `Impersonating ${getDisplayName(
              impersonatingUser,
              impersonatingUser.email ??
                impersonatingUser.phone ??
                impersonatingUser.id ??
                '未知用户'
            )}`
          : '切换用户'}
      </h2>
      <p className="text-sm text-foreground-light">
        {!impersonatingUser
          ? '选择一个遵守数据库行级安全策略的用户。'
          : '查询结果将遵守数据库的行级安全策略。'}
      </p>

      {!impersonatingUser ? (
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
            <CollapsibleContent_Shadcn_ className="mt-1 flex flex-row items-center gap-x-4 text-sm text-foreground-light">
              <div className="flex items-center gap-x-1">
                <h3>MFA 认证级别</h3>
                <InfoTooltip side="top" className="flex flex-col gap-1 max-w-96">
                  <p>
                    AAL1 通过标准登录方法验证用户，而 AAL2 添加了第二身份验证因素。
                    <br />
                    如果您不使用 MFA，您可以将此设置为 AAL1。
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
            </CollapsibleContent_Shadcn_>
          </Collapsible_Shadcn_>

          {isLoading && (
            <div className="flex flex-col gap-2 items-center justify-center h-24">
              <Loader2 className="animate-spin" size={24} />
              <span>加载用户...</span>
            </div>
          )}

          {isError && <AlertError error={error} subject="Failed to retrieve users" />}

          {isSuccess &&
            (users.length > 0 ? (
              <ul className="divide-y max-h-[150px] overflow-y-scroll" role="list">
                {users.map((user) => (
                  <li key={user.id} role="listitem">
                    <UserRow user={user} onClick={impersonateUser} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col gap-2 items-center justify-center h-24">
                <p className="text-foreground-light text-xs" role="status">
                  未找到用户
                </p>
              </div>
            ))}
        </div>
      ) : (
        <UserImpersonatingRow
          user={impersonatingUser}
          onClick={stopImpersonating}
          isImpersonating={true}
          aal={aal}
        />
      )}
    </div>
  )
}

export default UserImpersonationSelector

interface UserRowProps {
  user: User
  onClick: (user: User) => void
  isImpersonating?: boolean
}

const UserImpersonatingRow = ({
  user,
  onClick,
  isImpersonating = false,
  aal,
}: UserRowProps & { aal: AuthenticatorAssuranceLevels }) => {
  const avatarUrl = getAvatarUrl(user)
  const displayName =
    getDisplayName(user, user.email ?? user.phone ?? user.id ?? 'Unknown') +
    (user.is_anonymous ? ' (anonymous)' : '')

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

      <Button type="default" onClick={() => onClick(user)}>
        {isImpersonating ? '停止切换' : '切换'}
      </Button>
    </div>
  )
}

interface UserRowProps {
  user: User
  onClick: (user: User) => void
  isImpersonating?: boolean
}

const UserRow = ({ user, onClick, isImpersonating = false }: UserRowProps) => {
  const avatarUrl = getAvatarUrl(user)
  const displayName =
    getDisplayName(user, user.email ?? user.phone ?? user.id ?? 'Unknown') +
    (user.is_anonymous ? ' (anonymous)' : '')

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

      <Button type="default" onClick={() => onClick(user)}>
        {isImpersonating ? '停止切换' : '切换'}
      </Button>
    </div>
  )
}
