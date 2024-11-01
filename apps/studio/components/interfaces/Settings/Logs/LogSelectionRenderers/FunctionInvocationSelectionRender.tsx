import { filterFunctionsRequestResponse } from 'lib/logs'
import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import type { PreviewLogData } from '../Logs.types'
import {
  jsonSyntaxHighlight,
  ResponseCodeFormatter,
  SelectionDetailedRow,
  SelectionDetailedTimestampRow,
} from '../LogsFormatters'

const FunctionInvocationSelectionRender = ({ log }: { log: PreviewLogData }) => {
  const metadata = log.metadata?.[0]
  const request = metadata?.request?.[0]
  const response = metadata?.response?.[0]
  const method = request?.method
  const status = response?.status_code
  const requestUrl = request?.url !== undefined ? new URL(request?.url) : undefined
  const executionTimeMs = metadata.execution_time_ms
  const deploymentId = metadata.deployment_id

  return (
    <>
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding} space-y-2`}>
        <SelectionDetailedRow
          label="状态"
          value={status}
          valueRender={<ResponseCodeFormatter value={status} />}
        />
        <SelectionDetailedRow label="方法" value={method} />
        <SelectionDetailedTimestampRow value={log.timestamp} />
        <SelectionDetailedRow label="执行时间" value={`${executionTimeMs} 毫秒`} />
        <SelectionDetailedRow label="执行 ID" value={metadata.execution_id} />
        <SelectionDetailedRow label="部署 ID" value={deploymentId} />
        <SelectionDetailedRow label="日志 ID" value={log.id} />
        {requestUrl !== undefined && (
          <SelectionDetailedRow
            label="请求路径"
            value={requestUrl.pathname + requestUrl.search}
          />
        )}
      </div>
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding}`}>
        <h3 className="text-foreground-light mb-4 font-mono text-sm uppercase">请求元数据</h3>
        <pre className="text-sm syntax-highlight overflow-x-auto mb-4">
          <div
            className="text-wrap"
            dangerouslySetInnerHTML={{
              __html: request ? jsonSyntaxHighlight(filterFunctionsRequestResponse(request)) : '',
            }}
          />
        </pre>
      </div>
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding}`}>
        <h3 className="text-foreground-light mb-4 font-mono text-sm uppercase">
          响应元数据
        </h3>
        <pre className="text-sm syntax-highlight overflow-x-auto mb-4">
          <div
            dangerouslySetInnerHTML={{
              __html: response ? jsonSyntaxHighlight(filterFunctionsRequestResponse(response)) : '',
            }}
          />
        </pre>
      </div>
    </>
  )
}

export default FunctionInvocationSelectionRender
