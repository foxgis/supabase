import { useMonaco } from '@monaco-editor/react'
import { useLocalStorage } from '@uidotdev/usehooks'
import dayjs from 'dayjs'
import { editor } from 'monaco-editor'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useParams } from 'common'

import {
  LOGS_LARGE_DATE_RANGE_DAYS_THRESHOLD,
  LOGS_TABLES,
  TEMPLATES,
} from 'components/interfaces/Settings/Logs/Logs.constants'
import {
  DatePickerToFrom,
  LogTemplate,
  LogsWarning,
} from 'components/interfaces/Settings/Logs/Logs.types'
import {
  maybeShowUpgradePrompt,
  useEditorHints,
} from 'components/interfaces/Settings/Logs/Logs.utils'
import LogsQueryPanel from 'components/interfaces/Settings/Logs/LogsQueryPanel'
import LogTable from 'components/interfaces/Settings/Logs/LogTable'
import UpgradePrompt from 'components/interfaces/Settings/Logs/UpgradePrompt'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import LoadingOpacity from 'components/ui/LoadingOpacity'
import ShimmerLine from 'components/ui/ShimmerLine'
import { useContentQuery } from 'data/content/content-query'
import {
  UpsertContentPayload,
  useContentUpsertMutation,
} from 'data/content/content-upsert-mutation'
import useLogsQuery from 'hooks/analytics/useLogsQuery'
import { useLogsUrlState } from 'hooks/analytics/useLogsUrlState'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useUpgradePrompt } from 'hooks/misc/useUpgradePrompt'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import type { LogSqlSnippets, NextPageWithLayout } from 'types'
import {
  Button,
  Form,
  Input,
  Modal,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from 'ui'

const LOCAL_PLACEHOLDER_QUERY =
  'select\n  timestamp, event_message, metadata\n  from edge_logs limit 5'

const PLATFORM_PLACEHOLDER_QUERY =
  'select\n  cast(timestamp as datetime) as timestamp,\n  event_message, metadata \nfrom edge_logs \nlimit 5'

const PLACEHOLDER_QUERY = IS_PLATFORM ? PLATFORM_PLACEHOLDER_QUERY : LOCAL_PLACEHOLDER_QUERY

export const LogsExplorerPage: NextPageWithLayout = () => {
  useEditorHints()
  const monaco = useMonaco()
  const router = useRouter()
  const { profile } = useProfile()
  const { ref, q, queryId, source: routerSource } = useParams()
  const projectRef = ref as string
  const organization = useSelectedOrganization()

  const editorRef = useRef<editor.IStandaloneCodeEditor>()
  const [editorId] = useState<string>(uuidv4())
  const { timestampStart, timestampEnd, setTimeRange } = useLogsUrlState()

  const [editorValue, setEditorValue] = useState<string>(PLACEHOLDER_QUERY)
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false)
  const [warnings, setWarnings] = useState<LogsWarning[]>([])
  const [selectedLog, setSelectedLog] = useState<any>(null)

  const [recentLogs, setRecentLogs] = useLocalStorage<LogSqlSnippets.Content[]>(
    `project-content-${projectRef}-recent-log-sql`,
    []
  )

  const { data: content } = useContentQuery({
    projectRef: ref,
    type: 'log_sql',
  })
  const query = content?.content.find((x) => x.id === queryId)
  const {
    params,
    logData,
    error,
    isLoading: logsLoading,
    changeQuery,
    runQuery,
  } = useLogsQuery(
    projectRef,
    {
      iso_timestamp_start: timestampStart,
      iso_timestamp_end: timestampEnd,
    },
    true
  )

  const results = logData
  const isLoading = logsLoading

  const { mutate: upsertContent, isLoading: isUpsertingContent } = useContentUpsertMutation({
    onError: (e) => {
      const error = e as { message: string }
      console.error(error)
      setSaveModalOpen(false)
      if (queryId) {
        toast.error(`更新查询失败：${error.message}`)
      } else {
        toast.error(`保存查询失败：${error.message}`)
      }
    },
    onSuccess: (_data, vars) => {
      setSaveModalOpen(false)
      if (queryId) {
        toast.success(`已更新 "${vars.payload.name}" 日志查询`)
      } else {
        toast.success(`已保存 "${vars.payload.name}" 日志查询`)
      }
    },
  })

  const addRecentLogSqlSnippet = (snippet: Partial<LogSqlSnippets.Content>) => {
    const defaults: LogSqlSnippets.Content = {
      schema_version: '1',
      favorite: false,
      sql: '',
      content_id: '',
    }
    setRecentLogs([...recentLogs, { ...defaults, ...snippet }])
  }

  const { showUpgradePrompt, setShowUpgradePrompt } = useUpgradePrompt(
    params.iso_timestamp_start as string
  )

  const onSelectTemplate = (template: LogTemplate) => {
    if (editorRef.current && monaco) {
      const editorModel = editorRef.current?.getModel()

      editorRef.current.pushUndoStop()
      editorRef.current.executeEdits(`insert-identifier`, [
        {
          text: template.searchString,
          range: editorModel?.getFullModelRange() ?? new monaco.Range(1, 1, 1, 1),
        },
      ])
      editorRef.current.pushUndoStop()
      editorRef.current.focus()
    }

    addRecentLogSqlSnippet({ sql: template.searchString })
  }

  const handleRun = (value?: string | React.MouseEvent<HTMLButtonElement>) => {
    const query = typeof value === 'string' ? value || editorValue : editorValue

    changeQuery(query)
    runQuery()
    router.push({
      pathname: router.pathname,
      query: { ...router.query, q: query },
    })
    addRecentLogSqlSnippet({ sql: query })
  }

  const handleInsertSource = (source: string) => {
    if (editorRef.current && monaco) {
      const editorModel = editorRef.current?.getModel()
      const currentValue = editorRef.current.getValue()
      const index = currentValue.indexOf('from')

      const updatedValue =
        index < 0
          ? `${currentValue}${source}`
          : `${currentValue.substring(0, index + 4)} ${source} ${currentValue.substring(index + 5)}`

      editorRef.current.pushUndoStop()
      editorRef.current.executeEdits(`insert-identifier`, [
        {
          text: updatedValue,
          range: editorModel?.getFullModelRange() ?? new monaco.Range(1, 1, 1, 1),
        },
      ])
      editorRef.current.pushUndoStop()
      editorRef.current.focus()
    }
  }

  const handleCreateQuery = async (values: any, { setSubmitting }: any) => {
    if (!projectRef) return console.error('未找到项目号')
    if (!profile) return console.error('未找到用户资料')
    setSubmitting(true)

    const id = uuidv4()
    const payload: UpsertContentPayload = {
      id,
      name: values.name,
      description: values.description || '',
      type: 'log_sql' as const,
      content: {
        content_id: editorId,
        sql: editorValue,
        schema_version: '1',
        favorite: false,
      } as LogSqlSnippets.Content,
      owner_id: profile.id,
      visibility: 'user' as const,
    }
    upsertContent(
      { projectRef, payload },
      {
        onSuccess: () => router.push(`/project/${projectRef}/logs/explorer?queryId=${id}`),
      }
    )
  }

  function handleOnSave() {
    if (!projectRef) return console.error('未找到项目号')

    // if we have a queryId, we are editing a saved query
    if (queryId && query) {
      upsertContent({
        projectRef: projectRef!,
        payload: {
          ...query,
          content: { ...(query.content as LogSqlSnippets.Content), sql: editorValue },
        },
      })

      return
    }

    setSaveModalOpen(!saveModalOpen)
  }

  const handleDateChange = ({ to, from }: DatePickerToFrom) => {
    const shouldShowUpgradePrompt = maybeShowUpgradePrompt(from, organization?.plan?.id)

    if (shouldShowUpgradePrompt) {
      setShowUpgradePrompt(!showUpgradePrompt)
    } else {
      setTimeRange(from || '', to || '')
    }
  }

  useEffect(() => {
    if (q) {
      setEditorValue(q)
    }
  }, [q])

  useEffect(() => {
    let newWarnings = []
    const start = timestampStart ? dayjs(timestampStart) : dayjs()
    const end = timestampEnd ? dayjs(timestampEnd) : dayjs()
    const daysDiff = Math.abs(start.diff(end, 'days'))

    if (daysDiff >= LOGS_LARGE_DATE_RANGE_DAYS_THRESHOLD) {
      newWarnings.push({
        text: '查询大时间跨度的日志可能会很慢。请考虑指定一个更小的时间范围。',
      })
    }
    if (editorValue && !editorValue.toLowerCase().includes('limit')) {
      newWarnings.push({ text: '当查询大时间跨度时，请包含 LIMIT 子句。' })
    }
    setWarnings(newWarnings)
  }, [editorValue, timestampStart, timestampEnd])

  // Show the prompt on page load based on query params
  useEffect(() => {
    if (timestampStart) {
      const shouldShowUpgradePrompt = maybeShowUpgradePrompt(timestampStart, organization?.plan?.id)
      if (shouldShowUpgradePrompt) {
        setShowUpgradePrompt(!showUpgradePrompt)
      }
    }
  }, [timestampStart, organization])

  return (
    <div className="w-full h-full mx-auto">
      <ResizablePanelGroup
        className="w-full h-full max-h-screen"
        direction="vertical"
        autoSaveId={LOCAL_STORAGE_KEYS.LOG_EXPLORER_SPLIT_SIZE}
      >
        <ResizablePanel collapsible minSize={5}>
          <LogsQueryPanel
            defaultFrom={timestampStart || ''}
            defaultTo={timestampEnd || ''}
            onDateChange={handleDateChange}
            onSelectSource={handleInsertSource}
            templates={TEMPLATES.filter((template) => template.mode === 'custom')}
            onSelectTemplate={onSelectTemplate}
            warnings={warnings}
          />
          <ShimmerLine active={isLoading} />
          <CodeEditor
            id={editorId}
            editorRef={editorRef}
            language="pgsql"
            defaultValue={editorValue}
            onInputChange={(v) => setEditorValue(v || '')}
            actions={{ runQuery: { enabled: true, callback: handleRun } }}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel collapsible minSize={5} className="overflow-auto">
          <LoadingOpacity active={isLoading}>
            <LogTable
              isSaving={isUpsertingContent}
              showHistogramToggle={false}
              onRun={handleRun}
              onSave={handleOnSave}
              hasEditorValue={Boolean(editorValue)}
              data={results}
              error={error}
              projectRef={projectRef}
              onSelectedLogChange={setSelectedLog}
              selectedLog={selectedLog}
            />

            <div className="flex flex-row justify-end mt-2">
              <UpgradePrompt show={showUpgradePrompt} setShowUpgradePrompt={setShowUpgradePrompt} />
            </div>
          </LoadingOpacity>
        </ResizablePanel>
      </ResizablePanelGroup>

      <Modal
        size="medium"
        onCancel={() => setSaveModalOpen(!saveModalOpen)}
        header="保存日志查询"
        visible={saveModalOpen}
        hideFooter
      >
        <Form
          initialValues={{
            name: '',
            desdcription: '',
          }}
          onSubmit={handleCreateQuery}
        >
          {() => (
            <>
              <Modal.Content className="space-y-6">
                <Input layout="horizontal" label="Name" id="name" />
                <div className="text-area-text-sm">
                  <Input.TextArea
                    layout="horizontal"
                    labelOptional="可选的"
                    label="描述"
                    id="description"
                    rows={2}
                  />
                </div>
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content className="flex items-center justify-end gap-2">
                <Button size="tiny" type="default" onClick={() => setSaveModalOpen(!saveModalOpen)}>
                  取消
                </Button>
                <Button
                  size="tiny"
                  loading={isUpsertingContent}
                  disabled={isUpsertingContent}
                  htmlType="submit"
                >
                  保存
                </Button>
              </Modal.Content>
            </>
          )}
        </Form>
      </Modal>
    </div>
  )
}

LogsExplorerPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout>{page}</LogsLayout>
  </DefaultLayout>
)

export default LogsExplorerPage
