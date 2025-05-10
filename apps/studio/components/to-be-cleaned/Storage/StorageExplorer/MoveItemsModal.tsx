import { noop } from 'lodash'
import { useEffect, useState } from 'react'

import { Button, Input, Modal } from 'ui'
import { StorageItemWithColumn } from '../Storage.types'

interface MoveItemsModalProps {
  bucketName: string
  visible: boolean
  selectedItemsToMove: StorageItemWithColumn[]
  onSelectCancel: () => void
  onSelectMove: (path: string) => void
}

const MoveItemsModal = ({
  bucketName = '',
  visible = false,
  selectedItemsToMove = [],
  onSelectCancel = noop,
  onSelectMove = noop,
}: MoveItemsModalProps) => {
  const [moving, setMoving] = useState(false)
  const [newPath, setNewPath] = useState('')

  useEffect(() => {
    setMoving(false)
    setNewPath('')
  }, [visible])

  const multipleFiles = selectedItemsToMove.length > 1

  const title = multipleFiles
    ? `正在移动 ${bucketName} 中的 ${selectedItemsToMove.length} 个文件`
    : selectedItemsToMove.length === 1
      ? `正在移动 ${bucketName} 中的 ${selectedItemsToMove[0]?.name}`
      : ``

  const description = `请输入您想要将文件移动到的位置${
    multipleFiles ? '' : ''
  }。`

  const onConfirmMove = (event: any) => {
    if (event) {
      event.preventDefault()
    }
    setMoving(true)
    const formattedPath = newPath[0] === '/' ? newPath.slice(1) : newPath
    onSelectMove(formattedPath)
  }

  return (
    <Modal
      visible={visible}
      header={title}
      description={description}
      size="medium"
      onCancel={onSelectCancel}
      customFooter={
        <div className="flex items-center gap-2">
          <Button type="default" onClick={onSelectCancel}>
            取消
          </Button>
          <Button type="primary" loading={moving} onClick={onConfirmMove}>
            {moving ? '正在移动文件' : '移动文件'}
          </Button>
        </div>
      }
    >
      <Modal.Content>
        <form>
          <div className="relative flex items-center">
            <Input
              autoFocus
              label={`在 ${bucketName} 中新目录的位置`}
              type="text"
              className="w-full"
              placeholder="e.g folder1/subfolder2"
              value={newPath}
              descriptionText="留空会将文件移动到存储桶的根目录下"
              onChange={(event) => setNewPath(event.target.value)}
            />
          </div>

          <button className="hidden" type="submit" onClick={onConfirmMove} />
        </form>
      </Modal.Content>
    </Modal>
  )
}

export default MoveItemsModal
