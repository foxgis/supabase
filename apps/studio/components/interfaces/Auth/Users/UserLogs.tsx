import { ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

import { useParams } from 'common'
import { LOGS_TABLES } from 'components/interfaces/Settings/Logs/Logs.constants'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { User } from 'data/auth/users-infinite-query'
import useLogsPreview from 'hooks/analytics/useLogsPreview'
import { useLogsUrlState } from 'hooks/analytics/useLogsUrlState'
import { Button, cn, CriticalIcon, Separator } from 'ui'
import { Admonition, TimestampInfo } from 'ui-patterns'
import { UserHeader } from './UserHeader'
import { PANEL_PADDING } from './Users.constants'

interface UserLogsProps {
  user: User
}

export const UserLogs = ({ user }: UserLogsProps) => {
  const { ref } = useParams()
  const { filters, setFilters } = useLogsUrlState()

  const {
    logData: authLogs,
    isSuccess: isSuccessAuthLogs,
    isLoading: isLoadingAuthLogs,
    refresh,
  } = useLogsPreview({
    projectRef: ref as string,
    table: LOGS_TABLES.auth,
    filterOverride: { search_query: user.id },
    limit: 5,
  })

  useEffect(() => {
    if (user.id) setFilters({ ...filters, search_query: user.id })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  return (
    <div>
      <UserHeader user={user} />

      <Separator />

      <div className={cn('flex flex-col gap-y-3', PANEL_PADDING)}>
        <div>
          <p>认证日志</p>
          <p className="text-sm text-foreground-light">
            此用户在最近一小时的认证日志
          </p>
        </div>

        {/* [Joshen] This whole thing here i reckon we can shift to a component, if in the future we wanna add more user logs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              type={'status_code' in filters ? 'default' : 'secondary'}
              className="rounded-r-none border-r-0"
              disabled={isLoadingAuthLogs}
              onClick={() => setFilters({ search_query: user.id })}
            >
              显示所有
            </Button>
            <div className="border-button border border-l-0 py-3" />
            <Button
              type={'status_code' in filters ? 'secondary' : 'default'}
              className="rounded-l-none border-l-0"
              disabled={isLoadingAuthLogs}
              onClick={() =>
                setFilters({
                  search_query: user.id,
                  status_code: { client_error: true, server_error: true },
                })
              }
            >
              只显示错误的
            </Button>
          </div>
          <Button
            type="default"
            loading={isLoadingAuthLogs}
            disabled={isLoadingAuthLogs}
            icon={<RefreshCw />}
            onClick={() => refresh()}
          >
            刷新
          </Button>
        </div>

        {isLoadingAuthLogs && !isSuccessAuthLogs ? (
          <GenericSkeletonLoader />
        ) : authLogs.length === 0 ? (
          <Admonition
            type="note"
            title="此用户还没有认证日志"
            description="认证事件如登录活动将在这里显示"
          />
        ) : (
          <div>
            <div className="border border-b-0 rounded-t-md divide-y overflow-hidden">
              {authLogs.map((log) => {
                const status = ((log.status ?? '-') as any).toString()
                const is400 = status.startsWith('4')
                const is500 = status.startsWith('5')

                return (
                  <div
                    key={log.id}
                    className="flex items-center transition font-mono px-2 py-1.5 bg-surface-100 divide-x"
                  >
                    <p className="text-xs text-foreground-light min-w-[125px] w-[125px] px-1">
                      <TimestampInfo utcTimestamp={log.timestamp / 1000} />
                    </p>
                    <div className="flex items-center text-xs text-foreground-light h-[22px] min-w-[70px] w-[70px] px-2">
                      <div
                        className={cn(
                          'flex items-center justify-center gap-x-1',
                          !!log.status && 'border px-1 py-0.5 rounded',
                          is400
                            ? 'text-warning border-warning bg-warning-300'
                            : is500
                              ? 'text-destructive border-destructive bg-destructive-300'
                              : ''
                        )}
                      >
                        {(is400 || is500) && (
                          <CriticalIcon
                            hideBackground
                            className={cn(is400 && 'text-warning-600')}
                          />
                        )}
                        {status}
                      </div>
                    </div>
                    <p className="group relative flex items-center py-1.5 text-xs text-foreground-light px-2 truncate w-full">
                      {`${log.path} | ${log.msg}`}

                      <ButtonTooltip
                        type="outline"
                        asChild
                        tooltip={{ content: { text: 'Open in logs' } }}
                        className="px-1.5 absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition bg-background focus-visible:opacity-100"
                      >
                        <Link href={`/project/${ref}/logs/auth-logs?log=${log.id}`}>
                          <ExternalLink size="12" className="text-foreground-light" />
                        </Link>
                      </ButtonTooltip>
                    </p>
                  </div>
                )
              })}
            </div>
            <Button
              block
              asChild
              type="outline"
              className="transition rounded-t-none text-foreground-light hover:text-foreground"
            >
              <Link href={`/project/${ref}/logs/auth-logs?s=${user.id}`}>查看更多日志</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
