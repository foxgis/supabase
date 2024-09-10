import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Input, Toggle } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import InformationBox from 'components/ui/InformationBox'
import NoSearchResults from 'components/ui/NoSearchResults'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { useDatabasePublicationUpdateMutation } from 'data/database-publications/database-publications-update-mutation'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import PublicationSkeleton from './PublicationSkeleton'
import { Search, AlertCircle } from 'lucide-react'

interface PublicationEvent {
  event: string
  key: string
}

interface PublicationsListProps {
  onSelectPublication: (id: number) => void
}

const PublicationsList = ({ onSelectPublication = noop }: PublicationsListProps) => {
  const { project } = useProjectContext()
  const [filterString, setFilterString] = useState<string>('')

  const { data, isLoading } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { mutate: updatePublications } = useDatabasePublicationUpdateMutation({
    onSuccess: () => {
      toast.success('成功更新了事件')
      setToggleListenEventValue(null)
    },
  })

  const canUpdatePublications = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'publications'
  )
  const isPermissionsLoaded = usePermissionsLoaded()

  const publicationEvents: PublicationEvent[] = [
    { event: 'Insert', key: 'publish_insert' },
    { event: 'Update', key: 'publish_update' },
    { event: 'Delete', key: 'publish_delete' },
    { event: 'Truncate', key: 'publish_truncate' },
  ]
  const publications =
    filterString.length === 0
      ? data ?? []
      : (data ?? []).filter((publication) => publication.name.includes(filterString))

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
              size="small"
              icon={<Search size="14" />}
              placeholder={'查找'}
              value={filterString}
              onChange={(e) => setFilterString(e.target.value)}
            />
          </div>
          {isPermissionsLoaded && !canUpdatePublications && (
            <div className="w-[500px]">
              <InformationBox
                icon={<AlertCircle className="text-foreground-light" strokeWidth={2} />}
                title="您需要额外的权限才能更新数据库事件发布设置"
              />
            </div>
          )}
        </div>
      </div>

      <Table
        head={[
          <Table.th key="header.name">名称</Table.th>,
          <Table.th key="header.id">系统 ID</Table.th>,
          <Table.th key="header.insert">插入</Table.th>,
          <Table.th key="header.update">更新</Table.th>,
          <Table.th key="header.delete">删除</Table.th>,
          <Table.th key="header.truncate">清空</Table.th>,
          <Table.th key="header.source" className="text-right">
            源
          </Table.th>,
        ]}
        body={
          isLoading
            ? Array.from({ length: 5 }).map((_, i) => <PublicationSkeleton key={i} index={i} />)
            : publications.map((x) => (
                <Table.tr className="border-t" key={x.name}>
                  <Table.td className="px-4 py-3">{x.name}</Table.td>
                  <Table.td>{x.id}</Table.td>
                  {publicationEvents.map((event) => (
                    <Table.td key={event.key}>
                      <Toggle
                        size="tiny"
                        checked={(x as any)[event.key]}
                        disabled={!canUpdatePublications}
                        onChange={() => {
                          setToggleListenEventValue({
                            publication: x,
                            event,
                            currentStatus: (x as any)[event.key],
                          })
                        }}
                      />
                    </Table.td>
                  ))}
                  <Table.td className="px-4 py-3 pr-2">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="default"
                        style={{ paddingTop: 3, paddingBottom: 3 }}
                        onClick={() => onSelectPublication(x.id)}
                      >
                        {x.tables == null
                          ? '所有表'
                          : `${x.tables.length} 张${
                              x.tables.length > 1 || x.tables.length == 0 ? '表' : '表'
                            }`}
                      </Button>
                    </div>
                  </Table.td>
                </Table.tr>
              ))
        }
      />

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

export default PublicationsList
