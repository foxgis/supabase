import { FileText, Loader } from 'lucide-react'
import { DragEvent, useRef, useState } from 'react'

import SparkBar from 'components/ui/SparkBar'
import { Button } from 'ui'

interface SpreadSheetFileUploadProps {
  parseProgress: number
  uploadedFile: any
  onFileUpload: (event: any) => void
  removeUploadedFile: () => void
}

const SpreadSheetFileUpload = ({
  parseProgress,
  uploadedFile,
  onFileUpload,
  removeUploadedFile,
}: SpreadSheetFileUploadProps) => {
  const [isDraggedOver, setIsDraggedOver] = useState(false)
  const uploadButtonRef = useRef(null)

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (event.type === 'dragover' && !isDraggedOver) {
      setIsDraggedOver(true)
    } else if (event.type === 'dragleave' || event.type === 'drop') {
      setIsDraggedOver(false)
    }
    event.stopPropagation()
    event.preventDefault()
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    onDragOver(event)
    onFileUpload(event)
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm text-foreground-light">
          上传 CSV 或 TSV 文件。第一行应为表头，表头不应包含除连字符（
          <span className="text-code">-</span>）或者下划线（<span className="text-code">_</span>）之外的任何特殊字符。
        </p>
        <p className="text-sm text-foreground-light">
          提示：日期时间列应以 YYYY-MM-DD HH:mm:ss 格式。
        </p>
      </div>
      {!uploadedFile ? (
        <div
          className={`flex h-48 cursor-pointer items-center justify-center rounded-md border border-dashed border-strong ${
            isDraggedOver ? 'bg-gray-500' : ''
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragOver}
          onDrop={onDrop}
          onClick={() => (uploadButtonRef.current as any)?.click()}
        >
          <p className="text-sm">
            拖拽文件或<span className="text-brand">浏览</span>文件
          </p>
        </div>
      ) : (
        <div className="flex h-28 flex-col items-center justify-center space-y-2 rounded-md border border-dashed border-strong">
          <div className="flex items-center space-x-2">
            <FileText size={14} strokeWidth={1.5} />
            <p className="text-sm text-foreground">{uploadedFile.name}</p>
          </div>
          {parseProgress === 100 ? (
            <Button type="outline" onClick={removeUploadedFile}>
              移除文件
            </Button>
          ) : (
            <div className="flex w-3/5 items-center space-x-2">
              <Loader className="h-4 w-4 animate-spin" />
              <SparkBar
                value={parseProgress}
                max={100}
                type="horizontal"
                barClass="bg-green-900"
                labelBottom="Checking file..."
                labelTop={`${parseProgress}%`}
              />
            </div>
          )}
        </div>
      )}
      <input ref={uploadButtonRef} className="hidden" type="file" onChange={onFileUpload} />
    </div>
  )
}

export default SpreadSheetFileUpload
