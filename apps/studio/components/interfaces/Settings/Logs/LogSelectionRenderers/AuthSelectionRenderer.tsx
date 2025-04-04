import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import type { PreviewLogData } from '../Logs.types'
import {
  jsonSyntaxHighlight,
  ResponseCodeFormatter,
  SelectionDetailedRow,
  SelectionDetailedTimestampRow,
  SeverityFormatter,
} from '../LogsFormatters'

const AuthSelectionRenderer = ({ log }: { log: PreviewLogData }) => {
  return (
    <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding} space-y-6`}>
      <div className="flex flex-col gap-3">
        <h3 className="text-foreground-lighter text-sm">事件消息</h3>
        <div className="text-xs text-wrap font-mono text-foreground whitespace-pre-wrap overflow-x-auto">
          {log.metadata?.msg || log.event_message}
        </div>
      </div>

      <SelectionDetailedTimestampRow value={log.timestamp} />
      {log.metadata?.status && (
        <SelectionDetailedRow
          label="状态"
          value={String(log.metadata?.status)}
          valueRender={<ResponseCodeFormatter value={log.metadata?.status} />}
        />
      )}
      {log.metadata?.level && (
        <SelectionDetailedRow
          label="日志级别"
          value={log.metadata?.level}
          valueRender={<SeverityFormatter value={log.metadata?.level} />}
        />
      )}
      {log.metadata?.path && (
        <SelectionDetailedRow label="请求路径" value={log.metadata?.path} />
      )}
      {log.metadata?.error && (
        <SelectionDetailedRow label="错误消息" value={log.metadata?.error} />
      )}

      <div className="flex flex-col gap-3">
        <h3 className="text-foreground-lighter text-sm">元数据</h3>
        <pre
          className=" className={`text-foreground text-sm col-span-8 overflow-x-auto text-xs font-mono`}"
          dangerouslySetInnerHTML={{
            __html: jsonSyntaxHighlight(log.metadata!),
          }}
        />
      </div>
    </div>
  )
}

export default AuthSelectionRenderer
