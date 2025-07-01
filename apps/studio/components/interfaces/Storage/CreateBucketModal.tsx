import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { StorageSizeUnits } from 'components/to-be-cleaned/Storage/StorageSettings/StorageSettings.constants'
import {
  convertFromBytes,
  convertToBytes,
} from 'components/to-be-cleaned/Storage/StorageSettings/StorageSettings.utils'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useBucketCreateMutation } from 'data/storage/bucket-create-mutation'
import { IS_PLATFORM } from 'lib/constants'
import { Button, Collapsible, Form, Input, Listbox, Modal, Toggle, cn } from 'ui'
import { Admonition } from 'ui-patterns'

export interface CreateBucketModalProps {
  visible: boolean
  onClose: () => void
}

const CreateBucketModal = ({ visible, onClose }: CreateBucketModalProps) => {
  const { ref } = useParams()
  const router = useRouter()

  const { mutate: createBucket, isLoading: isCreating } = useBucketCreateMutation({
    onSuccess: (res) => {
      toast.success(`成功创建了存储桶：${res.name}`)
      router.push(`/project/${ref}/storage/buckets/${res.name}`)
      onClose()
    },
  })

  const { data } = useProjectStorageConfigQuery(
    { projectRef: ref },
    { enabled: IS_PLATFORM && visible }
  )
  const { value, unit } = convertFromBytes(data?.fileSizeLimit ?? 0)
  const formattedGlobalUploadLimit = `${value} ${unit}`

  const [selectedUnit, setSelectedUnit] = useState<StorageSizeUnits>(StorageSizeUnits.BYTES)
  const [showConfiguration, setShowConfiguration] = useState(false)

  const initialValues = {
    name: '',
    public: false,
    file_size_limit: 0,
    allowed_mime_types: '',
    has_file_size_limit: false,
    formatted_size_limit: 0,
  }

  const validate = (values: any) => {
    const errors = {} as any

    if (!values.name) {
      errors.name = '请为您的存储桶提供一个名称'
    }

    if (values.name && !/^[a-z0-9.-]+$/.test(values.name)) {
      errors.name =
        'The name of the bucket must only container lowercase letters, numbers, dots, and hyphens'
    }

    if (values.name && values.name.endsWith(' ')) {
      errors.name = '存储桶名称不能以空格结尾'
    }

    if (values.has_file_size_limit && values.formatted_size_limit < 0) {
      errors.formatted_size_limit = '上传的文件大小限制必须大于0'
    }
    if (values.name === 'public') {
      errors.name = '“public”是一个保留名称。请选择另一个名称'
    }
    return errors
  }

  const onSubmit = async (values: any) => {
    if (!ref) return console.error('未找到项目号')

    createBucket({
      projectRef: ref,
      id: values.name,
      isPublic: values.public,
      file_size_limit: values.has_file_size_limit
        ? convertToBytes(values.formatted_size_limit, selectedUnit)
        : null,
      allowed_mime_types:
        values.allowed_mime_types.length > 0
          ? values.allowed_mime_types.split(',').map((x: string) => x.trim())
          : null,
    })
  }

  useEffect(() => {
    if (visible) {
      setSelectedUnit(StorageSizeUnits.BYTES)
      setShowConfiguration(false)
    }
  }, [visible])

  return (
    <Modal
      hideFooter
      visible={visible}
      size="medium"
      header="创建存储桶"
      onCancel={() => onClose()}
    >
      <Form
        validateOnBlur={false}
        initialValues={initialValues}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ values }: { values: any }) => {
          const isPublicBucket = values.public

          return (
            <>
              <Modal.Content className={cn('!px-0', isPublicBucket && '!pb-0')}>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  className="w-full px-5"
                  layout="vertical"
                  label="存储桶名称"
                  labelOptional="存储桶名称创建后不能更改。"
                  descriptionText="仅限使用小写字母、数字、点和连字符"
                />
                <div className="flex flex-col gap-y-2 mt-6">
                  <Toggle
                    id="public"
                    name="public"
                    layout="flex"
                    className="px-5"
                    label="公开存储桶"
                    descriptionText="任何人都可以读取文件对象，无需任何授权"
                  />
                  {isPublicBucket && (
                    <Admonition
                      type="warning"
                      className="rounded-none border-x-0 border-b-0 mb-0 [&>div>p]:!leading-normal"
                      title="公开存储桶不受保护"
                    >
                      <p className="mb-2">
                        用户可以读取公开存储桶中的对象，无需任何授权。
                      </p>
                      <p>
                        其他操作需要仍需遵守行级安全（RLS）策略，例如上传和删除对象。
                      </p>
                    </Admonition>
                  )}
                </div>
              </Modal.Content>
              <Collapsible
                open={showConfiguration}
                onOpenChange={() => setShowConfiguration(!showConfiguration)}
              >
                <Collapsible.Trigger asChild>
                  <div className="w-full cursor-pointer py-3 px-5 flex items-center justify-between border-t border-default">
                    <p className="text-sm">其他配置</p>
                    <ChevronDown
                      size={18}
                      strokeWidth={2}
                      className={cn('text-foreground-light', showConfiguration && 'rotate-180')}
                    />
                  </div>
                </Collapsible.Trigger>
                <Collapsible.Content className="py-4">
                  <div className="w-full space-y-5 px-5">
                    <div className="space-y-5">
                      <Toggle
                        id="has_file_size_limit"
                        name="has_file_size_limit"
                        layout="flex"
                        label="限制存储桶中上传文件的大小"
                        descriptionText="防止上传文件的大小超过指定限制"
                      />
                      {values.has_file_size_limit && (
                        <div className="grid grid-cols-12 col-span-12 gap-x-2 gap-y-1">
                          <div className="col-span-8">
                            <Input
                              type="number"
                              step={1}
                              id="formatted_size_limit"
                              name="formatted_size_limit"
                              disabled={false}
                              onKeyPress={(event) => {
                                if (event.charCode < 48 || event.charCode > 57) {
                                  event.preventDefault()
                                }
                              }}
                              descriptionText={`相当于 ${convertToBytes(
                                values.formatted_size_limit,
                                selectedUnit
                              ).toLocaleString()} 字节。`}
                            />
                          </div>
                          <div className="col-span-4">
                            <Listbox
                              id="size_limit_units"
                              disabled={false}
                              value={selectedUnit}
                              onChange={setSelectedUnit}
                            >
                              {Object.values(StorageSizeUnits).map((unit: string) => (
                                <Listbox.Option key={unit} label={unit} value={unit}>
                                  <div>{unit}</div>
                                </Listbox.Option>
                              ))}
                            </Listbox>
                          </div>
                          {IS_PLATFORM && (
                            <div className="col-span-12">
                              <p className="text-foreground-light text-sm">
                                注意：单个存储桶上传限制仍然服从于{' '}
                                <Link
                                  href={`/project/${ref}/settings/storage`}
                                  className="font-bold underline"
                                >
                                  全局上传限制
                                </Link>{' '}
                                （{formattedGlobalUploadLimit}）
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Input
                      id="allowed_mime_types"
                      name="allowed_mime_types"
                      layout="vertical"
                      label="允许的 MIME 类型"
                      placeholder="例如 image/jpeg，image/png，audio/mpeg，video/mp4等"
                      labelOptional="使用逗号分隔值"
                      descriptionText="允许使用通配符，例如 image/*。留空表示允许任何 MIME 类型。"
                    />
                  </div>
                </Collapsible.Content>
              </Collapsible>
              <Modal.Separator />
              <Modal.Content className="flex items-center space-x-2 justify-end">
                <Button
                  type="default"
                  htmlType="button"
                  disabled={isCreating}
                  onClick={() => onClose()}
                >
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={isCreating} disabled={isCreating}>
                  保存
                </Button>
              </Modal.Content>
            </>
          )
        }}
      </Form>
    </Modal>
  )
}

export default CreateBucketModal
