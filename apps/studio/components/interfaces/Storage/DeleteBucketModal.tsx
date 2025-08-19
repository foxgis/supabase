import { get as _get, find } from 'lodash'
import { useRouter } from 'next/router'
import { SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useDatabasePolicyDeleteMutation } from 'data/database-policies/database-policy-delete-mutation'
import { useBucketDeleteMutation } from 'data/storage/bucket-delete-mutation'
import { Bucket, useBucketsQuery } from 'data/storage/buckets-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { formatPoliciesForStorage } from './Storage.utils'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

export interface DeleteBucketModalProps {
  visible: boolean
  bucket: Bucket
  onClose: () => void
}

const formId = `delete-storage-bucket-form`

export const DeleteBucketModal = ({ visible, bucket, onClose }: DeleteBucketModalProps) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const schema = z.object({
    confirm: z.literal(bucket.name, {
      errorMap: () => ({ message: `Please enter "${bucket.name}" to confirm` }),
    }),
  })

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  })

  const { data } = useBucketsQuery({ projectRef })
  const { data: policies } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'storage',
  })
  const { mutateAsync: deletePolicy } = useDatabasePolicyDeleteMutation()

  const { mutate: deleteBucket, isLoading } = useBucketDeleteMutation({
    onSuccess: async () => {
      if (!project) return console.error('未找到项目')

      // Clean up policies from the corresponding bucket that was deleted
      const storageObjectsPolicies = (policies ?? []).filter((policy) => policy.table === 'objects')
      const formattedStorageObjectPolicies = formatPoliciesForStorage(
        buckets,
        storageObjectsPolicies
      )
      const bucketPolicies = _get(
        find(formattedStorageObjectPolicies, { name: bucket.name }),
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

        toast.success(`成功删除了存储桶 ${bucket.name}`)
        router.push(`/project/${projectRef}/storage/buckets`)
        onClose()
      } catch (error) {
        toast.success(
          `成功删除了存储桶 ${bucket.name}。然而，删除存储桶所关联的策略时出现了问题。请在存储策略模块中查看它们。`
        )
      }
    },
  })

  const buckets = data ?? []

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async () => {
    if (!projectRef) return console.error('未找到项目号')
    if (!bucket) return console.error('未选中存储桶')
    deleteBucket({ projectRef, id: bucket.id, type: bucket.type })
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
          <DialogTitle>{`确认删除 ${bucket.name}`}</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-4">
          <Admonition
            type="destructive"
            title="删除后无法恢复"
            description="存储桶中的所有数据将被永久删除。"
          />
          <p>
            存储桶 <span className="font-bold text-foreground">{bucket.name}</span> 及其所有内容将被永久删除。
          </p>
        </DialogSection>
        <DialogSectionSeparator />
        <DialogSection>
          <Form_Shadcn_ {...form}>
            <form
              id={formId}
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField_Shadcn_
                key="confirm"
                name="confirm"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="confirm"
                    label={
                      <>
                        输入 <span className="font-bold text-foreground">{bucket.name}</span> 以确认删除。
                      </>
                    }
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        id="confirm"
                        autoComplete="off"
                        {...field}
                        placeholder={`输入存储桶的名称`}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form_Shadcn_>
        </DialogSection>
        <DialogFooter>
          <Button type="default" disabled={isLoading} onClick={onClose}>
            取消
          </Button>
          <Button form={formId} htmlType="submit" type="danger" loading={isLoading}>
            删除存储桶
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteBucketModal
