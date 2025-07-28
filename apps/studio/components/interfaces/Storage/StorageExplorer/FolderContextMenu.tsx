import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Clipboard, Download, Edit, Trash2 } from 'lucide-react'
import { Item, Menu, Separator } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css'

import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { copyPathToFolder } from './StorageExplorer.utils'

interface FolderContextMenuProps {
  id: string
}

const FolderContextMenu = ({ id = '' }: FolderContextMenuProps) => {
  const { openedFolders, downloadFolder, setSelectedItemToRename, setSelectedItemsToDelete } =
    useStorageExplorerStateSnapshot()
  const canUpdateFiles = useCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  return (
    <Menu id={id} animation="fade">
      {canUpdateFiles && (
        <Item onClick={({ props }) => setSelectedItemToRename(props.item)}>
          <Edit size="14" strokeWidth={1} />
          <span className="ml-2 text-xs">重命名</span>
        </Item>
      )}
      <Item onClick={({ props }) => downloadFolder(props.item)}>
        <Download size="14" strokeWidth={1} />
        <span className="ml-2 text-xs">下载</span>
      </Item>
      <Item onClick={({ props }) => copyPathToFolder(openedFolders, props.item)}>
        <Clipboard size="14" strokeWidth={1} />
        <span className="ml-2 text-xs">复制路径到文件夹</span>
      </Item>
      {canUpdateFiles && [
        <Separator key="separator" />,
        <Item key="delete" onClick={({ props }) => setSelectedItemsToDelete([props.item])}>
          <Trash2 size="14" strokeWidth={1} stroke="red" />
          <span className="ml-2 text-xs">删除</span>
        </Item>,
      ]}
    </Menu>
  )
}

export default FolderContextMenu
