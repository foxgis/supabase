import { toast } from 'sonner'

import { useEnumeratedTypeDeleteMutation } from 'data/enumerated-types/enumerated-type-delete-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface DeleteEnumeratedTypeModalProps {
  visible: boolean
  selectedEnumeratedType?: any
  onClose: () => void
}

const DeleteEnumeratedTypeModal = ({
  visible,
  selectedEnumeratedType,
  onClose,
}: DeleteEnumeratedTypeModalProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { mutate: deleteEnumeratedType, isLoading: isDeleting } = useEnumeratedTypeDeleteMutation({
    onSuccess: () => {
      toast.success(`成功删除了 "${selectedEnumeratedType.name}"`)
      onClose()
    },
  })

  const onConfirmDeleteType = () => {
    if (selectedEnumeratedType === undefined) return console.error('未选择枚举类型N')
    if (project?.ref === undefined) return console.error('未找到项目号')
    if (project?.connectionString === undefined)
      return console.error('未找到项目连接字符串')

    deleteEnumeratedType({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      name: selectedEnumeratedType.name,
      schema: selectedEnumeratedType.schema,
    })
  }

  return (
    <ConfirmationModal
      variant={'destructive'}
      size="medium"
      loading={isDeleting}
      visible={visible}
      title={
        <>
          确定要删除枚举类型 <code className="text-sm">{selectedEnumeratedType?.name}</code>
        </>
      }
      confirmLabel="确定删除"
      confirmLabelLoading="正在删除..."
      onCancel={onClose}
      onConfirm={() => onConfirmDeleteType()}
      alert={{
        title: '本操作无法撤销',
        description:
          '如果希望撤销删除，您需要重新创建此枚举类型。',
      }}
    >
      <p className="text-sm">在删除此枚举类型之前，请考虑：</p>
      <ul className="space-y-2 mt-2 text-sm text-foreground-light">
        <li className="list-disc ml-6">
          此枚举类型已不在任何表或函数中使用
        </li>
      </ul>
    </ConfirmationModal>
  )
}

export default DeleteEnumeratedTypeModal
