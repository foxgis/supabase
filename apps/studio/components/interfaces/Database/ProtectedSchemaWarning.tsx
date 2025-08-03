import { useState } from 'react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  cn,
} from 'ui'

import { INTERNAL_SCHEMAS, useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { Admonition } from 'ui-patterns'

export const ProtectedSchemaDialog = ({ onClose }: { onClose: () => void }) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>系统模式</DialogTitle>
      </DialogHeader>
      <DialogSectionSeparator />
      <DialogSection className="space-y-2 prose">
        <p className="text-sm">
          以下模式由系统管理，当前被设置为只读，无法通过本界面进行编辑。
        </p>
        <div className="flex flex-wrap gap-1">
          {INTERNAL_SCHEMAS.map((schema) => (
            <code key={schema} className="text-xs">
              {schema}
            </code>
          ))}
        </div>
        <p className="text-sm !mt-4">
          这些模式与系统的核心功能有关，我们强烈建议不要对它们进行修改。
        </p>
        <p className="text-sm">
          尽管如此，您仍然可以在数据查询中与这些模式进行交互，但是我们建议您在十分清楚影响的情况下进行操作。
        </p>
      </DialogSection>
      <DialogFooter>
        <div className="flex items-center justify-end space-x-2">
          <Button type="default" onClick={onClose}>
            已了解
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}

export const ProtectedSchemaWarning = ({
  size = 'md',
  schema,
  entity,
}: {
  size?: 'sm' | 'md'
  schema: string
  entity: string
}) => {
  const [showModal, setShowModal] = useState(false)
  const { isSchemaLocked, reason } = useIsProtectedSchema({ schema })

  if (!isSchemaLocked) return null

  return (
    <Admonition
      showIcon={false}
      type="note"
      title={
        size === 'sm' ? `正在查看系统模式` : `正在查看系统模式中的${entity}`
      }
      className={cn(
        '[&>div>p]:prose [&>div>p]:max-w-full [&>div>p]:!leading-normal',
        size === 'sm' ? '[&>div>p]:text-xs' : '[&>div>p]:text-sm'
      )}
    >
      {reason === 'fdw' ? (
        <p>
          <code className="text-xs">{schema}</code> 模式是用来连接分析存储桶的，不可编辑。
        </p>
      ) : (
        <>
          <p className="mb-2">
            <code className="text-xs">{schema}</code> 模式是由数据中间件管理的，不可编辑。
          </p>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button type="default" size="tiny" onClick={() => setShowModal(true)}>
                了解
              </Button>
            </DialogTrigger>
            <DialogContent>
              <ProtectedSchemaDialog onClose={() => setShowModal(false)} />
            </DialogContent>
          </Dialog>
        </>
      )}
    </Admonition>
  )
}
