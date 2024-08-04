import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Copy, Download, Edit, ExternalLink, Lock, Move, Plus, Share, Trash } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { IS_PLATFORM } from 'common'
import { useParams } from 'common/hooks/useParams'
import { getSQLSnippetFolders } from 'data/content/sql-folders-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useProfile } from 'lib/profile'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuSeparator_Shadcn_,
  ContextMenuTrigger_Shadcn_,
  ContextMenu_Shadcn_,
  TreeViewItem,
} from 'ui'

interface SQLEditorTreeViewItemProps {
  element: any
  level: number
  isBranch: boolean
  isSelected: boolean
  isExpanded: boolean
  isMultiSelected?: boolean
  status?: 'editing' | 'saving' | 'idle'
  getNodeProps: () => any
  onSelectCreate?: () => void
  onSelectDelete?: () => void
  onSelectRename?: () => void
  onSelectMove?: () => void
  onSelectShare?: () => void
  onSelectUnshare?: () => void
  onSelectDownload?: () => void
  onSelectCopyPersonal?: () => void
  onSelectDeleteFolder?: () => void
  onEditSave?: (name: string) => void
  onMultiSelect?: (id: string) => void
}

export const SQLEditorTreeViewItem = ({
  element,
  isBranch,
  isExpanded,
  level,
  status,
  isSelected,
  isMultiSelected,
  getNodeProps,
  onSelectCreate,
  onSelectDelete,
  onSelectRename,
  onSelectMove,
  onSelectShare,
  onSelectUnshare,
  onSelectDownload,
  onSelectCopyPersonal,
  onEditSave,
  onMultiSelect,
}: SQLEditorTreeViewItemProps) => {
  const router = useRouter()
  const { id, ref } = useParams()
  const { profile } = useProfile()
  const { className, onClick } = getNodeProps()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const [isFetching, setIsFetching] = useState(false)

  const isOwner = profile?.id === element?.metadata.owner_id
  const isSharedSnippet = element.metadata.visibility === 'project'

  const isEditing = status === 'editing'
  const isSaving = status === 'saving'

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  // [Joshen] Folder contents are loaded on demand too
  const onOpenFolder = async (id: string) => {
    if (!ref) return console.error('未找到项目号')

    try {
      setIsFetching(true)
      const { contents } = await getSQLSnippetFolders({ projectRef: ref, folderId: id })
      contents?.forEach((snippet) => {
        snapV2.addSnippet({ projectRef: ref, snippet })
      })
    } catch (error: any) {
      toast.error(`获取文件夹内容失败：${error.message}`)
    } finally {
      setIsFetching(false)
    }
  }

  return (
    <>
      <ContextMenu_Shadcn_ modal={false}>
        <ContextMenuTrigger_Shadcn_ asChild>
          <TreeViewItem
            level={level}
            xPadding={16}
            name={element.name}
            className={className}
            isExpanded={isExpanded}
            isBranch={isBranch}
            isSelected={isSelected || id === element.id}
            isEditing={isEditing}
            isLoading={isFetching || isSaving}
            onEditSubmit={(value) => {
              if (onEditSave !== undefined) onEditSave(value)
            }}
            onClick={(e) => {
              if (!isBranch) {
                if (!e.shiftKey) {
                  router.push(`/project/${ref}/sql/${element.id}`)
                } else if (id !== 'new') {
                  onMultiSelect?.(element.id)
                } else {
                  router.push(`/project/${ref}/sql/${element.id}`)
                }
              } else {
                onClick(e)
                if (!isExpanded) onOpenFolder(element.id)
              }
            }}
          />
        </ContextMenuTrigger_Shadcn_>
        <ContextMenuContent_Shadcn_ onCloseAutoFocus={(e) => e.stopPropagation()}>
          {isBranch ? (
            <>
              {onSelectCreate !== undefined && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectCreate()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Plus size={14} />
                  创建新的代码段
                </ContextMenuItem_Shadcn_>
              )}
              {onSelectRename !== undefined && isOwner && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectRename()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Edit size={14} />
                  重命名文件夹
                </ContextMenuItem_Shadcn_>
              )}
              {onSelectDelete !== undefined && isOwner && (
                <>
                  <ContextMenuSeparator_Shadcn_ />
                  <ContextMenuItem_Shadcn_
                    className="gap-x-2"
                    onSelect={() => onSelectDelete()}
                    onFocusCapture={(e) => e.stopPropagation()}
                  >
                    <Trash size={14} />
                    删除文件夹
                  </ContextMenuItem_Shadcn_>
                </>
              )}
            </>
          ) : isMultiSelected ? (
            <>
              {onSelectMove !== undefined && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectMove()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Move size={14} />
                  移动选中的查询
                </ContextMenuItem_Shadcn_>
              )}
              <ContextMenuSeparator_Shadcn_ />
              {onSelectDelete !== undefined && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectDelete()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Trash size={14} />
                  删除选中的查询
                </ContextMenuItem_Shadcn_>
              )}
            </>
          ) : (
            <>
              <ContextMenuItem_Shadcn_
                asChild
                className="gap-x-2"
                onSelect={() => {}}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Link href={`/project/${ref}/sql/${element.id}`} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} />
                  在新标签页中打开
                </Link>
              </ContextMenuItem_Shadcn_>
              <ContextMenuSeparator_Shadcn_ />
              {onSelectRename !== undefined && isOwner && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectRename()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Edit size={14} />
                  重命名查询
                </ContextMenuItem_Shadcn_>
              )}
              {onSelectMove !== undefined && isOwner && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectMove()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Move size={14} />
                  移动查询
                </ContextMenuItem_Shadcn_>
              )}
              {onSelectShare !== undefined && !isSharedSnippet && canCreateSQLSnippet && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectShare()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Share size={14} />
                  分享查询给团队
                </ContextMenuItem_Shadcn_>
              )}
              {onSelectUnshare !== undefined && isSharedSnippet && isOwner && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectUnshare()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Lock size={14} />
                  取消分享查询给团队
                </ContextMenuItem_Shadcn_>
              )}
              {onSelectCopyPersonal !== undefined &&
                isSharedSnippet &&
                !isOwner &&
                canCreateSQLSnippet && (
                  <ContextMenuItem_Shadcn_
                    className="gap-x-2"
                    onSelect={() => onSelectCopyPersonal()}
                    onFocusCapture={(e) => e.stopPropagation()}
                  >
                    <Copy size={14} />
                    复制个人副本
                  </ContextMenuItem_Shadcn_>
                )}
              {onSelectDownload !== undefined && IS_PLATFORM && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectDownload()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Download size={14} />
                  下载为迁移文件
                </ContextMenuItem_Shadcn_>
              )}
              {onSelectDelete !== undefined && isOwner && (
                <>
                  <ContextMenuSeparator_Shadcn_ />
                  <ContextMenuItem_Shadcn_ className="gap-x-2" onSelect={() => onSelectDelete()}>
                    <Trash size={14} />
                    删除查询
                  </ContextMenuItem_Shadcn_>
                </>
              )}
            </>
          )}
        </ContextMenuContent_Shadcn_>
      </ContextMenu_Shadcn_>
    </>
  )
}
