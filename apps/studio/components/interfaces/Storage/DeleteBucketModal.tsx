import { useParams } from 'common'
import { get as _get, find } from 'lodash'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useDatabasePolicyDeleteMutation } from 'data/database-policies/database-policy-delete-mutation'
import { useBucketDeleteMutation } from 'data/storage/bucket-delete-mutation'
import { Bucket, useBucketsQuery } from 'data/storage/buckets-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'
import { formatPoliciesForStorage } from './Storage.utils'

export interface DeleteBucketModalProps {
  visible: boolean
  bucket?: Bucket
  onClose: () => void
}

const DeleteBucketModal = ({ visible = false, bucket, onClose }: DeleteBucketModalProps) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { data } = useBucketsQuery({ projectRef })
  const { data: policies } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'storage',
  })
  const { mutateAsync: deletePolicy } = useDatabasePolicyDeleteMutation()

  const { mutate: deleteBucket, isLoading: isDeleting } = useBucketDeleteMutation({
    onSuccess: async () => {
      if (!project) return console.error('未找到项目')

      // Clean up policies from the corresponding bucket that was deleted
      const storageObjectsPolicies = (policies ?? []).filter((policy) => policy.table === 'objects')
      const formattedStorageObjectPolicies = formatPoliciesForStorage(
        buckets,
        storageObjectsPolicies
      )
      const bucketPolicies = _get(
        find(formattedStorageObjectPolicies, { name: bucket!.name }),
        ['policies'],
        []
      )

      try {
        await Promise.all(
          bucketPolicies.map((policy: any) =>
            deletePolicy({
              projectRef: project?.ref,
              connectionString: project?.connectionString,
              originalPolicy: policy,
            })
          )
        )

        toast.success(`成功删除了存储桶 ${bucket?.name}`)
        router.push(`/project/${projectRef}/storage/buckets`)
        onClose()
      } catch (error) {
        toast.error(
          `成功删除了存储桶 ${bucket?.name}。然而，删除存储桶所关联的策略时出现了问题。请在存储策略模块中查看它们。`
        )
      }
    },
  })

  const buckets = data ?? []

  const onDeleteBucket = async () => {
    if (!projectRef) return console.error('未找到项目号')
    if (!bucket) return console.error('未选中存储桶')
    deleteBucket({ projectRef, id: bucket.id, type: bucket.type })
  }

  return (
    <TextConfirmModal
      variant={'destructive'}
      visible={visible}
      title={`确认删除 ${bucket?.name}`}
      confirmPlaceholder="输入存储桶名称"
      onConfirm={onDeleteBucket}
      onCancel={onClose}
      confirmString={bucket?.name ?? ''}
      loading={isDeleting}
      text={
        <>
          您将永久删除存储桶 <span className="font-bold text-foreground">{bucket?.name}</span> 及其所有内容。
        </>
      }
      alert={{
        title: '一旦删除，您将无法恢复此存储桶。',
        description: '所有存储桶数据都会丢失。',
      }}
      confirmLabel="删除存储桶"
    />
  )
}

export default DeleteBucketModal
