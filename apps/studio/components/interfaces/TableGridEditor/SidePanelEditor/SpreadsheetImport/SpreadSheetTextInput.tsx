import { Input } from 'ui'

interface SpreadSheetTextInputProps {
  input: string
  onInputChange: (event: any) => void
}

const SpreadSheetTextInput = ({ input, onInputChange }: SpreadSheetTextInputProps) => (
  <div className="space-y-10">
    <div>
      <p className="mb-2 text-sm text-foreground-light">
        从表格程序如 Google Sheets 或 Excel 中复制表格并粘贴到下方的区域。第一行应为表头，表头不应包含除连字符（
        <code>-</code>）或者下划线（<code>_</code>）之外的任何特殊字符。
      </p>
      <p className="text-sm text-foreground-lighter">
        提示：日期时间列应以 YYYY/MM/DD HH:mm:ss 格式。
      </p>
    </div>
    <Input.TextArea
      size="tiny"
      className="font-mono"
      rows={15}
      style={{ resize: 'none' }}
      value={input}
      onChange={onInputChange}
    />
  </div>
)

export default SpreadSheetTextInput
