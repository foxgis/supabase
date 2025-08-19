import { useParams } from 'common'
import { toast } from 'sonner'

import { useBucketEmptyMutation } from 'data/storage/bucket-empty-mutation'
import type { Bucket } from 'data/storage/buckets-query'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import {
  Button,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogSection,
  DialogSectionSeparator,
  DialogFooter,
} from 'ui'
import { Admonition } from 'ui-patterns'

export interface EmptyBucketModalProps {
  visible: boolean
  bucket?: Bucket
  onClose: () => void
}

export const EmptyBucketModal = ({ visible, bucket, onClose }: EmptyBucketModalProps) => {
  const { ref: projectRef } = useParams()
  const { fetchFolderContents } = useStorageExplorerStateSnapshot()

  const { mutate: emptyBucket, isLoading } = useBucketEmptyMutation({
    onSuccess: async () => {
      if (bucket === undefined) return
      await fetchFolderContents({
        bucketId: bucket.id,
        folderId: bucket.id,
        folderName: bucket.name,
        index: -1,
      })
      toast.success(`成功删除了存储桶 ${bucket!.name}`)
      onClose()
    },
  })

  const onEmptyBucket = async () => {
    if (!projectRef) return console.error('未找到项目号')
    if (!bucket) return console.error('未选中存储桶')
    emptyBucket({ projectRef, id: bucket.id })
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`确认删除 ${bucket?.name} 中的所有内容`}</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-4">
          <Admonition
            type="destructive"
            title="此操作无法撤销"
            description="删除存储桶后，其中的内容将无法恢复。"
          />
          <p className="text-sm">您确定要清空存储桶 "{bucket?.name}" 吗？</p>
        </DialogSection>
        <DialogFooter>
          <Button type="default" disabled={isLoading} onClick={onClose}>
            取消
          </Button>
          <Button type="danger" loading={isLoading} onClick={onEmptyBucket}>
            清空存储桶
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EmptyBucketModal
