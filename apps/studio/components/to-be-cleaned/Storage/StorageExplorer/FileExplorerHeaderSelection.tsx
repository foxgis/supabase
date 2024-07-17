import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { Button, IconDownload, IconTrash2, IconMove, IconX } from 'ui'

const FileExplorerHeaderSelection = () => {
  const storageExplorerStore = useStorageStore()
  const {
    selectedItems,
    downloadFile,
    downloadSelectedFiles,
    clearSelectedItems,
    setSelectedItemsToDelete,
    setSelectedItemsToMove,
  } = storageExplorerStore

  return (
    <div className="z-10 flex h-[40px] items-center rounded-t-md bg-brand-400 px-2 py-1 shadow [[data-theme*=dark]_&]:bg-brand-500">
      <Button
        icon={<IconX size={16} strokeWidth={2} />}
        type="text"
        onClick={() => clearSelectedItems()}
      />
      <div className="ml-1 flex items-center space-x-3">
        <p className="mb-0 text-sm text-foreground">
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>选中了 {selectedItems.length}</span> 个文件
        </p>
        <Button
          icon={<IconDownload size={16} strokeWidth={2} />}
          type="primary"
          onClick={async () => {
            if (selectedItems.length === 1) {
              await downloadFile(selectedItems[0])
            } else {
              await downloadSelectedFiles(selectedItems)
            }
          }}
        >
          下载
        </Button>
        <div className="border-r border-green-900 py-3 opacity-50" />
        <Button
          icon={<IconTrash2 size={16} strokeWidth={2} />}
          type="primary"
          onClick={() => setSelectedItemsToDelete(selectedItems)}
        >
          删除
        </Button>
        <Button
          icon={<IconMove size={16} strokeWidth={2} />}
          type="primary"
          onClick={() => setSelectedItemsToMove(selectedItems)}
        >
          移动
        </Button>
      </div>
    </div>
  )
}

export default FileExplorerHeaderSelection
