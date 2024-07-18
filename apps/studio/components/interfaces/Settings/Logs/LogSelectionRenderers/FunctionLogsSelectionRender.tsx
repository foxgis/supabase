import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import {
  jsonSyntaxHighlight,
  SelectionDetailedRow,
  SelectionDetailedTimestampRow,
  SeverityFormatter,
} from '../LogsFormatters'

const FunctionLogsSelectionRender = ({ log }: any) => {
  const metadata = log.metadata[0]

  return (
    <>
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding}`}>
        <span className="text-foreground-lighter text-sm col-span-4">Event message</span>
        <div className="text-xs text-wrap font-mono text-foreground mt-2 whitespace-pre-wrap overflow-x-auto">
          {log.event_message}
        </div>
      </div>
      <div className="h-px w-full bg-panel-border-interior-light [[data-theme*=dark]_&]:bg-panel-border-interior-dark"></div>
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding} space-y-2`}>
        <SelectionDetailedRow
          label="日志级别"
          value={metadata.level}
          valueRender={<SeverityFormatter value={metadata.level} />}
        />
        <SelectionDetailedRow label="部署版本" value={metadata.version} />
        <SelectionDetailedTimestampRow value={log.timestamp} />
        <SelectionDetailedRow label="执行 ID" value={metadata.execution_id} />
        <SelectionDetailedRow label="部署 ID" value={metadata.deployment_id} />
      </div>
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding}`}>
        <h3 className="text-lg text-foreground mb-4">元数据</h3>
        <pre className="text-sm syntax-highlight overflow-x-auto">
          <div
            className="text-wrap"
            dangerouslySetInnerHTML={{
              __html: metadata ? jsonSyntaxHighlight(metadata) : '',
            }}
          />
        </pre>
      </div>
    </>
  )
}

export default FunctionLogsSelectionRender
