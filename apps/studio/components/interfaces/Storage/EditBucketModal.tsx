import { useParams } from 'common'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSectionSeparator,
  DialogSection,
  DialogTitle,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Switch,
  cn,
} from 'ui'

import { StorageSizeUnits } from 'components/interfaces/Storage/StorageSettings/StorageSettings.constants'
import {
  convertFromBytes,
  convertToBytes,
} from 'components/interfaces/Storage/StorageSettings/StorageSettings.utils'
import { InlineLink } from 'components/ui/InlineLink'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useBucketUpdateMutation } from 'data/storage/bucket-update-mutation'
import { IS_PLATFORM } from 'lib/constants'
import { Admonition } from 'ui-patterns'
import { Bucket } from 'data/storage/buckets-query'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { isNonNullable } from 'lib/isNonNullable'

export interface EditBucketModalProps {
  visible: boolean
  bucket: Bucket
  onClose: () => void
}

const BucketSchema = z.object({
  name: z.string(),
  public: z.boolean().default(false),
  has_file_size_limit: z.boolean().default(false),
  formatted_size_limit: z.coerce
    .number()
    .min(0, 'File size upload limit has to be at least 0')
    .default(0),
  allowed_mime_types: z.string().trim().default(''),
})

const formId = 'edit-storage-bucket-form'

export const EditBucketModal = ({ visible, bucket, onClose }: EditBucketModalProps) => {
  const { ref } = useParams()

  const { mutate: updateBucket, isLoading: isUpdating } = useBucketUpdateMutation()
  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { value, unit } = convertFromBytes(data?.fileSizeLimit ?? 0)
  const formattedGlobalUploadLimit = `${value} ${unit}`

  const [selectedUnit, setSelectedUnit] = useState<string>(StorageSizeUnits.BYTES)
  const [showConfiguration, setShowConfiguration] = useState(false)
  const { value: fileSizeLimit } = convertFromBytes(bucket?.file_size_limit ?? 0)

  const form = useForm<z.infer<typeof BucketSchema>>({
    resolver: zodResolver(BucketSchema),
    defaultValues: {
      name: bucket?.name ?? '',
      public: bucket?.public,
      has_file_size_limit: isNonNullable(bucket?.file_size_limit),
      formatted_size_limit: fileSizeLimit ?? 0,
      allowed_mime_types: (bucket?.allowed_mime_types ?? []).join(', '),
    },
    values: {
      name: bucket?.name ?? '',
      public: bucket?.public,
      has_file_size_limit: isNonNullable(bucket?.file_size_limit),
      formatted_size_limit: fileSizeLimit ?? 0,
      allowed_mime_types: (bucket?.allowed_mime_types ?? []).join(', '),
    },
    mode: 'onSubmit',
  })

  const isPublicBucket = form.watch('public')
  const hasFileSizeLimit = form.watch('has_file_size_limit')
  const formattedSizeLimit = form.watch('formatted_size_limit')
  const isChangingBucketVisibility = bucket?.public !== isPublicBucket
  const isMakingBucketPrivate = bucket?.public && !isPublicBucket
  const isMakingBucketPublic = !bucket?.public && isPublicBucket

  const onSubmit: SubmitHandler<z.infer<typeof BucketSchema>> = async (values) => {
    if (bucket === undefined) return console.error('未找到存储桶')
    if (ref === undefined) return console.error('未找到项目号')

    updateBucket(
      {
        projectRef: ref,
        id: bucket.id,
        isPublic: values.public,
        file_size_limit: values.has_file_size_limit
          ? convertToBytes(values.formatted_size_limit, selectedUnit as StorageSizeUnits)
          : null,
        allowed_mime_types:
          values.allowed_mime_types.length > 0
            ? values.allowed_mime_types.split(',').map((x: string) => x.trim())
            : null,
      },
      {
        onSuccess: () => {
          toast.success(`成功更新了存储桶 "${bucket?.name}"`)
          onClose()
        },
      }
    )
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          form.reset()
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`编辑存储桶 "${bucket?.name}"`}</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <Form_Shadcn_ {...form}>
            <form
              id={formId}
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField_Shadcn_
                key="name"
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="name"
                    label="存储桶名称"
                    labelOptional="存储桶名称不能更改"
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ id="name" {...field} disabled />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <FormField_Shadcn_
                key="public"
                name="public"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="public"
                    label="公开存储桶"
                    description="任何人都可以无需授权即可读取任何对象"
                    layout="flex"
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        id="public"
                        size="large"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              {isChangingBucketVisibility && (
                <Admonition
                  type="warning"
                  className="rounded-none border-x-0 border-b-0 mb-0 pb-0 px-0 [&>svg]:left-0 [&>div>p]:!leading-normal"
                  title={
                    isMakingBucketPublic
                      ? '警告：将存储桶变更为公开'
                      : isMakingBucketPrivate
                        ? '警告：将存储桶变更为私有'
                        : ''
                  }
                  description={
                    <>
                      {isMakingBucketPublic ? (
                        <p>`此操作将使您的存储桶中的所有对象公开可访问。`</p>
                      ) : isMakingBucketPrivate ? (
                        <p>
                          `此操作将使您的存储桶中的所有对象私有，只能通过签名 URL 或使用正确的授权头下载。`
                        </p>
                      ) : null}

                      {isMakingBucketPrivate && (
                        <p>
                          {
                            '已缓存到 CDN 上的资源仍然可以公开访问，您可以尝试'
                          }
                          <InlineLink href="https://supabase.com/docs/guides/storage/cdn/smart-cdn#cache-eviction">
                            清除缓存
                          </InlineLink>
                          {' 或将资源移到新的存储桶。'}
                        </p>
                      )}
                    </>
                  }
                />
              )}
              <Collapsible_Shadcn_
                open={showConfiguration}
                onOpenChange={() => setShowConfiguration(!showConfiguration)}
              >
                <CollapsibleTrigger_Shadcn_ asChild>
                  <button className="w-full cursor-pointer py-3 flex items-center justify-between border-t border-default">
                    <p className="text-sm">其他配置</p>
                    <ChevronDown
                      size={18}
                      strokeWidth={2}
                      className={cn('text-foreground-light', showConfiguration && 'rotate-180')}
                    />
                  </button>
                </CollapsibleTrigger_Shadcn_>
                <CollapsibleContent_Shadcn_ className="py-4 space-y-4">
                  <div className="space-y-2">
                    <FormField_Shadcn_
                      key="has_file_size_limit"
                      name="has_file_size_limit"
                      control={form.control}
                      render={({ field }) => (
                        <FormItemLayout
                          name="has_file_size_limit"
                          label="限制存储桶上传文件的大小"
                          description="防止上传大于指定限制的文件"
                          layout="flex"
                        >
                          <FormControl_Shadcn_>
                            <Switch
                              id="has_file_size_limit"
                              size="large"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />
                    {hasFileSizeLimit && (
                      <div className="grid grid-cols-12 col-span-12 gap-x-2 gap-y-1">
                        <div className="col-span-8">
                          <FormField_Shadcn_
                            key="formatted_size_limit"
                            name="formatted_size_limit"
                            control={form.control}
                            render={({ field }) => (
                              <FormItemLayout
                                name="formatted_size_limit"
                                description={`相当于 ${convertToBytes(
                                  formattedSizeLimit,
                                  selectedUnit as StorageSizeUnits
                                ).toLocaleString()} 字节。`}
                              >
                                <FormControl_Shadcn_>
                                  <Input_Shadcn_
                                    id="formatted_size_limit"
                                    aria-label="文件大小限制"
                                    type="number"
                                    min={0}
                                    {...field}
                                  />
                                </FormControl_Shadcn_>
                              </FormItemLayout>
                            )}
                          />
                        </div>
                        <Select_Shadcn_ value={selectedUnit} onValueChange={setSelectedUnit}>
                          <SelectTrigger_Shadcn_
                            aria-label="文件大小限制的单位"
                            size="small"
                            className="col-span-4"
                          >
                            <SelectValue_Shadcn_ asChild>
                              <>{selectedUnit}</>
                            </SelectValue_Shadcn_>
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            {Object.values(StorageSizeUnits).map((unit: string) => (
                              <SelectItem_Shadcn_ key={unit} value={unit} className="text-xs">
                                <div>{unit}</div>
                              </SelectItem_Shadcn_>
                            ))}
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                        {IS_PLATFORM && (
                          <div className="col-span-12 mt-2">
                            <p className="text-foreground-light text-sm">
                              注意：每个存储桶的上传限制仍受 {formattedGlobalUploadLimit} 的{' '}
                              <Link
                                href={`/project/${ref}/settings/storage`}
                                className="font-bold underline"
                              >
                                全局上传限制
                              </Link>{' '}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <FormField_Shadcn_
                    key="allowed_mime_types"
                    name="allowed_mime_types"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout
                        name="allowed_mime_types"
                        label="允许的 MIME 类型"
                        labelOptional="逗号分隔的值"
                        description="允许使用通配符，例如 image/*。 留空以允许任何 MIME 类型。"
                      >
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            id="allowed_mime_types"
                            {...field}
                            placeholder="例如 image/jpeg, image/png, audio/mpeg, video/mp4, 等"
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </CollapsibleContent_Shadcn_>
              </Collapsible_Shadcn_>
            </form>
          </Form_Shadcn_>
        </DialogSection>
        <DialogFooter>
          <Button
            type="default"
            disabled={isUpdating}
            onClick={() => {
              form.reset()
              onClose()
            }}
          >
            取消
          </Button>
          <Button form={formId} htmlType="submit" loading={isUpdating}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditBucketModal
