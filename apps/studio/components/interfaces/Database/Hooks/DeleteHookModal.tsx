import type { PostgresTrigger } from '@supabase/postgres-meta'
import { toast } from 'sonner'

import { useDatabaseTriggerDeleteMutation } from 'data/database-triggers/database-trigger-delete-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

interface DeleteHookModalProps {
  visible: boolean
  selectedHook?: PostgresTrigger
  onClose: () => void
}

const DeleteHookModal = ({ selectedHook, visible, onClose }: DeleteHookModalProps) => {
  const { name, schema } = selectedHook ?? {}

  const { data: project } = useSelectedProjectQuery()
  const { mutate: deleteDatabaseTrigger, isLoading: isDeleting } = useDatabaseTriggerDeleteMutation(
    {
      onSuccess: () => {
        toast.success(`成功删除了 ${name}`)
        onClose()
      },
    }
  )

  async function handleDelete() {
    if (!project) {
      return toast.error('未找到项目')
    }
    if (!selectedHook) {
      return toast.error('无法找到选中的 webhook')
    }

    deleteDatabaseTrigger({
      trigger: selectedHook,
      projectRef: project.ref,
      connectionString: project.connectionString,
    })
  }

  return (
    <TextConfirmModal
      variant="destructive"
      visible={visible}
      size="medium"
      onCancel={() => onClose()}
      onConfirm={handleDelete}
      title="删除 webhook"
      loading={isDeleting}
      confirmLabel={`删除 ${name}`}
      confirmPlaceholder="输入 webhook 名称"
      confirmString={name || ''}
      text={
        <>
          此操作将会从 <span className="text-bold text-foreground">{schema}</span> 模式中删除 webhook <span className="text-bold text-foreground">{name}</span>。
        </>
      }
      alert={{ title: '删除后无法恢复' }}
    />
  )
}

export default DeleteHookModal
