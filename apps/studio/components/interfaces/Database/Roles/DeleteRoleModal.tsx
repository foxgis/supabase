import type { PostgresRole } from '@supabase/postgres-meta'
import { toast } from 'sonner'

import { useDatabaseRoleDeleteMutation } from 'data/database-roles/database-role-delete-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Modal } from 'ui'

interface DeleteRoleModalProps {
  role: PostgresRole
  visible: boolean
  onClose: () => void
}

const DeleteRoleModal = ({ role, visible, onClose }: DeleteRoleModalProps) => {
  const { data: project } = useSelectedProjectQuery()

  const { mutate: deleteDatabaseRole, isLoading: isDeleting } = useDatabaseRoleDeleteMutation({
    onSuccess: () => {
      toast.success(`成功删除了角色：${role.name}`)
      onClose()
    },
  })

  const deleteRole = async () => {
    if (!project) return console.error('未找到项目')
    if (!role) return console.error('删除角色失败：角色不存在')
    deleteDatabaseRole({
      projectRef: project.ref,
      connectionString: project.connectionString,
      id: role.id,
    })
  }

  return (
    <Modal
      size="small"
      alignFooter="right"
      visible={visible}
      onCancel={onClose}
      onConfirm={deleteRole}
      header={<h3>确定要删除角色 "{role?.name}"</h3>}
      loading={isDeleting}
    >
      <Modal.Content>
        <p className="text-sm">
          这将自动撤销此角色在其他角色中的成员资格，本操作无法撤消。
        </p>
      </Modal.Content>
    </Modal>
  )
}

export default DeleteRoleModal
