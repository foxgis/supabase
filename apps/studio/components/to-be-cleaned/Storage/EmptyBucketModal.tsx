import { useParams } from 'common'
import { toast } from 'sonner'

import { useBucketEmptyMutation } from 'data/storage/bucket-empty-mutation'
import type { Bucket } from 'data/storage/buckets-query'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

export interface EmptyBucketModalProps {
  visible: boolean
  bucket?: Bucket
  onClose: () => void
}

export const EmptyBucketModal = ({ visible = false, bucket, onClose }: EmptyBucketModalProps) => {
  const { ref: projectRef } = useParams()
  const { fetchFolderContents } = useStorageExplorerStateSnapshot()

  const { mutate: emptyBucket, isLoading } = useBucketEmptyMutation({
    onSuccess: async () => {
      if (bucket === undefined) return
      await fetchFolderContents({ folderId: bucket.id, folderName: bucket.name, index: -1 })
      toast.success(`成功清空了存储桶 ${bucket!.name}`)
      onClose()
    },
  })

  const onEmptyBucket = async () => {
    if (!projectRef) return console.error('未找到项目号')
    if (!bucket) return console.error('未选中存储桶')
    emptyBucket({ projectRef, id: bucket.id })
  }

  return (
    <ConfirmationModal
      variant={'destructive'}
      size="small"
      title={`确认要清空存储桶 "${bucket?.name}" 中的所有内容？`}
      confirmLabel="清空存储桶"
      visible={visible}
      loading={isLoading}
      onCancel={() => onClose()}
      onConfirm={onEmptyBucket}
      alert={{
        title: '本操作无法撤销',
        description: '存储桶中的内容一旦删除，无法恢复',
      }}
    >
      <p className="text-sm">您确定要清空存储桶 "{bucket?.name}" ？</p>
    </ConfirmationModal>
  )
}
