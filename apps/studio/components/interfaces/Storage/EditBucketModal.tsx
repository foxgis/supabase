import { useParams } from 'common'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Alert,
  Button,
  Collapsible,
  Form,
  IconChevronDown,
  Input,
  Listbox,
  Modal,
  Toggle,
  cn,
} from 'ui'

import { StorageSizeUnits } from 'components/to-be-cleaned/Storage/StorageSettings/StorageSettings.constants'
import {
  convertFromBytes,
  convertToBytes,
} from 'components/to-be-cleaned/Storage/StorageSettings/StorageSettings.utils'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useBucketUpdateMutation } from 'data/storage/bucket-update-mutation'
import { IS_PLATFORM } from 'lib/constants'
import type { StorageBucket } from './Storage.types'

export interface EditBucketModalProps {
  visible: boolean
  bucket?: StorageBucket
  onClose: () => void
}

const EditBucketModal = ({ visible, bucket, onClose }: EditBucketModalProps) => {
  const { ref } = useParams()

  const { mutate: updateBucket, isLoading: isUpdating } = useBucketUpdateMutation({
    onSuccess: () => {
      toast.success(`成功更新了存储桶 "${bucket?.name}"`)
      onClose()
    },
  })
  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { value, unit } = convertFromBytes(data?.fileSizeLimit ?? 0)
  const formattedGlobalUploadLimit = `${value} ${unit}`

  const [selectedUnit, setSelectedUnit] = useState<StorageSizeUnits>(StorageSizeUnits.BYTES)
  const [showConfiguration, setShowConfiguration] = useState(false)

  const validate = (values: any) => {
    const errors = {} as any
    if (values.has_file_size_limit && values.formatted_size_limit < 0) {
      errors.formatted_size_limit = '上传文件大小限制必须大于等于 0'
    }
    return errors
  }

  const onSubmit = async (values: any) => {
    if (bucket === undefined) return console.error('未找到存储桶')
    if (ref === undefined) return console.error('未找到项目号')

    updateBucket({
      projectRef: ref,
      id: bucket.id,
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
      const { unit } = convertFromBytes(bucket?.file_size_limit ?? 0)
      setSelectedUnit(unit)
      setShowConfiguration(false)
    }
  }, [visible])

  return (
    <Modal
      hideFooter
      visible={visible}
      size="medium"
      header={`编辑存储桶 "${bucket?.name}"`}
      onCancel={onClose}
    >
      <Form validateOnBlur={false} initialValues={{}} validate={validate} onSubmit={onSubmit}>
        {({ values, resetForm }: { values: any; resetForm: any }) => {
          // [Alaister] although this "technically" is breaking the rules of React hooks
          // it won't error because the hooks are always rendered in the same order
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useEffect(() => {
            if (visible && bucket !== undefined) {
              const { value: fileSizeLimit } = convertFromBytes(bucket.file_size_limit ?? 0)

              const values = {
                name: bucket.name ?? '',
                public: bucket.public,
                file_size_limit: bucket.file_size_limit,
                allowed_mime_types: (bucket.allowed_mime_types ?? []).join(', '),

                has_file_size_limit: bucket.file_size_limit !== null,
                formatted_size_limit: fileSizeLimit ?? 0,
              }
              resetForm({ values, initialValues: values })
            }
          }, [visible])

          return (
            <>
              <Modal.Content>
                <Input
                  disabled
                  id="name"
                  name="name"
                  type="text"
                  className="w-full"
                  layout="vertical"
                  label="存储桶名称"
                  labelOptional="存储桶一旦创建就不能再改名"
                />
                <div className="space-y-2 mt-6">
                  <Toggle
                    id="public"
                    name="public"
                    layout="flex"
                    label="公开存储桶"
                    descriptionText="任何人都可以读取存储桶中的任何对象，无需任何授权"
                  />
                  {bucket?.public !== values.public && (
                    <Alert
                      title={
                        !bucket?.public && values.public
                          ? '警告：将存储桶设为公开'
                          : bucket?.public && !values.public
                            ? '警告：将存储桶设为私有'
                            : ''
                      }
                      variant="warning"
                      withIcon
                    >
                      <p className="mb-2">
                        {!bucket?.public && values.public
                          ? `此操作将使存储桶 "${bucket?.name}" 中的所有对象公开`
                          : bucket?.public && !values.public
                            ? `存储桶 "${bucket?.name}" 中的所有对象都将设为私有，仅可通过签名 URL 或正确的授权头进行访问`
                            : ''}
                      </p>
                    </Alert>
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
                    <IconChevronDown
                      size={18}
                      strokeWidth={2}
                      className={cn('text-foreground-light', showConfiguration && 'rotate-180')}
                    />
                  </div>
                </Collapsible.Trigger>
                <Collapsible.Content className="py-4">
                  <div className="w-full space-y-4 px-5">
                    <div className="space-y-2">
                      <Toggle
                        id="has_file_size_limit"
                        name="has_file_size_limit"
                        layout="flex"
                        label="限制存储桶上传文件的大小"
                        descriptionText="防止上传超过指定大小的文件"
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
                                注意：{' '}
                                <Link
                                  href={`/project/${ref}/settings/storage`}
                                  className="text-brand opacity-80 hover:opacity-100 transition"
                                >
                                  全局上传限制
                                </Link>{' '}
                                优先于此限制值（{formattedGlobalUploadLimit}）
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
                <Button type="default" disabled={isUpdating} onClick={() => onClose()}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={isUpdating} disabled={isUpdating}>
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

export default EditBucketModal
