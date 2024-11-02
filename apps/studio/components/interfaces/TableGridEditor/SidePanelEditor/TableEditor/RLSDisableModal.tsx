import { AlertOctagon, Lock, ShieldOff } from 'lucide-react'

import { DocsButton } from 'components/ui/DocsButton'
import { Alert } from 'ui'

export default function RLSDisableModalContent() {
  return (
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

      <DocsButton
        abbrev={false}
        className="w-min mt-3"
        href="https://supabase.com/docs/guides/auth/row-level-security"
      />
    </div>
  )
}
