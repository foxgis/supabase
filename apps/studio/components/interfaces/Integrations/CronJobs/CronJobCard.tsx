import dayjs from 'dayjs'
import { Clock, History, Loader2, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { CronJob } from 'data/database-cron-jobs/database-cron-jobs-query'
import { useCronJobRunQuery } from 'data/database-cron-jobs/database-cron-jobs-run-query'
import { useDatabaseCronJobToggleMutation } from 'data/database-cron-jobs/database-cron-jobs-toggle-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import {
  Badge,
  Button,
  cn,
  CodeBlock,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Label_Shadcn_,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { convertCronToString, getNextRun } from './CronJobs.utils'

interface CronJobCardProps {
  job: CronJob
  onEditCronJob: (job: CronJob) => void
  onDeleteCronJob: (job: CronJob) => void
}

export const CronJobCard = ({ job, onEditCronJob, onDeleteCronJob }: CronJobCardProps) => {
  const { ref } = useParams()
  const org = useSelectedOrganization()
  const { project: selectedProject } = useProjectContext()

  const [toggleConfirmationModalShown, showToggleConfirmationModal] = useState(false)

  const { data } = useCronJobRunQuery({
    projectRef: ref,
    connectionString: selectedProject?.connectionString,
    jobId: job.jobid,
  })
  const lastRun = data?.start_time ? dayjs(data.start_time).valueOf() : undefined
  const nextRun = getNextRun(job.schedule, data?.start_time)
  const schedule = convertCronToString(job.schedule)

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: toggleDatabaseCronJob, isLoading } = useDatabaseCronJobToggleMutation()

  const onEdit = () => {
    sendEvent({
      action: 'cron_job_update_clicked',
      groups: {
        project: selectedProject?.ref ?? '未知项目',
        organization: org?.slug ?? '未知组织',
      },
    })
    onEditCronJob(job)
  }

  return (
    <>
      <div className="bg-surface-100 border-default overflow-hidden border shadow px-5 py-4 flex flex-row rounded-md space-x-4">
        <div>
          <Clock size={20} className="text-foreground-muted mt-0.5 translate-y-0.5" />
        </div>
        <div className="flex flex-col flex-0 overflow-y-auto w-full">
          <div className="flex flex-row justify-between items-center">
            <span
              className={cn(
                'text-base',
                job.jobname ? 'text-foreground' : 'text-foreground-lighter'
              )}
            >
              {job.jobname || 'No name provided'}
            </span>
            <div className="flex items-center gap-x-2">
              {isLoading ? (
                <Loader2 size={18} strokeWidth={2} className="animate-spin text-foreground-muted" />
              ) : (
                <Label_Shadcn_
                  htmlFor={`cron-job-active-${job.jobid}`}
                  className="text-foreground-light text-xs"
                >
                  {job.active ? '生效' : '未生效'}
                </Label_Shadcn_>
              )}
              <Switch
                id={`cron-job-active-${job.jobid}`}
                size="large"
                disabled={isLoading}
                checked={job.active}
                onCheckedChange={() => showToggleConfirmationModal(true)}
              />
              <Button
                asChild
                type="default"
                icon={<History />}
                onClick={() => {
                  sendEvent({
                    action: 'cron_job_history_clicked',
                    groups: {
                      project: selectedProject?.ref ?? '未知项目',
                      organization: org?.slug ?? '未知组织',
                    },
                  })
                }}
              >
                <Link
                  href={`/project/${ref}/integrations/cron/jobs/${encodeURIComponent(job.jobid)}?child-label=${encodeURIComponent(job.jobname || `Job #${job.jobid}`)}`}
                >
                  执行历史
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="default" icon={<MoreVertical />} className="px-1.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  {job.jobname ? (
                    <DropdownMenuItem onClick={onEdit}>编辑定时任务</DropdownMenuItem>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger className="w-full">
                        <DropdownMenuItem onClick={onEdit} disabled>
                          编辑定时任务
                        </DropdownMenuItem>
                      </TooltipTrigger>
                      <TooltipContent>
                        由于此定时任务没有名称导致不能编辑，请删除后重新创建一个定时任务。
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      sendEvent({
                        action: 'cron_job_delete_clicked',
                        groups: {
                          project: selectedProject?.ref ?? '未知项目',
                          organization: org?.slug ?? '未知组织',
                        },
                      })
                      onDeleteCronJob(job)
                    }}
                  >
                    删除定时任务
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="text-sm flex flex-row space-x-5 py-4">
            <div className="flex flex-col w-full space-y-2">
              <div className="grid grid-cols-10 gap-3 items-center">
                <span className="text-foreground-light col-span-1">执行计划</span>
                <div className="col-span-9">
                  <Input readOnly title={schedule} value={schedule} className="w-96" />
                </div>
              </div>
              <div className="grid grid-cols-10 gap-3 items-center">
                <span className="text-foreground-light col-span-1">上次执行</span>
                <div className="col-span-9">
                  <div
                    className={cn(
                      'border border-control bg-foreground/[0.026] rounded-md px-3 py-1.5 w-96',
                      !lastRun && 'text-foreground-lighter'
                    )}
                  >
                    {lastRun ? (
                      <>
                        <TimestampInfo
                          utcTimestamp={lastRun}
                          labelFormat="YYYY/MM/DD HH:mm:ss (ZZ)"
                          className="font-sans text-sm"
                        />
                        {data?.status && (
                          <Badge
                            variant={data.status === 'failed' ? 'destructive' : 'success'}
                            className="capitalize ml-2"
                          >
                            {data.status}
                          </Badge>
                        )}
                      </>
                    ) : (
                      '定时任务还未执行过'
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-10 gap-3 items-center">
                <span className="text-foreground-light col-span-1">下次执行</span>
                <div className="col-span-9">
                  <div
                    className={cn(
                      'border border-control bg-foreground/[0.026] rounded-md px-3 py-1.5 w-96',
                      !nextRun && 'text-foreground-lighter'
                    )}
                  >
                    {nextRun ? (
                      <TimestampInfo
                        utcTimestamp={nextRun}
                        labelFormat="YYYY/MM/DD HH:mm:ss (ZZ)"
                        className="font-sans text-sm"
                      />
                    ) : (
                      '无法解析此定时任务的下次执行时间'
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-10 gap-3">
                <span className="text-foreground-light col-span-1">命令</span>
                <div className="col-span-9">
                  <CodeBlock
                    hideLineNumbers
                    value={job.command.trim()}
                    language="sql"
                    className={cn(
                      'py-2 px-3.5 max-w-full prose dark:prose-dark',
                      '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap min-h-11'
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal
        visible={toggleConfirmationModalShown}
        title={job.active ? '禁用定时任务' : '启用定时任务'}
        loading={isLoading}
        confirmLabel={job.active ? '禁用' : '启用'}
        onCancel={() => showToggleConfirmationModal(false)}
        variant={job.active ? 'destructive' : undefined}
        onConfirm={() => {
          toggleDatabaseCronJob({
            projectRef: selectedProject?.ref!,
            connectionString: selectedProject?.connectionString,
            jobId: job.jobid,
            active: !job.active,
          })
          showToggleConfirmationModal(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          <span>{`您确定想要${job.active ? '禁用' : '启用'}`}</span>{'定时任务'}
          <span className="font-bold">{`${job?.jobname}`}</span>
          <span>？</span>
        </p>
      </ConfirmationModal>
    </>
  )
}
