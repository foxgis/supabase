import { zodResolver } from '@hookform/resolvers/zod'
import { snakeCase } from 'lodash'
import { ChevronDown, Edit } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { useIcebergWrapperExtension } from 'components/interfaces/Storage/AnalyticBucketDetails/useIcebergWrapper'
import { StorageSizeUnits } from 'components/interfaces/Storage/StorageSettings/StorageSettings.constants'
import { InlineLink } from 'components/ui/InlineLink'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useBucketCreateMutation } from 'data/storage/bucket-create-mutation'
import { useIcebergWrapperCreateMutation } from 'data/storage/iceberg-wrapper-create-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Switch,
  WarningIcon,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { inverseValidBucketNameRegex, validBucketNameRegex } from './CreateBucketModal.utils'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { convertFromBytes, convertToBytes } from './StorageSettings/StorageSettings.utils'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'

const FormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Please provide a name for your bucket')
      .max(100, 'Bucket name should be below 100 characters')
      .refine(
        (value) => !value.endsWith(' '),
        'The name of the bucket cannot end with a whitespace'
      )
      .refine(
        (value) => value !== 'public',
        '"public" is a reserved name. Please choose another name'
      ),
    type: z.enum(['STANDARD', 'ANALYTICS']).default('STANDARD'),
    public: z.boolean().default(false),
    has_file_size_limit: z.boolean().default(false),
    formatted_size_limit: z.coerce
      .number()
      .min(0, 'File size upload limit has to be at least 0')
      .default(0),
    allowed_mime_types: z.string().trim().default(''),
  })
  .superRefine((data, ctx) => {
    if (!validBucketNameRegex.test(data.name)) {
      const [match] = data.name.match(inverseValidBucketNameRegex) ?? []
      ctx.addIssue({
        path: ['name'],
        code: z.ZodIssueCode.custom,
        message: !!match
          ? `Bucket name cannot contain the "${match}" character`
          : 'Bucket name contains an invalid special character',
      })
    }
  })

const formId = 'create-storage-bucket-form'

export type CreateBucketForm = z.infer<typeof FormSchema>

const CreateBucketModal = () => {
  const [visible, setVisible] = useState(false)
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()
  const router = useRouter()
  const { can: canCreateBuckets } = useAsyncCheckProjectPermissions(
    PermissionAction.STORAGE_WRITE,
    '*'
  )

  const { mutateAsync: createBucket, isLoading: isCreating } = useBucketCreateMutation({
    // [Joshen] Silencing the error here as it's being handled in onSubmit
    onError: () => {},
  })
  const { mutateAsync: createIcebergWrapper, isLoading: isCreatingIcebergWrapper } =
    useIcebergWrapperCreateMutation()

  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { value, unit } = convertFromBytes(data?.fileSizeLimit ?? 0)
  const formattedGlobalUploadLimit = `${value} ${unit}`

  const [selectedUnit, setSelectedUnit] = useState<string>(StorageSizeUnits.BYTES)
  const [showConfiguration, setShowConfiguration] = useState(false)

  const form = useForm<CreateBucketForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      public: false,
      type: 'STANDARD',
      has_file_size_limit: false,
      formatted_size_limit: 0,
      allowed_mime_types: '',
    },
  })

  const bucketName = snakeCase(form.watch('name'))
  const isPublicBucket = form.watch('public')
  const isStandardBucket = form.watch('type') === 'STANDARD'
  const hasFileSizeLimit = form.watch('has_file_size_limit')
  const formattedSizeLimit = form.watch('formatted_size_limit')
  const icebergWrapperExtensionState = useIcebergWrapperExtension()
  const icebergCatalogEnabled = data?.features?.icebergCatalog?.enabled

  const onSubmit: SubmitHandler<CreateBucketForm> = async (values) => {
    if (!ref) return console.error('未找到项目号')

    if (values.type === 'ANALYTICS' && !icebergCatalogEnabled) {
      toast.error(
        '分析存储桶功能未启用，请联系支持以启用该功能。'
      )
      return
    }

    try {
      const fileSizeLimit = values.has_file_size_limit
        ? convertToBytes(values.formatted_size_limit, selectedUnit as StorageSizeUnits)
        : undefined

      const allowedMimeTypes =
        values.allowed_mime_types.length > 0
          ? values.allowed_mime_types.split(',').map((x) => x.trim())
          : undefined

      await createBucket({
        projectRef: ref,
        id: values.name,
        type: values.type,
        isPublic: values.public,
        file_size_limit: fileSizeLimit,
        allowed_mime_types: allowedMimeTypes,
      })
      sendEvent({
        action: 'storage_bucket_created',
        properties: { bucketType: values.type },
        groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
      })

      if (values.type === 'ANALYTICS' && icebergWrapperExtensionState === 'installed') {
        await createIcebergWrapper({ bucketName: values.name })
      }
      form.reset()
      setSelectedUnit(StorageSizeUnits.BYTES)
      setShowConfiguration(false)
      setVisible(false)
      toast.success(`Successfully created bucket ${values.name}`)
      router.push(`/project/${ref}/storage/buckets/${values.name}`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to create bucket')
    }
  }

  const handleClose = () => {
    form.reset()
    setSelectedUnit(StorageSizeUnits.BYTES)
    setShowConfiguration(false)
    setVisible(false)
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          handleClose()
        }
      }}
    >
      <DialogTrigger asChild>
        <ButtonTooltip
          block
          type="default"
          icon={<Edit />}
          disabled={!canCreateBuckets}
          style={{ justifyContent: 'start' }}
          onClick={() => setVisible(true)}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canCreateBuckets
                ? '您需要额外的权限才能创建存储桶'
                : undefined,
            },
          }}
        >
          新建存储桶
        </ButtonTooltip>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建存储桶</DialogTitle>
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
                    labelOptional="存储桶名称不能更改。"
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ id="name" {...field} placeholder="输入存储桶名称" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                key="type"
                name="type"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="存储桶类型">
                    <FormControl_Shadcn_>
                      <RadioGroupStacked
                        id="type"
                        value={field.value}
                        onValueChange={(v) => field.onChange(v)}
                      >
                        <RadioGroupStackedItem
                          id="STANDARD"
                          value="STANDARD"
                          label="标准存储桶"
                          description="与 S3 存储桶兼容。"
                          showIndicator={false}
                        />
                        {IS_PLATFORM && (
                          <RadioGroupStackedItem
                            id="ANALYTICS"
                            value="ANALYTICS"
                            label="分析存储桶"
                            showIndicator={false}
                            disabled={!icebergCatalogEnabled}
                          >
                            <>
                              <p className="text-foreground-light text-left">
                                存储 Iceberg 文件并针对分析工作负载进行了优化。
                              </p>

                              {icebergCatalogEnabled ? null : (
                                <div className="w-full flex gap-x-2 py-2 items-center">
                                  <WarningIcon />
                                  <span className="text-xs text-left">
                                    此功能当前处于 alpha 阶段，尚不支持您的项目。请{' '}
                                    <InlineLink href="https://forms.supabase.com/analytics-buckets">
                                      这里
                                    </InlineLink>{' '}
                                    申请启用。
                                  </span>
                                </div>
                              )}
                            </>
                          </RadioGroupStackedItem>
                        )}
                      </RadioGroupStacked>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <DialogSectionSeparator />

              {isStandardBucket ? (
                <>
                  <FormField_Shadcn_
                    key="public"
                    name="public"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout
                        name="public"
                        label="公开存储桶"
                        description="任何人都可以读取任何对象，无需任何授权"
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
                  {isPublicBucket && (
                    <Admonition
                      type="warning"
                      className="rounded-none border-x-0 border-b-0 mb-0 pb-0 px-0 [&>svg]:left-0 [&>div>p]:!leading-normal"
                      title="公开存储桶不受保护"
                      description={
                        <>
                          <p className="mb-2">
                            公开存储桶中的对象无需任何授权即可读取。
                          </p>
                          <p>
                            其他操作，例如对象上传和删除，仍然需要遵守行级安全 (RLS) 策略。
                          </p>
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
                              <div className="col-span-12">
                                <p className="text-foreground-light text-sm">
                                  注意：单个存储桶上传文件大小仍然服从于 {formattedGlobalUploadLimit} 的{' '}
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
                            labelOptional="逗号分隔值"
                            description="允许使用通配符，例如 image/*。 留空表示允许任何 MIME 类型。"
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
                </>
              ) : (
                <>
                  {icebergWrapperExtensionState === 'installed' ? (
                    <Label_Shadcn_ className="text-foreground-lighter leading-1 flex flex-col gap-y-2">
                      <p>
                        <span>系统将设置一个</span>
                        <a
                          href={`${BASE_PATH}/project/${ref}/integrations/iceberg_wrapper/overview`}
                          target="_blank"
                          className="underline text-foreground-light"
                        >
                          外部数据包装器
                          {bucketName && <span className="text-brand"> {`${bucketName}_fdw`}</span>}
                        </a>
                        <span>
                          {' '}
                          以方便访问数据。 此操作还将创建{' '}
                          <a
                            href={`${BASE_PATH}/project/${ref}/storage/access-keys`}
                            target="_blank"
                            className="underline text-foreground-light"
                          >
                            S3 访问密钥
                            {bucketName && (
                              <>
                                {' '}
                                命名为 <span className="text-brand"> {`${bucketName}_keys`}</span>
                              </>
                            )}
                          </a>
                          <span> 以及 </span>
                          <a
                            href={`${BASE_PATH}/project/${ref}/integrations/vault/secrets`}
                            target="_blank"
                            className="underline text-foreground-light"
                          >
                            四个 Vault 密钥
                            {bucketName && (
                              <>
                                {' '}
                                前缀为{' '}
                                <span className="text-brand"> {`${bucketName}_vault_`}</span>
                              </>
                            )}
                          </a>
                          .
                        </span>
                      </p>
                      <p>
                        最后，在数据库连接到 Iceberg 数据之前，您需要创建一个{' '}
                        <span className="text-foreground-light">Iceberg 命名空间</span>。
                      </p>
                    </Label_Shadcn_>
                  ) : (
                    <Alert_Shadcn_ variant="warning">
                      <WarningIcon />
                      <AlertTitle_Shadcn_>
                        您需要安装 Iceberg 包装器扩展才能将您的分析存储桶连接到数据库。
                      </AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_ className="flex flex-col gap-y-2">
                        <p>
                          如果您想将分析存储桶连接到数据库，您需要安装 <span className="text-brand">wrappers</span> 扩展（最低版本为{' '}
                          <span>0.5.3</span>）。
                        </p>
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
                  )}
                </>
              )}
            </form>
          </Form_Shadcn_>
        </DialogSection>
        <DialogFooter>
          <Button
            type="default"
            disabled={isCreating || isCreatingIcebergWrapper}
            onClick={() => setVisible(false)}
          >
            取消
          </Button>
          <Button
            form={formId}
            htmlType="submit"
            loading={isCreating || isCreatingIcebergWrapper}
            disabled={isCreating || isCreatingIcebergWrapper}
          >
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateBucketModal
