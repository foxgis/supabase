import { ChevronRight, Eye, EyeOffIcon, Heart, Unlock } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import DownloadSnippetModal from 'components/interfaces/SQLEditor/DownloadSnippetModal'
import { MoveQueryModal } from 'components/interfaces/SQLEditor/MoveQueryModal'
import RenameQueryModal from 'components/interfaces/SQLEditor/RenameQueryModal'
import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { getContentById } from 'data/content/content-id-query'
import { useSQLSnippetFoldersDeleteMutation } from 'data/content/sql-folders-delete-mutation'
import {
  getSQLSnippetFolders,
  Snippet,
  SnippetDetail,
  SnippetFolder,
  useSQLSnippetFoldersQuery,
} from 'data/content/sql-folders-query'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useProfile } from 'lib/profile'
import uuidv4 from 'lib/uuid'
import {
  useFavoriteSnippets,
  useSnippetFolders,
  useSnippets,
  useSqlEditorV2StateSnapshot,
} from 'state/sql-editor-v2'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  Separator,
  TreeView,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { ROOT_NODE, formatFolderResponseForTreeView } from './SQLEditorNav.utils'
import { SQLEditorTreeViewItem } from './SQLEditorTreeViewItem'
import { untitledSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { useSqlSnippetsQuery } from 'data/content/sql-snippets-query'
import { useContentCountQuery } from 'data/content/content-count-query'

interface SQLEditorNavProps {
  searchText: string
}

export const SQLEditorNav = ({ searchText: _searchText }: SQLEditorNavProps) => {
  const searchText = _searchText.trim()
  const router = useRouter()
  const { profile } = useProfile()
  const project = useSelectedProject()
  const { ref: projectRef, id } = useParams()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const [sort] = useLocalStorage<'name' | 'inserted_at'>('sql-editor-sort', 'inserted_at')

  const [mountedId, setMountedId] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showFavouriteSnippets, setShowFavouriteSnippets] = useState(false)
  const [showSharedSnippets, setShowSharedSnippets] = useState(false)
  const [showPrivateSnippets, setShowPrivateSnippets] = useState(true)

  const [defaultExpandedFolderIds, setDefaultExpandedFolderIds] = useState<string[]>()
  const [selectedSnippets, setSelectedSnippets] = useState<Snippet[]>([])
  const [selectedSnippetToShare, setSelectedSnippetToShare] = useState<Snippet>()
  const [selectedSnippetToUnshare, setSelectedSnippetToUnshare] = useState<Snippet>()
  const [selectedSnippetToRename, setSelectedSnippetToRename] = useState<Snippet>()
  const [selectedSnippetToDownload, setSelectedSnippetToDownload] = useState<Snippet>()
  const [selectedFolderToDelete, setSelectedFolderToDelete] = useState<SnippetFolder>()

  const COLLAPSIBLE_TRIGGER_CLASS_NAMES =
    'flex items-center gap-x-2 px-4 [&[data-state=open]>svg]:!rotate-90'
  const COLLAPSIBLE_ICON_CLASS_NAMES = 'text-foreground-light transition-transform duration-200'
  const COLLASIBLE_HEADER_CLASS_NAMES = 'text-foreground-light font-mono text-sm uppercase'

  // =======================================================
  // [Joshen] Set up favorites, shared, and private snippets
  // =======================================================
  const snippets = useSnippets(projectRef as string)
  const folders = useSnippetFolders(projectRef as string)
  const contents = snippets.filter((x) =>
    searchText.length > 0 ? x.name.toLowerCase().includes(searchText.toLowerCase()) : true
  )
  const snippet = snapV2.snippets[id as string]?.snippet

  const privateSnippets = contents.filter((snippet) => snippet.visibility === 'user')
  const numPrivateSnippets = snapV2.privateSnippetCount[projectRef as string]
  const privateSnippetsTreeState =
    folders.length === 0 && snippets.length === 0
      ? [ROOT_NODE]
      : formatFolderResponseForTreeView({ folders, contents: privateSnippets })

  const favoriteSnippets = useFavoriteSnippets(projectRef as string)
  const numFavoriteSnippets = favoriteSnippets.length
  const favoritesTreeState =
    numFavoriteSnippets === 0
      ? [ROOT_NODE]
      : formatFolderResponseForTreeView({ contents: favoriteSnippets as any })

  const projectSnippets = contents.filter((snippet) => snippet.visibility === 'project')
  const numProjectSnippets = projectSnippets.length
  const projectSnippetsTreeState =
    numProjectSnippets === 0
      ? [ROOT_NODE]
      : formatFolderResponseForTreeView({ contents: projectSnippets })

  // =================================
  // [Joshen] React Queries
  // =================================

  useSQLSnippetFoldersQuery(
    { projectRef },
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        if (projectRef !== undefined) {
          snapV2.initializeRemoteSnippets({ projectRef, data, sort })
        }
      },
    }
  )

  useSqlSnippetsQuery(projectRef, {
    onSuccess(data) {
      if (projectRef !== undefined) {
        const favoriteSnippets = data.snippets.filter((snippet) => snippet.content.favorite)
        snapV2.initializeFavoriteSnippets({ projectRef, snippets: favoriteSnippets })
      }
    },
  })

  useContentCountQuery(
    { projectRef, type: 'sql' },
    {
      onSuccess(data) {
        if (projectRef !== undefined) {
          snapV2.setPrivateSnippetCount({ projectRef, value: data.count })
        }
      },
    }
  )

  const { mutate: deleteContent, isLoading: isDeleting } = useContentDeleteMutation({
    onError: (error, data) => {
      if (error.message.includes('未找到内容')) {
        postDeleteCleanup(data.ids)
      } else {
        toast.error(`删除查询失败：${error.message}`)
      }
    },
  })

  const { mutate: deleteFolder, isLoading: isDeletingFolder } = useSQLSnippetFoldersDeleteMutation({
    onSuccess: (_, vars) => {
      toast.success('成功删除了文件夹')
      const { ids } = vars
      snapV2.removeFolder(ids[0])
      setSelectedFolderToDelete(undefined)
    },
  })

  // =================================
  // [Joshen] UI functions
  // =================================

  const postDeleteCleanup = (ids: string[]) => {
    setShowDeleteModal(false)
    setSelectedSnippets([])
    const existingSnippetIds = Object.keys(snapV2.snippets).filter((x) => !ids.includes(x))

    if (existingSnippetIds.length === 0) {
      router.push(`/project/${projectRef}/sql/new`)
    } else if (ids.includes(id as string)) {
      router.push(`/project/${projectRef}/sql/${existingSnippetIds[0]}`)
    }

    if (ids.length > 0) ids.forEach((id) => snapV2.removeSnippet(id))
  }

  const onConfirmDelete = () => {
    if (!projectRef) return console.error('未找到项目号')
    deleteContent(
      { projectRef, ids: selectedSnippets.map((x) => x.id) },
      {
        onSuccess: (data) => {
          toast.success(
            `成功删除了 ${selectedSnippets.length.toLocaleString()} 条查询${selectedSnippets.length > 1 ? '' : ''}`
          )
          postDeleteCleanup(data)
        },
      }
    )
  }

  const onConfirmShare = () => {
    if (!selectedSnippetToShare) return console.error('未找到代码段 ID')
    snapV2.shareSnippet(selectedSnippetToShare.id, 'project')
    setSelectedSnippetToShare(undefined)
    setShowSharedSnippets(true)

    if (projectRef !== undefined) {
      snapV2.setPrivateSnippetCount({
        projectRef,
        value: snapV2.privateSnippetCount[projectRef] - 1,
      })
    }
  }

  const onConfirmUnshare = () => {
    if (!selectedSnippetToUnshare) return console.error('未找到代码段 ID')
    snapV2.shareSnippet(selectedSnippetToUnshare.id, 'user')
    setSelectedSnippetToUnshare(undefined)
    setShowPrivateSnippets(true)

    if (projectRef !== undefined) {
      snapV2.setPrivateSnippetCount({
        projectRef,
        value: snapV2.privateSnippetCount[projectRef] + 1,
      })
    }
  }

  const onSelectCopyPersonal = async (snippet: Snippet) => {
    if (!profile) return console.error('未找到用户资料')
    if (!project) return console.error('未找到项目')
    if (!projectRef) return console.error('未找到项目号')
    if (!id) return console.error('未找到代码段 ID')

    let sql: string = ''
    if (!('content' in snippet)) {
      // Fetch the content first
      const { content } = await getContentById({ projectRef, id: snippet.id })
      sql = content.sql
    } else {
      sql = (snippet as SnippetDetail).content.sql
    }

    const snippetCopy = createSqlSnippetSkeletonV2({
      id: uuidv4(),
      name: snippet.name,
      sql,
      owner_id: profile?.id,
      project_id: project?.id,
    })

    snapV2.addSnippet({ projectRef, snippet: snippetCopy })
    snapV2.addNeedsSaving(snippetCopy.id!)
    router.push(`/project/${projectRef}/sql/${snippetCopy.id}`)
  }

  const onConfirmDeleteFolder = async () => {
    if (!projectRef) return console.error('未找到项目号')
    if (selectedFolderToDelete === undefined) return console.error('未选中文件夹')

    const folderSnippets = contents.filter(
      (content) => content.folder_id === selectedFolderToDelete.id
    )
    if (folderSnippets.length > 0) {
      const ids = folderSnippets.map((x) => x.id)
      deleteContent(
        { projectRef, ids },
        {
          onSuccess: () => {
            ids.forEach((id) => snapV2.removeSnippet(id))
            postDeleteCleanup(ids)
            deleteFolder({ projectRef, ids: [selectedFolderToDelete?.id] })
          },
        }
      )
    } else {
      deleteFolder({ projectRef, ids: [selectedFolderToDelete?.id] })
    }
  }

  // [Joshen] Just FYI doing a controlled state instead of letting the TreeView component doing it because
  // 1. There seems to be no way of accessing the internal state of the TreeView to retrieve the selected nodes
  // 2. The component itself doesn't handle UUID for node IDs well - trying to multi select doesn't select the expected nodes
  // We're only supporting shift clicks (not cmd/control click) - this is even with the react tree view component itself
  const onMultiSelect = (selectedId: string) => {
    // The base is always the current query thats selected
    const contentIds = contents.map((x) => x.id)
    const baseIndex = contentIds.indexOf(id as string)
    const targetIndex = contentIds.indexOf(selectedId)

    const floor = Math.min(baseIndex, targetIndex)
    const ceiling = Math.max(baseIndex, targetIndex)

    const _selectedSnippets = []
    const sameFolder = contents[floor].folder_id === contents[ceiling].folder_id

    for (let i = floor; i <= ceiling; i++) {
      if (sameFolder) {
        if (contents[i].folder_id === contents[floor].folder_id) _selectedSnippets.push(contents[i])
      } else {
        // [Joshen] Temp don't allow selecting across folders for now
        // _selectedSnippets.push(contents[i])
      }
    }

    setSelectedSnippets(_selectedSnippets)
  }

  // ======================================
  // [Joshen] useEffects kept at the bottom
  // ======================================

  useEffect(() => {
    const loadFolderContents = async (folderId: string) => {
      const { contents } = await getSQLSnippetFolders({ projectRef, folderId })
      if (projectRef) {
        contents?.forEach((snippet) => snapV2.addSnippet({ projectRef, snippet }))
      }
    }

    if (snippet !== undefined && !mountedId) {
      if (snippet.visibility === 'project') setShowSharedSnippets(true)
      if (snippet.folder_id) {
        setDefaultExpandedFolderIds([snippet.folder_id])
        loadFolderContents(snippet.folder_id)
      }

      // Only want to run this once when loading sql/[id] route
      setMountedId(true)
    }
  }, [snippet, mountedId])

  useEffect(() => {
    // Unselect all snippets whenever opening another snippet
    setSelectedSnippets([])
  }, [id])

  return (
    <>
      <Separator />

      {((numFavoriteSnippets === 0 && searchText.length === 0) || numFavoriteSnippets > 0) && (
        <>
          <Collapsible_Shadcn_ open={showFavouriteSnippets} onOpenChange={setShowFavouriteSnippets}>
            <CollapsibleTrigger_Shadcn_ className={COLLAPSIBLE_TRIGGER_CLASS_NAMES}>
              <ChevronRight size={16} className={COLLAPSIBLE_ICON_CLASS_NAMES} />
              <span className={COLLASIBLE_HEADER_CLASS_NAMES}>
                收藏的查询{numFavoriteSnippets > 0 && `（${numFavoriteSnippets} 条）`}
              </span>
            </CollapsibleTrigger_Shadcn_>
            <CollapsibleContent_Shadcn_ className="pt-2">
              {numFavoriteSnippets === 0 ? (
                <div className="mx-4">
                  <Alert_Shadcn_ className="p-3">
                    <AlertTitle_Shadcn_ className="text-xs">没有收藏的查询</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_ className="text-xs ">
                      保存查询到收藏夹，方便日后快速访问。点击{' '}
                      <Heart size={12} className="inline-block relative align-center -top-[1px]" />{' '}
                      图标。
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                </div>
              ) : (
                <TreeView
                  data={favoritesTreeState}
                  aria-label="favorite-snippets"
                  nodeRenderer={({ element, ...props }) => (
                    <SQLEditorTreeViewItem
                      {...props}
                      element={element}
                      onSelectDelete={() => {
                        setShowDeleteModal(true)
                        setSelectedSnippets([element.metadata as unknown as Snippet])
                      }}
                      onSelectRename={() => {
                        setShowRenameModal(true)
                        setSelectedSnippetToRename(element.metadata as Snippet)
                      }}
                      onSelectDownload={() => {
                        setSelectedSnippetToDownload(element.metadata as Snippet)
                      }}
                      onSelectCopyPersonal={() => {
                        onSelectCopyPersonal(element.metadata as Snippet)
                      }}
                      onSelectUnshare={() => {
                        setSelectedSnippetToUnshare(element.metadata as Snippet)
                      }}
                    />
                  )}
                />
              )}
            </CollapsibleContent_Shadcn_>
          </Collapsible_Shadcn_>
          <Separator />
        </>
      )}

      {((numProjectSnippets === 0 && searchText.length === 0) || numProjectSnippets > 0) && (
        <>
          <Collapsible_Shadcn_ open={showSharedSnippets} onOpenChange={setShowSharedSnippets}>
            <CollapsibleTrigger_Shadcn_ className={COLLAPSIBLE_TRIGGER_CLASS_NAMES}>
              <ChevronRight size={16} className={COLLAPSIBLE_ICON_CLASS_NAMES} />
              <span className={COLLASIBLE_HEADER_CLASS_NAMES}>
                分享的查询{numProjectSnippets > 0 && `（${numProjectSnippets} 条）`}
              </span>
            </CollapsibleTrigger_Shadcn_>
            <CollapsibleContent_Shadcn_ className="pt-2">
              {numProjectSnippets === 0 ? (
                <div className="mx-4">
                  <Alert_Shadcn_ className="p-3">
                    <AlertTitle_Shadcn_ className="text-xs">没有分享的查询</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_ className="text-xs ">
                      分享查询到团队，右键点击该查询即可。
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                </div>
              ) : (
                <TreeView
                  data={projectSnippetsTreeState}
                  aria-label="project-level-snippets"
                  nodeRenderer={({ element, ...props }) => (
                    <SQLEditorTreeViewItem
                      {...props}
                      element={element}
                      onSelectDelete={() => {
                        setShowDeleteModal(true)
                        setSelectedSnippets([element.metadata as unknown as Snippet])
                      }}
                      onSelectRename={() => {
                        setShowRenameModal(true)
                        setSelectedSnippetToRename(element.metadata as Snippet)
                      }}
                      onSelectDownload={() => {
                        setSelectedSnippetToDownload(element.metadata as Snippet)
                      }}
                      onSelectCopyPersonal={() => {
                        onSelectCopyPersonal(element.metadata as Snippet)
                      }}
                      onSelectUnshare={() => {
                        setSelectedSnippetToUnshare(element.metadata as Snippet)
                      }}
                    />
                  )}
                />
              )}
            </CollapsibleContent_Shadcn_>
          </Collapsible_Shadcn_>
          <Separator />
        </>
      )}

      <Collapsible_Shadcn_ open={showPrivateSnippets} onOpenChange={setShowPrivateSnippets}>
        <CollapsibleTrigger_Shadcn_ className={COLLAPSIBLE_TRIGGER_CLASS_NAMES}>
          <ChevronRight size={16} className={COLLAPSIBLE_ICON_CLASS_NAMES} />
          <span className={COLLASIBLE_HEADER_CLASS_NAMES}>
            个人的查询
            {numPrivateSnippets > 0 && `（${numPrivateSnippets}条）`}
          </span>
        </CollapsibleTrigger_Shadcn_>
        <CollapsibleContent_Shadcn_ className="pt-2">
          {!snapV2.loaded[projectRef as string] ? (
            <div className="px-4">
              <GenericSkeletonLoader />
            </div>
          ) : folders.length === 0 && numPrivateSnippets === 0 ? (
            <div className="mx-4">
              <Alert_Shadcn_ className="p-3">
                <AlertTitle_Shadcn_ className="text-xs">没有创建查询</AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_ className="text-xs">
                  当你在编辑器中开始编写查询时，查询会自动保存。
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            </div>
          ) : (
            <TreeView
              multiSelect
              togglableSelect
              clickAction="EXCLUSIVE_SELECT"
              data={privateSnippetsTreeState}
              selectedIds={selectedSnippets.map((x) => x.id)}
              aria-label="private-snippets"
              expandedIds={defaultExpandedFolderIds}
              nodeRenderer={({ element, ...props }) => (
                <SQLEditorTreeViewItem
                  {...props}
                  element={element}
                  isMultiSelected={selectedSnippets.length > 1}
                  status={props.isBranch ? snapV2.folders[element.id].status : 'idle'}
                  onMultiSelect={onMultiSelect}
                  onSelectCreate={() => {
                    if (profile && project) {
                      const snippet = createSqlSnippetSkeletonV2({
                        id: uuidv4(),
                        name: untitledSnippetTitle,
                        owner_id: profile?.id,
                        project_id: project?.id,
                        folder_id: element.id as string,
                        sql: '',
                      })
                      snapV2.addSnippet({ projectRef: project.ref, snippet })
                      router.push(`/project/${projectRef}/sql/${snippet.id}`)
                    }
                  }}
                  onSelectDelete={() => {
                    if (props.isBranch) {
                      setSelectedFolderToDelete(element.metadata as SnippetFolder)
                    } else {
                      setShowDeleteModal(true)
                      if (selectedSnippets.length === 0) {
                        setSelectedSnippets([element.metadata as unknown as Snippet])
                      }
                    }
                  }}
                  onSelectRename={() => {
                    if (props.isBranch) {
                      snapV2.editFolder(element.id as string)
                    } else {
                      setShowRenameModal(true)
                      setSelectedSnippetToRename(element.metadata as Snippet)
                    }
                  }}
                  onSelectMove={() => {
                    setShowMoveModal(true)
                    if (selectedSnippets.length === 0) {
                      setSelectedSnippets([element.metadata as Snippet])
                    }
                  }}
                  onSelectDownload={() => setSelectedSnippetToDownload(element.metadata as Snippet)}
                  onSelectShare={() => setSelectedSnippetToShare(element.metadata as Snippet)}
                  onEditSave={(name: string) => {
                    // [Joshen] Inline editing only for folders for now
                    if (name.length === 0) snapV2.removeFolder(element.id as string)
                    else snapV2.saveFolder({ id: element.id as string, name })
                  }}
                />
              )}
            />
          )}
        </CollapsibleContent_Shadcn_>
      </Collapsible_Shadcn_>

      <Separator />

      <RenameQueryModal
        snippet={selectedSnippetToRename}
        visible={showRenameModal}
        onCancel={() => setShowRenameModal(false)}
        onComplete={() => setShowRenameModal(false)}
      />

      <MoveQueryModal
        snippets={selectedSnippets}
        visible={showMoveModal}
        onClose={() => {
          setShowMoveModal(false)
          setSelectedSnippets([])
        }}
      />

      <DownloadSnippetModal
        id={selectedSnippetToDownload?.id ?? ''}
        visible={selectedSnippetToDownload !== undefined}
        onCancel={() => setSelectedSnippetToDownload(undefined)}
      />

      <ConfirmationModal
        size="medium"
        title={`确认分享查询：${selectedSnippetToShare?.name}`}
        confirmLabel="分享查询"
        confirmLabelLoading="正在分享查询"
        visible={selectedSnippetToShare !== undefined}
        onCancel={() => setSelectedSnippetToShare(undefined)}
        onConfirm={onConfirmShare}
        alert={{
          title: '此 SQL 查询将会对所有团队成员公开',
          description: '任何可访问本项目的人都可以查看它',
        }}
      >
        <ul className="text-sm text-foreground-light space-y-5">
          <li className="flex gap-3">
            <Eye />
            <span>项目成员将具有此查询的只读访问权限。</span>
          </li>
          <li className="flex gap-3">
            <Unlock />
            <span>任何人都可以将它复制到他们的个人代码段收藏中。</span>
          </li>
        </ul>
      </ConfirmationModal>

      <ConfirmationModal
        size="medium"
        title={`确认取消分享：${selectedSnippetToUnshare?.name}`}
        confirmLabel="取消分享查询"
        confirmLabelLoading="正在取消分享查询"
        visible={selectedSnippetToUnshare !== undefined}
        onCancel={() => setSelectedSnippetToUnshare(undefined)}
        onConfirm={onConfirmUnshare}
        alert={{
          title: '此 SQL 查询不再对所有团队成员公开',
          description: '只有你才有访问此查询的权限',
        }}
      >
        <ul className="text-sm text-foreground-light space-y-5">
          <li className="flex gap-3">
            <EyeOffIcon />
            <span>项目成员将不再能够查看此查询。</span>
          </li>
        </ul>
      </ConfirmationModal>

      <ConfirmationModal
        size="small"
        title={`确认删除${selectedSnippets.length === 1 ? '查询' : ` ${selectedSnippets.length.toLocaleString()} 条查询${selectedSnippets.length > 1 ? '' : ''}`}`}
        confirmLabel={`删除 ${selectedSnippets.length.toLocaleString()} 条查询${selectedSnippets.length > 1 ? '' : ''}`}
        confirmLabelLoading="正在删除查询"
        loading={isDeleting}
        visible={showDeleteModal}
        variant="destructive"
        onCancel={() => {
          setShowDeleteModal(false)
          setSelectedSnippets([])
        }}
        onConfirm={onConfirmDelete}
        alert={
          (selectedSnippets[0]?.visibility as unknown as string) === 'project'
            ? {
                title: '此 SQL 代码段将永远丢失',
                description:
                  '删除此查询也将从项目团队的所有成员中移除。',
              }
            : undefined
        }
      >
        <p className="text-sm">
          此操作无法撤销。{' '}
          {selectedSnippets.length === 1
            ? `您确定想要删除 '${selectedSnippets[0]?.name}' 吗？`
            : `您确定想要删除选中的 ${selectedSnippets.length} 条查询吗？`}
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        size="small"
        title="确认删除文件夹"
        confirmLabel="删除文件夹"
        confirmLabelLoading="正在删除文件夹"
        loading={isDeletingFolder}
        visible={selectedFolderToDelete !== undefined}
        variant="destructive"
        onCancel={() => setSelectedFolderToDelete(undefined)}
        onConfirm={onConfirmDeleteFolder}
        alert={{
          title: '此操作无法撤销',
          description:
            '此文件夹中的所有 SQL 代码段也讲会被久删除，无法恢复。',
        }}
      >
        <p className="text-sm">
          您确定要删除文件夹 '{selectedFolderToDelete?.name}' 吗？
        </p>
      </ConfirmationModal>
    </>
  )
}
