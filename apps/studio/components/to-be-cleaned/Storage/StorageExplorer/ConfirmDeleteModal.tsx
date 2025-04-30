import { noop } from 'lodash'
import { useEffect, useState } from 'react'

import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
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

export const ConfirmDeleteModal = ({
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
    <ConfirmationModal
      visible={visible}
      title={<span className="break-words">{title}</span>}
      size="medium"
      onCancel={onSelectCancel}
      onConfirm={onConfirmDelete}
      variant="destructive"
      alert={{
        base: { variant: 'destructive' },
        title: '此操作不可撤回',
        description,
      }}
    />
  )
}

export default ConfirmDeleteModal
