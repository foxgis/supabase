import { useParams } from 'common'
import Link from 'next/link'
import type { ResponseError } from 'types'
import { Alert, Button } from 'ui'

export interface StorageBucketsErrorProps {
  error: ResponseError
}

const StorageBucketsError = ({ error }: StorageBucketsErrorProps) => {
  const { ref } = useParams()

  return (
    <div className="storage-container flex items-center justify-center flex-grow">
      <div>
        <Alert
          withIcon
          variant="warning"
          title="获取存储桶失败"
          actions={[
            <Button key="contact-support" asChild type="default" className="ml-4">
              <Link
                href={`/support/new?projectRef=${ref}&category=dashboard_bug&subject=Unable%20to%20fetch%20storage%20buckets`}
              >
                联系技术支持
              </Link>
            </Button>,
          ]}
        >
          <p className="mb-1">
            请尝试刷新浏览器，如果问题仍然存在，请联系技术支持。
          </p>
          <p>错误：{(error as any)?.message ?? '未知'}</p>
        </Alert>
      </div>
    </div>
  )
}

export default StorageBucketsError
