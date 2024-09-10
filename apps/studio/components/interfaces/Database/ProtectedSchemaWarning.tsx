import { useState } from 'react'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button, Modal } from 'ui'

import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { AlertCircle } from 'lucide-react'

export const ProtectedSchemaModal = ({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) => {
  return (
    <Modal
      size="medium"
      visible={visible}
      header="系统模式"
      customFooter={
        <div className="flex items-center justify-end space-x-2">
          <Button type="default" onClick={() => onClose()}>
            已了解
          </Button>
        </div>
      }
      onCancel={() => onClose()}
    >
      <Modal.Content className="space-y-2">
        <p className="text-sm">
          以下模式由系统管理，当前被设置为只读，无法通过本界面进行编辑。
        </p>
        <div className="flex flex-wrap gap-1">
          {EXCLUDED_SCHEMAS.map((schema) => (
            <code key={schema} className="text-xs">
              {schema}
            </code>
          ))}
        </div>
        <p className="text-sm !mt-4">
          这些模式与系统的核心功能有关，我们强烈建议不要对它们进行修改。
        </p>
        <p className="text-sm">
          尽管如此，你仍然可以通过 SQL 编辑器与这些模式进行交互，但是我们建议你在十分清楚影响的情况下进行操作。
        </p>
      </Modal.Content>
    </Modal>
  )
}

const ProtectedSchemaWarning = ({ schema, entity }: { schema: string; entity: string }) => {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Alert_Shadcn_>
<<<<<<< HEAD
        <IconAlertCircle strokeWidth={2} />
        <AlertTitle_Shadcn_>当前正在一个受保护的模式下查看{entity}</AlertTitle_Shadcn_>
=======
        <AlertCircle strokeWidth={2} />
        <AlertTitle_Shadcn_>Currently viewing {entity} from a protected schema</AlertTitle_Shadcn_>
>>>>>>> upstream/master
        <AlertDescription_Shadcn_>
          <p className="mb-2">
            模式 <code className="text-xs">{schema}</code> 是由系统管理的，当前被设置为只读，无法通过本界面进行编辑。
          </p>
          <Button type="default" size="tiny" onClick={() => setShowModal(true)}>
            了解更多
          </Button>
        </AlertDescription_Shadcn_>
      </Alert_Shadcn_>
      <ProtectedSchemaModal visible={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}

export default ProtectedSchemaWarning
