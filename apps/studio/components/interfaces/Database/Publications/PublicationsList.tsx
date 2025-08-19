import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AlertCircle, Info, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import InformationBox from 'components/ui/InformationBox'
import NoSearchResults from 'components/ui/NoSearchResults'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { useDatabasePublicationUpdateMutation } from 'data/database-publications/database-publications-update-mutation'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Button,
  Card,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { PublicationSkeleton } from './PublicationSkeleton'

interface PublicationEvent {
  event: string
  key: string
}

export const PublicationsList = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [filterString, setFilterString] = useState<string>('')

  const {
    data = [],
    error,
    isLoading,
    isSuccess,
    isError,
  } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { mutate: updatePublications } = useDatabasePublicationUpdateMutation({
    onSuccess: () => {
      toast.success('成功更新了事件')
      setToggleListenEventValue(null)
    },
  })

  const { can: canUpdatePublications, isSuccess: isPermissionsLoaded } =
    useAsyncCheckProjectPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'publications')

  const publicationEvents: PublicationEvent[] = [
    { event: 'Insert', key: 'publish_insert' },
    { event: 'Update', key: 'publish_update' },
    { event: 'Delete', key: 'publish_delete' },
    { event: 'Truncate', key: 'publish_truncate' },
  ]
  const publications = (
    filterString.length === 0
      ? data
      : data.filter((publication) => publication.name.includes(filterString))
  ).sort((a, b) => a.id - b.id)

  const [toggleListenEventValue, setToggleListenEventValue] = useState<{
    publication: any
    event: PublicationEvent
    currentStatus: any
  } | null>(null)

  const toggleListenEvent = async () => {
    if (!toggleListenEventValue || !project) return

    const { publication, event, currentStatus } = toggleListenEventValue
    const payload = {
      projectRef: project.ref,
      connectionString: project.connectionString,
      id: publication.id,
    } as any
    payload[`publish_${event.event.toLowerCase()}`] = !currentStatus
    updatePublications(payload)
  }

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Input
              size="tiny"
              icon={<Search size={12} />}
              className="w-48 pl-8"
              placeholder="查找订阅发布"
              value={filterString}
              onChange={(e) => setFilterString(e.target.value)}
            />
          </div>
          {isPermissionsLoaded && !canUpdatePublications && (
            <div className="w-[500px]">
              <InformationBox
                icon={<AlertCircle className="text-foreground-light" strokeWidth={2} />}
                title="您需要额外的权限才能更新数据库发布订阅设置"
              />
            </div>
          )}
        </div>
      </div>

      <div className="w-full overflow-hidden overflow-x-auto">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>系统 ID</TableHead>
                <TableHead>插入</TableHead>
                <TableHead>更新</TableHead>
                <TableHead>删除</TableHead>
                <TableHead>清空</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 2 }).map((_, i) => <PublicationSkeleton key={i} index={i} />)}

              {isError && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <AlertError error={error} subject="获取发布订阅失败" />
                  </TableCell>
                </TableRow>
              )}

              {isSuccess &&
                publications.map((x) => (
                  <TableRow key={x.name}>
                    <TableCell className="flex items-center gap-x-2 items-center">
                      {x.name}
                      {/* [Joshen] Making this tooltip very specific for these 2 publications */}
                      {['supabase_realtime', 'supabase_realtime_messages_publication'].includes(
                        x.name
                      ) && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Info size={14} className="text-foreground-light" />
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            {x.name === 'supabase_realtime'
                              ? '此发布订阅是由系统管理的，用于处理数据库变更'
                              : x.name === 'supabase_realtime_messages_publication'
                                ? '此发布订阅是由系统管理的，用于处理数据库中的广播'
                                : undefined}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>{x.id}</TableCell>
                    {publicationEvents.map((event) => (
                      <TableCell key={event.key}>
                        <Switch
                          size="small"
                          checked={(x as any)[event.key]}
                          disabled={!canUpdatePublications}
                          onClick={() => {
                            setToggleListenEventValue({
                              publication: x,
                              event,
                              currentStatus: (x as any)[event.key],
                            })
                          }}
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex justify-end">
                        <Button asChild type="default" style={{ paddingTop: 3, paddingBottom: 3 }}>
                          <Link href={`/project/${ref}/database/publications/${x.id}`}>
                            {x.tables === null
                              ? '所有表'
                              : `${x.tables.length} 张${x.tables.length === 1 ? '表' : '表'}`}
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {!isLoading && publications.length === 0 && (
        <NoSearchResults
          searchString={filterString}
          onResetFilter={() => setFilterString('')}
          className="rounded-t-none border-t-0"
        />
      )}

      <ConfirmationModal
        visible={toggleListenEventValue !== null}
        title={`确定要启停发送 ${toggleListenEventValue?.event.event.toLowerCase()} 事件吗?`}
        confirmLabel="确定"
        confirmLabelLoading="正在更新"
        onCancel={() => setToggleListenEventValue(null)}
        onConfirm={() => {
          toggleListenEvent()
        }}
      >
        <p className="text-sm text-foreground-light">
          您确定要 {toggleListenEventValue?.currentStatus ? '停止' : '开启'}{' '}
          发送 {toggleListenEventValue?.event.event.toLowerCase()} 事件给{' '}
          {toggleListenEventValue?.publication.name}?
        </p>
      </ConfirmationModal>
    </>
  )
}
