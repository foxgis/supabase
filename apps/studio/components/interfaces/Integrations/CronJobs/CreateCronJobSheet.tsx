import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { toString as CronToString } from 'cronstrue'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useWatch } from '@ui/components/shadcn/ui/form'
import { urlRegex } from 'components/interfaces/Auth/Auth.constants'
import EnableExtensionModal from 'components/interfaces/Database/Extensions/EnableExtensionModal'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { getDatabaseCronJob } from 'data/database-cron-jobs/database-cron-job-query'
import { useDatabaseCronJobCreateMutation } from 'data/database-cron-jobs/database-cron-jobs-create-mutation'
import { CronJob } from 'data/database-cron-jobs/database-cron-jobs-infinite-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Separator,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  WarningIcon,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { CRONJOB_DEFINITIONS } from './CronJobs.constants'
import {
  buildCronQuery,
  buildHttpRequestCommand,
  cronPattern,
  parseCronJobCommand,
  secondsPattern,
} from './CronJobs.utils'
import { CronJobScheduleSection } from './CronJobScheduleSection'
import { EdgeFunctionSection } from './EdgeFunctionSection'
import { HttpBodyFieldSection } from './HttpBodyFieldSection'
import { HTTPHeaderFieldsSection } from './HttpHeaderFieldsSection'
import { HttpRequestSection } from './HttpRequestSection'
import { SqlFunctionSection } from './SqlFunctionSection'
import { SqlSnippetSection } from './SqlSnippetSection'

export interface CreateCronJobSheetProps {
  selectedCronJob?: Pick<CronJob, 'jobname' | 'schedule' | 'active' | 'command'>
  supportsSeconds: boolean
  isClosing: boolean
  setIsClosing: (v: boolean) => void
  onClose: () => void
}

const edgeFunctionSchema = z.object({
  type: z.literal('edge_function'),
  method: z.enum(['GET', 'POST']),
  edgeFunctionName: z.string().trim().min(1, '请从列表中选择一个云函数'),
  timeoutMs: z.coerce.number().int().gte(1000).lte(5000).default(1000),
  httpHeaders: z.array(z.object({ name: z.string(), value: z.string() })),
  httpBody: z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) return true
      try {
        JSON.parse(value)
        return true
      } catch {
        return false
      }
    }, '输入必须为有效的 JSON'),
  // When editing a cron job, we want to keep the original command as a snippet in case the user wants to manually edit it
  snippet: z.string().trim(),
})

const httpRequestSchema = z.object({
  type: z.literal('http_request'),
  method: z.enum(['GET', 'POST']),
  endpoint: z
    .string()
    .trim()
    .min(1, '请提供 URL')
    .regex(urlRegex(), '请提供有效的 URL')
    .refine((value) => value.startsWith('http'), '请在您的 URL 中包含 HTTP/HTTPs'),
  timeoutMs: z.coerce.number().int().gte(1000).lte(5000).default(1000),
  httpHeaders: z.array(z.object({ name: z.string(), value: z.string() })),
  httpBody: z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) return true
      try {
        JSON.parse(value)
        return true
      } catch {
        return false
      }
    }, '输入必须为有效的 JSON'),
  // When editing a cron job, we want to keep the original command as a snippet in case the user wants to manually edit it
  snippet: z.string().trim(),
})

const sqlFunctionSchema = z.object({
  type: z.literal('sql_function'),
  schema: z.string().trim().min(1, '请从列表中选择一个数据库模式'),
  functionName: z.string().trim().min(1, '请从列表中选择一个数据库函数'),
  // When editing a cron job, we want to keep the original command as a snippet in case the user wants to manually edit it
  snippet: z.string().trim(),
})
const sqlSnippetSchema = z.object({
  type: z.literal('sql_snippet'),
  snippet: z.string().trim().min(1),
})

const FormSchema = z
  .object({
    name: z.string().trim().min(1, '请提供定时任务的名称'),
    supportsSeconds: z.boolean(),
    schedule: z
      .string()
      .trim()
      .min(1)
      .refine((value) => {
        if (cronPattern.test(value)) {
          try {
            CronToString(value)
            return true
          } catch {
            return false
          }
        } else if (secondsPattern.test(value)) {
          return true
        }
        return false
      }, '无效的 Cron 格式'),
    values: z.discriminatedUnion('type', [
      edgeFunctionSchema,
      httpRequestSchema,
      sqlFunctionSchema,
      sqlSnippetSchema,
    ]),
  })
  .superRefine((data, ctx) => {
    if (!cronPattern.test(data.schedule)) {
      if (!(data.supportsSeconds && secondsPattern.test(data.schedule))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'pg_cron v1.5.0+ 才支持设置秒，请使用有效的 Cron 格式。',
          path: ['schedule'],
        })
      }
    }
  })

export type CreateCronJobForm = z.infer<typeof FormSchema>
export type CronJobType = CreateCronJobForm['values']

const FORM_ID = 'create-cron-job-sidepanel'

const buildCommand = (values: CronJobType) => {
  let command = ''
  if (values.type === 'edge_function') {
    command = buildHttpRequestCommand(
      values.method,
      values.edgeFunctionName,
      values.httpHeaders,
      values.httpBody,
      values.timeoutMs
    )
  } else if (values.type === 'http_request') {
    command = buildHttpRequestCommand(
      values.method,
      values.endpoint,
      values.httpHeaders,
      values.httpBody,
      values.timeoutMs
    )
  } else if (values.type === 'sql_function') {
    command = `SELECT ${values.schema}.${values.functionName}()`
  }
  return command
}

export const CreateCronJobSheet = ({
  selectedCronJob,
  supportsSeconds,
  isClosing,
  setIsClosing,
  onClose,
}: CreateCronJobSheetProps) => {
  const { project } = useProjectContext()
  const { data: org } = useSelectedOrganizationQuery()
  const [searchQuery] = useQueryState('search', parseAsString.withDefault(''))
  const [isLoadingGetCronJob, setIsLoadingGetCronJob] = useState(false)

  const isEditing = !!selectedCronJob?.jobname
  const [showEnableExtensionModal, setShowEnableExtensionModal] = useState(false)

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const pgNetExtension = (data ?? []).find((ext) => ext.name === 'pg_net')
  const pgNetExtensionInstalled = pgNetExtension?.installed_version != undefined

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: upsertCronJob, isLoading: isUpserting } = useDatabaseCronJobCreateMutation()
  const isLoading = isLoadingGetCronJob || isUpserting

  const canToggleExtensions = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'extensions'
  )

  const cronJobValues = parseCronJobCommand(selectedCronJob?.command || '', project?.ref!)

  const form = useForm<CreateCronJobForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: selectedCronJob?.jobname || '',
      schedule: selectedCronJob?.schedule || '*/5 * * * *',
      supportsSeconds,
      values: cronJobValues,
    },
  })

  const isEdited = form.formState.isDirty
  // if the form hasn't been touched and the user clicked esc or the backdrop, close the sheet
  if (!isEdited && isClosing) onClose()

  const onClosePanel = () => {
    if (isEdited) {
      setIsClosing(true)
    } else {
      onClose()
    }
  }

  const [
    cronType,
    endpoint,
    edgeFunctionName,
    method,
    httpHeaders,
    httpBody,
    timeoutMs,
    schema,
    functionName,
  ] = useWatch({
    control: form.control,
    name: [
      'values.type',
      'values.endpoint',
      'values.edgeFunctionName',
      'values.method',
      'values.httpHeaders',
      'values.httpBody',
      'values.timeoutMs',
      'values.schema',
      'values.functionName',
    ],
  })

  // update the snippet field when the user changes the any values in the form
  useEffect(() => {
    const command = buildCommand({
      type: cronType,
      method,
      edgeFunctionName,
      timeoutMs,
      httpHeaders,
      httpBody,
      functionName,
      schema,
      endpoint,
      snippet: '',
    })
    if (command) {
      form.setValue('values.snippet', command)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    edgeFunctionName,
    endpoint,
    method,
    // for some reason, the httpHeaders are not memoized and cause the useEffect to trigger even when the value is the same
    JSON.stringify(httpHeaders),
    httpBody,
    timeoutMs,
    schema,
    functionName,
    form,
  ])

  const onSubmit: SubmitHandler<CreateCronJobForm> = async ({ name, schedule, values }) => {
    if (!project) return console.error('未找到项目')

    if (!isEditing) {
      try {
        setIsLoadingGetCronJob(true)
        const checkExistingJob = await getDatabaseCronJob({
          projectRef: project.ref,
          connectionString: project.connectionString,
          name,
        })
        const nameExists = !!checkExistingJob

        if (nameExists) {
          return form.setError('name', {
            type: 'manual',
            message: '已存在具有此名称的定时任务',
          })
        }
      } catch (error: any) {
        toast.error(`验证定时任务名称失败: ${error.message}`)
      } finally {
        setIsLoadingGetCronJob(false)
      }
    }

    const command = `$$${values.snippet}$$`
    const query = buildCronQuery(name, schedule, command)

    upsertCronJob(
      {
        projectRef: project!.ref,
        connectionString: project?.connectionString,
        query,
        searchTerm: searchQuery,
      },
      {
        onSuccess: () => {
          if (isEditing) {
            toast.success(`已成功更新定时任务 ${name}`)
          } else {
            toast.success(`已成功创建定时任务 ${name}`)
          }

          if (isEditing) {
            sendEvent({
              action: 'cron_job_updated',
              properties: {
                type: values.type,
                schedule: schedule,
              },
              groups: {
                project: project?.ref ?? '未知项目',
                organization: org?.slug ?? '未知组织',
              },
            })
          } else {
            sendEvent({
              action: 'cron_job_created',
              properties: {
                type: values.type,
                schedule: schedule,
              },
              groups: {
                project: project?.ref ?? '未知项目',
                organization: org?.slug ?? '未知组织',
              },
            })
          }

          setIsClosing(true)
        },
      }
    )
    setIsLoadingGetCronJob(false)
  }

  return (
    <>
      <div className="flex flex-col h-full" tabIndex={-1}>
        <SheetHeader>
          <SheetTitle>
            {isEditing ? `编辑定时任务 ${selectedCronJob.jobname}` : `创建新的定时任务`}
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-auto flex-grow">
          <Form_Shadcn_ {...form}>
            <form
              id={FORM_ID}
              className="flex-grow overflow-auto"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <SheetSection>
                <FormField_Shadcn_
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItemLayout label="名称" layout="vertical" className="gap-1 relative">
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ {...field} disabled={isEditing} />
                      </FormControl_Shadcn_>
                      <span className="text-foreground-lighter text-xs absolute top-0 right-0">
                        定时任务创建后无法重命名
                      </span>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>
              <Separator />
              <CronJobScheduleSection form={form} supportsSeconds={supportsSeconds} />
              <Separator />
              <SheetSection>
                <FormField_Shadcn_
                  control={form.control}
                  name="values.type"
                  render={({ field }) => (
                    <FormItemLayout label="任务类型" layout="vertical" className="gap-1">
                      <FormControl_Shadcn_>
                        <RadioGroupStacked
                          id="function_type"
                          name="function_type"
                          value={field.value}
                          disabled={field.disabled}
                          onValueChange={(value) => field.onChange(value)}
                        >
                          {CRONJOB_DEFINITIONS.map((definition) => (
                            <RadioGroupStackedItem
                              key={definition.value}
                              id={definition.value}
                              value={definition.value}
                              disabled={
                                !pgNetExtensionInstalled &&
                                (definition.value === 'http_request' ||
                                  definition.value === 'edge_function')
                              }
                              label=""
                              showIndicator={false}
                            >
                              <div className="flex items-center gap-x-5">
                                <div className="text-foreground">{definition.icon}</div>
                                <div className="flex flex-col">
                                  <div className="flex gap-x-2">
                                    <p className="text-foreground">{definition.label}</p>
                                  </div>
                                  <p className="text-foreground-light">{definition.description}</p>
                                </div>
                              </div>
                              {!pgNetExtensionInstalled &&
                              (definition.value === 'http_request' ||
                                definition.value === 'edge_function') ? (
                                <div className="w-full flex gap-x-2 pl-11 py-2 items-center">
                                  <WarningIcon />
                                  <span className="text-xs">
                                    需安装 <code className="text-xs">pg_net</code> 扩展才能使用此类型
                                  </span>
                                </div>
                              ) : null}
                            </RadioGroupStackedItem>
                          ))}
                        </RadioGroupStacked>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
                {!pgNetExtensionInstalled && (
                  <Admonition
                    type="note"
                    // @ts-ignore
                    title={
                      <span>
                        启用 <code className="text-xs w-min">pg_net</code> 扩展以使用 HTTP 请求或云函数
                      </span>
                    }
                    description={
                      <div className="flex flex-col gap-y-2">
                        <span>
                          这将允许您在定时任务中发送 HTTP 请求或触发云函数
                        </span>
                        <ButtonTooltip
                          type="default"
                          className="w-min"
                          disabled={!canToggleExtensions}
                          onClick={() => setShowEnableExtensionModal(true)}
                          tooltip={{
                            content: {
                              side: 'bottom',
                              text: !canToggleExtensions
                                ? '您需要额外的权限才能启用数据库扩展'
                                : undefined,
                            },
                          }}
                        >
                          安装 pg_net 扩展
                        </ButtonTooltip>
                      </div>
                    }
                  />
                )}
              </SheetSection>
              <Separator />
              {cronType === 'http_request' && (
                <>
                  <HttpRequestSection form={form} />
                  <Separator />
                  <HTTPHeaderFieldsSection variant={cronType} />
                  <Separator />
                  <HttpBodyFieldSection form={form} />
                </>
              )}
              {cronType === 'edge_function' && (
                <>
                  <EdgeFunctionSection form={form} />
                  <Separator />
                  <HTTPHeaderFieldsSection variant={cronType} />
                  <Separator />
                  <HttpBodyFieldSection form={form} />
                </>
              )}
              {cronType === 'sql_function' && <SqlFunctionSection form={form} />}
              {cronType === 'sql_snippet' && <SqlSnippetSection form={form} />}
            </form>
          </Form_Shadcn_>
        </div>
        <SheetFooter>
          <Button
            size="tiny"
            type="default"
            htmlType="button"
            onClick={onClosePanel}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            size="tiny"
            type="primary"
            form={FORM_ID}
            htmlType="submit"
            disabled={isLoading}
            loading={isLoading}
          >
            {isEditing ? `保存定时任务` : '创建定时任务'}
          </Button>
        </SheetFooter>
      </div>
      <ConfirmationModal
        visible={isClosing}
        title="撤销定时任务"
        confirmLabel="撤销"
        onCancel={() => setIsClosing(false)}
        onConfirm={() => onClose()}
      >
        <p className="text-sm text-foreground-light">
          有未保存的变更，您确定想要关闭此面版吗？您的变更将会丢失
        </p>
      </ConfirmationModal>
      {pgNetExtension && (
        <EnableExtensionModal
          visible={showEnableExtensionModal}
          extension={pgNetExtension}
          onCancel={() => setShowEnableExtensionModal(false)}
        />
      )}
    </>
  )
}
