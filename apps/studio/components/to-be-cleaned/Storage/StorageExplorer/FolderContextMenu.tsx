import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Item, Menu, Separator } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css'

import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { IconClipboard, IconDownload, IconEdit, IconTrash2 } from 'ui'
import { copyPathToFolder } from './StorageExplorer.utils'

interface FolderContextMenuProps {
  id: string
}

const FolderContextMenu = ({ id = '' }: FolderContextMenuProps) => {
  const storageExplorerStore = useStorageStore()
  const { openedFolders, downloadFolder, setSelectedItemToRename, setSelectedItemsToDelete } =
    storageExplorerStore
  const canUpdateFiles = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  return (
    <Menu id={id} animation="fade">
      {canUpdateFiles && (
        <Item onClick={({ props }) => setSelectedItemToRename(props.item)}>
          <IconEdit size="tiny" />
          <span className="ml-2 text-xs">重命名</span>
        </Item>
      )}
      <Item onClick={({ props }) => downloadFolder(props.item)}>
        <IconDownload size="tiny" />
        <span className="ml-2 text-xs">下载</span>
      </Item>
      <Item onClick={({ props }) => copyPathToFolder(openedFolders, props.item)}>
        <IconClipboard size="tiny" />
        <span className="ml-2 text-xs">复制到文件夹</span>
      </Item>
      {canUpdateFiles && [
        <Separator key="separator" />,
        <Item key="delete" onClick={({ props }) => setSelectedItemsToDelete([props.item])}>
          <IconTrash2 size="tiny" stroke="red" />
          <span className="ml-2 text-xs">删除</span>
        </Item>,
      ]}
    </Menu>
  )
}

export default FolderContextMenu
