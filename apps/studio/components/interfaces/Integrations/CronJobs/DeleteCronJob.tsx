import { parseAsString, useQueryState } from 'nuqs'
import { toast } from 'sonner'

import { useDatabaseCronJobDeleteMutation } from 'data/database-cron-jobs/database-cron-jobs-delete-mutation'
import { CronJob } from 'data/database-cron-jobs/database-cron-jobs-infinite-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

interface DeleteCronJobProps {
  cronJob: CronJob
  visible: boolean
  onClose: () => void
}

export const DeleteCronJob = ({ cronJob, visible, onClose }: DeleteCronJobProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const [searchQuery] = useQueryState('search', parseAsString.withDefault(''))

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: deleteDatabaseCronJob, isLoading } = useDatabaseCronJobDeleteMutation({
    onSuccess: () => {
      sendEvent({
        action: 'cron_job_deleted',
        groups: { project: project?.ref ?? '未知项目', organization: org?.slug ?? '未知组织' },
      })
      toast.success(`成功移除了定时任务 ${cronJob.jobname}`)
      onClose()
    },
  })

  async function handleDelete() {
    if (!project) return console.error('未找到项目')

    deleteDatabaseCronJob({
      jobId: cronJob.jobid,
      projectRef: project.ref,
      connectionString: project.connectionString,
      searchTerm: searchQuery,
    })
  }

  if (!cronJob) {
    return null
  }

  // Cron job name is optional. If the cron job has no name, show a simplified modal which doesn't require the user to input the name.
  if (!cronJob.jobname) {
    return (
      <ConfirmationModal
        variant="destructive"
        visible={visible}
        onCancel={() => onClose()}
        onConfirm={handleDelete}
        title={`删除定时任务`}
        loading={isLoading}
        confirmLabel={`删除`}
        alert={{ title: '删除定时任务后无法恢复。' }}
      />
    )
  }

  return (
    <TextConfirmModal
      variant="destructive"
      visible={visible}
      onCancel={() => onClose()}
      onConfirm={handleDelete}
      title="删除定时任务"
      loading={isLoading}
      confirmLabel={`删除定时任务 ${cronJob.jobname}`}
      confirmPlaceholder="请输入定时任务名称"
      confirmString={cronJob.jobname ?? '未知定时任务'}
      text={
        <>
          <span>将会删除定时任务</span>{' '}
          <span className="text-bold text-foreground">{cronJob.jobname}</span>
        </>
      }
      alert={{ title: '删除定时任务后无法恢复。' }}
    />
  )
}
