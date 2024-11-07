import { noop } from 'lodash'
import { useEffect, useState } from 'react'
import { Alert, Button, Modal } from 'ui'
import { StorageItem } from '../Storage.types'
import { STORAGE_ROW_TYPES } from '../Storage.constants'

interface ConfirmDeleteModalProps {
  visible: boolean
  selectedItemsToDelete: StorageItem[]
  onSelectCancel: () => void
  onSelectDelete: () => void
}

const rowTypes: Record<STORAGE_ROW_TYPES, string> = {
  FILE: '文件',
  FOLDER: '文件夹',
  BUCKET: '存储桶',
}

const ConfirmDeleteModal = ({
  visible = false,
  selectedItemsToDelete = [],
  onSelectCancel = noop,
  onSelectDelete = noop,
}: ConfirmDeleteModalProps) => {
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setDeleting(false)
  }, [visible])

  const multipleFiles = selectedItemsToDelete.length > 1

  const title = multipleFiles
    ? `确认删除 ${selectedItemsToDelete.length} 个文件`
    : selectedItemsToDelete.length === 1
      ? `确认删除 ${selectedItemsToDelete[0].name}`
      : ``

  const description = multipleFiles
    ? `确认删除选中的 ${selectedItemsToDelete.length} 个文件吗？`
    : selectedItemsToDelete.length === 1
      ? `确认删除选中的${rowTypes[selectedItemsToDelete[0].type]}吗？`
      : ``

  const onConfirmDelete = () => {
    setDeleting(true)
    onSelectDelete()
  }

  return (
    <Modal
      visible={visible}
      header={<span className="break-words">{title}</span>}
      size="medium"
      onCancel={onSelectCancel}
      customFooter={
        <div className="flex items-center gap-2">
          <Button type="default" disabled={deleting} onClick={onSelectCancel}>
            取消
          </Button>
          <Button type="danger" disabled={deleting} loading={deleting} onClick={onConfirmDelete}>
            {deleting ? '正在删除' : '删除'}
          </Button>
        </div>
      }
    >
      <Modal.Content>
        <Alert withIcon variant="danger" title={`本操作不能被撤销。`}>
          {description}
        </Alert>
      </Modal.Content>
    </Modal>
  )
}

export default ConfirmDeleteModal
