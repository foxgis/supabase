import type { PostgresTable, PostgresTrigger } from '@supabase/postgres-meta'
import Image from 'next/legacy/image'
import { MutableRefObject, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { useDatabaseTriggerCreateMutation } from 'data/database-triggers/database-trigger-create-mutation'
import { useDatabaseTriggerUpdateMutation } from 'data/database-triggers/database-trigger-update-transaction-mutation'
import {
  EdgeFunctionsResponse,
  useEdgeFunctionsQuery,
} from 'data/edge-functions/edge-functions-query'
import { getTableEditor } from 'data/table-editor/table-editor-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { isValidHttpUrl, uuidv4 } from 'lib/helpers'
import { Button, Checkbox, Form, Input, Listbox, Radio, SidePanel } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import HTTPRequestFields from './HTTPRequestFields'
import { AVAILABLE_WEBHOOK_TYPES, HOOK_EVENTS } from './Hooks.constants'
import { PGTriggerCreate } from '@supabase/pg-meta/src/pg-meta-triggers'

export interface EditHookPanelProps {
  visible: boolean
  selectedHook?: PostgresTrigger
  onClose: () => void
}

export type HTTPArgument = { id: string; name: string; value: string }

const EditHookPanel = ({ visible, selectedHook, onClose }: EditHookPanelProps) => {
  const { ref } = useParams()
  const submitRef = useRef<any>(null)
  const [isEdited, setIsEdited] = useState(false)
  const [isClosingPanel, setIsClosingPanel] = useState(false)

  // [Joshen] There seems to be some bug between Checkbox.Group within the Form component
  // hence why this external state as a temporary workaround
  const [events, setEvents] = useState<string[]>([])
  const [eventsError, setEventsError] = useState<string>()

  // For HTTP request
  const [httpHeaders, setHttpHeaders] = useState<HTTPArgument[]>([])
  const [httpParameters, setHttpParameters] = useState<HTTPArgument[]>([])

  const { project } = useProjectContext()
  const { data } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: functions } = useEdgeFunctionsQuery({ projectRef: ref })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutate: createDatabaseTrigger } = useDatabaseTriggerCreateMutation({
    onSuccess: (res) => {
      toast.success(`成功创建了新的 webhook "${res.name}"`)
      setIsSubmitting(false)
      onClose()
    },
    onError: (error) => {
      setIsSubmitting(false)
      toast.error(`创建 webhook 失败: ${error.message}`)
    },
  })
  const { mutate: updateDatabaseTrigger } = useDatabaseTriggerUpdateMutation({
    onSuccess: (res) => {
      setIsSubmitting(false)
      toast.success(`成功更新了 webhook "${res.name}"`)
      onClose()
    },
    onError: (error) => {
      setIsSubmitting(false)
      toast.error(`更新 webhook 失败: ${error.message}`)
    },
  })

  const tables = useMemo(
    () => [...(data ?? [])].sort((a, b) => (a.schema > b.schema ? 0 : -1)),
    [data]
  )
  const restUrl = project?.restUrl
  const restUrlTld = restUrl ? new URL(restUrl).hostname.split('.').pop() : 'co'

  const isEdgeFunction = (url: string) =>
    url.includes(`https://${ref}.functions.supabase.${restUrlTld}/`) ||
    url.includes(`https://${ref}.supabase.${restUrlTld}/functions/`)

  const initialValues = {
    name: selectedHook?.name ?? '',
    table_id: selectedHook?.table_id ?? '',
    http_url: selectedHook?.function_args?.[0] ?? '',
    http_method: selectedHook?.function_args?.[1] ?? 'POST',
    function_type: isEdgeFunction(selectedHook?.function_args?.[0] ?? '')
      ? 'supabase_function'
      : 'http_request',
    timeout_ms: Number(selectedHook?.function_args?.[4] ?? 5000),
  }

  useEffect(() => {
    if (visible) {
      setIsEdited(false)
      setIsClosingPanel(false)

      if (selectedHook !== undefined) {
        setEvents(selectedHook.events)

        const [url, method, headers, parameters] = selectedHook.function_args

        let parsedParameters: Record<string, string> = {}

        // Try to parse the parameters with escaped quotes
        try {
          parsedParameters = JSON.parse(parameters.replace(/\\"/g, '"'))
        } catch (e) {
          // If parsing still fails, fallback to an empty object
          parsedParameters = {}
        }

        let parsedHeaders: Record<string, string> = {}
        try {
          parsedHeaders = JSON.parse(headers.replace(/\\"/g, '"'))
        } catch (e) {
          // If parsing still fails, fallback to an empty object
          parsedHeaders = {}
        }

        setHttpHeaders(
          Object.keys(parsedHeaders).map((key) => {
            return { id: uuidv4(), name: key, value: parsedHeaders[key] }
          })
        )

        setHttpParameters(
          Object.keys(parsedParameters).map((key) => {
            return { id: uuidv4(), name: key, value: parsedParameters[key] }
          })
        )
      } else {
        setEvents([])
        setHttpHeaders([{ id: uuidv4(), name: 'Content-type', value: 'application/json' }])
        setHttpParameters([{ id: uuidv4(), name: '', value: '' }])
      }
    }
  }, [visible, selectedHook])

  const onClosePanel = () => {
    if (isEdited) setIsClosingPanel(true)
    else onClose()
  }

  const onUpdateSelectedEvents = (event: string) => {
    if (events.includes(event)) {
      setEvents(events.filter((e) => e !== event))
    } else {
      setEvents(events.concat(event))
    }
    setEventsError(undefined)
  }

  const validate = (values: any) => {
    const errors: any = {}

    if (!values.name) {
      errors['name'] = '请提供 webhook 的名称'
    }
    if (!values.table_id) {
      errors['table_id'] = '请选择 webhook 触发的数据表'
    }

    if (values.function_type === 'http_request') {
      // For HTTP requests
      if (!values.http_url) {
        errors['http_url'] = '请提供 URL'
      } else if (!values.http_url.startsWith('http')) {
        errors['http_url'] = '请在 URL 中包含 HTTP/HTTPs'
      } else if (!isValidHttpUrl(values.http_url)) {
        errors['http_url'] = '请提供一个有效的 URL'
      }
    } else if (values.function_type === 'supabase_function') {
      // For Supabase Edge Functions
      if (functions?.length === 0) {
        errors['http_url'] = '无云函数可供选择'
      }
    }

    if (values.timeout_ms < 1000 || values.timeout_ms > 10_000) {
      errors['timeout_ms'] = '超时时间应设置为 1000ms 到 10,000ms 之间'
    }

    if (JSON.stringify(values) !== JSON.stringify(initialValues)) setIsEdited(true)
    return errors
  }

  const onSubmit = async (values: any) => {
    setIsSubmitting(true)
    if (!project?.ref) {
      return console.error('未找到项目号码')
    }
    if (events.length === 0) {
      return setEventsError('请至少选择一个事件')
    }

    const selectedTable = await getTableEditor({
      id: values.table_id,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    })
    if (!selectedTable) {
      setIsSubmitting(false)
      return toast.error('Unable to find selected table')
    }

    const headers = httpHeaders
      .filter((header) => header.name && header.value)
      .reduce((a: any, b: any) => {
        a[b.name] = b.value
        return a
      }, {})
    const parameters = httpParameters
      .filter((param) => param.name && param.value)
      .reduce((a: any, b: any) => {
        a[b.name] = b.value
        return a
      }, {})

    // replacer function with JSON.stringify to handle quotes properly
    const stringifiedParameters = JSON.stringify(parameters, (key, value) => {
      if (typeof value === 'string') {
        // Return the raw string without any additional escaping
        return value
      }
      return value
    })

    const payload: PGTriggerCreate = {
      events,
      activation: 'AFTER',
      orientation: 'ROW',
      name: values.name,
      table: selectedTable.name,
      schema: selectedTable.schema,
      function_name: 'http_request',
      function_schema: 'supabase_functions',
      function_args: [
        values.http_url,
        values.http_method,
        JSON.stringify(headers),
        stringifiedParameters,
        values.timeout_ms.toString(),
      ],
    }

    if (selectedHook === undefined) {
      createDatabaseTrigger({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        payload,
      })
    } else {
      updateDatabaseTrigger({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        originalTrigger: selectedHook,
        updatedTrigger: { ...payload, enabled_mode: 'ORIGIN' },
      })
    }
  }

  return (
    <>
      <SidePanel
        size="xlarge"
        visible={visible}
        header={
          selectedHook === undefined ? (
            '新建 webhook'
          ) : (
            <>
              更新 webhook <code className="text-sm">{selectedHook.name}</code>
            </>
          )
        }
        className="hooks-sidepanel mr-0 transform transition-all duration-300 ease-in-out"
        onConfirm={() => {}}
        onCancel={() => onClosePanel()}
        customFooter={
          <div className="flex w-full justify-end space-x-3 border-t border-default px-3 py-4">
            <Button
              size="tiny"
              type="default"
              htmlType="button"
              onClick={onClosePanel}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              size="tiny"
              type="primary"
              htmlType="button"
              disabled={isSubmitting}
              loading={isSubmitting}
              onClick={() => submitRef?.current?.click()}
            >
              {selectedHook === undefined ? '创建 webhook' : '更新 webhook'}
            </Button>
          </div>
        }
      >
        <Form validateOnBlur initialValues={initialValues} onSubmit={onSubmit} validate={validate}>
          {({ values, resetForm, errors }: any) => {
            return (
              <FormContents
                values={values}
                resetForm={resetForm}
                errors={errors}
                projectRef={ref}
                restUrlTld={restUrlTld}
                functions={functions}
                isEdgeFunction={isEdgeFunction}
                tables={tables}
                events={events}
                eventsError={eventsError}
                onUpdateSelectedEvents={onUpdateSelectedEvents}
                httpHeaders={httpHeaders}
                httpParameters={httpParameters}
                setHttpHeaders={setHttpHeaders}
                setHttpParameters={setHttpParameters}
                submitRef={submitRef}
                selectedHook={selectedHook}
              />
            )
          }}
        </Form>
      </SidePanel>
      <ConfirmationModal
        visible={isClosingPanel}
        title="撤销更改"
        confirmLabel="撤销"
        onCancel={() => setIsClosingPanel(false)}
        onConfirm={() => {
          setIsClosingPanel(false)
          setIsEdited(false)
          onClose()
        }}
      >
        <p className="text-sm text-foreground-light">
          存在未保存的变更。您确定想要关闭面板吗？您的变更将会丢失。
        </p>
      </ConfirmationModal>
    </>
  )
}

export default EditHookPanel

interface FormContentsProps {
  values: any
  resetForm: any
  errors: any
  projectRef?: string
  restUrlTld?: string
  selectedHook?: PostgresTrigger
  functions: EdgeFunctionsResponse[] | undefined
  isEdgeFunction: (url: string) => boolean
  tables: PostgresTable[]
  events: string[]
  eventsError?: string
  onUpdateSelectedEvents: (event: string) => void
  httpHeaders: HTTPArgument[]
  httpParameters: HTTPArgument[]
  setHttpHeaders: (arr: HTTPArgument[]) => void
  setHttpParameters: (arr: HTTPArgument[]) => void
  submitRef: MutableRefObject<any>
}

const FormContents = ({
  values,
  resetForm,
  errors,
  projectRef,
  restUrlTld,
  selectedHook,
  functions,
  isEdgeFunction,
  tables,
  events,
  eventsError,
  onUpdateSelectedEvents,
  httpHeaders,
  httpParameters,
  setHttpHeaders,
  setHttpParameters,
  submitRef,
}: FormContentsProps) => {
  useEffect(() => {
    if (values.function_type === 'http_request') {
      if (selectedHook !== undefined) {
        const [url, method] = selectedHook.function_args
        const updatedValues = { ...values, http_url: url, http_method: method }
        resetForm({ values: updatedValues, initialValues: updatedValues })
      } else {
        const updatedValues = { ...values, http_url: '' }
        resetForm({ values: updatedValues, initialValues: updatedValues })
      }
    } else if (values.function_type === 'supabase_function') {
      const fnSlug = (functions ?? [])[0]?.slug
      const defaultFunctionUrl = `https://${projectRef}.supabase.${restUrlTld}/functions/v1/${fnSlug}`
      const updatedValues = {
        ...values,
        http_url: isEdgeFunction(values.http_url) ? values.http_url : defaultFunctionUrl,
      }
      resetForm({ values: updatedValues, initialValues: updatedValues })
    }
  }, [values.function_type])

  return (
    <div>
      <FormSection header={<FormSectionLabel className="lg:!col-span-4">一般设置</FormSectionLabel>}>
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <Input
            id="name"
            name="name"
            label="名称"
            descriptionText="不要使用空格或空白字符。"
          />
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <FormSection
        header={
          <FormSectionLabel
            className="lg:!col-span-4"
            description={
              <p className="text-sm text-foreground-light">
                选择要触发 webhook 的表和事件
              </p>
            }
          >
            触发条件
          </FormSectionLabel>
        }
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <Listbox
            size="medium"
            id="table_id"
            name="table_id"
            label="表"
            descriptionText="选择要触发 webhook 的表。您只能为一个触发器选择 1 张表。"
          >
            <Listbox.Option
              key={'table-no-selection'}
              id={'table-no-selection'}
              label={'---'}
              value={'no-selection'}
            >
              ---
            </Listbox.Option>
            {tables.map((table) => (
              <Listbox.Option
                key={table.id}
                id={table.id.toString()}
                value={table.id}
                label={table.name}
              >
                <div className="flex items-center space-x-2">
                  <p className="text-foreground-light">{table.schema}</p>
                  <p className="text-foreground">{table.name}</p>
                </div>
              </Listbox.Option>
            ))}
          </Listbox>
          <Checkbox.Group
            id="events"
            name="events"
            label="事件"
            error={eventsError}
            descriptionText="这些事件是由 webhook 触发的，只有您选择的事件才会在选择的表上触发 webhook。"
          >
            {HOOK_EVENTS.map((event) => (
              <Checkbox
                key={event.value}
                value={event.value}
                label={event.label}
                description={event.description}
                checked={events.includes(event.value)}
                onChange={() => onUpdateSelectedEvents(event.value)}
              />
            ))}
          </Checkbox.Group>
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <FormSection
        header={
          <FormSectionLabel className="lg:!col-span-4">Webhook 配置</FormSectionLabel>
        }
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <Radio.Group id="function_type" name="function_type" label="webhook 类型" type="cards">
            {AVAILABLE_WEBHOOK_TYPES.map((webhook) => (
              <Radio
                key={webhook.value}
                id={webhook.value}
                value={webhook.value}
                label=""
                beforeLabel={
                  <div className="flex items-center space-x-5">
                    <Image src={webhook.icon} layout="fixed" width="32" height="32" />
                    <div className="flex-col space-y-0">
                      <div className="flex space-x-2">
                        <p className="text-foreground">{webhook.label}</p>
                      </div>
                      <p className="text-foreground-light">{webhook.description}</p>
                    </div>
                  </div>
                }
              />
            ))}
          </Radio.Group>
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />

      <HTTPRequestFields
        type={values.function_type}
        errors={errors}
        httpHeaders={httpHeaders}
        httpParameters={httpParameters}
        onAddHeader={(header?: any) => {
          if (header) setHttpHeaders(httpHeaders.concat(header))
          else setHttpHeaders(httpHeaders.concat({ id: uuidv4(), name: '', value: '' }))
        }}
        onUpdateHeader={(idx, property, value) =>
          setHttpHeaders(
            httpHeaders.map((header, i) => {
              if (idx === i) return { ...header, [property]: value }
              else return header
            })
          )
        }
        onRemoveHeader={(idx) => setHttpHeaders(httpHeaders.filter((_, i) => idx !== i))}
        onAddParameter={() =>
          setHttpParameters(httpParameters.concat({ id: uuidv4(), name: '', value: '' }))
        }
        onUpdateParameter={(idx, property, value) =>
          setHttpParameters(
            httpParameters.map((param, i) => {
              if (idx === i) return { ...param, [property]: value }
              else return param
            })
          )
        }
        onRemoveParameter={(idx) => setHttpParameters(httpParameters.filter((_, i) => idx !== i))}
      />

      <button ref={submitRef} type="submit" className="hidden" />
    </div>
  )
}
