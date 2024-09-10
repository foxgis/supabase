import { AlertOctagon, BookOpen, Lock, ShieldOff } from 'lucide-react'
import Link from 'next/link'
import { Alert, Button } from 'ui'

export default function RLSDisableModalContent() {
  return (
    <div className="my-6">
      <div className="text-sm text-foreground-light grid gap-4">
        <div className="grid gap-1">
          <Alert
            variant="warning"
            className="!px-4 !py-3"
            title="This table will be publicly readable and writable"
            withIcon
          >
            <p>所有人都可以编辑或删除这张表的数据。</p>
          </Alert>
          <ul className="mt-4 space-y-5">
            <li className="flex gap-3">
              <AlertOctagon />
              <span>所有对这张表的请求都将会被接受。</span>
            </li>

            <li className="flex gap-3">
              <ShieldOff />
              <span>认证授权策略将不会被执行。</span>
            </li>

            <li className="flex gap-3">
              <Lock size={14} className="flex-shrink-0" />
              <div>
                <strong>您在关闭行级安全之前，请先考虑：</strong>
                <ul className="space-y-2 mt-2">
                  <li className="list-disc ml-4">
                    这张表中的任何个人信息都将会被公开访问。
                  </li>
                  <li className="list-disc ml-4">
                    任何人都可以编辑或删除这张表中的任何数据。
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </div>

        <div className="mt-3">
          <p className="mt-2">
            <Button asChild type="default" icon={<BookOpen strokeWidth={1.5} />}>
              <Link
                href="https://supabase.com/docs/guides/auth/row-level-security"
                target="_blank"
                rel="noreferrer"
              >
                RLS 文档
              </Link>
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
